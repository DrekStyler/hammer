import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { useFirestoreQuery } from '../hooks/useFirestore';
import { useAuth } from '../contexts/AuthContext';
import { useRole } from '../contexts/RoleContext';
import { Link, useNavigate } from 'react-router-dom';
import ProjectDetail from '../components/ProjectDetail';
import NewProjectForm from '../components/NewProjectForm';
import useTranslation from '../utils/useTranslation';
import { db } from '../firebase/config';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import './Projects.css';

const Projects = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortField, setSortField] = useState('createdAt');
    const [sortDirection, setSortDirection] = useState('desc');
    const [selectedProject, setSelectedProject] = useState(null);
    const [showNewProjectForm, setShowNewProjectForm] = useState(false);
    const [activeProjects, setActiveProjects] = useState([]);
    const [pastProjects, setPastProjects] = useState([]);
    const [milestones, setMilestones] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedProjects, setExpandedProjects] = useState(new Set());

    const { currentUser } = useAuth();
    const { isContractor } = useRole();
    const { t } = useTranslation();
    const navigate = useNavigate();

    // Fetch both created and invited projects
    useEffect(() => {
        const fetchProjects = async () => {
            if (!currentUser) return;

            setIsLoading(true);
            setError(null);

            try {
                // Query for projects created by the user
                const createdProjectsQuery = query(
                    collection(db, 'projects'),
                    where('createdBy', '==', currentUser.uid),
                    orderBy(sortField, sortDirection)
                );

                // Query for projects the user is invited to
                const invitedProjectsQuery = query(
                    collection(db, 'projects'),
                    where('invitedUsers', 'array-contains', currentUser.uid),
                    orderBy(sortField, sortDirection)
                );

                // Execute both queries
                const [createdProjectsSnapshot, invitedProjectsSnapshot] = await Promise.all([
                    getDocs(createdProjectsQuery),
                    getDocs(invitedProjectsQuery)
                ]);

                // Process created projects
                const createdProjects = createdProjectsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    role: 'creator'
                }));

                // Process invited projects
                const invitedProjects = invitedProjectsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    role: 'invited'
                }));

                // Combine and deduplicate projects
                const allProjects = [...createdProjects];
                invitedProjects.forEach(project => {
                    if (!allProjects.some(p => p.id === project.id)) {
                        allProjects.push(project);
                    }
                });

                // Apply filters
                const filtered = allProjects.filter(project => {
                    if (searchTerm.trim() !== '') {
                        const term = searchTerm.toLowerCase();
                        return project.title?.toLowerCase().includes(term) ||
                            project.description?.toLowerCase().includes(term) ||
                            project.location?.toLowerCase().includes(term) ||
                            project.clientName?.toLowerCase().includes(term);
                    }
                    return true;
                });

                // Separate active and past projects
                const nowTimestamp = Timestamp.now();
                const active = filtered.filter(project => {
                    // Consider projects active if they are in progress or don't have an end date
                    return project.status === 'In Progress' ||
                           !project.endDate ||
                           (project.endDate && project.endDate > nowTimestamp);
                });

                const past = filtered.filter(project => {
                    // Consider projects past if they are completed or their end date has passed
                    return project.status === 'Completed' ||
                           (project.endDate && project.endDate <= nowTimestamp);
                });

                setActiveProjects(active);
                setPastProjects(past);

                // Process milestones
                const allMilestones = [];
                filtered.forEach(project => {
                    if (project.milestones && Array.isArray(project.milestones)) {
                        project.milestones.forEach(milestone => {
                            if (milestone.date) {
                                allMilestones.push({
                                    id: `${project.id}-${milestone.id || Math.random().toString(36)}`,
                                    title: `${project.title}: ${milestone.title}`,
                                    date: milestone.date instanceof Timestamp ?
                                        milestone.date.toDate() : new Date(milestone.date),
                                    projectId: project.id,
                                    backgroundColor: getStatusColor(project.status)
                                });
                            }
                        });
                    }

                    // Also add start and end dates as events
                    if (project.startDate) {
                        allMilestones.push({
                            id: `${project.id}-start`,
                            title: `${project.title} Start`,
                            date: project.startDate instanceof Timestamp ?
                                project.startDate.toDate() : new Date(project.startDate),
                            projectId: project.id,
                            backgroundColor: '#4285F4'
                        });
                    }

                    if (project.endDate) {
                        allMilestones.push({
                            id: `${project.id}-end`,
                            title: `${project.title} End`,
                            date: project.endDate instanceof Timestamp ?
                                project.endDate.toDate() : new Date(project.endDate),
                            projectId: project.id,
                            backgroundColor: '#34A853'
                        });
                    }
                });

                setMilestones(allMilestones);

            } catch (err) {
                console.error('Error fetching projects:', err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProjects();
    }, [currentUser, searchTerm, sortField, sortDirection]);

    const handleSort = (field) => {
        if (sortField === field) {
            // Toggle sort direction if clicking the same field
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            // Set new sort field and default to ascending
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = typeof timestamp === 'object' && timestamp.toDate ?
            timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const handleProjectClick = (project) => {
        navigate(`/project/${project.id}`);
    };

    const handleCloseProjectDetail = (result) => {
        if (result && result.updated) {
            // Refresh project data when a project is updated
            // The simplest way is to reset the state variables which forces a re-fetch
            setActiveProjects([]);
            setPastProjects([]);
            // You could also implement a more optimized update that only updates the changed project
        }
        setSelectedProject(null);
    };

    const handleCreateProject = () => {
        setShowNewProjectForm(true);
    };

    const handleProjectCreated = (projectId) => {
        setShowNewProjectForm(false);
        // Refresh project data
        // This will trigger the useEffect to reload
        setSortField(prevField => prevField);
    };

    const handleCancelCreate = () => {
        setShowNewProjectForm(false);
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'in progress':
                return '#4285F4'; // Blue
            case 'completed':
                return '#34A853'; // Green
            case 'cancelled':
                return '#EA4335'; // Red
            case 'on hold':
                return '#FBBC05'; // Yellow
            default:
                return '#9AA0A6'; // Grey (for pending, draft, etc.)
        }
    };

    const toggleProject = (projectId) => {
        setExpandedProjects(prev => {
            const newSet = new Set(prev);
            if (newSet.has(projectId)) {
                newSet.delete(projectId);
            } else {
                newSet.add(projectId);
            }
            return newSet;
        });
    };

    const getSortIcon = (field) => {
        if (sortField === field) {
            return sortDirection === 'asc' ? '↑' : '↓';
        }
        return '';
    };

    const renderProjectList = (projects, isPastList = false) => {
        if (projects.length === 0) {
            return (
                <div className="no-results">
                    {searchTerm.trim() !== '' ? (
                        <p>No projects match your search criteria.</p>
                    ) : (
                        <p>{isPastList ? 'No past projects.' : 'No active projects available.'}</p>
                    )}
                </div>
            );
        }

        return (
            <div className="projects-table-container">
                <table className="projects-table">
                    <thead>
                        <tr>
                            <th onClick={() => handleSort('title')} className="project-column">
                                Project {getSortIcon('title')}
                            </th>
                            <th onClick={() => handleSort('status')} className="status-column">
                                Status {getSortIcon('status')}
                            </th>
                            <th onClick={() => handleSort('clientName')} className="client-column">
                                Client {getSortIcon('clientName')}
                            </th>
                            <th onClick={() => handleSort('startDate')} className="date-column">
                                Start Date {getSortIcon('startDate')}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {projects.map((project) => (
                            <tr key={project.id} className="project-row">
                                <td className="project-title-cell">
                                    <Link to={`/project/${project.id}`} className="project-title-link">
                                        {project.title || 'Untitled'}
                                    </Link>
                                </td>
                                <td className="status-cell">
                                    <span className={`status-badge status-${project.status?.toLowerCase() || 'draft'}`}>
                                        {project.status || 'Draft'}
                                    </span>
                                </td>
                                <td>{project.clientName || 'N/A'}</td>
                                <td>{formatDate(project.startDate)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="projects-page">
            <div className="projects-header">
                <h1>{t('myProjects')}</h1>
                <button className="create-project-btn" onClick={handleCreateProject}>
                    <i className="fas fa-plus"></i> Create New Project
                </button>
            </div>

            <div className="projects-layout">
                <div className="projects-main">
                    <div className="projects-controls">
                        <div className="search-container">
                            <input
                                type="text"
                                placeholder="Search projects..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
                        </div>
                        <div className="sort-container">
                            <label>Sort by:</label>
                            <select
                                value={sortField}
                                onChange={(e) => {
                                    setSortField(e.target.value);
                                    setSortDirection('asc');
                                }}
                                className="sort-select"
                            >
                                <option value="createdAt">Date</option>
                                <option value="title">Title</option>
                                <option value="status">Status</option>
                                <option value="location">Location</option>
                            </select>
                            <button
                                onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                                className="sort-direction-button"
                            >
                                {sortDirection === 'asc' ? '↑' : '↓'}
                            </button>
                        </div>
                    </div>

                    {error && <div className="error-message">Error loading projects: {error}</div>}

                    {isLoading ? (
                        <div className="loading-container">
                            <div className="loading-spinner">
                                <i className="fas fa-tools"></i>
                            </div>
                            <div className="loading-text">{t('loading')}</div>
                        </div>
                    ) : (
                        <>
                            <div className="projects-section active-projects">
                                <h2>Active Projects</h2>
                                {renderProjectList(activeProjects)}
                            </div>

                            <div className="projects-section past-projects">
                                <h2>Past Projects</h2>
                                {renderProjectList(pastProjects, true)}
                            </div>
                        </>
                    )}
                </div>

                <div className="projects-sidebar">
                    <div className="calendar-widget">
                        <h2>Upcoming Milestones</h2>
                        <FullCalendar
                            plugins={[dayGridPlugin]}
                            initialView="dayGridMonth"
                            headerToolbar={{
                                left: 'prev,next',
                                center: 'title',
                                right: 'today'
                            }}
                            events={milestones}
                            height="auto"
                            eventClick={(info) => {
                                const projectId = info.event.extendedProps.projectId;
                                const project = [...activeProjects, ...pastProjects].find(p => p.id === projectId);
                                if (project) {
                                    setSelectedProject(project);
                                }
                            }}
                        />
                    </div>
                </div>
            </div>

            {selectedProject && (
                <ProjectDetail
                    project={selectedProject}
                    onClose={handleCloseProjectDetail}
                    userType={isContractor ? "CONTRACTOR" : "prime"}
                />
            )}

            {showNewProjectForm && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <NewProjectForm
                            onCancel={handleCancelCreate}
                            onSuccess={handleProjectCreated}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Projects;
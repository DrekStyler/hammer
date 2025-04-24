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

// Comprehensive styles object
const styles = {
    // Page layout
    page: {
        padding: '30px',
        maxWidth: '1600px',
        margin: '0 auto',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
    },
    title: {
        color: '#333',
        fontSize: '28px',
        fontWeight: '600',
        margin: 0,
    },
    createButton: {
        backgroundColor: '#1a73e8',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        padding: '10px 20px',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        transition: 'background-color 0.2s',
    },
    layout: {
        display: 'grid',
        gridTemplateColumns: '3fr 1fr',
        gap: '30px',
    },
    main: {
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
    },
    sidebar: {
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
    },
    
    // Controls
    controls: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        gap: '16px',
        flexWrap: 'wrap',
    },
    searchContainer: {
        flex: '1',
        minWidth: '250px',
    },
    searchInput: {
        width: '100%',
        padding: '10px 16px',
        fontSize: '16px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        transition: 'border-color 0.2s',
    },
    sortContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
    },
    sortLabel: {
        fontWeight: '500',
        color: '#4a5568',
    },
    sortSelect: {
        padding: '10px',
        fontSize: '16px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        backgroundColor: 'white',
        minWidth: '150px',
    },
    sortButton: {
        padding: '10px 12px',
        backgroundColor: '#f7fafc',
        border: '1px solid #ddd',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '16px',
        transition: 'background-color 0.2s',
    },
    
    // Projects section
    section: {
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
        overflow: 'hidden',
        marginBottom: '24px',
    },
    sectionHeader: {
        padding: '16px 20px',
        borderBottom: '1px solid #e1e4e8',
        backgroundColor: '#f8f9fa',
    },
    sectionTitle: {
        fontSize: '18px',
        fontWeight: '500',
        color: '#333',
        margin: 0,
    },
    
    // Table styles
    tableContainer: {
        padding: '5px 20px 20px',
        overflow: 'auto',
    },
    table: {
        width: '100%',
        borderSpacing: 0,
        borderCollapse: 'collapse',
        fontSize: '14px',
    },
    tableHeader: {
        position: 'sticky',
        top: 0,
        backgroundColor: '#f8f9fa',
        padding: '16px',
        textAlign: 'left',
        color: '#5f6368',
        fontWeight: '500',
        borderBottom: '1px solid #e0e0e0',
        cursor: 'pointer',
        transition: 'background-color 0.1s',
    },
    tableHeaderHover: {
        backgroundColor: '#eaecef',
    },
    projectColumn: {
        width: '40%',
    },
    statusColumn: {
        width: '20%',
    },
    clientColumn: {
        width: '20%',
    },
    dateColumn: {
        width: '20%',
    },
    tableCell: {
        padding: '14px 16px',
        borderBottom: '1px solid #eeeeee',
        color: '#202124',
        verticalAlign: 'middle',
    },
    projectRow: {
        transition: 'background-color 0.2s',
    },
    projectRowHover: {
        backgroundColor: '#f8f9fa',
    },
    projectTitleCell: {
        fontWeight: '500',
    },
    projectLink: {
        color: '#1a73e8',
        textDecoration: 'none',
        fontWeight: '500',
        transition: 'color 0.2s',
    },
    
    // Status badge
    statusBadge: {
        display: 'inline-block',
        padding: '6px 10px',
        fontSize: '12px',
        fontWeight: '500',
        borderRadius: '16px',
        textTransform: 'capitalize',
        textAlign: 'center',
        minWidth: '90px',
        color: 'white',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    },
    statusInProgress: {
        backgroundColor: '#4285F4',
    },
    statusCompleted: {
        backgroundColor: '#34A853',
    },
    statusCancelled: {
        backgroundColor: '#EA4335',
    },
    statusOnHold: {
        backgroundColor: '#FBBC05',
    },
    statusPending: {
        backgroundColor: '#F9AB00',
    },
    statusDraft: {
        backgroundColor: '#9AA0A6',
    },
    
    // Calendar widget
    calendarWidget: {
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
        overflow: 'hidden',
        height: 'fit-content',
    },
    calendarHeader: {
        padding: '16px 20px',
        borderBottom: '1px solid #e1e4e8',
        backgroundColor: '#f8f9fa',
    },
    calendarTitle: {
        fontSize: '18px',
        fontWeight: '500',
        color: '#333',
        margin: 0,
    },
    calendarContainer: {
        padding: '16px',
    },
    
    // Loading and errors
    loadingContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 0',
    },
    loadingSpinner: {
        fontSize: '32px',
        color: '#1a73e8',
        marginBottom: '16px',
    },
    loadingText: {
        fontSize: '16px',
        color: '#5f6368',
    },
    errorMessage: {
        backgroundColor: '#fed7d7',
        color: '#c53030',
        padding: '12px',
        borderRadius: '4px',
        marginBottom: '20px',
        fontSize: '14px',
        textAlign: 'center',
    },
    noResults: {
        textAlign: 'center',
        padding: '30px',
        color: '#718096',
        fontSize: '16px',
        backgroundColor: '#f7fafc',
        borderRadius: '4px',
        margin: '10px 0',
    },
    
    // Modal styles
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)',
        width: '90%',
        maxWidth: '800px',
        maxHeight: '90vh',
        overflow: 'auto',
    },
    
    // Responsive styles
    '@media (max-width: 1024px)': {
        layout: {
            gridTemplateColumns: '1fr',
        },
        sidebar: {
            order: -1,
        },
    },
    '@media (max-width: 768px)': {
        header: {
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '16px',
        },
        createButton: {
            width: '100%',
            justifyContent: 'center',
        },
        controls: {
            flexDirection: 'column',
            alignItems: 'stretch',
        },
    },
};

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
    const [hoveredHeader, setHoveredHeader] = useState(null);
    const [hoveredRow, setHoveredRow] = useState(null);

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

    const getStatusStyle = (status) => {
        const baseStyle = styles.statusBadge;
        const statusLower = status?.toLowerCase() || 'draft';
        
        let specificStyle;
        switch (statusLower) {
            case 'in progress':
                specificStyle = styles.statusInProgress;
                break;
            case 'completed':
                specificStyle = styles.statusCompleted;
                break;
            case 'cancelled':
                specificStyle = styles.statusCancelled;
                break;
            case 'on hold':
                specificStyle = styles.statusOnHold;
                break;
            case 'pending':
                specificStyle = styles.statusPending;
                break;
            default:
                specificStyle = styles.statusDraft;
        }
        
        return { ...baseStyle, ...specificStyle };
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
                <div style={styles.noResults}>
                    {searchTerm.trim() !== '' ? (
                        <p>No projects match your search criteria.</p>
                    ) : (
                        <p>{isPastList ? 'No past projects.' : 'No active projects available.'}</p>
                    )}
                </div>
            );
        }

        return (
            <div style={styles.tableContainer}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th 
                                onClick={() => handleSort('title')} 
                                style={{
                                    ...styles.tableHeader,
                                    ...styles.projectColumn,
                                    ...(hoveredHeader === 'title' ? styles.tableHeaderHover : {})
                                }}
                                onMouseEnter={() => setHoveredHeader('title')}
                                onMouseLeave={() => setHoveredHeader(null)}
                            >
                                Project {getSortIcon('title')}
                            </th>
                            <th 
                                onClick={() => handleSort('status')} 
                                style={{
                                    ...styles.tableHeader,
                                    ...styles.statusColumn,
                                    ...(hoveredHeader === 'status' ? styles.tableHeaderHover : {})
                                }}
                                onMouseEnter={() => setHoveredHeader('status')}
                                onMouseLeave={() => setHoveredHeader(null)}
                            >
                                Status {getSortIcon('status')}
                            </th>
                            <th 
                                onClick={() => handleSort('clientName')} 
                                style={{
                                    ...styles.tableHeader,
                                    ...styles.clientColumn,
                                    ...(hoveredHeader === 'clientName' ? styles.tableHeaderHover : {})
                                }}
                                onMouseEnter={() => setHoveredHeader('clientName')}
                                onMouseLeave={() => setHoveredHeader(null)}
                            >
                                Client {getSortIcon('clientName')}
                            </th>
                            <th 
                                onClick={() => handleSort('startDate')} 
                                style={{
                                    ...styles.tableHeader,
                                    ...styles.dateColumn,
                                    ...(hoveredHeader === 'startDate' ? styles.tableHeaderHover : {})
                                }}
                                onMouseEnter={() => setHoveredHeader('startDate')}
                                onMouseLeave={() => setHoveredHeader(null)}
                            >
                                Start Date {getSortIcon('startDate')}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {projects.map((project) => (
                            <tr 
                                key={project.id} 
                                style={{
                                    ...styles.projectRow,
                                    ...(hoveredRow === project.id ? styles.projectRowHover : {})
                                }}
                                onMouseEnter={() => setHoveredRow(project.id)}
                                onMouseLeave={() => setHoveredRow(null)}
                            >
                                <td style={{...styles.tableCell, ...styles.projectTitleCell}}>
                                    <Link to={`/project/${project.id}`} style={styles.projectLink}>
                                        {project.title || 'Untitled'}
                                    </Link>
                                </td>
                                <td style={styles.tableCell}>
                                    <span style={getStatusStyle(project.status)}>
                                        {project.status || 'Draft'}
                                    </span>
                                </td>
                                <td style={styles.tableCell}>{project.clientName || 'N/A'}</td>
                                <td style={styles.tableCell}>{formatDate(project.startDate)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    // Get responsive layout style based on window width
    const getLayoutStyle = () => {
        if (typeof window !== 'undefined' && window.innerWidth <= 1024) {
            return { ...styles.layout, gridTemplateColumns: '1fr' };
        }
        return styles.layout;
    };

    return (
        <div style={styles.page}>
            <div style={styles.header}>
                <h1 style={styles.title}>{t('myProjects')}</h1>
                <button style={styles.createButton} onClick={handleCreateProject}>
                    <i className="fas fa-plus"></i> Create New Project
                </button>
            </div>

            <div style={getLayoutStyle()}>
                <div style={styles.main}>
                    <div style={styles.controls}>
                        <div style={styles.searchContainer}>
                            <input
                                type="text"
                                placeholder="Search projects..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={styles.searchInput}
                            />
                        </div>
                        <div style={styles.sortContainer}>
                            <label style={styles.sortLabel}>Sort by:</label>
                            <select
                                value={sortField}
                                onChange={(e) => {
                                    setSortField(e.target.value);
                                    setSortDirection('asc');
                                }}
                                style={styles.sortSelect}
                            >
                                <option value="createdAt">Date</option>
                                <option value="title">Title</option>
                                <option value="status">Status</option>
                                <option value="location">Location</option>
                            </select>
                            <button
                                onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                                style={styles.sortButton}
                            >
                                {sortDirection === 'asc' ? '↑' : '↓'}
                            </button>
                        </div>
                    </div>

                    {error && <div style={styles.errorMessage}>Error loading projects: {error}</div>}

                    {isLoading ? (
                        <div style={styles.loadingContainer}>
                            <div style={styles.loadingSpinner}>
                                <i className="fas fa-tools"></i>
                            </div>
                            <div style={styles.loadingText}>{t('loading')}</div>
                        </div>
                    ) : (
                        <>
                            <div style={styles.section}>
                                <div style={styles.sectionHeader}>
                                    <h2 style={styles.sectionTitle}>Active Projects</h2>
                                </div>
                                {renderProjectList(activeProjects)}
                            </div>

                            <div style={styles.section}>
                                <div style={styles.sectionHeader}>
                                    <h2 style={styles.sectionTitle}>Past Projects</h2>
                                </div>
                                {renderProjectList(pastProjects, true)}
                            </div>
                        </>
                    )}
                </div>

                <div style={styles.sidebar}>
                    <div style={styles.calendarWidget}>
                        <div style={styles.calendarHeader}>
                            <h2 style={styles.calendarTitle}>Upcoming Milestones</h2>
                        </div>
                        <div style={styles.calendarContainer}>
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
            </div>

            {selectedProject && (
                <ProjectDetail
                    project={selectedProject}
                    onClose={handleCloseProjectDetail}
                    userType={isContractor ? "CONTRACTOR" : "prime"}
                />
            )}

            {showNewProjectForm && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
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
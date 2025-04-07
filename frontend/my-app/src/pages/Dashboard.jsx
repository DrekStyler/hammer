import React, { useState, useEffect } from 'react';
import { where, orderBy, limit } from 'firebase/firestore';
import { useFirestoreQuery } from '../hooks/useFirestore';
import { useAuth } from '../contexts/AuthContext';
import { useRole } from '../contexts/RoleContext';
import useTranslation from '../utils/useTranslation';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { Link } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
    const { currentUser } = useAuth();
    const { isPrime } = useRole();
    const { t } = useTranslation();
    const [projectEvents, setProjectEvents] = useState([]);

    // Use the custom hook for Firestore queries
    const { data: projects, loading: projectsLoading, error: projectsError } = useFirestoreQuery(
        'projects',
        [orderBy('createdAt', 'desc'), limit(5)],
        { realtime: true }
    );

    // Query for contractors created by this user (for prime users)
    const { data: contractors, loading: contractorsLoading, error: contractorsError } = useFirestoreQuery(
        'contractors',
        [where('createdBy', '==', currentUser?.uid || ''), orderBy('createdAt', 'desc'), limit(5)],
        { realtime: true }
    );

    useEffect(() => {
        // Convert projects to calendar events
        if (projects && projects.length > 0) {
            const events = projects.map(project => {
                const startDate = project.startDate ?
                    (typeof project.startDate === 'object' && project.startDate.toDate ?
                        project.startDate.toDate() : new Date(project.startDate)) :
                    new Date();

                return {
                    id: project.id,
                    title: project.title || 'Untitled Project',
                    start: startDate,
                    end: project.endDate ?
                        (typeof project.endDate === 'object' && project.endDate.toDate ?
                            project.endDate.toDate() : new Date(project.endDate)) :
                        null,
                    backgroundColor: getStatusColor(project.status),
                    borderColor: getStatusColor(project.status),
                    extendedProps: {
                        description: project.description,
                        client: project.clientName,
                        status: project.status
                    }
                };
            });
            setProjectEvents(events);
        }
    }, [projects]);

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

    // Display a responsive dashboard that adjusts based on user role
    return (
        <div className="dashboard-container">
            <h1>{t('dashboard')}</h1>

            {isPrime ? (
                // Prime user dashboard
                <div className="prime-dashboard">
                    <div className="dashboard-grid">
                        <div className="dashboard-column projects-column">
                            <div className="dashboard-card">
                                <div className="card-header">
                                    <h2>{t('myProjects')}</h2>
                                    <Link to="/my-projects" className="view-all-link">
                                        View All
                                    </Link>
                                </div>
                                {projectsLoading ? (
                                    <div className="loading-spinner">{t('loading')}</div>
                                ) : projectsError ? (
                                    <div className="error-message">{projectsError.message}</div>
                                ) : projects.length === 0 ? (
                                    <div className="no-results">{t('noProjects')}</div>
                                ) : (
                                    <div className="table-container">
                                        <table className="projects-table dashboard-projects-table" aria-label="My Projects">
                                            <thead>
                                                <tr>
                                                    <th scope="col">Project</th>
                                                    <th scope="col">Status</th>
                                                    <th scope="col">Client</th>
                                                    <th scope="col">Start Date</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {projects.map((project, index) => (
                                                    <tr key={project.id} className={index % 2 === 0 ? 'even-row' : 'odd-row'}>
                                                        <td>
                                                            <Link to={`/project/${project.id}`} className="project-title-link">
                                                                {project.title || 'Untitled'}
                                                            </Link>
                                                        </td>
                                                        <td>
                                                            <span className={`status-badge status-${project.status?.toLowerCase() || 'pending'}`}>
                                                                {project.status || 'Pending'}
                                                            </span>
                                                        </td>
                                                        <td>{project.clientName || 'N/A'}</td>
                                                        <td>{formatDate(project.startDate)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            <div className="dashboard-card">
                                <div className="card-header">
                                    <h2>{t('myContractors')}</h2>
                                    <Link to="/my-contractors" className="view-all-link">
                                        View All
                                    </Link>
                                </div>
                                {contractorsLoading ? (
                                    <div className="loading-spinner">{t('loading')}</div>
                                ) : contractorsError ? (
                                    <div className="error-message">{contractorsError.message}</div>
                                ) : contractors.length === 0 ? (
                                    <div className="no-results">
                                        <p>No contractors yet.</p>
                                        <Link to="/my-contractors" className="action-link">
                                            Create your first contractor
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="table-container">
                                        <table className="projects-table contractors-table" aria-label="My Contractors">
                                            <thead>
                                                <tr>
                                                    <th scope="col">Company</th>
                                                    <th scope="col">Contact</th>
                                                    <th scope="col">Trade</th>
                                                    <th scope="col">Location</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {contractors.map((contractor, index) => (
                                                    <tr key={contractor.id} className={index % 2 === 0 ? 'even-row' : 'odd-row'}>
                                                        <td>{contractor.companyName || contractor.name || 'Unnamed'}</td>
                                                        <td>{contractor.contactPerson || 'N/A'}</td>
                                                        <td>{contractor.trade || 'N/A'}</td>
                                                        <td>
                                                            {contractor.city || 'N/A'}
                                                            {contractor.state ? `, ${contractor.state}` : ''}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="dashboard-column calendar-column">
                            <div className="dashboard-card calendar-card">
                                <div className="card-header">
                                    <h2>Upcoming Projects</h2>
                                </div>
                                <div className="calendar-container">
                                    <FullCalendar
                                        plugins={[dayGridPlugin]}
                                        initialView="dayGridMonth"
                                        events={projectEvents}
                                        headerToolbar={{
                                            left: 'prev,next today',
                                            center: 'title',
                                            right: ''
                                        }}
                                        height="auto"
                                        eventTimeFormat={{
                                            hour: 'numeric',
                                            minute: '2-digit',
                                            meridiem: 'short'
                                        }}
                                        eventClick={(info) => {
                                            alert(
                                                `Project: ${info.event.title}\n` +
                                                `Status: ${info.event.extendedProps.status || 'Not set'}\n` +
                                                `Description: ${info.event.extendedProps.description || 'No description'}\n` +
                                                `Client: ${info.event.extendedProps.client || 'Not specified'}`
                                            );
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                // Contractor user dashboard (existing implementation)
                <div className="contractor-dashboard">
                    {projectsError && <div className="error-message">{projectsError.message}</div>}

                    {projectsLoading ? (
                        <div className="loading-spinner">Loading projects...</div>
                    ) : (
                        <>
                            {projects.length === 0 ? (
                                <div className="no-results">No projects found</div>
                            ) : (
                                <div className="table-container">
                                    <table className="projects-table" aria-label="Projects">
                                        <thead>
                                            <tr>
                                                <th scope="col">Project Title</th>
                                                <th scope="col">Status</th>
                                                <th scope="col">Client</th>
                                                <th scope="col">Budget</th>
                                                <th scope="col">Location</th>
                                                <th scope="col">Created On</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {projects.map((project, index) => (
                                                <tr key={project.id} className={index % 2 === 0 ? 'even-row' : 'odd-row'}>
                                                    <td>
                                                        <Link to={`/project/${project.id}`} className="project-title-link">
                                                            {project.title || 'Untitled'}
                                                        </Link>
                                                    </td>
                                                    <td>
                                                        <span className={`status-badge status-${project.status?.toLowerCase() || 'pending'}`}>
                                                            {project.status || 'Pending'}
                                                        </span>
                                                    </td>
                                                    <td>{project.clientName || 'N/A'}</td>
                                                    <td>${project.budget?.toLocaleString() || 'N/A'}</td>
                                                    <td>{project.location || 'N/A'}</td>
                                                    <td>{formatDate(project.createdAt)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default Dashboard;
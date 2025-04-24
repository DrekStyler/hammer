import React, { useState, useEffect } from 'react';
import { where, orderBy, limit } from 'firebase/firestore';
import { useFirestoreQuery } from '../hooks/useFirestore';
import { useAuth } from '../contexts/AuthContext';
import { useRole } from '../contexts/RoleContext';
import useTranslation from '../utils/useTranslation';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { Link } from 'react-router-dom';

// Dashboard styles
const styles = {
    container: {
        padding: '30px',
        width: '90%',
        maxWidth: '1600px',
        margin: '0 auto',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    },
    headerTitle: {
        color: '#333',
        fontSize: '28px',
        fontWeight: '600',
        marginBottom: '24px',
    },
    dashboardGrid: {
        display: 'grid',
        gridTemplateColumns: '2fr 3fr',
        gap: '30px',
        marginTop: '15px',
    },
    dashboardColumn: {
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
    },
    card: {
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
        overflow: 'hidden',
        paddingBottom: '16px',
    },
    cardHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px',
        borderBottom: '1px solid #e1e4e8',
        marginBottom: '10px',
    },
    cardTitle: {
        margin: 0,
        fontSize: '16px',
        color: '#202124',
        fontWeight: '500',
    },
    viewAllLink: {
        color: '#1a73e8',
        textDecoration: 'none',
        fontSize: '14px',
    },
    tableContainer: {
        padding: '0 10px',
        overflow: 'auto',
        backgroundColor: 'white',
        borderRadius: '8px',
        margin: '0px 10px 10px 10px',
    },
    table: {
        width: '100%',
        borderSpacing: 0,
        borderCollapse: 'collapse',
        fontSize: '14px',
        marginBottom: 0,
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
        whiteSpace: 'nowrap',
    },
    tableCell: {
        padding: '14px 16px',
        borderBottom: '1px solid #eeeeee',
        color: '#202124',
        verticalAlign: 'middle',
        maxWidth: '300px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    evenRow: {
        backgroundColor: '#ffffff',
    },
    oddRow: {
        backgroundColor: '#f8f9fa',
    },
    projectTitleLink: {
        color: '#1a73e8',
        textDecoration: 'none',
        fontWeight: '500',
        transition: 'all 0.2s',
    },
    loadingSpinner: {
        textAlign: 'center',
        padding: '30px',
        color: '#718096',
        fontSize: '18px',
    },
    errorMessage: {
        backgroundColor: '#fed7d7',
        color: '#c53030',
        padding: '12px',
        borderRadius: '4px',
        margin: '10px 20px',
        fontSize: '14px',
        textAlign: 'center',
    },
    noResults: {
        textAlign: 'center',
        padding: '30px',
        color: '#718096',
        fontSize: '18px',
        backgroundColor: '#f7fafc',
        borderRadius: '4px',
        margin: '10px 20px',
    },
    calendarContainer: {
        padding: '16px',
        height: 'calc(100% - 60px)',
        minHeight: '550px',
    },
    actionLink: {
        color: '#1a73e8',
        textDecoration: 'none',
        display: 'inline-block',
        marginTop: '10px',
        padding: '8px 16px',
        backgroundColor: '#e8f0fe',
        borderRadius: '4px',
        fontSize: '14px',
    },
    contractorDashboard: {
        width: '100%',
    },
    // Responsive styles
    '@media (max-width: 768px)': {
        dashboardGrid: {
            gridTemplateColumns: '1fr',
            gap: '20px',
        },
    }
};

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
        const statusLower = status?.toLowerCase() || '';
        switch (statusLower) {
            case 'in progress':
            case 'in-progress':
                return '#4285F4'; // Blue
            case 'completed':
            case 'complete':
                return '#34A853'; // Green
            case 'cancelled':
            case 'canceled':
                return '#EA4335'; // Red
            case 'on hold':
            case 'on-hold':
                return '#FBBC05'; // Yellow
            case 'pending':
            case 'open':
                return '#F9AB00'; // Orange
            case 'draft':
                return '#9AA0A6'; // Grey
            default:
                return '#9AA0A6'; // Grey fallback for unknown statuses
        }
    };

    // Get responsive grid style based on window width
    const getDashboardGridStyle = () => {
        return window.innerWidth <= 768 ? 
            { ...styles.dashboardGrid, gridTemplateColumns: '1fr' } : 
            styles.dashboardGrid;
    };

    // Display a responsive dashboard that adjusts based on user role
    return (
        <div style={styles.container}>
            <h1 style={styles.headerTitle}>{t('dashboard')}</h1>

            {isPrime ? (
                // Prime user dashboard
                <div style={{ width: '100%' }}>
                    <div style={getDashboardGridStyle()}>
                        <div style={styles.dashboardColumn}>
                            <div style={styles.card}>
                                <div style={styles.cardHeader}>
                                    <h2 style={styles.cardTitle}>{t('myProjects')}</h2>
                                    <Link to="/my-projects" style={styles.viewAllLink}>
                                        View All
                                    </Link>
                                </div>
                                {projectsLoading ? (
                                    <div style={styles.loadingSpinner}>{t('loading')}</div>
                                ) : projectsError ? (
                                    <div style={styles.errorMessage}>{projectsError.message}</div>
                                ) : projects.length === 0 ? (
                                    <div style={styles.noResults}>{t('noProjects')}</div>
                                ) : (
                                    <div style={styles.tableContainer}>
                                        <table style={styles.table} aria-label="My Projects">
                                            <thead>
                                                <tr>
                                                    <th style={styles.tableHeader} scope="col">Project</th>
                                                    <th style={styles.tableHeader} scope="col">Status</th>
                                                    <th style={styles.tableHeader} scope="col">Client</th>
                                                    <th style={styles.tableHeader} scope="col">Start Date</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {projects.map((project, index) => (
                                                    <tr key={project.id} style={index % 2 === 0 ? styles.evenRow : styles.oddRow}>
                                                        <td style={styles.tableCell}>
                                                            <Link to={`/project/${project.id}`} style={styles.projectTitleLink}>
                                                                {project.title || 'Untitled'}
                                                            </Link>
                                                        </td>
                                                        <td style={styles.tableCell}>
                                                            <span 
                                                                className="status-badge"
                                                                style={{
                                                                    display: 'inline-block',
                                                                    padding: '6px 10px',
                                                                    fontSize: '12px',
                                                                    fontWeight: 500,
                                                                    borderRadius: '16px',
                                                                    textTransform: 'capitalize',
                                                                    textAlign: 'center',
                                                                    minWidth: '90px',
                                                                    backgroundColor: getStatusColor(project.status),
                                                                    color: 'white',
                                                                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                                                                }}
                                                            >
                                                                {project.status || 'Pending'}
                                                            </span>
                                                        </td>
                                                        <td style={styles.tableCell}>{project.clientName || 'N/A'}</td>
                                                        <td style={styles.tableCell}>{formatDate(project.startDate)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            <div style={styles.card}>
                                <div style={styles.cardHeader}>
                                    <h2 style={styles.cardTitle}>{t('myContractors')}</h2>
                                    <Link to="/my-contractors" style={styles.viewAllLink}>
                                        View All
                                    </Link>
                                </div>
                                {contractorsLoading ? (
                                    <div style={styles.loadingSpinner}>{t('loading')}</div>
                                ) : contractorsError ? (
                                    <div style={styles.errorMessage}>{contractorsError.message}</div>
                                ) : contractors.length === 0 ? (
                                    <div style={styles.noResults}>
                                        <p>No contractors yet.</p>
                                        <Link to="/my-contractors" style={styles.actionLink}>
                                            Create your first contractor
                                        </Link>
                                    </div>
                                ) : (
                                    <div style={styles.tableContainer}>
                                        <table style={styles.table} aria-label="My Contractors">
                                            <thead>
                                                <tr>
                                                    <th style={styles.tableHeader} scope="col">Company</th>
                                                    <th style={styles.tableHeader} scope="col">Contact</th>
                                                    <th style={styles.tableHeader} scope="col">Trade</th>
                                                    <th style={styles.tableHeader} scope="col">Location</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {contractors.map((contractor, index) => (
                                                    <tr key={contractor.id} style={index % 2 === 0 ? styles.evenRow : styles.oddRow}>
                                                        <td style={styles.tableCell}>{contractor.companyName || contractor.name || 'Unnamed'}</td>
                                                        <td style={styles.tableCell}>{contractor.contactPerson || 'N/A'}</td>
                                                        <td style={styles.tableCell}>{contractor.trade || 'N/A'}</td>
                                                        <td style={styles.tableCell}>
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

                        <div style={styles.dashboardColumn}>
                            <div style={{...styles.card, height: '100%', minHeight: '600px'}}>
                                <div style={styles.cardHeader}>
                                    <h2 style={styles.cardTitle}>Upcoming Projects</h2>
                                </div>
                                <div style={styles.calendarContainer}>
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
                <div style={styles.contractorDashboard}>
                    {projectsError && <div style={styles.errorMessage}>{projectsError.message}</div>}

                    {projectsLoading ? (
                        <div style={styles.loadingSpinner}>Loading projects...</div>
                    ) : (
                        <>
                            {projects.length === 0 ? (
                                <div style={styles.noResults}>No projects found</div>
                            ) : (
                                <div style={{...styles.card, padding: '20px'}}>
                                    <div style={styles.tableContainer}>
                                        <table style={styles.table} aria-label="Projects">
                                            <thead>
                                                <tr>
                                                    <th style={styles.tableHeader} scope="col">Project Title</th>
                                                    <th style={styles.tableHeader} scope="col">Status</th>
                                                    <th style={styles.tableHeader} scope="col">Client</th>
                                                    <th style={styles.tableHeader} scope="col">Budget</th>
                                                    <th style={styles.tableHeader} scope="col">Location</th>
                                                    <th style={styles.tableHeader} scope="col">Created On</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {projects.map((project, index) => (
                                                    <tr key={project.id} style={index % 2 === 0 ? styles.evenRow : styles.oddRow}>
                                                        <td style={styles.tableCell}>
                                                            <Link to={`/project/${project.id}`} style={styles.projectTitleLink}>
                                                                {project.title || 'Untitled'}
                                                            </Link>
                                                        </td>
                                                        <td style={styles.tableCell}>
                                                            <span 
                                                                className="status-badge"
                                                                style={{
                                                                    display: 'inline-block',
                                                                    padding: '6px 10px',
                                                                    fontSize: '12px',
                                                                    fontWeight: 500,
                                                                    borderRadius: '16px',
                                                                    textTransform: 'capitalize',
                                                                    textAlign: 'center',
                                                                    minWidth: '90px',
                                                                    backgroundColor: getStatusColor(project.status),
                                                                    color: 'white',
                                                                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                                                                }}
                                                            >
                                                                {project.status || 'Pending'}
                                                            </span>
                                                        </td>
                                                        <td style={styles.tableCell}>{project.clientName || 'N/A'}</td>
                                                        <td style={styles.tableCell}>${project.budget?.toLocaleString() || 'N/A'}</td>
                                                        <td style={styles.tableCell}>{project.location || 'N/A'}</td>
                                                        <td style={styles.tableCell}>{formatDate(project.createdAt)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
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
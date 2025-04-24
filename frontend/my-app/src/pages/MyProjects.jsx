import React, { useState, useEffect } from 'react';
import { collection, where, orderBy, query, getDocs, Timestamp, doc, updateDoc, addDoc } from 'firebase/firestore';
import { useFirestoreQuery } from '../hooks/useFirestore';
import { useAuth } from '../contexts/AuthContext';
import { useRole } from '../contexts/RoleContext';
import useTranslation from '../utils/useTranslation';
import { db } from '../firebase/config';
import { getAllProjects } from '../api/dataService';
import { Link, useNavigate } from 'react-router-dom';
import NewProjectForm from '../components/NewProjectForm';

// Comprehensive styles object
const styles = {
    // Container and layout
    myProjectsContainer: {
        padding: '30px',
        maxWidth: '1600px',
        margin: '0 auto',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    },
    projectsHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
    },
    headerTitle: {
        color: '#333',
        fontSize: '28px',
        fontWeight: '600',
        margin: 0
    },
    createProjectBtn: {
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
        transition: 'background-color 0.2s ease'
    },
    
    // Controls section
    projectsControls: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        gap: '16px',
        flexWrap: 'wrap'
    },
    searchContainer: {
        flex: '1',
        minWidth: '250px'
    },
    searchInput: {
        width: '100%',
        padding: '10px 16px',
        fontSize: '14px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        transition: 'border-color 0.2s ease'
    },
    filterContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
    },
    filterLabel: {
        fontWeight: '500',
        color: '#4a5568'
    },
    statusFilter: {
        padding: '10px',
        fontSize: '14px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        backgroundColor: 'white',
        minWidth: '150px'
    },
    
    // Messages
    accessDenied: {
        padding: '40px',
        textAlign: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        maxWidth: '600px',
        margin: '40px auto'
    },
    errorMessage: {
        backgroundColor: '#fed7d7',
        color: '#c53030',
        padding: '12px',
        borderRadius: '4px',
        marginBottom: '20px',
        fontSize: '14px',
        textAlign: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px'
    },
    successMessage: {
        backgroundColor: '#c6f6d5',
        color: '#2f855a',
        padding: '12px',
        borderRadius: '4px',
        marginBottom: '20px',
        fontSize: '14px',
        textAlign: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px'
    },
    
    // Loading
    loadingContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 0'
    },
    loadingSpinner: {
        border: '4px solid rgba(0, 0, 0, 0.1)',
        borderRadius: '50%',
        borderTop: '4px solid #1a73e8',
        width: '30px',
        height: '30px',
        animation: 'spin 1s linear infinite',
        marginBottom: '16px'
    },
    
    // No projects message
    noProjects: {
        textAlign: 'center',
        padding: '30px',
        color: '#718096',
        backgroundColor: '#f7fafc',
        borderRadius: '4px',
        margin: '10px 0'
    },
    
    // Projects table
    projectsTableContainer: {
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
        overflow: 'auto',
        marginBottom: '24px'
    },
    projectsTable: {
        width: '100%',
        borderSpacing: 0,
        borderCollapse: 'collapse',
        fontSize: '14px'
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
        transition: 'background-color 0.1s ease'
    },
    expandColumn: {
        width: '40px'
    },
    projectColumn: {
        width: '25%'
    },
    statusColumn: {
        width: '15%'
    },
    clientColumn: {
        width: '15%'
    },
    dateColumn: {
        width: '15%'
    },
    bidsColumn: {
        width: '10%'
    },
    
    // Table rows and cells
    projectRow: {
        transition: 'background-color 0.2s ease',
        cursor: 'pointer'
    },
    projectRowHover: {
        backgroundColor: '#f8f9fa'
    },
    expandCell: {
        padding: '12px 8px',
        textAlign: 'center',
        borderBottom: '1px solid #eeeeee'
    },
    expandButton: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: '#5f6368',
        padding: '4px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    tableCell: {
        padding: '14px 16px',
        borderBottom: '1px solid #eeeeee',
        color: '#202124',
        verticalAlign: 'middle'
    },
    projectTitleCell: {
        fontWeight: '500',
        color: '#1a73e8',
        cursor: 'pointer'
    },
    statusCell: {
        padding: '14px 16px',
        borderBottom: '1px solid #eeeeee'
    },
    statusIndicator: {
        display: 'inline-block',
        padding: '6px 10px',
        fontSize: '12px',
        fontWeight: '500',
        borderRadius: '16px',
        textTransform: 'capitalize',
        textAlign: 'center',
        minWidth: '90px',
        color: 'white',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    },
    bidsCountCell: {
        padding: '14px 16px',
        borderBottom: '1px solid #eeeeee',
        textAlign: 'center'
    },
    viewBidsBtn: {
        background: 'none',
        border: '1px solid #1a73e8',
        borderRadius: '4px',
        padding: '6px 12px',
        color: '#1a73e8',
        cursor: 'pointer',
        fontSize: '12px',
        transition: 'background-color 0.2s ease'
    },
    
    // Bids expanded section
    bidsRow: {
        backgroundColor: '#f8f9fa'
    },
    bidsCell: {
        padding: '0',
        borderBottom: '1px solid #ddd'
    },
    bidsSection: {
        padding: '20px'
    },
    bidsSectionTitle: {
        fontSize: '16px',
        fontWeight: '500',
        marginBottom: '16px',
        color: '#333'
    },
    loadingBids: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        gap: '12px'
    },
    noBidsMessage: {
        textAlign: 'center',
        padding: '20px',
        color: '#718096',
        backgroundColor: '#f7fafc',
        borderRadius: '4px'
    },
    bidAcceptedMessage: {
        backgroundColor: '#e8f4fd',
        color: '#2b6cb0',
        padding: '12px',
        borderRadius: '4px',
        marginBottom: '16px',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
    },
    
    // Bids table
    bidsTableContainer: {
        marginTop: '16px',
        marginBottom: '16px',
        overflow: 'auto'
    },
    bidsTable: {
        width: '100%',
        borderSpacing: 0,
        borderCollapse: 'collapse',
        fontSize: '14px'
    },
    bidRow: {
        transition: 'background-color 0.2s ease'
    },
    contractorCell: {
        padding: '12px 16px',
        borderBottom: '1px solid #edf2f7'
    },
    contractorLink: {
        color: '#2b6cb0',
        textDecoration: 'none',
        fontWeight: '500'
    },
    bidAmountCell: {
        padding: '12px 16px',
        borderBottom: '1px solid #edf2f7',
        fontWeight: '500'
    },
    dateCell: {
        padding: '12px 16px',
        borderBottom: '1px solid #edf2f7',
        color: '#718096'
    },
    actionsCell: {
        padding: '12px 16px',
        borderBottom: '1px solid #edf2f7',
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap'
    },
    viewBidBtn: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '6px 12px',
        borderRadius: '4px',
        backgroundColor: '#edf2f7',
        color: '#4a5568',
        textDecoration: 'none',
        fontSize: '12px'
    },
    acceptBidBtn: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '6px 12px',
        borderRadius: '4px',
        backgroundColor: '#c6f6d5',
        color: '#2f855a',
        border: 'none',
        cursor: 'pointer',
        fontSize: '12px'
    },
    rejectBidBtn: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '6px 12px',
        borderRadius: '4px',
        backgroundColor: '#fed7d7',
        color: '#c53030',
        border: 'none',
        cursor: 'pointer',
        fontSize: '12px'
    },
    
    // Bid status styles
    statusPending: {
        color: '#805ad5'  // Purple for pending
    },
    statusAccepted: {
        color: '#2f855a'  // Green for accepted
    },
    statusRejected: {
        color: '#c53030'  // Red for rejected
    }
};

const MyProjects = () => {
    const { currentUser } = useAuth();
    const { isPrime } = useRole();
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortField, setSortField] = useState('createdAt');
    const [sortDirection, setSortDirection] = useState('desc');
    const [showNewProjectForm, setShowNewProjectForm] = useState(false);
    const [expandedProjectId, setExpandedProjectId] = useState(null);
    const [projectBids, setProjectBids] = useState({});
    const [loadingBids, setLoadingBids] = useState({});
    const [loadingBidActions, setLoadingBidActions] = useState({});
    const [actionSuccess, setActionSuccess] = useState('');
    const [actionError, setActionError] = useState('');

    // Fetch projects using our dataService
    const fetchProjects = async () => {
        try {
            setLoading(true);
            const fetchedProjects = await getAllProjects();
            // Filter projects for the current user
            const userProjects = fetchedProjects.filter(project =>
                project.createdBy === currentUser?.uid
            );
            setProjects(userProjects);
            setError(null);
        } catch (err) {
            console.error('Error fetching projects:', err);
            setError('Failed to load projects. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    // Fetch bids for a specific project
    const fetchBidsForProject = async (projectId) => {
        if (!projectId) return;

        try {
            setLoadingBids(prevState => ({ ...prevState, [projectId]: true }));

            const bidsQuery = query(
                collection(db, 'bids'),
                where('projectId', '==', projectId)
            );

            const querySnapshot = await getDocs(bidsQuery);
            const fetchedBids = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() || new Date()
            }));

            // Sort bids by date (newest first)
            fetchedBids.sort((a, b) => b.createdAt - a.createdAt);

            // Fetch contractor profiles for each bid
            const enhancedBids = await Promise.all(
                fetchedBids.map(async (bid) => {
                    if (bid.contractorId) {
                        try {
                            // Try to get the user profile
                            const userDoc = await getDocs(query(
                                collection(db, 'users'),
                                where('uid', '==', bid.contractorId)
                            ));

                            if (!userDoc.empty) {
                                const userData = userDoc.docs[0].data();
                                return {
                                    ...bid,
                                    contractorProfile: userData,
                                    contractorDisplayName: userData.companyName || userData.businessName || userData.displayName || bid.contractorName || 'Unknown'
                                };
                            }
                        } catch (error) {
                            console.error("Error fetching contractor profile:", error);
                        }
                    }
                    return {
                        ...bid,
                        contractorDisplayName: bid.contractorName || 'Unknown'
                    };
                })
            );

            setProjectBids(prevState => ({
                ...prevState,
                [projectId]: enhancedBids
            }));
        } catch (err) {
            console.error("Error fetching bids:", err);
        } finally {
            setLoadingBids(prevState => ({ ...prevState, [projectId]: false }));
        }
    };

    // Toggle expanded project row
    const toggleExpandProject = (projectId) => {
        if (expandedProjectId === projectId) {
            setExpandedProjectId(null);
        } else {
            setExpandedProjectId(projectId);
            if (!projectBids[projectId]) {
                fetchBidsForProject(projectId);
            }
        }
    };

    // Load projects on component mount and when user changes
    useEffect(() => {
        if (currentUser?.uid) {
            fetchProjects();
        }
    }, [currentUser]);

    // Sort projects based on current sort settings
    const sortProjects = (projects) => {
        return [...projects].sort((a, b) => {
            let valueA = a[sortField];
            let valueB = b[sortField];

            // Handle dates
            if (sortField === 'startDate' || sortField === 'endDate' || sortField === 'createdAt') {
                valueA = valueA ? new Date(valueA).getTime() : 0;
                valueB = valueB ? new Date(valueB).getTime() : 0;
            }

            // Handle numbers
            if (sortField === 'budget') {
                valueA = valueA || 0;
                valueB = valueB || 0;
            }

            // Handle strings
            if (typeof valueA === 'string' && typeof valueB === 'string') {
                return sortDirection === 'asc'
                    ? valueA.localeCompare(valueB)
                    : valueB.localeCompare(valueA);
            }

            // Handle numbers and dates
            return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
        });
    };

    // Filter projects based on search term and status
    const filteredProjects = sortProjects(projects).filter(project => {
        // Status filter
        if (statusFilter !== 'all' && project.status?.toLowerCase() !== statusFilter.toLowerCase()) {
            return false;
        }

        // Search filter
        if (searchTerm.trim() !== '') {
            const term = searchTerm.toLowerCase();
            return (
                project.title?.toLowerCase().includes(term) ||
                project.description?.toLowerCase().includes(term) ||
                project.clientName?.toLowerCase().includes(term) ||
                project.location?.toLowerCase().includes(term)
            );
        }

        return true;
    });

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
        return new Date(timestamp).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const handleProjectCreated = (projectId) => {
        // Close the form
        setShowNewProjectForm(false);

        // Refresh projects list
        fetchProjects();

        // Optionally navigate to the new project
        if (projectId) {
            navigate(`/project/${projectId}`);
        }
    };

    const getSortIcon = (field) => {
        if (sortField !== field) return null;
        return sortDirection === 'asc' ? '↑' : '↓';
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed':
                return '#34A853'; // Green
            case 'in progress':
                return '#1a73e8'; // Blue - more vibrant
            case 'on hold':
                return '#F9AB00'; // Yellow/orange - more visible
            case 'cancelled':
                return '#EA4335'; // Red
            case 'pending':
                return '#9C27B0'; // Purple - for pending
            default:
                return '#757575'; // Dark gray - for unknown status
        }
    };

    const handleProjectClick = (projectId) => {
        navigate(`/project/${projectId}`);
    };

    const getBidStatusClass = (status) => {
        if (!status || status === 'pending') return 'status-pending';
        return `status-${status.toLowerCase()}`; // 'status-accepted' or 'status-rejected'
    };

    // Handle bid status change (accept/reject)
    const handleBidStatusChange = async (e, bidId, projectId, newStatus, contractorId) => {
        e.stopPropagation();

        if (!bidId || !newStatus || !projectId) return;

        try {
            // Set loading state for this specific bid action
            setLoadingBidActions(prev => ({ ...prev, [bidId]: true }));
            setActionError('');

            // Update the bid status in Firestore
            const bidRef = doc(db, 'bids', bidId);
            await updateDoc(bidRef, {
                status: newStatus,
                updatedAt: Timestamp.now()
            });

            // If accepted, update project status to 'in progress' and close bidding
            if (newStatus === 'accepted') {
                const projectRef = doc(db, 'projects', projectId);
                await updateDoc(projectRef, {
                    status: 'In Progress',
                    biddingStatus: 'closed', // Close bidding when a bid is accepted
                    updatedAt: Timestamp.now()
                });

                // Also update the project in our local state
                setProjects(prevProjects =>
                    prevProjects.map(p =>
                        p.id === projectId
                            ? { ...p, status: 'In Progress', biddingStatus: 'closed' }
                            : p
                    )
                );
            }

            // Get the bid object
            const bid = projectBids[projectId].find(b => b.id === bidId);

            // Send notification to the bidder
            await addDoc(collection(db, 'messages'), {
                recipientId: contractorId,
                senderId: currentUser.uid,
                senderName: currentUser.displayName || 'Project Owner',
                type: 'bid',
                title: `Bid ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}: ${bid.projectTitle || 'Project'}`,
                content: `Your bid of $${bid.amount} has been ${newStatus}.`,
                projectId: projectId,
                bidId: bidId,
                read: false,
                createdAt: Timestamp.now()
            });

            // Refresh bids for this project
            await fetchBidsForProject(projectId);

            // Show success message
            setActionSuccess(`Bid ${newStatus} successfully!`);
            setTimeout(() => setActionSuccess(''), 3000);
        } catch (err) {
            console.error(`Error ${newStatus} bid:`, err);
            setActionError(`Failed to ${newStatus} bid. Please try again.`);
        } finally {
            setLoadingBidActions(prev => ({ ...prev, [bidId]: false }));
        }
    };

    // If user is not a prime, redirect or show access denied
    if (!isPrime) {
        return (
            <div style={styles.accessDenied}>
                <h2>Access Denied</h2>
                <p>You must be logged in as a prime to view this page.</p>
            </div>
        );
    }

    return (
        <div style={styles.myProjectsContainer}>
            <div style={styles.projectsHeader}>
                <h1 style={styles.headerTitle}>{t('myProjects')}</h1>
                <button 
                    style={styles.createProjectBtn} 
                    onClick={() => setShowNewProjectForm(true)}
                >
                    <i className="fas fa-plus"></i> Create New Project
                </button>
            </div>

            <div style={styles.projectsControls}>
                <div style={styles.searchContainer}>
                    <input
                        type="text"
                        placeholder="Search projects..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={styles.searchInput}
                    />
                </div>

                <div style={styles.filterContainer}>
                    <label htmlFor="status-filter" style={styles.filterLabel}>Status:</label>
                    <select
                        id="status-filter"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={styles.statusFilter}
                    >
                        <option value="all">All</option>
                        <option value="pending">Pending</option>
                        <option value="in progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="on hold">On Hold</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
            </div>

            {error && <div style={styles.errorMessage}><i className="fas fa-exclamation-circle"></i> {error}</div>}

            {loading ? (
                <div style={styles.loadingContainer}>
                    <div style={styles.loadingSpinner}></div>
                    <p>Loading projects...</p>
                </div>
            ) : filteredProjects.length === 0 ? (
                <div style={styles.noProjects}>
                    <p>No projects found. {searchTerm || statusFilter !== 'all' ? 'Try adjusting your filters.' : 'Create your first project to get started!'}</p>
                </div>
            ) : (
                <div style={styles.projectsTableContainer}>
                    <table style={styles.projectsTable}>
                        <thead>
                            <tr>
                                <th style={{...styles.tableHeader, ...styles.expandColumn}}></th>
                                <th 
                                    onClick={() => handleSort('title')} 
                                    style={{...styles.tableHeader, ...styles.projectColumn}}
                                >
                                    Project {getSortIcon('title')}
                                </th>
                                <th 
                                    onClick={() => handleSort('status')} 
                                    style={{...styles.tableHeader, ...styles.statusColumn}}
                                >
                                    Status {getSortIcon('status')}
                                </th>
                                <th 
                                    onClick={() => handleSort('clientName')} 
                                    style={{...styles.tableHeader, ...styles.clientColumn}}
                                >
                                    Client {getSortIcon('clientName')}
                                </th>
                                <th 
                                    onClick={() => handleSort('startDate')} 
                                    style={{...styles.tableHeader, ...styles.dateColumn}}
                                >
                                    Start Date {getSortIcon('startDate')}
                                </th>
                                <th 
                                    onClick={() => handleSort('createdAt')} 
                                    style={{...styles.tableHeader, ...styles.dateColumn}}
                                >
                                    Created {getSortIcon('createdAt')}
                                </th>
                                <th style={{...styles.tableHeader, ...styles.bidsColumn}}>Bids</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProjects.map(project => (
                                <React.Fragment key={project.id}>
                                    <tr
                                        style={styles.projectRow}
                                        onClick={() => toggleExpandProject(project.id)}
                                    >
                                        <td style={styles.expandCell}>
                                            <button style={styles.expandButton}>
                                                <i className={`fas fa-chevron-${expandedProjectId === project.id ? 'down' : 'right'}`}></i>
                                            </button>
                                        </td>
                                        <td
                                            style={{...styles.tableCell, ...styles.projectTitleCell}}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleProjectClick(project.id);
                                            }}
                                        >
                                            {project.title || 'Untitled Project'}
                                        </td>
                                        <td style={styles.statusCell}>
                                            <div
                                                style={{
                                                    ...styles.statusIndicator,
                                                    backgroundColor: getStatusColor(project.status)
                                                }}
                                            >
                                                {project.status || 'Pending'}
                                            </div>
                                        </td>
                                        <td style={styles.tableCell}>{project.clientName || 'N/A'}</td>
                                        <td style={styles.tableCell}>{formatDate(project.startDate)}</td>
                                        <td style={styles.tableCell}>{formatDate(project.createdAt)}</td>
                                        <td style={styles.bidsCountCell}>
                                            {projectBids[project.id] ?
                                                projectBids[project.id].length :
                                                <button
                                                    style={styles.viewBidsBtn}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleExpandProject(project.id);
                                                    }}
                                                >
                                                    View Bids
                                                </button>
                                            }
                                        </td>
                                    </tr>
                                    {expandedProjectId === project.id && (
                                        <tr style={styles.bidsRow}>
                                            <td colSpan="7" style={styles.bidsCell}>
                                                <div style={styles.bidsSection}>
                                                    <h3 style={styles.bidsSectionTitle}>Bids for {project.title}</h3>
                                                    {actionSuccess && (
                                                        <div style={styles.successMessage}>
                                                            <i className="fas fa-check-circle"></i> {actionSuccess}
                                                        </div>
                                                    )}
                                                    {actionError && (
                                                        <div style={styles.errorMessage}>
                                                            <i className="fas fa-exclamation-circle"></i> {actionError}
                                                        </div>
                                                    )}
                                                    {loadingBids[project.id] ? (
                                                        <div style={styles.loadingBids}>
                                                            <div style={styles.loadingSpinner}></div>
                                                            <p>Loading bids...</p>
                                                        </div>
                                                    ) : projectBids[project.id]?.length > 0 ? (
                                                        <div style={styles.bidsTableContainer}>
                                                            {projectBids[project.id].some(bid => bid.status === 'accepted') && (
                                                                <div style={styles.bidAcceptedMessage}>
                                                                    <i className="fas fa-info-circle"></i> A bid has already been accepted for this project. Other bids cannot be modified.
                                                                </div>
                                                            )}
                                                            <table style={styles.bidsTable}>
                                                                <thead>
                                                                    <tr>
                                                                        <th style={{...styles.tableHeader, width: '25%'}}>Contractor</th>
                                                                        <th style={{...styles.tableHeader, width: '15%'}}>Amount</th>
                                                                        <th style={{...styles.tableHeader, width: '20%'}}>Submitted</th>
                                                                        <th style={{...styles.tableHeader, width: '15%'}}>Status</th>
                                                                        <th style={{...styles.tableHeader, width: '25%'}}>Actions</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {projectBids[project.id].map(bid => {
                                                                        // Check if any bid in this project has been accepted
                                                                        const projectHasAcceptedBid = projectBids[project.id].some(b => b.status === 'accepted');

                                                                        return (
                                                                            <tr key={bid.id} style={styles.bidRow}>
                                                                                <td style={styles.contractorCell}>
                                                                                    <Link
                                                                                        to={`/contractor/${bid.contractorId}`}
                                                                                        style={styles.contractorLink}
                                                                                    >
                                                                                        {bid.contractorDisplayName}
                                                                                    </Link>
                                                                                </td>
                                                                                <td style={styles.bidAmountCell}>
                                                                                    ${parseFloat(bid.amount).toLocaleString(undefined, {
                                                                                        minimumFractionDigits: 2,
                                                                                        maximumFractionDigits: 2
                                                                                    })}
                                                                                </td>
                                                                                <td style={styles.dateCell}>{formatDate(bid.createdAt)}</td>
                                                                                <td style={{
                                                                                    ...styles.tableCell,
                                                                                    ...styles[`status${bid.status ? bid.status.charAt(0).toUpperCase() + bid.status.slice(1) : 'Pending'}`]
                                                                                }}>
                                                                                    {bid.status || 'Pending'}
                                                                                </td>
                                                                                <td style={styles.actionsCell}>
                                                                                    <Link
                                                                                        to={`/project/${project.id}/bid/${bid.id}`}
                                                                                        style={styles.viewBidBtn}
                                                                                    >
                                                                                        <i className="fas fa-eye"></i> View
                                                                                    </Link>
                                                                                    {(!bid.status || bid.status === 'pending') && !projectHasAcceptedBid && (
                                                                                        <>
                                                                                            <button
                                                                                                style={{
                                                                                                    ...styles.acceptBidBtn,
                                                                                                    opacity: loadingBidActions[bid.id] ? 0.7 : 1,
                                                                                                    cursor: loadingBidActions[bid.id] ? 'not-allowed' : 'pointer'
                                                                                                }}
                                                                                                onClick={(e) => handleBidStatusChange(
                                                                                                    e,
                                                                                                    bid.id,
                                                                                                    project.id,
                                                                                                    'accepted',
                                                                                                    bid.contractorId
                                                                                                )}
                                                                                                disabled={loadingBidActions[bid.id]}
                                                                                            >
                                                                                                {loadingBidActions[bid.id] ? (
                                                                                                    <span>Processing...</span>
                                                                                                ) : (
                                                                                                    <>
                                                                                                        <i className="fas fa-check"></i> Accept
                                                                                                    </>
                                                                                                )}
                                                                                            </button>
                                                                                            <button
                                                                                                style={{
                                                                                                    ...styles.rejectBidBtn,
                                                                                                    opacity: loadingBidActions[bid.id] ? 0.7 : 1,
                                                                                                    cursor: loadingBidActions[bid.id] ? 'not-allowed' : 'pointer'
                                                                                                }}
                                                                                                onClick={(e) => handleBidStatusChange(
                                                                                                    e,
                                                                                                    bid.id,
                                                                                                    project.id,
                                                                                                    'rejected',
                                                                                                    bid.contractorId
                                                                                                )}
                                                                                                disabled={loadingBidActions[bid.id]}
                                                                                            >
                                                                                                {loadingBidActions[bid.id] ? (
                                                                                                    <span>Processing...</span>
                                                                                                ) : (
                                                                                                    <>
                                                                                                        <i className="fas fa-times"></i> Reject
                                                                                                    </>
                                                                                                )}
                                                                                            </button>
                                                                                        </>
                                                                                    )}
                                                                                </td>
                                                                            </tr>
                                                                        );
                                                                    })}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    ) : (
                                                        <div style={styles.noBidsMessage}>
                                                            <p>No bids have been submitted for this project yet.</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showNewProjectForm && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)',
                        width: '90%',
                        maxWidth: '800px',
                        maxHeight: '90vh',
                        overflow: 'auto'
                    }}>
                        <NewProjectForm
                            onCancel={() => setShowNewProjectForm(false)}
                            onSuccess={handleProjectCreated}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyProjects;
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
import './MyProjects.css';

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
            <div className="access-denied">
                <h2>Access Denied</h2>
                <p>You must be logged in as a prime to view this page.</p>
            </div>
        );
    }

    return (
        <div className="my-projects-container">
            <div className="projects-header">
                <h1>{t('myProjects')}</h1>
                <button className="create-project-btn" onClick={() => setShowNewProjectForm(true)}>
                    <i className="fas fa-plus"></i> Create New Project
                </button>
            </div>

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

                <div className="filter-container">
                    <label htmlFor="status-filter">Status:</label>
                    <select
                        id="status-filter"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="status-filter"
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

            {error && <div className="error-message">{error}</div>}

            {loading ? (
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading projects...</p>
                </div>
            ) : filteredProjects.length === 0 ? (
                <div className="no-projects">
                    <p>No projects found. {searchTerm || statusFilter !== 'all' ? 'Try adjusting your filters.' : 'Create your first project to get started!'}</p>
                </div>
            ) : (
                <div className="projects-table-container">
                    <table className="projects-table">
                        <thead>
                            <tr>
                                <th className="expand-column"></th>
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
                                <th onClick={() => handleSort('createdAt')} className="date-column">
                                    Created {getSortIcon('createdAt')}
                                </th>
                                <th className="bids-column">Bids</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProjects.map(project => (
                                <React.Fragment key={project.id}>
                                    <tr
                                        className="project-row"
                                        onClick={() => toggleExpandProject(project.id)}
                                    >
                                        <td className="expand-cell">
                                            <button className="expand-button">
                                                <i className={`fas fa-chevron-${expandedProjectId === project.id ? 'down' : 'right'}`}></i>
                                            </button>
                                        </td>
                                        <td
                                            className="project-title-cell"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleProjectClick(project.id);
                                            }}
                                        >
                                            {project.title || 'Untitled Project'}
                                        </td>
                                        <td className="status-cell">
                                            <div
                                                className="status-indicator"
                                                style={{ backgroundColor: getStatusColor(project.status) }}
                                            >
                                                {project.status || 'Pending'}
                                            </div>
                                        </td>
                                        <td>{project.clientName || 'N/A'}</td>
                                        <td>{formatDate(project.startDate)}</td>
                                        <td>{formatDate(project.createdAt)}</td>
                                        <td className="bids-count-cell">
                                            {projectBids[project.id] ?
                                                projectBids[project.id].length :
                                                <button
                                                    className="view-bids-btn"
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
                                        <tr className="bids-row">
                                            <td colSpan="7" className="bids-cell">
                                                <div className="bids-section">
                                                    <h3 className="bids-section-title">Bids for {project.title}</h3>
                                                    {actionSuccess && (
                                                        <div className="success-message">
                                                            <i className="fas fa-check-circle"></i> {actionSuccess}
                                                        </div>
                                                    )}
                                                    {actionError && (
                                                        <div className="error-message">
                                                            <i className="fas fa-exclamation-circle"></i> {actionError}
                                                        </div>
                                                    )}
                                                    {loadingBids[project.id] ? (
                                                        <div className="loading-bids">
                                                            <div className="loading-spinner"></div>
                                                            <p>Loading bids...</p>
                                                        </div>
                                                    ) : projectBids[project.id]?.length > 0 ? (
                                                        <div className="bids-table-container">
                                                            {projectBids[project.id].some(bid => bid.status === 'accepted') && (
                                                                <div className="bid-accepted-message">
                                                                    <i className="fas fa-info-circle"></i> A bid has already been accepted for this project. Other bids cannot be modified.
                                                                </div>
                                                            )}
                                                            <table className="bids-table">
                                                                <thead>
                                                                    <tr>
                                                                        <th className="contractor-column">Contractor</th>
                                                                        <th className="amount-column">Amount</th>
                                                                        <th className="date-column">Submitted</th>
                                                                        <th className="status-column">Status</th>
                                                                        <th className="actions-column">Actions</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {projectBids[project.id].map(bid => {
                                                                        // Check if any bid in this project has been accepted
                                                                        const projectHasAcceptedBid = projectBids[project.id].some(b => b.status === 'accepted');

                                                                        return (
                                                                            <tr key={bid.id} className="bid-row">
                                                                                <td className="contractor-cell">
                                                                                    <Link
                                                                                        to={`/contractor/${bid.contractorId}`}
                                                                                        className="contractor-link"
                                                                                    >
                                                                                        {bid.contractorDisplayName}
                                                                                    </Link>
                                                                                </td>
                                                                                <td className="bid-amount-cell">
                                                                                    ${parseFloat(bid.amount).toLocaleString(undefined, {
                                                                                        minimumFractionDigits: 2,
                                                                                        maximumFractionDigits: 2
                                                                                    })}
                                                                                </td>
                                                                                <td className="date-cell">{formatDate(bid.createdAt)}</td>
                                                                                <td className={`status-cell ${getBidStatusClass(bid.status)}`}>
                                                                                    {bid.status || 'Pending'}
                                                                                </td>
                                                                                <td className="actions-cell">
                                                                                    <Link
                                                                                        to={`/project/${project.id}/bid/${bid.id}`}
                                                                                        className="view-bid-btn"
                                                                                    >
                                                                                        <i className="fas fa-eye"></i> View
                                                                                    </Link>
                                                                                    {(!bid.status || bid.status === 'pending') && !projectHasAcceptedBid && (
                                                                                        <>
                                                                                            <button
                                                                                                className="accept-bid-btn"
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
                                                                                                className="reject-bid-btn"
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
                                                        <div className="no-bids-message">
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
        </div>
    );
};

export default MyProjects;
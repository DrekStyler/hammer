import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, arrayRemove, addDoc, Timestamp, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { useRole } from '../contexts/RoleContext';
import useTranslation from '../utils/useTranslation';
import { getProjectById, getAllContractors, getContractorsByUser, createProjectInvitation } from '../api/dataService';
import ProjectEditForm from '../components/ProjectEditForm';
import ProjectImages from '../components/ProjectImages';

// Comprehensive styles object
const styles = {
    // Container and layout
    detailPage: {
        padding: '30px',
        maxWidth: '1200px',
        margin: '0 auto',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    },
    detailHeader: {
        marginBottom: '32px',
        borderBottom: '1px solid #e2e8f0',
        paddingBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '24px'
    },
    headerTitle: {
        fontSize: '28px',
        fontWeight: '600',
        color: '#2d3748',
        margin: 0
    },
    backButton: {
        backgroundColor: '#f7fafc',
        color: '#4a5568',
        border: 'none',
        padding: '8px 16px',
        borderRadius: '6px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '14px',
        fontWeight: '500',
        transition: 'background-color 0.2s ease',
        '&:hover': {
            backgroundColor: '#edf2f7'
        }
    },
    detailContent: {
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '32px'
    },

    // Info section
    infoSection: {
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        padding: '24px',
        border: '1px solid #e2e8f0'
    },
    sectionTitle: {
        fontSize: '20px',
        fontWeight: '600',
        color: '#2d3748',
        marginBottom: '24px'
    },
    infoGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '20px'
    },
    infoItem: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
    },
    infoLabel: {
        fontSize: '14px',
        color: '#718096',
        fontWeight: '500'
    },
    infoValue: {
        fontSize: '16px',
        color: '#2d3748'
    },

    // Status messages
    statusMessage: {
        padding: '12px 16px',
        borderRadius: '6px',
        marginBottom: '20px',
        fontSize: '14px'
    },
    successMessage: {
        backgroundColor: '#c6f6d5',
        color: '#2f855a',
        border: '1px solid #9ae6b4'
    },
    errorMessage: {
        backgroundColor: '#fed7d7',
        color: '#c53030',
        border: '1px solid #feb2b2'
    },

    // Bids section
    bidsSection: {
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        padding: '24px',
        border: '1px solid #e2e8f0'
    },
    bidCard: {
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '16px',
        backgroundColor: '#f8fafc',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }
    },
    bidHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px'
    },
    bidContractor: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
    },
    contractorAvatar: {
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        backgroundColor: '#4299e1',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: '600',
        fontSize: '16px'
    },
    bidAmount: {
        fontSize: '20px',
        fontWeight: '600',
        color: '#2d3748'
    },
    bidMessage: {
        color: '#4a5568',
        margin: '12px 0',
        lineHeight: '1.5'
    },
    bidActions: {
        display: 'flex',
        gap: '8px',
        marginTop: '12px'
    },
    actionButton: {
        padding: '8px 16px',
        borderRadius: '6px',
        border: 'none',
        cursor: 'pointer',
        fontWeight: '500',
        fontSize: '14px',
        transition: 'background-color 0.2s ease'
    },
    acceptButton: {
        backgroundColor: '#48bb78',
        color: 'white',
        '&:hover': {
            backgroundColor: '#38a169'
        }
    },
    rejectButton: {
        backgroundColor: '#f56565',
        color: 'white',
        '&:hover': {
            backgroundColor: '#e53e3e'
        }
    },
    pendingBadge: {
        backgroundColor: '#edf2f7',
        color: '#4a5568',
        padding: '4px 8px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '500'
    },
    acceptedBadge: {
        backgroundColor: '#c6f6d5',
        color: '#2f855a',
        padding: '4px 8px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '500'
    },
    rejectedBadge: {
        backgroundColor: '#fed7d7',
        color: '#c53030',
        padding: '4px 8px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '500'
    },

    // Loading state
    loadingSpinner: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '40px',
        color: '#4299e1',
        fontSize: '24px'
    },

    // Error state
    errorContainer: {
        maxWidth: '600px',
        margin: '40px auto',
        textAlign: 'center',
        padding: '24px',
        backgroundColor: '#fff5f5',
        borderRadius: '8px',
        border: '1px solid #fed7d7'
    },
    errorTitle: {
        color: '#c53030',
        fontSize: '20px',
        marginBottom: '16px'
    },
    errorText: {
        color: '#718096',
        fontSize: '16px',
        lineHeight: '1.5'
    }
};

const ProjectDetailPage = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { isPrime } = useRole();
    const { t } = useTranslation();

    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [contractors, setContractors] = useState([]);
    const [projectContractors, setProjectContractors] = useState([]);
    const [contractorsLoading, setContractorsLoading] = useState(true);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [selectedContractors, setSelectedContractors] = useState([]);
    const [invitationMessage, setInvitationMessage] = useState('');
    const [inviteSuccess, setInviteSuccess] = useState('');
    const [inviteError, setInviteError] = useState('');
    const [isRemoving, setIsRemoving] = useState(false);
    const [removeError, setRemoveError] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editSuccess, setEditSuccess] = useState('');

    // Add bid-related state
    const [bids, setBids] = useState([]);
    const [loadingBids, setLoadingBids] = useState(false);
    const [bidError, setBidError] = useState(null);
    const [showBidModal, setShowBidModal] = useState(false);
    const [bidAmount, setBidAmount] = useState('');
    const [bidMessage, setBidMessage] = useState('');
    const [submittingBid, setSubmittingBid] = useState(false);
    const [bidSuccess, setBidSuccess] = useState('');

    // Fetch project data
    useEffect(() => {
        const fetchProject = async () => {
            if (!projectId || !currentUser) return;

            setLoading(true);
            setError(null);

            try {
                // Get project data using dataService
                const projectData = await getProjectById(projectId);

                if (!projectData) {
                    throw new Error("Project not found");
                }

                // Check if the current user has access to this project
                if (projectData.createdBy !== currentUser.uid &&
                    (!projectData.invitedUsers || !projectData.invitedUsers.includes(currentUser.uid))) {
                    throw new Error("You don't have access to this project");
                }

                setProject(projectData);

                // After setting the project, fetch the bids
                fetchBids(projectData.id);
            } catch (err) {
                console.error("Error fetching project:", err);
                setError(err.message || "Failed to load project details");
            } finally {
                setLoading(false);
            }
        };

        fetchProject();
    }, [projectId, currentUser]);

    // Fetch bids for the project
    const fetchBids = async (projectId) => {
        if (!projectId) return;

        setLoadingBids(true);
        setBidError(null);

        try {
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
                            const userDoc = await getDoc(doc(db, 'users', bid.contractorId));
                            if (userDoc.exists()) {
                                const userData = userDoc.data();
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

            setBids(enhancedBids);
        } catch (err) {
            console.error("Error fetching bids:", err);
            setBidError("Failed to load bids for this project.");
        } finally {
            setLoadingBids(false);
        }
    };

    // Add functions to handle bid actions
    const handleBidStatusChange = async (bidId, newStatus) => {
        if (!bidId || !newStatus) return;

        try {
            setLoading(true);
            setError(null);

            // Update the bid status in Firestore
            const bidRef = doc(db, 'bids', bidId);
            await updateDoc(bidRef, {
                status: newStatus,
                updatedAt: Timestamp.now()
            });

            // If accepted, update project status or other fields
            if (newStatus === 'accepted') {
                // Update project status
                const projectRef = doc(db, 'projects', projectId);
                await updateDoc(projectRef, {
                    status: 'In Progress',
                    biddingStatus: 'closed', // Close bidding when a bid is accepted
                    updatedAt: Timestamp.now()
                });

                // Get the bid object
                const bid = bids.find(b => b.id === bidId);

                // Send notification to the bidder
                await addDoc(collection(db, 'messages'), {
                    recipientId: bid.contractorId,
                    senderId: currentUser.uid,
                    senderName: currentUser.displayName || 'Project Owner',
                    type: 'bid',
                    title: `Bid Accepted: ${project.title}`,
                    content: `Your bid of $${bid.amount} for project "${project.title}" has been accepted!`,
                    projectId: project.id,
                    bidId: bidId,
                    read: false,
                    createdAt: Timestamp.now()
                });
            } else if (newStatus === 'rejected') {
                // Get the bid object
                const bid = bids.find(b => b.id === bidId);

                // Send notification to the bidder
                await addDoc(collection(db, 'messages'), {
                    recipientId: bid.contractorId,
                    senderId: currentUser.uid,
                    senderName: currentUser.displayName || 'Project Owner',
                    type: 'bid',
                    title: `Bid Rejected: ${project.title}`,
                    content: `Your bid of $${bid.amount} for project "${project.title}" has been rejected.`,
                    projectId: project.id,
                    bidId: bidId,
                    read: false,
                    createdAt: Timestamp.now()
                });
            }

            // Refresh bids after status change
            fetchBids(projectId);

            setBidSuccess(`Bid ${newStatus} successfully!`);
            setTimeout(() => setBidSuccess(''), 3000);
        } catch (err) {
            console.error(`Error ${newStatus} bid:`, err);
            setError(`Failed to ${newStatus} bid. Please try again.`);
        } finally {
            setLoading(false);
        }
    };

    // Helper functions for bids
    const getBidStatusClass = (status) => {
        if (!status || status === 'pending') return 'pending';
        return status.toLowerCase(); // 'accepted' or 'rejected'
    };

    const getBidStatusText = (status) => {
        if (!status || status === 'pending') return 'Pending';
        if (status === 'accepted') return 'Accepted';
        if (status === 'rejected') return 'Rejected';
        return status;
    };

    // Fetch contractors and project contractors
    useEffect(() => {
        const fetchContractors = async () => {
            if (!currentUser || !projectId) return;

            setContractorsLoading(true);

            try {
                // Get user's contractors instead of all contractors
                const userContractors = await getContractorsByUser();
                setContractors(userContractors);

                // Get project-specific invited contractors
                // This would come from your project invitations junction table
                if (project && project.invitedContractors) {
                    setProjectContractors(project.invitedContractors);
                }
            } catch (err) {
                console.error("Error fetching contractors:", err);
            } finally {
                setContractorsLoading(false);
            }
        };

        fetchContractors();
    }, [currentUser, projectId, project]);

    const handleInviteContractors = () => {
        setShowInviteModal(true);
        setSelectedContractors([]);
        setInvitationMessage('');
        setInviteSuccess('');
        setInviteError('');
    };

    const handleContractorSelection = (contractorId) => {
        setSelectedContractors(prevSelected => {
            if (prevSelected.includes(contractorId)) {
                return prevSelected.filter(id => id !== contractorId);
            } else {
                return [...prevSelected, contractorId];
            }
        });
    };

    const handleSendInvitations = async () => {
        if (selectedContractors.length === 0) {
            setInviteError("Please select at least one contractor");
            return;
        }

        try {
            // Create invitations for each selected contractor
            for (const contractorId of selectedContractors) {
                const invitationData = {
                    projectId: projectId,
                    contractorId: contractorId,
                    message: invitationMessage,
                    status: 'pending',
                    sentBy: currentUser.uid,
                    sentAt: new Date().toISOString()
                };

                await createProjectInvitation(invitationData);
            }

            setInviteSuccess(`Invitations sent to ${selectedContractors.length} contractor(s)`);

            // Clear selection
            setSelectedContractors([]);
            setInvitationMessage('');

            // Close modal after a delay
            setTimeout(() => {
                setShowInviteModal(false);
                setInviteSuccess('');
            }, 2000);
        } catch (err) {
            console.error("Error sending invitations:", err);
            setInviteError(err.message || "Failed to send invitations");
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

    const getInitials = (name) => {
        if (!name) return '?';
        return name
            .split(' ')
            .map(part => part[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    const getRandomColor = (name) => {
        if (!name) return '#cccccc';

        // Generate a consistent color based on the name
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }

        const hue = Math.abs(hash) % 360;
        return `hsl(${hue}, 65%, 60%)`;
    };

    // Add function to handle removing a contractor from the project
    const handleRemoveContractor = async (contractorId) => {
        if (!currentUser || !projectId || isRemoving) return;

        if (!window.confirm('Are you sure you want to remove this contractor from the project?')) {
            return;
        }

        setIsRemoving(true);
        setRemoveError(null);

        try {
            // Reference to the project document
            const projectRef = doc(db, 'projects', projectId);

            // Update the project to remove the contractor from invitedUsers array
            await updateDoc(projectRef, {
                invitedUsers: arrayRemove(contractorId)
            });

            // Update the local state to remove the contractor from the list
            setProjectContractors(prev =>
                prev.filter(contractor => contractor.id !== contractorId)
            );

        } catch (err) {
            console.error("Error removing contractor:", err);
            setRemoveError("Failed to remove contractor. Please try again.");
            setTimeout(() => setRemoveError(null), 3000);
        } finally {
            setIsRemoving(false);
        }
    };

    // Add function to open bid modal
    const openBidModal = () => {
        setBidAmount('');
        setBidMessage('');
        setBidError(null);
        setBidSuccess('');
        setShowBidModal(true);
    };

    // Add function to close bid modal
    const closeBidModal = () => {
        setShowBidModal(false);
    };

    // Add function to handle bid submission
    const handleBidSubmit = async (e) => {
        e.preventDefault();

        if (!bidAmount || isNaN(parseFloat(bidAmount)) || parseFloat(bidAmount) <= 0) {
            setBidError('Please enter a valid bid amount');
            return;
        }

        setSubmittingBid(true);
        setBidError(null);

        try {
            // Get current user's profile
            const userProfileDoc = await getDoc(doc(db, 'users', currentUser.uid));
            const userProfile = userProfileDoc.exists() ? userProfileDoc.data() : {};

            // Use company name if available or fall back to display name
            const contractorDisplayName = userProfile.companyName ||
                userProfile.businessName ||
                currentUser.displayName ||
                'Unknown';

            // Add bid to Firestore
            const bidData = {
                projectId: projectId,
                contractorId: currentUser.uid,
                contractorName: currentUser.displayName || 'Unknown',
                contractorDisplayName: contractorDisplayName,
                amount: parseFloat(bidAmount),
                message: bidMessage,
                status: 'pending',
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now()
            };

            const docRef = await addDoc(collection(db, 'bids'), bidData);

            // Send notification to project owner
            await addDoc(collection(db, 'messages'), {
                recipientId: project.createdBy,
                senderId: currentUser.uid,
                senderName: currentUser.displayName || 'Contractor',
                type: 'bid',
                title: `New Bid: ${project.title}`,
                content: `A new bid of $${bidAmount} has been submitted for your project "${project.title}".`,
                projectId: projectId,
                bidId: docRef.id,
                read: false,
                createdAt: Timestamp.now()
            });

            // Show success message and close modal
            setBidSuccess('Bid submitted successfully!');
            setTimeout(() => {
                setShowBidModal(false);
                setBidSuccess('');
                // Refresh bids
                fetchBids(projectId);
            }, 2000);
        } catch (err) {
            console.error('Error submitting bid:', err);
            setBidError('Failed to submit bid. Please try again.');
        } finally {
            setSubmittingBid(false);
        }
    };

    // Render bids section
    const renderBidsSection = () => {
        if (loadingBids) {
            return <div className="loading-spinner">Loading bids...</div>;
        }

        if (bidError) {
            return <div className="error-message">{bidError}</div>;
        }

        if (bids.length === 0) {
            return (
                <div className="no-bids-message">
                    <p>No bids have been submitted for this project yet.</p>
                    {!isPrime && project?.biddingStatus === "open" && (
                        <button
                            className="submit-bid-btn"
                            onClick={openBidModal}
                        >
                            <i className="fas fa-gavel"></i> Submit a Bid
                        </button>
                    )}
                </div>
            );
        }

        return (
            <div className="bids-container">
                <div className="bids-summary">
                    <div className="bids-count">
                        <span>{bids.length} bid{bids.length !== 1 ? 's' : ''} total</span>
                    </div>
                    <div className="bids-status-summary">
                        <span className="status-badge status-accepted">
                            {bids.filter(bid => bid.status === 'accepted').length} Accepted
                        </span>
                        <span className="status-badge status-rejected">
                            {bids.filter(bid => bid.status === 'rejected').length} Rejected
                        </span>
                        <span className="status-badge status-pending">
                            {bids.filter(bid => !bid.status || bid.status === 'pending').length} Pending
                        </span>
                    </div>
                </div>

                <div className="bids-table-container">
                    <table className="bids-table">
                        <thead>
                            <tr>
                                <th>Bid Amount</th>
                                <th>Contractor</th>
                                <th>Submission Date</th>
                                <th>Status</th>
                                {isPrime && <th>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {bids.map(bid => (
                                <tr key={bid.id}>
                                    <td className="bid-amount">${bid.amount?.toLocaleString() || '0'}</td>
                                    <td className="contractor-name">
                                        <a
                                            href={`/contractor/${bid.contractorId}`}
                                            className="contractor-link"
                                        >
                                            {bid.contractorDisplayName || 'Unknown'}
                                        </a>
                                        {bid.contractorId === currentUser?.uid && (
                                            <span className="my-bid-tag">Your Bid</span>
                                        )}
                                        {bid.message && (
                                            <div className="bid-message-indicator" title={bid.message}>
                                                <i className="fas fa-comment-alt"></i>
                                                <div className="bid-message-tooltip">
                                                    <div className="bid-message-content">
                                                        {bid.message}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </td>
                                    <td className="submission-date">
                                        {new Date(bid.createdAt).toLocaleDateString()} {new Date(bid.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </td>
                                    <td className={`status-cell ${getBidStatusClass(bid.status)}`}>
                                        {getBidStatusText(bid.status)}
                                    </td>
                                    {isPrime && (
                                        <td className="actions-cell">
                                            {(!bid.status || bid.status === 'pending') ? (
                                                <div className="action-buttons">
                                                    <button
                                                        className="accept-bid-btn"
                                                        onClick={() => handleBidStatusChange(bid.id, 'accepted')}
                                                        disabled={loading}
                                                    >
                                                        <i className="fas fa-check"></i> Accept
                                                    </button>
                                                    <button
                                                        className="reject-bid-btn"
                                                        onClick={() => handleBidStatusChange(bid.id, 'rejected')}
                                                        disabled={loading}
                                                    >
                                                        <i className="fas fa-times"></i> Reject
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="no-action-text">No Action Available</span>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    // Add a function to handle successful project edits
    const handleEditSuccess = async (projectId) => {
        try {
            // Refetch the project data to get the updated version
            const updatedProject = await getProjectById(projectId);
            setProject(updatedProject);

            // Show success message
            setEditSuccess('Project updated successfully!');

            // Close the modal immediately
            setShowEditModal(false);

            // Keep the success message visible for a few seconds
            setTimeout(() => {
                setEditSuccess('');
            }, 4000);
        } catch (err) {
            console.error("Error refreshing project data:", err);
            // Still close the modal but show an info message that they'll need to refresh
            setEditSuccess('Project updated. Refresh the page to see all changes.');
            setShowEditModal(false);

            // Keep the success message visible for a few seconds
            setTimeout(() => {
                setEditSuccess('');
            }, 4000);
        }
    };

    if (loading) {
        return <div style={styles.loadingSpinner}>Loading...</div>;
    }

    if (error) {
        return (
            <div style={styles.errorContainer}>
                <h2 style={styles.errorTitle}>Error</h2>
                <p style={styles.errorText}>{error}</p>
            </div>
        );
    }

    if (!project) {
        return null;
    }

    return (
        <div style={styles.detailPage}>
            <div style={styles.detailHeader}>
                <div>
                    <h1 style={styles.headerTitle}>{project.title}</h1>
                    <p style={{ color: '#718096', marginTop: '8px' }}>{project.description}</p>
                </div>
                <button style={styles.backButton} onClick={() => navigate(-1)}>
                    ← Back
                </button>
            </div>

            <div style={styles.detailContent}>
                <div style={styles.infoSection}>
                    <h2 style={styles.sectionTitle}>Project Details</h2>
                    <div style={styles.infoGrid}>
                        <div style={styles.infoItem}>
                            <span style={styles.infoLabel}>Status</span>
                            <span style={styles.infoValue}>{project.status}</span>
                        </div>
                        <div style={styles.infoItem}>
                            <span style={styles.infoLabel}>Budget</span>
                            <span style={styles.infoValue}>${project.budget}</span>
                        </div>
                        <div style={styles.infoItem}>
                            <span style={styles.infoLabel}>Location</span>
                            <span style={styles.infoValue}>{project.location}</span>
                        </div>
                        <div style={styles.infoItem}>
                            <span style={styles.infoLabel}>Created</span>
                            <span style={styles.infoValue}>{formatDate(project.createdAt)}</span>
                        </div>
                    </div>
                </div>

                <div style={styles.bidsSection}>
                    <h2 style={styles.sectionTitle}>Bids</h2>
                    {bids.length === 0 ? (
                        <p style={{ color: '#718096', textAlign: 'center' }}>No bids yet</p>
                    ) : (
                        bids.map(bid => (
                            <div key={bid.id} style={styles.bidCard}>
                                <div style={styles.bidHeader}>
                                    <div style={styles.bidContractor}>
                                        <div style={styles.contractorAvatar}>
                                            {getInitials(bid.contractorDisplayName)}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '600' }}>{bid.contractorDisplayName}</div>
                                            <div style={{ color: '#718096', fontSize: '14px' }}>
                                                {formatDate(bid.createdAt)}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={styles.bidAmount}>${bid.amount}</div>
                                </div>
                                <p style={styles.bidMessage}>{bid.message}</p>
                                <div style={styles.bidActions}>
                                    {bid.status === 'pending' && isPrime && (
                                        <>
                                            <button
                                                style={{ ...styles.actionButton, ...styles.acceptButton }}
                                                onClick={() => handleBidStatusChange(bid.id, 'accepted')}
                                            >
                                                Accept
                                            </button>
                                            <button
                                                style={{ ...styles.actionButton, ...styles.rejectButton }}
                                                onClick={() => handleBidStatusChange(bid.id, 'rejected')}
                                            >
                                                Reject
                                            </button>
                                        </>
                                    )}
                                    <div style={bid.status === 'pending' ? styles.pendingBadge :
                                        bid.status === 'accepted' ? styles.acceptedBadge :
                                            styles.rejectedBadge}>
                                        {getBidStatusText(bid.status)}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProjectDetailPage;
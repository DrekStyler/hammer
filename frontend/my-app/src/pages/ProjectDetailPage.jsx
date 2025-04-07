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
import './ProjectDetailPage.css';

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
                                <th className="bid-amount-col">Bid Amount</th>
                                <th className="contractor-col">Contractor</th>
                                <th className="date-col">Submission Date</th>
                                <th className="status-col">Status</th>
                                {isPrime && <th className="actions-col">Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {bids.map(bid => (
                                <tr key={bid.id} className={getBidStatusClass(bid.status)}>
                                    <td className="bid-amount">${bid.amount?.toLocaleString() || '0'}</td>
                                    <td className="contractor-name">
                                        <Link
                                            to={`/contractor/${bid.contractorId}`}
                                            className="contractor-link"
                                        >
                                            {bid.contractorDisplayName}
                                        </Link>
                                        {!isPrime && bid.contractorId === currentUser?.uid && (
                                            <span className="my-bid-tag">Your Bid</span>
                                        )}
                                        {bid.message && (
                                            <div className="bid-message-indicator" title="View message">
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

                                    {/* Action buttons for prime users on pending bids */}
                                    {isPrime && (
                                        <td className="actions-cell">
                                            {(!bid.status || bid.status === 'pending') ? (
                                                <>
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
                                                </>
                                            ) : (
                                                <span>{bid.status === 'accepted' ? 'Accepted' : 'Rejected'}</span>
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
        return <div className="loading-spinner">{t('loading')}</div>;
    }

    if (error) {
        return (
            <div className="project-detail-error">
                <h2>Error</h2>
                <p>{error}</p>
                <button onClick={() => navigate('/projects')} className="back-button">
                    Back to Projects
                </button>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="project-detail-error">
                <h2>Project Not Found</h2>
                <button onClick={() => navigate('/projects')} className="back-button">
                    Back to Projects
                </button>
            </div>
        );
    }

    return (
        <div className="project-detail-page">
            <div className="navigation-controls">
                <button onClick={() => navigate('/projects')} className="back-button">
                    <i className="fas fa-arrow-left"></i> Back to Projects
                </button>

                {project.createdBy === currentUser?.uid && (
                    <button
                        className="edit-project-btn"
                        onClick={() => setShowEditModal(true)}
                    >
                        <i className="fas fa-edit"></i> Edit Project
                    </button>
                )}
            </div>

            {/* Show success message at the top level */}
            {editSuccess && (
                <div className="global-success-message">
                    <i className="fas fa-check-circle"></i> {editSuccess}
                </div>
            )}

            <div className="project-detail-header">
                <h1>{project.title || 'Untitled Project'}</h1>
            </div>

            <div className="project-detail-content">
                <div className="project-info-section">
                    <div className="section-header">
                        <h2>Project Information</h2>
                    </div>
                    <div className="project-info-grid">
                        <div className="info-item">
                            <span className="info-label">Status:</span>
                            <span className="info-value">
                                <span className={`status-badge status-${project.status?.toLowerCase() || 'draft'}`}>
                                    {project.status || 'Draft'}
                                </span>
                            </span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Description:</span>
                            <span className="info-value">{project.description || 'No description provided'}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Location:</span>
                            <span className="info-value">{project.location || 'No location specified'}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Client:</span>
                            <span className="info-value">{project.clientName || 'No client specified'}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Budget:</span>
                            <span className="info-value">
                                {project.budget ? `$${project.budget.toLocaleString()}` : 'Not specified'}
                            </span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Start Date:</span>
                            <span className="info-value">{formatDate(project.startDate)}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">End Date:</span>
                            <span className="info-value">{formatDate(project.endDate)}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Created:</span>
                            <span className="info-value">{formatDate(project.createdAt)}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Last Updated:</span>
                            <span className="info-value">{formatDate(project.updatedAt)}</span>
                        </div>
                    </div>
                </div>

                {/* Project Images Section */}
                <ProjectImages projectId={projectId} />

                <div className="project-contractors-section">
                    <div className="section-header">
                        <h2>Project Contractors</h2>
                        {isPrime && (
                            <button
                                className="invite-contractors-btn"
                                onClick={handleInviteContractors}
                            >
                                <i className="fas fa-user-plus"></i> Invite My Contractors
                            </button>
                        )}
                    </div>

                    {removeError && <div className="error-message">{removeError}</div>}

                    {contractorsLoading ? (
                        <div className="loading-spinner">Loading contractors...</div>
                    ) : projectContractors && projectContractors.length > 0 ? (
                        <div className="contractors-table-container">
                            <table className="contractors-table">
                                <thead>
                                    <tr>
                                        <th>Contractor</th>
                                        <th>Trade</th>
                                        <th>Email</th>
                                        <th>Phone</th>
                                        <th>Status</th>
                                        {(project.createdBy === currentUser?.uid || project.project_leader_id === currentUser?.uid) && (
                                            <th className="actions-column">Actions</th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {projectContractors.map(contractor => (
                                        <tr key={contractor.id}>
                                            <td className="contractor-name">
                                                <Link to={`/contractor/${contractor.id}`}>
                                                    {contractor.name || contractor.companyName || 'Unnamed Contractor'}
                                                </Link>
                                            </td>
                                            <td>{contractor.trade || 'No trade specified'}</td>
                                            <td>{contractor.email || 'No email'}</td>
                                            <td>{contractor.phone || 'No phone'}</td>
                                            <td>
                                                <span className={`status-badge status-${contractor.status?.toLowerCase() || 'pending'}`}>
                                                    {contractor.status || 'Pending'}
                                                </span>
                                            </td>
                                            {(project.createdBy === currentUser?.uid || project.project_leader_id === currentUser?.uid) && (
                                                <td className="actions-cell">
                                                    <button
                                                        className="remove-contractor-btn"
                                                        onClick={() => handleRemoveContractor(contractor.id)}
                                                        disabled={isRemoving}
                                                        aria-label="Remove contractor"
                                                    >
                                                        <i className="fas fa-times"></i>
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="no-contractors">
                            <p>No contractors have been invited to this project yet.</p>
                        </div>
                    )}
                </div>

                {/* Bids Section */}
                <div className="project-bids-section">
                    <div className="section-header">
                        <h2>Project Bids</h2>
                    </div>
                    {renderBidsSection()}
                </div>
            </div>

            {/* Invite Contractors Modal */}
            {showInviteModal && (
                <div className="modal-overlay">
                    <div className="modal-content invite-modal">
                        <div className="modal-header">
                            <h2>Invite My Contractors</h2>
                            <button
                                className="close-modal-btn"
                                onClick={() => setShowInviteModal(false)}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        {inviteSuccess && (
                            <div className="success-message">{inviteSuccess}</div>
                        )}

                        {inviteError && (
                            <div className="error-message">{inviteError}</div>
                        )}

                        <div className="invite-form">
                            <div className="form-group">
                                <label>Message (Optional):</label>
                                <textarea
                                    value={invitationMessage}
                                    onChange={(e) => setInvitationMessage(e.target.value)}
                                    placeholder="Add a message to the invitation..."
                                    rows="3"
                                ></textarea>
                            </div>

                            <div className="contractors-selection">
                                <h3>Select from My Contractors:</h3>

                                {contractors.length === 0 ? (
                                    <div className="no-contractors">
                                        <p>You haven't added any contractors yet. Go to My Contractors page to add contractors first.</p>
                                        <button
                                            className="go-to-contractors-btn"
                                            onClick={() => {
                                                setShowInviteModal(false);
                                                navigate('/my-contractors');
                                            }}
                                        >
                                            Go to My Contractors
                                        </button>
                                    </div>
                                ) : (
                                    <div className="contractors-grid">
                                        {contractors.map(contractor => (
                                            <div
                                                key={contractor.id}
                                                className={`contractor-select-card ${selectedContractors.includes(contractor.id) ? 'selected' : ''}`}
                                                onClick={() => handleContractorSelection(contractor.id)}
                                            >
                                                <div className="selection-indicator">
                                                    {selectedContractors.includes(contractor.id) && (
                                                        <i className="fas fa-check"></i>
                                                    )}
                                                </div>
                                                <div className="contractor-avatar"
                                                     style={{backgroundColor: getRandomColor(contractor.name)}}
                                                     aria-label={`Avatar for ${contractor.name || contractor.companyName || 'Unnamed Contractor'}`}
                                                     title={contractor.name || contractor.companyName || 'Unnamed Contractor'}>
                                                    <span>{getInitials(contractor.name || contractor.companyName)}</span>
                                                </div>
                                                <div className="contractor-info">
                                                    <h4>{contractor.name || contractor.companyName || 'Unnamed'}</h4>
                                                    <p>{contractor.trade || 'No trade specified'}</p>
                                                    <p>{contractor.email || 'No email'}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="form-actions">
                                <button
                                    className="cancel-btn"
                                    onClick={() => setShowInviteModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="send-invites-btn"
                                    onClick={handleSendInvitations}
                                    disabled={selectedContractors.length === 0}
                                >
                                    Send Invitations ({selectedContractors.length})
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Bid Modal */}
            {showBidModal && (
                <div className="modal-overlay">
                    <div className="modal-content bid-modal">
                        <div className="modal-header">
                            <h2>Submit a Bid</h2>
                            <button
                                className="close-modal-btn"
                                onClick={closeBidModal}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        {bidSuccess && (
                            <div className="success-message">{bidSuccess}</div>
                        )}

                        {bidError && (
                            <div className="error-message">{bidError}</div>
                        )}

                        <div className="bid-form">
                            <div className="form-group">
                                <label>Bid Amount:</label>
                                <input
                                    type="text"
                                    value={bidAmount}
                                    onChange={(e) => setBidAmount(e.target.value)}
                                    placeholder="Enter bid amount"
                                />
                            </div>

                            <div className="form-group">
                                <label>Message (Optional):</label>
                                <textarea
                                    value={bidMessage}
                                    onChange={(e) => setBidMessage(e.target.value)}
                                    placeholder="Add a message to the bid..."
                                    rows="3"
                                ></textarea>
                            </div>

                            <div className="form-actions">
                                <button
                                    className="cancel-btn"
                                    onClick={closeBidModal}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="submit-bid-btn"
                                    onClick={handleBidSubmit}
                                    disabled={submittingBid}
                                >
                                    Submit Bid
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Project Modal */}
            {showEditModal && (
                <div className="modal-overlay">
                    <div className="modal-content edit-modal">
                        <div className="modal-header">
                            <h2>Edit Project</h2>
                            <button
                                className="close-modal-btn"
                                onClick={() => setShowEditModal(false)}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        {editSuccess && (
                            <div className="success-message">{editSuccess}</div>
                        )}

                        <ProjectEditForm
                            project={project}
                            onSuccess={handleEditSuccess}
                            onCancel={() => setShowEditModal(false)}
                            onError={(errorMessage) => {
                                setError(errorMessage);
                                setEditSuccess('');
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectDetailPage;
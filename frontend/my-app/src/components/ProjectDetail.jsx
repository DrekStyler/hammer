import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getContractorsByUser, createProjectInvitation } from "../api/dataService";
import { db } from '../firebase/config';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  Timestamp,
  addDoc,
  arrayUnion
} from 'firebase/firestore';
import ProjectEditForm from "./ProjectEditForm";

function ProjectDetail({ project, onClose, userType }) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Payment status state
  const [paymentStatus, setPaymentStatus] = useState(
    project.paymentStatus || "unpaid"
  );
  const [isEditingPayment, setIsEditingPayment] = useState(false);

  // Inline editing state
  const [isEditingFields, setIsEditingFields] = useState(false);
  const [editableProject, setEditableProject] = useState({ ...project });

  // Contractor invitation state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [contractors, setContractors] = useState([]);
  const [contractorsLoading, setContractorsLoading] = useState(false);
  const [selectedContractors, setSelectedContractors] = useState([]);
  const [invitationMessage, setInvitationMessage] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [inviteError, setInviteError] = useState('');

  // Add bid-related state in the component
  const [bids, setBids] = useState([]);
  const [loadingBids, setLoadingBids] = useState(false);
  const [bidError, setBidError] = useState(null);

  // Add state for the bid modal
  const [showBidModal, setShowBidModal] = useState(false);
  const [bidAmount, setBidAmount] = useState("");
  const [bidMessage, setBidMessage] = useState("");
  const [submittingBid, setSubmittingBid] = useState(false);

  // Add state for showing edit form
  const [showEditForm, setShowEditForm] = useState(false);

  const API_URL = "/api";

  const paymentStatusOptions = [
    { value: "unpaid", label: "Unpaid" },
    { value: "invoiced", label: "Invoiced" },
    { value: "overdue", label: "Overdue" },
    { value: "paid", label: "Paid" },
    { value: "void", label: "Void" },
  ];

  // Editable field definitions
  const editableFields = [
    { key: "client", label: "Client", type: "text" },
    { key: "address", label: "Address", type: "text" },
    { key: "description", label: "Description", type: "textarea" },
    { key: "payment", label: "Total Price", type: "currency", prefix: "$" }
  ];

  // Fetch contractors when invite modal is opened
  useEffect(() => {
    if (showInviteModal && currentUser) {
      fetchContractors();
    }
  }, [showInviteModal, currentUser]);

  // Load bids when component mounts
  useEffect(() => {
    if (project && project.id) {
      fetchBids();
    }
  }, [project]);

  // Determine if the current user is allowed to edit this project
  useEffect(() => {
    if (!project || !currentUser) return;

    // Check for access permissions
    if (project.createdBy !== currentUser?.uid && userType !== "prime" && userType !== "CONTRACTOR") {
      setError("You don't have permission to edit this project.");
      setIsEditingFields(false);
    }
  }, [project, currentUser, userType]);

  // Function to fetch user's contractors
  const fetchContractors = async () => {
    setContractorsLoading(true);
    try {
      const userContractors = await getContractorsByUser();
      setContractors(userContractors);
    } catch (err) {
      console.error("Error fetching contractors:", err);
      setInviteError("Failed to load contractors. Please try again.");
    } finally {
      setContractorsLoading(false);
    }
  };

  // Function to handle inline field changes
  const handleFieldChange = (field, value) => {
    setEditableProject(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Function to save all inline edits
  const saveInlineEdits = async () => {
    try {
      setLoading(true);
      setError("");

      // Check if user has permission to save changes
      if (project.createdBy !== currentUser?.uid && userType !== "prime" && userType !== "CONTRACTOR") {
        setError("You don't have permission to edit this project.");
        setIsEditingFields(false);
        return;
      }

      // Update the project document in Firestore
      const projectRef = doc(db, 'projects', project.id);
      await updateDoc(projectRef, {
        ...editableProject,
        updatedAt: Timestamp.now(),
        lastUpdatedBy: currentUser?.uid
      });

      // If a contractor is making edits, send notification to project owner
      if (userType === "CONTRACTOR" && project.createdBy !== currentUser?.uid) {
        await addDoc(collection(db, 'messages'), {
          recipientId: project.createdBy,
          senderId: currentUser.uid,
          senderName: currentUser.displayName || 'A contractor',
          type: 'project_update',
          title: `Project "${project.title}" was updated`,
          content: `${currentUser.displayName || 'A contractor'} has made updates to your project.`,
          projectId: project.id,
          read: false,
          createdAt: Timestamp.now()
        });
      }

      setSuccess("Project updated successfully!");
      setIsEditingFields(false);

      // Notify parent component about the update
      if (onClose) {
        onClose({ updated: true, projectId: project.id });
      }
    } catch (err) {
      console.error("Error updating project:", err);
      setError("Failed to update project. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Function to cancel inline editing
  const cancelInlineEdits = () => {
    setEditableProject({ ...project });
    setIsEditingFields(false);
  };

  const handlePaymentStatusChange = async (e) => {
    const newStatus = e.target.value;
    setPaymentStatus(newStatus);

    if (!isEditingPayment) return;

    try {
      setLoading(true);

      // Update payment status in Firestore
      const projectRef = doc(db, 'projects', project.id);
      await updateDoc(projectRef, {
        paymentStatus: newStatus,
        updatedAt: Timestamp.now()
      });

      setSuccess("Payment status updated successfully!");
      setIsEditingPayment(false);
    } catch (err) {
      console.error("Error updating payment status:", err);
      setError("Failed to update payment status. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "paid":
        return "status-paid";
      case "invoiced":
        return "status-invoiced";
      case "overdue":
        return "status-overdue";
      case "void":
        return "status-void";
      default:
        return "status-unpaid";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not specified";
    const date = typeof dateString === 'object' && dateString.toDate
      ? dateString.toDate()
      : new Date(dateString);
    return date.toLocaleDateString();
  };

  const handleInviteClick = () => {
    setSelectedContractors([]);
    setInvitationMessage('');
    setInviteSuccess('');
    setInviteError('');
    setShowInviteModal(true);
  };

  const getInitials = (name) => {
    if (!name) return "NA";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
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

    setLoading(true);
    setInviteError('');
    setInviteSuccess('');

    try {
      // Create invitations for each selected contractor
      const invitationPromises = selectedContractors.map(contractorId => {
        const contractor = contractors.find(c => c.id === contractorId);
        return createProjectInvitation(project.id, contractorId, contractor.userId, invitationMessage);
      });

      await Promise.all(invitationPromises);

      // Update the project with invited contractors
      const projectRef = doc(db, 'projects', project.id);
      await updateDoc(projectRef, {
        invitedContractors: arrayUnion(...selectedContractors)
      });

      // Create notification messages for each invited contractor
      const messagePromises = selectedContractors.map(contractorId => {
        const contractor = contractors.find(c => c.id === contractorId);

        return addDoc(collection(db, 'messages'), {
          recipientId: contractor.userId,
          senderId: currentUser.uid,
          senderName: currentUser.displayName || 'Project Owner',
          type: 'invitation',
          title: `Invitation to project: ${project.title}`,
          content: invitationMessage || `You have been invited to participate in the project "${project.title}".`,
          projectId: project.id,
          read: false,
          createdAt: Timestamp.now()
        });
      });

      await Promise.all(messagePromises);

      setInviteSuccess(`Successfully invited ${selectedContractors.length} contractor${selectedContractors.length > 1 ? 's' : ''} to the project.`);
      setSelectedContractors([]);
      setInvitationMessage('');

      // Close the modal after a short delay
      setTimeout(() => {
        setShowInviteModal(false);
      }, 2000);
    } catch (err) {
      console.error("Error sending invitations:", err);
      setInviteError("Failed to send invitations. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Function to get random background color for contractor avatars
  const getRandomColor = (name) => {
    if (!name) return "#cccccc";

    const colors = [
      "#3498db", "#2ecc71", "#e74c3c", "#f39c12", "#9b59b6",
      "#1abc9c", "#d35400", "#c0392b", "#16a085", "#8e44ad"
    ];

    const charCodeSum = name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return colors[charCodeSum % colors.length];
  };

  // Fetch bids for the project
  const fetchBids = async () => {
    if (!project || !project.id) return;

    setLoadingBids(true);
    setBidError(null);

    try {
      const bidsQuery = query(
        collection(db, 'bids'),
        where('projectId', '==', project.id)
      );

      const querySnapshot = await getDocs(bidsQuery);
      const fetchedBids = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }));

      // Sort bids by date (newest first)
      fetchedBids.sort((a, b) => b.createdAt - a.createdAt);

      setBids(fetchedBids);
    } catch (err) {
      console.error("Error fetching bids:", err);
      setBidError("Failed to load bids for this project.");
    } finally {
      setLoadingBids(false);
    }
  };

  // Handle bid status changes (accept/reject)
  const handleBidStatusChange = async (bidId, newStatus) => {
    if (!bidId || !newStatus) return;

    try {
      setLoading(true);
      setError("");

      // Update the bid status in Firestore
      const bidRef = doc(db, 'bids', bidId);
      await updateDoc(bidRef, {
        status: newStatus,
        updatedAt: Timestamp.now()
      });

      // If accepted, update project status or other fields
      if (newStatus === 'accepted') {
        // Update project status
        const projectRef = doc(db, 'projects', project.id);
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
      fetchBids();

      setSuccess(`Bid ${newStatus} successfully!`);
    } catch (err) {
      console.error(`Error ${newStatus} bid:`, err);
      setError(`Failed to ${newStatus} bid. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  // Get bid status class based on bid status
  const getBidStatusClass = (status) => {
    if (!status || status === 'pending') {
      return 'status-pending';
    } else if (status === 'accepted') {
      return 'status-accepted';
    } else if (status === 'rejected') {
      return 'status-rejected';
    }
    return '';
  };

  // Get bid status text based on bid status
  const getBidStatusText = (status) => {
    if (!status || status === 'pending') {
      return 'Pending';
    } else if (status === 'accepted') {
      return 'Accepted';
    } else if (status === 'rejected') {
      return 'Rejected';
    }
    return 'Unknown';
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
          {userType === "CONTRACTOR" && project.biddingStatus === "open" && (
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
              {bids.filter(bid => !bid.status || bid.status === 'pending').length} No Response
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
                {userType === "prime" && project.createdBy === currentUser?.uid && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {bids.map(bid => (
                <tr key={bid.id} className={getBidStatusClass(bid.status)}>
                  <td className="bid-amount">${bid.amount?.toLocaleString() || '0'}</td>
                  <td className="contractor-name">
                    <a
                      href={`/contractor/${bid.contractorId}`}
                      className="contractor-link"
                    >
                      {bid.contractorName || 'Unknown'}
                    </a>
                    {userType === "CONTRACTOR" && bid.contractorId === currentUser?.uid && (
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

                  {/* Action buttons for project leaders on pending bids */}
                  {userType === "prime" && project.createdBy === currentUser?.uid && (
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

        {/* Submit bid button for contractors */}
        {userType === "CONTRACTOR" && project.biddingStatus === "open" && (
          <div className="button-container">
            <button
              className="submit-bid-btn"
              onClick={openBidModal}
            >
              <i className="fas fa-gavel"></i> Submit a Bid
            </button>
          </div>
        )}
      </div>
    );
  };

  // Show success message
  const showSuccessMessage = (message) => {
    setSuccess(message);

    // Clear success message after 3 seconds
    setTimeout(() => {
      setSuccess("");
    }, 3000);
  };

  // Bid modal functions
  const openBidModal = () => {
    // Check if user is logged in
    if (!currentUser) {
      setError("Please sign in to submit a bid");
      return;
    }

    // Check if the user has already submitted a bid for this project
    const existingBid = bids.find(bid => bid.contractorId === currentUser.uid);
    if (existingBid) {
      setBidAmount(existingBid.amount.toString());
      setBidMessage(existingBid.message || "");
      setError("You have already submitted a bid for this project. You can update your bid here.");
    } else {
      setBidAmount("");
      setBidMessage("");
      setError("");
    }

    setShowBidModal(true);
  };

  const closeBidModal = () => {
    setShowBidModal(false);
    setBidAmount("");
    setBidMessage("");
    setError("");
  };

  // Handle bid submission
  const handleBidSubmit = async (e) => {
    e.preventDefault();

    // Validate bid
    if (!bidAmount || isNaN(parseFloat(bidAmount)) || parseFloat(bidAmount) <= 0) {
      setError("Please enter a valid bid amount");
      return;
    }

    setSubmittingBid(true);
    setError("");

    try {
      // Add bid to Firestore
      const bidRef = await addDoc(collection(db, 'bids'), {
        projectId: project.id,
        contractorId: currentUser.uid,
        contractorName: currentUser.displayName || 'Anonymous',
        amount: parseFloat(bidAmount),
        message: bidMessage,
        status: 'pending', // Initial status is pending (No Response)
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      // Create notification in project creator's inbox
      await addDoc(collection(db, 'messages'), {
        recipientId: project.createdBy,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || 'A contractor',
        type: 'bid',
        title: `New bid on ${project.title}`,
        content: `${currentUser.displayName || 'A contractor'} has submitted a bid of $${bidAmount} for your project.`,
        projectId: project.id,
        bidId: bidRef.id,
        read: false,
        createdAt: Timestamp.now()
      });

      // Show success alert
      showSuccessMessage("Your bid has been submitted successfully!");

      // Refresh bids
      fetchBids();

      // Close modal and reset form
      closeBidModal();
    } catch (err) {
      console.error("Error submitting bid:", err);
      setError("Error submitting bid. Please try again.");
    } finally {
      setSubmittingBid(false);
    }
  };

  // Add function to handle edit form success
  const handleEditSuccess = (projectId) => {
    // Close the edit form
    setShowEditForm(false);

    // Show success message
    setSuccess("Project updated successfully!");

    // Reload the project data or trigger a refresh
    // This depends on how your app structure is set up
    // You might need to pass a callback to the parent component
    if (onClose) {
      onClose({ updated: true, projectId });
    }
  };

  // If the edit form is showing, render that instead of the project details
  if (showEditForm) {
    return (
      <div className="project-detail-overlay">
        <div className="project-detail-container">
          <button className="close-button" onClick={() => setShowEditForm(false)}>
            ×
          </button>
          <ProjectEditForm
            project={project}
            onCancel={() => setShowEditForm(false)}
            onSuccess={handleEditSuccess}
          />
        </div>
      </div>
    );
  }

  // Render an editable field based on its type
  const renderEditableField = (field) => {
    const { key, label, type, prefix } = field;
    const value = editableProject[key] || '';

    if (!isEditingFields) {
      return (
        <div className="detail-row" key={key}>
          <span className="detail-label">{label}:</span>
          <span className={`detail-value ${key === 'description' ? 'description' : ''}`}>
            {type === 'currency' && prefix}{value || 'Not specified'}
          </span>
        </div>
      );
    }

    switch (type) {
      case 'textarea':
        return (
          <div className="detail-row editable" key={key}>
            <span className="detail-label">{label}:</span>
            <div className="detail-value-edit">
              <textarea
                value={value}
                onChange={(e) => handleFieldChange(key, e.target.value)}
                className={`detail-editor ${key === 'description' ? 'description' : ''}`}
                rows={4}
              />
            </div>
          </div>
        );
      case 'currency':
        return (
          <div className="detail-row editable" key={key}>
            <span className="detail-label">{label}:</span>
            <div className="detail-value-edit currency-input">
              <span className="currency-prefix">{prefix}</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={value.toString().replace(/^\$/, '')}
                onChange={(e) => handleFieldChange(key, e.target.value)}
                className="detail-editor"
              />
            </div>
          </div>
        );
      default: // text input
        return (
          <div className="detail-row editable" key={key}>
            <span className="detail-label">{label}:</span>
            <div className="detail-value-edit">
              <input
                type="text"
                value={value}
                onChange={(e) => handleFieldChange(key, e.target.value)}
                className="detail-editor"
              />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="project-detail-overlay">
      <div className="project-detail-container">
        {/* Header with title and close button */}
        <div className="project-detail-header">
          <div className="header-title-container">
            <h2>{project.title}</h2>
            <button className="close-button" onClick={onClose}>×</button>
          </div>
          {/* Action Bar */}
          <div className="action-bar">
            {/* Left side buttons */}
            <div className="action-bar-left">
              {/* Back button */}

              {/* Full edit button - only visible for project creator */}
              {(project.createdBy === currentUser?.uid) && (
                <button
                  className="edit-project-btn"
                  onClick={() => setShowEditForm(true)}
                >
                  <i className="fas fa-pencil-alt"></i> Full Edit
                </button>
              )}

              {/* Inline edit toggle button - only visible for project creator */}
              {(project.createdBy === currentUser?.uid) && (
                <button
                  className={`inline-edit-btn ${isEditingFields ? 'active' : ''}`}
                  onClick={() => isEditingFields ? saveInlineEdits() : setIsEditingFields(true)}
                  disabled={loading}
                >
                  <i className={`fas fa-${isEditingFields ? 'save' : 'edit'}`}></i>
                  {isEditingFields ? 'Save Changes' : 'Quick Edit'}
                </button>
              )}

              {/* Cancel edit button - only shown when editing */}
              {isEditingFields && (
                <button
                  className="cancel-edit-btn"
                  onClick={cancelInlineEdits}
                  disabled={loading}
                >
                  <i className="fas fa-times"></i> Cancel
                </button>
              )}
            </div>

            {/* Right side buttons */}
            <div className="action-bar-right">
              {/* Invite contractors button - for project leaders who created the project */}
              {userType === "prime" && project.createdBy === currentUser?.uid && (
                <button
                  className="invite-contractors-btn"
                  onClick={handleInviteClick}
                >
                  <i className="fas fa-user-plus"></i> Invite Contractors
                </button>
              )}

              {/* Submit bid button - for contractors on open projects */}
              {userType === "CONTRACTOR" && project.status !== "Completed" && (project.biddingStatus === "open" || project.status === "open") && (
                <button
                  className="submit-bid-btn"
                  onClick={openBidModal}
                >
                  <i className="fas fa-gavel"></i> Submit Bid
                </button>
              )}

              {/* Complete project button - for project creators */}
              {userType === "prime" && project.createdBy === currentUser?.uid && project.status !== "Completed" && (
                <button className="mark-complete-btn">
                  <i className="fas fa-check-circle"></i> Mark Complete
                </button>
              )}

              {/* Rate contractor button - for completed projects by project creator */}
              {project.status === "Completed" &&
                !project.rating &&
                userType === "prime" &&
                project.createdBy === currentUser?.uid && (
                  <button className="rate-contractor-btn">
                    <i className="fas fa-star"></i> Rate Contractor
                  </button>
                )}
            </div>
          </div>
        </div>

        {/* Status/error messages */}
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {/* Main content */}
        <div className="project-detail-content">
          {/* Project Details Section */}
          <div className="detail-section">
            <h3>Project Details</h3>

            {/* Date - not editable */}
            <div className="detail-row">
              <span className="detail-label">Date:</span>
              <span className="detail-value">{formatDate(project.date)}</span>
            </div>

            {/* Render editable fields */}
            {editableFields.map(renderEditableField)}
          </div>

          {/* Financial Details Section */}
          <div className="detail-section">
            <h3>Financial Details</h3>

            {/* Payment Status */}
            <div className="detail-row">
              <span className="detail-label">Payment Status:</span>
              <div className="detail-value payment-status-container">
                {isEditingPayment ? (
                  <select
                    value={paymentStatus}
                    onChange={handlePaymentStatusChange}
                    disabled={loading}
                    className="payment-status-select"
                  >
                    {paymentStatusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span
                    className={`payment-status ${getStatusClass(
                      paymentStatus
                    )}`}
                  >
                    {paymentStatusOptions.find((o) => o.value === paymentStatus)
                      ?.label || "Unknown"}
                  </span>
                )}

                {userType === "prime" && project.createdBy === currentUser?.uid && (
                  <button
                    className="edit-status-button"
                    onClick={() => setIsEditingPayment(!isEditingPayment)}
                    disabled={loading}
                  >
                    {isEditingPayment ? "Save" : "Edit"}
                  </button>
                )}
              </div>
            </div>

            {/* Rating - if available */}
            {project.rating && (
              <div className="detail-row">
                <span className="detail-label">Contractor Rating:</span>
                <span className="detail-value rating">
                  {project.rating}
                  <i className="fas fa-star"></i>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Bids Section - Full width */}
        <div className="bids-section full-width">
          <h3 className="bids-section-title">Project Bids</h3>
          {renderBidsSection()}
        </div>

        {/* Invite Modal */}
        {showInviteModal && (
          <div className="modal-overlay">
            <div className="modal-content invite-modal">
              <div className="modal-header">
                <h2>Invite Contractors</h2>
                <button
                  className="close-modal-btn"
                  onClick={() => setShowInviteModal(false)}
                >
                  ×
                </button>
              </div>

              {inviteSuccess ? (
                <div className="invite-success-message">
                  <i className="fas fa-check-circle"></i>
                  <p>{inviteSuccess}</p>
                </div>
              ) : (
                <div className="invite-form">
                  {inviteError && <div className="error-message">{inviteError}</div>}

                  <div className="form-group">
                    <label>Invitation Message (Optional):</label>
                    <textarea
                      value={invitationMessage}
                      onChange={(e) => setInvitationMessage(e.target.value)}
                      placeholder="Enter a message to include with your invitation..."
                      rows={3}
                    />
                  </div>

                  <div className="contractors-selection">
                    <h3>Select Contractors</h3>

                    {contractorsLoading ? (
                      <div className="loading-container">
                        <div className="loading-spinner">
                          <i className="fas fa-tools"></i>
                        </div>
                        <div className="loading-text">Loading contractors...</div>
                      </div>
                    ) : contractors.length === 0 ? (
                      <div className="no-contractors">
                        <p>You don't have any contractors in your list yet.</p>
                        <button
                          className="go-to-contractors-btn"
                          onClick={() => navigate('/my-contractors')}
                        >
                          Add Contractors
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
                            <div
                              className="contractor-avatar"
                              style={{ backgroundColor: getRandomColor(contractor.name || contractor.companyName) }}
                            >
                              {getInitials(contractor.name || contractor.companyName)}
                            </div>
                            <div className="contractor-info">
                              <h4>{contractor.companyName || contractor.name || 'Unnamed'}</h4>
                              {contractor.trade && (
                                <p className="contractor-trade">{contractor.trade}</p>
                              )}
                            </div>
                            <div className="selection-indicator">
                              {selectedContractors.includes(contractor.id) && (
                                <i className="fas fa-check-circle"></i>
                              )}
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
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button
                      className="send-invites-btn"
                      onClick={handleSendInvitations}
                      disabled={loading || contractorsLoading || selectedContractors.length === 0}
                    >
                      {loading ? 'Sending...' : `Send Invites (${selectedContractors.length})`}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bid Modal */}
        {showBidModal && (
          <div className="modal-overlay">
            <div className="modal-content bid-modal">
              <div className="modal-header">
                <h3 className="modal-title">Submit a Bid</h3>
                <p className="project-name">{project.title}</p>
                <button
                  className="close-modal-btn"
                  onClick={closeBidModal}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <form onSubmit={handleBidSubmit} className="bid-form">
                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}

                <div className="form-group">
                  <label htmlFor="bid-amount">Bid Amount:</label>
                  <div className="input-with-prefix">
                    <span className="currency-prefix">$</span>
                    <input
                      type="number"
                      id="bid-amount"
                      step="0.01"
                      min="0"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="bid-message">Message (Optional):</label>
                  <textarea
                    id="bid-message"
                    value={bidMessage}
                    onChange={(e) => setBidMessage(e.target.value)}
                    placeholder="Add any details about your bid..."
                    rows={4}
                  />
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="cancel-button"
                    onClick={closeBidModal}
                    disabled={submittingBid}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="submit-button"
                    disabled={submittingBid || !bidAmount}
                  >
                    {submittingBid ? (
                      <>
                        <span className="spinner"></span>
                        Submitting...
                      </>
                    ) : (
                      'Submit Bid'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProjectDetail;
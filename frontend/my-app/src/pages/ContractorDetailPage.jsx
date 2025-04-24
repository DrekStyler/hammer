import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useRole } from '../contexts/RoleContext';
import useTranslation from '../utils/useTranslation';
import { getContractorById, getProjectsByContractor, deleteProjectInvitation } from '../api/dataService';

const ContractorDetailPage = () => {
    const { contractorId } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { isPrime } = useRole();
    const { t } = useTranslation();

    const [contractor, setContractor] = useState(null);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sendingText, setSendingText] = useState(false);
    const [textStatus, setTextStatus] = useState(null);
    const [removingProject, setRemovingProject] = useState(false);
    const [removeStatus, setRemoveStatus] = useState(null);

    // Fetch contractor data
    useEffect(() => {
        const fetchContractor = async () => {
            if (!contractorId || !currentUser) return;

            setLoading(true);
            setError(null);

            try {
                // Get contractor data
                const contractorData = await getContractorById(contractorId);

                if (!contractorData) {
                    throw new Error("Contractor not found");
                }

                // Check if the current user has access to this contractor
                if (contractorData.createdBy !== currentUser.uid) {
                    throw new Error("You don't have access to this contractor");
                }

                setContractor(contractorData);

                // Get projects associated with this contractor
                const contractorProjects = await getProjectsByContractor(contractorId);
                setProjects(contractorProjects);
            } catch (err) {
                console.error("Error fetching contractor:", err);
                setError(err.message || "Failed to load contractor details");
            } finally {
                setLoading(false);
            }
        };

        fetchContractor();
    }, [contractorId, currentUser]);

    // Function to send a text message to the contractor
    const sendTextMessage = async () => {
        if (!contractor || !contractor.phone) {
            setTextStatus({
                success: false,
                message: "No phone number available for this contractor"
            });
            return;
        }

        setSendingText(true);
        setTextStatus(null);

        try {
            // Check if we're in development mode
            const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

            // Determine the endpoint to use
            let functionUrl;

            if (isDevelopment) {
                // For local development, use test_twilio endpoint with query parameters
                functionUrl = '/api/test_twilio?phone=' + encodeURIComponent(contractor.phone);

                // Use a simulated response for development
                console.log(`Development mode: Would send text to ${contractor.phone} with message: "Hello ${contractor.name || contractor.companyName || "Contractor"}, Hey"`);

                // Simulate a successful response
                setTextStatus({
                    success: true,
                    message: "Text message sent successfully! (Development Mode)",
                    sid: "DEV_MODE_SID_" + Date.now()
                });
                setSendingText(false);
                return;
            } else {
                // For production, use the Firebase Cloud Function
                functionUrl = import.meta.env.VITE_API_URL
                    ? `${import.meta.env.VITE_API_URL}/send-text`
                    : 'https://us-central1-handypro-a58a7.cloudfunctions.net/send_text';
            }

            console.log("Sending text message to API endpoint:", functionUrl);

            const response = await fetch(functionUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    phoneNumber: contractor.phone,
                    message: "Hey",
                    contractorName: contractor.name || contractor.companyName || "Contractor"
                }),
            });

            let data;
            const responseText = await response.text();

            try {
                // Try to parse as JSON if possible
                data = responseText ? JSON.parse(responseText) : {};
            } catch (jsonError) {
                console.warn('Response is not JSON:', responseText);
                data = { message: responseText || 'Unknown response' };
            }

            if (!response.ok) {
                let errorMsg = data.error || `Failed to send text message: ${response.status}`;

                // Add helpful debugging information
                if (response.status === 404) {
                    errorMsg += " - The API endpoint was not found. Make sure the Firebase function is deployed.";
                } else if (response.status === 403) {
                    errorMsg += " - Access denied. Check your Firebase function permissions.";
                } else if (response.status === 500) {
                    errorMsg += " - Server error. Check your Twilio credentials.";
                }

                throw new Error(errorMsg);
            }

            setTextStatus({
                success: true,
                message: "Text message sent successfully!",
                sid: data.sid
            });
        } catch (err) {
            console.error("Error sending text message:", err);
            setTextStatus({
                success: false,
                message: err.message || "Failed to send text message"
            });
        } finally {
            setSendingText(false);
        }
    };

    // Function to handle removing a project from the contractor
    const handleRemoveProject = async (project) => {
        if (!project || !project.invitation || !project.invitation.id) {
            setRemoveStatus({
                success: false,
                message: "Cannot remove project - invitation information missing"
            });
            return;
        }

        if (!window.confirm(`Are you sure you want to remove "${project.title || 'Untitled Project'}" from this contractor?`)) {
            return;
        }

        setRemovingProject(true);
        setRemoveStatus(null);

        try {
            // Delete the project invitation which links the contractor to the project
            await deleteProjectInvitation(project.invitation.id);

            // Update the projects list
            setProjects(prev => prev.filter(p => p.id !== project.id));

            setRemoveStatus({
                success: true,
                message: "Project removed successfully!"
            });

            // Clear success message after a delay
            setTimeout(() => {
                setRemoveStatus(null);
            }, 3000);
        } catch (err) {
            console.error("Error removing project:", err);
            setRemoveStatus({
                success: false,
                message: err.message || "Failed to remove project"
            });
        } finally {
            setRemovingProject(false);
        }
    };

    // Format date helper function
    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';

        const date = typeof timestamp === 'object' && timestamp.toDate
            ? timestamp.toDate()
            : new Date(timestamp);

        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (loading) {
        return <div className="loading-spinner">{t('loading')}</div>;
    }

    if (error) {
        return (
            <div className="contractor-detail-error">
                <h2>Error</h2>
                <p>{error}</p>
                <button onClick={() => navigate('/my-contractors')} className="back-button">
                    Back to Contractors
                </button>
            </div>
        );
    }

    if (!contractor) {
        return (
            <div className="contractor-detail-error">
                <h2>Contractor Not Found</h2>
                <button onClick={() => navigate('/my-contractors')} className="back-button">
                    Back to Contractors
                </button>
            </div>
        );
    }

    return (
        <div className="contractor-detail-page">
            <div className="contractor-detail-header">
                <button onClick={() => navigate('/my-contractors')} className="back-button">
                    <i className="fas fa-arrow-left"></i> Back to Contractors
                </button>
                <h1>{contractor.companyName || contractor.name || 'Unnamed Contractor'}</h1>
            </div>

            <div className="contractor-detail-content">
                <div className="contractor-info-section">
                    <h2>Contractor Information</h2>
                    {textStatus && (
                        <div className={`text-status-message ${textStatus.success ? 'success' : 'error'}`}>
                            <p>{textStatus.message}</p>
                            {textStatus.sid && <small>Message SID: {textStatus.sid}</small>}
                        </div>
                    )}
                    <div className="contractor-info-grid">
                        {contractor.name && (
                            <div className="info-item">
                                <span className="info-label">Name:</span>
                                <span className="info-value">{contractor.name}</span>
                            </div>
                        )}
                        {contractor.companyName && (
                            <div className="info-item">
                                <span className="info-label">Company:</span>
                                <span className="info-value">{contractor.companyName}</span>
                            </div>
                        )}
                        {contractor.contactPerson && (
                            <div className="info-item">
                                <span className="info-label">Contact Person:</span>
                                <span className="info-value">{contractor.contactPerson}</span>
                            </div>
                        )}
                        {contractor.email && (
                            <div className="info-item">
                                <span className="info-label">Email:</span>
                                <span className="info-value">{contractor.email}</span>
                            </div>
                        )}
                        {contractor.phone && (
                            <div className="info-item">
                                <span className="info-label">Phone:</span>
                                <div className="phone-with-action">
                                    <span className="info-value">{contractor.phone}</span>
                                    <button
                                        className="send-text-btn"
                                        onClick={sendTextMessage}
                                        disabled={sendingText}
                                    >
                                        {sendingText ? 'Sending...' : 'Send Text'}
                                    </button>
                                </div>
                            </div>
                        )}
                        {contractor.trade && (
                            <div className="info-item">
                                <span className="info-label">Trade/Specialty:</span>
                                <span className="info-value">{contractor.trade}</span>
                            </div>
                        )}
                        {contractor.address && (
                            <div className="info-item">
                                <span className="info-label">Address:</span>
                                <span className="info-value">{contractor.address}</span>
                            </div>
                        )}
                        {contractor.city && (
                            <div className="info-item">
                                <span className="info-label">City:</span>
                                <span className="info-value">{contractor.city}</span>
                            </div>
                        )}
                        {contractor.state && (
                            <div className="info-item">
                                <span className="info-label">State:</span>
                                <span className="info-value">{contractor.state}</span>
                            </div>
                        )}
                        {contractor.zipCode && (
                            <div className="info-item">
                                <span className="info-label">Zip Code:</span>
                                <span className="info-value">{contractor.zipCode}</span>
                            </div>
                        )}
                        {contractor.notes && (
                            <div className="info-item info-item-full">
                                <span className="info-label">Notes:</span>
                                <span className="info-value">{contractor.notes}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="contractor-projects-section">
                    <h2>Associated Projects</h2>
                    {removeStatus && (
                        <div className={`remove-status-message ${removeStatus.success ? 'success' : 'error'}`}>
                            <p>{removeStatus.message}</p>
                        </div>
                    )}
                    {projects.length > 0 ? (
                        <div className="projects-table-container">
                            <table className="projects-table">
                                <thead>
                                    <tr>
                                        <th>Project</th>
                                        <th>Status</th>
                                        <th>Location</th>
                                        <th>Date Added</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {projects.map(project => (
                                        <tr key={project.id}>
                                            <td className="project-name">
                                                <a href={`/project/${project.id}`} className="project-title-link">
                                                    {project.title || 'Untitled Project'}
                                                </a>
                                            </td>
                                            <td>
                                                <span className={`status-badge status-${project.status?.toLowerCase() || 'draft'}`}>
                                                    {project.status || 'Draft'}
                                                </span>
                                            </td>
                                            <td>{project.location || 'N/A'}</td>
                                            <td>{formatDate(project.invitation?.sentAt || project.createdAt)}</td>
                                            <td className="actions-cell">
                                                <button
                                                    className="view-details-btn"
                                                    onClick={() => navigate(`/project/${project.id}`)}
                                                    title="View Project Details"
                                                >
                                                    <i className="fas fa-eye"></i>
                                                </button>
                                                <button
                                                    className="remove-project-btn"
                                                    onClick={() => handleRemoveProject(project)}
                                                    disabled={removingProject}
                                                    title="Remove from Contractor"
                                                >
                                                    <i className="fas fa-times"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="no-projects">
                            <p>This contractor is not associated with any projects yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ContractorDetailPage;
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useRole } from '../contexts/RoleContext';
import useTranslation from '../utils/useTranslation';
import { getContractorById, getProjectsByContractor, deleteProjectInvitation } from '../api/dataService';

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
        transition: 'background-color 0.2s ease'
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
    phoneWithAction: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
    },
    sendTextBtn: {
        backgroundColor: '#4299e1',
        color: 'white',
        border: 'none',
        padding: '6px 12px',
        borderRadius: '4px',
        fontSize: '14px',
        cursor: 'pointer',
        transition: 'background-color 0.2s ease'
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
    messageSid: {
        fontSize: '12px',
        marginTop: '4px',
        opacity: 0.8
    },

    // Projects section
    projectsSection: {
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        padding: '24px',
        border: '1px solid #e2e8f0'
    },
    tableContainer: {
        overflowX: 'auto'
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '14px'
    },
    tableHeader: {
        backgroundColor: '#f7fafc',
        color: '#4a5568',
        fontWeight: '500',
        textAlign: 'left',
        padding: '12px 16px',
        borderBottom: '2px solid #e2e8f0'
    },
    tableCell: {
        padding: '12px 16px',
        borderBottom: '1px solid #e2e8f0',
        color: '#2d3748'
    },
    projectLink: {
        color: '#4299e1',
        textDecoration: 'none',
        fontWeight: '500'
    },
    statusBadge: {
        padding: '4px 8px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '500',
        textAlign: 'center',
        display: 'inline-block'
    },
    statusDraft: {
        backgroundColor: '#edf2f7',
        color: '#4a5568'
    },
    statusOpen: {
        backgroundColor: '#c6f6d5',
        color: '#2f855a'
    },
    statusInProgress: {
        backgroundColor: '#fefcbf',
        color: '#975a16'
    },
    statusCompleted: {
        backgroundColor: '#e9d8fd',
        color: '#553c9a'
    },
    actionsCell: {
        display: 'flex',
        gap: '8px'
    },
    actionButton: {
        backgroundColor: 'transparent',
        border: 'none',
        padding: '6px',
        borderRadius: '4px',
        cursor: 'pointer',
        transition: 'background-color 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    viewButton: {
        color: '#4299e1'
    },
    removeButton: {
        color: '#e53e3e'
    },
    noProjects: {
        textAlign: 'center',
        padding: '32px',
        color: '#718096',
        backgroundColor: '#f7fafc',
        borderRadius: '6px'
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
    errorMessage: {
        color: '#718096',
        fontSize: '16px',
        lineHeight: '1.5'
    }
};

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
        return <div style={styles.loadingSpinner}>Loading...</div>;
    }

    if (error) {
        return (
            <div style={styles.errorContainer}>
                <h2 style={styles.errorTitle}>Error</h2>
                <p style={styles.errorMessage}>{error}</p>
            </div>
        );
    }

    if (!contractor) {
        return null;
    }

    return (
        <div style={styles.detailPage}>
            <div style={styles.detailHeader}>
                <div>
                    <h1 style={styles.headerTitle}>{contractor.companyName || contractor.businessName || 'Unnamed Contractor'}</h1>
                    <p style={{ color: '#718096', marginTop: '8px' }}>{contractor.trade || 'No trade specified'}</p>
                </div>
                <button style={styles.backButton} onClick={() => navigate(-1)}>
                    ← Back
                </button>
            </div>

            <div style={styles.detailContent}>
                <div style={styles.infoSection}>
                    <h2 style={styles.sectionTitle}>Contractor Information</h2>
                    <div style={styles.infoGrid}>
                        <div style={styles.infoItem}>
                            <span style={styles.infoLabel}>Email</span>
                            <span style={styles.infoValue}>{contractor.email || 'No email provided'}</span>
                        </div>
                        <div style={styles.infoItem}>
                            <span style={styles.infoLabel}>Phone</span>
                            <div style={styles.phoneWithAction}>
                                <span style={styles.infoValue}>{contractor.phone || 'No phone provided'}</span>
                                {contractor.phone && (
                                    <button
                                        style={styles.sendTextBtn}
                                        onClick={sendTextMessage}
                                        disabled={sendingText}
                                    >
                                        Send Text
                                    </button>
                                )}
                            </div>
                        </div>
                        <div style={styles.infoItem}>
                            <span style={styles.infoLabel}>Location</span>
                            <span style={styles.infoValue}>{contractor.location || 'No location specified'}</span>
                        </div>
                        <div style={styles.infoItem}>
                            <span style={styles.infoLabel}>License Number</span>
                            <span style={styles.infoValue}>{contractor.licenseNumber || 'Not provided'}</span>
                        </div>
                    </div>
                </div>

                <div style={styles.projectsSection}>
                    <h2 style={styles.sectionTitle}>Projects</h2>
                    {projects.length === 0 ? (
                        <div style={styles.noProjects}>
                            <p>No projects assigned to this contractor</p>
                        </div>
                    ) : (
                        <div style={styles.tableContainer}>
                            <table style={styles.table}>
                                <thead>
                                    <tr>
                                        <th style={styles.tableHeader}>Project</th>
                                        <th style={styles.tableHeader}>Status</th>
                                        <th style={styles.tableHeader}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {projects.map(project => (
                                        <tr key={project.id}>
                                            <td style={styles.tableCell}>
                                                <Link to={`/project/${project.id}`} style={styles.projectLink}>
                                                    {project.title}
                                                </Link>
                                            </td>
                                            <td style={styles.tableCell}>
                                                <span style={{
                                                    ...styles.statusBadge,
                                                    ...(project.status === 'Draft' ? styles.statusDraft :
                                                        project.status === 'Open' ? styles.statusOpen :
                                                            project.status === 'In Progress' ? styles.statusInProgress :
                                                                styles.statusCompleted)
                                                }}>
                                                    {project.status}
                                                </span>
                                            </td>
                                            <td style={styles.tableCell}>
                                                <div style={styles.actionsCell}>
                                                    <button
                                                        style={{ ...styles.actionButton, ...styles.viewButton }}
                                                        onClick={() => navigate(`/project/${project.id}`)}
                                                    >
                                                        View
                                                    </button>
                                                    <button
                                                        style={{ ...styles.actionButton, ...styles.removeButton }}
                                                        onClick={() => handleRemoveProject(project)}
                                                        disabled={isRemoving}
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ContractorDetailPage;
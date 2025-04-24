import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, storage } from '../firebase/config';
import { doc, getDoc, updateDoc, collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

// Comprehensive styles that match other components
const styles = {
    container: {
        padding: '30px',
        width: '90%',
        maxWidth: '1200px',
        margin: '0 auto',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    },
    headerTitle: {
        color: '#333',
        fontSize: '28px',
        fontWeight: '600',
        marginBottom: '24px',
    },
    card: {
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
        padding: '30px',
        marginBottom: '30px',
    },
    formGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        marginBottom: '20px',
    },
    formRow: {
        display: 'flex',
        gap: '20px',
        marginBottom: '20px',
        flexWrap: 'wrap',
    },
    formCol: {
        flex: '1',
        minWidth: '250px',
    },
    label: {
        fontSize: '14px',
        fontWeight: '500',
        color: '#5f6368',
        marginBottom: '4px',
    },
    input: {
        padding: '10px 12px',
        fontSize: '14px',
        border: '1px solid #e0e0e0',
        borderRadius: '4px',
        transition: 'border-color 0.2s',
        outline: 'none',
        width: '100%',
    },
    textarea: {
        padding: '10px 12px',
        fontSize: '14px',
        border: '1px solid #e0e0e0',
        borderRadius: '4px',
        transition: 'border-color 0.2s',
        outline: 'none',
        width: '100%',
        minHeight: '100px',
        resize: 'vertical',
    },
    select: {
        padding: '10px 12px',
        fontSize: '14px',
        border: '1px solid #e0e0e0',
        borderRadius: '4px',
        transition: 'border-color 0.2s',
        outline: 'none',
        width: '100%',
        height: 'auto',
    },
    button: {
        backgroundColor: '#1a73e8',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        padding: '10px 16px',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
        margin: '8px 0',
    },
    buttonHover: {
        backgroundColor: '#1557b0',
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        color: '#1a73e8',
        border: '1px solid #1a73e8',
        borderRadius: '4px',
        padding: '10px 16px',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s',
        margin: '8px 8px 8px 0',
    },
    secondaryButtonHover: {
        backgroundColor: '#e8f0fe',
    },
    dangerButton: {
        backgroundColor: '#EA4335',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        padding: '10px 16px',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
        margin: '8px 0',
    },
    dangerButtonHover: {
        backgroundColor: '#d32f2f',
    },
    buttonDisabled: {
        backgroundColor: '#a6c8ff',
        cursor: 'not-allowed',
    },
    errorMessage: {
        backgroundColor: '#ffebee',
        color: '#d32f2f',
        padding: '12px',
        borderRadius: '4px',
        fontSize: '14px',
        marginBottom: '20px',
    },
    successMessage: {
        backgroundColor: '#e8f5e9',
        color: '#2e7d32',
        padding: '12px',
        borderRadius: '4px',
        fontSize: '14px',
        marginBottom: '20px',
    },
    sectionTitle: {
        fontSize: '20px',
        fontWeight: '500',
        color: '#3c4043',
        marginBottom: '16px',
        marginTop: '30px',
        borderBottom: '1px solid #e1e4e8',
        paddingBottom: '10px',
    },
    fileInput: {
        display: 'none',
    },
    fileInputLabel: {
        backgroundColor: '#1a73e8',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        padding: '10px 16px',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
        display: 'inline-block',
        margin: '8px 0',
    },
    fileInputLabelHover: {
        backgroundColor: '#1557b0',
    },
    portfolioGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
        gap: '20px',
        marginTop: '20px',
    },
    portfolioCard: {
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
        overflow: 'hidden',
        transition: 'transform 0.2s',
    },
    portfolioCardHover: {
        transform: 'translateY(-5px)',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.24)',
    },
    portfolioImage: {
        width: '100%',
        height: '200px',
        objectFit: 'cover',
    },
    portfolioContent: {
        padding: '16px',
    },
    portfolioTitle: {
        fontSize: '16px',
        fontWeight: '500',
        marginBottom: '8px',
        color: '#3c4043',
    },
    portfolioDesc: {
        fontSize: '14px',
        color: '#5f6368',
        marginBottom: '12px',
        maxHeight: '60px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: '-webkit-box',
        WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical',
    },
    portfolioMeta: {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '12px',
        color: '#5f6368',
    },
    loadingOverlay: {
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
    loadingSpinner: {
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        border: '6px solid #f3f3f3',
        borderTop: '6px solid #1a73e8',
        animation: 'spin 1s linear infinite',
    },
    flexRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
    },
    companyLogo: {
        width: '120px',
        height: '120px',
        objectFit: 'contain',
        border: '1px solid #e0e0e0',
        borderRadius: '4px',
        padding: '8px',
        backgroundColor: '#f8f9fa',
    },
    badge: {
        display: 'inline-block',
        padding: '4px 8px',
        fontSize: '12px',
        fontWeight: '500',
        borderRadius: '16px',
        margin: '0 4px 4px 0',
        backgroundColor: '#e8f0fe',
        color: '#1a73e8',
    },
    ratingStars: {
        display: 'flex',
        alignItems: 'center',
        gap: '2px',
        color: '#FBBC05',
    },
    // Responsive styles
    '@media (max-width: 768px)': {
        formRow: {
            flexDirection: 'column',
            gap: '10px',
        },
        formCol: {
            width: '100%',
        },
        portfolioGrid: {
            gridTemplateColumns: 'repeat(auto-fill, minmax(100%, 1fr))',
        },
    },
};

const CompanyProfile = () => {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [portfolioProjects, setPortfolioProjects] = useState([]);
    const [hoveredElement, setHoveredElement] = useState(null);

    // Company profile state
    const [profile, setProfile] = useState({
        companyName: '',
        description: '',
        contactEmail: '',
        contactPhone: '',
        website: '',
        founded: '',
        employeeCount: '',
        licenseNumber: '',
        insuranceProvider: '',
        insurancePolicy: '',
        logoUrl: '',
        trades: [],
        serviceAreas: [],
        yearsInBusiness: '',
        rating: 0,
        completedProjects: 0,
        location: ''
    });

    // New portfolio project state
    const [newProject, setNewProject] = useState({
        title: '',
        description: '',
        location: '',
        completionDate: '',
        clientName: '',
        images: []
    });

    // Available trades and locations for selection
    const [availableTrades, setAvailableTrades] = useState([
        'Plumbing', 'Electrical', 'Carpentry', 'HVAC', 'Roofing',
        'Painting', 'Flooring', 'Masonry', 'Landscaping', 'Drywall'
    ]);

    const [availableLocations, setAvailableLocations] = useState([
        'New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX',
        'Phoenix, AZ', 'Philadelphia, PA', 'San Antonio, TX', 'San Diego, CA',
        'Dallas, TX', 'San Jose, CA', 'Austin, TX', 'Jacksonville, FL',
        'Fort Worth, TX', 'Columbus, OH', 'San Francisco, CA'
    ]);

    // Fetch profile data on component mount
    useEffect(() => {
        const fetchProfileData = async () => {
            if (!currentUser) {
                setLoading(false);
                setError('User not authenticated');
                return;
            }

            try {
                setLoading(true);

                // Get subcontractor profile
                const subcontractorRef = doc(db, 'subcontractors', currentUser.uid);
                const subcontractorSnap = await getDoc(subcontractorRef);

                if (subcontractorSnap.exists()) {
                    setProfile({
                        ...profile,
                        ...subcontractorSnap.data()
                    });

                    // Get portfolio projects
                    const projectsQuery = query(
                        collection(db, 'portfolioProjects'),
                        where('subcontractorId', '==', currentUser.uid),
                        orderBy('completionDate', 'desc')
                    );

                    const projectsSnap = await getDocs(projectsQuery);
                    const projects = [];

                    projectsSnap.forEach(doc => {
                        projects.push({
                            id: doc.id,
                            ...doc.data()
                        });
                    });

                    setPortfolioProjects(projects);
                } else {
                    // No profile found - might be first time user
                    setError('No company profile found. Please complete your profile.');
                }

                setLoading(false);
            } catch (err) {
                console.error("Error fetching profile:", err);
                setError('Failed to load profile data');
                setLoading(false);
            }
        };

        fetchProfileData();
    }, [currentUser]);

    // Handle profile edit mode toggle
    const toggleEditMode = () => {
        setIsEditing(!isEditing);
        // Reset any success/error messages when toggling edit mode
        setSuccess(null);
        setError(null);
    };

    // Handle input changes for profile
    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfile({
            ...profile,
            [name]: value
        });
    };

    // Handle trade selection (multiple)
    const handleTradeChange = (e) => {
        const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
        setProfile({
            ...profile,
            trades: selectedOptions
        });
    };

    // Handle service area selection (multiple)
    const handleServiceAreaChange = (e) => {
        const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
        setProfile({
            ...profile,
            serviceAreas: selectedOptions
        });
    };

    // Handle logo upload
    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `logos/${currentUser.uid}_${uuidv4()}.${fileExt}`;
            const logoRef = ref(storage, fileName);

            // Delete previous logo if exists
            if (profile.logoUrl) {
                try {
                    const oldLogoRef = ref(storage, profile.logoUrl);
                    await deleteObject(oldLogoRef);
                } catch (error) {
                    console.log("Previous logo not found or already deleted");
                }
            }

            // Upload new logo
            await uploadBytes(logoRef, file);
            const downloadUrl = await getDownloadURL(logoRef);

            setProfile({
                ...profile,
                logoUrl: downloadUrl
            });

            setSuccess('Logo uploaded successfully');
        } catch (err) {
            console.error("Error uploading logo:", err);
            setError('Failed to upload logo');
        }
    };

    // Handle portfolio project image upload
    const handleProjectImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        try {
            const uploadPromises = files.map(async (file) => {
                const fileExt = file.name.split('.').pop();
                const fileName = `portfolio/${currentUser.uid}_${uuidv4()}.${fileExt}`;
                const imageRef = ref(storage, fileName);

                await uploadBytes(imageRef, file);
                return await getDownloadURL(imageRef);
            });

            const imageUrls = await Promise.all(uploadPromises);

            setNewProject({
                ...newProject,
                images: [...newProject.images, ...imageUrls]
            });

            setSuccess('Images uploaded successfully');
        } catch (err) {
            console.error("Error uploading images:", err);
            setError('Failed to upload images');
        }
    };

    // Handle new project input changes
    const handleNewProjectChange = (e) => {
        const { name, value } = e.target;
        setNewProject({
            ...newProject,
            [name]: value
        });
    };

    // Save profile changes
    const saveProfile = async () => {
        if (!currentUser) {
            setError('User not authenticated');
            return;
        }

        try {
            setLoading(true);

            const subcontractorRef = doc(db, 'subcontractors', currentUser.uid);
            await updateDoc(subcontractorRef, profile);

            setSuccess('Profile updated successfully');
            setIsEditing(false);
            setLoading(false);
        } catch (err) {
            console.error("Error updating profile:", err);
            setError('Failed to update profile');
            setLoading(false);
        }
    };

    // Add new portfolio project
    const addPortfolioProject = async (e) => {
        e.preventDefault();

        if (!currentUser) {
            setError('User not authenticated');
            return;
        }

        if (!newProject.title || !newProject.description || newProject.images.length === 0) {
            setError('Please provide a title, description, and at least one image for the portfolio project');
            return;
        }

        try {
            setLoading(true);

            const projectData = {
                ...newProject,
                subcontractorId: currentUser.uid,
                createdAt: new Date(),
                completionDate: newProject.completionDate ? new Date(newProject.completionDate) : new Date()
            };

            const projectsCollectionRef = collection(db, 'portfolioProjects');
            const docRef = doc(projectsCollectionRef);
            await updateDoc(docRef, projectData);

            // Update local state
            setPortfolioProjects([
                {
                    id: docRef.id,
                    ...projectData
                },
                ...portfolioProjects
            ]);

            // Reset form
            setNewProject({
                title: '',
                description: '',
                location: '',
                completionDate: '',
                clientName: '',
                images: []
            });

            setSuccess('Portfolio project added successfully');
            setLoading(false);
        } catch (err) {
            console.error("Error adding portfolio project:", err);
            setError('Failed to add portfolio project');
            setLoading(false);
        }
    };

    // Delete portfolio project
    const deletePortfolioProject = async (projectId) => {
        if (!currentUser) {
            setError('User not authenticated');
            return;
        }

        try {
            setLoading(true);

            // Find the project to get image URLs
            const projectToDelete = portfolioProjects.find(p => p.id === projectId);

            // Delete project images from storage
            if (projectToDelete.images && projectToDelete.images.length > 0) {
                const deletePromises = projectToDelete.images.map(async (imageUrl) => {
                    try {
                        const imageRef = ref(storage, imageUrl);
                        await deleteObject(imageRef);
                    } catch (error) {
                        console.log("Image not found or already deleted:", error);
                    }
                });

                await Promise.all(deletePromises);
            }

            // Delete project document
            const projectRef = doc(db, 'portfolioProjects', projectId);
            await deleteObject(projectRef);

            // Update local state
            setPortfolioProjects(portfolioProjects.filter(p => p.id !== projectId));

            setSuccess('Portfolio project deleted successfully');
            setLoading(false);
        } catch (err) {
            console.error("Error deleting portfolio project:", err);
            setError('Failed to delete portfolio project');
            setLoading(false);
        }
    };

    // Format date for display
    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString();
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h1 style={styles.headerTitle}>Company Profile</h1>
                <p style={{ color: '#5f6368', marginBottom: '20px' }}>Manage your company information, services, and portfolio</p>

                {loading && (
                    <div style={styles.loadingOverlay}>
                        <div style={styles.loadingSpinner}></div>
                    </div>
                )}

                {error && <div style={styles.errorMessage}>{error}</div>}
                {success && <div style={styles.successMessage}>{success}</div>}

                {!loading && (
                    <div>
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'flex-end', 
                            marginBottom: '20px' 
                        }}>
                            {!isEditing ? (
                                <button 
                                    style={{
                                        ...styles.button,
                                        ...(hoveredElement === 'edit' ? styles.buttonHover : {})
                                    }}
                                    onMouseEnter={() => setHoveredElement('edit')}
                                    onMouseLeave={() => setHoveredElement(null)}
                                    onClick={toggleEditMode}
                                >
                                    <i className="fas fa-edit"></i> Edit Profile
                                </button>
                            ) : (
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button 
                                        style={{
                                            ...styles.button,
                                            ...(hoveredElement === 'save' ? styles.buttonHover : {})
                                        }}
                                        onMouseEnter={() => setHoveredElement('save')}
                                        onMouseLeave={() => setHoveredElement(null)}
                                        onClick={saveProfile}
                                    >
                                        <i className="fas fa-save"></i> Save Changes
                                    </button>
                                    <button 
                                        style={{
                                            ...styles.secondaryButton,
                                            ...(hoveredElement === 'cancel' ? styles.secondaryButtonHover : {})
                                        }}
                                        onMouseEnter={() => setHoveredElement('cancel')}
                                        onMouseLeave={() => setHoveredElement(null)}
                                        onClick={toggleEditMode}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>

                        <div style={{ marginBottom: '30px' }}>
                            <h2 style={styles.sectionTitle}>Company Information</h2>
                            <div style={{ 
                                display: 'flex', 
                                flexDirection: window.innerWidth <= 768 ? 'column' : 'row',
                                gap: '20px'
                            }}>
                                <div>
                                    {profile.logoUrl ? (
                                        <img
                                            src={profile.logoUrl}
                                            alt={`${profile.companyName} logo`}
                                            style={styles.companyLogo}
                                        />
                                    ) : (
                                        <div style={{
                                            ...styles.companyLogo,
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            color: '#1a73e8',
                                            fontSize: '40px'
                                        }}>
                                            <i className="fas fa-building"></i>
                                        </div>
                                    )}

                                    {isEditing && (
                                        <div style={{ textAlign: 'center', marginTop: '10px' }}>
                                            <label 
                                                htmlFor="logo-upload" 
                                                style={{
                                                    ...styles.fileInputLabel,
                                                    ...(hoveredElement === 'logo' ? styles.fileInputLabelHover : {})
                                                }}
                                                onMouseEnter={() => setHoveredElement('logo')}
                                                onMouseLeave={() => setHoveredElement(null)}
                                            >
                                                <i className="fas fa-camera"></i> Change Logo
                                            </label>
                                            <input
                                                type="file"
                                                id="logo-upload"
                                                accept="image/*"
                                                onChange={handleLogoUpload}
                                                style={styles.fileInput}
                                            />
                                        </div>
                                    )}
                                </div>

                                <div style={{ flex: 1 }}>
                                    {isEditing ? (
                                        <div>
                                            <div style={styles.formGroup}>
                                                <label htmlFor="companyName" style={styles.label}>Company Name</label>
                                                <input
                                                    type="text"
                                                    id="companyName"
                                                    name="companyName"
                                                    value={profile.companyName}
                                                    onChange={handleProfileChange}
                                                    required
                                                    style={styles.input}
                                                    onFocus={(e) => e.target.style.borderColor = '#1a73e8'}
                                                    onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                                                />
                                            </div>

                                            <div style={styles.formGroup}>
                                                <label htmlFor="description" style={styles.label}>Company Description</label>
                                                <textarea
                                                    id="description"
                                                    name="description"
                                                    value={profile.description}
                                                    onChange={handleProfileChange}
                                                    rows="4"
                                                    required
                                                    style={styles.textarea}
                                                    onFocus={(e) => e.target.style.borderColor = '#1a73e8'}
                                                    onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                                                ></textarea>
                                            </div>

                                            <div style={styles.formRow}>
                                                <div style={styles.formCol}>
                                                    <label htmlFor="contactEmail" style={styles.label}>Email</label>
                                                    <input
                                                        type="email"
                                                        id="contactEmail"
                                                        name="contactEmail"
                                                        value={profile.contactEmail}
                                                        onChange={handleProfileChange}
                                                        style={styles.input}
                                                        onFocus={(e) => e.target.style.borderColor = '#1a73e8'}
                                                        onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                                                    />
                                                </div>

                                                <div style={styles.formCol}>
                                                    <label htmlFor="contactPhone" style={styles.label}>Phone</label>
                                                    <input
                                                        type="tel"
                                                        id="contactPhone"
                                                        name="contactPhone"
                                                        value={profile.contactPhone}
                                                        onChange={handleProfileChange}
                                                        style={styles.input}
                                                        onFocus={(e) => e.target.style.borderColor = '#1a73e8'}
                                                        onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                                                    />
                                                </div>
                                            </div>

                                            <div style={styles.formGroup}>
                                                <label htmlFor="website" style={styles.label}>Website</label>
                                                <input
                                                    type="url"
                                                    id="website"
                                                    name="website"
                                                    value={profile.website}
                                                    onChange={handleProfileChange}
                                                    style={styles.input}
                                                    onFocus={(e) => e.target.style.borderColor = '#1a73e8'}
                                                    onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                                                />
                                            </div>

                                            <div style={styles.formGroup}>
                                                <label htmlFor="location" style={styles.label}>Location (City, State)</label>
                                                <input
                                                    type="text"
                                                    id="location"
                                                    name="location"
                                                    value={profile.location}
                                                    onChange={handleProfileChange}
                                                    placeholder="e.g. Los Angeles, CA"
                                                    style={styles.input}
                                                    onFocus={(e) => e.target.style.borderColor = '#1a73e8'}
                                                    onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                                                />
                                            </div>

                                            <div style={styles.formRow}>
                                                <div style={styles.formCol}>
                                                    <label htmlFor="founded" style={styles.label}>Year Founded</label>
                                                    <input
                                                        type="number"
                                                        id="founded"
                                                        name="founded"
                                                        value={profile.founded}
                                                        onChange={handleProfileChange}
                                                        min="1900"
                                                        max={new Date().getFullYear()}
                                                        style={styles.input}
                                                        onFocus={(e) => e.target.style.borderColor = '#1a73e8'}
                                                        onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                                                    />
                                                </div>

                                                <div style={styles.formCol}>
                                                    <label htmlFor="employeeCount" style={styles.label}>Employees</label>
                                                    <input
                                                        type="number"
                                                        id="employeeCount"
                                                        name="employeeCount"
                                                        value={profile.employeeCount}
                                                        onChange={handleProfileChange}
                                                        min="1"
                                                        style={styles.input}
                                                        onFocus={(e) => e.target.style.borderColor = '#1a73e8'}
                                                        onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                                                    />
                                                </div>
                                            </div>

                                            <div style={styles.formRow}>
                                                <div style={styles.formCol}>
                                                    <label htmlFor="licenseNumber" style={styles.label}>License Number</label>
                                                    <input
                                                        type="text"
                                                        id="licenseNumber"
                                                        name="licenseNumber"
                                                        value={profile.licenseNumber}
                                                        onChange={handleProfileChange}
                                                        style={styles.input}
                                                        onFocus={(e) => e.target.style.borderColor = '#1a73e8'}
                                                        onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                                                    />
                                                </div>

                                                <div style={styles.formCol}>
                                                    <label htmlFor="insuranceProvider" style={styles.label}>Insurance Provider</label>
                                                    <input
                                                        type="text"
                                                        id="insuranceProvider"
                                                        name="insuranceProvider"
                                                        value={profile.insuranceProvider}
                                                        onChange={handleProfileChange}
                                                        style={styles.input}
                                                        onFocus={(e) => e.target.style.borderColor = '#1a73e8'}
                                                        onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                                                    />
                                                </div>
                                            </div>

                                            <div style={styles.formGroup}>
                                                <label htmlFor="insurancePolicy" style={styles.label}>Insurance Policy Number</label>
                                                <input
                                                    type="text"
                                                    id="insurancePolicy"
                                                    name="insurancePolicy"
                                                    value={profile.insurancePolicy}
                                                    onChange={handleProfileChange}
                                                    style={styles.input}
                                                    onFocus={(e) => e.target.style.borderColor = '#1a73e8'}
                                                    onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        /* Display mode */
                                        <div>
                                            <h3 style={{
                                                fontSize: '20px',
                                                fontWeight: '500',
                                                color: '#3c4043',
                                                marginBottom: '10px'
                                            }}>{profile.companyName || 'Your Company Name'}</h3>
                                            
                                            <p style={{
                                                fontSize: '14px',
                                                color: '#5f6368',
                                                marginBottom: '20px',
                                                lineHeight: '1.5'
                                            }}>{profile.description || 'No company description provided'}</p>

                                            <div style={{
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                                                gap: '16px',
                                                marginTop: '20px'
                                            }}>
                                                <div style={styles.flexRow}>
                                                    <i className="fas fa-envelope" style={{ color: '#1a73e8' }}></i>
                                                    <span>{profile.contactEmail || 'No email provided'}</span>
                                                </div>

                                                <div style={styles.flexRow}>
                                                    <i className="fas fa-phone" style={{ color: '#1a73e8' }}></i>
                                                    <span>{profile.contactPhone || 'No phone provided'}</span>
                                                </div>

                                                <div style={styles.flexRow}>
                                                    <i className="fas fa-globe" style={{ color: '#1a73e8' }}></i>
                                                    <span>{profile.website ? (
                                                        <a href={profile.website} target="_blank" rel="noopener noreferrer" style={{ color: '#1a73e8', textDecoration: 'none' }}>
                                                            {profile.website}
                                                        </a>
                                                    ) : 'No website provided'}</span>
                                                </div>

                                                <div style={styles.flexRow}>
                                                    <i className="fas fa-map-marker-alt" style={{ color: '#1a73e8' }}></i>
                                                    <span>{profile.location || 'No location provided'}</span>
                                                </div>

                                                <div style={styles.flexRow}>
                                                    <i className="fas fa-calendar" style={{ color: '#1a73e8' }}></i>
                                                    <span>Founded: {profile.founded || 'N/A'}</span>
                                                </div>

                                                <div style={styles.flexRow}>
                                                    <i className="fas fa-users" style={{ color: '#1a73e8' }}></i>
                                                    <span>{profile.employeeCount || '0'} Employees</span>
                                                </div>

                                                <div style={styles.flexRow}>
                                                    <i className="fas fa-id-card" style={{ color: '#1a73e8' }}></i>
                                                    <span>License: {profile.licenseNumber || 'N/A'}</span>
                                                </div>

                                                <div style={styles.flexRow}>
                                                    <i className="fas fa-shield-alt" style={{ color: '#1a73e8' }}></i>
                                                    <span>Insurance: {profile.insuranceProvider || 'N/A'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div style={{ marginBottom: '30px' }}>
                            <h2 style={styles.sectionTitle}>Services & Coverage</h2>
                            <div>
                                {isEditing ? (
                                    <div>
                                        <div style={styles.formGroup}>
                                            <label htmlFor="trades" style={styles.label}>Trades/Services Offered</label>
                                            <select
                                                id="trades"
                                                name="trades"
                                                multiple
                                                value={profile.trades}
                                                onChange={handleTradeChange}
                                                style={{
                                                    ...styles.select,
                                                    height: '120px'
                                                }}
                                            >
                                                {availableTrades.map((trade) => (
                                                    <option key={trade} value={trade}>
                                                        {trade}
                                                    </option>
                                                ))}
                                            </select>
                                            <small style={{ fontSize: '12px', color: '#5f6368', marginTop: '4px' }}>
                                                Hold Ctrl (or Cmd) to select multiple options
                                            </small>
                                        </div>

                                        <div style={styles.formGroup}>
                                            <label htmlFor="serviceAreas" style={styles.label}>Service Areas</label>
                                            <select
                                                id="serviceAreas"
                                                name="serviceAreas"
                                                multiple
                                                value={profile.serviceAreas}
                                                onChange={handleServiceAreaChange}
                                                style={{
                                                    ...styles.select,
                                                    height: '120px'
                                                }}
                                            >
                                                {availableLocations.map((location) => (
                                                    <option key={location} value={location}>
                                                        {location}
                                                    </option>
                                                ))}
                                            </select>
                                            <small style={{ fontSize: '12px', color: '#5f6368', marginTop: '4px' }}>
                                                Hold Ctrl (or Cmd) to select multiple options
                                            </small>
                                        </div>
                                    </div>
                                ) : (
                                    /* Display mode */
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '30px' }}>
                                        <div style={{ flex: '1', minWidth: '250px' }}>
                                            <h3 style={{
                                                fontSize: '16px',
                                                fontWeight: '500',
                                                color: '#3c4043',
                                                marginBottom: '10px'
                                            }}>Services Offered</h3>
                                            
                                            {profile.trades && profile.trades.length > 0 ? (
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                    {profile.trades.map((trade) => (
                                                        <span key={trade} style={styles.badge}>{trade}</span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p style={{ color: '#5f6368', fontSize: '14px' }}>No services specified</p>
                                            )}
                                        </div>

                                        <div style={{ flex: '1', minWidth: '250px' }}>
                                            <h3 style={{
                                                fontSize: '16px',
                                                fontWeight: '500',
                                                color: '#3c4043',
                                                marginBottom: '10px'
                                            }}>Service Areas</h3>
                                            
                                            {profile.serviceAreas && profile.serviceAreas.length > 0 ? (
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                    {profile.serviceAreas.map((area) => (
                                                        <span key={area} style={styles.badge}>{area}</span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p style={{ color: '#5f6368', fontSize: '14px' }}>No service areas specified</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={{ marginBottom: '30px' }}>
                            <h2 style={styles.sectionTitle}>Portfolio Projects</h2>

                            {isEditing && (
                                <div style={{ marginBottom: '30px' }}>
                                    <div style={{ 
                                        backgroundColor: '#f8f9fa',
                                        padding: '20px',
                                        borderRadius: '8px',
                                        marginBottom: '20px'
                                    }}>
                                        <h3 style={{
                                            fontSize: '18px',
                                            fontWeight: '500',
                                            color: '#3c4043',
                                            marginBottom: '16px'
                                        }}>Add New Portfolio Project</h3>
                                        
                                        <form onSubmit={addPortfolioProject}>
                                            <div style={styles.formGroup}>
                                                <label htmlFor="projectTitle" style={styles.label}>Project Title</label>
                                                <input
                                                    type="text"
                                                    id="projectTitle"
                                                    name="title"
                                                    value={newProject.title}
                                                    onChange={handleNewProjectChange}
                                                    required
                                                    style={styles.input}
                                                    onFocus={(e) => e.target.style.borderColor = '#1a73e8'}
                                                    onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                                                />
                                            </div>

                                            <div style={styles.formGroup}>
                                                <label htmlFor="projectDescription" style={styles.label}>Description</label>
                                                <textarea
                                                    id="projectDescription"
                                                    name="description"
                                                    value={newProject.description}
                                                    onChange={handleNewProjectChange}
                                                    rows="3"
                                                    required
                                                    style={styles.textarea}
                                                    onFocus={(e) => e.target.style.borderColor = '#1a73e8'}
                                                    onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                                                ></textarea>
                                            </div>

                                            <div style={styles.formRow}>
                                                <div style={styles.formCol}>
                                                    <label htmlFor="projectLocation" style={styles.label}>Location</label>
                                                    <input
                                                        type="text"
                                                        id="projectLocation"
                                                        name="location"
                                                        value={newProject.location}
                                                        onChange={handleNewProjectChange}
                                                        style={styles.input}
                                                        onFocus={(e) => e.target.style.borderColor = '#1a73e8'}
                                                        onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                                                    />
                                                </div>

                                                <div style={styles.formCol}>
                                                    <label htmlFor="projectCompletionDate" style={styles.label}>Completion Date</label>
                                                    <input
                                                        type="date"
                                                        id="projectCompletionDate"
                                                        name="completionDate"
                                                        value={newProject.completionDate}
                                                        onChange={handleNewProjectChange}
                                                        style={styles.input}
                                                        onFocus={(e) => e.target.style.borderColor = '#1a73e8'}
                                                        onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                                                    />
                                                </div>
                                            </div>

                                            <div style={styles.formGroup}>
                                                <label htmlFor="projectClientName" style={styles.label}>Client Name</label>
                                                <input
                                                    type="text"
                                                    id="projectClientName"
                                                    name="clientName"
                                                    value={newProject.clientName}
                                                    onChange={handleNewProjectChange}
                                                    style={styles.input}
                                                    onFocus={(e) => e.target.style.borderColor = '#1a73e8'}
                                                    onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                                                />
                                            </div>

                                            <div style={styles.formGroup}>
                                                <label style={styles.label}>Project Images</label>
                                                <div>
                                                    <label 
                                                        htmlFor="project-images" 
                                                        style={{
                                                            ...styles.fileInputLabel,
                                                            ...(hoveredElement === 'project-images' ? styles.fileInputLabelHover : {})
                                                        }}
                                                        onMouseEnter={() => setHoveredElement('project-images')}
                                                        onMouseLeave={() => setHoveredElement(null)}
                                                    >
                                                        <i className="fas fa-cloud-upload-alt"></i> Upload Images
                                                    </label>
                                                    <input
                                                        type="file"
                                                        id="project-images"
                                                        accept="image/*"
                                                        multiple
                                                        onChange={handleProjectImageUpload}
                                                        style={styles.fileInput}
                                                    />

                                                    <div style={{ 
                                                        display: 'flex', 
                                                        flexWrap: 'wrap', 
                                                        gap: '10px',
                                                        marginTop: '10px' 
                                                    }}>
                                                        {newProject.images.map((url, index) => (
                                                            <div key={index} style={{ 
                                                                position: 'relative',
                                                                width: '100px',
                                                                height: '100px',
                                                                border: '1px solid #e0e0e0',
                                                                borderRadius: '4px',
                                                                overflow: 'hidden'
                                                            }}>
                                                                <img 
                                                                    src={url} 
                                                                    alt={`Preview ${index + 1}`}
                                                                    style={{
                                                                        width: '100%',
                                                                        height: '100%',
                                                                        objectFit: 'cover'
                                                                    }}
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const updatedImages = [...newProject.images];
                                                                        updatedImages.splice(index, 1);
                                                                        setNewProject({
                                                                            ...newProject,
                                                                            images: updatedImages
                                                                        });
                                                                    }}
                                                                    style={{
                                                                        position: 'absolute',
                                                                        top: '5px',
                                                                        right: '5px',
                                                                        backgroundColor: 'rgba(255,255,255,0.8)',
                                                                        border: 'none',
                                                                        borderRadius: '50%',
                                                                        width: '24px',
                                                                        height: '24px',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        cursor: 'pointer',
                                                                        color: '#d32f2f'
                                                                    }}
                                                                >
                                                                    <i className="fas fa-times"></i>
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            <button 
                                                type="submit" 
                                                style={{
                                                    ...styles.button,
                                                    ...(hoveredElement === 'add-project' ? styles.buttonHover : {})
                                                }}
                                                onMouseEnter={() => setHoveredElement('add-project')}
                                                onMouseLeave={() => setHoveredElement(null)}
                                            >
                                                <i className="fas fa-plus"></i> Add Project
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            )}

                            <div>
                                {portfolioProjects.length === 0 ? (
                                    <div style={{ 
                                        textAlign: 'center',
                                        padding: '40px 20px',
                                        backgroundColor: '#f8f9fa',
                                        borderRadius: '8px',
                                        color: '#5f6368'
                                    }}>
                                        <p style={{ fontSize: '16px', marginBottom: '10px' }}>No portfolio projects added yet</p>
                                        {isEditing && (
                                            <p style={{ fontSize: '14px' }}>Add your first project to showcase your work</p>
                                        )}
                                    </div>
                                ) : (
                                    <div style={styles.portfolioGrid}>
                                        {portfolioProjects.map((project) => (
                                            <div 
                                                key={project.id} 
                                                style={{
                                                    ...styles.portfolioCard,
                                                    ...(hoveredElement === `project-${project.id}` ? styles.portfolioCardHover : {})
                                                }}
                                                onMouseEnter={() => setHoveredElement(`project-${project.id}`)}
                                                onMouseLeave={() => setHoveredElement(null)}
                                            >
                                                <div>
                                                    {project.images && project.images.length > 0 ? (
                                                        <img
                                                            src={project.images[0]}
                                                            alt={project.title}
                                                            style={styles.portfolioImage}
                                                        />
                                                    ) : (
                                                        <div style={{
                                                            ...styles.portfolioImage,
                                                            display: 'flex',
                                                            justifyContent: 'center',
                                                            alignItems: 'center',
                                                            backgroundColor: '#f8f9fa',
                                                            color: '#9AA0A6',
                                                            fontSize: '32px'
                                                        }}>
                                                            <i className="fas fa-image"></i>
                                                        </div>
                                                    )}

                                                    {project.images && project.images.length > 1 && (
                                                        <div style={{
                                                            display: 'flex',
                                                            gap: '4px',
                                                            padding: '8px',
                                                            backgroundColor: '#f8f9fa'
                                                        }}>
                                                            {project.images.slice(1, 4).map((img, idx) => (
                                                                <img
                                                                    key={idx}
                                                                    src={img}
                                                                    alt={`${project.title} thumbnail ${idx + 1}`}
                                                                    style={{
                                                                        width: '40px',
                                                                        height: '40px',
                                                                        objectFit: 'cover',
                                                                        borderRadius: '4px'
                                                                    }}
                                                                />
                                                            ))}
                                                            {project.images.length > 4 && (
                                                                <div style={{
                                                                    width: '40px',
                                                                    height: '40px',
                                                                    display: 'flex',
                                                                    justifyContent: 'center',
                                                                    alignItems: 'center',
                                                                    backgroundColor: 'rgba(0,0,0,0.5)',
                                                                    color: 'white',
                                                                    borderRadius: '4px',
                                                                    fontSize: '12px'
                                                                }}>
                                                                    +{project.images.length - 4}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                <div style={styles.portfolioContent}>
                                                    <h3 style={styles.portfolioTitle}>{project.title}</h3>
                                                    <p style={styles.portfolioDesc}>{project.description}</p>

                                                    <div style={{ marginTop: '12px' }}>
                                                        {project.location && (
                                                            <div style={styles.flexRow}>
                                                                <i className="fas fa-map-marker-alt" style={{ color: '#1a73e8', fontSize: '12px' }}></i>
                                                                <span style={{ fontSize: '13px', color: '#5f6368' }}>{project.location}</span>
                                                            </div>
                                                        )}

                                                        {project.completionDate && (
                                                            <div style={styles.flexRow}>
                                                                <i className="fas fa-calendar-check" style={{ color: '#1a73e8', fontSize: '12px' }}></i>
                                                                <span style={{ fontSize: '13px', color: '#5f6368' }}>
                                                                    Completed: {formatDate(project.completionDate)}
                                                                </span>
                                                            </div>
                                                        )}

                                                        {project.clientName && (
                                                            <div style={styles.flexRow}>
                                                                <i className="fas fa-user" style={{ color: '#1a73e8', fontSize: '12px' }}></i>
                                                                <span style={{ fontSize: '13px', color: '#5f6368' }}>
                                                                    Client: {project.clientName}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {isEditing && (
                                                        <button
                                                            style={{
                                                                ...styles.dangerButton,
                                                                ...(hoveredElement === `delete-${project.id}` ? styles.dangerButtonHover : {}),
                                                                marginTop: '16px'
                                                            }}
                                                            onMouseEnter={() => setHoveredElement(`delete-${project.id}`)}
                                                            onMouseLeave={() => setHoveredElement(`project-${project.id}`)}
                                                            onClick={() => deletePortfolioProject(project.id)}
                                                        >
                                                            <i className="fas fa-trash"></i> Delete
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div>
                            <h2 style={styles.sectionTitle}>Company Statistics</h2>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                                gap: '20px',
                                marginTop: '20px'
                            }}>
                                <div style={{
                                    backgroundColor: 'white',
                                    borderRadius: '8px',
                                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
                                    padding: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '16px'
                                }}>
                                    <div style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '50%',
                                        backgroundColor: '#e8f0fe',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        color: '#1a73e8',
                                        fontSize: '20px'
                                    }}>
                                        <i className="fas fa-star"></i>
                                    </div>
                                    <div>
                                        <h3 style={{
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            color: '#5f6368',
                                            marginBottom: '4px'
                                        }}>Rating</h3>
                                        <p style={{
                                            fontSize: '24px',
                                            fontWeight: '600',
                                            color: '#3c4043',
                                            margin: 0
                                        }}>{profile.rating?.toFixed(1) || 'N/A'}</p>
                                    </div>
                                </div>

                                <div style={{
                                    backgroundColor: 'white',
                                    borderRadius: '8px',
                                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
                                    padding: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '16px'
                                }}>
                                    <div style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '50%',
                                        backgroundColor: '#e8f0fe',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        color: '#1a73e8',
                                        fontSize: '20px'
                                    }}>
                                        <i className="fas fa-check-circle"></i>
                                    </div>
                                    <div>
                                        <h3 style={{
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            color: '#5f6368',
                                            marginBottom: '4px'
                                        }}>Completed Projects</h3>
                                        <p style={{
                                            fontSize: '24px',
                                            fontWeight: '600',
                                            color: '#3c4043',
                                            margin: 0
                                        }}>{profile.completedProjects || '0'}</p>
                                    </div>
                                </div>

                                <div style={{
                                    backgroundColor: 'white',
                                    borderRadius: '8px',
                                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
                                    padding: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '16px'
                                }}>
                                    <div style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '50%',
                                        backgroundColor: '#e8f0fe',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        color: '#1a73e8',
                                        fontSize: '20px'
                                    }}>
                                        <i className="fas fa-business-time"></i>
                                    </div>
                                    <div>
                                        <h3 style={{
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            color: '#5f6368',
                                            marginBottom: '4px'
                                        }}>Years in Business</h3>
                                        <p style={{
                                            fontSize: '24px',
                                            fontWeight: '600',
                                            color: '#3c4043',
                                            margin: 0
                                        }}>{profile.yearsInBusiness || 'N/A'}</p>
                                    </div>
                                </div>

                                <div style={{
                                    backgroundColor: 'white',
                                    borderRadius: '8px',
                                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
                                    padding: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '16px'
                                }}>
                                    <div style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '50%',
                                        backgroundColor: '#e8f0fe',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        color: '#1a73e8',
                                        fontSize: '20px'
                                    }}>
                                        <i className="fas fa-tools"></i>
                                    </div>
                                    <div>
                                        <h3 style={{
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            color: '#5f6368',
                                            marginBottom: '4px'
                                        }}>Services Offered</h3>
                                        <p style={{
                                            fontSize: '24px',
                                            fontWeight: '600',
                                            color: '#3c4043',
                                            margin: 0
                                        }}>{profile.trades?.length || '0'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CompanyProfile;
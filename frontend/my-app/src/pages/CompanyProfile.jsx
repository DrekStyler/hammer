import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, storage } from '../firebase/config';
import { doc, getDoc, updateDoc, collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import './CompanyProfile.css';

const CompanyProfile = () => {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [portfolioProjects, setPortfolioProjects] = useState([]);

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
        completedProjects: 0
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
        <div className="company-profile">
            <div className="profile-header">
                <h1>Company Profile</h1>
                <p>Manage your company information, services, and portfolio</p>
            </div>

            {loading && <div className="loading-spinner">Loading profile data...</div>}

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            {!loading && (
                <div className="profile-content">
                    <div className="profile-actions">
                        {!isEditing ? (
                            <button className="edit-profile-btn" onClick={toggleEditMode}>
                                <i className="fas fa-edit"></i> Edit Profile
                            </button>
                        ) : (
                            <div className="edit-actions">
                                <button className="save-profile-btn" onClick={saveProfile}>
                                    <i className="fas fa-save"></i> Save Changes
                                </button>
                                <button className="cancel-edit-btn" onClick={toggleEditMode}>
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="profile-section company-info">
                        <h2>Company Information</h2>
                        <div className="section-content">
                            <div className="company-logo-container">
                                {profile.logoUrl ? (
                                    <img
                                        src={profile.logoUrl}
                                        alt={`${profile.companyName} logo`}
                                        className="company-logo"
                                    />
                                ) : (
                                    <div className="company-logo-placeholder">
                                        <i className="fas fa-building"></i>
                                    </div>
                                )}

                                {isEditing && (
                                    <div className="logo-upload">
                                        <label htmlFor="logo-upload" className="upload-btn">
                                            <i className="fas fa-camera"></i> Change Logo
                                        </label>
                                        <input
                                            type="file"
                                            id="logo-upload"
                                            accept="image/*"
                                            onChange={handleLogoUpload}
                                            style={{ display: 'none' }}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="company-details">
                                {isEditing ? (
                                    <div className="edit-form">
                                        <div className="form-group">
                                            <label htmlFor="companyName">Company Name</label>
                                            <input
                                                type="text"
                                                id="companyName"
                                                name="companyName"
                                                value={profile.companyName}
                                                onChange={handleProfileChange}
                                                required
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="description">Company Description</label>
                                            <textarea
                                                id="description"
                                                name="description"
                                                value={profile.description}
                                                onChange={handleProfileChange}
                                                rows="4"
                                                required
                                            ></textarea>
                                        </div>

                                        <div className="form-row">
                                            <div className="form-group">
                                                <label htmlFor="contactEmail">Email</label>
                                                <input
                                                    type="email"
                                                    id="contactEmail"
                                                    name="contactEmail"
                                                    value={profile.contactEmail}
                                                    onChange={handleProfileChange}
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label htmlFor="contactPhone">Phone</label>
                                                <input
                                                    type="tel"
                                                    id="contactPhone"
                                                    name="contactPhone"
                                                    value={profile.contactPhone}
                                                    onChange={handleProfileChange}
                                                />
                                            </div>
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="website">Website</label>
                                            <input
                                                type="url"
                                                id="website"
                                                name="website"
                                                value={profile.website}
                                                onChange={handleProfileChange}
                                            />
                                        </div>

                                        <div className="form-row">
                                            <div className="form-group">
                                                <label htmlFor="founded">Year Founded</label>
                                                <input
                                                    type="number"
                                                    id="founded"
                                                    name="founded"
                                                    value={profile.founded}
                                                    onChange={handleProfileChange}
                                                    min="1900"
                                                    max={new Date().getFullYear()}
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label htmlFor="employeeCount">Employees</label>
                                                <input
                                                    type="number"
                                                    id="employeeCount"
                                                    name="employeeCount"
                                                    value={profile.employeeCount}
                                                    onChange={handleProfileChange}
                                                    min="1"
                                                />
                                            </div>
                                        </div>

                                        <div className="form-row">
                                            <div className="form-group">
                                                <label htmlFor="licenseNumber">License Number</label>
                                                <input
                                                    type="text"
                                                    id="licenseNumber"
                                                    name="licenseNumber"
                                                    value={profile.licenseNumber}
                                                    onChange={handleProfileChange}
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label htmlFor="insuranceProvider">Insurance Provider</label>
                                                <input
                                                    type="text"
                                                    id="insuranceProvider"
                                                    name="insuranceProvider"
                                                    value={profile.insuranceProvider}
                                                    onChange={handleProfileChange}
                                                />
                                            </div>
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="insurancePolicy">Insurance Policy Number</label>
                                            <input
                                                type="text"
                                                id="insurancePolicy"
                                                name="insurancePolicy"
                                                value={profile.insurancePolicy}
                                                onChange={handleProfileChange}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    /* Display mode */
                                    <>
                                        <h3>{profile.companyName || 'Your Company Name'}</h3>
                                        <p className="company-description">{profile.description || 'No company description provided'}</p>

                                        <div className="detail-grid">
                                            <div className="detail-item">
                                                <i className="fas fa-envelope"></i>
                                                <span>{profile.contactEmail || 'No email provided'}</span>
                                            </div>

                                            <div className="detail-item">
                                                <i className="fas fa-phone"></i>
                                                <span>{profile.contactPhone || 'No phone provided'}</span>
                                            </div>

                                            <div className="detail-item">
                                                <i className="fas fa-globe"></i>
                                                <span>{profile.website ? (
                                                    <a href={profile.website} target="_blank" rel="noopener noreferrer">
                                                        {profile.website}
                                                    </a>
                                                ) : 'No website provided'}</span>
                                            </div>

                                            <div className="detail-item">
                                                <i className="fas fa-calendar"></i>
                                                <span>Founded: {profile.founded || 'N/A'}</span>
                                            </div>

                                            <div className="detail-item">
                                                <i className="fas fa-users"></i>
                                                <span>{profile.employeeCount || '0'} Employees</span>
                                            </div>

                                            <div className="detail-item">
                                                <i className="fas fa-id-card"></i>
                                                <span>License: {profile.licenseNumber || 'N/A'}</span>
                                            </div>

                                            <div className="detail-item">
                                                <i className="fas fa-shield-alt"></i>
                                                <span>Insurance: {profile.insuranceProvider || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="profile-section services-section">
                        <h2>Services & Coverage</h2>
                        <div className="section-content">
                            {isEditing ? (
                                <div className="edit-form">
                                    <div className="form-group">
                                        <label htmlFor="trades">Trades/Services Offered</label>
                                        <select
                                            id="trades"
                                            name="trades"
                                            multiple
                                            value={profile.trades}
                                            onChange={handleTradeChange}
                                            className="multi-select"
                                        >
                                            {availableTrades.map((trade) => (
                                                <option key={trade} value={trade}>
                                                    {trade}
                                                </option>
                                            ))}
                                        </select>
                                        <small>Hold Ctrl (or Cmd) to select multiple options</small>
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="serviceAreas">Service Areas</label>
                                        <select
                                            id="serviceAreas"
                                            name="serviceAreas"
                                            multiple
                                            value={profile.serviceAreas}
                                            onChange={handleServiceAreaChange}
                                            className="multi-select"
                                        >
                                            {availableLocations.map((location) => (
                                                <option key={location} value={location}>
                                                    {location}
                                                </option>
                                            ))}
                                        </select>
                                        <small>Hold Ctrl (or Cmd) to select multiple options</small>
                                    </div>
                                </div>
                            ) : (
                                /* Display mode */
                                <div className="services-display">
                                    <div className="trades-list">
                                        <h3>Services Offered</h3>
                                        {profile.trades && profile.trades.length > 0 ? (
                                            <div className="tag-list">
                                                {profile.trades.map((trade) => (
                                                    <span key={trade} className="tag">{trade}</span>
                                                ))}
                                            </div>
                                        ) : (
                                            <p>No services specified</p>
                                        )}
                                    </div>

                                    <div className="service-areas">
                                        <h3>Service Areas</h3>
                                        {profile.serviceAreas && profile.serviceAreas.length > 0 ? (
                                            <div className="tag-list">
                                                {profile.serviceAreas.map((area) => (
                                                    <span key={area} className="tag">{area}</span>
                                                ))}
                                            </div>
                                        ) : (
                                            <p>No service areas specified</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="profile-section portfolio-section">
                        <h2>Portfolio Projects</h2>

                        {isEditing && (
                            <div className="section-content">
                                <div className="new-portfolio-form">
                                    <h3>Add New Portfolio Project</h3>
                                    <form onSubmit={addPortfolioProject}>
                                        <div className="form-group">
                                            <label htmlFor="projectTitle">Project Title</label>
                                            <input
                                                type="text"
                                                id="projectTitle"
                                                name="title"
                                                value={newProject.title}
                                                onChange={handleNewProjectChange}
                                                required
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="projectDescription">Description</label>
                                            <textarea
                                                id="projectDescription"
                                                name="description"
                                                value={newProject.description}
                                                onChange={handleNewProjectChange}
                                                rows="3"
                                                required
                                            ></textarea>
                                        </div>

                                        <div className="form-row">
                                            <div className="form-group">
                                                <label htmlFor="projectLocation">Location</label>
                                                <input
                                                    type="text"
                                                    id="projectLocation"
                                                    name="location"
                                                    value={newProject.location}
                                                    onChange={handleNewProjectChange}
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label htmlFor="projectCompletionDate">Completion Date</label>
                                                <input
                                                    type="date"
                                                    id="projectCompletionDate"
                                                    name="completionDate"
                                                    value={newProject.completionDate}
                                                    onChange={handleNewProjectChange}
                                                />
                                            </div>
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="projectClientName">Client Name</label>
                                            <input
                                                type="text"
                                                id="projectClientName"
                                                name="clientName"
                                                value={newProject.clientName}
                                                onChange={handleNewProjectChange}
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label>Project Images</label>
                                            <div className="image-upload-container">
                                                <label htmlFor="project-images" className="upload-btn">
                                                    <i className="fas fa-cloud-upload-alt"></i> Upload Images
                                                </label>
                                                <input
                                                    type="file"
                                                    id="project-images"
                                                    accept="image/*"
                                                    multiple
                                                    onChange={handleProjectImageUpload}
                                                    style={{ display: 'none' }}
                                                />

                                                <div className="image-preview-container">
                                                    {newProject.images.map((url, index) => (
                                                        <div key={index} className="image-preview">
                                                            <img src={url} alt={`Preview ${index + 1}`} />
                                                            <button
                                                                type="button"
                                                                className="remove-image-btn"
                                                                onClick={() => {
                                                                    const updatedImages = [...newProject.images];
                                                                    updatedImages.splice(index, 1);
                                                                    setNewProject({
                                                                        ...newProject,
                                                                        images: updatedImages
                                                                    });
                                                                }}
                                                            >
                                                                <i className="fas fa-times"></i>
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <button type="submit" className="add-project-btn">
                                            <i className="fas fa-plus"></i> Add Project
                                        </button>
                                    </form>
                                </div>
                            </div>
                        )}

                        <div className="portfolio-projects">
                            {portfolioProjects.length === 0 ? (
                                <div className="no-projects">
                                    <p>No portfolio projects added yet</p>
                                    {isEditing && (
                                        <p>Add your first project to showcase your work</p>
                                    )}
                                </div>
                            ) : (
                                <div className="projects-grid">
                                    {portfolioProjects.map((project) => (
                                        <div key={project.id} className="portfolio-card">
                                            <div className="portfolio-images">
                                                {project.images && project.images.length > 0 ? (
                                                    <img
                                                        src={project.images[0]}
                                                        alt={project.title}
                                                        className="main-image"
                                                    />
                                                ) : (
                                                    <div className="image-placeholder">
                                                        <i className="fas fa-image"></i>
                                                    </div>
                                                )}

                                                {project.images && project.images.length > 1 && (
                                                    <div className="thumbnail-row">
                                                        {project.images.slice(1, 4).map((img, idx) => (
                                                            <img
                                                                key={idx}
                                                                src={img}
                                                                alt={`${project.title} thumbnail ${idx + 1}`}
                                                                className="thumbnail"
                                                            />
                                                        ))}
                                                        {project.images.length > 4 && (
                                                            <div className="more-images">
                                                                +{project.images.length - 4}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="portfolio-content">
                                                <h3>{project.title}</h3>
                                                <p className="project-description">{project.description}</p>

                                                <div className="project-details">
                                                    {project.location && (
                                                        <div className="detail-item">
                                                            <i className="fas fa-map-marker-alt"></i>
                                                            <span>{project.location}</span>
                                                        </div>
                                                    )}

                                                    {project.completionDate && (
                                                        <div className="detail-item">
                                                            <i className="fas fa-calendar-check"></i>
                                                            <span>Completed: {formatDate(project.completionDate)}</span>
                                                        </div>
                                                    )}

                                                    {project.clientName && (
                                                        <div className="detail-item">
                                                            <i className="fas fa-user"></i>
                                                            <span>Client: {project.clientName}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {isEditing && (
                                                    <button
                                                        className="delete-project-btn"
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

                    <div className="profile-section stats-section">
                        <h2>Company Statistics</h2>
                        <div className="stats-container">
                            <div className="stat-card">
                                <div className="stat-icon">
                                    <i className="fas fa-star"></i>
                                </div>
                                <div className="stat-info">
                                    <h3>Rating</h3>
                                    <p className="stat-value">{profile.rating?.toFixed(1) || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-icon">
                                    <i className="fas fa-check-circle"></i>
                                </div>
                                <div className="stat-info">
                                    <h3>Completed Projects</h3>
                                    <p className="stat-value">{profile.completedProjects || '0'}</p>
                                </div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-icon">
                                    <i className="fas fa-business-time"></i>
                                </div>
                                <div className="stat-info">
                                    <h3>Years in Business</h3>
                                    <p className="stat-value">{profile.yearsInBusiness || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-icon">
                                    <i className="fas fa-tools"></i>
                                </div>
                                <div className="stat-info">
                                    <h3>Services Offered</h3>
                                    <p className="stat-value">{profile.trades?.length || '0'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompanyProfile;
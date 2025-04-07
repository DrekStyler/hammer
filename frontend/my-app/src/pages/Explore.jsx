import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, orderBy, limit, getDocs, startAfter } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useRole } from '../contexts/RoleContext';
import useTranslation from '../utils/useTranslation';
import { db } from '../firebase/config';
import './Explore.css';

const Explore = () => {
    const { currentUser } = useAuth();
    const { isPrime } = useRole();
    const { t } = useTranslation();

    // State for contractors
    const [contractors, setContractors] = useState([]);
    const [contractorsLoading, setContractorsLoading] = useState(true);
    const [contractorsError, setContractorsError] = useState(null);
    const [lastContractorDoc, setLastContractorDoc] = useState(null);
    const [hasMoreContractors, setHasMoreContractors] = useState(true);

    // State for projects
    const [projects, setProjects] = useState([]);
    const [projectsLoading, setProjectsLoading] = useState(true);
    const [projectsError, setProjectsError] = useState(null);
    const [lastProjectDoc, setLastProjectDoc] = useState(null);
    const [hasMoreProjects, setHasMoreProjects] = useState(true);

    // State for filters
    const [tradeFilter, setTradeFilter] = useState('all');
    const [locationFilter, setLocationFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Timeout state
    const [showTimeoutMessage, setShowTimeoutMessage] = useState(false);
    const timeoutRef = useRef(null);
    const userActivityRef = useRef(false);

    // User location (placeholder - would get from user profile or geolocation)
    const [userLocation, setUserLocation] = useState({ city: 'San Francisco', state: 'CA' });

    // List of trades for filter
    const trades = [
        'Electrical', 'Plumbing', 'Carpentry', 'HVAC',
        'Drywall', 'Painting', 'Flooring', 'Concrete',
        'Landscaping', 'Roofing', 'Tiling', 'General'
    ];

    // List of locations for filter (example)
    const locations = [
        'San Francisco, CA', 'Los Angeles, CA', 'New York, NY',
        'Chicago, IL', 'Denver, CO', 'Miami, FL', 'Seattle, WA'
    ];

    // Setup timeout effect
    useEffect(() => {
        // Function to handle user activity
        const handleUserActivity = () => {
            userActivityRef.current = true;
            setShowTimeoutMessage(false);

            // Reset the timeout
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            // Set a new timeout
            timeoutRef.current = setTimeout(() => {
                if (userActivityRef.current) {
                    setShowTimeoutMessage(true);
                    userActivityRef.current = false;
                    console.log('User inactive for 1 minute, triggering timeout');
                }
            }, 60000); // 1 minute timeout
        };

        // Add event listeners for user activity
        window.addEventListener('mousemove', handleUserActivity);
        window.addEventListener('keydown', handleUserActivity);
        window.addEventListener('click', handleUserActivity);
        window.addEventListener('scroll', handleUserActivity);

        // Trigger initial timeout
        handleUserActivity();

        // Cleanup function to remove event listeners and clear timeout
        return () => {
            window.removeEventListener('mousemove', handleUserActivity);
            window.removeEventListener('keydown', handleUserActivity);
            window.removeEventListener('click', handleUserActivity);
            window.removeEventListener('scroll', handleUserActivity);

            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    // Function to handle timeout reset and refresh data
    const handleTimeoutReset = () => {
        setShowTimeoutMessage(false);
        userActivityRef.current = true;

        // Refresh data
        loadContractors();
        loadProjects();
    };

    // Load contractors initially
    useEffect(() => {
        loadContractors();
    }, [currentUser, tradeFilter, locationFilter, searchTerm]);

    // Load projects initially
    useEffect(() => {
        loadProjects();
    }, [currentUser, locationFilter, searchTerm]);

    // Function to load contractors
    const loadContractors = async (loadMore = false) => {
        if (contractorsLoading && !loadMore) return;

        try {
            setContractorsLoading(true);

            // Build the query
            let contractorsQuery;

            // Simplified query that doesn't filter out current user's contractors
            // and doesn't depend on all documents having createdAt or createdBy fields
            contractorsQuery = query(
                collection(db, 'contractors'),
                limit(20)
            );

            // If loading more, start after last document
            if (loadMore && lastContractorDoc) {
                contractorsQuery = query(
                    collection(db, 'contractors'),
                    startAfter(lastContractorDoc),
                    limit(20)
                );
            } else if (loadMore && !lastContractorDoc) {
                setContractorsLoading(false);
                return;
            }

            const querySnapshot = await getDocs(contractorsQuery);

            // If no documents or fewer than limit, no more to load
            if (querySnapshot.empty || querySnapshot.docs.length < 20) {
                setHasMoreContractors(false);
            }

            // Get the last document for pagination
            const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
            setLastContractorDoc(lastDoc);

            // Convert the documents to data objects
            const contractorData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Apply filters in memory
            const filtered = contractorData.filter(contractor => {
                // Skip the user's own contractors if we have a logged-in user
                if (currentUser?.uid && contractor.createdBy === currentUser.uid) {
                    return false;
                }

                // Trade filter
                if (tradeFilter !== 'all' && contractor.trade !== tradeFilter) {
                    return false;
                }

                // Location filter (simplified for demonstration)
                if (locationFilter !== 'all') {
                    const [city, state] = locationFilter.split(', ');
                    if (contractor.city !== city || contractor.state !== state) {
                        return false;
                    }
                }

                // Search filter
                if (searchTerm.trim() !== '') {
                    const term = searchTerm.toLowerCase();
                    return (
                        contractor.name?.toLowerCase().includes(term) ||
                        contractor.companyName?.toLowerCase().includes(term) ||
                        contractor.contactPerson?.toLowerCase().includes(term) ||
                        contractor.trade?.toLowerCase().includes(term)
                    );
                }

                return true;
            });

            // Update state
            if (loadMore) {
                setContractors(prev => [...prev, ...filtered]);
            } else {
                setContractors(filtered);
            }

            // Log what we found
            console.log(`Found ${contractorData.length} contractors, ${filtered.length} after filtering`);

        } catch (error) {
            console.error('Error loading contractors:', error);
            setContractorsError(error.message);
        } finally {
            setContractorsLoading(false);
        }
    };

    // Function to load projects
    const loadProjects = async (loadMore = false) => {
        if (projectsLoading && !loadMore) return;

        try {
            setProjectsLoading(true);

            // Build the query - simplified to return all projects
            let projectsQuery = query(
                collection(db, 'projects'),
                limit(20)
            );

            // If loading more, start after last document
            if (loadMore && lastProjectDoc) {
                projectsQuery = query(
                    collection(db, 'projects'),
                    startAfter(lastProjectDoc),
                    limit(20)
                );
            } else if (loadMore && !lastProjectDoc) {
                setProjectsLoading(false);
                return;
            }

            const querySnapshot = await getDocs(projectsQuery);

            // If no documents or fewer than limit, no more to load
            if (querySnapshot.empty || querySnapshot.docs.length < 20) {
                setHasMoreProjects(false);
            }

            // Get the last document for pagination
            const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
            setLastProjectDoc(lastDoc);

            // Convert the documents to data objects
            const projectData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Apply filters in memory
            const filtered = projectData.filter(project => {
                // Location filter (simplified for demonstration)
                if (locationFilter !== 'all') {
                    const [city, state] = locationFilter.split(', ');
                    return project.location?.includes(city) || project.location?.includes(state);
                }

                // Search filter
                if (searchTerm.trim() !== '') {
                    const term = searchTerm.toLowerCase();
                    return (
                        project.title?.toLowerCase().includes(term) ||
                        project.description?.toLowerCase().includes(term) ||
                        project.clientName?.toLowerCase().includes(term)
                    );
                }

                return true;
            });

            // Update state
            if (loadMore) {
                setProjects(prev => [...prev, ...filtered]);
            } else {
                setProjects(filtered);
            }

            // Log what we found
            console.log(`Found ${projectData.length} projects, ${filtered.length} after filtering`);

        } catch (error) {
            console.error('Error loading projects:', error);
            setProjectsError(error.message);
        } finally {
            setProjectsLoading(false);
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
        <div className="explore-container">
            {showTimeoutMessage && (
                <div className="timeout-overlay">
                    <div className="timeout-message">
                        <h3>Your session has timed out</h3>
                        <p>You have been inactive for more than a minute.</p>
                        <button
                            onClick={handleTimeoutReset}
                            className="timeout-reset-btn"
                        >
                            <i className="fas fa-sync-alt"></i> Refresh Data
                        </button>
                    </div>
                </div>
            )}

            <div className="explore-header">
                <h1>Explore</h1>
                <p className="explore-subtitle">Discover contractors and projects in your area</p>
            </div>

            <div className="explore-filters">
                <div className="search-container">
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>

                <div className="filter-container">
                    <div className="filter-group">
                        <label htmlFor="trade-filter">Trade:</label>
                        <select
                            id="trade-filter"
                            value={tradeFilter}
                            onChange={(e) => setTradeFilter(e.target.value)}
                            className="filter-select"
                        >
                            <option value="all">All Trades</option>
                            {trades.map(trade => (
                                <option key={trade} value={trade}>{trade}</option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label htmlFor="location-filter">Location:</label>
                        <select
                            id="location-filter"
                            value={locationFilter}
                            onChange={(e) => setLocationFilter(e.target.value)}
                            className="filter-select"
                        >
                            <option value="all">All Locations</option>
                            {locations.map(location => (
                                <option key={location} value={location}>{location}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="explore-grid">
                {/* Contractors Section */}
                <div className="explore-section contractors-section">
                    <div className="section-header">
                        <h2>Available Contractors</h2>
                        <span className="count-badge">{contractors.length}</span>
                    </div>

                    {contractorsError && (
                        <div className="error-message">{contractorsError}</div>
                    )}

                    {contractorsLoading && contractors.length === 0 ? (
                        <div className="loading-spinner">{t('loading')}</div>
                    ) : (
                        <>
                            {contractors.length === 0 ? (
                                <div className="no-results">
                                    No contractors found for your search criteria.
                                </div>
                            ) : (
                                <div className="contractors-grid">
                                    {contractors.map(contractor => (
                                        <div key={contractor.id} className="contractor-card">
                                            <div className="contractor-card-header">
                                                <h3>{contractor.companyName || contractor.name || 'Unnamed'}</h3>
                                                {contractor.trade && (
                                                    <span className="trade-badge">{contractor.trade}</span>
                                                )}
                                            </div>
                                            <div className="contractor-details">
                                                {contractor.contactPerson && (
                                                    <div className="detail-item">
                                                        <i className="fas fa-user"></i>
                                                        <span>{contractor.contactPerson}</span>
                                                    </div>
                                                )}
                                                {contractor.email && (
                                                    <div className="detail-item">
                                                        <i className="fas fa-envelope"></i>
                                                        <span>{contractor.email}</span>
                                                    </div>
                                                )}
                                                {contractor.phone && (
                                                    <div className="detail-item">
                                                        <i className="fas fa-phone"></i>
                                                        <span>{contractor.phone}</span>
                                                    </div>
                                                )}
                                                {(contractor.city || contractor.state) && (
                                                    <div className="detail-item">
                                                        <i className="fas fa-map-marker-alt"></i>
                                                        <span>
                                                            {contractor.city ? contractor.city : ''}
                                                            {contractor.city && contractor.state ? ', ' : ''}
                                                            {contractor.state ? contractor.state : ''}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="contractor-actions">
                                                <button className="action-btn connect-btn">
                                                    <i className="fas fa-user-plus"></i> Connect
                                                </button>
                                                <button className="action-btn details-btn">
                                                    <i className="fas fa-info-circle"></i> Details
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {hasMoreContractors && !contractorsLoading && (
                                <div className="load-more">
                                    <button
                                        className="load-more-btn"
                                        onClick={() => loadContractors(true)}
                                    >
                                        Load More Contractors
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Projects Section */}
                <div className="explore-section projects-section">
                    <div className="section-header">
                        <h2>Projects Near You</h2>
                        <span className="count-badge">{projects.length}</span>
                    </div>

                    {projectsError && (
                        <div className="error-message">{projectsError}</div>
                    )}

                    {projectsLoading && projects.length === 0 ? (
                        <div className="loading-spinner">{t('loading')}</div>
                    ) : (
                        <>
                            {projects.length === 0 ? (
                                <div className="no-results">
                                    No projects found for your search criteria.
                                </div>
                            ) : (
                                <div className="projects-list">
                                    {projects.map(project => (
                                        <div key={project.id} className="project-card">
                                            <div className="project-card-header">
                                                <h3>{project.title || 'Untitled'}</h3>
                                                {project.status && (
                                                    <span className={`status-badge status-${project.status.toLowerCase()}`}>
                                                        {project.status}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="project-description">
                                                {project.description || 'No description available'}
                                            </p>
                                            <div className="project-details">
                                                {project.clientName && (
                                                    <div className="detail-item">
                                                        <i className="fas fa-building"></i>
                                                        <span>{project.clientName}</span>
                                                    </div>
                                                )}
                                                {project.location && (
                                                    <div className="detail-item">
                                                        <i className="fas fa-map-marker-alt"></i>
                                                        <span>{project.location}</span>
                                                    </div>
                                                )}
                                                {project.budget && (
                                                    <div className="detail-item">
                                                        <i className="fas fa-dollar-sign"></i>
                                                        <span>${project.budget.toLocaleString()}</span>
                                                    </div>
                                                )}
                                                {project.createdAt && (
                                                    <div className="detail-item">
                                                        <i className="fas fa-calendar"></i>
                                                        <span>Posted: {formatDate(project.createdAt)}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="project-actions">
                                                <button className="action-btn details-btn">
                                                    <i className="fas fa-info-circle"></i> View Details
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {hasMoreProjects && !projectsLoading && (
                                <div className="load-more">
                                    <button
                                        className="load-more-btn"
                                        onClick={() => loadProjects(true)}
                                    >
                                        Load More Projects
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Explore;
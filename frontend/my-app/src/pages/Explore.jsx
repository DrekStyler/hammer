import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, orderBy, limit, getDocs, startAfter } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useRole } from '../contexts/RoleContext';
import useTranslation from '../utils/useTranslation';
import { db } from '../firebase/config';

// Comprehensive styles object
const styles = {
    // Container and layout
    exploreContainer: {
        padding: '30px',
        maxWidth: '1600px',
        margin: '0 auto',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    },
    exploreHeader: {
        marginBottom: '32px',
        textAlign: 'center'
    },
    headerTitle: {
        fontSize: '32px',
        fontWeight: '600',
        color: '#333',
        margin: '0 0 8px 0'
    },
    exploreSubtitle: {
        fontSize: '16px',
        color: '#666',
        margin: 0
    },
    
    // Filters section
    exploreFilters: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        gap: '16px',
        flexWrap: 'wrap'
    },
    searchContainer: {
        flex: '1',
        minWidth: '250px'
    },
    searchInput: {
        width: '100%',
        padding: '12px 16px',
        fontSize: '14px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        transition: 'border-color 0.2s ease'
    },
    filterContainer: {
        display: 'flex',
        gap: '16px',
        alignItems: 'center',
        flexWrap: 'wrap'
    },
    filterGroup: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
    },
    filterLabel: {
        fontSize: '14px',
        fontWeight: '500',
        color: '#4a5568'
    },
    filterSelect: {
        padding: '10px',
        fontSize: '14px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        backgroundColor: 'white',
        minWidth: '150px'
    },

    // Grid layout
    exploreGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px',
        marginTop: '24px'
    },
    exploreSection: {
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
        padding: '24px'
    },
    sectionHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
    },
    sectionTitle: {
        fontSize: '20px',
        fontWeight: '600',
        color: '#333',
        margin: 0
    },
    countBadge: {
        backgroundColor: '#e2e8f0',
        color: '#4a5568',
        padding: '4px 8px',
        borderRadius: '12px',
        fontSize: '14px'
    },

    // Cards
    contractorsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '20px'
    },
    contractorCard: {
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        padding: '20px',
        transition: 'transform 0.2s ease',
        ':hover': {
            transform: 'translateY(-2px)'
        }
    },
    contractorCardHeader: {
        marginBottom: '16px'
    },
    cardTitle: {
        fontSize: '18px',
        fontWeight: '600',
        color: '#2d3748',
        margin: '0 0 8px 0'
    },
    tradeBadge: {
        backgroundColor: '#ebf8ff',
        color: '#2b6cb0',
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: '500'
    },
    detailItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '8px',
        color: '#4a5568',
        fontSize: '14px'
    },
    
    // Projects
    projectsList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
    },
    projectCard: {
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        padding: '20px'
    },
    projectDescription: {
        fontSize: '14px',
        color: '#4a5568',
        margin: '12px 0'
    },
    statusBadge: {
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: '500'
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

    // Buttons and actions
    actionBtn: {
        padding: '8px 16px',
        borderRadius: '4px',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
        border: 'none',
        transition: 'background-color 0.2s ease'
    },
    connectBtn: {
        backgroundColor: '#4299e1',
        color: 'white',
        ':hover': {
            backgroundColor: '#3182ce'
        }
    },
    detailsBtn: {
        backgroundColor: '#edf2f7',
        color: '#4a5568',
        ':hover': {
            backgroundColor: '#e2e8f0'
        }
    },
    loadMoreBtn: {
        backgroundColor: '#4299e1',
        color: 'white',
        padding: '10px 20px',
        borderRadius: '4px',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
        border: 'none',
        margin: '24px auto',
        display: 'block',
        transition: 'background-color 0.2s ease',
        ':hover': {
            backgroundColor: '#3182ce'
        }
    },

    // Messages and states
    errorMessage: {
        backgroundColor: '#fed7d7',
        color: '#c53030',
        padding: '12px',
        borderRadius: '4px',
        marginBottom: '20px',
        fontSize: '14px'
    },
    loadingSpinner: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '40px 0',
        color: '#4299e1'
    },
    noResults: {
        textAlign: 'center',
        padding: '40px',
        color: '#718096',
        backgroundColor: '#f7fafc',
        borderRadius: '8px'
    },
    
    // Timeout overlay
    timeoutOverlay: {
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
    },
    timeoutMessage: {
        backgroundColor: 'white',
        padding: '24px',
        borderRadius: '8px',
        maxWidth: '400px',
        textAlign: 'center'
    },
    timeoutResetBtn: {
        backgroundColor: '#4299e1',
        color: 'white',
        padding: '10px 20px',
        borderRadius: '4px',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
        border: 'none',
        marginTop: '16px',
        transition: 'background-color 0.2s ease',
        ':hover': {
            backgroundColor: '#3182ce'
        }
    },
    
    // Access denied
    accessDenied: {
        padding: '40px',
        textAlign: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        maxWidth: '600px',
        margin: '40px auto'
    }
};

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
            <div style={styles.accessDenied}>
                <h2>Access Denied</h2>
                <p>You must be logged in as a prime to view this page.</p>
            </div>
        );
    }

    return (
        <div style={styles.exploreContainer}>
            {showTimeoutMessage && (
                <div style={styles.timeoutOverlay}>
                    <div style={styles.timeoutMessage}>
                        <h3>Your session has timed out</h3>
                        <p>You have been inactive for more than a minute.</p>
                        <button
                            onClick={handleTimeoutReset}
                            style={styles.timeoutResetBtn}
                        >
                            <i className="fas fa-sync-alt"></i> Refresh Data
                        </button>
                    </div>
                </div>
            )}

            <div style={styles.exploreHeader}>
                <h1 style={styles.headerTitle}>Explore</h1>
                <p style={styles.exploreSubtitle}>Discover contractors and projects in your area</p>
            </div>

            <div style={styles.exploreFilters}>
                <div style={styles.searchContainer}>
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={styles.searchInput}
                    />
                </div>

                <div style={styles.filterContainer}>
                    <div style={styles.filterGroup}>
                        <label htmlFor="trade-filter" style={styles.filterLabel}>Trade:</label>
                        <select
                            id="trade-filter"
                            value={tradeFilter}
                            onChange={(e) => setTradeFilter(e.target.value)}
                            style={styles.filterSelect}
                        >
                            <option value="all">All Trades</option>
                            {trades.map(trade => (
                                <option key={trade} value={trade}>{trade}</option>
                            ))}
                        </select>
                    </div>

                    <div style={styles.filterGroup}>
                        <label htmlFor="location-filter" style={styles.filterLabel}>Location:</label>
                        <select
                            id="location-filter"
                            value={locationFilter}
                            onChange={(e) => setLocationFilter(e.target.value)}
                            style={styles.filterSelect}
                        >
                            <option value="all">All Locations</option>
                            {locations.map(location => (
                                <option key={location} value={location}>{location}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div style={styles.exploreGrid}>
                {/* Contractors Section */}
                <div style={styles.exploreSection}>
                    <div style={styles.sectionHeader}>
                        <h2 style={styles.sectionTitle}>Available Contractors</h2>
                        <span style={styles.countBadge}>{contractors.length}</span>
                    </div>

                    {contractorsError && (
                        <div style={styles.errorMessage}>{contractorsError}</div>
                    )}

                    {contractorsLoading && contractors.length === 0 ? (
                        <div style={styles.loadingSpinner}>{t('loading')}</div>
                    ) : (
                        <>
                            {contractors.length === 0 ? (
                                <div style={styles.noResults}>
                                    No contractors found for your search criteria.
                                </div>
                            ) : (
                                <div style={styles.contractorsGrid}>
                                    {contractors.map(contractor => (
                                        <div key={contractor.id} style={styles.contractorCard}>
                                            <div style={styles.contractorCardHeader}>
                                                <h3 style={styles.cardTitle}>
                                                    {contractor.companyName || contractor.name || 'Unnamed'}
                                                </h3>
                                                {contractor.trade && (
                                                    <span style={styles.tradeBadge}>{contractor.trade}</span>
                                                )}
                                            </div>
                                            <div>
                                                {contractor.contactPerson && (
                                                    <div style={styles.detailItem}>
                                                        <i className="fas fa-user"></i>
                                                        <span>{contractor.contactPerson}</span>
                                                    </div>
                                                )}
                                                {contractor.email && (
                                                    <div style={styles.detailItem}>
                                                        <i className="fas fa-envelope"></i>
                                                        <span>{contractor.email}</span>
                                                    </div>
                                                )}
                                                {contractor.phone && (
                                                    <div style={styles.detailItem}>
                                                        <i className="fas fa-phone"></i>
                                                        <span>{contractor.phone}</span>
                                                    </div>
                                                )}
                                                {(contractor.city || contractor.state) && (
                                                    <div style={styles.detailItem}>
                                                        <i className="fas fa-map-marker-alt"></i>
                                                        <span>
                                                            {contractor.city ? contractor.city : ''}
                                                            {contractor.city && contractor.state ? ', ' : ''}
                                                            {contractor.state ? contractor.state : ''}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                                                <button style={{...styles.actionBtn, ...styles.connectBtn}}>
                                                    <i className="fas fa-user-plus"></i> Connect
                                                </button>
                                                <button style={{...styles.actionBtn, ...styles.detailsBtn}}>
                                                    <i className="fas fa-info-circle"></i> Details
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {hasMoreContractors && !contractorsLoading && (
                                <button
                                    style={styles.loadMoreBtn}
                                    onClick={() => loadContractors(true)}
                                >
                                    Load More Contractors
                                </button>
                            )}
                        </>
                    )}
                </div>

                {/* Projects Section */}
                <div style={styles.exploreSection}>
                    <div style={styles.sectionHeader}>
                        <h2 style={styles.sectionTitle}>Projects Near You</h2>
                        <span style={styles.countBadge}>{projects.length}</span>
                    </div>

                    {projectsError && (
                        <div style={styles.errorMessage}>{projectsError}</div>
                    )}

                    {projectsLoading && projects.length === 0 ? (
                        <div style={styles.loadingSpinner}>{t('loading')}</div>
                    ) : (
                        <>
                            {projects.length === 0 ? (
                                <div style={styles.noResults}>
                                    No projects found for your search criteria.
                                </div>
                            ) : (
                                <div style={styles.projectsList}>
                                    {projects.map(project => (
                                        <div key={project.id} style={styles.projectCard}>
                                            <div style={styles.contractorCardHeader}>
                                                <h3 style={styles.cardTitle}>{project.title || 'Untitled'}</h3>
                                                {project.status && (
                                                    <span style={{
                                                        ...styles.statusBadge,
                                                        ...(project.status.toLowerCase() === 'open' ? styles.statusOpen :
                                                            project.status.toLowerCase() === 'in progress' ? styles.statusInProgress :
                                                            styles.statusCompleted)
                                                    }}>
                                                        {project.status}
                                                    </span>
                                                )}
                                            </div>
                                            <p style={styles.projectDescription}>
                                                {project.description || 'No description available'}
                                            </p>
                                            <div>
                                                {project.clientName && (
                                                    <div style={styles.detailItem}>
                                                        <i className="fas fa-building"></i>
                                                        <span>{project.clientName}</span>
                                                    </div>
                                                )}
                                                {project.location && (
                                                    <div style={styles.detailItem}>
                                                        <i className="fas fa-map-marker-alt"></i>
                                                        <span>{project.location}</span>
                                                    </div>
                                                )}
                                                {project.budget && (
                                                    <div style={styles.detailItem}>
                                                        <i className="fas fa-dollar-sign"></i>
                                                        <span>${project.budget.toLocaleString()}</span>
                                                    </div>
                                                )}
                                                {project.createdAt && (
                                                    <div style={styles.detailItem}>
                                                        <i className="fas fa-calendar"></i>
                                                        <span>Posted: {formatDate(project.createdAt)}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ marginTop: '16px' }}>
                                                <button style={{...styles.actionBtn, ...styles.detailsBtn}}>
                                                    <i className="fas fa-info-circle"></i> View Details
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {hasMoreProjects && !projectsLoading && (
                                <button
                                    style={styles.loadMoreBtn}
                                    onClick={() => loadProjects(true)}
                                >
                                    Load More Projects
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Explore;
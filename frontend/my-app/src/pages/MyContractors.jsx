import React, { useState, useRef, useEffect } from 'react';
import { collection, addDoc, where, orderBy, Timestamp } from 'firebase/firestore';
import { useFirestoreQuery } from '../hooks/useFirestore';
import { useAuth } from '../contexts/AuthContext';
import { useRole } from '../contexts/RoleContext';
import useTranslation from '../utils/useTranslation';
import { db } from '../firebase/config';
import Papa from 'papaparse';
import { getAllContractors, createContractor } from '../api/dataService';
import { Link, useNavigate } from 'react-router-dom';

// Comprehensive styles object
const styles = {
    // Container and layout
    myContractorsContainer: {
        padding: '30px',
        maxWidth: '1600px',
        margin: '0 auto',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    },
    contractorsHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
    },
    headerTitle: {
        color: '#333',
        fontSize: '28px',
        fontWeight: '600',
        margin: 0
    },
    contractorActions: {
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap'
    },
    importBtn: {
        backgroundColor: '#34A853',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        padding: '10px 20px',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        transition: 'background-color 0.2s ease'
    },
    createContractorBtn: {
        backgroundColor: '#1a73e8',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        padding: '10px 20px',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        transition: 'background-color 0.2s ease'
    },
    
    // Controls section
    contractorsControls: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        gap: '16px',
        flexWrap: 'wrap'
    },
    searchContainer: {
        flex: '1',
        minWidth: '250px'
    },
    searchInput: {
        width: '100%',
        padding: '10px 16px',
        fontSize: '14px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        transition: 'border-color 0.2s ease'
    },
    filterContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
    },
    filterLabel: {
        fontWeight: '500',
        color: '#4a5568'
    },
    tradeFilter: {
        padding: '10px',
        fontSize: '14px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        backgroundColor: 'white',
        minWidth: '150px'
    },
    
    // Messages
    accessDenied: {
        padding: '40px',
        textAlign: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        maxWidth: '600px',
        margin: '40px auto'
    },
    errorMessage: {
        backgroundColor: '#fed7d7',
        color: '#c53030',
        padding: '12px',
        borderRadius: '4px',
        marginBottom: '20px',
        fontSize: '14px',
        textAlign: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px'
    },
    
    // Loading
    loadingSpinner: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '40px 0',
        color: '#1a73e8',
        fontSize: '16px'
    },
    
    // No results message
    noResults: {
        textAlign: 'center',
        padding: '30px',
        color: '#718096',
        backgroundColor: '#f7fafc',
        borderRadius: '4px',
        margin: '10px 0'
    },
    
    // Table styles
    tableContainer: {
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
        overflow: 'auto',
        marginBottom: '24px'
    },
    contractorsTable: {
        width: '100%',
        borderSpacing: 0,
        borderCollapse: 'collapse',
        fontSize: '14px'
    },
    tableHeader: {
        position: 'sticky',
        top: 0,
        backgroundColor: '#f8f9fa',
        padding: '16px',
        textAlign: 'left',
        color: '#5f6368',
        fontWeight: '500',
        borderBottom: '1px solid #e0e0e0'
    },
    tableCell: {
        padding: '14px 16px',
        borderBottom: '1px solid #eeeeee',
        color: '#202124'
    },
    contractorNameLink: {
        color: '#1a73e8',
        textDecoration: 'none',
        fontWeight: '500',
        transition: 'color 0.2s ease'
    },
    actionsCell: {
        padding: '14px 16px',
        borderBottom: '1px solid #eeeeee',
        display: 'flex',
        gap: '8px'
    },
    actionBtn: {
        backgroundColor: 'transparent',
        border: 'none',
        cursor: 'pointer',
        padding: '6px',
        borderRadius: '50%',
        transition: 'background-color 0.2s ease'
    },
    viewBtn: {
        color: '#1a73e8'
    },
    editBtn: {
        color: '#F9AB00'
    },
    
    // Modal styles
    modalOverlay: {
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
    modalContent: {
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)',
        width: '90%',
        maxWidth: '700px',
        maxHeight: '90vh',
        overflow: 'auto',
        padding: '24px'
    },
    modalHeader: {
        fontSize: '20px',
        fontWeight: '600',
        color: '#333',
        marginBottom: '20px'
    },
    
    // Form styles
    formRow: {
        display: 'flex',
        gap: '16px',
        marginBottom: '16px',
        flexWrap: 'wrap'
    },
    formGroup: {
        flex: '1',
        minWidth: '200px',
        marginBottom: '16px'
    },
    label: {
        display: 'block',
        marginBottom: '6px',
        fontWeight: '500',
        color: '#4a5568',
        fontSize: '14px'
    },
    input: {
        width: '100%',
        padding: '10px',
        fontSize: '14px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        transition: 'border-color 0.2s'
    },
    textarea: {
        width: '100%',
        padding: '10px',
        fontSize: '14px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        transition: 'border-color 0.2s',
        resize: 'vertical'
    },
    formActions: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '12px',
        marginTop: '24px'
    },
    cancelBtn: {
        padding: '10px 20px',
        backgroundColor: '#f1f5f9',
        color: '#4a5568',
        border: 'none',
        borderRadius: '4px',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer'
    },
    submitBtn: {
        padding: '10px 20px',
        backgroundColor: '#1a73e8',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer'
    },
    
    // CSV import styles
    csvUploadSection: {
        padding: '20px 0'
    },
    csvHelp: {
        fontSize: '14px',
        color: '#718096',
        marginBottom: '16px'
    },
    templateLink: {
        marginBottom: '20px'
    },
    templateDownloadLink: {
        color: '#1a73e8',
        textDecoration: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '14px'
    },
    fileUpload: {
        border: '2px dashed #cbd5e0',
        borderRadius: '8px',
        padding: '40px 20px',
        textAlign: 'center',
        backgroundColor: '#f7fafc',
        position: 'relative',
        transition: 'all 0.3s ease',
        marginBottom: '20px'
    },
    dragging: {
        backgroundColor: '#ebf8ff',
        borderColor: '#63b3ed'
    },
    fileInput: {
        display: 'none'
    },
    fileLabel: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        backgroundColor: '#4299e1',
        color: 'white',
        padding: '10px 20px',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '500',
        marginBottom: '16px'
    },
    fileTypeIndicator: {
        fontSize: '12px',
        color: '#718096',
        marginBottom: '8px'
    },
    dragDropHint: {
        fontSize: '14px',
        color: '#4a5568',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px'
    },
    
    // CSV mapping section
    csvMappingSection: {
        marginTop: '20px'
    },
    mappingContainer: {
        marginTop: '20px',
        marginBottom: '20px',
        maxHeight: '300px',
        overflow: 'auto',
        border: '1px solid #e2e8f0',
        borderRadius: '4px'
    },
    mappingTable: {
        width: '100%',
        borderSpacing: 0,
        borderCollapse: 'collapse',
        fontSize: '14px'
    },
    previewSection: {
        marginTop: '24px'
    },
    previewTableContainer: {
        maxHeight: '200px',
        overflow: 'auto',
        border: '1px solid #e2e8f0',
        borderRadius: '4px'
    },
    previewTable: {
        width: '100%',
        borderSpacing: 0,
        borderCollapse: 'collapse',
        fontSize: '13px'
    },
    previewCell: {
        maxWidth: '150px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
    }
};

const MyContractors = () => {
    const { currentUser } = useAuth();
    const { isPrime } = useRole();
    const { t } = useTranslation();
    const fileInputRef = useRef(null);
    const navigate = useNavigate();
    const [isDragging, setIsDragging] = useState(false);

    const [contractors, setContractors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [tradeFilter, setTradeFilter] = useState('all');
    const [isCreatingContractor, setIsCreatingContractor] = useState(false);
    const [isImportingContractors, setIsImportingContractors] = useState(false);
    const [csvData, setCsvData] = useState([]);
    const [csvPreview, setCsvPreview] = useState([]);
    const [csvHeaders, setCsvHeaders] = useState([]);
    const [headerMapping, setHeaderMapping] = useState({});
    const [csvImportError, setCsvImportError] = useState(null);

    const [newContractor, setNewContractor] = useState({
        name: '',
        companyName: '',
        contactPerson: '',
        email: '',
        phone: '',
        trade: '',
        city: '',
        state: '',
        address: '',
        zipCode: '',
        notes: ''
    });

    // Fetch contractors using our dataService
    const fetchContractors = async () => {
        try {
            setLoading(true);
            const fetchedContractors = await getAllContractors();
            // Filter contractors for the current user
            const userContractors = fetchedContractors.filter(contractor =>
                contractor.createdBy === currentUser?.uid
            );
            setContractors(userContractors);
            setError(null);
        } catch (err) {
            console.error('Error fetching contractors:', err);
            setError('Failed to load contractors. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    // Load contractors on component mount and when user changes
    useEffect(() => {
        if (currentUser?.uid) {
            fetchContractors();
        }
    }, [currentUser]);

    // Get unique trades for filter
    const trades = [...new Set(contractors.map(c => c.trade).filter(Boolean))];

    // Filter contractors based on search term and trade
    const filteredContractors = contractors.filter(contractor => {
        // Trade filter
        if (tradeFilter !== 'all' && contractor.trade !== tradeFilter) {
            return false;
        }

        // Search filter
        if (searchTerm.trim() !== '') {
            const term = searchTerm.toLowerCase();
            return (
                contractor.name?.toLowerCase().includes(term) ||
                contractor.companyName?.toLowerCase().includes(term) ||
                contractor.contactPerson?.toLowerCase().includes(term) ||
                contractor.email?.toLowerCase().includes(term) ||
                contractor.city?.toLowerCase().includes(term) ||
                contractor.state?.toLowerCase().includes(term)
            );
        }

        return true;
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewContractor(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleCreateContractor = async (e) => {
        e.preventDefault();
        try {
            // Prepare contractor data
            const contractorData = {
                ...newContractor,
                createdBy: currentUser.uid,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            // Create contractor using our dataService
            await createContractor(contractorData);

            // Reset form and close modal
            setNewContractor({
                name: '',
                companyName: '',
                contactPerson: '',
                email: '',
                phone: '',
                trade: '',
                city: '',
                state: '',
                address: '',
                zipCode: '',
                notes: ''
            });
            setIsCreatingContractor(false);

            // Refresh contractors
            fetchContractors();
        } catch (error) {
            console.error('Error creating contractor:', error);
            alert('Failed to create contractor. Please try again.');
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Check if the file is a CSV
        if (!file.name.endsWith('.csv')) {
            setCsvImportError('Please upload a CSV file only.');
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            return;
        }

        processFile(file);
    };

    const processFile = (file) => {
        setCsvImportError(null);

        Papa.parse(file, {
            header: true,
            complete: (results) => {
                if (results.data && results.data.length > 0) {
                    setCsvData(results.data);
                    setCsvPreview(results.data.slice(0, 5)); // Preview first 5 rows
                    setCsvHeaders(results.meta.fields || []);

                    // Set initial header mapping
                    const initialMapping = {};
                    results.meta.fields.forEach(field => {
                        // Try to match CSV headers with our fields
                        const lowerField = field.toLowerCase();
                        if (lowerField.includes('name') && lowerField.includes('company')) {
                            initialMapping[field] = 'companyName';
                        } else if (lowerField.includes('name') && !lowerField.includes('company')) {
                            initialMapping[field] = 'name';
                        } else if (lowerField.includes('contact') || lowerField.includes('person')) {
                            initialMapping[field] = 'contactPerson';
                        } else if (lowerField.includes('email')) {
                            initialMapping[field] = 'email';
                        } else if (lowerField.includes('phone')) {
                            initialMapping[field] = 'phone';
                        } else if (lowerField.includes('trade') || lowerField.includes('specialty')) {
                            initialMapping[field] = 'trade';
                        } else if (lowerField.includes('city')) {
                            initialMapping[field] = 'city';
                        } else if (lowerField.includes('state')) {
                            initialMapping[field] = 'state';
                        } else if (lowerField.includes('address') || lowerField.includes('street')) {
                            initialMapping[field] = 'address';
                        } else if (lowerField.includes('zip') || lowerField.includes('postal')) {
                            initialMapping[field] = 'zipCode';
                        } else if (lowerField.includes('note') || lowerField.includes('comment')) {
                            initialMapping[field] = 'notes';
                        } else {
                            initialMapping[field] = '';
                        }
                    });

                    setHeaderMapping(initialMapping);
                    setIsImportingContractors(true);
                } else {
                    setCsvImportError('The uploaded file appears to be empty or invalid.');
                }
            },
            error: (error) => {
                console.error('CSV parsing error:', error);
                setCsvImportError(`Error parsing CSV: ${error.message}`);
            }
        });
    };

    const handleHeaderMappingChange = (csvHeader, ourField) => {
        setHeaderMapping(prev => ({
            ...prev,
            [csvHeader]: ourField
        }));
    };

    const handleImportContractors = async () => {
        try {
            let importCount = 0;

            // Create contractor objects based on mapping
            const contractorsToImport = csvData.map(row => {
                const contractor = {
                    createdBy: currentUser.uid,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };

                // Map CSV fields to our fields
                Object.entries(headerMapping).forEach(([csvHeader, ourField]) => {
                    if (ourField && row[csvHeader]) {
                        contractor[ourField] = row[csvHeader];
                    }
                });

                return contractor;
            }).filter(c => c.name || c.companyName); // Only import if at least name or company name

            // Use dataService to create contractors
            for (const contractor of contractorsToImport) {
                await createContractor(contractor);
                importCount++;
            }

            alert(`Successfully imported ${importCount} contractors.`);
            setIsImportingContractors(false);
            setCsvData([]);
            setCsvPreview([]);
            setCsvHeaders([]);
            setHeaderMapping({});
            setCsvImportError(null);

            // Refresh the contractors list
            fetchContractors();
        } catch (error) {
            console.error('Error importing contractors:', error);
            setCsvImportError(`Failed to import contractors: ${error.message}`);
        }
    };

    const handleContractorClick = (contractorId) => {
        navigate(`/contractor/${contractorId}`);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        
        const file = e.dataTransfer.files[0];
        if (!file) return;
        
        // Check if the file is a CSV
        if (!file.name.endsWith('.csv')) {
            setCsvImportError('Please upload a CSV file only.');
            return;
        }
        
        processFile(file);
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
        <div style={styles.myContractorsContainer}>
            <div style={styles.contractorsHeader}>
                <h1 style={styles.headerTitle}>{t('myContractors')}</h1>
                <div style={styles.contractorActions}>
                    <button 
                        style={styles.importBtn} 
                        onClick={() => setIsImportingContractors(true)}
                    >
                        <i className="fas fa-file-import"></i> {t('importContractors')}
                    </button>
                    <button 
                        style={styles.createContractorBtn} 
                        onClick={() => setIsCreatingContractor(true)}
                    >
                        <i className="fas fa-plus"></i> {t('createContractor')}
                    </button>
                </div>
            </div>

            <div style={styles.contractorsControls}>
                <div style={styles.searchContainer}>
                    <input
                        type="text"
                        placeholder="Search contractors..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={styles.searchInput}
                    />
                </div>

                <div style={styles.filterContainer}>
                    <label htmlFor="trade-filter" style={styles.filterLabel}>Trade:</label>
                    <select
                        id="trade-filter"
                        value={tradeFilter}
                        onChange={(e) => setTradeFilter(e.target.value)}
                        style={styles.tradeFilter}
                    >
                        <option value="all">All Trades</option>
                        {trades.map(trade => (
                            <option key={trade} value={trade}>{trade}</option>
                        ))}
                    </select>
                </div>
            </div>

            {error && <div style={styles.errorMessage}><i className="fas fa-exclamation-circle"></i> {error}</div>}

            {loading ? (
                <div style={styles.loadingSpinner}>{t('loading')}</div>
            ) : (
                <>
                    {filteredContractors.length === 0 ? (
                        <div style={styles.noResults}>
                            {searchTerm || tradeFilter !== 'all' ?
                                "No contractors match your filters." :
                                "You haven't added any contractors yet."
                            }
                        </div>
                    ) : (
                        <div style={styles.tableContainer}>
                            <table style={styles.contractorsTable}>
                                <thead>
                                    <tr>
                                        <th style={styles.tableHeader}>{t('contractorName')}</th>
                                        <th style={styles.tableHeader}>{t('contactPerson')}</th>
                                        <th style={styles.tableHeader}>{t('email')}</th>
                                        <th style={styles.tableHeader}>{t('phone')}</th>
                                        <th style={styles.tableHeader}>{t('trade')}</th>
                                        <th style={styles.tableHeader}>{t('city')}</th>
                                        <th style={styles.tableHeader}>{t('state')}</th>
                                        <th style={styles.tableHeader}>{t('actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredContractors.map(contractor => (
                                        <tr key={contractor.id}>
                                            <td style={styles.tableCell}>
                                                <Link to={`/contractor/${contractor.id}`} style={styles.contractorNameLink}>
                                                    {contractor.companyName || contractor.name || 'Unnamed'}
                                                </Link>
                                            </td>
                                            <td style={styles.tableCell}>{contractor.contactPerson || 'N/A'}</td>
                                            <td style={styles.tableCell}>{contractor.email || 'N/A'}</td>
                                            <td style={styles.tableCell}>{contractor.phone || 'N/A'}</td>
                                            <td style={styles.tableCell}>{contractor.trade || 'N/A'}</td>
                                            <td style={styles.tableCell}>{contractor.city || 'N/A'}</td>
                                            <td style={styles.tableCell}>{contractor.state || 'N/A'}</td>
                                            <td style={styles.actionsCell}>
                                                <button
                                                    style={{...styles.actionBtn, ...styles.viewBtn}}
                                                    title="View Details"
                                                    onClick={() => handleContractorClick(contractor.id)}
                                                >
                                                    <i className="fas fa-eye"></i>
                                                </button>
                                                <button style={{...styles.actionBtn, ...styles.editBtn}} title="Edit">
                                                    <i className="fas fa-edit"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {/* Contractor Creation Form */}
            {isCreatingContractor && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <h2 style={styles.modalHeader}>{t('createContractor')}</h2>
                        <form onSubmit={handleCreateContractor}>
                            <div style={styles.formRow}>
                                <div style={styles.formGroup}>
                                    <label htmlFor="companyName" style={styles.label}>Company Name</label>
                                    <input
                                        id="companyName"
                                        name="companyName"
                                        type="text"
                                        value={newContractor.companyName}
                                        onChange={handleInputChange}
                                        style={styles.input}
                                    />
                                </div>

                                <div style={styles.formGroup}>
                                    <label htmlFor="name" style={styles.label}>Contractor Name</label>
                                    <input
                                        id="name"
                                        name="name"
                                        type="text"
                                        value={newContractor.name}
                                        onChange={handleInputChange}
                                        style={styles.input}
                                    />
                                </div>
                            </div>

                            <div style={styles.formRow}>
                                <div style={styles.formGroup}>
                                    <label htmlFor="contactPerson" style={styles.label}>Contact Person *</label>
                                    <input
                                        id="contactPerson"
                                        name="contactPerson"
                                        type="text"
                                        value={newContractor.contactPerson}
                                        onChange={handleInputChange}
                                        required
                                        style={styles.input}
                                    />
                                </div>

                                <div style={styles.formGroup}>
                                    <label htmlFor="trade" style={styles.label}>Trade/Specialty</label>
                                    <input
                                        id="trade"
                                        name="trade"
                                        type="text"
                                        value={newContractor.trade}
                                        onChange={handleInputChange}
                                        style={styles.input}
                                    />
                                </div>
                            </div>

                            <div style={styles.formRow}>
                                <div style={styles.formGroup}>
                                    <label htmlFor="email" style={styles.label}>Email</label>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        value={newContractor.email}
                                        onChange={handleInputChange}
                                        style={styles.input}
                                    />
                                </div>

                                <div style={styles.formGroup}>
                                    <label htmlFor="phone" style={styles.label}>Phone</label>
                                    <input
                                        id="phone"
                                        name="phone"
                                        type="tel"
                                        value={newContractor.phone}
                                        onChange={handleInputChange}
                                        style={styles.input}
                                    />
                                </div>
                            </div>

                            <div style={styles.formGroup}>
                                <label htmlFor="address" style={styles.label}>Address</label>
                                <input
                                    id="address"
                                    name="address"
                                    type="text"
                                    value={newContractor.address}
                                    onChange={handleInputChange}
                                    style={styles.input}
                                />
                            </div>

                            <div style={styles.formRow}>
                                <div style={styles.formGroup}>
                                    <label htmlFor="city" style={styles.label}>City</label>
                                    <input
                                        id="city"
                                        name="city"
                                        type="text"
                                        value={newContractor.city}
                                        onChange={handleInputChange}
                                        style={styles.input}
                                    />
                                </div>

                                <div style={styles.formGroup}>
                                    <label htmlFor="state" style={styles.label}>State</label>
                                    <input
                                        id="state"
                                        name="state"
                                        type="text"
                                        value={newContractor.state}
                                        onChange={handleInputChange}
                                        style={styles.input}
                                    />
                                </div>

                                <div style={styles.formGroup}>
                                    <label htmlFor="zipCode" style={styles.label}>Zip Code</label>
                                    <input
                                        id="zipCode"
                                        name="zipCode"
                                        type="text"
                                        value={newContractor.zipCode}
                                        onChange={handleInputChange}
                                        style={styles.input}
                                    />
                                </div>
                            </div>

                            <div style={styles.formGroup}>
                                <label htmlFor="notes" style={styles.label}>Notes</label>
                                <textarea
                                    id="notes"
                                    name="notes"
                                    value={newContractor.notes}
                                    onChange={handleInputChange}
                                    rows="3"
                                    style={styles.textarea}
                                />
                            </div>

                            <div style={styles.formActions}>
                                <button
                                    type="button"
                                    style={styles.cancelBtn}
                                    onClick={() => setIsCreatingContractor(false)}
                                >
                                    Cancel
                                </button>
                                <button type="submit" style={styles.submitBtn}>
                                    Create Contractor
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* CSV Import Modal */}
            {isImportingContractors && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <h2 style={styles.modalHeader}>{t('importContractors')}</h2>

                        {!csvData.length ? (
                            <div style={styles.csvUploadSection}>
                                <p>Upload a CSV file with contractor information.</p>
                                <p style={styles.csvHelp}>
                                    The CSV should include columns for contractor details such as name,
                                    contact person, email, phone, trade, etc.
                                </p>
                                <div style={styles.templateLink}>
                                    <a href="/contractor_template.csv" download style={styles.templateDownloadLink}>
                                        <i className="fas fa-download"></i> Download CSV Template
                                    </a>
                                </div>

                                {csvImportError && (
                                    <div style={styles.errorMessage}>{csvImportError}</div>
                                )}

                                <div 
                                    style={{
                                        ...styles.fileUpload,
                                        ...(isDragging ? styles.dragging : {})
                                    }}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                >
                                    <input
                                        type="file"
                                        accept=".csv"
                                        onChange={handleFileChange}
                                        ref={fileInputRef}
                                        style={styles.fileInput}
                                    />
                                    <label 
                                        style={styles.fileLabel}
                                        onClick={() => fileInputRef.current.click()}
                                    >
                                        <i className="fas fa-file-csv"></i> {t('uploadCSV')}
                                    </label>
                                    <div style={styles.fileTypeIndicator}>
                                        <i className="fas fa-info-circle"></i> Only CSV files are accepted
                                    </div>
                                    <div style={styles.dragDropHint}>
                                        <i className="fas fa-cloud-upload-alt"></i> Drag and drop your CSV file here
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div style={styles.csvMappingSection}>
                                <h3>Map CSV Headers to Contractor Fields</h3>
                                <p style={styles.csvHelp}>
                                    Match each column from your CSV to the appropriate contractor field.
                                </p>

                                {csvImportError && (
                                    <div style={styles.errorMessage}>{csvImportError}</div>
                                )}

                                <div style={styles.mappingContainer}>
                                    <table style={styles.mappingTable}>
                                        <thead>
                                            <tr>
                                                <th style={styles.tableHeader}>CSV Header</th>
                                                <th style={styles.tableHeader}>Maps to Field</th>
                                                <th style={styles.tableHeader}>Preview Value</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {csvHeaders.map(header => (
                                                <tr key={header}>
                                                    <td style={styles.tableCell}>{header}</td>
                                                    <td style={styles.tableCell}>
                                                        <select
                                                            value={headerMapping[header] || ''}
                                                            onChange={(e) => handleHeaderMappingChange(header, e.target.value)}
                                                            style={styles.input}
                                                        >
                                                            <option value="">-- Ignore --</option>
                                                            <option value="name">Contractor Name</option>
                                                            <option value="companyName">Company Name</option>
                                                            <option value="contactPerson">Contact Person</option>
                                                            <option value="email">Email</option>
                                                            <option value="phone">Phone</option>
                                                            <option value="trade">Trade/Specialty</option>
                                                            <option value="address">Address</option>
                                                            <option value="city">City</option>
                                                            <option value="state">State</option>
                                                            <option value="zipCode">Zip Code</option>
                                                            <option value="notes">Notes</option>
                                                        </select>
                                                    </td>
                                                    <td style={{...styles.tableCell, ...styles.previewCell}}>
                                                        {csvPreview[0]?.[header] || ''}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div style={styles.previewSection}>
                                    <h4>Preview (First 5 Rows)</h4>
                                    <div style={styles.previewTableContainer}>
                                        <table style={styles.previewTable}>
                                            <thead>
                                                <tr>
                                                    {csvHeaders.map(header => (
                                                        <th style={styles.tableHeader} key={header}>{header}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {csvPreview.map((row, index) => (
                                                    <tr key={index}>
                                                        {csvHeaders.map(header => (
                                                            <td style={styles.tableCell} key={header}>{row[header] || ''}</td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div style={styles.formActions}>
                            <button
                                type="button"
                                style={styles.cancelBtn}
                                onClick={() => {
                                    setIsImportingContractors(false);
                                    setCsvData([]);
                                    setCsvPreview([]);
                                    setCsvHeaders([]);
                                    setHeaderMapping({});
                                    setCsvImportError(null);
                                    if (fileInputRef.current) {
                                        fileInputRef.current.value = '';
                                    }
                                }}
                            >
                                Cancel
                            </button>

                            {csvData.length > 0 && (
                                <button
                                    type="button"
                                    style={styles.submitBtn}
                                    onClick={handleImportContractors}
                                >
                                    Import {csvData.length} Contractors
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyContractors;
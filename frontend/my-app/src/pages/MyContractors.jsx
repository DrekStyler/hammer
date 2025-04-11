import React, { useState, useRef, useEffect } from 'react';
import { collection, addDoc, where, orderBy, Timestamp } from 'firebase/firestore';
import { useFirestoreQuery } from '../hooks/useFirestore';
import { useAuth } from '../contexts/AuthContext';
import { useRole } from '../contexts/RoleContext';
import useTranslation from '../utils/useTranslation';
import { db } from '../firebase/config';
import Papa from 'papaparse';
import { getAllContractors, createContractor } from '../api/dataService';
import './MyContractors.css';
import { Link, useNavigate } from 'react-router-dom';

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
            <div className="access-denied">
                <h2>Access Denied</h2>
                <p>You must be logged in as a prime to view this page.</p>
            </div>
        );
    }

    return (
        <div className="my-contractors-container">
            <div className="contractors-header">
                <h1>{t('myContractors')}</h1>
                <div className="contractor-actions">
                    <button className="import-btn" onClick={() => setIsImportingContractors(true)}>
                        <i className="fas fa-file-import"></i> {t('importContractors')}
                    </button>
                    <button className="create-contractor-btn" onClick={() => setIsCreatingContractor(true)}>
                        <i className="fas fa-plus"></i> {t('createContractor')}
                    </button>
                </div>
            </div>

            <div className="contractors-controls">
                <div className="search-container">
                    <input
                        type="text"
                        placeholder="Search contractors..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>

                <div className="filter-container">
                    <label htmlFor="trade-filter">Trade:</label>
                    <select
                        id="trade-filter"
                        value={tradeFilter}
                        onChange={(e) => setTradeFilter(e.target.value)}
                        className="trade-filter"
                    >
                        <option value="all">All Trades</option>
                        {trades.map(trade => (
                            <option key={trade} value={trade}>{trade}</option>
                        ))}
                    </select>
                </div>
            </div>

            {error && <div className="error-message">{error.message}</div>}

            {loading ? (
                <div className="loading-spinner">{t('loading')}</div>
            ) : (
                <>
                    {filteredContractors.length === 0 ? (
                        <div className="no-results">
                            {searchTerm || tradeFilter !== 'all' ?
                                "No contractors match your filters." :
                                "You haven't added any contractors yet."
                            }
                        </div>
                    ) : (
                        <div className="table-container">
                            <table className="contractors-table">
                                <thead>
                                    <tr>
                                        <th>{t('contractorName')}</th>
                                        <th>{t('contactPerson')}</th>
                                        <th>{t('email')}</th>
                                        <th>{t('phone')}</th>
                                        <th>{t('trade')}</th>
                                        <th>{t('city')}</th>
                                        <th>{t('state')}</th>
                                        <th>{t('actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredContractors.map(contractor => (
                                        <tr key={contractor.id}>
                                            <td>
                                                <Link to={`/contractor/${contractor.id}`} className="contractor-name-link">
                                                    {contractor.companyName || contractor.name || 'Unnamed'}
                                                </Link>
                                            </td>
                                            <td>{contractor.contactPerson || 'N/A'}</td>
                                            <td>{contractor.email || 'N/A'}</td>
                                            <td>{contractor.phone || 'N/A'}</td>
                                            <td>{contractor.trade || 'N/A'}</td>
                                            <td>{contractor.city || 'N/A'}</td>
                                            <td>{contractor.state || 'N/A'}</td>
                                            <td className="actions-cell">
                                                <button
                                                    className="action-btn view-btn"
                                                    title="View Details"
                                                    onClick={() => handleContractorClick(contractor.id)}
                                                >
                                                    <i className="fas fa-eye"></i>
                                                </button>
                                                <button className="action-btn edit-btn" title="Edit">
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
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>{t('createContractor')}</h2>
                        <form onSubmit={handleCreateContractor}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="companyName">Company Name</label>
                                    <input
                                        id="companyName"
                                        name="companyName"
                                        type="text"
                                        value={newContractor.companyName}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="name">Contractor Name</label>
                                    <input
                                        id="name"
                                        name="name"
                                        type="text"
                                        value={newContractor.name}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="contactPerson">Contact Person *</label>
                                    <input
                                        id="contactPerson"
                                        name="contactPerson"
                                        type="text"
                                        value={newContractor.contactPerson}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="trade">Trade/Specialty</label>
                                    <input
                                        id="trade"
                                        name="trade"
                                        type="text"
                                        value={newContractor.trade}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="email">Email</label>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        value={newContractor.email}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="phone">Phone</label>
                                    <input
                                        id="phone"
                                        name="phone"
                                        type="tel"
                                        value={newContractor.phone}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="address">Address</label>
                                <input
                                    id="address"
                                    name="address"
                                    type="text"
                                    value={newContractor.address}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="city">City</label>
                                    <input
                                        id="city"
                                        name="city"
                                        type="text"
                                        value={newContractor.city}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="state">State</label>
                                    <input
                                        id="state"
                                        name="state"
                                        type="text"
                                        value={newContractor.state}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="zipCode">Zip Code</label>
                                    <input
                                        id="zipCode"
                                        name="zipCode"
                                        type="text"
                                        value={newContractor.zipCode}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="notes">Notes</label>
                                <textarea
                                    id="notes"
                                    name="notes"
                                    value={newContractor.notes}
                                    onChange={handleInputChange}
                                    rows="3"
                                />
                            </div>

                            <div className="form-actions">
                                <button
                                    type="button"
                                    className="cancel-btn"
                                    onClick={() => setIsCreatingContractor(false)}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="submit-btn">
                                    Create Contractor
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* CSV Import Modal */}
            {isImportingContractors && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>{t('importContractors')}</h2>

                        {!csvData.length ? (
                            <div className="csv-upload-section">
                                <p>Upload a CSV file with contractor information.</p>
                                <p className="csv-help">
                                    The CSV should include columns for contractor details such as name,
                                    contact person, email, phone, trade, etc.
                                </p>
                                <div className="template-link">
                                    <a href="/contractor_template.csv" download className="template-download-link">
                                        <i className="fas fa-download"></i> Download CSV Template
                                    </a>
                                </div>

                                {csvImportError && (
                                    <div className="error-message">{csvImportError}</div>
                                )}

                                <div 
                                    className={`file-upload ${isDragging ? 'dragging' : ''}`}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                >
                                    <input
                                        type="file"
                                        accept=".csv"
                                        onChange={handleFileChange}
                                        ref={fileInputRef}
                                        className="file-input"
                                    />
                                    <label 
                                        className="file-label"
                                        onClick={() => fileInputRef.current.click()}
                                    >
                                        <i className="fas fa-file-csv"></i> {t('uploadCSV')}
                                    </label>
                                    <div className="file-type-indicator">
                                        <i className="fas fa-info-circle"></i> Only CSV files are accepted
                                    </div>
                                    <div className="drag-drop-hint">
                                        <i className="fas fa-cloud-upload-alt"></i> Drag and drop your CSV file here
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="csv-mapping-section">
                                <h3>Map CSV Headers to Contractor Fields</h3>
                                <p className="csv-help">
                                    Match each column from your CSV to the appropriate contractor field.
                                </p>

                                {csvImportError && (
                                    <div className="error-message">{csvImportError}</div>
                                )}

                                <div className="mapping-container">
                                    <table className="mapping-table">
                                        <thead>
                                            <tr>
                                                <th>CSV Header</th>
                                                <th>Maps to Field</th>
                                                <th>Preview Value</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {csvHeaders.map(header => (
                                                <tr key={header}>
                                                    <td>{header}</td>
                                                    <td>
                                                        <select
                                                            value={headerMapping[header] || ''}
                                                            onChange={(e) => handleHeaderMappingChange(header, e.target.value)}
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
                                                    <td className="preview-cell">
                                                        {csvPreview[0]?.[header] || ''}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="preview-section">
                                    <h4>Preview (First 5 Rows)</h4>
                                    <div className="preview-table-container">
                                        <table className="preview-table">
                                            <thead>
                                                <tr>
                                                    {csvHeaders.map(header => (
                                                        <th key={header}>{header}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {csvPreview.map((row, index) => (
                                                    <tr key={index}>
                                                        {csvHeaders.map(header => (
                                                            <td key={header}>{row[header] || ''}</td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="form-actions">
                            <button
                                type="button"
                                className="cancel-btn"
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
                                    className="submit-btn"
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
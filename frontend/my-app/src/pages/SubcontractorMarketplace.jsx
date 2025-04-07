import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { createSampleSubcontractors } from '../firebase/sampleSubcontractors';
import './SubcontractorMarketplace.css';

const SubcontractorMarketplace = () => {
  const { currentUser } = useAuth();
  const [subcontractors, setSubcontractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states
  const [locationFilter, setLocationFilter] = useState('');
  const [tradeFilter, setTradeFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Available trades for filtering
  const trades = [
    'Plumbing', 'Electrical', 'Carpentry', 'Painting', 'HVAC',
    'Roofing', 'Landscaping', 'Masonry', 'Drywall', 'Flooring'
  ];

  // Available locations for filtering
  const locations = [
    'New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX',
    'Phoenix, AZ', 'Philadelphia, PA', 'San Antonio, TX', 'San Diego, CA'
  ];

  useEffect(() => {
    const fetchSubcontractors = async () => {
      try {
        setLoading(true);

        // Check if we need to create sample subcontractors
        if (currentUser) {
          await createSampleSubcontractors(currentUser.uid);
        }

        // Build query based on filters
        let subcontractorsQuery = collection(db, 'subcontractors');
        let queryConstraints = [];

        if (tradeFilter) {
          queryConstraints.push(where('trades', 'array-contains', tradeFilter));
        }

        if (locationFilter) {
          queryConstraints.push(where('serviceAreas', 'array-contains', locationFilter));
        }

        // Apply query constraints if any
        let finalQuery = queryConstraints.length > 0
          ? query(subcontractorsQuery, ...queryConstraints)
          : query(subcontractorsQuery);

        const snapshot = await getDocs(finalQuery);

        // Process results
        let results = [];
        snapshot.forEach(doc => {
          results.push({ id: doc.id, ...doc.data() });
        });

        // Apply search term filter (client-side)
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          results = results.filter(sub =>
            sub.companyName?.toLowerCase().includes(term) ||
            sub.description?.toLowerCase().includes(term) ||
            sub.trades?.some(trade => trade.toLowerCase().includes(term))
          );
        }

        setSubcontractors(results);
      } catch (err) {
        console.error('Error fetching subcontractors:', err);
        setError('Failed to load subcontractors. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchSubcontractors();
  }, [currentUser, locationFilter, tradeFilter]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleTradeFilterChange = (e) => {
    setTradeFilter(e.target.value);
  };

  const handleLocationFilterChange = (e) => {
    setLocationFilter(e.target.value);
  };

  const resetFilters = () => {
    setLocationFilter('');
    setTradeFilter('');
    setSearchTerm('');
  };

  return (
    <div className="subcontractor-marketplace">
      <div className="marketplace-header">
        <h1>Subcontractor Marketplace</h1>
        <p>Find skilled professionals for your projects</p>
      </div>

      <div className="filter-section">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search by company name or description..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-input"
          />
        </div>

        <div className="filter-controls">
          <div className="filter-group">
            <label htmlFor="trade-filter">Trade:</label>
            <select
              id="trade-filter"
              value={tradeFilter}
              onChange={handleTradeFilterChange}
              className="filter-select"
            >
              <option value="">All Trades</option>
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
              onChange={handleLocationFilterChange}
              className="filter-select"
            >
              <option value="">All Locations</option>
              {locations.map(location => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
          </div>

          <button
            onClick={resetFilters}
            className="reset-filters-btn"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading-spinner">Loading subcontractors...</div>
      ) : (
        <>
          <div className="results-count">
            Found {subcontractors.length} subcontractors
            {tradeFilter && ` in ${tradeFilter}`}
            {locationFilter && ` near ${locationFilter}`}
          </div>

          {subcontractors.length === 0 ? (
            <div className="no-results">
              <p>No subcontractors found matching your criteria.</p>
              <p>Try adjusting your filters or search term.</p>
            </div>
          ) : (
            <div className="subcontractors-grid">
              {subcontractors.map(sub => (
                <div key={sub.id} className="subcontractor-card">
                  <div className="subcontractor-header">
                    {sub.logoUrl ? (
                      <img
                        src={sub.logoUrl}
                        alt={`${sub.companyName} logo`}
                        className="company-logo"
                      />
                    ) : (
                      <div className="company-logo-placeholder">
                        {sub.companyName?.charAt(0) || 'C'}
                      </div>
                    )}
                    <h3>{sub.companyName}</h3>
                  </div>

                  <div className="subcontractor-body">
                    <p className="subcontractor-description">{sub.description}</p>

                    <div className="subcontractor-details">
                      <div className="detail-item">
                        <i className="fas fa-hammer"></i>
                        <span>
                          <strong>Trades: </strong>
                          {sub.trades?.join(', ') || 'Not specified'}
                        </span>
                      </div>

                      <div className="detail-item">
                        <i className="fas fa-map-marker-alt"></i>
                        <span>
                          <strong>Service Areas: </strong>
                          {sub.serviceAreas?.join(', ') || 'Not specified'}
                        </span>
                      </div>

                      {sub.rating && (
                        <div className="detail-item">
                          <i className="fas fa-star"></i>
                          <span>
                            <strong>Rating: </strong>
                            {sub.rating} / 5
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="subcontractor-footer">
                    <button className="view-profile-btn">View Profile</button>
                    <button className="invite-btn">Invite to Project</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SubcontractorMarketplace;
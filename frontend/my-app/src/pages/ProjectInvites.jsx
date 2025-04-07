import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import useTranslation from '../utils/useTranslation';
import './ProjectInvites.css';
import { useNavigate } from "react-router-dom";

const ProjectInvites = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedInvite, setSelectedInvite] = useState(null);
  const [responseType, setResponseType] = useState('');
  const [responseNotes, setResponseNotes] = useState('');
  const [bidAmount, setBidAmount] = useState('');
  const [responding, setResponding] = useState(false);
  const [responseSuccess, setResponseSuccess] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Filter states
  const [statusFilter, setStatusFilter] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');

  // Translations for UI elements
  const translations = {
    pageTitle: {
      English: "Project Invitations",
      Español: "Invitaciones de Proyectos"
    },
    pageSubtitle: {
      English: "Review and respond to your project invitations",
      Español: "Revisa y responde a tus invitaciones de proyectos"
    },
    searchPlaceholder: {
      English: "Search by project name, description, or client...",
      Español: "Buscar por nombre de proyecto, descripción o cliente..."
    },
    filterStatus: {
      English: "Status",
      Español: "Estado"
    },
    filterLocation: {
      English: "Location",
      Español: "Ubicación"
    },
    resetFilters: {
      English: "Reset Filters",
      Español: "Restablecer Filtros"
    },
    noResults: {
      English: "No invitations found matching your filters",
      Español: "No se encontraron invitaciones que coincidan con tus filtros"
    },
    resultsCount: {
      English: "Showing",
      Español: "Mostrando"
    },
    invitations: {
      English: "invitations",
      Español: "invitaciones"
    },
    viewProject: {
      English: "View Project",
      Español: "Ver Proyecto"
    },
    respond: {
      English: "Respond",
      Español: "Responder"
    },
    loading: {
      English: "Loading invitations...",
      Español: "Cargando invitaciones..."
    },
    budget: {
      English: "Budget",
      Español: "Presupuesto"
    },
    location: {
      English: "Location",
      Español: "Ubicación"
    },
    timeframe: {
      English: "Timeframe",
      Español: "Plazo"
    },
    client: {
      English: "Client",
      Español: "Cliente"
    },
    skills: {
      English: "Required Skills",
      Español: "Habilidades Requeridas"
    },
    to: {
      English: "to",
      Español: "a"
    }
  };

  // Status translations
  const statusTranslations = {
    pending: {
      English: "Pending",
      Español: "Pendiente"
    },
    accepted: {
      English: "Accepted",
      Español: "Aceptada"
    },
    declined: {
      English: "Declined",
      Español: "Rechazada"
    },
    all: {
      English: "All",
      Español: "Todas"
    }
  };

  // Skill translations
  const skillTranslations = {
    Carpentry: {
      English: "Carpentry",
      Español: "Carpintería"
    },
    Plumbing: {
      English: "Plumbing",
      Español: "Plomería"
    },
    Electrical: {
      English: "Electrical",
      Español: "Eléctrico"
    },
    Painting: {
      English: "Painting",
      Español: "Pintura"
    },
    Roofing: {
      English: "Roofing",
      Español: "Techado"
    },
    Landscaping: {
      English: "Landscaping",
      Español: "Jardinería"
    },
    Tiling: {
      English: "Tiling",
      Español: "Azulejos"
    },
    HVAC: {
      English: "HVAC",
      Español: "Climatización"
    },
    Drywall: {
      English: "Drywall",
      Español: "Paneles de Yeso"
    },
    Flooring: {
      English: "Flooring",
      Español: "Suelos"
    }
  };

  // Hardcoded sample data with English and Spanish translations
  const sampleInvites = [
    {
      id: "inv1",
      projectId: "proj1",
      projectName: {
        English: "Kitchen Renovation",
        Español: "Renovación de Cocina"
      },
      description: {
        English: "Complete kitchen remodel including cabinet installation, countertop replacement, and new appliance setup",
        Español: "Remodelación completa de cocina incluyendo instalación de gabinetes, reemplazo de encimeras y configuración de nuevos electrodomésticos"
      },
      status: "pending",
      location: {
        English: "San Francisco, CA",
        Español: "San Francisco, CA"
      },
      budget: "$15,000",
      startDate: new Date(2023, 3, 15).toISOString(),
      endDate: new Date(2023, 4, 30).toISOString(),
      invitationDate: new Date(2023, 2, 20).toISOString(),
      skills: ["Carpentry", "Plumbing", "Electrical"],
      clientName: "John Doe",
      clientCompany: "Home Renovations Inc."
    },
    {
      id: "inv2",
      projectId: "proj2",
      projectName: {
        English: "Bathroom Remodel",
        Español: "Remodelación de Baño"
      },
      description: {
        English: "Full bathroom remodel with tile work, fixture installation, and new vanity",
        Español: "Remodelación completa de baño con trabajo de azulejos, instalación de accesorios y nuevo tocador"
      },
      status: "accepted",
      location: {
        English: "Oakland, CA",
        Español: "Oakland, CA"
      },
      budget: "$8,500",
      startDate: new Date(2023, 2, 10).toISOString(),
      endDate: new Date(2023, 3, 15).toISOString(),
      invitationDate: new Date(2023, 1, 25).toISOString(),
      skills: ["Plumbing", "Tiling"],
      clientName: "Sarah Johnson",
      clientCompany: "Modern Homes LLC"
    },
    {
      id: "inv3",
      projectId: "proj3",
      projectName: {
        English: "Deck Construction",
        Español: "Construcción de Terraza"
      },
      description: {
        English: "Build a 300 sq ft outdoor deck with railings and stairs",
        Español: "Construir una terraza exterior de 300 pies cuadrados con barandillas y escaleras"
      },
      status: "declined",
      location: {
        English: "San Jose, CA",
        Español: "San José, CA"
      },
      budget: "$12,000",
      startDate: new Date(2023, 4, 1).toISOString(),
      endDate: new Date(2023, 5, 15).toISOString(),
      invitationDate: new Date(2023, 3, 10).toISOString(),
      skills: ["Carpentry", "Landscaping"],
      clientName: "Michael Brown",
      clientCompany: "Outdoor Living Experts"
    },
    {
      id: "inv4",
      projectId: "proj4",
      projectName: {
        English: "Roof Repair",
        Español: "Reparación de Techo"
      },
      description: {
        English: "Repair damaged roof sections and replace shingles",
        Español: "Reparar secciones dañadas del techo y reemplazar tejas"
      },
      status: "pending",
      location: {
        English: "San Francisco, CA",
        Español: "San Francisco, CA"
      },
      budget: "$5,000",
      startDate: new Date(2023, 3, 25).toISOString(),
      endDate: new Date(2023, 4, 5).toISOString(),
      invitationDate: new Date(2023, 3, 15).toISOString(),
      skills: ["Roofing"],
      clientName: "David Wilson",
      clientCompany: "Top Roof Contractors"
    },
    {
      id: "inv5",
      projectId: "proj5",
      projectName: {
        English: "House Painting",
        Español: "Pintura de Casa"
      },
      description: {
        English: "Interior and exterior painting for a 2-story house",
        Español: "Pintura interior y exterior para una casa de 2 pisos"
      },
      status: "pending",
      location: {
        English: "Palo Alto, CA",
        Español: "Palo Alto, CA"
      },
      budget: "$7,500",
      startDate: new Date(2023, 5, 1).toISOString(),
      endDate: new Date(2023, 5, 20).toISOString(),
      invitationDate: new Date(2023, 4, 10).toISOString(),
      skills: ["Painting"],
      clientName: "Jennifer Lee",
      clientCompany: "Color Masters Inc."
    },
    {
      id: "inv6",
      projectId: "proj6",
      projectName: {
        English: "Basement Finishing",
        Español: "Acabado de Sótano"
      },
      description: {
        English: "Convert unfinished basement into a livable space with bedroom and bathroom",
        Español: "Convertir sótano sin terminar en un espacio habitable con dormitorio y baño"
      },
      status: "pending",
      location: {
        English: "Berkeley, CA",
        Español: "Berkeley, CA"
      },
      budget: "$25,000",
      startDate: new Date(2023, 6, 10).toISOString(),
      endDate: new Date(2023, 8, 15).toISOString(),
      invitationDate: new Date(2023, 5, 20).toISOString(),
      skills: ["Carpentry", "Electrical", "Plumbing", "Drywall"],
      clientName: "Robert Garcia",
      clientCompany: "Complete Renovations Inc."
    },
    {
      id: "inv7",
      projectId: "proj7",
      projectName: {
        English: "HVAC Installation",
        Español: "Instalación de Climatización"
      },
      description: {
        English: "Install a new central air conditioning system in a 3-bedroom house",
        Español: "Instalar un nuevo sistema central de aire acondicionado en una casa de 3 dormitorios"
      },
      status: "accepted",
      location: {
        English: "Mountain View, CA",
        Español: "Mountain View, CA"
      },
      budget: "$9,800",
      startDate: new Date(2023, 3, 5).toISOString(),
      endDate: new Date(2023, 3, 15).toISOString(),
      invitationDate: new Date(2023, 2, 1).toISOString(),
      skills: ["HVAC", "Electrical"],
      clientName: "Thomas Wright",
      clientCompany: "Comfort Solutions LLC"
    }
  ];

  // Helper function to get text based on current language
  const getText = (key) => {
    return translations[key][language] || translations[key]['English'];
  };

  // Helper function to get status text based on current language
  const getStatusText = (status) => {
    return statusTranslations[status][language] || statusTranslations[status]['English'];
  };

  // Helper function to get skill text based on current language
  const getSkillText = (skill) => {
    return skillTranslations[skill]?.[language] || skillTranslations[skill]?.['English'] || skill;
  };

  useEffect(() => {
    // Simply set the hardcoded data
    setInvites(sampleInvites);
    setLoading(false);
  }, []);

  // Format date for display based on current language
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString(language === 'Español' ? 'es-ES' : 'en-US', options);
  };

  // Filter the invites based on search term, status and location
  const filteredInvites = invites.filter(invite => {
    const projectName = invite.projectName[language] || invite.projectName['English'];
    const description = invite.description[language] || invite.description['English'];
    const location = invite.location[language] || invite.location['English'];

    const matchesSearch = projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          invite.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          invite.clientCompany.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || invite.status === statusFilter;

    const matchesLocation = !locationFilter ||
                            location.toLowerCase().includes(locationFilter.toLowerCase());

    return matchesSearch && matchesStatus && matchesLocation;
  });

  // Sort invites by date (most recent first)
  const sortedInvites = [...filteredInvites].sort((a, b) => {
    return new Date(b.invitationDate) - new Date(a.invitationDate);
  });

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  const handleLocationFilterChange = (e) => {
    setLocationFilter(e.target.value);
  };

  const resetFilters = () => {
    setStatusFilter('pending');
    setSearchTerm('');
    setLocationFilter('');
  };

  const openResponseModal = (invite) => {
    setSelectedInvite(invite);
    setResponseType('');
    setResponseNotes('');
    setBidAmount('');
    setResponseSuccess(false);
  };

  const closeResponseModal = () => {
    setSelectedInvite(null);
    setResponseType('');
    setResponseNotes('');
    setBidAmount('');
    setResponseSuccess(false);
  };

  const handleResponseSubmit = async (e) => {
    e.preventDefault();

    if (!selectedInvite) {
      return;
    }

    try {
      setResponding(true);

      // Simulate API call with a timeout
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update invite with response locally
      const updatedInvites = invites.map(invite =>
        invite.id === selectedInvite.id
          ? { ...invite, status: responseType }
          : invite
      );

      setInvites(updatedInvites);
      setResponseSuccess(true);

      // Close modal after a delay
      setTimeout(() => {
        closeResponseModal();
      }, 2000);
    } catch (error) {
      console.error('Error submitting response:', error);
      setError('Failed to submit response');
    } finally {
      setResponding(false);
    }
  };

  // Available locations for filtering (expanded list of cities)
  const locations = language === 'Español'
    ? [
      'San Francisco, CA', 'Los Ángeles, CA', 'Chicago, IL', 'Houston, TX',
      'Phoenix, AZ', 'Filadelfia, PA', 'San Antonio, TX', 'San Diego, CA',
      'Dallas, TX', 'San José, CA', 'Austin, TX', 'Jacksonville, FL',
      'Berkeley, CA', 'Oakland, CA', 'Palo Alto, CA', 'Mountain View, CA'
    ]
    : [
      'San Francisco, CA', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX',
      'Phoenix, AZ', 'Philadelphia, PA', 'San Antonio, TX', 'San Diego, CA',
      'Dallas, TX', 'San Jose, CA', 'Austin, TX', 'Jacksonville, FL',
      'Berkeley, CA', 'Oakland, CA', 'Palo Alto, CA', 'Mountain View, CA'
    ];

  return (
    <div className="project-invites">
      <div className="invites-header">
        <h1>{getText('pageTitle')}</h1>
        <p>{getText('pageSubtitle')}</p>
      </div>

      <div className="filter-section">
        <div className="search-container">
          <input
            type="text"
            className="search-input"
            placeholder={getText('searchPlaceholder')}
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>

        <div className="filter-controls">
          <div className="filter-group">
            <label>{getText('filterStatus')}</label>
            <select
              className="filter-select"
              value={statusFilter}
              onChange={handleStatusFilterChange}
            >
              {Object.keys(statusTranslations).map(status => (
                <option key={status} value={status}>
                  {getStatusText(status)}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>{getText('filterLocation')}</label>
            <select
              className="filter-select"
              value={locationFilter}
              onChange={handleLocationFilterChange}
            >
              <option value="">{language === 'Español' ? 'Todas las ubicaciones' : 'All locations'}</option>
              {locations.map(location => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>

          <button className="reset-filters-btn" onClick={resetFilters}>
            {getText('resetFilters')}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner">
          <i className="fas fa-spinner fa-spin"></i> {getText('loading')}
        </div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <>
          <div className="results-count">
            {getText('resultsCount')} {sortedInvites.length} {getText('invitations')}
          </div>

          {sortedInvites.length === 0 ? (
            <div className="no-results">
              <p>{getText('noResults')}</p>
            </div>
          ) : (
            <div className="invites-list">
              {sortedInvites.map(invite => (
                <div key={invite.id} className="invite-card">
                  <div className="invite-header">
                    <h3>{invite.projectName[language] || invite.projectName['English']}</h3>
                    <span className={`status-badge status-${invite.status}`}>
                      {getStatusText(invite.status)}
                    </span>
                  </div>

                  <div className="invite-body">
                    <p className="invite-message">
                      {invite.description[language] || invite.description['English']}
                    </p>

                    <div className="project-details">
                      <div className="detail-item">
                        <i className="fas fa-dollar-sign"></i>
                        <span><strong>{getText('budget')}:</strong> {invite.budget}</span>
                      </div>

                      <div className="detail-item">
                        <i className="fas fa-map-marker-alt"></i>
                        <span><strong>{getText('location')}:</strong> {invite.location[language] || invite.location['English']}</span>
                      </div>

                      <div className="detail-item">
                        <i className="fas fa-calendar-alt"></i>
                        <span>
                          <strong>{getText('timeframe')}:</strong> {formatDate(invite.startDate)} {getText('to')} {formatDate(invite.endDate)}
                        </span>
                      </div>

                      <div className="detail-item">
                        <i className="fas fa-user"></i>
                        <span><strong>{getText('client')}:</strong> {invite.clientName}, {invite.clientCompany}</span>
                      </div>

                      <div className="detail-item">
                        <i className="fas fa-tools"></i>
                        <span>
                          <strong>{getText('skills')}:</strong> {invite.skills.map(skill => getSkillText(skill)).join(', ')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="invite-footer">
                    <button className="view-project-btn">
                      <i className="fas fa-external-link-alt"></i> {getText('viewProject')}
                    </button>

                    {invite.status === 'pending' && (
                      <button className="respond-btn" onClick={() => openResponseModal(invite)}>
                        <i className="fas fa-reply"></i> {getText('respond')}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {selectedInvite && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>
                {language === 'Español' ? 'Responder a Invitación' : 'Respond to Invitation'}
              </h2>
              <button className="close-modal-btn" onClick={closeResponseModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            {responseSuccess ? (
              <div className="response-success">
                <i className="fas fa-check-circle"></i>
                <h3>{language === 'Español' ? 'Respuesta Enviada' : 'Response Submitted'}</h3>
                <p>
                  {language === 'Español'
                    ? 'Tu respuesta ha sido enviada exitosamente.'
                    : 'Your response has been successfully submitted.'}
                </p>
              </div>
            ) : (
              <form className="response-form" onSubmit={handleResponseSubmit}>
                <div className="project-summary">
                  <h4>{selectedInvite.projectName[language] || selectedInvite.projectName['English']}</h4>
                  <p>{selectedInvite.description[language] || selectedInvite.description['English']}</p>
                </div>

                <div className="form-group">
                  <label>
                    {language === 'Español' ? 'Tu Respuesta:' : 'Your Response:'}
                  </label>
                  <div className="response-options">
                    <div className="response-option">
                      <input
                        type="radio"
                        id="accept"
                        name="responseType"
                        value="accepted"
                        checked={responseType === 'accepted'}
                        onChange={() => setResponseType('accepted')}
                        required
                      />
                      <label htmlFor="accept">
                        {language === 'Español' ? 'Aceptar Invitación' : 'Accept Invitation'}
                      </label>
                    </div>
                    <div className="response-option">
                      <input
                        type="radio"
                        id="decline"
                        name="responseType"
                        value="declined"
                        checked={responseType === 'declined'}
                        onChange={() => setResponseType('declined')}
                        required
                      />
                      <label htmlFor="decline">
                        {language === 'Español' ? 'Rechazar Invitación' : 'Decline Invitation'}
                      </label>
                    </div>
                  </div>
                </div>

                {responseType === 'accepted' && (
                  <div className="form-group">
                    <label>
                      {language === 'Español' ? 'Tu Oferta:' : 'Your Bid:'}
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      placeholder={language === 'Español' ? 'Ingresa tu oferta ($)' : 'Enter your bid ($)'}
                      required={responseType === 'accepted'}
                    />
                  </div>
                )}

                <div className="form-group">
                  <label>
                    {language === 'Español' ? 'Notas Adicionales:' : 'Additional Notes:'}
                  </label>
                  <textarea
                    className="form-control"
                    value={responseNotes}
                    onChange={(e) => setResponseNotes(e.target.value)}
                    placeholder={
                      language === 'Español'
                        ? 'Cualquier información adicional o preguntas...'
                        : 'Any additional information or questions...'
                    }
                    rows={4}
                  ></textarea>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={closeResponseModal}
                    disabled={responding}
                  >
                    {language === 'Español' ? 'Cancelar' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="submit-response-btn"
                    disabled={!responseType || responding}
                  >
                    {responding ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i> {language === 'Español' ? 'Enviando...' : 'Sending...'}
                      </>
                    ) : (
                      <>
                        {language === 'Español' ? 'Enviar Respuesta' : 'Submit Response'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectInvites;
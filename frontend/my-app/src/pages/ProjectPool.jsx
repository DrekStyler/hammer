import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { db } from '../firebase/config';
import { collection, addDoc, getDocs, query, where, Timestamp, doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import ProjectDetail from '../components/ProjectDetail';

// ProjectPool styles
const styles = {
  container: {
    padding: '30px',
    maxWidth: '1600px',
    margin: '0 auto',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  title: {
    color: '#333',
    fontSize: '28px',
    fontWeight: '600',
    margin: 0,
  },
  filters: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px',
    marginBottom: '24px',
    alignItems: 'flex-end',
  },
  filterGroup: {
    flex: '1',
    minWidth: '200px',
  },
  filterLabel: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#5f6368',
    marginBottom: '8px',
  },
  searchInput: {
    width: '100%',
    padding: '10px 16px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    transition: 'border-color 0.2s',
  },
  select: {
    width: '100%',
    padding: '10px 16px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    backgroundColor: 'white',
  },
  resetButton: {
    padding: '10px 16px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#1a73e8',
    backgroundColor: '#e8f0fe',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    height: '42px',
    transition: 'background-color 0.2s',
  },
  resetButtonHover: {
    backgroundColor: '#d2e3fc',
  },
  projectsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '24px',
    marginBottom: '40px',
  },
  projectCard: {
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
    backgroundColor: 'white',
    overflow: 'hidden',
    transition: 'box-shadow 0.3s',
  },
  projectCardHover: {
    boxShadow: '0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23)',
  },
  projectHeader: {
    padding: '16px 20px',
    borderBottom: '1px solid #e0e0e0',
    position: 'relative',
  },
  projectTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#202124',
    margin: '0 0 4px 0',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  projectStatus: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    padding: '6px 10px',
    fontSize: '12px',
    fontWeight: '500',
    borderRadius: '16px',
    textTransform: 'capitalize',
    color: 'white',
  },
  statusOpen: {
    backgroundColor: '#34A853',
  },
  statusAwarded: {
    backgroundColor: '#FBBC05',
  },
  statusClosed: {
    backgroundColor: '#EA4335',
  },
  projectBody: {
    padding: '16px 20px',
  },
  projectInfoRow: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '12px',
  },
  projectInfoIcon: {
    color: '#5f6368',
    width: '20px',
    marginRight: '10px',
    textAlign: 'center',
  },
  projectInfoText: {
    fontSize: '14px',
    color: '#202124',
  },
  projectInfoLabel: {
    fontWeight: '500',
    marginRight: '6px',
  },
  tradeChips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginTop: '12px',
  },
  tradeChip: {
    padding: '6px 10px',
    fontSize: '12px',
    backgroundColor: '#f1f3f4',
    borderRadius: '16px',
    color: '#5f6368',
  },
  projectActions: {
    borderTop: '1px solid #e0e0e0',
    padding: '16px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bidsInfo: {
    fontSize: '14px',
    color: '#5f6368',
  },
  bidButton: {
    backgroundColor: '#1a73e8',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  bidButtonHover: {
    backgroundColor: '#0d47a1',
  },
  disabledButton: {
    backgroundColor: '#9AA0A6',
    cursor: 'not-allowed',
  },
  viewButton: {
    backgroundColor: 'transparent',
    color: '#1a73e8',
    border: '1px solid #1a73e8',
    borderRadius: '4px',
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  viewButtonHover: {
    backgroundColor: '#e8f0fe',
  },
  saveButton: {
    backgroundColor: 'transparent',
    color: '#5f6368',
    border: 'none',
    padding: '8px',
    cursor: 'pointer',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s',
  },
  saveButtonHover: {
    backgroundColor: '#f1f3f4',
  },
  savedButton: {
    color: '#FBBC05',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '300px',
  },
  spinner: {
    border: '4px solid rgba(0, 0, 0, 0.1)',
    borderTopColor: '#1a73e8',
    borderRadius: '50%',
    width: '30px',
    height: '30px',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    marginLeft: '16px',
    fontSize: '16px',
    color: '#5f6368',
  },
  errorMessage: {
    backgroundColor: '#ffebee',
    color: '#d32f2f',
    padding: '16px',
    borderRadius: '4px',
    marginBottom: '24px',
    textAlign: 'center',
  },
  noResults: {
    textAlign: 'center',
    padding: '40px',
    color: '#5f6368',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    marginBottom: '24px',
  },
  modal: {
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
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)',
    width: '90%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflow: 'auto',
  },
  modalHeader: {
    padding: '16px 20px',
    borderBottom: '1px solid #e0e0e0',
  },
  modalTitle: {
    margin: 0,
    fontSize: '20px',
    fontWeight: '600',
    color: '#202124',
  },
  modalBody: {
    padding: '20px',
  },
  modalFormGroup: {
    marginBottom: '20px',
  },
  modalLabel: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#5f6368',
    marginBottom: '8px',
  },
  modalInput: {
    width: '100%',
    padding: '12px',
    fontSize: '14px',
    border: '1px solid #e0e0e0',
    borderRadius: '4px',
  },
  modalTextarea: {
    width: '100%',
    padding: '12px',
    fontSize: '14px',
    border: '1px solid #e0e0e0',
    borderRadius: '4px',
    minHeight: '120px',
    resize: 'vertical',
  },
  modalFooter: {
    padding: '16px 20px',
    borderTop: '1px solid #e0e0e0',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
  },
  cancelButton: {
    padding: '10px 16px',
    backgroundColor: 'transparent',
    color: '#5f6368',
    border: '1px solid #e0e0e0',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  submitButton: {
    padding: '10px 20px',
    backgroundColor: '#1a73e8',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  successMessage: {
    backgroundColor: '#e6f4ea',
    color: '#34a853',
    padding: '12px',
    borderRadius: '4px',
    marginBottom: '16px',
    textAlign: 'center',
  },
  // Responsive styles
  '@media (max-width: 768px)': {
    projectsGrid: {
      gridTemplateColumns: '1fr',
    },
    filters: {
      flexDirection: 'column',
      alignItems: 'stretch',
    },
    filterGroup: {
      width: '100%',
    },
  },
};

const ProjectPool = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [tradeFilter, setTradeFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showBidModal, setShowBidModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [bidAmount, setBidAmount] = useState("");
  const [bidMessage, setBidMessage] = useState("");
  const [submittingBid, setSubmittingBid] = useState(false);
  const [viewingProject, setViewingProject] = useState(null);
  const [savedProjects, setSavedProjects] = useState([]);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [hoveredButton, setHoveredButton] = useState(null);
  const [hoveredResetButton, setHoveredResetButton] = useState(false);

  // Translations
  const translations = {
    pageTitle: {
      English: "Available Projects",
      Español: "Proyectos Disponibles"
    },
    searchPlaceholder: {
      English: "Search projects by keyword...",
      Español: "Buscar proyectos por palabra clave..."
    },
    tradePlaceholder: {
      English: "Filter by trade...",
      Español: "Filtrar por oficio..."
    },
    locationPlaceholder: {
      English: "Filter by location...",
      Español: "Filtrar por ubicación..."
    },
    allStatuses: {
      English: "All Statuses",
      Español: "Todos los Estados"
    },
    resetFilters: {
      English: "Reset Filters",
      Español: "Restablecer Filtros"
    },
    loading: {
      English: "Loading projects...",
      Español: "Cargando proyectos..."
    },
    noProjects: {
      English: "No projects match your current filters. Try adjusting your search criteria.",
      Español: "Ningún proyecto coincide con sus filtros actuales. Intente ajustar sus criterios de búsqueda."
    },
    statusOpen: {
      English: "Open",
      Español: "Abierto"
    },
    statusAwarded: {
      English: "Awarded",
      Español: "Adjudicado"
    },
    statusClosed: {
      English: "Closed",
      Español: "Cerrado"
    },
    client: {
      English: "Client",
      Español: "Cliente"
    },
    location: {
      English: "Location",
      Español: "Ubicación"
    },
    budget: {
      English: "Budget",
      Español: "Presupuesto"
    },
    requiredTrades: {
      English: "Required Trades",
      Español: "Oficios Requeridos"
    },
    posted: {
      English: "Posted",
      Español: "Publicado"
    },
    bidDeadline: {
      English: "Bid Deadline",
      Español: "Fecha Límite"
    },
    bids: {
      English: "Bids",
      Español: "Ofertas"
    },
    submitBid: {
      English: "Submit Bid",
      Español: "Enviar Oferta"
    },
    projectAwarded: {
      English: "This project has been awarded",
      Español: "Este proyecto ha sido adjudicado"
    },
    projectClosed: {
      English: "This project is closed for bidding",
      Español: "Este proyecto está cerrado para ofertas"
    },
    bidModalTitle: {
      English: "Submit Your Bid",
      Español: "Enviar Su Oferta"
    },
    bidAmount: {
      English: "Bid Amount (USD)",
      Español: "Monto de la Oferta (USD)"
    },
    bidAmountPlaceholder: {
      English: "Enter your bid amount",
      Español: "Ingrese el monto de su oferta"
    },
    bidMessage: {
      English: "Message (Optional)",
      Español: "Mensaje (Opcional)"
    },
    bidMessagePlaceholder: {
      English: "Include any details about your bid or questions about the project...",
      Español: "Incluya cualquier detalle sobre su oferta o preguntas sobre el proyecto..."
    },
    cancel: {
      English: "Cancel",
      Español: "Cancelar"
    },
    submitting: {
      English: "Submitting...",
      Español: "Enviando..."
    },
    submit: {
      English: "Submit Bid",
      Español: "Enviar Oferta"
    },
    successMessage: {
      English: "Your bid has been submitted successfully!",
      Español: "¡Su oferta ha sido enviada con éxito!"
    },
    viewDetails: {
      English: "View Details",
      Español: "Ver Detalles"
    },
    projectName: {
      English: "Project Name",
      Español: "Nombre del Proyecto"
    },
    saveProject: {
      English: "Save Project",
      Español: "Guardar Proyecto"
    },
    unsaveProject: {
      English: "Remove from Saved",
      Español: "Quitar de Guardados"
    },
    projectSaved: {
      English: "Project saved! You can find it in My Projects.",
      Español: "¡Proyecto guardado! Puedes encontrarlo en Mis Proyectos."
    },
    projectRemoved: {
      English: "Project removed from saved projects.",
      Español: "Proyecto eliminado de proyectos guardados."
    }
  };

  // Trade name translations
  const tradeTranslations = {
    "Electrical": { Español: "Eléctrico" },
    "Plumbing": { Español: "Plomería" },
    "Carpentry": { Español: "Carpintería" },
    "HVAC": { Español: "Climatización" },
    "Drywall": { Español: "Paneles de Yeso" },
    "Painting": { Español: "Pintura" },
    "Flooring": { Español: "Pisos" },
    "Concrete": { Español: "Concreto" },
    "Landscaping": { Español: "Paisajismo" },
    "Tiling": { Español: "Azulejos" },
    "Roofing": { Español: "Techado" }
  };

  // Function to get translated text
  const getText = (key) => {
    return translations[key]?.[language] || translations[key]?.["English"] || key;
  };

  // Function to translate trade names
  const getTradeTranslation = (trade) => {
    if (language === "Español" && tradeTranslations[trade]) {
      return tradeTranslations[trade]["Español"];
    }
    return trade;
  };

  // Modified: useEffect to fetch real projects from Firestore
  useEffect(() => {
    // Fetch real projects from Firestore
    const fetchProjects = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch all public projects, not just open ones
        const projectsQuery = query(
          collection(db, 'projects')
          // Removed the status filter to show all projects
        );

        const querySnapshot = await getDocs(projectsQuery);

        const fetchedProjects = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Convert dates if necessary and ensure all required fields exist
        const processedProjects = fetchedProjects.map(project => ({
          ...project,
          postedDate: project.createdAt ? new Date(project.createdAt.toDate()) : new Date(),
          deadline: project.bidDeadline ? new Date(project.bidDeadline.toDate()) : null,
          trades: project.trades || [], // Ensure trades is always an array
          bidCount: project.bidCount || 0, // Ensure bidCount exists
          status: project.status || 'open' // Ensure status exists
        }));

        setProjects(processedProjects);
      } catch (err) {
        console.error("Error fetching projects:", err);
        setError("Failed to load projects. Please try again later.");
        // Fall back to sample projects in case of error
        setProjects(getProjects());
      } finally {
        setLoading(false);
      }
    };

    // Check if we have Firestore integration
    if (db) {
      fetchProjects();
    } else {
      // Fall back to sample data if no Firestore
      setProjects(getProjects());
      setLoading(false);
    }
  }, [language]);

  // Load saved projects from localStorage on component mount
  useEffect(() => {
    if (currentUser) {
      const savedProjectIds = JSON.parse(localStorage.getItem(`savedProjects_${currentUser.uid}`)) || [];
      setSavedProjects(savedProjectIds);
    }
  }, [currentUser]);

  // Function to toggle saving a project
  const toggleSaveProject = async (projectId, event) => {
    // Prevent row click event from firing
    event.stopPropagation();

    if (!currentUser) {
      navigate('/login');
      return;
    }

    let updatedSavedProjects;

    if (savedProjects.includes(projectId)) {
      // Remove project from saved
      updatedSavedProjects = savedProjects.filter(id => id !== projectId);
      setSavedProjects(updatedSavedProjects);

      // Show confirmation toast/message
      alert(getText("projectRemoved"));
    } else {
      // Add project to saved
      updatedSavedProjects = [...savedProjects, projectId];
      setSavedProjects(updatedSavedProjects);

      // Show confirmation toast/message
      alert(getText("projectSaved"));
    }

    // Save to localStorage
    localStorage.setItem(`savedProjects_${currentUser.uid}`, JSON.stringify(updatedSavedProjects));

    // If we're using Firestore, also update the user document
    try {
      if (db) {
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, {
          savedProjects: updatedSavedProjects
        });
      }
    } catch (err) {
      console.error("Error updating saved projects in Firestore:", err);
      // Still keep the local state updated even if Firestore fails
    }
  };

  // Sample projects with translations
  const getProjects = () => {
    const sampleProjects = [
      {
        id: "proj-1",
        title: language === "Español"
          ? "Renovación de Edificio Comercial"
          : "Commercial Building Renovation",
        description: language === "Español"
          ? "Renovación completa de un espacio comercial de 5,000 pies cuadrados, incluyendo cableado eléctrico, actualizaciones de plomería y modificaciones estructurales para cumplir con los códigos de construcción actuales."
          : "Complete renovation of a 5,000 sq ft commercial space, including electrical rewiring, plumbing updates, and structural modifications to meet current building codes.",
        status: "open",
        location: language === "Español" ? "Nueva York, NY" : "New York, NY",
        budget: language === "Español" ? "$75,000 - $95,000" : "$75,000 - $95,000",
        postedDate: "2025-03-05",
        deadline: "2025-03-25",
        startDate: "2025-04-10",
        endDate: "2025-07-15",
        trades: ["Electrical", "Plumbing", "Carpentry", "HVAC"],
        clientName: "ABC Properties Inc.",
        clientCompany: "ABC Commercial Real Estate",
        bidCount: 4
      },
      {
        id: "proj-2",
        title: language === "Español"
          ? "Remodelación de Cocina Residencial"
          : "Residential Kitchen Remodel",
        description: language === "Español"
          ? "Remodelación completa de cocina incluyendo instalación de gabinetes, reemplazo de encimeras, instalación de salpicadero y actualización de accesorios de iluminación."
          : "Complete kitchen remodel including cabinet installation, countertop replacement, backsplash installation, and updated lighting fixtures.",
        status: "open",
        location: language === "Español" ? "Los Ángeles, CA" : "Los Angeles, CA",
        budget: language === "Español" ? "$25,000 - $35,000" : "$25,000 - $35,000",
        postedDate: "2025-03-08",
        deadline: "2025-03-22",
        startDate: "2025-04-01",
        endDate: "2025-04-30",
        trades: ["Carpentry", "Electrical", "Plumbing", "Tiling"],
        clientName: "Jennifer Smith",
        clientCompany: "Homeowner",
        bidCount: 7
      },
      {
        id: "proj-3",
        title: language === "Español"
          ? "Expansión de Espacio de Oficina"
          : "Office Space Expansion",
        description: language === "Español"
          ? "Construcción de un espacio de oficina adicional de 2,000 pies cuadrados, incluyendo paredes, electricidad, climatización y trabajo de acabado para que coincida con la estética existente de la oficina."
          : "Construction of an additional 2,000 sq ft office space, including walls, electrical, HVAC, and finishing work to match existing office aesthetic.",
        status: "awarded",
        location: language === "Español" ? "Chicago, IL" : "Chicago, IL",
        budget: language === "Español" ? "$50,000 - $65,000" : "$50,000 - $65,000",
        postedDate: "2025-02-15",
        deadline: "2025-03-01",
        startDate: "2025-03-15",
        endDate: "2025-05-30",
        trades: ["Carpentry", "Electrical", "HVAC", "Drywall", "Painting"],
        clientName: "TechStart Solutions",
        clientCompany: "TechStart Inc.",
        bidCount: 5
      },
      {
        id: "proj-4",
        title: language === "Español"
          ? "Reemplazo de Pisos de Tienda Minorista"
          : "Retail Store Flooring Replacement",
        description: language === "Español"
          ? "Remoción de alfombra existente e instalación de piso de vinilo de lujo en un espacio comercial de 3,200 pies cuadrados. El trabajo debe completarse durante horas no comerciales."
          : "Removal of existing carpet and installation of luxury vinyl tile flooring in a 3,200 sq ft retail space. Work must be completed during non-business hours.",
        status: "open",
        location: language === "Español" ? "Miami, FL" : "Miami, FL",
        budget: language === "Español" ? "$18,000 - $25,000" : "$18,000 - $25,000",
        postedDate: "2025-03-10",
        deadline: "2025-03-30",
        startDate: "2025-04-05",
        endDate: "2025-04-15",
        trades: ["Flooring"],
        clientName: "FashionNow Retail",
        clientCompany: "FashionNow Inc.",
        bidCount: 3
      },
      {
        id: "proj-5",
        title: language === "Español"
          ? "Construcción de Patio de Restaurante"
          : "Restaurant Patio Construction",
        description: language === "Español"
          ? "Construcción de un patio para comedor al aire libre de 1,500 pies cuadrados, incluyendo trabajo de concreto, construcción de pérgola, instalación de iluminación y elementos paisajísticos."
          : "Construction of a 1,500 sq ft outdoor dining patio, including concrete work, pergola construction, lighting installation, and landscaping elements.",
        status: "closed",
        location: language === "Español" ? "Austin, TX" : "Austin, TX",
        budget: language === "Español" ? "$35,000 - $45,000" : "$35,000 - $45,000",
        postedDate: "2025-01-20",
        deadline: "2025-02-10",
        startDate: "2025-02-20",
        endDate: "2025-03-30",
        trades: ["Concrete", "Carpentry", "Electrical", "Landscaping"],
        clientName: "Taste of Texas Restaurant",
        clientCompany: "Texas Dining Group LLC",
        bidCount: 6
      },
      {
        id: "proj-6",
        title: language === "Español"
          ? "Renovación de Consultorio Médico"
          : "Medical Office Renovation",
        description: language === "Español"
          ? "Renovación de un espacio de consultorio médico de 2,800 pies cuadrados, incluyendo la creación de salas de examen, área de recepción y baños que cumplan con ADA."
          : "Renovation of a 2,800 sq ft medical office space, including creation of exam rooms, reception area, and ADA-compliant restrooms.",
        status: "open",
        location: language === "Español" ? "Denver, CO" : "Denver, CO",
        budget: language === "Español" ? "$60,000 - $75,000" : "$60,000 - $75,000",
        postedDate: "2025-03-12",
        deadline: "2025-04-01",
        startDate: "2025-04-15",
        endDate: "2025-06-30",
        trades: ["Electrical", "Plumbing", "Drywall", "Carpentry", "Painting"],
        clientName: "Mountain Health Partners",
        clientCompany: "Mountain Health Medical Group",
        bidCount: 2
      },
      {
        id: "proj-7",
        title: language === "Español"
          ? "Renovación de Baños de Hotel"
          : "Hotel Bathroom Renovations",
        description: language === "Español"
          ? "Renovación de 45 baños de hotel incluyendo reemplazo de accesorios, azulejos e instalación de tocadores. El trabajo debe completarse en fases para minimizar la interrupción de los huéspedes."
          : "Renovation of 45 hotel bathrooms including fixture replacement, tiling, and vanity installation. Work to be completed in phases to minimize guest disruption.",
        status: "awarded",
        location: language === "Español" ? "Seattle, WA" : "Seattle, WA",
        budget: language === "Español" ? "$120,000 - $150,000" : "$120,000 - $150,000",
        postedDate: "2025-02-01",
        deadline: "2025-02-20",
        startDate: "2025-03-01",
        endDate: "2025-06-15",
        trades: ["Plumbing", "Tiling", "Carpentry"],
        clientName: "Pacific Northwest Hotels",
        clientCompany: "PNW Hospitality Group",
        bidCount: 8
      }
    ];

    return sampleProjects;
  };

  // Filter projects based on current filters
  const filteredProjects = projects.filter(project => {
    // Filter by search term (title or description)
    const matchesSearch = searchTerm === "" ||
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(searchTerm.toLowerCase());

    // Filter by trade
    const matchesTrade = tradeFilter === "" ||
      project.trades.some(trade =>
        trade.toLowerCase().includes(tradeFilter.toLowerCase()) ||
        getTradeTranslation(trade).toLowerCase().includes(tradeFilter.toLowerCase())
      );

    // Filter by location
    const matchesLocation = locationFilter === "" ||
      project.location.toLowerCase().includes(locationFilter.toLowerCase());

    // Filter by status
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;

    return matchesSearch && matchesTrade && matchesLocation && matchesStatus;
  });

  // Event handlers for filter inputs
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleTradeFilterChange = (e) => {
    setTradeFilter(e.target.value);
  };

  const handleLocationFilterChange = (e) => {
    setLocationFilter(e.target.value);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  const resetFilters = () => {
    setSearchTerm("");
    setTradeFilter("");
    setLocationFilter("");
    setStatusFilter("all");
  };

  // Bid modal handlers
  const openBidModal = (project) => {
    if (!currentUser) {
      navigate("/login");
      return;
    }
    setSelectedProject(project);
    setShowBidModal(true);
  };

  const closeBidModal = () => {
    setShowBidModal(false);
    setSelectedProject(null);
    setBidAmount("");
    setBidMessage("");
    setSubmittingBid(false);
  };

  // Modified: handleBidSubmit to save bid to Firestore and send notification
  const handleBidSubmit = async (e) => {
    e.preventDefault();

    if (!currentUser) {
      navigate("/login");
      return;
    }

    if (!bidAmount) {
      alert(language === "Español" ? "Por favor ingrese un monto de oferta" : "Please enter a bid amount");
      return;
    }

    setSubmittingBid(true);

    try {
      // Format the bid data
      const bidData = {
        projectId: selectedProject.id,
        projectTitle: selectedProject.title,
        contractorId: currentUser.uid,
        contractorName: currentUser.displayName || 'Unnamed Contractor',
        amount: parseFloat(bidAmount),
        message: bidMessage,
        status: 'pending', // pending, accepted, rejected
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      // Save bid to Firestore
      const bidRef = await addDoc(collection(db, 'bids'), bidData);

      // Update project to add the bid ID
      const projectRef = doc(db, 'projects', selectedProject.id);
      await updateDoc(projectRef, {
        bids: arrayUnion(bidRef.id),
        bidCount: (selectedProject.bidCount || 0) + 1
      });

      // Fetch the project creator's information
      const projectSnapshot = await getDoc(projectRef);
      const projectData = projectSnapshot.data();
      const creatorId = projectData.createdBy;

      // Create notification in project creator's inbox
      await addDoc(collection(db, 'messages'), {
        recipientId: creatorId,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || 'A contractor',
        type: 'bid',
        title: `New bid on ${selectedProject.title}`,
        content: `${currentUser.displayName || 'A contractor'} has submitted a bid of $${bidAmount} for your project.`,
        projectId: selectedProject.id,
        bidId: bidRef.id,
        read: false,
        createdAt: Timestamp.now()
      });

      // Update UI
      setProjects(prevProjects =>
        prevProjects.map(project => {
          if (project.id === selectedProject.id) {
            return {
              ...project,
              bidCount: (project.bidCount || 0) + 1
            };
          }
          return project;
        })
      );

      // Show success alert
      alert(getText("successMessage"));

      // Close modal and reset form
      closeBidModal();
    } catch (err) {
      console.error("Error submitting bid:", err);
      alert(language === "Español"
        ? "Error al enviar la oferta. Por favor, inténtelo de nuevo."
        : "Error submitting bid. Please try again.");
    } finally {
      setSubmittingBid(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return language === "Español" ? "No especificado" : "Not specified";

    try {
      const options = { year: 'numeric', month: 'short', day: 'numeric' };
      const date = new Date(dateString);

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return language === "Español" ? "Fecha inválida" : "Invalid date";
      }

      // Format date according to language
      return date.toLocaleDateString(language === "Español" ? "es-ES" : "en-US", options);
    } catch (error) {
      console.error("Error formatting date:", error);
      return language === "Español" ? "Error de fecha" : "Date error";
    }
  };

  // Translate status text
  const getStatusText = (status) => {
    if (status === "open") return getText("statusOpen");
    if (status === "awarded") return getText("statusAwarded");
    if (status === "closed") return getText("statusClosed");
    return status;
  };

  // Add a function to handle viewing project details
  const viewProjectDetails = (project) => {
    setViewingProject(project);
  };

  // Add a function to close project details
  const closeProjectDetails = () => {
    setViewingProject(null);
  };

  // Get responsive grid style based on window width
  const getProjectsGridStyle = () => {
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      return { ...styles.projectsGrid, gridTemplateColumns: '1fr' };
    }
    return styles.projectsGrid;
  };

  // Render the component
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>{getText('pageTitle')}</h1>
      </div>

      <div style={styles.filters}>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>{getText('searchPlaceholder')}</label>
          <input
            type="text"
            placeholder={getText('searchPlaceholder')}
            value={searchTerm}
            onChange={handleSearchChange}
            style={styles.searchInput}
          />
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>{getText('tradePlaceholder')}</label>
          <select
            value={tradeFilter}
            onChange={handleTradeFilterChange}
            style={styles.select}
          >
            <option value="">{getText('tradePlaceholder')}</option>
            {Object.keys(tradeTranslations).map(trade => (
              <option key={trade} value={trade}>
                {getTradeTranslation(trade)}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>{getText('locationPlaceholder')}</label>
          <input
            type="text"
            placeholder={getText('locationPlaceholder')}
            value={locationFilter}
            onChange={handleLocationFilterChange}
            style={styles.searchInput}
          />
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Status</label>
          <select
            value={statusFilter}
            onChange={handleStatusFilterChange}
            style={styles.select}
          >
            <option value="all">{getText('allStatuses')}</option>
            <option value="open">{getText('statusOpen')}</option>
            <option value="awarded">{getText('statusAwarded')}</option>
            <option value="closed">{getText('statusClosed')}</option>
          </select>
        </div>

        <button 
          onClick={resetFilters} 
          style={{
            ...styles.resetButton,
            ...(hoveredResetButton ? styles.resetButtonHover : {})
          }}
          onMouseEnter={() => setHoveredResetButton(true)}
          onMouseLeave={() => setHoveredResetButton(false)}
        >
          {getText('resetFilters')}
        </button>
      </div>

      {error && <div style={styles.errorMessage}>{error}</div>}

      {loading ? (
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <span style={styles.loadingText}>{getText('loading')}</span>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div style={styles.noResults}>
          {getText('noProjects')}
        </div>
      ) : (
        <div style={getProjectsGridStyle()}>
          {filteredProjects.map(project => {
            const isProjectSaved = savedProjects.includes(project.id);
            const projectStatus = getStatusText(project.status).toLowerCase();
            
            return (
              <div 
                key={project.id} 
                style={{
                  ...styles.projectCard,
                  ...(hoveredCard === project.id ? styles.projectCardHover : {})
                }}
                onMouseEnter={() => setHoveredCard(project.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div style={styles.projectHeader}>
                  <h3 style={styles.projectTitle}>{project.title}</h3>
                  <span 
                    style={{
                      ...styles.projectStatus,
                      ...(projectStatus === 'open' ? styles.statusOpen : 
                         projectStatus === 'awarded' ? styles.statusAwarded : 
                         styles.statusClosed)
                    }}
                  >
                    {getStatusText(project.status)}
                  </span>
                </div>
                
                <div style={styles.projectBody}>
                  <div style={styles.projectInfoRow}>
                    <i className="fas fa-user" style={styles.projectInfoIcon}></i>
                    <div style={styles.projectInfoText}>
                      <span style={styles.projectInfoLabel}>{getText('client')}:</span>
                      {project.clientName || 'N/A'}
                    </div>
                  </div>
                  
                  <div style={styles.projectInfoRow}>
                    <i className="fas fa-map-marker-alt" style={styles.projectInfoIcon}></i>
                    <div style={styles.projectInfoText}>
                      <span style={styles.projectInfoLabel}>{getText('location')}:</span>
                      {project.location || 'N/A'}
                    </div>
                  </div>
                  
                  <div style={styles.projectInfoRow}>
                    <i className="fas fa-dollar-sign" style={styles.projectInfoIcon}></i>
                    <div style={styles.projectInfoText}>
                      <span style={styles.projectInfoLabel}>{getText('budget')}:</span>
                      ${project.budget?.toLocaleString() || 'N/A'}
                    </div>
                  </div>
                  
                  <div style={styles.projectInfoRow}>
                    <i className="fas fa-tools" style={styles.projectInfoIcon}></i>
                    <div style={styles.projectInfoText}>
                      <span style={styles.projectInfoLabel}>{getText('requiredTrades')}:</span>
                    </div>
                  </div>
                  
                  <div style={styles.tradeChips}>
                    {project.trades?.map(trade => (
                      <div key={trade} style={styles.tradeChip}>
                        {getTradeTranslation(trade)}
                      </div>
                    ))}
                    {(!project.trades || project.trades.length === 0) && (
                      <div style={styles.tradeChip}>N/A</div>
                    )}
                  </div>
                  
                  <div style={styles.projectInfoRow}>
                    <i className="fas fa-calendar-alt" style={styles.projectInfoIcon}></i>
                    <div style={styles.projectInfoText}>
                      <span style={styles.projectInfoLabel}>{getText('posted')}:</span>
                      {formatDate(project.postedDate)}
                    </div>
                  </div>
                  
                  {project.deadline && (
                    <div style={styles.projectInfoRow}>
                      <i className="fas fa-hourglass-end" style={styles.projectInfoIcon}></i>
                      <div style={styles.projectInfoText}>
                        <span style={styles.projectInfoLabel}>{getText('bidDeadline')}:</span>
                        {formatDate(project.deadline)}
                      </div>
                    </div>
                  )}
                </div>
                
                <div style={styles.projectActions}>
                  <div style={styles.bidsInfo}>
                    <i className="fas fa-gavel" style={{ marginRight: '6px' }}></i>
                    {project.bidCount || 0} {getText('bids')}
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={(e) => toggleSaveProject(project.id, e)}
                      style={{
                        ...styles.saveButton,
                        ...(isProjectSaved ? styles.savedButton : {}),
                        ...(hoveredButton === `save-${project.id}` ? styles.saveButtonHover : {})
                      }}
                      title={isProjectSaved ? getText('unsaveProject') : getText('saveProject')}
                      onMouseEnter={() => setHoveredButton(`save-${project.id}`)}
                      onMouseLeave={() => setHoveredButton(null)}
                    >
                      <i className={isProjectSaved ? "fas fa-star" : "far fa-star"}></i>
                    </button>
                    
                    <button
                      onClick={() => viewProjectDetails(project)}
                      style={{
                        ...styles.viewButton,
                        ...(hoveredButton === `view-${project.id}` ? styles.viewButtonHover : {})
                      }}
                      onMouseEnter={() => setHoveredButton(`view-${project.id}`)}
                      onMouseLeave={() => setHoveredButton(null)}
                    >
                      {getText('viewDetails')}
                    </button>
                    
                    {project.status === 'open' ? (
                      <button
                        onClick={() => openBidModal(project)}
                        style={{
                          ...styles.bidButton,
                          ...(hoveredButton === `bid-${project.id}` ? styles.bidButtonHover : {})
                        }}
                        onMouseEnter={() => setHoveredButton(`bid-${project.id}`)}
                        onMouseLeave={() => setHoveredButton(null)}
                      >
                        {getText('submitBid')}
                      </button>
                    ) : (
                      <button
                        disabled
                        style={{
                          ...styles.bidButton,
                          ...styles.disabledButton
                        }}
                      >
                        {project.status === 'awarded' ? getText('projectAwarded') : getText('projectClosed')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bid submission modal */}
      {showBidModal && selectedProject && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>{getText('bidModalTitle')}</h3>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.modalFormGroup}>
                <label style={styles.modalLabel}>{getText('bidAmount')}</label>
                <input
                  type="number"
                  placeholder={getText('bidAmountPlaceholder')}
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  style={styles.modalInput}
                />
              </div>
              <div style={styles.modalFormGroup}>
                <label style={styles.modalLabel}>{getText('bidMessage')}</label>
                <textarea
                  placeholder={getText('bidMessagePlaceholder')}
                  value={bidMessage}
                  onChange={(e) => setBidMessage(e.target.value)}
                  style={styles.modalTextarea}
                />
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button onClick={closeBidModal} style={styles.cancelButton}>
                {getText('cancel')}
              </button>
              <button
                onClick={handleBidSubmit}
                disabled={submittingBid}
                style={styles.submitButton}
              >
                {submittingBid ? getText('submitting') : getText('submit')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Project detail modal */}
      {viewingProject && (
        <ProjectDetail
          project={viewingProject}
          onClose={closeProjectDetails}
          userType="CONTRACTOR"
        />
      )}
    </div>
  );
};

export default ProjectPool;
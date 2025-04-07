import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { db } from '../firebase/config';
import { collection, addDoc, getDocs, query, where, Timestamp, doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import './ProjectPool.css';
import ProjectDetail from '../components/ProjectDetail';

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

  return (
    <div className="project-pool-container">
      <h1 className="page-title">{getText("pageTitle")}</h1>

      {/* Filters */}
      <div className="filters-container">
        <div className="search-filter">
          <input
            type="text"
            placeholder={getText("searchPlaceholder")}
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
        <div className="filter-group">
          <input
            type="text"
            placeholder={getText("tradePlaceholder")}
            value={tradeFilter}
            onChange={handleTradeFilterChange}
          />
          <input
            type="text"
            placeholder={getText("locationPlaceholder")}
            value={locationFilter}
            onChange={handleLocationFilterChange}
          />
          <select
            value={statusFilter}
            onChange={handleStatusFilterChange}
          >
            <option value="all">{getText("allStatuses")}</option>
            <option value="open">{getText("statusOpen")}</option>
            <option value="awarded">{getText("statusAwarded")}</option>
            <option value="closed">{getText("statusClosed")}</option>
          </select>
          <button className="reset-filters-btn" onClick={resetFilters}>
            {getText("resetFilters")}
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="loading-container">
          <div className="loading-spinner">
            <i className="fas fa-hammer"></i>
          </div>
          <div className="loading-text">{getText('loading')}</div>
        </div>
      )}

      {/* Error state */}
      {error && <div className="error-message">{error}</div>}

      {/* No projects state */}
      {!loading && !error && filteredProjects.length === 0 && (
        <div className="no-projects-container">
          <p>{getText("noProjects")}</p>
        </div>
      )}

      {/* Projects List - CHANGED FROM GRID TO TABLE */}
      {!loading && !error && filteredProjects.length > 0 && (
        <div className="projects-table-container">
          <table className="projects-table">
            <thead>
              <tr>
                <th className="star-column"></th>
                <th>{getText("projectName")}</th>
                <th>{getText("location")}</th>
                <th>{getText("posted")}</th>
                <th>{getText("bidDeadline")}</th>
                <th>{getText("allStatuses")}</th>
                <th className="actions-column"></th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map(project => {
                try {
                  // Check if project has all required properties
                  if (!project || !project.id) {
                    console.error("Invalid project data:", project);
                    return null;
                  }

                  const isProjectSaved = savedProjects.includes(project.id);

                  return (
                    <tr
                      key={project.id}
                      className={`project-row status-${project.status || 'unknown'}`}
                      onClick={() => viewProjectDetails(project)}
                    >
                      <td className="star-cell">
                        <span
                          className={`star-icon ${isProjectSaved ? 'saved' : ''}`}
                          onClick={(e) => toggleSaveProject(project.id, e)}
                          title={isProjectSaved ? getText("unsaveProject") : getText("saveProject")}
                        >
                          <i className={`fas fa-star ${isProjectSaved ? 'filled' : 'empty'}`}></i>
                        </span>
                      </td>
                      <td className="project-title-cell">
                        {project.title || (language === "Español" ? "Título no disponible" : "Title not available")}
                      </td>
                      <td className="location-cell">
                        {project.location || (language === "Español" ? "No especificado" : "Not specified")}
                      </td>
                      <td className="date-cell">
                        {formatDate(project.postedDate)}
                      </td>
                      <td className="deadline-cell">
                        {formatDate(project.deadline)}
                      </td>
                      <td className="status-cell">
                        <span className={`status-badge status-${project.status || 'unknown'}`}>
                          {getStatusText(project.status)}
                        </span>
                      </td>
                      <td className="actions-cell">
                        {project.biddingStatus === "open" ? (
                          <button
                            className="bid-button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openBidModal(project);
                            }}
                          >
                            {getText("submitBid")}
                          </button>
                        ) : (
                          <span className={`status-message ${project.status}-message`}>
                            {project.status === "awarded" ? getText("projectAwarded") : getText("projectClosed")}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                } catch (err) {
                  console.error("Error rendering project:", err, project);
                  return null;
                }
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Bid Modal */}
      {showBidModal && selectedProject && (
        <div className="modal-overlay" onClick={closeBidModal}>
          <div className="bid-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal-btn" onClick={closeBidModal}>&times;</button>
            <h2 className="modal-title">{getText("bidModalTitle")}</h2>
            <h3 className="project-name">{selectedProject.title}</h3>

            <form className="bid-form" onSubmit={handleBidSubmit}>
              <div className="form-group">
                <label htmlFor="bid-amount">{getText("bidAmount")}</label>
                <div className="input-with-prefix">
                  <span className="currency-prefix">$</span>
                  <input
                    type="number"
                    id="bid-amount"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    min="1"
                    step="0.01"
                    placeholder={getText("bidAmountPlaceholder")}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="bid-message">{getText("bidMessage")}</label>
                <textarea
                  id="bid-message"
                  value={bidMessage}
                  onChange={(e) => setBidMessage(e.target.value)}
                  placeholder={getText("bidMessagePlaceholder")}
                  rows="4"
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={closeBidModal}
                >
                  {getText("cancel")}
                </button>
                <button
                  type="submit"
                  className="submit-button"
                  disabled={submittingBid}
                >
                  {submittingBid ? (
                    <>
                      <span className="spinner"></span>
                      {getText("submitting")}
                    </>
                  ) : (
                    getText("submit")
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project Detail Modal */}
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
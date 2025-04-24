import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { orderBy } from "firebase/firestore";
import { useFirestoreQuery } from "../hooks/useFirestore";
import ProjectDetail from "./ProjectDetail";
import NewProjectForm from "./NewProjectForm";
import { Link, useNavigate } from "react-router-dom";

function ProjectHistory({ userType }) {
  const { currentUser } = useAuth();
  const [selectedProject, setSelectedProject] = useState(null);
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);
  const [savedProjectIds, setSavedProjectIds] = useState([]);
  const [view, setView] = useState("all"); // 'all' or 'saved'
  const navigate = useNavigate();

  // Query projects from Firestore when the component mounts
  const { data: projects, loading, error } = useFirestoreQuery(
    'projects',
    [orderBy('createdAt', 'desc')],
    { realtime: true }
  );

  // Load saved projects from localStorage
  useEffect(() => {
    if (currentUser) {
      const savedIds = JSON.parse(localStorage.getItem(`savedProjects_${currentUser.uid}`)) || [];
      setSavedProjectIds(savedIds);
    }
  }, [currentUser]);

  const handleViewDetails = (project) => {
    navigate(`/project/${project.id}`);
  };

  const handleCloseDetails = (result) => {
    if (result && result.updated) {
      // Refresh projects data when a project is updated
      // This will trigger a re-fetch from Firestore
    }
    setSelectedProject(null);
  };

  const handleAddProject = () => {
    setShowNewProjectForm(true);
  };

  const handleProjectCreated = (projectId) => {
    setShowNewProjectForm(false);
    // Could add additional logic here, like showing a success message
  };

  const toggleView = (newView) => {
    setView(newView);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";

    // Handle Firebase Timestamp objects
    const date = typeof timestamp === 'object' && timestamp.toDate
      ? timestamp.toDate()
      : new Date(timestamp);

    return date.toLocaleDateString();
  };

  // Function to get status badge class
  const getStatusClass = (status) => {
    if (!status) return "pending";

    switch (status.toLowerCase()) {
      case "completed":
        return "completed";
      case "in_progress":
      case "in progress":
        return "in-progress";
      case "published":
        return "published";
      case "draft":
        return "draft";
      default:
        return "pending";
    }
  };

  // Filter projects based on the selected view
  const filteredProjects = view === "saved"
    ? projects.filter(project => savedProjectIds.includes(project.id))
    : projects;

  return (
    <div className="project-history">
      <div className="project-history-actions">
        {userType === "prime" && (
          <button className="create-project-button" onClick={handleAddProject}>
            <i className="fas fa-plus"></i> New Project
          </button>
        )}

        {/* View toggle buttons */}
        <div className="view-toggle-buttons">
          <button
            className={`view-toggle-btn ${view === 'all' ? 'active' : ''}`}
            onClick={() => toggleView('all')}
          >
            <i className="fas fa-list"></i> All Projects
          </button>
          <button
            className={`view-toggle-btn ${view === 'saved' ? 'active' : ''}`}
            onClick={() => toggleView('saved')}
          >
            <i className="fas fa-star"></i> Saved Projects
          </button>
        </div>
      </div>

      <h3>{view === 'saved' ? 'Saved Projects' : 'Project History'}</h3>

      {error && <div className="error-message">Error loading projects: {error.message}</div>}

      {loading ? (
        <div className="project-history-loading">Loading projects...</div>
      ) : filteredProjects.length === 0 ? (
        <div className="no-projects">
          {view === 'saved' ? (
            <p>You haven't saved any projects yet. Browse the project pool to find and save projects.</p>
          ) : (
            <>
              <p>You haven't created any projects yet.</p>
              {userType === "prime" && (
                <p>Get started by creating your first project!</p>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="projects-list">
          {filteredProjects.map((project) => (
            <div key={project.id} className="project-card">
              <div className="project-header">
                <h4>
                  <Link to={`/project/${project.id}`} className="project-title-link">
                    {project.title}
                  </Link>
                </h4>
                <span className={`project-status status-${getStatusClass(project.status)}`}>
                  {project.status || "Pending"}
                </span>
              </div>

              <div className="project-details">
                <div className="detail-item">
                  <span className="detail-label">Client:</span>
                  <span className="detail-value">{project.client || project.clientName || "N/A"}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Date:</span>
                  <span className="detail-value">
                    {formatDate(project.createdAt)}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Payment:</span>
                  <span className="detail-value">{project.payment || project.budget || "N/A"}</span>
                </div>
                {project.rating && (
                  <div className="detail-item">
                    <span className="detail-label">Rating:</span>
                    <span className="detail-value rating">
                      {project.rating}
                      <i className="fas fa-star"></i>
                    </span>
                  </div>
                )}
              </div>

              <div className="project-actions">
                <button
                  className="view-details-btn"
                  onClick={() => handleViewDetails(project)}
                >
                  View Details
                </button>
                {project.status === "Completed" &&
                  !project.rating &&
                  userType === "prime" && (
                    <button className="rate-project-btn">
                      Rate Contractor
                    </button>
                  )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedProject && (
        <ProjectDetail
          project={selectedProject}
          onClose={handleCloseDetails}
          userType={userType}
        />
      )}

      {showNewProjectForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <NewProjectForm
              onCancel={() => setShowNewProjectForm(false)}
              onSuccess={handleProjectCreated}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectHistory;

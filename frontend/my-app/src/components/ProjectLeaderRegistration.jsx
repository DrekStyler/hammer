import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { createProject } from "../api/dataService";

function ProjectLeaderRegistration() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const testValues = {
    companyName: "Example Construction",
    contactName: "John Smith",
    email: "john.smith@example.com",
    phone: "555-123-4567",
    projectTitle: "Office Renovation",
    projectDescription: "Renovating office space on the 3rd floor",
    location: "San Francisco, CA",
    budget: "25000",
    startDate: new Date().toISOString().split('T')[0], // Current date in YYYY-MM-DD format
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days in future
  };

  const [formData, setFormData] = useState({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    projectTitle: "",
    projectDescription: "",
    location: "",
    budget: "",
    startDate: "",
    endDate: "",
  });

  // Load test values if in test mode
  useEffect(() => {
    if (import.meta.env.VITE_TEST_MODE === "true") {
      setFormData(testValues);
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Form submission started");
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      // Log the current user state
      console.log("Current user:", currentUser);

      // Format the project data
      const projectData = {
        title: formData.projectTitle,
        description: formData.projectDescription,
        clientName: formData.companyName,
        contactName: formData.contactName,
        contactEmail: formData.email,
        contactPhone: formData.phone,
        location: formData.location,
        budget: parseFloat(formData.budget),
        startDate: formData.startDate,
        endDate: formData.endDate,
        status: "open",
      };

      console.log("Sending project data:", projectData);

      // Save the project using our data service
      const projectId = await createProject(projectData);

      console.log("Success, project ID:", projectId);

      // Show success message and navigate after delay
      setSuccess("Thank you for posting your project!");
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (err) {
      console.error("Full error object:", err);
      setError(
        err.message ||
          "Failed to create project. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="project-leader-registration">
      <h2>Become a Prime</h2>
      <p className="form-intro">
        Register as a Prime to post projects and find skilled contractors for your construction needs.
      </p>
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      {success && (
        <div className="success-message">
          {success}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <h3>Your Information</h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="companyName">Company Name *</label>
              <input
                type="text"
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="contactName">Contact Name *</label>
              <input
                type="text"
                id="contactName"
                name="contactName"
                value={formData.contactName}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="phone">Phone Number *</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Project Details</h3>
          <div className="form-group">
            <label htmlFor="projectTitle">Project Title *</label>
            <input
              type="text"
              id="projectTitle"
              name="projectTitle"
              value={formData.projectTitle}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="projectDescription">Project Description *</label>
            <textarea
              id="projectDescription"
              name="projectDescription"
              value={formData.projectDescription}
              onChange={handleInputChange}
              rows="4"
              required
            ></textarea>
          </div>

          <div className="form-group">
            <label htmlFor="location">Project Location *</label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="City, State"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="budget">Budget (USD) *</label>
              <input
                type="number"
                id="budget"
                name="budget"
                value={formData.budget}
                onChange={handleInputChange}
                min="0"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="startDate">Start Date *</label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="endDate">Estimated End Date *</label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
        </div>

        <button type="submit" className="submit-button" disabled={loading}>
          {loading ? "Creating Project..." : "Post Project"}
        </button>
      </form>
    </div>
  );
}

export default ProjectLeaderRegistration;

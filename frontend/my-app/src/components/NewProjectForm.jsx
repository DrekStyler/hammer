import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useRole } from "../contexts/RoleContext";
import { createProject } from "../api/projectService";

function NewProjectForm({ onCancel, onSuccess }) {
  const { currentUser } = useAuth();
  const { isPrime, isContractor } = useRole();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [images, setImages] = useState([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    clientName: "",
    budget: "",
    status: "draft",
    startDate: "",
    endDate: "",
    trades: []
  });

  const tradeOptions = [
    "Electrical",
    "Plumbing",
    "Carpentry",
    "HVAC",
    "Drywall",
    "Painting",
    "Flooring",
    "Concrete",
    "Landscaping",
    "Tiling",
    "Roofing"
  ];

  const statusOptions = [
    { value: "draft", label: "Draft" },
    { value: "open", label: "Open" },
    { value: "closed", label: "Closed" },
    { value: "completed", label: "Completed" }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleStatusChange = (status) => {
    setFormData((prev) => ({
      ...prev,
      status,
    }));
  };

  const handleTradeToggle = (trade) => {
    setFormData((prev) => {
      const trades = [...prev.trades];
      if (trades.includes(trade)) {
        return {
          ...prev,
          trades: trades.filter(t => t !== trade)
        };
      } else {
        return {
          ...prev,
          trades: [...trades, trade]
        };
      }
    });
  };

  const handleImageChange = (e) => {
    e.preventDefault();

    const files = Array.from(e.target.files);

    if (files.length + images.length > 5) {
      setError("You can upload a maximum of 5 images");
      return;
    }

    // Preview images
    const newImagePreviewUrls = [...imagePreviewUrls];
    const newImages = [...images];

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newImagePreviewUrls.push(reader.result);
        setImagePreviewUrls([...newImagePreviewUrls]);
      };
      reader.readAsDataURL(file);
      newImages.push(file);
    });

    setImages(newImages);
  };

  const removeImage = (index) => {
    const newImages = [...images];
    const newImagePreviewUrls = [...imagePreviewUrls];

    newImages.splice(index, 1);
    newImagePreviewUrls.splice(index, 1);

    setImages(newImages);
    setImagePreviewUrls(newImagePreviewUrls);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.title.trim()) {
      setError("Project title is required");
      return;
    }

    try {
      setLoading(true);

      // Prepare project data for submission
      const projectDataToSubmit = {
        ...formData,
        budget: formData.budget ? `$${formData.budget}` : "",
      };

      // Create the project in Firebase and on the backend
      const projectId = await createProject(projectDataToSubmit, images);

      // If we get here, both operations succeeded
      setSuccess("Project created successfully!");

      // Reset the form
      setFormData({
        title: "",
        description: "",
        location: "",
        clientName: "",
        budget: "",
        status: "draft",
        startDate: "",
        endDate: "",
        trades: []
      });
      setImages([]);
      setImagePreviewUrls([]);

      // Notify parent component of success after showing message
      setTimeout(() => {
        if (onSuccess) {
          onSuccess(projectId);
        }
      }, 1500); // Show success message for 1.5 seconds before proceeding

    } catch (error) {
      console.error("Error creating project:", error);
      setError(
        "Failed to create project. Please check your connection and try again."
      );
      // Keep the form data so the user can retry
    } finally {
      setLoading(false);
    }
  };

  const getStatusHintText = () => {
    switch (formData.status) {
      case "draft":
        return "Draft projects are only visible to you";
      case "open":
        return "Open projects are visible to contractors and available for bidding";
      case "closed":
        return "Closed projects are no longer accepting bids";
      case "completed":
        return "Completed projects have finished all work";
      default:
        return "";
    }
  };

  return (
    <div className="new-project-form">
      <h3>Create New Project</h3>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Project Title*</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="Enter project title"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Describe your project in detail"
            rows="5"
          ></textarea>
        </div>

        <div className="form-row">
          <div className="form-group half-width">
            <label htmlFor="location">Location*</label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="City, State, or ZIP Code"
              required
            />
          </div>

          <div className="form-group half-width">
            <label htmlFor="budget">Budget (USD)*</label>
            <div className="input-with-prefix">
              <span className="currency-prefix">$</span>
              <input
                type="number"
                id="budget"
                name="budget"
                value={formData.budget}
                onChange={handleInputChange}
                placeholder="Enter budget amount"
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="clientName">Client Name*</label>
          <input
            type="text"
            id="clientName"
            name="clientName"
            value={formData.clientName}
            onChange={handleInputChange}
            placeholder="Enter client name"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group half-width">
            <label htmlFor="startDate">Start Date</label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={formData.startDate}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group half-width">
            <label htmlFor="endDate">End Date</label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={formData.endDate}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Required Trades</label>
          <div className="trades-container">
            {tradeOptions.map(trade => (
              <div
                key={trade}
                className={`trade-option ${formData.trades.includes(trade) ? 'selected' : ''}`}
                onClick={() => handleTradeToggle(trade)}
              >
                {trade}
              </div>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="images">Project Images (Optional)</label>
          <div className="image-upload-container">
            <label className="image-upload-label" htmlFor="image-upload">
              <div className="upload-button">
                <i className="fas fa-cloud-upload-alt"></i> Upload Photos (max 5)
              </div>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="image-upload-input"
              />
            </label>
          </div>

          {imagePreviewUrls.length > 0 && (
            <div className="image-preview-container">
              {imagePreviewUrls.map((url, index) => (
                <div key={index} className="image-preview">
                  <img src={url} alt={`Preview ${index + 1}`} />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="remove-image-btn"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="form-group">
          <label>Project Status*</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleInputChange}
            className="status-select"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <small className="form-hint">
            {getStatusHintText()}
          </small>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="cancel-button"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="save-project-button"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Project"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default NewProjectForm;

import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { updateProject } from "../api/projectService";

function ProjectEditForm({ project, onCancel, onSuccess }) {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [images, setImages] = useState([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    status: "draft",
    startDate: "",
    endDate: "",
    budget: "",
  });

  const statusOptions = [
    { value: "draft", label: "Draft" },
    { value: "open", label: "Open" },
    { value: "closed", label: "Closed" },
    { value: "completed", label: "Completed" }
  ];

  // Load existing project data when component mounts
  useEffect(() => {
    if (project) {
      // Helper function to safely convert Firestore timestamp to ISO date string
      const convertTimestampToDateString = (timestamp) => {
        if (!timestamp) return "";
        try {
          // Check if it's a Firestore timestamp
          if (timestamp.seconds) {
            return new Date(timestamp.seconds * 1000).toISOString().split('T')[0];
          }
          // If it's already a Date object
          if (timestamp instanceof Date) {
            return timestamp.toISOString().split('T')[0];
          }
          // If it's a string that can be parsed as a date
          const date = new Date(timestamp);
          if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
          }
          return "";
        } catch (error) {
          console.error("Error converting timestamp:", error);
          return "";
        }
      };

      setFormData({
        title: project.title || "",
        description: project.description || "",
        location: project.location || "",
        status: project.status || "draft",
        startDate: convertTimestampToDateString(project.startDate),
        endDate: convertTimestampToDateString(project.endDate),
        budget: project.budget || "",
      });

      // Load existing images if available
      if (project.images && Array.isArray(project.images)) {
        setExistingImages(project.images);
      }
    }
  }, [project]);

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

  const handleImageChange = (e) => {
    e.preventDefault();

    const files = Array.from(e.target.files);

    // Calculate total images (existing + new uploads + already added)
    const totalImagesAfterUpload = existingImages.length + images.length + files.length;

    if (totalImagesAfterUpload > 5) {
      setError("You can upload a maximum of 5 images total");
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

  const removeExistingImage = (index) => {
    const newExistingImages = [...existingImages];
    newExistingImages.splice(index, 1);
    setExistingImages(newExistingImages);
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

      // Create an object that includes all the editable fields
      const updatedProjectData = {
        ...formData,
        images: existingImages, // Include existing images that weren't removed
        startDate: formData.startDate ? new Date(formData.startDate) : null,
        endDate: formData.endDate ? new Date(formData.endDate) : null,
        budget: formData.budget ? parseFloat(formData.budget) : null,
      };

      // Update the project in Firebase and on the backend
      await updateProject(project.id, updatedProjectData, images);

      // If we get here, the operation succeeded
      setSuccess("Project updated successfully!");

      // Notify parent component of success after showing message
      setTimeout(() => {
        if (onSuccess) {
          onSuccess(project.id);
        }
      }, 1500);

    } catch (error) {
      console.error("Error updating project:", error);
      setError(
        error.message || "Failed to update project. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="new-project-form">
      <h3>Edit Project</h3>

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

        <div className="form-group">
          <label htmlFor="location">Location</label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            placeholder="Address, City, State, or ZIP Code"
          />
          <small className="form-hint">
            You can enter a full address or just a city/ZIP code
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="startDate">Start Date</label>
          <input
            type="date"
            id="startDate"
            name="startDate"
            value={formData.startDate}
            onChange={handleInputChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="endDate">End Date</label>
          <input
            type="date"
            id="endDate"
            name="endDate"
            value={formData.endDate}
            onChange={handleInputChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="budget">Budget</label>
          <div className="budget-input-container">
            <input
              type="number"
              id="budget"
              name="budget"
              value={formData.budget}
              onChange={handleInputChange}
              placeholder="Enter project budget"
              min="0"
              step="0.01"
            />
            <span className="currency-prefix">$</span>
          </div>
        </div>

        <div className="form-group">
          <label>Existing Images</label>
          {existingImages.length > 0 ? (
            <div className="image-preview-container">
              {existingImages.map((image, index) => (
                <div key={`existing-${index}`} className="image-preview">
                  <img src={image.url || image} alt={`Existing ${index + 1}`} />
                  <button
                    type="button"
                    className="remove-image-btn"
                    onClick={() => removeExistingImage(index)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p>No existing images</p>
          )}
        </div>

        <div className="form-group">
          <label>Add New Images</label>
          <div className="image-upload-container">
            <label className="image-upload-label">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="image-upload-input"
              />
              <div className="upload-button">
                <i className="fas fa-cloud-upload-alt"></i>
                <span>Upload Images</span>
              </div>
            </label>
            <small className="form-hint">
              Total of 5 images maximum (existing + new)
            </small>
          </div>

          {imagePreviewUrls.length > 0 && (
            <div className="image-preview-container">
              {imagePreviewUrls.map((url, index) => (
                <div key={`new-${index}`} className="image-preview">
                  <img src={url} alt={`New ${index + 1}`} />
                  <button
                    type="button"
                    className="remove-image-btn"
                    onClick={() => removeImage(index)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="form-group">
          <label>Project Status</label>
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
            {formData.status === "draft"
              ? "Draft projects are only visible to you"
              : formData.status === "open"
              ? "Open projects are visible to contractors and available for bidding"
              : formData.status === "closed"
              ? "Closed projects are no longer accepting bids"
              : "Completed projects have finished all work"}
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
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ProjectEditForm;
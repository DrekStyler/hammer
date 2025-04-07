import React, { useState } from "react";
import Select from "react-select";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { createContractor } from "../api/dataService";

function ContractorRegistration() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    legalName: "",
    email: "",
    phone: "",
    hourlyRate: "",
    hasInsurance: false,
    skills: [],
  });

  const skillOptions = [
    { value: "1", label: "Plumbing" },
    { value: "2", label: "Electrical" },
    { value: "3", label: "Carpentry" },
    { value: "4", label: "Painting" },
    { value: "5", label: "HVAC" },
    { value: "6", label: "Drywall" },
    { value: "7", label: "Landscaping" },
    { value: "8", label: "Roofing" },
    { value: "9", label: "Tiling" },
    { value: "10", label: "General Maintenance" },
    { value: "11", label: "Insulation" },
    { value: "12", label: "Gutters" },
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSkillsChange = (selectedOptions) => {
    setFormData((prevState) => ({
      ...prevState,
      skills: selectedOptions,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      // Format the contractor data
      const contractorData = {
        name: formData.legalName,
        email: formData.email,
        phone: formData.phone,
        hourlyRate: parseInt(formData.hourlyRate),
        hasInsurance: formData.hasInsurance,
        skills: formData.skills.map(skill => skill.label),
        trade: formData.skills.length > 0 ? formData.skills[0].label : 'General',
        firstName: formData.legalName.split(" ")[0],
        lastName: formData.legalName.split(" ").slice(1).join(" ")
      };

      // Save the contractor using our data service
      const contractorId = await createContractor(contractorData);

      // Show success message and navigate after delay
      setSuccess("Thank you for registering as a contractor!");
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (err) {
      setError(
        err.message ||
          "Failed to register. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contractor-registration">
      <h2>Contractor Registration</h2>
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
        <div className="form-group">
          <label htmlFor="legalName">Legal Name *</label>
          <input
            type="text"
            id="legalName"
            name="legalName"
            value={formData.legalName}
            onChange={handleInputChange}
            required
          />
        </div>

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

        <div className="form-group">
          <label htmlFor="hourlyRate">Hourly Rate (USD) *</label>
          <input
            type="number"
            id="hourlyRate"
            name="hourlyRate"
            value={formData.hourlyRate}
            onChange={handleInputChange}
            min="0"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="skills">Skills *</label>
          <Select
            isMulti
            name="skills"
            options={skillOptions}
            className="skills-select"
            value={formData.skills}
            onChange={handleSkillsChange}
            placeholder="Select your skills..."
          />
        </div>

        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              name="hasInsurance"
              checked={formData.hasInsurance}
              onChange={handleInputChange}
            />
            I have liability insurance
          </label>
        </div>

        <button type="submit" className="submit-button" disabled={loading}>
          {loading ? "Registering..." : "Register as Contractor"}
        </button>
      </form>
    </div>
  );
}

export default ContractorRegistration;

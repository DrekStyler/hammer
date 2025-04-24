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

  // Inline styles matching header component styling pattern
  const styles = {
    container: {
      maxWidth: "800px",
      margin: "40px auto",
      padding: "30px",
      backgroundColor: "#fff",
      borderRadius: "8px",
      boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    },
    title: {
      fontSize: "24px",
      fontWeight: "600",
      color: "#1a73e8",
      marginBottom: "24px",
      textAlign: "center",
    },
    form: {
      display: "flex",
      flexDirection: "column",
      gap: "20px",
    },
    formGroup: {
      display: "flex",
      flexDirection: "column",
      gap: "8px",
    },
    label: {
      fontSize: "14px",
      fontWeight: "500",
      color: "#5f6368",
    },
    input: {
      padding: "10px 12px",
      fontSize: "14px",
      border: "1px solid #e0e0e0",
      borderRadius: "4px",
      transition: "border-color 0.2s",
      outline: "none",
    },
    inputFocus: {
      borderColor: "#1a73e8",
    },
    checkboxGroup: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    checkbox: {
      cursor: "pointer",
    },
    submitButton: {
      backgroundColor: "#1a73e8",
      color: "#fff",
      border: "none",
      borderRadius: "4px",
      padding: "12px",
      fontSize: "16px",
      fontWeight: "500",
      cursor: "pointer",
      transition: "background-color 0.2s",
      marginTop: "10px",
    },
    submitButtonHover: {
      backgroundColor: "#1557b0",
    },
    submitButtonDisabled: {
      backgroundColor: "#a6c8ff",
      cursor: "not-allowed",
    },
    errorMessage: {
      backgroundColor: "#ffebee",
      color: "#d32f2f",
      padding: "12px",
      borderRadius: "4px",
      fontSize: "14px",
      marginBottom: "20px",
    },
    successMessage: {
      backgroundColor: "#e8f5e9",
      color: "#2e7d32",
      padding: "12px",
      borderRadius: "4px",
      fontSize: "14px",
      marginBottom: "20px",
    },
    selectStyles: {
      control: (provided) => ({
        ...provided,
        border: "1px solid #e0e0e0",
        boxShadow: "none",
        "&:hover": {
          border: "1px solid #1a73e8",
        },
      }),
      multiValue: (provided) => ({
        ...provided,
        backgroundColor: "#e8f0fe",
      }),
      multiValueLabel: (provided) => ({
        ...provided,
        color: "#1a73e8",
      }),
      multiValueRemove: (provided) => ({
        ...provided,
        color: "#1a73e8",
        "&:hover": {
          backgroundColor: "#d2e3fc",
          color: "#174ea6",
        },
      }),
    },
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Contractor Registration</h2>
      {error && (
        <div style={styles.errorMessage}>
          {error}
        </div>
      )}
      {success && (
        <div style={styles.successMessage}>
          {success}
        </div>
      )}
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.formGroup}>
          <label htmlFor="legalName" style={styles.label}>Legal Name *</label>
          <input
            type="text"
            id="legalName"
            name="legalName"
            value={formData.legalName}
            onChange={handleInputChange}
            required
            style={styles.input}
          />
        </div>

        <div style={styles.formGroup}>
          <label htmlFor="email" style={styles.label}>Email Address *</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            style={styles.input}
          />
        </div>

        <div style={styles.formGroup}>
          <label htmlFor="phone" style={styles.label}>Phone Number *</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            required
            style={styles.input}
          />
        </div>

        <div style={styles.formGroup}>
          <label htmlFor="hourlyRate" style={styles.label}>Hourly Rate (USD) *</label>
          <input
            type="number"
            id="hourlyRate"
            name="hourlyRate"
            value={formData.hourlyRate}
            onChange={handleInputChange}
            min="0"
            required
            style={styles.input}
          />
        </div>

        <div style={styles.formGroup}>
          <label htmlFor="skills" style={styles.label}>Skills *</label>
          <Select
            isMulti
            name="skills"
            options={skillOptions}
            styles={styles.selectStyles}
            value={formData.skills}
            onChange={handleSkillsChange}
            placeholder="Select your skills..."
          />
        </div>

        <div style={{...styles.formGroup, ...styles.checkboxGroup}}>
          <label style={{display: "flex", alignItems: "center", gap: "8px"}}>
            <input
              type="checkbox"
              name="hasInsurance"
              checked={formData.hasInsurance}
              onChange={handleInputChange}
              style={styles.checkbox}
            />
            <span style={styles.label}>I have liability insurance</span>
          </label>
        </div>

        <button 
          type="submit" 
          style={loading ? {...styles.submitButton, ...styles.submitButtonDisabled} : styles.submitButton}
          disabled={loading}
        >
          {loading ? "Registering..." : "Register as Contractor"}
        </button>
      </form>
    </div>
  );
}

export default ContractorRegistration;

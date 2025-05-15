import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase/config";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

function SignUpPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    companyName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [hoveredButton, setHoveredButton] = useState(false);

  const styles = {
    container: {
      maxWidth: "1200px",
      margin: "0 auto",
      padding: "40px 20px",
      minHeight: "calc(100vh - 200px)",
    },
    card: {
      backgroundColor: "#fff",
      borderRadius: "8px",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      padding: "32px",
      maxWidth: "800px",
      margin: "0 auto",
    },
    headerTitle: {
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
    formRow: {
      display: "flex",
      gap: "20px",
      "@media (max-width: 768px)": {
        flexDirection: "column",
        gap: "20px",
      },
    },
    formGroup: {
      flex: 1,
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
      padding: "12px",
      border: "1px solid #e0e0e0",
      borderRadius: "4px",
      fontSize: "14px",
      transition: "border-color 0.2s",
      "&:focus": {
        outline: "none",
        borderColor: "#1a73e8",
      },
    },
    errorMessage: {
      color: "#d32f2f",
      fontSize: "14px",
      marginBottom: "16px",
      textAlign: "center",
    },
    submitButton: {
      backgroundColor: "#1a73e8",
      color: "#fff",
      padding: "12px 24px",
      border: "none",
      borderRadius: "4px",
      fontSize: "16px",
      fontWeight: "500",
      cursor: "pointer",
      transition: "background-color 0.2s",
      marginTop: "16px",
      "&:hover": {
        backgroundColor: "#1557b0",
      },
      "&:disabled": {
        backgroundColor: "#ccc",
        cursor: "not-allowed",
      },
    },
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    // Validate phone number format
    const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
    if (!phoneRegex.test(formData.phone)) {
      setError("Please enter a valid phone number");
      setLoading(false);
      return;
    }

    try {
      // Create authentication user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // Store additional user data in Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        firstName: formData.firstName,
        lastName: formData.lastName,
        companyName: formData.companyName,
        email: formData.email,
        phone: formData.phone,
        createdAt: new Date().toISOString(),
      });

      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.headerTitle}>Create Your Account</h2>
        {error && <div style={styles.errorMessage}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label htmlFor="firstName" style={styles.label}>First Name *</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label htmlFor="lastName" style={styles.label}>Last Name *</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label htmlFor="companyName" style={styles.label}>Company Name *</label>
            <input
              type="text"
              id="companyName"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
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
              onChange={handleChange}
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
              onChange={handleChange}
              placeholder="(123) 456-7890"
              required
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label htmlFor="password" style={styles.label}>Password *</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength="6"
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label htmlFor="confirmPassword" style={styles.label}>Confirm Password *</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              minLength="6"
              style={styles.input}
            />
          </div>

          <button
            type="submit"
            style={{
              ...styles.submitButton,
              backgroundColor: hoveredButton ? "#1557b0" : "#1a73e8",
            }}
            disabled={loading}
            onMouseEnter={() => setHoveredButton(true)}
            onMouseLeave={() => setHoveredButton(false)}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default SignUpPage;

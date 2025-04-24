import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import ProjectHistory from "../components/ProjectHistory";
import NewProjectForm from "../components/NewProjectForm";
import { useLocation } from "react-router-dom";

function ProfilePage() {
  const { currentUser } = useAuth();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const tabParam = queryParams.get("tab");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState(
    tabParam === "projects" ? "projects" : "profile"
  );
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);
  const [profileData, setProfileData] = useState({
    location: "",
    hourlyRate: "",
    userType: "",
  });
  const [hoveredButton, setHoveredButton] = useState(null);

  const API_URL = "/api";

  // Fetch user profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!currentUser) return;

      try {
        setLoading(true);
        const token = await currentUser.getIdToken();

        const response = await fetch(`${API_URL}/users/profile`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch profile data");
        }

        const data = await response.json();
        setProfileData({
          location: data.location || "",
          hourlyRate: data.hourly_rate || "",
          userType: data.user_type || "",
        });
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError("Failed to load profile data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [currentUser]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      setLoading(true);
      const token = await currentUser.getIdToken();

      const response = await fetch(`${API_URL}/users/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          location: profileData.location,
          hourly_rate: profileData.hourlyRate
            ? Number(profileData.hourlyRate)
            : null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      setSuccess("Profile updated successfully!");
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Comprehensive styles object matching Dashboard and Projects components
  const styles = {
    container: {
      padding: '30px',
      width: '90%',
      maxWidth: '1200px',
      margin: '0 auto',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    },
    headerTitle: {
      color: '#333',
      fontSize: '28px',
      fontWeight: '600',
      marginBottom: '24px',
    },
    card: {
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
      padding: '30px',
      marginBottom: '30px',
    },
    tabs: {
      display: 'flex',
      borderBottom: '1px solid #e1e4e8',
      marginBottom: '24px',
    },
    tabButton: {
      padding: '12px 16px',
      fontSize: '16px',
      fontWeight: '500',
      background: 'none',
      border: 'none',
      borderBottom: '3px solid transparent',
      color: '#5f6368',
      cursor: 'pointer',
      margin: '0 8px 0 0',
      transition: 'all 0.2s',
    },
    tabButtonActive: {
      color: '#1a73e8',
      borderBottom: '3px solid #1a73e8',
      fontWeight: '600',
    },
    tabButtonHover: {
      color: '#174ea6',
      backgroundColor: '#f8f9fa',
    },
    errorMessage: {
      backgroundColor: '#ffebee',
      color: '#d32f2f',
      padding: '12px',
      borderRadius: '4px',
      fontSize: '14px',
      marginBottom: '20px',
    },
    successMessage: {
      backgroundColor: '#e8f5e9',
      color: '#2e7d32',
      padding: '12px',
      borderRadius: '4px',
      fontSize: '14px',
      marginBottom: '20px',
    },
    profileInfo: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      marginBottom: '30px',
      padding: '20px 0',
    },
    avatar: {
      width: '100px',
      height: '100px',
      borderRadius: '50%',
      backgroundColor: '#e8f0fe',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      fontSize: '40px',
      color: '#1a73e8',
      marginBottom: '16px',
    },
    email: {
      fontSize: '18px',
      fontWeight: '500',
      color: '#3c4043',
      marginBottom: '8px',
    },
    userType: {
      fontSize: '14px',
      color: '#5f6368',
      padding: '4px 12px',
      backgroundColor: '#f1f3f4',
      borderRadius: '16px',
      textTransform: 'capitalize',
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    },
    label: {
      fontSize: '14px',
      fontWeight: '500',
      color: '#5f6368',
    },
    input: {
      padding: '10px 12px',
      fontSize: '16px',
      border: '1px solid #e0e0e0',
      borderRadius: '4px',
      transition: 'border-color 0.2s',
    },
    inputFocus: {
      borderColor: '#1a73e8',
      outline: 'none',
    },
    saveButton: {
      backgroundColor: '#1a73e8',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      padding: '12px',
      fontSize: '16px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
      marginTop: '10px',
      alignSelf: 'flex-start',
    },
    saveButtonHover: {
      backgroundColor: '#1557b0',
    },
    saveButtonDisabled: {
      backgroundColor: '#a6c8ff',
      cursor: 'not-allowed',
    },
    loadingContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '100px 0',
      color: '#5f6368',
      fontSize: '18px',
    },
    // Responsive styles
    '@media (max-width: 768px)': {
      profileInfo: {
        flexDirection: 'column',
        textAlign: 'center',
      },
      saveButton: {
        alignSelf: 'center',
        width: '100%',
      },
    },
  };

  if (loading && !profileData.userType) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          Loading profile...
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.headerTitle}>Your Account</h2>

        <div style={styles.tabs}>
          <button
            style={{
              ...styles.tabButton,
              ...(activeTab === "profile" ? styles.tabButtonActive : {}),
              ...(hoveredButton === "profile" && activeTab !== "profile" ? styles.tabButtonHover : {})
            }}
            onMouseEnter={() => setHoveredButton("profile")}
            onMouseLeave={() => setHoveredButton(null)}
            onClick={() => setActiveTab("profile")}
          >
            Profile
          </button>
          <button
            style={{
              ...styles.tabButton,
              ...(activeTab === "projects" ? styles.tabButtonActive : {}),
              ...(hoveredButton === "projects" && activeTab !== "projects" ? styles.tabButtonHover : {})
            }}
            onMouseEnter={() => setHoveredButton("projects")}
            onMouseLeave={() => setHoveredButton(null)}
            onClick={() => setActiveTab("projects")}
          >
            Project History
          </button>
        </div>

        {activeTab === "profile" ? (
          <>
            {error && <div style={styles.errorMessage}>{error}</div>}
            {success && <div style={styles.successMessage}>{success}</div>}

            <div style={styles.profileInfo}>
              <div style={styles.avatar}>
                <i className="fas fa-user-circle"></i>
              </div>
              <div style={styles.email}>{currentUser?.email}</div>
              <div style={styles.userType}>
                {profileData.userType === "SUBCONTRACTOR"
                  ? "Contractor"
                  : profileData.userType === "prime"
                  ? "Prime"
                  : "User"}
              </div>
            </div>

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.formGroup}>
                <label htmlFor="location" style={styles.label}>Location</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={profileData.location}
                  onChange={handleInputChange}
                  placeholder="City, State"
                  style={styles.input}
                  onFocus={(e) => e.target.style.borderColor = '#1a73e8'}
                  onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                />
              </div>

              {profileData.userType === "SUBCONTRACTOR" && (
                <div style={styles.formGroup}>
                  <label htmlFor="hourlyRate" style={styles.label}>Hourly Rate (USD)</label>
                  <input
                    type="number"
                    id="hourlyRate"
                    name="hourlyRate"
                    value={profileData.hourlyRate}
                    onChange={handleInputChange}
                    min="0"
                    placeholder="Your hourly rate"
                    style={styles.input}
                    onFocus={(e) => e.target.style.borderColor = '#1a73e8'}
                    onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                  />
                </div>
              )}

              <button 
                type="submit" 
                style={{
                  ...styles.saveButton,
                  ...(loading ? styles.saveButtonDisabled : {}),
                  ...(hoveredButton === "save" && !loading ? styles.saveButtonHover : {})
                }}
                disabled={loading}
                onMouseEnter={() => setHoveredButton("save")}
                onMouseLeave={() => setHoveredButton(null)}
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </>
        ) : showNewProjectForm ? (
          <NewProjectForm
            onCancel={() => setShowNewProjectForm(false)}
            onSuccess={() => {
              setShowNewProjectForm(false);
              // Optionally refresh project list
            }}
          />
        ) : (
          <ProjectHistory userType={profileData.userType} />
        )}
      </div>
    </div>
  );
}

export default ProfilePage;

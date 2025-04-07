import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import ProjectHistory from "../components/ProjectHistory";
import NewProjectForm from "../components/NewProjectForm";
import "./ProfilePage.css";
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

  if (loading && !profileData.userType) {
    return <div className="profile-page loading">Loading profile...</div>;
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <h2>Your Account</h2>

        <div className="profile-tabs">
          <button
            className={`tab-button ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            Profile
          </button>
          <button
            className={`tab-button ${activeTab === "projects" ? "active" : ""}`}
            onClick={() => setActiveTab("projects")}
          >
            Project History
          </button>
        </div>

        {activeTab === "profile" ? (
          <>
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <div className="profile-info">
              <div className="profile-avatar">
                <i className="fas fa-user-circle"></i>
              </div>
              <div className="profile-email">{currentUser?.email}</div>
              <div className="profile-type">
                {profileData.userType === "SUBCONTRACTOR"
                  ? "Contractor"
                  : profileData.userType === "prime"
                  ? "Prime"
                  : "User"}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="profile-form">
              <div className="form-group">
                <label htmlFor="location">Location</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={profileData.location}
                  onChange={handleInputChange}
                  placeholder="City, State"
                />
              </div>

              {profileData.userType === "SUBCONTRACTOR" && (
                <div className="form-group">
                  <label htmlFor="hourlyRate">Hourly Rate (USD)</label>
                  <input
                    type="number"
                    id="hourlyRate"
                    name="hourlyRate"
                    value={profileData.hourlyRate}
                    onChange={handleInputChange}
                    min="0"
                    placeholder="Your hourly rate"
                  />
                </div>
              )}

              <button type="submit" className="save-button" disabled={loading}>
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

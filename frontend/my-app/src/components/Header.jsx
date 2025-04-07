import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useRole } from "../contexts/RoleContext";
import useTranslation from "../utils/useTranslation";
import { auth, db } from "../firebase/config";
import { signOut } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import "./Header.css";

function Header() {
  const { currentUser } = useAuth();
  const { language, changeLanguage } = useLanguage();
  const { userRole, changeRole, isPrime, isContractor } = useRole();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [unreadUpdates, setUnreadUpdates] = useState(0);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleLanguageChange = (e) => {
    changeLanguage(e.target.value);
  };

  const handleRoleChange = (e) => {
    changeRole(e.target.value);
  };

  // Fetch unread project update notifications
  useEffect(() => {
    if (!currentUser) return;

    const fetchUnreadUpdates = async () => {
      try {
        const updatesQuery = query(
          collection(db, 'messages'),
          where('recipientId', '==', currentUser.uid),
          where('type', '==', 'project_update'),
          where('read', '==', false)
        );

        const querySnapshot = await getDocs(updatesQuery);
        setUnreadUpdates(querySnapshot.docs.length);
      } catch (error) {
        console.error("Error fetching project updates:", error);
      }
    };

    fetchUnreadUpdates();

    // Set up an interval to check for new notifications every minute
    const intervalId = setInterval(fetchUnreadUpdates, 60000);

    return () => clearInterval(intervalId);
  }, [currentUser]);

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-top">
          <Link to="/" className="logo">
            Oak Industries
          </Link>
          <div className="header-right">
            <div className="auth-section">
              {currentUser ? (
                <div className="user-info">
                  <span className="user-email">{currentUser.email}</span>
                  <Link
                    to="/profile"
                    className="profile-link"
                    aria-label="Profile"
                  >
                    <i className="fas fa-user-circle"></i>
                  </Link>
                  <button onClick={handleLogout} className="logout-btn">
                    {t('logout')}
                  </button>
                </div>
              ) : (
                <Link to="/login" className="login-btn">
                  {t('login')}
                </Link>
              )}
            </div>
            <div className="role-selector">
              <select
                value={userRole}
                onChange={handleRoleChange}
                className="role-select"
              >
                <option value="contractor">{t('contractor') || 'Contractor'}</option>
                <option value="prime">{t('prime') || 'Prime'}</option>
              </select>
            </div>
            <div className="language-selector">
              <select
                value={language}
                onChange={handleLanguageChange}
                className="language-select"
              >
                <option value="English">English</option>
                <option value="Español">Español</option>
              </select>
            </div>
          </div>
        </div>
        <div className="header-bottom">
          <nav className="main-nav">
            <div className="nav-links">
              {/* Home link only shown for unauthenticated users */}
              {!currentUser && <Link to="/">Home</Link>}

              {/* Public links */}
              {!currentUser && (
                <>
                  <Link to="/contractor-registration">Become a Contractor</Link>
                  <Link to="/project-leader-registration">Post a project</Link>
                </>
              )}

              {/* Links for authenticated users */}
              {currentUser && (
                <>
                  {/* Prime user navigation */}
                  {isPrime ? (
                    <>
                      <Link to="/dashboard">
                        <i className="fas fa-home"></i> {t('home') || 'Home'}
                      </Link>
                      <Link to="/my-projects">{t('myProjects')}</Link>
                      <Link to="/my-contractors">{t('myContractors')}</Link>
                      <Link to="/explore">{t('explore')}</Link>
                      <Link to="/notifications" className="notifications-link">
                        <i className="fas fa-bell"></i>
                        {unreadUpdates > 0 && (
                          <span className="notification-badge">{unreadUpdates}</span>
                        )}
                      </Link>
                      <Link to="/inbox" className="inbox-link">
                        <i className="fas fa-inbox"></i> {t('inbox') || 'Inbox'}
                      </Link>
                    </>
                  ) : (
                    /* Contractor user navigation */
                    <>
                      <Link to="/dashboard">{t('dashboard')}</Link>
                      <Link to="/projects">{t('myProjects')}</Link>
                      <Link to="/project-pool">{t('projectPool')}</Link>
                      <Link to="/project-calendar">{t('projectCalendar')}</Link>
                      <Link to="/inbox" className="inbox-link">
                        <i className="fas fa-inbox"></i> {t('inbox') || 'Inbox'}
                      </Link>
                    </>
                  )}

                  <div className="dropdown">
                    <button className="dropdown-btn">{t('myAccount')}</button>
                    <div className="dropdown-content">
                      <Link to="/profile">{t('profile')}</Link>
                      <Link to="/company-profile">{t('companyProfile')}</Link>
                      {!isPrime && <Link to="/projects">{t('myProjects')}</Link>}
                    </div>
                  </div>
                </>
              )}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}

export default Header;

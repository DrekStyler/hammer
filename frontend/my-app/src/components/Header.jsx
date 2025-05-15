import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useRole } from "../contexts/RoleContext";
import useTranslation from "../utils/useTranslation";
import { auth, db } from "../firebase/config";
import { signOut } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";

// Header styles
const styles = {
  header: {
    backgroundColor: "#fff",
    borderBottom: "1px solid #e0e0e0",
    position: "sticky",
    top: 0,
    zIndex: 100,
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
  },
  container: {
    maxWidth: "1600px",
    margin: "0 auto",
    padding: "0 20px",
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 0",
    borderBottom: "1px solid #f0f0f0",
  },
  logoSection: {
    display: "flex",
    alignItems: "center",
  },
  logo: {
    height: "40px",
    marginRight: "10px",
  },
  appName: {
    fontSize: "24px",
    fontWeight: "600",
    color: "#1a73e8",
    margin: 0,
    textDecoration: "none",
  },
  userSection: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  languageSelector: {
    padding: "8px 12px",
    border: "1px solid #e0e0e0",
    borderRadius: "4px",
    backgroundColor: "#fff",
    cursor: "pointer",
    fontSize: "14px",
  },
  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  userAvatar: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    backgroundColor: "#e0e0e0",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    color: "#757575",
    fontSize: "16px",
    fontWeight: "bold",
  },
  userName: {
    fontSize: "14px",
    fontWeight: "500",
  },
  nav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 0",
  },
  navLinks: {
    display: "flex",
    gap: "24px",
    alignItems: "center",
  },
  navLink: {
    color: "#5f6368",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: "500",
    padding: "8px 0",
    position: "relative",
    transition: "color 0.2s",
  },
  activeNavLink: {
    color: "#1a73e8",
    fontWeight: "600",
  },
  activeIndicator: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "2px",
    backgroundColor: "#1a73e8",
  },
  dropdown: {
    position: "relative",
    display: "inline-block",
  },
  dropdownBtn: {
    backgroundColor: "transparent",
    border: "none",
    color: "#5f6368",
    fontSize: "14px",
    fontWeight: "500",
    padding: "8px 12px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  dropdownContent: (isOpen) => ({
    display: isOpen ? "block" : "none",
    position: "absolute",
    backgroundColor: "#fff",
    minWidth: "160px",
    boxShadow: "0 8px 16px rgba(0,0,0,0.1)",
    borderRadius: "4px",
    padding: "8px 0",
    zIndex: 1,
    right: 0,
    top: "100%",
    marginTop: "4px",
  }),
  dropdownItem: {
    color: "#202124",
    padding: "8px 16px",
    textDecoration: "none",
    display: "block",
    fontSize: "14px",
    transition: "background-color 0.2s",
    cursor: "pointer",
  },
  dropdownItemHover: {
    backgroundColor: "#f8f9fa",
  },
  mobileMenuButton: {
    display: "none", // Hidden by default, shown on mobile
    backgroundColor: "transparent",
    border: "none",
    color: "#5f6368",
    fontSize: "24px",
    cursor: "pointer",
    padding: "8px",
  },
  mobileSideMenu: (isOpen) => ({
    position: "fixed",
    top: 0,
    right: isOpen ? 0 : "-300px",
    width: "280px",
    height: "100vh",
    backgroundColor: "#fff",
    boxShadow: "-2px 0 8px rgba(0,0,0,0.1)",
    transition: "right 0.3s ease",
    zIndex: 200,
    padding: "20px",
    display: "flex",
    flexDirection: "column",
  }),
  mobileMenuHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  mobileMenuClose: {
    backgroundColor: "transparent",
    border: "none",
    color: "#5f6368",
    fontSize: "24px",
    cursor: "pointer",
  },
  mobileNavLinks: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  mobileNavLink: {
    color: "#5f6368",
    textDecoration: "none",
    fontSize: "16px",
    fontWeight: "500",
    padding: "8px 0",
  },
  mobileActiveNavLink: {
    color: "#1a73e8",
    fontWeight: "600",
  },
  overlay: (isOpen) => ({
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    zIndex: 150,
    display: isOpen ? "block" : "none",
  }),
  // Media queries are handled via JavaScript
  "@media (max-width: 768px)": {
    navLinks: {
      display: "none",
    },
    mobileMenuButton: {
      display: "block",
    },
  },
};

function Header() {
  const { currentUser, logout } = useAuth();
  const { language, changeLanguage } = useLanguage();
  const { userRole, changeRole, isPrime, isContractor } = useRole();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadUpdates, setUnreadUpdates] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  
  // For responsive behavior
  const [isMobile, setIsMobile] = useState(false);

  // Check if the window is mobile size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    // Initial check
    checkMobile();

    // Add event listener for window resize
    window.addEventListener('resize', checkMobile);

    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  // Handle the logout functionality
  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  };

  // Toggle the dropdown menu
  const toggleDropdown = () => {
    setDropdownOpen((prev) => !prev);
  };

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setMobileMenuOpen((prev) => !prev);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownOpen && !event.target.closest('.dropdown')) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!currentUser || !currentUser.email) return "U";
    return currentUser.email.charAt(0).toUpperCase();
  };

  // Is the nav link active?
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <header style={styles.header}>
      <div style={styles.container}>
        <div style={styles.topBar}>
          <div style={styles.logoSection}>
            <Link to="/" style={styles.appName}>
              Oak Industries
            </Link>
          </div>

          <div style={styles.userSection}>
            <select 
              value={language}
              onChange={(e) => changeLanguage(e.target.value)}
              style={styles.languageSelector}
            >
              <option value="English">English</option>
              <option value="Español">Español</option>
            </select>

            {currentUser && (
              <div style={styles.userInfo}>
                <div style={styles.userAvatar}>
                  {getUserInitials()}
                </div>
                <span style={styles.userName}>
                  {currentUser.email}
                </span>
              </div>
            )}
          </div>
        </div>

        <nav style={styles.nav}>
          <div style={isMobile ? { display: 'none' } : styles.navLinks}>
            {currentUser ? (
              isPrime ? (
                /* Prime user navigation */
                <>
                  <Link 
                    to="/dashboard" 
                    style={{
                      ...styles.navLink,
                      ...(isActive('/dashboard') ? styles.activeNavLink : {})
                    }}
                  >
                    {t('dashboard')}
                    {isActive('/dashboard') && <div style={styles.activeIndicator}></div>}
                  </Link>
                  <Link 
                    to="/my-projects" 
                    style={{
                      ...styles.navLink,
                      ...(isActive('/my-projects') ? styles.activeNavLink : {})
                    }}
                  >
                    {t('projects')}
                    {isActive('/my-projects') && <div style={styles.activeIndicator}></div>}
                  </Link>
                  <Link 
                    to="/my-contractors" 
                    style={{
                      ...styles.navLink,
                      ...(isActive('/my-contractors') ? styles.activeNavLink : {})
                    }}
                  >
                    {t('myContractors')}
                    {isActive('/my-contractors') && <div style={styles.activeIndicator}></div>}
                  </Link>
                  <Link 
                    to="/explore" 
                    style={{
                      ...styles.navLink,
                      ...(isActive('/explore') ? styles.activeNavLink : {})
                    }}
                  >
                    {t('explore')}
                    {isActive('/explore') && <div style={styles.activeIndicator}></div>}
                  </Link>
                  <Link 
                    to="/notifications" 
                    style={{
                      ...styles.navLink,
                      ...(isActive('/notifications') ? styles.activeNavLink : {})
                    }}
                  >
                    <i className="fas fa-bell" style={{ marginRight: '6px' }}></i>
                    {unreadUpdates > 0 && (
                      <span className="notification-badge">{unreadUpdates}</span>
                    )}
                  </Link>
                  <Link 
                    to="/inbox" 
                    style={{
                      ...styles.navLink,
                      ...(isActive('/inbox') ? styles.activeNavLink : {})
                    }}
                  >
                    <i className="fas fa-inbox" style={{ marginRight: '6px' }}></i>
                    {t('inbox')}
                    {isActive('/inbox') && <div style={styles.activeIndicator}></div>}
                  </Link>
                </>
              ) : (
                /* Contractor user navigation */
                <>
                  <Link 
                    to="/dashboard" 
                    style={{
                      ...styles.navLink,
                      ...(isActive('/dashboard') ? styles.activeNavLink : {})
                    }}
                  >
                    {t('dashboard')}
                    {isActive('/dashboard') && <div style={styles.activeIndicator}></div>}
                  </Link>
                  <Link 
                    to="/projects" 
                    style={{
                      ...styles.navLink,
                      ...(isActive('/projects') ? styles.activeNavLink : {})
                    }}
                  >
                    {t('projects')}
                    {isActive('/projects') && <div style={styles.activeIndicator}></div>}
                  </Link>
                  <Link 
                    to="/project-pool" 
                    style={{
                      ...styles.navLink,
                      ...(isActive('/project-pool') ? styles.activeNavLink : {})
                    }}
                  >
                    {t('projectPool')}
                    {isActive('/project-pool') && <div style={styles.activeIndicator}></div>}
                  </Link>
                  <Link 
                    to="/project-calendar" 
                    style={{
                      ...styles.navLink,
                      ...(isActive('/project-calendar') ? styles.activeNavLink : {})
                    }}
                  >
                    {t('projectCalendar')}
                    {isActive('/project-calendar') && <div style={styles.activeIndicator}></div>}
                  </Link>
                  <Link 
                    to="/inbox" 
                    style={{
                      ...styles.navLink,
                      ...(isActive('/inbox') ? styles.activeNavLink : {})
                    }}
                  >
                    <i className="fas fa-inbox" style={{ marginRight: '6px' }}></i>
                    {t('inbox')}
                    {isActive('/inbox') && <div style={styles.activeIndicator}></div>}
                  </Link>
                </>
              )
            ) : (
              /* Public navigation links */
              <>
                <Link 
                  to="/" 
                  style={{
                    ...styles.navLink,
                    ...(isActive('/') ? styles.activeNavLink : {})
                  }}
                >
                  {t('home')}
                  {isActive('/') && <div style={styles.activeIndicator}></div>}
                </Link>
                <Link 
                  to="/login" 
                  style={{
                    ...styles.navLink,
                    ...(isActive('/login') ? styles.activeNavLink : {})
                  }}
                >
                  {t('login')}
                  {isActive('/login') && <div style={styles.activeIndicator}></div>}
                </Link>
                <Link 
                  to="/signup" 
                  style={{
                    ...styles.navLink,
                    ...(isActive('/signup') ? styles.activeNavLink : {})
                  }}
                >
                  {t('signup')}
                  {isActive('/signup') && <div style={styles.activeIndicator}></div>}
                </Link>
              </>
            )}

            {currentUser && (
              <div style={styles.dropdown} className="dropdown">
                <button style={styles.dropdownBtn} onClick={toggleDropdown}>
                  {t('myAccount')}
                  <i className={`fas fa-chevron-${dropdownOpen ? 'up' : 'down'}`} style={{ fontSize: '12px' }}></i>
                </button>
                <div style={styles.dropdownContent(dropdownOpen)}>
                  <Link 
                    to="/profile" 
                    style={{
                      ...styles.dropdownItem,
                      ...(hoveredItem === 'profile' ? styles.dropdownItemHover : {})
                    }}
                    onMouseEnter={() => setHoveredItem('profile')}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    {t('profile')}
                  </Link>
                  <Link 
                    to="/company-profile" 
                    style={{
                      ...styles.dropdownItem,
                      ...(hoveredItem === 'company' ? styles.dropdownItemHover : {})
                    }}
                    onMouseEnter={() => setHoveredItem('company')}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    {t('companyProfile')}
                  </Link>
                  {!isPrime && (
                    <Link 
                      to="/projects" 
                      style={{
                        ...styles.dropdownItem,
                        ...(hoveredItem === 'projects' ? styles.dropdownItemHover : {})
                      }}
                      onMouseEnter={() => setHoveredItem('projects')}
                      onMouseLeave={() => setHoveredItem(null)}
                    >
                      {t('projects')}
                    </Link>
                  )}
                  <div 
                    style={{
                      ...styles.dropdownItem,
                      ...(hoveredItem === 'logout' ? styles.dropdownItemHover : {})
                    }}
                    onClick={handleLogout}
                    onMouseEnter={() => setHoveredItem('logout')}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    {t('logout')}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={toggleMobileMenu} 
            style={styles.mobileMenuButton}
            aria-label="Open menu"
          >
            <i className="fas fa-bars"></i>
          </button>
        </nav>
      </div>

      {/* Mobile side menu */}
      <div style={styles.mobileSideMenu(mobileMenuOpen)}>
        <div style={styles.mobileMenuHeader}>
          <h2 style={{ margin: 0 }}>Menu</h2>
          <button 
            onClick={toggleMobileMenu} 
            style={styles.mobileMenuClose}
            aria-label="Close menu"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div style={styles.mobileNavLinks}>
          {currentUser ? (
            isPrime ? (
              /* Prime user navigation */
              <>
                <Link 
                  to="/dashboard" 
                  style={{
                    ...styles.mobileNavLink,
                    ...(isActive('/dashboard') ? styles.mobileActiveNavLink : {})
                  }}
                  onClick={toggleMobileMenu}
                >
                  {t('dashboard')}
                </Link>
                <Link 
                  to="/my-projects" 
                  style={{
                    ...styles.mobileNavLink,
                    ...(isActive('/my-projects') ? styles.mobileActiveNavLink : {})
                  }}
                  onClick={toggleMobileMenu}
                >
                  {t('projects')}
                </Link>
                <Link 
                  to="/my-contractors" 
                  style={{
                    ...styles.mobileNavLink,
                    ...(isActive('/my-contractors') ? styles.mobileActiveNavLink : {})
                  }}
                  onClick={toggleMobileMenu}
                >
                  {t('myContractors')}
                </Link>
                <Link 
                  to="/explore" 
                  style={{
                    ...styles.mobileNavLink,
                    ...(isActive('/explore') ? styles.mobileActiveNavLink : {})
                  }}
                  onClick={toggleMobileMenu}
                >
                  {t('explore')}
                </Link>
                <Link 
                  to="/notifications" 
                  style={{
                    ...styles.mobileNavLink,
                    ...(isActive('/notifications') ? styles.mobileActiveNavLink : {})
                  }}
                  onClick={toggleMobileMenu}
                >
                  <i className="fas fa-bell" style={{ marginRight: '6px' }}></i>
                  {unreadUpdates > 0 && (
                    <span className="notification-badge">{unreadUpdates}</span>
                  )}
                </Link>
                <Link 
                  to="/inbox" 
                  style={{
                    ...styles.mobileNavLink,
                    ...(isActive('/inbox') ? styles.mobileActiveNavLink : {})
                  }}
                  onClick={toggleMobileMenu}
                >
                  <i className="fas fa-inbox" style={{ marginRight: '6px' }}></i>
                  {t('inbox')}
                </Link>
              </>
            ) : (
              /* Contractor user navigation */
              <>
                <Link 
                  to="/dashboard" 
                  style={{
                    ...styles.mobileNavLink,
                    ...(isActive('/dashboard') ? styles.mobileActiveNavLink : {})
                  }}
                  onClick={toggleMobileMenu}
                >
                  {t('dashboard')}
                </Link>
                <Link 
                  to="/projects" 
                  style={{
                    ...styles.mobileNavLink,
                    ...(isActive('/projects') ? styles.mobileActiveNavLink : {})
                  }}
                  onClick={toggleMobileMenu}
                >
                  {t('projects')}
                </Link>
                <Link 
                  to="/project-pool" 
                  style={{
                    ...styles.mobileNavLink,
                    ...(isActive('/project-pool') ? styles.mobileActiveNavLink : {})
                  }}
                  onClick={toggleMobileMenu}
                >
                  {t('projectPool')}
                </Link>
                <Link 
                  to="/project-calendar" 
                  style={{
                    ...styles.mobileNavLink,
                    ...(isActive('/project-calendar') ? styles.mobileActiveNavLink : {})
                  }}
                  onClick={toggleMobileMenu}
                >
                  {t('projectCalendar')}
                </Link>
                <Link 
                  to="/inbox" 
                  style={{
                    ...styles.mobileNavLink,
                    ...(isActive('/inbox') ? styles.mobileActiveNavLink : {})
                  }}
                  onClick={toggleMobileMenu}
                >
                  <i className="fas fa-inbox" style={{ marginRight: '6px' }}></i>
                  {t('inbox')}
                </Link>
              </>
            )
          ) : (
            /* Public navigation links */
            <>
              <Link 
                to="/" 
                style={{
                  ...styles.mobileNavLink,
                  ...(isActive('/') ? styles.mobileActiveNavLink : {})
                }}
                onClick={toggleMobileMenu}
              >
                {t('home')}
              </Link>
              <Link 
                to="/login" 
                style={{
                  ...styles.mobileNavLink,
                  ...(isActive('/login') ? styles.mobileActiveNavLink : {})
                }}
                onClick={toggleMobileMenu}
              >
                {t('login')}
              </Link>
              <Link 
                to="/signup" 
                style={{
                  ...styles.mobileNavLink,
                  ...(isActive('/signup') ? styles.mobileActiveNavLink : {})
                }}
                onClick={toggleMobileMenu}
              >
                {t('signup')}
              </Link>
            </>
          )}

          {currentUser && (
            <>
              <div style={{ height: '1px', backgroundColor: '#e0e0e0', margin: '10px 0' }}></div>
              <Link 
                to="/profile" 
                style={{
                  ...styles.mobileNavLink,
                  ...(isActive('/profile') ? styles.mobileActiveNavLink : {})
                }}
                onClick={toggleMobileMenu}
              >
                {t('profile')}
              </Link>
              <Link 
                to="/company-profile" 
                style={{
                  ...styles.mobileNavLink,
                  ...(isActive('/company-profile') ? styles.mobileActiveNavLink : {})
                }}
                onClick={toggleMobileMenu}
              >
                {t('companyProfile')}
              </Link>
              <div 
                style={{
                  ...styles.mobileNavLink,
                  color: '#ea4335',
                }}
                onClick={() => {
                  handleLogout();
                  toggleMobileMenu();
                }}
              >
                {t('logout')}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Overlay for mobile menu */}
      <div 
        style={styles.overlay(mobileMenuOpen)} 
        onClick={toggleMobileMenu}
      ></div>
    </header>
  );
}

export default Header;

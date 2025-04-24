import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import Header from "./components/Header.jsx";
import Story from "./components/Story";
import ContractorRegistration from "./components/ContractorRegistration";
import ProjectLeaderRegistration from "./components/ProjectLeaderRegistration";
import SignUpPage from "./pages/SignUpPage";
import Footer from "./components/Footer";
import Carousel from "./components/Carousel";
import ProfilePage from "./pages/ProfilePage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import ContractorDetailPage from "./pages/ContractorDetailPage";
import SubcontractorMarketplace from "./pages/SubcontractorMarketplace";
import ProjectPool from "./pages/ProjectPool";
import ProjectInvites from "./pages/ProjectInvites";
import CompanyProfile from "./pages/CompanyProfile";
import PrivateRoute from "./components/PrivateRoute";
import ProjectCalendar from "./pages/ProjectCalendar";
import MyProjects from './pages/MyProjects';
import MyContractors from './pages/MyContractors';
import Explore from './pages/Explore';
import Inbox from './components/Inbox';
import NotificationsPage from './pages/NotificationsPage';

function App() {
  const { currentUser, loading } = useAuth();

  // If auth is still loading, show a simple loading screen
  if (loading) {
    return (
      <div className="App">
        <main className="app-content">
          <div className="loading-spinner-container">
            <div className="loading-spinner-circle"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <LanguageProvider>
      <Router>
        <div className="App">
          <Header />
          <main className="app-content">
            <Routes>
              {/* Public routes */}
              <Route
                path="/"
                element={
                  <>
                    <Story />
                  </>
                }
              />
              <Route
                path="/login"
                element={!currentUser ? <Login /> : <Navigate to="/dashboard" replace />}
              />
              <Route
                path="/signup"
                element={
                  !currentUser ? <SignUpPage /> : <Navigate to="/dashboard" replace />
                }
              />
              <Route
                path="/register"
                element={!currentUser ? <Register /> : <Navigate to="/dashboard" replace />}
              />

              {/* Protected routes */}
              <Route
                path="/contractor-registration"
                element={
                  <PrivateRoute>
                    <ContractorRegistration />
                  </PrivateRoute>
                }
              />
              <Route
                path="/project-leader-registration"
                element={
                  <PrivateRoute>
                    <ProjectLeaderRegistration />
                  </PrivateRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <PrivateRoute>
                    <ProfilePage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/projects"
                element={
                  <PrivateRoute>
                    <Projects />
                  </PrivateRoute>
                }
              />
              <Route
                path="/project/:projectId"
                element={
                  <PrivateRoute>
                    <ProjectDetailPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/contractor/:contractorId"
                element={
                  <PrivateRoute>
                    <ContractorDetailPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/subcontractor-marketplace"
                element={
                  <PrivateRoute>
                    <SubcontractorMarketplace />
                  </PrivateRoute>
                }
              />
              <Route
                path="/project-pool"
                element={
                  <PrivateRoute>
                    <ProjectPool />
                  </PrivateRoute>
                }
              />
              <Route
                path="/project-invites"
                element={
                  <Navigate to="/inbox?tab=invitations" replace />
                }
              />
              <Route
                path="/company-profile"
                element={
                  <PrivateRoute>
                    <CompanyProfile />
                  </PrivateRoute>
                }
              />
              <Route
                path="/project-calendar"
                element={
                  <PrivateRoute>
                    <ProjectCalendar />
                  </PrivateRoute>
                }
              />
              <Route
                path="/my-projects"
                element={
                  <PrivateRoute>
                    <MyProjects />
                  </PrivateRoute>
                }
              />
              <Route
                path="/my-contractors"
                element={
                  <PrivateRoute>
                    <MyContractors />
                  </PrivateRoute>
                }
              />
              <Route
                path="/explore"
                element={
                  <PrivateRoute>
                    <Explore />
                  </PrivateRoute>
                }
              />
              <Route
                path="/inbox"
                element={
                  <PrivateRoute>
                    <Inbox />
                  </PrivateRoute>
                }
              />
              <Route
                path="/notifications"
                element={
                  <PrivateRoute>
                    <NotificationsPage />
                  </PrivateRoute>
                }
              />

              {/* Fallback route */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </LanguageProvider>
  );
}

export default App;

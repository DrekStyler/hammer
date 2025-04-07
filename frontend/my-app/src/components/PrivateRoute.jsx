import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// This component handles private routes that require authentication
// It will redirect unauthenticated users to the login page
const PrivateRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  // Show a loading state if auth is still being determined
  if (loading) {
    return (
      <div className="private-route-loading">
        <p>Loading authentication...</p>
      </div>
    );
  }

  // Redirect to login if not authenticated
  return currentUser ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';

// Create the context
const RoleContext = createContext();

// Custom hook to use the role context
export const useRole = () => {
  return useContext(RoleContext);
};

// Provider component
export const RoleProvider = ({ children }) => {
  const { currentUser } = useAuth();

  // Get the initial role from localStorage or default to 'contractor'
  const [userRole, setUserRole] = useState(() => {
    const savedRole = localStorage.getItem('userRole');
    return savedRole || 'contractor';
  });

  // On auth state change, sync role data
  useEffect(() => {
    if (currentUser) {
      console.log('RoleContext: User authenticated, current role is', userRole);

      // If no role is set, set default
      if (!localStorage.getItem('userRole')) {
        console.log('RoleContext: Setting default role for new user');
        localStorage.setItem('userRole', 'contractor');
        setUserRole('contractor');
      }
    } else {
      console.log('RoleContext: No authenticated user');
    }
  }, [currentUser, userRole]);

  // Store the role in localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('userRole', userRole);
    console.log('RoleContext: User role updated to', userRole);
  }, [userRole]);

  // Function to change the role
  const changeRole = (newRole) => {
    if (newRole === 'prime' || newRole === 'contractor') {
      console.log('RoleContext: Changing role from', userRole, 'to', newRole);
      setUserRole(newRole);
    } else {
      console.error('Invalid role:', newRole);
    }
  };

  // Utility functions to check role types
  const isPrime = userRole === 'prime';
  const isContractor = userRole === 'contractor';

  // Context value
  const value = {
    userRole,
    changeRole,
    isPrime,
    isContractor
  };

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  );
};
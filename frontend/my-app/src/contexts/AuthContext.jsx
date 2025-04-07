import React, { createContext, useContext, useState, useEffect } from "react";
import { auth } from "../firebase/config";
import {
  onAuthStateChanged,
  signOut,
  setPersistence,
  browserLocalPersistence
} from "firebase/auth";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);

  useEffect(() => {
    // Set persistence to LOCAL to keep the user logged in between sessions
    setPersistence(auth, browserLocalPersistence)
      .then(() => {
        console.log("Firebase persistence set to LOCAL");
      })
      .catch(error => {
        console.error("Error setting auth persistence:", error);
      });

    // Check if a user is already signed in
    const forceCheckAuth = () => {
      // Check if auth has a current user
      const currentAuthUser = auth.currentUser;
      if (currentAuthUser) {
        console.log("Found existing authenticated user:", currentAuthUser.email);
        setCurrentUser(currentAuthUser);

        // Ensure user role is set in localStorage
        if (!localStorage.getItem('userRole')) {
          localStorage.setItem('userRole', 'contractor'); // Default role
        }
      } else {
        console.log("No existing authenticated user found");
      }
    };

    // Do a direct check for current user
    forceCheckAuth();

    // Set up auth state change listener
    const unsubscribe = onAuthStateChanged(auth, user => {
      console.log("Auth state changed:", user ? `User logged in: ${user.email}` : "User logged out");

      setCurrentUser(user);
      setLoading(false);
      setAuthInitialized(true);

      // If user logged in, store their data in localStorage for backup
      if (user) {
        localStorage.setItem('authUser', JSON.stringify({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName
        }));

        // Ensure user role is set
        if (!localStorage.getItem('userRole')) {
          localStorage.setItem('userRole', 'contractor'); // Default role
        }
      } else {
        // Clear auth backup on logout
        localStorage.removeItem('authUser');
      }
    }, error => {
      console.error("Auth state change error:", error);
      setLoading(false);
      setAuthInitialized(true);
    });

    return unsubscribe;
  }, []);

  const updateCurrentUser = (user) => {
    console.log("Manually updating current user:", user?.email);
    setCurrentUser(user);

    // Also update localStorage backup
    if (user) {
      localStorage.setItem('authUser', JSON.stringify({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName
      }));
    }
  };

  const refreshCurrentUser = async () => {
    try {
      if (auth.currentUser) {
        await auth.currentUser.reload();
        setCurrentUser({ ...auth.currentUser });
        console.log("User data refreshed:", auth.currentUser.email);
      }
    } catch (error) {
      console.error("Error refreshing user:", error);
    }
  };

  const logoutUser = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      localStorage.removeItem('authUser');
      console.log("User logged out successfully");
      return true;
    } catch (error) {
      console.error("Error logging out:", error);
      return false;
    }
  };

  const value = {
    currentUser,
    setCurrentUser: updateCurrentUser,
    loading,
    authInitialized,
    refreshUser: refreshCurrentUser,
    logout: logoutUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

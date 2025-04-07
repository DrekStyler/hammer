import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { AuthProvider } from "./contexts/AuthContext";
import { RoleProvider } from "./contexts/RoleContext";
import "./index.css";
// Import Firebase config first to ensure it's initialized
import { app, db, auth } from './firebase/config';
import { initializeFirestoreCollections } from './firebase/firestoreSetup';
// Import GoogleOAuthProvider
import { GoogleOAuthProvider } from '@react-oauth/google';
import { onAuthStateChanged, setPersistence, browserLocalPersistence } from "firebase/auth";

// Function to initialize the application
const initializeApp = async () => {
  try {
    console.log('Application initialization started');

    // Set Firebase auth persistence to LOCAL
    await setPersistence(auth, browserLocalPersistence)
      .then(() => console.log('Firebase persistence set to LOCAL in main.jsx'))
      .catch(err => console.error('Error setting Firebase persistence:', err));

    // Wait for auth state to be checked before initializing Firestore
    const waitForAuthInit = new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe();

        if (user) {
          console.log('Auth state initialized: user logged in as', user.email);
          // Store user in localStorage as backup
          localStorage.setItem('authUser', JSON.stringify({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName
          }));
        } else {
          console.log('Auth state initialized: no user');
          // Try to recover from localStorage
          const storedUser = localStorage.getItem('authUser');
          if (storedUser) {
            console.log('Found stored auth data in localStorage, user might be logged in on another tab');
          }
        }

        resolve(user);
      });
    });

    // Wait for auth before initializing Firestore
    await waitForAuthInit;

    // Initialize Firestore collections after auth is checked
    console.log('Initializing Firestore collections...');
    initializeFirestoreCollections()
      .then(() => console.log('Firestore collections initialized successfully'))
      .catch(err => {
        console.error('Failed to initialize collections:', err);
        // This is non-fatal, app can still function
      });
  } catch (error) {
    console.error('Error during application initialization:', error);
    // Continue app initialization despite errors
  }
};

// Initialize the app
initializeApp();

// Render the React application
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/*
      Replace 'YOUR_GOOGLE_CLIENT_ID' with your actual Google OAuth client ID
      from the Google Cloud Console: https://console.cloud.google.com/apis/credentials
    */}
    <GoogleOAuthProvider clientId="YOUR_GOOGLE_CLIENT_ID">
      <AuthProvider>
        <RoleProvider>
          <App />
        </RoleProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);

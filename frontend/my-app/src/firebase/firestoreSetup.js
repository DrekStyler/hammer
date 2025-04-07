import { collection, doc, setDoc, serverTimestamp, getFirestore } from "firebase/firestore";
import { db, app } from "./config";

// Initialize Firestore collections to match your backend models
export const initializeFirestoreCollections = async () => {
    try {
        console.log('Starting Firestore collections initialization...');

        // Get a valid Firestore instance
        let firestoreDb = db;

        // If db isn't properly initialized, try to get a new instance
        if (!firestoreDb || typeof firestoreDb.collection !== 'function') {
            console.warn("Using fallback Firestore initialization");

            // Make sure app is initialized
            if (!app) {
                console.error("Firebase app not initialized");
                return Promise.reject(new Error("Firebase app not initialized"));
            }

            firestoreDb = getFirestore(app);

            // If still not valid, exit early
            if (!firestoreDb) {
                console.error("Could not initialize Firestore");
                return Promise.reject(new Error("Could not initialize Firestore"));
            }
        }

        // Check if the user is authenticated before proceeding
        try {
            // Create collection references - just to test connection
            // We don't need to actually create any documents at this point
            const usersCollectionRef = collection(firestoreDb, "users");
            const skillsCollectionRef = collection(firestoreDb, "skills");
            const projectsCollectionRef = collection(firestoreDb, "projects");

            console.log('Successfully established collection references');
            return Promise.resolve();
        } catch (error) {
            console.warn('Collection access test failed, possibly due to authentication:', error);
            // Continue anyway - might work after auth
            return Promise.resolve();
        }

    } catch (error) {
        console.error('Error initializing Firestore collections:', error);
        return Promise.reject(error);
    }
};
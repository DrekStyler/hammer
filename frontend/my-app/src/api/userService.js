import { doc, setDoc, getDoc, updateDoc, enableIndexedDbPersistence } from "firebase/firestore";
import { db } from "../firebase/config";
import { apiClient } from "./api";

// Enable offline persistence
try {
    enableIndexedDbPersistence(db).catch((err) => {
        if (err.code === 'failed-precondition') {
            console.warn('Persistence failed: multiple tabs open');
        } else if (err.code === 'unimplemented') {
            console.warn('Persistence not available in this browser');
        }
    });
} catch (err) {
    console.warn('Error enabling persistence:', err);
}

export const createUserProfile = async (uid, userData) => {
    try {
        // First update Firestore with retry logic
        const userRef = doc(db, "users", uid);
        let retries = 3;

        while (retries > 0) {
            try {
                await setDoc(userRef, {
                    ...userData,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
                break; // Success - exit retry loop
            } catch (firestoreError) {
                retries--;
                if (retries === 0) throw firestoreError;
                await new Promise(r => setTimeout(r, 1000)); // Wait before retry
            }
        }

        // Then update backend using the API endpoint
        if (userData.user_type === "prime") {
            await apiClient.post("/project-leaders/", {
                user: {
                    firebase_uid: uid,
                    email: userData.email,
                    first_name: userData.firstName,
                    last_name: userData.lastName,
                    phone: userData.phone,
                    company_name: userData.companyName,
                    user_type: userData.user_type,
                    location: userData.location || ""
                },
                skill_ids: userData.skillIds || []
            });
        } else if (userData.user_type === "SUBCONTRACTOR") {
            await apiClient.post("/subcontractors/", {
                user: {
                    firebase_uid: uid,
                    email: userData.email,
                    first_name: userData.firstName,
                    last_name: userData.lastName,
                    phone: userData.phone,
                    company_name: userData.companyName,
                    user_type: userData.user_type,
                    location: userData.location || ""
                },
                hourly_rate: userData.hourlyRate || 0,
                has_insurance: userData.hasInsurance || false,
                skill_ids: userData.skillIds || []
            });
        }

        return true;
    } catch (error) {
        console.error("Error creating user profile:", error);
        // Track error in monitoring system if needed
        throw error;
    }
};

export const updateUserProfile = async (uid, userData) => {
    try {
        // Sanitize data for Firestore (remove undefined values)
        const sanitizedData = Object.entries(userData)
            .filter(([_, value]) => value !== undefined)
            .reduce((obj, [key, value]) => ({...obj, [key]: value}), {});

        // Update Firestore
        const userRef = doc(db, "users", uid);
        await updateDoc(userRef, {
            ...sanitizedData,
            updatedAt: new Date().toISOString()
        });

        // Update backend
        await apiClient.put("/users/profile", {
            location: userData.location || null,
            hourly_rate: userData.hourlyRate || null
        });

        return true;
    } catch (error) {
        console.error("Error updating user profile:", error);
        throw error;
    }
};
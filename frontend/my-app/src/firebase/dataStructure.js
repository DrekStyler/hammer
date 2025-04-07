import { collection, doc } from "firebase/firestore";
import { db } from "./config";

// Define collection references centrally
export const collections = {
    users: collection(db, "users"),
    projects: collection(db, "projects"),
    skills: collection(db, "skills")
};

// Helper function to get doc references
export const getDocRef = (collectionName, id) => {
    return doc(collections[collectionName], id);
};

// Define data schemas (for documentation/validation)
export const schemas = {
    user: {
        required: ['email', 'firstName', 'lastName', 'user_type'],
        optional: ['phone', 'companyName', 'location', 'createdAt', 'updatedAt']
    },
    project: {
        required: ['title', 'status', 'createdAt'],
        optional: ['description', 'location', 'budget', 'clientName', 'images']
    }
};
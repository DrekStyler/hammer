import { collection, addDoc, updateDoc, doc, serverTimestamp, getDoc } from "firebase/firestore";
import { db, auth } from "../firebase/config";
import { apiClient } from "./api";

// Function to create a calendar event for a project
const createProjectCalendarEvent = async (projectId, projectData) => {
    try {
        const eventData = {
            id: projectId,
            title: projectData.title,
            start: projectData.startDate,
            end: projectData.endDate,
            projectId: projectId,
            backgroundColor: getStatusColor(projectData.status),
            borderColor: getStatusColor(projectData.status),
            extendedProps: {
                description: projectData.description,
                client: projectData.clientName,
                status: projectData.status
            }
        };

        // Create the event in the calendar events collection
        const calendarEventsRef = collection(db, "calendarEvents");
        await addDoc(calendarEventsRef, {
            ...eventData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        console.log("Calendar event created for project:", projectId);
    } catch (error) {
        console.error("Error creating calendar event:", error);
        // Don't throw the error - we don't want to fail the project creation if calendar event creation fails
    }
};

// Helper function to get status color
const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
        case 'draft':
            return '#5f6368';
        case 'published':
            return '#1a73e8';
        case 'in progress':
            return '#34a853';
        case 'completed':
            return '#4285f4';
        case 'cancelled':
            return '#ea4335';
        default:
            return '#1a73e8';
    }
};

export const createProject = async (projectData, images = []) => {
    try {
        const user = auth.currentUser;

        if (!user) throw new Error("User not authenticated");

        // Get user profile data for denormalization
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userData = userDoc.data() || {}; // Ensure userData is an object even if no data

        // Add denormalized data to improve query performance
        const enhancedProjectData = {
            ...projectData,
            project_leader_id: user.uid,
            project_leader_name: `${userData?.firstName || ''} ${userData?.lastName || ''}`.trim() || user.email || 'Unknown User',
            project_leader_company: userData?.companyName || "",
            createdBy: user.uid,
            status: projectData.status || 'draft',
            biddingStatus: projectData.status === 'published' ? 'open' : 'closed',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            search_keywords: generateSearchKeywords(projectData.title, projectData.description)
        };

        // Create in Firestore
        const projectRef = collection(db, "projects");
        const projectSnapshot = await addDoc(projectRef, enhancedProjectData);

        console.log("Project created in Firestore with ID:", projectSnapshot.id);

        // Create calendar event for the project
        if (projectData.startDate && projectData.endDate) {
            await createProjectCalendarEvent(projectSnapshot.id, enhancedProjectData);
        }

        // Check if we're in development mode before attempting backend API call
        const isDevelopmentEnv = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

        if (isDevelopmentEnv) {
            console.log("Running in development environment - skipping backend API call");
            return projectSnapshot.id;
        }

        try {
            // Log the API URL being used
            console.log("Using API endpoint:", apiClient.defaults.baseURL);

            // Create a FormData object for the backend
            const formData = new FormData();
            formData.append("title", projectData.title);
            formData.append("description", projectData.description || "");
            formData.append("location", projectData.location || "");
            formData.append("status", projectData.status || 'draft'); // Default to draft if not specified
            formData.append("biddingStatus", projectData.status === 'published' ? 'open' : 'closed'); // Only published projects are open for bidding

            // Add images if any
            for (const image of images) {
                formData.append("images", image);
            }

            // Add Firebase project ID as a reference
            formData.append("firebase_id", projectSnapshot.id);

            // Send to backend
            console.log("Sending project to backend API");
            const response = await apiClient.post("/projects", formData, {
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            });

            console.log("Backend API response:", response.data);

            // Only update Firestore with the backend ID if it exists
            if (response.data && response.data.id) {
                console.log("Updating Firestore with backend ID:", response.data.id);
                await updateDoc(doc(db, "projects", projectSnapshot.id), {
                    backendId: response.data.id
                });
            } else {
                console.warn("Backend did not return a project ID. The Firestore document will not have a backendId reference.");

                // Check if we're in development mode
                if (isDevelopmentEnv) {
                    console.log("Running in development environment - this may be expected behavior");
                } else {
                    // In production, provide more detailed diagnostic info
                    console.error("Production API Error: Backend didn't return an ID", {
                        baseURL: apiClient.defaults.baseURL,
                        responseData: response.data,
                        status: response.status
                    });
                }
            }
        } catch (backendError) {
            console.error("Backend API error:", backendError);

            // More detailed error logging
            if (backendError.response) {
                console.error("Error response from backend:", {
                    status: backendError.response.status,
                    data: backendError.response.data
                });
            } else if (backendError.request) {
                console.error("No response received from backend:", backendError.request);
            } else {
                console.error("Error setting up backend request:", backendError.message);
            }

            // Continue without failing - we still have the Firestore project
            console.warn("Project created in Firestore but failed to sync with backend");

            // Only show alert in production environment
            if (!isDevelopmentEnv) {
                alert("Your project was created, but there was an issue connecting to our backend services. Some features may be limited until this is resolved.");
            }
        }

        return projectSnapshot.id;
    } catch (error) {
        console.error("Error creating project:", error);
        throw error;
    }
};

// New function to update project data
export const updateProject = async (projectId, projectData, images = []) => {
    try {
        const user = auth.currentUser;

        if (!user) throw new Error("User not authenticated");

        const projectRef = doc(db, "projects", projectId);
        const projectDoc = await getDoc(projectRef);

        if (!projectDoc.exists()) {
            throw new Error("Project not found");
        }

        const projectData_DB = projectDoc.data();

        // Only allow updating if the user is the creator of the project
        if (projectData_DB.project_leader_id !== user.uid && projectData_DB.createdBy !== user.uid) {
            throw new Error("You don't have permission to update this project");
        }

        // Set bidding status based on project status
        const biddingStatus = projectData.status === 'published' ? 'open' : 'closed';

        // Preserve createdAt and update the updatedAt timestamp
        const updatedData = {
            ...projectData,
            biddingStatus: biddingStatus,
            updatedAt: serverTimestamp()
        };

        // Don't update these fields if they aren't provided
        if (!projectData.title) delete updatedData.title;
        if (!projectData.description) delete updatedData.description;
        if (!projectData.location) delete updatedData.location;

        // Update search keywords if title or description changed
        if (projectData.title || projectData.description) {
            const currentTitle = projectData.title || projectData_DB.title || '';
            const currentDescription = projectData.description || projectData_DB.description || '';
            updatedData.search_keywords = generateSearchKeywords(currentTitle, currentDescription);
        }

        console.log("Updating project in Firestore with ID:", projectId);

        // Update in Firestore
        await updateDoc(projectRef, updatedData);

        // Update in backend if there's a backendId
        if (projectData_DB.backendId) {
            try {
                // Log the API URL being used
                console.log("Using API endpoint:", apiClient.defaults.baseURL);

                // Create a FormData object for the backend
                const formData = new FormData();

                // Add all editable fields
                if (projectData.title) formData.append("title", projectData.title);
                if (projectData.description) formData.append("description", projectData.description);
                if (projectData.location) formData.append("location", projectData.location);
                if (projectData.status) formData.append("status", projectData.status);
                formData.append("biddingStatus", biddingStatus); // Always send bidding status

                // Add new images if any
                for (const image of images) {
                    formData.append("images", image);
                }

                // Reference back to Firestore
                formData.append("firebase_id", projectId);

                // Send to backend
                console.log("Sending updated project to backend API");
                const response = await apiClient.put(`/projects/${projectData_DB.backendId}`, formData, {
                    headers: {
                        "Content-Type": "multipart/form-data"
                    }
                });

                console.log("Backend API response:", response.data);
            } catch (backendError) {
                console.error("Backend API error:", backendError);

                // More detailed error logging
                if (backendError.response) {
                    console.error("Error response from backend:", {
                        status: backendError.response.status,
                        data: backendError.response.data
                    });
                } else if (backendError.request) {
                    console.error("No response received from backend:", backendError.request);
                } else {
                    console.error("Error setting up backend request:", backendError.message);
                }

                // Continue without failing - we still updated Firestore
                console.warn("Project updated in Firestore but failed to sync with backend");
            }
        }

        return projectId;
    } catch (error) {
        console.error("Error updating project:", error);
        throw error;
    }
};

// Helper to generate search keywords for better text search
function generateSearchKeywords(title, description) {
    const combined = `${title} ${description || ""}`.toLowerCase();
    const words = combined.split(/\W+/).filter(word => word.length > 2);
    return [...new Set(words)]; // Remove duplicates
}
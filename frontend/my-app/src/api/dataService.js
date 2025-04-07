import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  deleteDoc
} from "firebase/firestore";
import { db, auth } from "../firebase/config";

/**
 * Get the current user ID
 */
const getCurrentUserId = () => {
  return auth.currentUser?.uid || 'unknown-user';
};

/**
 * Project Service Functions
 */

// Create a new project
export const createProject = async (projectData) => {
  try {
    const userId = getCurrentUserId();

    // Add metadata
    const enhancedProjectData = {
      ...projectData,
      createdBy: userId,
      status: projectData.status || 'open'
    };

    // Sanitize data for Firestore (remove undefined values)
    const sanitizedData = Object.entries(enhancedProjectData)
      .filter(([_, value]) => value !== undefined)
      .reduce((obj, [key, value]) => ({...obj, [key]: value}), {});

    // Firebase implementation
    const projectRef = collection(db, "projects");
    const docRef = await addDoc(projectRef, {
      ...sanitizedData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return docRef.id;
  } catch (error) {
    console.error("Error creating project:", error);
    throw error;
  }
};

// Get projects by user ID
export const getProjectsByUser = async (userId = null) => {
  try {
    const currentUserId = userId || getCurrentUserId();

    // Firebase implementation
    const projectsRef = collection(db, "projects");
    const q = query(
      projectsRef,
      where("createdBy", "==", currentUserId),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error getting projects:", error);
    throw error;
  }
};

// Get all projects (can be filtered)
export const getAllProjects = async (filters = {}) => {
  try {
    // Firebase implementation
    const projectsRef = collection(db, "projects");
    let q = query(projectsRef, orderBy("createdAt", "desc"));

    // Apply filters if any
    if (filters.status) {
      q = query(q, where("status", "==", filters.status));
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error getting all projects:", error);
    throw error;
  }
};

// Update a project
export const updateProject = async (projectId, projectData) => {
  try {
    // Sanitize data for Firestore (remove undefined values)
    const sanitizedData = Object.entries(projectData)
      .filter(([_, value]) => value !== undefined)
      .reduce((obj, [key, value]) => ({...obj, [key]: value}), {});

    // Firebase implementation
    const projectRef = doc(db, "projects", projectId);
    await updateDoc(projectRef, {
      ...sanitizedData,
      updatedAt: serverTimestamp()
    });

    return true;
  } catch (error) {
    console.error("Error updating project:", error);
    throw error;
  }
};

// Delete a project
export const deleteProject = async (projectId) => {
  try {
    // Firebase implementation
    const projectRef = doc(db, "projects", projectId);
    await deleteDoc(projectRef);

    return true;
  } catch (error) {
    console.error("Error deleting project:", error);
    throw error;
  }
};

// Get a project by ID
export const getProjectById = async (projectId) => {
  try {
    // Firebase implementation
    const projectRef = doc(db, "projects", projectId);
    const projectSnap = await getDoc(projectRef);

    if (!projectSnap.exists()) {
      return null;
    }

    const projectData = {
      id: projectSnap.id,
      ...projectSnap.data()
    };

    // Get project invitations
    try {
      const invitationsRef = collection(db, "projectInvitations");
      const q = query(invitationsRef, where("projectId", "==", projectId));
      const invitationsSnap = await getDocs(q);
      const invitations = invitationsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      projectData.invitations = invitations;

      // Get invited contractors details
      const contractorIds = invitations.map(inv => inv.contractorId);
      if (contractorIds.length > 0) {
        const contractorsRef = collection(db, "contractors");
        const contractors = [];

        for (const contractorId of contractorIds) {
          const contractorDoc = await getDoc(doc(db, "contractors", contractorId));
          if (contractorDoc.exists()) {
            contractors.push({
              id: contractorDoc.id,
              ...contractorDoc.data()
            });
          }
        }

        projectData.invitedContractors = contractors;
      }
    } catch (invitationError) {
      console.error("Error fetching project invitations:", invitationError);
      // Continue even if invitations can't be fetched
      projectData.invitations = [];
      projectData.invitedContractors = [];
    }

    return projectData;
  } catch (error) {
    console.error("Error getting project by ID:", error);
    throw error;
  }
};

/**
 * Contractor Service Functions
 */

// Create a new contractor
export const createContractor = async (contractorData) => {
  try {
    const userId = getCurrentUserId();

    // Add metadata
    const enhancedContractorData = {
      ...contractorData,
      createdBy: userId
    };

    // Sanitize data for Firestore (remove undefined values)
    const sanitizedData = Object.entries(enhancedContractorData)
      .filter(([_, value]) => value !== undefined)
      .reduce((obj, [key, value]) => ({...obj, [key]: value}), {});

    // Firebase implementation
    const contractorRef = collection(db, "contractors");
    const docRef = await addDoc(contractorRef, {
      ...sanitizedData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return docRef.id;
  } catch (error) {
    console.error("Error creating contractor:", error);
    throw error;
  }
};

// Get contractors by user ID
export const getContractorsByUser = async (userId = null) => {
  try {
    const currentUserId = userId || getCurrentUserId();

    // Firebase implementation
    const contractorsRef = collection(db, "contractors");
    const q = query(contractorsRef, where("createdBy", "==", currentUserId));

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error getting contractors:", error);
    throw error;
  }
};

// Get all contractors
export const getAllContractors = async () => {
  try {
    // Firebase implementation
    const contractorsRef = collection(db, "contractors");
    const querySnapshot = await getDocs(contractorsRef);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error getting all contractors:", error);
    throw error;
  }
};

// Get a contractor by ID
export const getContractorById = async (contractorId) => {
  try {
    // Firebase implementation
    const contractorRef = doc(db, "contractors", contractorId);
    const contractorSnap = await getDoc(contractorRef);

    if (!contractorSnap.exists()) {
      return null;
    }

    return {
      id: contractorSnap.id,
      ...contractorSnap.data()
    };
  } catch (error) {
    console.error("Error getting contractor by ID:", error);
    throw error;
  }
};

// Get projects by contractor ID
export const getProjectsByContractor = async (contractorId) => {
  try {
    // First get project invitations for this contractor
    const invitationsRef = collection(db, "projectInvitations");
    const q = query(invitationsRef, where("contractorId", "==", contractorId));
    const invitationsSnap = await getDocs(q);

    if (invitationsSnap.empty) {
      return [];
    }

    const invitations = invitationsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Get projects for each invitation
    const projectIds = [...new Set(invitations.map(inv => inv.projectId))];
    const projects = [];

    for (const projectId of projectIds) {
      const projectRef = doc(db, "projects", projectId);
      const projectSnap = await getDoc(projectRef);

      if (projectSnap.exists()) {
        const project = {
          id: projectSnap.id,
          ...projectSnap.data(),
          invitation: invitations.find(inv => inv.projectId === projectId)
        };
        projects.push(project);
      }
    }

    return projects;
  } catch (error) {
    console.error("Error getting projects by contractor:", error);
    throw error;
  }
};

// Update a contractor
export const updateContractor = async (contractorId, contractorData) => {
  try {
    // Sanitize data for Firestore (remove undefined values)
    const sanitizedData = Object.entries(contractorData)
      .filter(([_, value]) => value !== undefined)
      .reduce((obj, [key, value]) => ({...obj, [key]: value}), {});

    // Firebase implementation
    const contractorRef = doc(db, "contractors", contractorId);
    await updateDoc(contractorRef, {
      ...sanitizedData,
      updatedAt: serverTimestamp()
    });

    return true;
  } catch (error) {
    console.error("Error updating contractor:", error);
    throw error;
  }
};

// Delete a contractor
export const deleteContractor = async (contractorId) => {
  try {
    // Firebase implementation
    const contractorRef = doc(db, "contractors", contractorId);
    await deleteDoc(contractorRef);

    return true;
  } catch (error) {
    console.error("Error deleting contractor:", error);
    throw error;
  }
};

/**
 * Project Invitation Functions
 */

// Create a new project invitation
export const createProjectInvitation = async (invitationData) => {
  try {
    const { projectId, contractorId } = invitationData;
    if (!projectId || !contractorId) {
      throw new Error("Project ID and Contractor ID are required");
    }

    // Check if invitation already exists
    const invitationsRef = collection(db, "projectInvitations");
    const q = query(
      invitationsRef,
      where("projectId", "==", projectId),
      where("contractorId", "==", contractorId)
    );

    const existingInvitations = await getDocs(q);

    if (!existingInvitations.empty) {
      // Update existing invitation
      const existingInvitationId = existingInvitations.docs[0].id;
      const existingInvitationData = existingInvitations.docs[0].data();

      // Sanitize data for Firestore (remove undefined values)
      const sanitizedData = Object.entries(invitationData)
        .filter(([_, value]) => value !== undefined)
        .reduce((obj, [key, value]) => ({...obj, [key]: value}), {});

      const invitationRef = doc(db, "projectInvitations", existingInvitationId);
      await updateDoc(invitationRef, {
        ...sanitizedData,
        status: invitationData.status || existingInvitationData.status || "pending",
        updatedAt: serverTimestamp()
      });

      return existingInvitationId;
    } else {
      // Create new invitation
      const enhancedInvitationData = {
        ...invitationData,
        status: invitationData.status || "pending",
        createdBy: getCurrentUserId()
      };

      const invitationRef = collection(db, "projectInvitations");
      const docRef = await addDoc(invitationRef, {
        ...enhancedInvitationData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return docRef.id;
    }
  } catch (error) {
    console.error("Error creating project invitation:", error);
    throw error;
  }
};

// Get project invitations by project ID
export const getProjectInvitations = async (projectId) => {
  try {
    // Firebase implementation
    const invitationsRef = collection(db, "projectInvitations");
    const q = query(invitationsRef, where("projectId", "==", projectId));

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error getting project invitations:", error);
    throw error;
  }
};

// Get invitations for a contractor
export const getContractorInvitations = async (contractorId) => {
  try {
    // Firebase implementation
    const invitationsRef = collection(db, "projectInvitations");
    const q = query(invitationsRef, where("contractorId", "==", contractorId));

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error getting contractor invitations:", error);
    throw error;
  }
};

// Update a project invitation
export const updateProjectInvitation = async (invitationId, invitationData) => {
  try {
    // Sanitize data for Firestore (remove undefined values)
    const sanitizedData = Object.entries(invitationData)
      .filter(([_, value]) => value !== undefined)
      .reduce((obj, [key, value]) => ({...obj, [key]: value}), {});

    // Firebase implementation
    const invitationRef = doc(db, "projectInvitations", invitationId);
    await updateDoc(invitationRef, {
      ...sanitizedData,
      updatedAt: serverTimestamp()
    });

    return true;
  } catch (error) {
    console.error("Error updating project invitation:", error);
    throw error;
  }
};

// Delete a project invitation
export const deleteProjectInvitation = async (invitationId) => {
  try {
    // Firebase implementation
    const invitationRef = doc(db, "projectInvitations", invitationId);
    await deleteDoc(invitationRef);

    return true;
  } catch (error) {
    console.error("Error deleting project invitation:", error);
    throw error;
  }
};
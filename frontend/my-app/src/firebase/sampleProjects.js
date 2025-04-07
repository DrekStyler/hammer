import { db } from './config';
import { collection, getDocs, query, where, addDoc, writeBatch, doc, deleteDoc } from 'firebase/firestore';

// Sample project data
const sampleProjects = [
  {
    title: "Luxury Condo Renovation",
    description: "Complete renovation of a 3-bedroom luxury condominium including kitchen, bathrooms, and living areas. Looking for experienced contractors in high-end residential renovations.",
    budget: 150000,
    startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks from now
    endDate: new Date(Date.now() + 104 * 24 * 60 * 60 * 1000).toISOString(), // ~3.5 months from now
    location: "New York, NY",
    requiredSkills: ["Plumbing", "Electrical", "Carpentry", "Painting"],
    status: "Open",
    clientName: "Skyline Properties",
    clientContact: "contact@skylineproperties.example.com",
    bidDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
    additionalDetails: "Project requires premium materials and finishes. All contractors must have experience with luxury renovations and be able to provide references.",
    attachments: [],
    language: "English"
  },
  {
    title: "Commercial Office Remodel",
    description: "Remodeling of a 5000 sq ft office space including new flooring, lighting, wall configurations, and HVAC updates. Seeking contractors with commercial experience.",
    budget: 200000,
    startDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(), // 3 weeks from now
    endDate: new Date(Date.now() + 111 * 24 * 60 * 60 * 1000).toISOString(), // ~3.7 months from now
    location: "Chicago, IL",
    requiredSkills: ["Electrical", "HVAC", "Flooring", "Drywall"],
    status: "Open",
    clientName: "Windy City Workspaces",
    clientContact: "projects@windycityworkspaces.example.com",
    bidDeadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days from now
    additionalDetails: "Work must be done after hours and on weekends to minimize disruption to neighboring offices. All contractors must be bonded and insured.",
    attachments: [],
    language: "English"
  },
  {
    title: "Residential Kitchen Renovation",
    description: "Complete kitchen renovation for a single-family home including new cabinets, countertops, appliances, and flooring. Looking for contractors experienced in residential kitchen remodels.",
    budget: 75000,
    startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 1 month from now
    endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 2 months from now
    location: "Los Angeles, CA",
    requiredSkills: ["Plumbing", "Electrical", "Carpentry"],
    status: "Open",
    clientName: "West Coast Homes",
    clientContact: "info@westcoasthomes.example.com",
    bidDeadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks from now
    additionalDetails: "Homeowners have selected appliances but need assistance with cabinet and countertop selection. Work can be done during standard business hours.",
    attachments: [],
    language: "English"
  },
  {
    title: "Remodelación de Tienda Minorista",
    description: "Renovación completa de un espacio comercial de 2500 pies cuadrados en un centro comercial, incluyendo pisos, iluminación, probadores y exhibidores personalizados. Buscamos contratistas con experiencia en proyectos minoristas.",
    budget: 120000,
    startDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(), // 1.5 months from now
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 3 months from now
    location: "Houston, TX",
    requiredSkills: ["Electrical", "Carpentry", "Painting", "Flooring"],
    status: "Open",
    clientName: "Lone Star Retail",
    clientContact: "build@lonestarretail.example.com",
    bidDeadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(), // 3 weeks from now
    additionalDetails: "El proyecto debe completarse de acuerdo con las pautas del centro comercial. Todo el trabajo debe realizarse después del horario comercial o antes de la apertura.",
    attachments: [],
    language: "Español"
  },
  {
    title: "Restauración de Casa Histórica",
    description: "Restauración de una casa de estilo Tudor de la década de 1920, incluyendo reparaciones apropiadas para la época en carpintería, yeso, ventanas y techos. Buscamos contratistas con experiencia en preservación histórica.",
    budget: 250000,
    startDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 2 months from now
    endDate: new Date(Date.now() + 240 * 24 * 60 * 60 * 1000).toISOString(), // 8 months from now
    location: "Miami, FL",
    requiredSkills: ["Carpentry", "Roofing", "Masonry", "Painting"],
    status: "Open",
    clientName: "Heritage Preservation Society",
    clientContact: "restoration@heritagepreservation.example.com",
    bidDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 1 month from now
    additionalDetails: "El proyecto debe seguir las pautas de preservación histórica. Todos los materiales y técnicas deben ser aprobados por la sociedad histórica antes de su uso.",
    attachments: [],
    language: "Español"
  }
];

// Sample invitations data
const sampleInvitations = [
  {
    projectId: "sample-project-1",
    projectTitle: "Luxury Condo Renovation",
    projectDescription: "Complete renovation of a 3-bedroom luxury condominium including kitchen, bathrooms, and living areas.",
    projectBudget: 150000,
    projectLocation: "New York, NY",
    clientName: "Skyline Properties",
    clientId: "sample-client-1",
    invitationDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    responseDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
    status: "Pending",
    notes: "We've been impressed with your previous work and would like to invite you to bid on this project.",
    language: "English"
  },
  {
    projectId: "sample-project-2",
    projectTitle: "Commercial Office Remodel",
    projectDescription: "Remodeling of a 5000 sq ft office space including new flooring, lighting, wall configurations, and HVAC updates.",
    projectBudget: 200000,
    projectLocation: "Chicago, IL",
    clientName: "Windy City Workspaces",
    clientId: "sample-client-2",
    invitationDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    responseDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
    status: "Pending",
    notes: "Your expertise in commercial electrical work would be valuable for this project.",
    language: "English"
  },
  {
    projectId: "sample-project-3",
    projectTitle: "Renovación de Cocina Residencial",
    projectDescription: "Renovación completa de cocina para una casa unifamiliar, incluyendo nuevos gabinetes, encimeras, electrodomésticos y pisos.",
    projectBudget: 75000,
    projectLocation: "Los Angeles, CA",
    clientName: "West Coast Homes",
    clientId: "sample-client-3",
    invitationDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
    responseDeadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days from now
    status: "Pending",
    notes: "Hemos visto su trabajo en cocinas y nos gustaría hablar sobre esta oportunidad con usted.",
    language: "Español"
  }
];

/**
 * Check if projects already exist for the user
 * @param {string} userId - The current user's ID
 * @returns {Promise<boolean>} - Whether projects exist
 */
export const checkIfProjectsExist = async (userId) => {
  try {
    const projectsRef = collection(db, 'projects');
    const q = query(projectsRef, where('clientId', '==', userId));
    const snapshot = await getDocs(q);

    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking if projects exist:', error);
    return false;
  }
};

/**
 * Create sample projects in the database
 * @param {string} userId - The current user's ID
 * @returns {Promise<void>}
 */
export const createSampleProjects = async (userId) => {
  try {
    // Check if projects already exist
    const projectsExist = await checkIfProjectsExist(userId);

    if (projectsExist) {
      console.log('Sample projects already exist for this user');
      return;
    }

    console.log('Creating sample projects...');

    // Use a batch write for better performance
    const batch = writeBatch(db);
    const projectsRef = collection(db, 'projects');

    // Add each sample project to the batch
    const projectIds = [];
    sampleProjects.forEach((project) => {
      const newProjectRef = doc(projectsRef);
      projectIds.push(newProjectRef.id);
      batch.set(newProjectRef, {
        ...project,
        clientId: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    });

    // Commit the batch
    await batch.commit();
    console.log('Successfully created sample projects');

    return projectIds;
  } catch (error) {
    console.error('Error creating sample projects:', error);
    throw error;
  }
};

/**
 * Check if invitations already exist for the user
 * @param {string} userId - The current user's ID
 * @returns {Promise<boolean>} - Whether invitations exist
 */
export const checkIfInvitationsExist = async (userId) => {
  try {
    const invitesRef = collection(db, 'projectInvites');
    const q = query(invitesRef, where('inviteeId', '==', userId));
    const snapshot = await getDocs(q);

    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking if invitations exist:', error);
    return false;
  }
};

/**
 * Create sample project invitations in the database
 * @param {string} userId - The current user's ID
 * @returns {Promise<void>}
 */
export const createSampleInvitations = async (userId) => {
  try {
    // Check if invitations already exist
    const invitationsExist = await checkIfInvitationsExist(userId);

    if (invitationsExist) {
      console.log('Sample invitations already exist for this user');
      return;
    }

    console.log('Creating sample project invitations...');

    // Use a batch write for better performance
    const batch = writeBatch(db);
    const invitesRef = collection(db, 'projectInvites');

    // Add each sample invitation to the batch
    sampleInvitations.forEach((invitation) => {
      const newInviteRef = doc(invitesRef);
      batch.set(newInviteRef, {
        ...invitation,
        inviteeId: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    });

    // Commit the batch
    await batch.commit();
    console.log('Successfully created sample project invitations');
  } catch (error) {
    console.error('Error creating sample invitations:', error);
    throw error;
  }
};

/**
 * Delete all sample projects for a user
 * @param {string} userId - The user's ID
 * @returns {Promise<number>} - Number of deleted projects
 */
export const deleteSampleProjects = async (userId) => {
  try {
    if (!userId) {
      console.error('Cannot delete sample projects: No user ID provided');
      return 0;
    }

    const projectsRef = collection(db, 'projects');
    const q = query(projectsRef, where('clientId', '==', userId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.log('No existing projects to delete');
      return 0;
    }

    console.log(`Deleting ${snapshot.size} existing projects for user:`, userId);

    const batch = writeBatch(db);
    snapshot.forEach((document) => {
      batch.delete(doc(db, 'projects', document.id));
    });

    await batch.commit();
    console.log(`Successfully deleted ${snapshot.size} projects`);
    return snapshot.size;
  } catch (error) {
    console.error('Error deleting sample projects:', error);
    return 0;
  }
};

/**
 * Delete all sample invitations for a user
 * @param {string} userId - The user's ID
 * @returns {Promise<number>} - Number of deleted invitations
 */
export const deleteSampleInvitations = async (userId) => {
  try {
    if (!userId) {
      console.error('Cannot delete sample invitations: No user ID provided');
      return 0;
    }

    const invitesRef = collection(db, 'projectInvites');
    const q = query(invitesRef, where('inviteeId', '==', userId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.log('No existing invitations to delete');
      return 0;
    }

    console.log(`Deleting ${snapshot.size} existing invitations for user:`, userId);

    const batch = writeBatch(db);
    snapshot.forEach((document) => {
      batch.delete(doc(db, 'projectInvites', document.id));
    });

    await batch.commit();
    console.log(`Successfully deleted ${snapshot.size} invitations`);
    return snapshot.size;
  } catch (error) {
    console.error('Error deleting sample invitations:', error);
    return 0;
  }
};

/**
 * Clear all sample data and create fresh samples
 * @param {string} userId - The user's ID
 * @returns {Promise<{success: boolean, projects: string[], invitations: string[]}>}
 */
export const clearAndCreateSampleData = async (userId) => {
  try {
    if (!userId) {
      console.error('Cannot create sample data: No user ID provided');
      return { success: false, projects: [], invitations: [] };
    }

    console.log('🔄 Starting complete refresh of sample data for user:', userId);

    // Delete existing data first
    await deleteSampleProjects(userId);
    await deleteSampleInvitations(userId);

    // Create fresh sample data
    const projectIds = await createSampleProjects(userId);
    const invitationIds = await createSampleInvitations(userId);

    console.log('✅ Sample data refresh complete:', {
      projects: projectIds?.length || 0,
      invitations: invitationIds?.length || 0
    });

    return {
      success: true,
      projects: projectIds || [],
      invitations: invitationIds || []
    };
  } catch (error) {
    console.error('Error refreshing sample data:', error);
    return { success: false, projects: [], invitations: [], error: error.message };
  }
};

export { sampleProjects, sampleInvitations };
import { db } from './config';
import { collection, getDocs, query, where, addDoc, writeBatch, doc } from 'firebase/firestore';

// Sample subcontractor data
const sampleSubcontractors = [
  {
    companyName: "Elite Plumbing Solutions",
    description: "Professional plumbing services with over 15 years of experience in residential and commercial projects. Specializing in new installations, repairs, and emergency services.",
    trades: ["Plumbing"],
    serviceAreas: ["New York, NY", "Jersey City, NJ", "Newark, NJ"],
    rating: 4.8,
    contactEmail: "info@eliteplumbing.example.com",
    contactPhone: "(212) 555-1234",
    website: "www.eliteplumbing.example.com",
    yearsInBusiness: 15,
    employeeCount: 12,
    licenseNumber: "NYC-PL-12345",
    insuranceProvider: "SafeGuard Insurance",
    logoUrl: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80",
    portfolioProjects: [
      { title: "Luxury Condo Renovation", description: "Complete plumbing system overhaul for 25-unit luxury condo building" },
      { title: "Restaurant Plumbing Installation", description: "New plumbing system for upscale restaurant in Manhattan" }
    ]
  },
  {
    companyName: "Precision Electric Co.",
    description: "Licensed electrical contractors providing comprehensive electrical services for residential and commercial properties. From simple repairs to complete rewiring projects.",
    trades: ["Electrical"],
    serviceAreas: ["Los Angeles, CA", "Long Beach, CA", "Santa Monica, CA"],
    rating: 4.9,
    contactEmail: "service@precisionelectric.example.com",
    contactPhone: "(310) 555-6789",
    website: "www.precisionelectric.example.com",
    yearsInBusiness: 8,
    employeeCount: 15,
    licenseNumber: "CA-EL-78901",
    insuranceProvider: "ElectraSure Insurance",
    logoUrl: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80",
    portfolioProjects: [
      { title: "Office Building Rewiring", description: "Complete electrical system upgrade for 10-story office building" },
      { title: "Smart Home Installation", description: "Full smart home electrical system for luxury residence" }
    ]
  },
  {
    companyName: "Mastercraft Carpentry",
    description: "Expert carpentry services for custom woodwork, cabinetry, and structural framing. Our skilled craftsmen bring precision and artistry to every project.",
    trades: ["Carpentry", "Woodworking"],
    serviceAreas: ["Chicago, IL", "Evanston, IL", "Oak Park, IL"],
    rating: 4.7,
    contactEmail: "projects@mastercraftcarpentry.example.com",
    contactPhone: "(773) 555-4321",
    website: "www.mastercraftcarpentry.example.com",
    yearsInBusiness: 12,
    employeeCount: 8,
    licenseNumber: "IL-CAR-56789",
    insuranceProvider: "BuilderShield Insurance",
    logoUrl: "https://images.unsplash.com/photo-1601058268499-e52e4cea2a6b?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80",
    portfolioProjects: [
      { title: "Custom Kitchen Renovation", description: "Handcrafted cabinetry and woodwork for luxury home kitchen" },
      { title: "Historic Building Restoration", description: "Restoration of wooden elements in 19th century landmark building" }
    ]
  },
  {
    companyName: "Sunshine Painting Pros",
    description: "Professional painting services for interior and exterior projects. We use premium materials and techniques to deliver flawless results that last.",
    trades: ["Painting"],
    serviceAreas: ["Houston, TX", "Sugar Land, TX", "Katy, TX"],
    rating: 4.6,
    contactEmail: "hello@sunshinepaintingpros.example.com",
    contactPhone: "(832) 555-8765",
    website: "www.sunshinepaintingpros.example.com",
    yearsInBusiness: 6,
    employeeCount: 10,
    licenseNumber: "TX-PT-34567",
    insuranceProvider: "ColorGuard Insurance",
    logoUrl: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80",
    portfolioProjects: [
      { title: "Commercial Office Complex", description: "Interior and exterior painting for 5-building office complex" },
      { title: "Historic Home Restoration", description: "Period-accurate painting restoration for 1920s mansion" }
    ]
  },
  {
    companyName: "Cool Comfort HVAC",
    description: "Full-service heating, ventilation, and air conditioning solutions. We specialize in installation, maintenance, and repair of all HVAC systems.",
    trades: ["HVAC"],
    serviceAreas: ["Phoenix, AZ", "Scottsdale, AZ", "Tempe, AZ"],
    rating: 4.9,
    contactEmail: "service@coolcomfort.example.com",
    contactPhone: "(602) 555-2345",
    website: "www.coolcomfort.example.com",
    yearsInBusiness: 10,
    employeeCount: 18,
    licenseNumber: "AZ-HVAC-90123",
    insuranceProvider: "TempControl Insurance",
    logoUrl: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80",
    portfolioProjects: [
      { title: "Hospital HVAC Upgrade", description: "Complete HVAC system replacement for regional hospital" },
      { title: "Energy-Efficient Home Systems", description: "Installation of energy-efficient HVAC systems in luxury home development" }
    ]
  },
  {
    companyName: "Summit Roofing Experts",
    description: "Professional roofing services including installation, repair, and maintenance. We work with all roofing materials and provide long-lasting solutions.",
    trades: ["Roofing"],
    serviceAreas: ["Philadelphia, PA", "Camden, NJ", "Wilmington, DE"],
    rating: 4.7,
    contactEmail: "info@summitroofing.example.com",
    contactPhone: "(215) 555-9876",
    website: "www.summitroofing.example.com",
    yearsInBusiness: 14,
    employeeCount: 22,
    licenseNumber: "PA-RF-45678",
    insuranceProvider: "RoofGuard Insurance",
    logoUrl: "https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80",
    portfolioProjects: [
      { title: "Apartment Complex Re-Roofing", description: "Complete roof replacement for 200-unit apartment complex" },
      { title: "Historic Church Restoration", description: "Slate roof restoration for 19th century church" }
    ]
  },
  {
    companyName: "Green Thumb Landscaping",
    description: "Complete landscaping services from design to installation and maintenance. We create beautiful outdoor spaces that enhance your property's value and appeal.",
    trades: ["Landscaping"],
    serviceAreas: ["San Antonio, TX", "Austin, TX", "New Braunfels, TX"],
    rating: 4.8,
    contactEmail: "design@greenthumb.example.com",
    contactPhone: "(210) 555-3456",
    website: "www.greenthumb.example.com",
    yearsInBusiness: 9,
    employeeCount: 14,
    licenseNumber: "TX-LS-67890",
    insuranceProvider: "GardenSafe Insurance",
    logoUrl: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80",
    portfolioProjects: [
      { title: "Corporate Campus Redesign", description: "Complete landscaping redesign for 5-acre corporate campus" },
      { title: "Luxury Estate Gardens", description: "Design and installation of formal gardens for luxury estate" }
    ]
  },
  {
    companyName: "Solid Foundation Masonry",
    description: "Expert masonry services for residential and commercial projects. We specialize in brick, stone, and concrete work with attention to detail and craftsmanship.",
    trades: ["Masonry"],
    serviceAreas: ["San Diego, CA", "La Jolla, CA", "Chula Vista, CA"],
    rating: 4.6,
    contactEmail: "projects@solidfoundation.example.com",
    contactPhone: "(619) 555-7654",
    website: "www.solidfoundation.example.com",
    yearsInBusiness: 11,
    employeeCount: 9,
    licenseNumber: "CA-MS-23456",
    insuranceProvider: "MasonGuard Insurance",
    logoUrl: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80",
    portfolioProjects: [
      { title: "Waterfront Retaining Wall", description: "Construction of 500-foot stone retaining wall for waterfront property" },
      { title: "Custom Brick Home", description: "Masonry work for custom brick home with decorative elements" }
    ]
  },
  {
    companyName: "Smooth Finish Drywall",
    description: "Professional drywall installation, finishing, and repair services. Our experienced team delivers flawless results for walls and ceilings.",
    trades: ["Drywall"],
    serviceAreas: ["New York, NY", "Brooklyn, NY", "Queens, NY"],
    rating: 4.5,
    contactEmail: "service@smoothfinish.example.com",
    contactPhone: "(347) 555-8901",
    website: "www.smoothfinish.example.com",
    yearsInBusiness: 7,
    employeeCount: 12,
    licenseNumber: "NYC-DW-78901",
    insuranceProvider: "WallSafe Insurance",
    logoUrl: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80",
    portfolioProjects: [
      { title: "High-Rise Apartment Renovation", description: "Complete drywall renovation for 30-story apartment building" },
      { title: "Custom Home Theater", description: "Specialized acoustic drywall installation for home theater" }
    ]
  },
  {
    companyName: "Premium Floors & More",
    description: "Comprehensive flooring services including hardwood, tile, laminate, and carpet. We handle everything from selection to installation with expert craftsmanship.",
    trades: ["Flooring"],
    serviceAreas: ["Los Angeles, CA", "Beverly Hills, CA", "Santa Monica, CA"],
    rating: 4.8,
    contactEmail: "info@premiumfloors.example.com",
    contactPhone: "(310) 555-2345",
    website: "www.premiumfloors.example.com",
    yearsInBusiness: 13,
    employeeCount: 15,
    licenseNumber: "CA-FL-12345",
    insuranceProvider: "FloorGuard Insurance",
    logoUrl: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80",
    portfolioProjects: [
      { title: "Luxury Hotel Renovation", description: "Hardwood and marble flooring installation for 5-star hotel" },
      { title: "Historic Theater Restoration", description: "Restoration of original wood flooring in historic theater" }
    ]
  }
];

/**
 * Check if subcontractors already exist for the user
 * @param {string} userId - The current user's ID
 * @returns {Promise<boolean>} - Whether subcontractors exist
 */
export const checkIfSubcontractorsExist = async (userId) => {
  try {
    const subcontractorsRef = collection(db, 'subcontractors');
    const q = query(subcontractorsRef, where('createdBy', '==', userId));
    const snapshot = await getDocs(q);

    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking if subcontractors exist:', error);
    return false;
  }
};

/**
 * Create sample subcontractors in the database
 * @param {string} userId - The current user's ID
 * @returns {Promise<void>}
 */
export const createSampleSubcontractors = async (userId) => {
  try {
    // Check if subcontractors already exist
    const subcontractorsExist = await checkIfSubcontractorsExist(userId);

    if (subcontractorsExist) {
      console.log('Sample subcontractors already exist for this user');
      return;
    }

    console.log('Creating sample subcontractors...');

    // Use a batch write for better performance
    const batch = writeBatch(db);
    const subcontractorsRef = collection(db, 'subcontractors');

    // Add each sample subcontractor to the batch
    sampleSubcontractors.forEach((subcontractor) => {
      const newSubcontractorRef = doc(subcontractorsRef);
      batch.set(newSubcontractorRef, {
        ...subcontractor,
        createdBy: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    });

    // Commit the batch
    await batch.commit();
    console.log('Successfully created sample subcontractors');
  } catch (error) {
    console.error('Error creating sample subcontractors:', error);
    throw error;
  }
};

/**
 * Get a single sample subcontractor by index
 * @param {number} index - The index of the subcontractor to get
 * @returns {Object} - The sample subcontractor
 */
export const getSampleSubcontractor = (index = 0) => {
  return sampleSubcontractors[index % sampleSubcontractors.length];
};

export default sampleSubcontractors;
import axios from 'axios';
import { auth } from '../firebase/config';

// Determine the API base URL based on the environment
const getBaseUrl = () => {
  // Firebase hosting URL format: https://handypro-a58a7.web.app
  // Firebase functions URL format: https://us-central1-handypro-a58a7.cloudfunctions.net

  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return '/api'; // Use local proxy in development
  } else {
    // Extract project ID from hostname for production
    let projectId = 'handypro-a58a7'; // Default project ID

    // Try to extract from Firebase hosting domain if possible
    const hostnameParts = window.location.hostname.split('.');
    if (hostnameParts[0] !== 'us-central1' && hostnameParts.length >= 2) {
      // It's a Firebase hosting URL like handypro-a58a7.web.app
      projectId = hostnameParts[0];
    } else if (hostnameParts[0] === 'us-central1' && hostnameParts.length >= 2) {
      // It's a Firebase functions URL
      projectId = hostnameParts[1].split('-')[0];
    }

    return `https://us-central1-${projectId}.cloudfunctions.net`;
  }
};

// Create a base axios instance with dynamic baseURL
const apiClient = axios.create({
  baseURL: getBaseUrl()
});

// Add an interceptor to handle authentication for all requests
apiClient.interceptors.request.use(async (config) => {
  try {
    if (auth.currentUser) {
      const token = await auth.currentUser.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error('Auth error in interceptor:', error);
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Add an interceptor to handle and log response errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log detailed API errors
    if (error.response) {
      console.error('API Error Response:', {
        status: error.response.status,
        data: error.response.data,
        endpoint: error.config.url,
        method: error.config.method
      });
    } else if (error.request) {
      console.error('API Request Error (No Response):', error.request);
    } else {
      console.error('API Config Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Original addAuthToRequest function - kept for backward compatibility
export const addAuthToRequest = async (config) => {
  try {
    if (auth.currentUser) {
      const token = await auth.currentUser.getIdToken();
      return {
        ...config,
        headers: {
          ...config.headers,
          Authorization: `Bearer ${token}`
        }
      };
    }
  } catch (error) {
    console.error('Auth error:', error);
  }
  return config;
};

export { apiClient };

// Helper function for form data submissions
export const createFormDataRequest = (data, files) => {
  const formData = new FormData();

  // Add regular data fields
  Object.keys(data).forEach(key => {
    formData.append(key, data[key]);
  });

  // Add files if any
  if (files) {
    Object.keys(files).forEach(key => {
      if (Array.isArray(files[key])) {
        files[key].forEach(file => {
          formData.append(key, file);
        });
      } else {
        formData.append(key, files[key]);
      }
    });
  }

  return formData;
};

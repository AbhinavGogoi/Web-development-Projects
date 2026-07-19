// Use VITE_API_URL if it exists in the environment (for production/deployment)
// Otherwise, fall back to the local backend URL for development
export const SERVER_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : 'https://web-development-projects-kfth.onrender.com');
export const API_BASE = `${SERVER_URL}/api`;

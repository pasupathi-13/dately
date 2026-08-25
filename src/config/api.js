export const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ||
  (typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:5000'
    : 'https://dately-g62m.onrender.com');

export const API_URL = `${BACKEND_URL}/api`;
export default API_URL;

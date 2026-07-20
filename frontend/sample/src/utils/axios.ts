import axios from 'axios';

const api = axios.create({
  // No baseURL — all requests use relative paths so they go through the Vite dev proxy.
  // The Vite proxy forwards /api/* and /login/* to http://127.0.0.1:5001
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
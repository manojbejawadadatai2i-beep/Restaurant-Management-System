import axios from 'axios';

const api = axios.create({
  // No baseURL — all requests use relative paths routed through the Vite dev proxy.
  // Vite proxy routes: /api/* and /login/* -> http://127.0.0.1:5001 (Express)
  //                    /chat/*             -> http://127.0.0.1:8000 (FastAPI)
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
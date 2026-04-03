// client/src/api/axios.js
// ─── Central Axios instance — automatically attaches JWT token ────────────────

import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api", // your backend URL
  headers: { "Content-Type": "application/json" },
});

// ── Request interceptor: attach token to every request ────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: handle 401 globally ─────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear storage and redirect to login
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;

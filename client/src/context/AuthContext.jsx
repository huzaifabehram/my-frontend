// src/context/AuthContext.jsx
import React, { createContext, useContext, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config/apiBase";

const AuthContext = createContext(null);

const BASE_URL = API_BASE_URL;

// ── Axios instance — shared across the whole app ──────────────────────────────
// InstructorDashboard and Shopify.jsx import this as:
// import API from "../services/api" ← from services/api.js
// const { API: api } = useAuth() ← from context (kept for compat)
export const API = axios.create({ baseURL: BASE_URL });

// Attach token to every request automatically
API.interceptors.request.use((config) => {
const token = localStorage.getItem("token");
if (token) config.headers.Authorization = `Bearer ${token}`;
return config;
});

// Reads the saved session straight out of localStorage. This is instant (no
// network), so it's done ONCE, synchronously, when the provider is created.
function readSavedUser() {
  try {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    if (savedToken && savedUser) return JSON.parse(savedUser);
  } catch {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTH PROVIDER
// ─────────────────────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
// FIX: the saved session used to be restored in a useEffect, with `loading`
// starting as true. That made every refresh of a portal / instructor / admin
// page begin with a full-screen grey spinner (ProtectedRoute waiting for
// `loading` to flip) even though there was nothing to wait for — the session
// lives in localStorage, not on a server. Restoring it up front means the
// dashboard renders on the very first frame.
const [user, setUser] = useState(readSavedUser);
const loading = false; // kept in the context value so existing `const { loading } = useAuth()` code keeps working

// ── Register ──────────────────────────────────────────────────────────────
const register = async (name, email, password, role) => {
const res = await axios.post(`${BASE_URL}/auth/register`, { name, email, password, role });
const { token, user } = res.data;
saveSession(token, user);
return user;
};

// ── Login ─────────────────────────────────────────────────────────────────
const login = async (email, password) => {
const res = await axios.post(`${BASE_URL}/auth/login`, { email, password });
const { token, user } = res.data;
saveSession(token, user);
return user;
};

// ── Logout ────────────────────────────────────────────────────────────────
const logout = () => {
localStorage.removeItem("token");
localStorage.removeItem("user");
setUser(null);
};

// ── Update profile (used by InstructorDashboard ProfilePage) ─────────────
const updateProfile = async (data) => {
  const res = await API.put("/users/profile", data);
  const updated = res.data;
  const merged = { ...user, ...updated };
  localStorage.setItem("user", JSON.stringify(merged));
  setUser(merged);
  return updated;
};

const saveSession = (token, user) => {
localStorage.setItem("token", token);
localStorage.setItem("user", JSON.stringify(user));
setUser(user);
};

const value = {
user,
loading,
isLoggedIn: !!user,
isStudent: user?.role === "student",
isInstructor: user?.role === "instructor",
login,
logout,
register,
updateProfile,
API, // ← keeps InstructorDashboard's { API: api } = useAuth() working
};

return (
<AuthContext.Provider value={value}>
{children}
</AuthContext.Provider>
);
}

export function useAuth() {
const context = useContext(AuthContext);
if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
return context;
}
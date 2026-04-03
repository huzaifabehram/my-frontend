// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext(null);

const BASE_URL = "https://my-course-backend-8u69.onrender.com/api";

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

// ─────────────────────────────────────────────────────────────────────────────
// AUTH PROVIDER
// ─────────────────────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
const [user, setUser] = useState(null);
const [loading, setLoading] = useState(true);

// Restore session on app start
useEffect(() => {
try {
const savedToken = localStorage.getItem("token");
const savedUser = localStorage.getItem("user");
if (savedToken && savedUser) {
const parsed = JSON.parse(savedUser);
setUser(parsed);
}
} catch {
localStorage.removeItem("token");
localStorage.removeItem("user");
} finally {
setLoading(false);
}
}, []);

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

// ── Update profile (used by ProfileTab) ───────────────────────────────────
const updateProfile = async (data) => {
const res = await API.patch("/auth/profile", data);
const updated = { ...user, ...res.data };
localStorage.setItem("user", JSON.stringify(updated));
setUser(updated);
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
// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import AuthPage            from "./Pages/AuthPages";
import Shopify             from "./Pages/Shopify";
import Portals             from "./Pages/Portals";
import InstructorDashboard from "./Pages/InstructorDashboard";

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/auth" replace />;
  if (role && user.role !== role)
    return <Navigate to={user.role === "instructor" ? "/instructor" : "/portal"} replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* ── PUBLIC ─────────────────────────────────────────────────────── */}
      {/* Landing: shows all published courses (no login required) */}
      <Route path="/"           element={<Shopify />} />
      <Route path="/courses"    element={<Shopify />} />
      {/* Single course detail (no login required to view) */}
      <Route path="/course/:id" element={<Shopify />} />
      {/* Auth */}
      <Route path="/auth"          element={<AuthPage mode="login"    />} />
      <Route path="/auth/login"    element={<AuthPage mode="login"    />} />
      <Route path="/auth/register" element={<AuthPage mode="register" />} />
      <Route path="/login"         element={<AuthPage mode="login"    />} />
      <Route path="/register"      element={<AuthPage mode="register" />} />

      {/* ── PROTECTED ──────────────────────────────────────────────────── */}
      <Route path="/portal/*" element={<ProtectedRoute role="student"><Portals /></ProtectedRoute>} />
      <Route path="/instructor/*" element={<ProtectedRoute role="instructor"><InstructorDashboard /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
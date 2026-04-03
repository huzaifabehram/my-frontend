// client/src/components/Protectedroutes.jsx
// ─── Wrappers that guard routes based on auth + role ─────────────────────────

import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// ── Loading spinner shown while auth state is being restored ──────────────────
function LoadingScreen() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#f9fafb",
      flexDirection: "column",
      gap: "12px",
    }}>
      <div style={{
        width: 40, height: 40, border: "4px solid #e5e7eb",
        borderTop: "4px solid #a435f0", borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }}/>
      <p style={{ color: "#6b7280", fontSize: 14 }}>Loading...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── ProtectedRoute: user must be logged in ────────────────────────────────────
export function Protectedroutes({ children }) {
  const { isLoggedIn, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!isLoggedIn) return <Navigate to="/login" replace />;

  return children;
}

// ── StudentRoute: user must be logged in AND be a student ─────────────────────
export function StudentRoute({ children }) {
  const { isLoggedIn, isStudent, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (!isStudent) return <Navigate to="/instructor" replace />;

  return children;
}

// ── InstructorRoute: user must be logged in AND be an instructor ──────────────
export function InstructorRoute({ children }) {
  const { isLoggedIn, isInstructor, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (!isInstructor) return <Navigate to="/portals" replace />;

  return children;
}

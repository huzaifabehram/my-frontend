// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth }  from "./context/AuthContext";
import { CoursesProvider }        from "./context/CoursesContext";
import AuthPage                   from "./Pages/AuthPages";
import Shopify                    from "./Pages/Shopify";
import CoursesPage                from "./Pages/CoursesPage";
import Portals                    from "./Pages/Portals";
import InstructorDashboard        from "./Pages/InstructorDashboard";

// ─── Error boundary: shows a readable message instead of a blank screen ───────
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(err) { return { error: err }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, fontFamily: "monospace", color: "#c00" }}>
          <h2>🚨 App crashed — check the console</h2>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: 13 }}>
            {this.state.error?.message}
            {"\n\n"}
            {this.state.error?.stack}
          </pre>
          <button onClick={() => this.setState({ error: null })}
            style={{ marginTop: 16, padding: "8px 16px", cursor: "pointer" }}>
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Screens ──────────────────────────────────────────────────────────────────
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
  if (!user)   return <Navigate to="/auth/login" replace />;
  if (role && user.role !== role)
    return <Navigate to={user.role === "instructor" ? "/instructor" : "/portal"} replace />;
  return children;
}

// ─── Routes ───────────────────────────────────────────────────────────────────
function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/"           element={<Shopify />} />
      <Route path="/courses"    element={<CoursesPage />} />
      <Route path="/course/:id" element={<Shopify />} />

      {/* Auth */}
      <Route path="/auth"          element={<Navigate to="/auth/login" replace />} />
      <Route path="/auth/login"    element={<AuthPage mode="login"    />} />
      <Route path="/auth/register" element={<AuthPage mode="register" />} />
      <Route path="/login"         element={<Navigate to="/auth/login"    replace />} />
      <Route path="/register"      element={<Navigate to="/auth/register" replace />} />

      {/* Protected */}
      <Route path="/portal/*" element={
        <ProtectedRoute role="student"><Portals /></ProtectedRoute>
      }/>
      <Route path="/instructor/*" element={
        <ProtectedRoute role="instructor"><InstructorDashboard /></ProtectedRoute>
      }/>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <CoursesProvider>
            <AppRoutes />
          </CoursesProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
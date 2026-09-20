// src/App.jsx
//
// CHANGES FROM YOUR VERSION (only these two):
//   1. "/" now renders <HomePage /> instead of <Shopify />. Shopify.jsx is
//      the course landing page — it still owns /course/:id — but "/" was
//      just falling back to it for lack of a real home page. Now that
//      HomePage.jsx exists, it takes over "/".
//   2. Added "/services" → <ServicesPage />, grouped with the other public
//      routes.
// Nothing else below is changed — same ErrorBoundary, MetaPixelRouteTracker,
// ProtectedRoute, and every other route exactly as you had them.
import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth }  from "./context/AuthContext";
import { CoursesProvider }        from "./context/CoursesContext";
import AuthPage                   from "./Pages/AuthPages";
import Shopify                    from "./Pages/Shopify";
import HomePage                   from "./Pages/Homepage";
import ServicesPage               from "./Pages/Servicespage";
import CoursesPage                from "./Pages/CoursesPage";
import EnrolledPage               from "./Pages/EnrolledPage";
import ThankYouPage                from "./Pages/ThankYouPage";
import AboutPage                  from "./Pages/AboutPage";
import PrivacyPolicyPage          from "./Pages/PrivacyPolicyPage";
import ReturnPolicyPage           from "./Pages/ReturnPolicyPage";
import ContactUsPage              from "./Pages/ContactUsPage";
import Portals                    from "./Pages/Portals";
import InstructorDashboard        from "./Pages/InstructorDashboard";
import SuperAdminsDashboard        from "./Pages/SuperAdminsDashboard";
import MetaPixelRouteTracker      from "./components/MetaPixelRouteTracker";
import ScrollToTop                from "./components/ScrollToTop";

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

// ─── Route transition bar ───────────────────────────────────────────────────
// NEW: a thin, branded-orange progress bar at the very top of the screen
// that briefly runs on every page navigation. This doesn't touch the
// browser's own native loading bar (that only shows on a hard refresh/first
// load — fixing THAT needs public/index.html, which isn't available here
// yet) — this covers the other half of the complaint: clicking between
// pages inside the app going straight to blank/skeleton content with no
// visual transition at all. The `key` on the wrapper forces React to
// remount it on every route change, which is what makes the CSS animation
// restart reliably every single time instead of only playing once.
function RouteProgressBar() {
  const location = useLocation();
  return (
    <div key={location.pathname + location.search} style={{ position: "fixed", top: 0, left: 0, right: 0, height: 3, zIndex: 9999, pointerEvents: "none" }}>
      <div style={{ height: "100%", background: "#e8540a", width: "0%", animation: "lerni-route-progress 550ms ease-out forwards" }} />
      <style>{`
        @keyframes lerni-route-progress {
          0%   { width: 0%;  opacity: 1; }
          60%  { width: 80%; opacity: 1; }
          100% { width: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
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
    return <Navigate to={
      user.role === "admin" ? "/superadmin"
      : user.role === "instructor" ? "/instructor"
      : "/portal"
    } replace />;
  return children;
}

// ─── Routes ───────────────────────────────────────────────────────────────────
function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/"                element={<HomePage />} />
      <Route path="/services"        element={<ServicesPage />} />
      <Route path="/courses"         element={<CoursesPage />} />
      <Route path="/course/:id"      element={<Shopify />} />
      {/* Enrollment must stay public (not behind ProtectedRoute) — guests who
          aren't logged in yet still need to reach this page from "Enroll Now".
          It sends them on to /auth/register itself once both steps are filled in. */}
      <Route path="/course/:id/enroll" element={<EnrolledPage />} />
      {/* Also public — reached after Confirm Enrollment, for both guests
          (via the /auth/register redirect) and already-logged-in students. */}
      <Route path="/thank-you" element={<ThankYouPage />} />

      {/* Footer pages — About / Policies / Contact Us */}
      <Route path="/about"           element={<AboutPage />} />
      <Route path="/privacy-policy"  element={<PrivacyPolicyPage />} />
      <Route path="/return-policy"   element={<ReturnPolicyPage />} />
      <Route path="/contact-us"      element={<ContactUsPage />} />

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
      <Route path="/superadmin/*" element={
        <ProtectedRoute role="admin"><SuperAdminsDashboard /></ProtectedRoute>
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
        <RouteProgressBar />
        <ScrollToTop />
        <MetaPixelRouteTracker />
        <AuthProvider>
          <CoursesProvider>
            <AppRoutes />
          </CoursesProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
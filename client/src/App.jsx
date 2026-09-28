// src/App.jsx
//
// CHANGES FROM YOUR VERSION:
//   1. The three heavy, login-only areas — Student Portal, Instructor
//      Dashboard, Super Admin Dashboard — are now loaded on demand
//      (React.lazy) instead of being packed into the one JavaScript file every
//      visitor downloads. They are by far the biggest parts of the app (charts,
//      the workflow editor, the WhatsApp screens…), and a visitor reading a
//      course page never needs them. Public pages (Home, Services, Courses,
//      the course page, Enrollment, About…) stay in the main bundle on purpose,
//      so moving between them is instant with nothing to wait for.
//   2. One global progress line (GlobalProgressBar) replaces RouteProgressBar.
//      It runs on every page change AND for as long as anything is genuinely
//      still loading (a lazy page, a course being fetched for the first time)
//      — see utils/pageProgress.js.
//   3. The grey/indigo "LoadingScreen" is gone. While a lazy page loads you now
//      see the site's own header (with the logo) on the cream page background,
//      not a blank grey screen.
//   4. The router opts in to React's startTransition (future flag below), so
//      going to a page that has to load keeps the CURRENT page on screen until
//      the next one is ready, instead of blanking. (Needs react-router-dom
//      6.13+; on an older version the flag is simply ignored and the branded
//      loader above shows for that moment instead.)
//   5. Once someone is logged in, their dashboard is downloaded quietly in the
//      background during idle time (RolePrefetch), so opening it is instant.
// Everything else — ErrorBoundary, MetaPixelRouteTracker, ScrollToTop,
// ProtectedRoute and every route — is exactly as you had it.
import React, { lazy, Suspense, useEffect, useState, useSyncExternalStore } from "react";
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
import PackageInquiryPage         from "./Pages/PackageInquiryPage";
import MetaPixelRouteTracker      from "./components/MetaPixelRouteTracker";
import ScrollToTop                from "./components/ScrollToTop";
import { beginProgress, subscribeProgress, isProgressActive } from "./utils/pageProgress";

// ─── Login-only areas, loaded on demand ───────────────────────────────────────
const loadPortals             = () => import("./Pages/Portals");
const loadInstructorDashboard = () => import("./Pages/InstructorDashboard");
const loadSuperAdminDashboard = () => import("./Pages/SuperAdminsDashboard");
const Portals              = lazy(loadPortals);
const InstructorDashboard  = lazy(loadInstructorDashboard);
const SuperAdminsDashboard = lazy(loadSuperAdminDashboard);

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

// ─── Global progress line ─────────────────────────────────────────────────────
// A thin orange line across the very top of the screen. It runs briefly on every
// page change, and stays running for as long as anything else has told
// utils/pageProgress.js it is still loading. It creeps forward by itself (never
// quite reaching the end while something is still pending) and then completes —
// so on a slow connection there's always visible progress instead of a dead,
// blank screen.
function GlobalProgressBar() {
  const location = useLocation();
  const active = useSyncExternalStore(subscribeProgress, isProgressActive);
  const [width, setWidth] = useState(0);
  const [visible, setVisible] = useState(false);

  // Every page change gets a short run of the line, even when nothing is slow.
  useEffect(() => {
    const done = beginProgress();
    const t = setTimeout(done, 450);
    return () => { clearTimeout(t); done(); };
  }, [location.pathname]);

  useEffect(() => {
    let tick = null;
    let hide = null;
    if (active) {
      setVisible(true);
      setWidth((w) => (w > 0 && w < 90 ? w : 8));
      tick = setInterval(() => setWidth((w) => (w < 90 ? w + (90 - w) * 0.12 : w)), 200);
    } else {
      setWidth(100);
      hide = setTimeout(() => { setVisible(false); setWidth(0); }, 350);
    }
    return () => { if (tick) clearInterval(tick); if (hide) clearTimeout(hide); };
  }, [active]);

  if (!visible) return null;
  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 3, zIndex: 10001, pointerEvents: "none" }}>
      <div style={{ height: "100%", background: "#e8540a", width: `${width}%`, transition: "width .2s ease-out", boxShadow: "0 0 8px rgba(232,84,10,.6)" }} />
    </div>
  );
}

// ─── Loader shown while a lazy page is being fetched ──────────────────────────
// The site's header bar (real logo from the cache) on the cream page colour —
// the same thing index.html paints before the app starts, so the two look like
// one continuous page rather than white → grey → page.
function PageLoader() {
  useEffect(() => beginProgress(), []);
  let logo = "";
  try { logo = localStorage.getItem("lerni_header_logo_url") || ""; } catch { /* no cache */ }
  return (
    <div className="min-h-screen w-full bg-[#FDFAF6]">
      <div className="bg-white border-b border-[#ece6dd] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-3 md:py-4 flex items-center justify-center lg:justify-start">
          {logo
            ? <img src={logo} alt="" className="h-14 md:h-16 lg:h-20 w-auto object-contain" />
            : <span className="inline-block h-14 md:h-16 lg:h-20 w-24" aria-hidden="true" />}
        </div>
      </div>
    </div>
  );
}

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user)   return <Navigate to="/auth/login" replace />;
  if (role && user.role !== role)
    return <Navigate to={
      user.role === "admin" ? "/superadmin"
      : user.role === "instructor" ? "/instructor"
      : "/portal"
    } replace />;
  return children;
}

// Once someone is logged in, quietly download their dashboard while the
// browser is idle — so when they open it, there is nothing left to fetch.
function RolePrefetch() {
  const { user } = useAuth();
  const role = user?.role;
  useEffect(() => {
    if (!role) return undefined;
    const run = () => {
      if (role === "instructor") loadInstructorDashboard();
      else if (role === "admin") loadSuperAdminDashboard();
      else if (role === "student") loadPortals();
    };
    if (typeof window.requestIdleCallback === "function") {
      const handle = window.requestIdleCallback(run, { timeout: 4000 });
      return () => window.cancelIdleCallback && window.cancelIdleCallback(handle);
    }
    const t = setTimeout(run, 2000);
    return () => clearTimeout(t);
  }, [role]);
  return null;
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
      <Route path="/get-package"     element={<PackageInquiryPage />} />

      {/* Auth */}
      <Route path="/auth"          element={<Navigate to="/auth/login" replace />} />
      <Route path="/auth/login"    element={<AuthPage mode="login"    />} />
      <Route path="/auth/register" element={<AuthPage mode="register" />} />
      <Route path="/login"         element={<Navigate to="/auth/login"    replace />} />
      <Route path="/register"      element={<Navigate to="/auth/register" replace />} />

      {/* Protected — these three are loaded on demand (see the top of this file) */}
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
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <GlobalProgressBar />
        <ScrollToTop />
        <MetaPixelRouteTracker />
        <AuthProvider>
          <CoursesProvider>
            <RolePrefetch />
            <Suspense fallback={<PageLoader />}>
              <AppRoutes />
            </Suspense>
          </CoursesProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
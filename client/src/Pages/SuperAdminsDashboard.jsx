// client/src/Pages/SuperAdminDashboard.jsx
// ─────────────────────────────────────────────────────────────────────────────
// SUPER ADMIN PANEL
// Reachable at /superadmin/* once role-based redirect is added to the login
// flow (see AuthPages.jsx / Login.jsx — one line each, noted in the setup
// instructions). Guard this route itself at the router level so only
// user.role === 'admin' can reach it — see SUPERADMIN_SETUP.md.
//
// Three things this panel is built around, per the brief:
//   1. Students   — every student across every course, with suspend/reactivate.
//   2. Instructors — every instructor, their courses/students/revenue, with
//                    suspend/reactivate.
//   3. Verifications — every enrollment submitted from EnrolledPage.jsx's
//                    payment-screenshot step, waiting for approve/reject.
// Plus a lightweight Courses tab (platform-wide moderation) and an Overview.
//
// Visual language intentionally reuses the same primitives (Avatar, Btn,
// Input, StatCard, EmptyState, Toast, Sidebar/TopBar shell) as
// InstructorDashboard.jsx so the product feels like one system — the accent
// colour (amber/gold) is the one deliberate change, signalling "this is the
// authority layer" without inventing a whole new visual identity.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Routes, Route, NavLink, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard, Users, GraduationCap, ClipboardCheck, BookOpen,
  Search, CheckCircle2, XCircle, Clock, ExternalLink, Ban, RotateCcw,
  X, Menu, Eye, MessageCircle, Mail, ShieldCheck, DollarSign, AlertTriangle,
  Palette, History, Plus, Trash2,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// DATA LAYER — inlined here (was a separate hooks/useSuperAdmin.js file) so
// there's a single file to add to the repo and nothing that can go missing
// on deploy. Same shape as InstructorDashboard.jsx's useInstructorCourses:
// same `API: api` axios instance from AuthContext, same load/refetch pattern.
//
// Expects these backend endpoints (see server.js):
//   GET   /admin/stats
//   GET   /admin/students
//   GET   /admin/instructors
//   GET   /admin/enrollments?status=pending|verified|rejected|all
//   GET   /admin/courses
//   PATCH /admin/enrollments/:id/verify
//   PATCH /admin/enrollments/:id/reject      body: { reason }
//   PATCH /admin/users/:id/status            body: { status: 'active'|'suspended' }
//   PATCH /admin/courses/:id/status          body: { status: 'published'|'draft' }
// ─────────────────────────────────────────────────────────────────────────────
function useSuperAdminData() {
  const { API: api } = useAuth();

  const [stats,       setStats]       = useState(null);
  const [students,    setStudents]    = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [courses,     setCourses]     = useState([]);

  const [loading, setLoading] = useState({
    stats: true, students: true, instructors: true, enrollments: true, courses: true,
  });
  const [error, setError] = useState(null);

  const setLoadingKey = (key, val) => setLoading((l) => ({ ...l, [key]: val }));

  const fetchStats = useCallback(async () => {
    setLoadingKey("stats", true);
    try {
      const res = await api.get("/admin/stats");
      setStats(res.data);
    } catch (err) { setError(err); }
    finally { setLoadingKey("stats", false); }
  }, [api]);

  const fetchStudents = useCallback(async () => {
    setLoadingKey("students", true);
    try {
      const res = await api.get("/admin/students");
      setStudents(Array.isArray(res.data) ? res.data : []);
    } catch (err) { setError(err); }
    finally { setLoadingKey("students", false); }
  }, [api]);

  const fetchInstructors = useCallback(async () => {
    setLoadingKey("instructors", true);
    try {
      const res = await api.get("/admin/instructors");
      setInstructors(Array.isArray(res.data) ? res.data : []);
    } catch (err) { setError(err); }
    finally { setLoadingKey("instructors", false); }
  }, [api]);

  const fetchEnrollments = useCallback(async (status = "all") => {
    setLoadingKey("enrollments", true);
    try {
      const qs = status && status !== "all" ? `?status=${status}` : "";
      const res = await api.get(`/admin/enrollments${qs}`);
      setEnrollments(Array.isArray(res.data) ? res.data : []);
    } catch (err) { setError(err); }
    finally { setLoadingKey("enrollments", false); }
  }, [api]);

  const fetchCourses = useCallback(async () => {
    setLoadingKey("courses", true);
    try {
      const res = await api.get("/admin/courses");
      setCourses(Array.isArray(res.data) ? res.data : []);
    } catch (err) { setError(err); }
    finally { setLoadingKey("courses", false); }
  }, [api]);

  // Initial load — enrollments default to "all" so pending/verified/rejected
  // tabs can filter client-side without refetching on every tab switch.
  useEffect(() => {
    fetchStats();
    fetchStudents();
    fetchInstructors();
    fetchEnrollments("all");
    fetchCourses();
  }, [fetchStats, fetchStudents, fetchInstructors, fetchEnrollments, fetchCourses]);

  // ── Mutations ──────────────────────────────────────────────────────────
  const verifyEnrollment = useCallback(async (enrollmentId) => {
    const res = await api.patch(`/admin/enrollments/${enrollmentId}/verify`);
    setEnrollments((prev) => prev.map((e) => (e._id === enrollmentId ? res.data : e)));
    setStats((s) => (s ? { ...s, pendingVerifications: Math.max(0, (s.pendingVerifications || 1) - 1) } : s));
    return res.data;
  }, [api]);

  const rejectEnrollment = useCallback(async (enrollmentId, reason) => {
    const res = await api.patch(`/admin/enrollments/${enrollmentId}/reject`, { reason });
    setEnrollments((prev) => prev.map((e) => (e._id === enrollmentId ? res.data : e)));
    setStats((s) => (s ? { ...s, pendingVerifications: Math.max(0, (s.pendingVerifications || 1) - 1) } : s));
    return res.data;
  }, [api]);

  const setUserStatus = useCallback(async (userId, status) => {
    const res = await api.patch(`/admin/users/${userId}/status`, { status });
    setStudents((prev) => prev.map((s) => (s._id === userId ? { ...s, ...res.data } : s)));
    setInstructors((prev) => prev.map((i) => (i._id === userId ? { ...i, ...res.data } : i)));
    return res.data;
  }, [api]);

  const setCourseStatus = useCallback(async (courseId, status) => {
    const res = await api.patch(`/admin/courses/${courseId}/status`, { status });
    setCourses((prev) => prev.map((c) => (c._id === courseId ? { ...c, ...res.data } : c)));
    return res.data;
  }, [api]);

  return {
    stats, students, instructors, enrollments, courses, loading, error,
    refetch: { fetchStats, fetchStudents, fetchInstructors, fetchEnrollments, fetchCourses },
    verifyEnrollment, rejectEnrollment, setUserStatus, setCourseStatus,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const fmtMoney = (n) =>
  (n ?? 0) >= 1_000_000 ? `$${((n ?? 0) / 1_000_000).toFixed(1)}M`
  : (n ?? 0) >= 1_000   ? `$${((n ?? 0) / 1_000).toFixed(1)}k`
  : `$${n ?? 0}`;

const fmtPKR = (n) => `PKR ${Math.round(n ?? 0).toLocaleString()}`;

const fmtNum = (n) => ((n ?? 0) >= 1000 ? `${((n ?? 0) / 1000).toFixed(1)}k` : `${n ?? 0}`);

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—");

function uid() { return Math.random().toString(36).slice(2, 9); }

// ─────────────────────────────────────────────────────────────────────────────
// SHARED PRIMITIVES (kept local to this file so it can be dropped in as-is)
// ─────────────────────────────────────────────────────────────────────────────

function Avatar({ name = "?", size = 36, src }) {
  const initials = name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  if (src) return <img src={src} alt={name} style={{ width: size, height: size }} className="rounded-full object-cover flex-shrink-0" />;
  return (
    <div style={{ width: size, height: size, fontSize: size * 0.36 }}
      className="rounded-full bg-amber-600 text-white flex items-center justify-center font-bold flex-shrink-0">
      {initials || "?"}
    </div>
  );
}

const USER_STATUS_STYLE = {
  active:    "bg-emerald-100 text-emerald-700",
  suspended: "bg-red-100 text-red-700",
};
function StatusPill({ status }) {
  const s = status || "active";
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${USER_STATUS_STYLE[s] || "bg-gray-100 text-gray-600"}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s === "active" ? "bg-emerald-500" : "bg-red-500"}`} />
      {s.charAt(0).toUpperCase() + s.slice(1)}
    </span>
  );
}

const VERIFY_STATUS_STYLE = {
  pending:  "bg-amber-100 text-amber-700",
  verified: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
};
function VerifyPill({ status }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${VERIFY_STATUS_STYLE[status] || "bg-gray-100 text-gray-600"}`}>
      {status === "pending" && <Clock size={12} />}
      {status === "verified" && <CheckCircle2 size={12} />}
      {status === "rejected" && <XCircle size={12} />}
      {status ? status.charAt(0).toUpperCase() + status.slice(1) : "—"}
    </span>
  );
}

function StatCard({ icon, label, value, sub, color = "amber" }) {
  const bg = { amber: "bg-amber-50", green: "bg-emerald-50", blue: "bg-blue-50", red: "bg-red-50" };
  const ic = { amber: "text-amber-600", green: "text-emerald-600", blue: "text-blue-600", red: "text-red-600" };
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 flex gap-3 sm:gap-4 items-center shadow-sm hover:shadow-md transition-shadow">
      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${bg[color]} flex items-center justify-center flex-shrink-0`}>
        <span className={ic[color]}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-lg sm:text-2xl font-bold text-gray-900 leading-none">{value}</p>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function SectionHeader({ title, action }) {
  return (
    <div className="flex items-center justify-between gap-2 mb-4">
      <h2 className="text-base sm:text-lg font-bold text-gray-900">{title}</h2>
      {action}
    </div>
  );
}

function Btn({ children, onClick, variant = "primary", size = "md", disabled, className = "" }) {
  const base = "inline-flex items-center gap-2 font-semibold rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95";
  const variants = {
    primary:   "bg-amber-600 hover:bg-amber-700 text-white shadow-sm",
    secondary: "bg-white border border-gray-200 hover:bg-gray-50 text-gray-700",
    danger:    "bg-red-50 border border-red-200 hover:bg-red-100 text-red-600",
    ghost:     "hover:bg-gray-100 text-gray-600",
    success:   "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm",
  };
  const sizes = { sm: "px-2.5 sm:px-3 py-1.5 text-xs", md: "px-3 sm:px-4 py-2 text-sm", lg: "px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base" };
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </button>
  );
}

function Input({ label, value, onChange, placeholder, type = "text", className = "" }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && <label className="text-xs sm:text-sm font-medium text-gray-700">{label}</label>}
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition" />
    </div>
  );
}

function Textarea({ value, onChange, placeholder, rows = 3, className = "" }) {
  return (
    <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows}
      className={`border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition resize-none ${className}`} />
  );
}

function EmptyState({ icon, title, body }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center">
      <div className="text-4xl sm:text-5xl mb-4">{icon}</div>
      <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-1">{title}</h3>
      <p className="text-xs sm:text-sm text-gray-500 max-w-xs">{body}</p>
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, type = "success") => {
    const id = uid();
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);
  return { toasts, add };
}

function ToastContainer({ toasts }) {
  const colors = { success: "bg-emerald-600", error: "bg-red-600", info: "bg-blue-600" };
  return (
    <div className="fixed bottom-4 sm:bottom-5 right-4 sm:right-5 z-[200] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className={`${colors[t.type] || colors.info} text-white text-xs sm:text-sm font-medium px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl shadow-lg pointer-events-auto`}>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// Small centered modal shell reused by the detail views and the screenshot
// lightbox below.
function Modal({ open, onClose, children, maxWidth = "max-w-lg" }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${maxWidth} max-h-[85vh] overflow-y-auto`} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// THEME EDITOR — every editable section of the course landing page
// (Shopify.jsx). Defaults below match exactly what's currently hardcoded
// there, so an unpublished/empty theme still renders the page as it looks
// today. Reads/writes through the theme endpoints already defined in
// server.js (draft/publish/history/reset) — no new backend routes needed,
// just a role check update (see SUPERADMIN_SETUP.md).
//
// NOTE: Shopify.jsx does not yet fetch or apply these settings — that's a
// separate, deliberately-staged follow-up (see chat). Publishing here saves
// the theme correctly, but the live course page won't visually change until
// Shopify.jsx is updated to read GET /api/theme/published and use these
// values instead of its current hardcoded ones.
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_THEME_SETTINGS = {
  brand: {
    nameFirstPart: "Ler",
    nameSecondPart: "ni",
  },
  colors: {
    primary:       "#e8540a",
    primaryHover:  "#c94708",
    dark:          "#1a1208",
    darkSecondary: "#2d2416",
    cream:         "#FDFAF6",
    cardBg:        "#f8f4ed",
    cardBgAlt:     "#f0ebe3",
    border:        "#ece6dd",
    gold:          "#f9c97a",
  },
  fonts: {
    heading: "Playfair Display",
    body:    "DM Sans",
  },
  announcementBar: {
    enabled: true,
    message: "🎉 Limited Time Offer: Save {pct}% — Ends Soon!",
  },
  header: {
    navLinks: [
      { label: "Categories", path: "/courses" },
      { label: "Instructor", path: "/instructor" },
      { label: "About", path: "/courses" },
    ],
    loginButtonText: "Log In",
  },
  hero: {
    bestsellerBadgeText: "Bestseller",
    createdByText:       "Created by",
    lastUpdatedPrefix:   "Last updated",
    languageLabel:       "Urdu",
    studentsSuffix:      "students",
    reviewsSuffix:       "reviews",
    buyNowText:          "Buy now",
    guaranteeText:       "30-Day Money-Back Guarantee",
  },
  sections: {
    whatYouLearn:  { heading: "What you'll learn" },
    courseContent: { heading: "Course Content", freeLabel: "Free Lecture" },
    requirements:  { heading: "Requirements" },
    description:   { heading: "Description", showMoreText: "Show more", showLessText: "Show less" },
    instructor:    { heading: "Instructor", ratingLabel: "Total Rating", reviewsLabel: "Reviews", studentsLabel: "Students", coursesLabel: "Courses" },
    reviews:       { showAllButtonText: "Show All Reviews" },
    testimonials:  { heading: "Student Testimonials", subheading: "See what our students have to say" },
    videoReviews:  { heading: "Video Reviews", subheading: "Watch authentic testimonials from our graduates" },
    gallery:       { heading: "Project gallery", subheading: "Student work and course outcomes" },
    alsoBought:    { heading: "Students also bought" },
  },
  courseIncludes: {
    heading: "This course includes:",
    items: [
      { icon: "Film",       text: "On-demand video" },
      { icon: "Download",   text: "Downloadable resources" },
      { icon: "Smartphone", text: "Access on mobile and TV" },
      { icon: "Shield",     text: "Full lifetime access" },
      { icon: "Award",      text: "Certificate of completion" },
    ],
  },
  fallbackReviews: {
    rating: 4.8,
    count: 5676,
    distribution: [
      { star: 5, count: 4427, percentage: 78 },
      { star: 4, count: 851,  percentage: 15 },
      { star: 3, count: 227,  percentage: 4 },
      { star: 2, count: 114,  percentage: 2 },
      { star: 1, count: 57,   percentage: 1 },
    ],
    reviews: [
      { author: "Ayesha Siddiqui", rating: 5, date: "Aug 12, 2026", text: "Yeh course mera business dekhne ka tareeqa hi badal gaya. Facebook Ads aur Shopify wali videos bohat practical thi. Highly recommended for beginners!" },
      { author: "Muhammad Bilal",  rating: 4, date: "Aug 3, 2026",  text: "Content is solid, especially the e-commerce dropshipping module. Kuch sections thori lambi lagti hain lekin overall bohat value hai." },
      { author: "Zainab Fatima",   rating: 5, date: "Jul 27, 2026", text: "Sir ne har concept itni acchi tarhan explain kiya keh mujhe apna Instagram store shuru karne ka confidence mil gaya. Best marketing course in Urdu!" },
      { author: "Usman Tariq",     rating: 5, date: "Jul 19, 2026", text: "I run a small clothing brand and this course helped me set up my first proper ad campaign. Roman Urdu explanation makes everything very easy to follow." },
      { author: "Hina Rafiq",      rating: 4, date: "Jul 10, 2026", text: "SEO wala section thora aur detailed ho sakta tha, but overall the course is amazing for e-commerce beginners." },
      { author: "Ahmed Raza",      rating: 5, date: "Jun 30, 2026", text: "Bohat zabardast course hai! Google Ads aur email marketing dono clearly samajh aa gaye. Worth every rupee." },
      { author: "Sana Malik",      rating: 5, date: "Jun 22, 2026", text: "Great mix of theory and hands-on practice. Mujhe apni Daraz store ki sales double karne mein madad mili." },
      { author: "Fahad Iqbal",     rating: 4, date: "Jun 15, 2026", text: "Acha course hai, beginners ke liye perfect starting point digital marketing seekhne ka." },
    ],
  },
  footer: {
    columns: [
      { title: "Lerni",     links: ["About", "Press", "Contact", "Careers"] },
      { title: "Community", links: ["Learners", "Partners", "Developers", "Beta Testers"] },
      { title: "Teaching",  links: ["Become Instructor", "Teaching Center", "Resources"] },
      { title: "Programs",  links: ["Enterprise", "Government", "Lerni Business"] },
      { title: "Support",   links: ["Help Center", "Get the App", "FAQ", "Accessibility"] },
      { title: "Legal",     links: ["Terms", "Privacy Policy", "Cookie Settings", "Sitemap"] },
    ],
    copyrightText: "© 2024 Lerni, Inc. All rights reserved.",
  },
  stickyBar: {
    enrollText: "Enroll Now In",
  },
};

// Merges saved settings on top of the defaults above — any section/field
// the saved theme hasn't touched yet falls back to the current Shopify.jsx
// hardcoded value, so the form is always fully populated even before a
// theme has ever been published. Arrays (nav links, footer columns, etc.)
// are replaced wholesale by the saved value rather than merged item-by-item.
function deepMerge(base, override) {
  if (!override || typeof override !== "object" || Array.isArray(override)) return base;
  const out = { ...base };
  for (const key of Object.keys(override)) {
    const overrideVal = override[key];
    const baseVal = base ? base[key] : undefined;
    if (overrideVal && typeof overrideVal === "object" && !Array.isArray(overrideVal)
      && baseVal && typeof baseVal === "object" && !Array.isArray(baseVal)) {
      out[key] = deepMerge(baseVal, overrideVal);
    } else if (overrideVal !== undefined) {
      out[key] = overrideVal;
    }
  }
  return out;
}

const INCLUDES_ICON_OPTIONS = ["Film", "Download", "Smartphone", "Shield", "Award", "BookOpen", "Clock", "Globe", "Users", "Star", "Check"];

function ThemeCard({ title, description, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6 shadow-sm">
      <h3 className="font-bold text-gray-800 text-base">{title}</h3>
      {description && <p className="text-xs sm:text-sm text-gray-500 mt-1">{description}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </div>
  );
}

function ColorField({ label, value, onChange }) {
  const safeHex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value) ? value : "#000000";
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs sm:text-sm font-medium text-gray-700">{label}</label>
      <div className="flex items-center gap-2">
        <input type="color" value={safeHex} onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5 bg-white flex-shrink-0" />
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
          className="flex-1 min-w-0 border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500" />
      </div>
    </div>
  );
}

function StringListEditor({ items, onChange, placeholder = "Item" }) {
  const update = (idx, val) => onChange(items.map((it, i) => (i === idx ? val : it)));
  const remove = (idx) => onChange(items.filter((_, i) => i !== idx));
  const add = () => onChange([...items, ""]);
  return (
    <div className="space-y-2">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <input value={item} onChange={(e) => update(idx, e.target.value)} placeholder={placeholder}
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500" />
          <button onClick={() => remove(idx)} className="text-red-400 hover:text-red-600 bg-transparent border-none cursor-pointer p-1"><Trash2 size={15} /></button>
        </div>
      ))}
      <button onClick={add} className="text-amber-700 hover:text-amber-800 text-xs font-semibold flex items-center gap-1 bg-transparent border-none cursor-pointer p-0">
        <Plus size={14} /> Add item
      </button>
    </div>
  );
}

function NavLinksEditor({ items, onChange }) {
  const update = (idx, field, val) => onChange(items.map((it, i) => (i === idx ? { ...it, [field]: val } : it)));
  const remove = (idx) => onChange(items.filter((_, i) => i !== idx));
  const add = () => onChange([...items, { label: "", path: "/" }]);
  return (
    <div className="space-y-2">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <input value={item.label} onChange={(e) => update(idx, "label", e.target.value)} placeholder="Label"
            className="flex-1 min-w-0 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500" />
          <input value={item.path} onChange={(e) => update(idx, "path", e.target.value)} placeholder="/path"
            className="flex-1 min-w-0 border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500" />
          <button onClick={() => remove(idx)} className="text-red-400 hover:text-red-600 bg-transparent border-none cursor-pointer p-1"><Trash2 size={15} /></button>
        </div>
      ))}
      <button onClick={add} className="text-amber-700 hover:text-amber-800 text-xs font-semibold flex items-center gap-1 bg-transparent border-none cursor-pointer p-0">
        <Plus size={14} /> Add link
      </button>
    </div>
  );
}

function CourseIncludesEditor({ items, onChange }) {
  const update = (idx, field, val) => onChange(items.map((it, i) => (i === idx ? { ...it, [field]: val } : it)));
  const remove = (idx) => onChange(items.filter((_, i) => i !== idx));
  const add = () => onChange([...items, { icon: "Check", text: "" }]);
  return (
    <div className="space-y-2">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <select value={item.icon} onChange={(e) => update(idx, "icon", e.target.value)}
            className="border border-gray-200 rounded-lg px-2 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500">
            {INCLUDES_ICON_OPTIONS.map((ic) => <option key={ic} value={ic}>{ic}</option>)}
          </select>
          <input value={item.text} onChange={(e) => update(idx, "text", e.target.value)} placeholder="Feature text"
            className="flex-1 min-w-0 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500" />
          <button onClick={() => remove(idx)} className="text-red-400 hover:text-red-600 bg-transparent border-none cursor-pointer p-1"><Trash2 size={15} /></button>
        </div>
      ))}
      <button onClick={add} className="text-amber-700 hover:text-amber-800 text-xs font-semibold flex items-center gap-1 bg-transparent border-none cursor-pointer p-0">
        <Plus size={14} /> Add feature
      </button>
    </div>
  );
}

function FooterColumnsEditor({ columns, onChange }) {
  const updateTitle = (idx, val) => onChange(columns.map((c, i) => (i === idx ? { ...c, title: val } : c)));
  const updateLinks = (idx, links) => onChange(columns.map((c, i) => (i === idx ? { ...c, links } : c)));
  const remove = (idx) => onChange(columns.filter((_, i) => i !== idx));
  const add = () => onChange([...columns, { title: "New Column", links: [] }]);
  return (
    <div className="space-y-4">
      {columns.map((col, idx) => (
        <div key={idx} className="border border-gray-200 rounded-lg p-3 sm:p-4 space-y-3">
          <div className="flex items-center gap-2">
            <input value={col.title} onChange={(e) => updateTitle(idx, e.target.value)} placeholder="Column title"
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500" />
            <button onClick={() => remove(idx)} className="text-red-400 hover:text-red-600 bg-transparent border-none cursor-pointer p-1"><Trash2 size={15} /></button>
          </div>
          <StringListEditor items={col.links} onChange={(links) => updateLinks(idx, links)} placeholder="Link text" />
        </div>
      ))}
      <button onClick={add} className="text-amber-700 hover:text-amber-800 text-xs font-semibold flex items-center gap-1 bg-transparent border-none cursor-pointer p-0">
        <Plus size={14} /> Add column
      </button>
    </div>
  );
}

function FallbackDistributionEditor({ distribution, onChange }) {
  const update = (idx, field, val) => onChange(distribution.map((d, i) => (i === idx ? { ...d, [field]: Number(val) || 0 } : d)));
  return (
    <div className="space-y-2">
      {distribution.map((row, idx) => (
        <div key={row.star} className="flex items-center gap-2">
          <span className="w-14 text-sm font-semibold text-gray-700">{row.star} star</span>
          <input type="number" min="0" value={row.count} onChange={(e) => update(idx, "count", e.target.value)} placeholder="Count"
            className="w-24 border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
          <input type="number" min="0" max="100" value={row.percentage} onChange={(e) => update(idx, "percentage", e.target.value)} placeholder="%"
            className="w-20 border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
          <span className="text-xs text-gray-400">%</span>
        </div>
      ))}
    </div>
  );
}

function FallbackReviewsListEditor({ reviews, onChange }) {
  const update = (idx, field, val) => onChange(reviews.map((r, i) => (i === idx ? { ...r, [field]: val } : r)));
  const remove = (idx) => onChange(reviews.filter((_, i) => i !== idx));
  const add = () => onChange([...reviews, { author: "", rating: 5, date: "", text: "" }]);
  return (
    <div className="space-y-3">
      {reviews.map((r, idx) => (
        <div key={idx} className="border border-gray-200 rounded-lg p-3 space-y-2">
          <div className="grid sm:grid-cols-3 gap-2">
            <input value={r.author} onChange={(e) => update(idx, "author", e.target.value)} placeholder="Author name"
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
            <select value={r.rating} onChange={(e) => update(idx, "rating", Number(e.target.value))}
              className="border border-gray-200 rounded-lg px-2 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500">
              {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} star</option>)}
            </select>
            <input value={r.date} onChange={(e) => update(idx, "date", e.target.value)} placeholder="e.g. Aug 12, 2026"
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
          </div>
          <Textarea value={r.text} onChange={(v) => update(idx, "text", v)} rows={2} placeholder="Review text" />
          <button onClick={() => remove(idx)} className="text-red-400 hover:text-red-600 text-xs font-semibold flex items-center gap-1 bg-transparent border-none cursor-pointer p-0">
            <Trash2 size={13} /> Remove review
          </button>
        </div>
      ))}
      <button onClick={add} className="text-amber-700 hover:text-amber-800 text-xs font-semibold flex items-center gap-1 bg-transparent border-none cursor-pointer p-0">
        <Plus size={14} /> Add fallback review
      </button>
    </div>
  );
}

function ThemeHistoryModal({ open, onClose, history, loading, onRestore }) {
  return (
    <Modal open={open} onClose={onClose} maxWidth="max-w-lg">
      <div className="p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 text-lg">Publish History</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer"><X size={20} /></button>
        </div>
        {loading ? (
          <p className="text-sm text-gray-400 text-center py-8">Loading…</p>
        ) : history.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No published versions yet.</p>
        ) : (
          <div className="space-y-2">
            {history.map((h) => (
              <div key={h._id} className="flex items-center justify-between gap-3 border border-gray-100 rounded-lg px-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800">Version {h.version}</p>
                  <p className="text-xs text-gray-500">{h.changedBy?.name || "Unknown"} · {fmtDate(h.createdAt)}</p>
                </div>
                <Btn size="sm" variant="secondary" onClick={() => onRestore(h._id)}>Restore</Btn>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}

function ThemeEditorPage({ toast }) {
  const { API: api } = useAuth();
  const [settings,   setSettings]   = useState(DEFAULT_THEME_SETTINGS);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [dirty,      setDirty]      = useState(false);
  const [historyOpen,    setHistoryOpen]    = useState(false);
  const [history,        setHistory]        = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.get("/theme/draft")
      .then((res) => { if (!cancelled) setSettings(deepMerge(DEFAULT_THEME_SETTINGS, res.data?.settings || {})); })
      .catch(() => { if (!cancelled) toast("Could not load the saved theme — showing defaults.", "error"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function update(path, value) {
    setSettings((s) => {
      const next = JSON.parse(JSON.stringify(s));
      let cur = next;
      for (let i = 0; i < path.length - 1; i++) cur = cur[path[i]];
      cur[path[path.length - 1]] = value;
      return next;
    });
    setDirty(true);
  }

  async function handleSaveDraft() {
    setSaving(true);
    try { await api.put("/theme/draft", { settings }); setDirty(false); toast("Draft saved.", "success"); }
    catch { toast("Could not save draft.", "error"); }
    finally { setSaving(false); }
  }

  async function handlePublish() {
    setPublishing(true);
    try { await api.post("/theme/publish", { settings }); setDirty(false); toast("Published.", "success"); }
    catch { toast("Could not publish.", "error"); }
    finally { setPublishing(false); }
  }

  function handleResetToDefaults() {
    if (!window.confirm("Reset every field back to the original defaults? This only changes your draft — nothing already published changes until you publish again.")) return;
    setSettings(DEFAULT_THEME_SETTINGS);
    setDirty(true);
    toast("Reset to defaults — save or publish to keep it.", "info");
  }

  async function openHistory() {
    setHistoryOpen(true);
    setLoadingHistory(true);
    try { const res = await api.get("/theme/history"); setHistory(Array.isArray(res.data) ? res.data : []); }
    catch { toast("Could not load history.", "error"); }
    finally { setLoadingHistory(false); }
  }

  async function handleRestore(historyId) {
    try {
      const res = await api.post(`/theme/restore/${historyId}`);
      setSettings(deepMerge(DEFAULT_THEME_SETTINGS, res.data?.settings || {}));
      setDirty(true);
      setHistoryOpen(false);
      toast("Restored into your draft — review, then publish when ready.", "success");
    } catch { toast("Could not restore that version.", "error"); }
  }

  if (loading) return <div className="text-center py-16 text-gray-400">Loading theme…</div>;

  const s = settings;

  return (
    <div className="space-y-6 sm:space-y-8 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">Course Page Theme Editor</h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Every editable section of the course landing page — colors, headings, footer, and fallback content.
            {dirty && <span className="text-amber-600 font-semibold"> Unsaved changes.</span>}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Btn variant="secondary" size="sm" onClick={openHistory}><History size={14} /> History</Btn>
          <Btn variant="secondary" size="sm" onClick={handleResetToDefaults}><RotateCcw size={14} /> Reset</Btn>
          <Btn variant="secondary" size="sm" onClick={handleSaveDraft} disabled={saving}>{saving ? "Saving…" : "Save Draft"}</Btn>
          <Btn variant="primary" size="sm" onClick={handlePublish} disabled={publishing}>{publishing ? "Publishing…" : "Publish"}</Btn>
        </div>
      </div>

      <ThemeCard title="Brand & Colors" description="Wordmark text, fonts, and the color palette used across the whole course page.">
        <div className="grid sm:grid-cols-2 gap-3">
          <Input label="Brand name — first part" value={s.brand.nameFirstPart} onChange={(v) => update(["brand", "nameFirstPart"], v)} />
          <Input label="Brand name — second part (shown in accent color)" value={s.brand.nameSecondPart} onChange={(v) => update(["brand", "nameSecondPart"], v)} />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <ColorField label="Primary accent" value={s.colors.primary} onChange={(v) => update(["colors", "primary"], v)} />
          <ColorField label="Primary accent (hover)" value={s.colors.primaryHover} onChange={(v) => update(["colors", "primaryHover"], v)} />
          <ColorField label="Dark (header / hero background)" value={s.colors.dark} onChange={(v) => update(["colors", "dark"], v)} />
          <ColorField label="Dark secondary" value={s.colors.darkSecondary} onChange={(v) => update(["colors", "darkSecondary"], v)} />
          <ColorField label="Page background (cream)" value={s.colors.cream} onChange={(v) => update(["colors", "cream"], v)} />
          <ColorField label="Card background" value={s.colors.cardBg} onChange={(v) => update(["colors", "cardBg"], v)} />
          <ColorField label="Card background (alt)" value={s.colors.cardBgAlt} onChange={(v) => update(["colors", "cardBgAlt"], v)} />
          <ColorField label="Borders" value={s.colors.border} onChange={(v) => update(["colors", "border"], v)} />
          <ColorField label="Stars / badges (gold)" value={s.colors.gold} onChange={(v) => update(["colors", "gold"], v)} />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <Input label="Heading font" value={s.fonts.heading} onChange={(v) => update(["fonts", "heading"], v)} />
          <Input label="Body font" value={s.fonts.body} onChange={(v) => update(["fonts", "body"], v)} />
        </div>
      </ThemeCard>

      <ThemeCard title="Announcement Bar" description="The scrolling banner shown above the header when a course has a discount.">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <input type="checkbox" checked={s.announcementBar.enabled} onChange={(e) => update(["announcementBar", "enabled"], e.target.checked)} className="accent-amber-600 w-4 h-4" />
          Show announcement bar
        </label>
        <Input label="Message (use {pct} for the discount percentage)" value={s.announcementBar.message} onChange={(v) => update(["announcementBar", "message"], v)} />
      </ThemeCard>

      <ThemeCard title="Header & Navigation" description="Top navigation links and the login button.">
        <NavLinksEditor items={s.header.navLinks} onChange={(v) => update(["header", "navLinks"], v)} />
        <Input label="Login button text" value={s.header.loginButtonText} onChange={(v) => update(["header", "loginButtonText"], v)} />
      </ThemeCard>

      <ThemeCard title="Hero Section" description="Badges, sidebar buttons, and labels around the top of the course page.">
        <div className="grid sm:grid-cols-2 gap-3">
          <Input label="Bestseller badge text" value={s.hero.bestsellerBadgeText} onChange={(v) => update(["hero", "bestsellerBadgeText"], v)} />
          <Input label='"Created by" text' value={s.hero.createdByText} onChange={(v) => update(["hero", "createdByText"], v)} />
          <Input label='"Last updated" prefix' value={s.hero.lastUpdatedPrefix} onChange={(v) => update(["hero", "lastUpdatedPrefix"], v)} />
          <Input label="Language label" value={s.hero.languageLabel} onChange={(v) => update(["hero", "languageLabel"], v)} />
          <Input label="Students suffix" value={s.hero.studentsSuffix} onChange={(v) => update(["hero", "studentsSuffix"], v)} />
          <Input label="Reviews suffix" value={s.hero.reviewsSuffix} onChange={(v) => update(["hero", "reviewsSuffix"], v)} />
          <Input label='"Buy now" button text' value={s.hero.buyNowText} onChange={(v) => update(["hero", "buyNowText"], v)} />
          <Input label="Money-back guarantee text" value={s.hero.guaranteeText} onChange={(v) => update(["hero", "guaranteeText"], v)} />
        </div>
      </ThemeCard>

      <ThemeCard title="Section Headings" description="The heading (and subheading, where the section has one) shown above each block of the page.">
        <div className="grid sm:grid-cols-2 gap-3">
          <Input label="What You'll Learn — heading" value={s.sections.whatYouLearn.heading} onChange={(v) => update(["sections", "whatYouLearn", "heading"], v)} />
          <Input label="Course Content — heading" value={s.sections.courseContent.heading} onChange={(v) => update(["sections", "courseContent", "heading"], v)} />
          <Input label="Free lecture badge text" value={s.sections.courseContent.freeLabel} onChange={(v) => update(["sections", "courseContent", "freeLabel"], v)} />
          <Input label="Requirements — heading" value={s.sections.requirements.heading} onChange={(v) => update(["sections", "requirements", "heading"], v)} />
          <Input label="Description — heading" value={s.sections.description.heading} onChange={(v) => update(["sections", "description", "heading"], v)} />
          <Input label='Description — "show more" text' value={s.sections.description.showMoreText} onChange={(v) => update(["sections", "description", "showMoreText"], v)} />
          <Input label='Description — "show less" text' value={s.sections.description.showLessText} onChange={(v) => update(["sections", "description", "showLessText"], v)} />
          <Input label="Instructor — heading" value={s.sections.instructor.heading} onChange={(v) => update(["sections", "instructor", "heading"], v)} />
          <Input label="Instructor stat — rating label" value={s.sections.instructor.ratingLabel} onChange={(v) => update(["sections", "instructor", "ratingLabel"], v)} />
          <Input label="Instructor stat — reviews label" value={s.sections.instructor.reviewsLabel} onChange={(v) => update(["sections", "instructor", "reviewsLabel"], v)} />
          <Input label="Instructor stat — students label" value={s.sections.instructor.studentsLabel} onChange={(v) => update(["sections", "instructor", "studentsLabel"], v)} />
          <Input label="Instructor stat — courses label" value={s.sections.instructor.coursesLabel} onChange={(v) => update(["sections", "instructor", "coursesLabel"], v)} />
          <Input label='Reviews — "Show All Reviews" button text' value={s.sections.reviews.showAllButtonText} onChange={(v) => update(["sections", "reviews", "showAllButtonText"], v)} />
          <Input label="Testimonials — heading" value={s.sections.testimonials.heading} onChange={(v) => update(["sections", "testimonials", "heading"], v)} />
          <Input label="Testimonials — subheading" value={s.sections.testimonials.subheading} onChange={(v) => update(["sections", "testimonials", "subheading"], v)} />
          <Input label="Video Reviews — heading" value={s.sections.videoReviews.heading} onChange={(v) => update(["sections", "videoReviews", "heading"], v)} />
          <Input label="Video Reviews — subheading" value={s.sections.videoReviews.subheading} onChange={(v) => update(["sections", "videoReviews", "subheading"], v)} />
          <Input label="Project Gallery — heading" value={s.sections.gallery.heading} onChange={(v) => update(["sections", "gallery", "heading"], v)} />
          <Input label="Project Gallery — subheading" value={s.sections.gallery.subheading} onChange={(v) => update(["sections", "gallery", "subheading"], v)} />
          <Input label="Students Also Bought — heading" value={s.sections.alsoBought.heading} onChange={(v) => update(["sections", "alsoBought", "heading"], v)} />
        </div>
      </ThemeCard>

      <ThemeCard title='"This Course Includes" (sidebar)' description="The fixed feature list shown in the desktop sidebar — not pulled from any individual course.">
        <Input label="Heading" value={s.courseIncludes.heading} onChange={(v) => update(["courseIncludes", "heading"], v)} />
        <CourseIncludesEditor items={s.courseIncludes.items} onChange={(v) => update(["courseIncludes", "items"], v)} />
      </ThemeCard>

      <ThemeCard title="Fallback Reviews" description="Shown only on courses that have no real reviews yet, so the page never looks empty.">
        <div className="grid sm:grid-cols-2 gap-3">
          <Input label="Fallback rating (e.g. 4.8)" type="number" value={String(s.fallbackReviews.rating)} onChange={(v) => update(["fallbackReviews", "rating"], parseFloat(v) || 0)} />
          <Input label="Fallback review count" type="number" value={String(s.fallbackReviews.count)} onChange={(v) => update(["fallbackReviews", "count"], parseInt(v, 10) || 0)} />
        </div>
        <div>
          <p className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Star distribution</p>
          <FallbackDistributionEditor distribution={s.fallbackReviews.distribution} onChange={(v) => update(["fallbackReviews", "distribution"], v)} />
        </div>
        <div>
          <p className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Sample reviews</p>
          <FallbackReviewsListEditor reviews={s.fallbackReviews.reviews} onChange={(v) => update(["fallbackReviews", "reviews"], v)} />
        </div>
      </ThemeCard>

      <ThemeCard title="Footer" description="All footer columns and their links, plus the copyright line.">
        <FooterColumnsEditor columns={s.footer.columns} onChange={(v) => update(["footer", "columns"], v)} />
        <Input label="Copyright text" value={s.footer.copyrightText} onChange={(v) => update(["footer", "copyrightText"], v)} />
      </ThemeCard>

      <ThemeCard title="Sticky Mobile Enroll Bar" description="The bar pinned to the bottom of the screen on mobile.">
        <Input label="Button text prefix (shown before the price)" value={s.stickyBar.enrollText} onChange={(v) => update(["stickyBar", "enrollText"], v)} />
      </ThemeCard>

      <ThemeHistoryModal open={historyOpen} onClose={() => setHistoryOpen(false)} history={history} loading={loadingHistory} onRestore={handleRestore} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NAVIGATION SHELL — Sidebar + TopBar + Layout (same structure as the
// instructor dashboard, amber accent instead of purple)
// ─────────────────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { to: "/superadmin",               label: "Overview",      icon: LayoutDashboard, exact: true },
  { to: "/superadmin/verifications", label: "Verifications", icon: ClipboardCheck },
  { to: "/superadmin/students",      label: "Students",      icon: Users },
  { to: "/superadmin/instructors",   label: "Instructors",   icon: GraduationCap },
  { to: "/superadmin/courses",       label: "Courses",       icon: BookOpen },
  { to: "/superadmin/theme",         label: "Theme Editor",  icon: Palette },
];

function Sidebar({ admin, collapsed, setCollapsed, isMobile, pendingCount }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-[#1c1d1f] flex flex-col z-50 transition-all duration-300 ${isMobile && collapsed ? "-translate-x-full" : "translate-x-0"}`}
      style={{ width: isMobile ? 240 : collapsed ? 64 : 230 }}>
      <div className="flex items-center gap-2.5 px-4 h-16 border-b border-white/10 flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center flex-shrink-0">
          <ShieldCheck size={18} className="text-white" />
        </div>
        {!collapsed && <span className="font-extrabold text-white text-base tracking-tight whitespace-nowrap flex-1">Super Admin</span>}
        {isMobile ? (
          <button onClick={() => setCollapsed(true)} className="ml-auto text-gray-400 hover:text-white transition-colors text-lg">✕</button>
        ) : (
          <button onClick={() => setCollapsed((c) => !c)} className="ml-auto text-gray-400 hover:text-white transition-colors text-lg">
            {collapsed ? "›" : "‹"}
          </button>
        )}
      </div>
      {!collapsed && (
        <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10 flex-shrink-0">
          <Avatar name={admin?.name || "Admin"} size={36} src={admin?.avatar} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{admin?.name || "Super Admin"}</p>
            <p className="text-xs text-gray-400 truncate">{admin?.email}</p>
          </div>
        </div>
      )}
      <nav className="flex-1 overflow-y-auto py-3 px-2 flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const showBadge = item.to === "/superadmin/verifications" && pendingCount > 0;
          return (
            <NavLink key={item.to} to={item.to} end={item.exact} onClick={() => isMobile && setCollapsed(true)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${isActive ? "bg-amber-600 text-white" : "text-gray-400 hover:bg-white/10 hover:text-white"}`}>
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && <span className="truncate flex-1">{item.label}</span>}
              {!collapsed && showBadge && (
                <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {pendingCount > 99 ? "99+" : pendingCount}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>
      <div className="px-2 pb-4 flex-shrink-0">
        <button onClick={() => { logout(); navigate("/auth/login"); }}
          className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-150">
          <span className="text-lg leading-none flex-shrink-0">⏻</span>
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}

function TopBar({ admin, sidebarWidth, isMobile, onMenuClick }) {
  return (
    <header className="fixed top-0 right-0 h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 sm:px-6 z-40 transition-all duration-300"
      style={{ left: isMobile ? 0 : sidebarWidth }}>
      {isMobile && (
        <button onClick={onMenuClick} className="text-gray-600 hover:text-gray-900 transition"><Menu size={20} /></button>
      )}
      <h1 className="text-sm sm:text-base font-bold text-gray-900">Platform Administration</h1>
      <div className="flex items-center gap-2 sm:gap-3 ml-auto">
        <Avatar name={admin?.name || "A"} size={34} src={admin?.avatar} />
      </div>
    </header>
  );
}

function Layout({ children, sidebarWidth, isMobile }) {
  return (
    <main className="min-h-screen pt-16 bg-gray-50 transition-all duration-300"
      style={{ marginLeft: isMobile ? 0 : sidebarWidth, overflowX: "hidden" }}>
      <div className="p-4 sm:p-6 md:p-8 max-w-[1400px]">{children}</div>
    </main>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE: OVERVIEW
// ─────────────────────────────────────────────────────────────────────────────

function OverviewPage({ stats, loadingStats, enrollments, students, navigate }) {
  const pending = useMemo(() => enrollments.filter((e) => e.status === "pending").slice(0, 5), [enrollments]);
  const recentStudents = useMemo(
    () => [...students].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 5),
    [students]
  );

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="bg-gradient-to-r from-[#1c1d1f] to-[#3a3226] rounded-2xl p-5 sm:p-7 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <p className="text-amber-200 text-xs sm:text-sm font-medium mb-1">Platform control center</p>
        <h2 className="text-2xl sm:text-3xl font-extrabold mb-1">Super Admin</h2>
        <p className="text-gray-300 text-xs sm:text-sm">Students, instructors, and payment verification — all in one place.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <StatCard icon={<Users size={22} />} label="Total Students" value={loadingStats ? "…" : fmtNum(stats?.totalStudents)} color="amber" />
        <StatCard icon={<GraduationCap size={22} />} label="Instructors" value={loadingStats ? "…" : fmtNum(stats?.totalInstructors)} color="blue" />
        <StatCard icon={<BookOpen size={22} />} label="Courses" value={loadingStats ? "…" : fmtNum(stats?.totalCourses)} color="blue" />
        <StatCard icon={<Clock size={22} />} label="Pending Verifications" value={loadingStats ? "…" : fmtNum(stats?.pendingVerifications)}
          sub={stats?.pendingVerifications > 0 ? "Needs review" : "All caught up"} color={stats?.pendingVerifications > 0 ? "red" : "green"} />
        <StatCard icon={<DollarSign size={22} />} label="Platform Revenue" value={loadingStats ? "…" : fmtMoney(stats?.totalRevenue)} color="green" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6 shadow-sm">
          <SectionHeader title="Awaiting verification" action={<Btn onClick={() => navigate("/superadmin/verifications")} variant="ghost" size="sm">View all</Btn>} />
          {pending.length === 0 ? (
            <EmptyState icon="✅" title="Nothing pending" body="Every submitted payment has been reviewed." />
          ) : (
            <div className="space-y-3">
              {pending.map((e) => (
                <div key={e._id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition">
                  <Avatar name={e.name || e.student?.name || "Student"} size={36} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{e.name || e.student?.name}</p>
                    <p className="text-xs text-gray-500 truncate">{e.course?.title || "Course"} · {fmtPKR(e.amount)}</p>
                  </div>
                  <VerifyPill status={e.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6 shadow-sm">
          <SectionHeader title="Recently joined students" action={<Btn onClick={() => navigate("/superadmin/students")} variant="ghost" size="sm">View all</Btn>} />
          {recentStudents.length === 0 ? (
            <EmptyState icon="🎓" title="No students yet" body="New sign-ups will appear here." />
          ) : (
            <div className="space-y-3">
              {recentStudents.map((s) => (
                <div key={s._id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition">
                  <Avatar name={s.name} size={36} src={s.avatar} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{s.name}</p>
                    <p className="text-xs text-gray-500 truncate">{s.email}</p>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">{fmtDate(s.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE: VERIFICATIONS — the core requested feature
// ─────────────────────────────────────────────────────────────────────────────

function VerificationCard({ enrollment, onApprove, onReject }) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason]       = useState("");
  const [busy, setBusy]           = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const isPending = enrollment.status === "pending";

  async function handleApprove() {
    setBusy(true);
    try { await onApprove(enrollment._id); }
    finally { setBusy(false); }
  }

  async function handleReject() {
    if (!reason.trim()) return;
    setBusy(true);
    try { await onReject(enrollment._id, reason.trim()); setRejecting(false); setReason(""); }
    finally { setBusy(false); }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4">
        {/* Student + course info */}
        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex items-start gap-3">
            <Avatar name={enrollment.name || enrollment.student?.name || "Student"} size={40} />
            <div className="min-w-0 flex-1">
              <p className="font-bold text-gray-900 text-sm truncate">{enrollment.name || enrollment.student?.name}</p>
              <p className="text-xs text-gray-500 flex items-center gap-1 truncate"><Mail size={11} /> {enrollment.email || enrollment.student?.email}</p>
              {enrollment.whatsapp && (
                <p className="text-xs text-gray-500 flex items-center gap-1 truncate"><MessageCircle size={11} /> {enrollment.whatsapp}</p>
              )}
            </div>
            <VerifyPill status={enrollment.status} />
          </div>

          <div className="bg-gray-50 rounded-lg p-3 flex items-center gap-3">
            <div className="w-14 h-10 rounded-md overflow-hidden bg-gray-200 flex-shrink-0 flex items-center justify-center">
              {enrollment.course?.thumbnail
                ? <img src={enrollment.course.thumbnail} alt={enrollment.course?.title} className="w-full h-full object-cover" />
                : <BookOpen size={16} className="text-gray-400" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-800 truncate">{enrollment.course?.title || "Course"}</p>
              <p className="text-xs text-gray-500">{fmtPKR(enrollment.amount)} · {enrollment.paymentMethod || "—"}</p>
            </div>
            <span className="text-xs text-gray-400 whitespace-nowrap">{fmtDate(enrollment.createdAt)}</span>
          </div>

          {enrollment.status === "rejected" && enrollment.rejectionReason && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-lg p-2.5">
              <AlertTriangle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700">{enrollment.rejectionReason}</p>
            </div>
          )}
        </div>

        {/* Payment screenshot */}
        <div className="flex-shrink-0 flex flex-col items-center gap-2">
          <button
            onClick={() => enrollment.paymentScreenshotUrl && setLightboxOpen(true)}
            className="w-full sm:w-32 h-24 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center cursor-pointer hover:opacity-90 transition"
          >
            {enrollment.paymentScreenshotUrl
              ? <img src={enrollment.paymentScreenshotUrl} alt="Payment screenshot" className="w-full h-full object-cover" />
              : <span className="text-xs text-gray-400">No screenshot</span>}
          </button>
          {enrollment.paymentScreenshotUrl && (
            <a href={enrollment.paymentScreenshotUrl} target="_blank" rel="noopener noreferrer"
              className="text-xs text-amber-700 hover:text-amber-800 font-semibold flex items-center gap-1">
              <ExternalLink size={11} /> Open full size
            </a>
          )}
        </div>
      </div>

      {isPending && (
        <div className="border-t border-gray-100 p-3 sm:p-4 bg-gray-50">
          {!rejecting ? (
            <div className="flex gap-2">
              <Btn variant="success" size="sm" onClick={handleApprove} disabled={busy} className="flex-1 justify-center">
                <CheckCircle2 size={15} /> Approve
              </Btn>
              <Btn variant="danger" size="sm" onClick={() => setRejecting(true)} disabled={busy} className="flex-1 justify-center">
                <XCircle size={15} /> Reject
              </Btn>
            </div>
          ) : (
            <div className="space-y-2">
              <Textarea value={reason} onChange={setReason} placeholder="Reason for rejection (shown to the student)" rows={2} />
              <div className="flex gap-2">
                <Btn variant="secondary" size="sm" onClick={() => { setRejecting(false); setReason(""); }} className="flex-1 justify-center">Cancel</Btn>
                <Btn variant="danger" size="sm" onClick={handleReject} disabled={busy || !reason.trim()} className="flex-1 justify-center">Confirm reject</Btn>
              </div>
            </div>
          )}
        </div>
      )}

      <Modal open={lightboxOpen} onClose={() => setLightboxOpen(false)} maxWidth="max-w-2xl">
        <div className="p-3">
          <img src={enrollment.paymentScreenshotUrl} alt="Payment screenshot" className="w-full rounded-lg" />
        </div>
      </Modal>
    </div>
  );
}

function VerificationsPage({ enrollments, loading, verifyEnrollment, rejectEnrollment, toast }) {
  const [tab, setTab] = useState("pending");

  const filtered = useMemo(() => enrollments.filter((e) => e.status === tab), [enrollments, tab]);
  const counts = useMemo(() => ({
    pending:  enrollments.filter((e) => e.status === "pending").length,
    verified: enrollments.filter((e) => e.status === "verified").length,
    rejected: enrollments.filter((e) => e.status === "rejected").length,
  }), [enrollments]);

  async function handleApprove(id) {
    try { await verifyEnrollment(id); toast("Enrollment approved — student now has access.", "success"); }
    catch { toast("Could not approve. Please try again.", "error"); }
  }
  async function handleReject(id, reason) {
    try { await rejectEnrollment(id, reason); toast("Enrollment rejected.", "success"); }
    catch { toast("Could not reject. Please try again.", "error"); }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">Payment Verifications</h2>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Review the payment screenshot each student submitted at checkout before granting access.</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {["pending", "verified", "rejected"].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition whitespace-nowrap flex items-center gap-1.5 ${tab === t ? "bg-amber-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
            <span className={`text-[10px] rounded-full px-1.5 py-0.5 ${tab === t ? "bg-white/20" : "bg-gray-100"}`}>{counts[t]}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading verifications…</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={tab === "pending" ? "✅" : tab === "verified" ? "🗂️" : "🚫"}
          title={tab === "pending" ? "Nothing to review" : `No ${tab} enrollments`}
          body={tab === "pending" ? "New payment screenshots will show up here as students check out." : "They'll appear here once there's activity."}
        />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {filtered.map((e) => (
            <VerificationCard key={e._id} enrollment={e} onApprove={handleApprove} onReject={handleReject} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE: STUDENTS
// ─────────────────────────────────────────────────────────────────────────────

function StudentDetailModal({ student, onClose, onToggleStatus }) {
  if (!student) return null;
  return (
    <Modal open={Boolean(student)} onClose={onClose} maxWidth="max-w-xl">
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <Avatar name={student.name} size={48} src={student.avatar} />
            <div>
              <p className="font-bold text-gray-900">{student.name}</p>
              <p className="text-sm text-gray-500">{student.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer"><X size={20} /></button>
        </div>

        <div className="flex items-center justify-between mb-4">
          <StatusPill status={student.status} />
          <Btn size="sm" variant={student.status === "suspended" ? "success" : "danger"} onClick={() => onToggleStatus(student)}>
            {student.status === "suspended" ? <><RotateCcw size={14} /> Reactivate</> : <><Ban size={14} /> Suspend</>}
          </Btn>
        </div>

        <h4 className="text-sm font-bold text-gray-800 mb-2">Enrolled courses ({student.enrollments?.length || 0})</h4>
        {!student.enrollments || student.enrollments.length === 0 ? (
          <p className="text-sm text-gray-400">No enrollments yet.</p>
        ) : (
          <div className="space-y-2">
            {student.enrollments.map((en) => (
              <div key={en._id} className="flex items-center justify-between gap-2 border border-gray-100 rounded-lg px-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{en.courseTitle}</p>
                  <p className="text-xs text-gray-500">{en.paymentMethod || "—"} · {fmtDate(en.createdAt)}</p>
                </div>
                <VerifyPill status={en.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}

function StudentsPage({ students, loading, setUserStatus, toast }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [detail, setDetail] = useState(null);

  const filtered = useMemo(() => students.filter((s) => {
    const matchSearch = (s.name || "").toLowerCase().includes(search.toLowerCase()) || (s.email || "").toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || (s.status || "active") === filter;
    return matchSearch && matchFilter;
  }), [students, search, filter]);

  async function handleToggle(student) {
    const next = student.status === "suspended" ? "active" : "suspended";
    try {
      await setUserStatus(student._id, next);
      toast(next === "suspended" ? "Student suspended." : "Student reactivated.", "success");
      setDetail((d) => (d && d._id === student._id ? { ...d, status: next } : d));
    } catch { toast("Could not update student status.", "error"); }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">Students</h2>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{students.length} students across every course</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email…"
            className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition" />
        </div>
        <div className="flex gap-1.5">
          {["all", "active", "suspended"].map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs font-semibold transition whitespace-nowrap ${filter === s ? "bg-amber-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? <div className="text-center py-16 text-gray-400">Loading students…</div>
      : filtered.length === 0 ? <EmptyState icon="🔍" title="No students found" body="Try a different search or filter." />
      : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Student", "Courses", "Total Spent", "Joined", "Status", "Actions"].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 sm:px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((s) => {
                  const spent = (s.enrollments || []).filter((e) => e.status === "verified").reduce((a, e) => a + (e.amount || 0), 0);
                  return (
                    <tr key={s._id} className="hover:bg-gray-50 transition">
                      <td className="px-3 sm:px-4 py-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <Avatar name={s.name} size={34} src={s.avatar} />
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-semibold text-gray-800 truncate max-w-[140px] sm:max-w-[200px]">{s.name}</p>
                            <p className="text-xs text-gray-400 truncate max-w-[140px] sm:max-w-[200px]">{s.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 py-4 text-xs sm:text-sm text-gray-700 font-medium">{s.enrollments?.length || 0}</td>
                      <td className="px-3 sm:px-4 py-4 text-xs sm:text-sm text-gray-700 font-medium">{fmtPKR(spent)}</td>
                      <td className="px-3 sm:px-4 py-4 text-xs text-gray-400 whitespace-nowrap">{fmtDate(s.createdAt)}</td>
                      <td className="px-3 sm:px-4 py-4"><StatusPill status={s.status} /></td>
                      <td className="px-3 sm:px-4 py-4">
                        <div className="flex items-center gap-1">
                          <Btn size="sm" variant="secondary" onClick={() => setDetail(s)} className="text-xs"><Eye size={13} /> View</Btn>
                          <Btn size="sm" variant={s.status === "suspended" ? "success" : "danger"} onClick={() => handleToggle(s)} className="text-xs hidden sm:inline-flex">
                            {s.status === "suspended" ? "Reactivate" : "Suspend"}
                          </Btn>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <StudentDetailModal student={detail} onClose={() => setDetail(null)} onToggleStatus={handleToggle} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE: INSTRUCTORS
// ─────────────────────────────────────────────────────────────────────────────

function InstructorDetailModal({ instructor, onClose, onToggleStatus }) {
  if (!instructor) return null;
  return (
    <Modal open={Boolean(instructor)} onClose={onClose} maxWidth="max-w-xl">
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <Avatar name={instructor.name} size={48} src={instructor.avatar} />
            <div>
              <p className="font-bold text-gray-900">{instructor.name}</p>
              <p className="text-sm text-gray-500">{instructor.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer"><X size={20} /></button>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-gray-900">{instructor.courses?.length || 0}</p>
            <p className="text-xs text-gray-500">Courses</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-gray-900">{fmtNum(instructor.totalStudents)}</p>
            <p className="text-xs text-gray-500">Students</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-gray-900">{fmtMoney(instructor.totalRevenue)}</p>
            <p className="text-xs text-gray-500">Revenue</p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <StatusPill status={instructor.status} />
          <Btn size="sm" variant={instructor.status === "suspended" ? "success" : "danger"} onClick={() => onToggleStatus(instructor)}>
            {instructor.status === "suspended" ? <><RotateCcw size={14} /> Reactivate</> : <><Ban size={14} /> Suspend</>}
          </Btn>
        </div>

        <h4 className="text-sm font-bold text-gray-800 mb-2">Courses ({instructor.courses?.length || 0})</h4>
        {!instructor.courses || instructor.courses.length === 0 ? (
          <p className="text-sm text-gray-400">No courses yet.</p>
        ) : (
          <div className="space-y-2">
            {instructor.courses.map((c) => (
              <div key={c._id} className="flex items-center justify-between gap-2 border border-gray-100 rounded-lg px-3 py-2.5">
                <p className="text-sm font-semibold text-gray-800 truncate">{c.title}</p>
                <span className="text-xs text-gray-500 whitespace-nowrap">{fmtNum(c.studentsEnrolled)} students</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}

function InstructorsPage({ instructors, loading, setUserStatus, toast }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [detail, setDetail] = useState(null);

  const filtered = useMemo(() => instructors.filter((i) => {
    const matchSearch = (i.name || "").toLowerCase().includes(search.toLowerCase()) || (i.email || "").toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || (i.status || "active") === filter;
    return matchSearch && matchFilter;
  }), [instructors, search, filter]);

  async function handleToggle(instructor) {
    const next = instructor.status === "suspended" ? "active" : "suspended";
    try {
      await setUserStatus(instructor._id, next);
      toast(next === "suspended" ? "Instructor suspended." : "Instructor reactivated.", "success");
      setDetail((d) => (d && d._id === instructor._id ? { ...d, status: next } : d));
    } catch { toast("Could not update instructor status.", "error"); }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">Instructors</h2>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{instructors.length} instructors on the platform</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email…"
            className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition" />
        </div>
        <div className="flex gap-1.5">
          {["all", "active", "suspended"].map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs font-semibold transition whitespace-nowrap ${filter === s ? "bg-amber-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? <div className="text-center py-16 text-gray-400">Loading instructors…</div>
      : filtered.length === 0 ? <EmptyState icon="🔍" title="No instructors found" body="Try a different search or filter." />
      : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Instructor", "Courses", "Students", "Revenue", "Status", "Actions"].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 sm:px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((i) => (
                  <tr key={i._id} className="hover:bg-gray-50 transition">
                    <td className="px-3 sm:px-4 py-4">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <Avatar name={i.name} size={34} src={i.avatar} />
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-semibold text-gray-800 truncate max-w-[140px] sm:max-w-[200px]">{i.name}</p>
                          <p className="text-xs text-gray-400 truncate max-w-[140px] sm:max-w-[200px]">{i.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-4 text-xs sm:text-sm text-gray-700 font-medium">{i.courses?.length ?? i.totalCourses ?? 0}</td>
                    <td className="px-3 sm:px-4 py-4 text-xs sm:text-sm text-gray-700 font-medium">{fmtNum(i.totalStudents)}</td>
                    <td className="px-3 sm:px-4 py-4 text-xs sm:text-sm text-gray-700 font-medium">{fmtMoney(i.totalRevenue)}</td>
                    <td className="px-3 sm:px-4 py-4"><StatusPill status={i.status} /></td>
                    <td className="px-3 sm:px-4 py-4">
                      <div className="flex items-center gap-1">
                        <Btn size="sm" variant="secondary" onClick={() => setDetail(i)} className="text-xs"><Eye size={13} /> View</Btn>
                        <Btn size="sm" variant={i.status === "suspended" ? "success" : "danger"} onClick={() => handleToggle(i)} className="text-xs hidden sm:inline-flex">
                          {i.status === "suspended" ? "Reactivate" : "Suspend"}
                        </Btn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <InstructorDetailModal instructor={detail} onClose={() => setDetail(null)} onToggleStatus={handleToggle} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE: COURSES (platform-wide moderation)
// ─────────────────────────────────────────────────────────────────────────────

function CoursesPage({ courses, loading, setCourseStatus, toast }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => courses.filter((c) =>
    (c.title || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.instructor?.name || "").toLowerCase().includes(search.toLowerCase())
  ), [courses, search]);

  async function handleToggle(course) {
    const next = course.status === "published" ? "draft" : "published";
    try {
      await setCourseStatus(course._id, next);
      toast(next === "published" ? "Course published." : "Course unpublished.", "success");
    } catch { toast("Could not update course status.", "error"); }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">Courses</h2>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{courses.length} courses across every instructor</p>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by course or instructor…"
          className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition" />
      </div>

      {loading ? <div className="text-center py-16 text-gray-400">Loading courses…</div>
      : filtered.length === 0 ? <EmptyState icon="🔍" title="No courses found" body="Try a different search." />
      : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Course", "Instructor", "Students", "Revenue", "Status", "Actions"].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 sm:px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((c) => (
                  <tr key={c._id} className="hover:bg-gray-50 transition">
                    <td className="px-3 sm:px-4 py-4">
                      <p className="text-xs sm:text-sm font-semibold text-gray-800 truncate max-w-[160px] sm:max-w-[240px]">{c.title}</p>
                      <p className="text-xs text-gray-400">{c.category}</p>
                    </td>
                    <td className="px-3 sm:px-4 py-4 text-xs sm:text-sm text-gray-700">{c.instructor?.name || "—"}</td>
                    <td className="px-3 sm:px-4 py-4 text-xs sm:text-sm text-gray-700 font-medium">{fmtNum(c.studentsEnrolled)}</td>
                    <td className="px-3 sm:px-4 py-4 text-xs sm:text-sm text-gray-700 font-medium">{fmtMoney(c.revenue)}</td>
                    <td className="px-3 sm:px-4 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${c.status === "published" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
                        {c.status || "draft"}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-4">
                      <div className="flex items-center gap-1">
                        <a href={`/course/${c._id}`} target="_blank" rel="noopener noreferrer">
                          <Btn size="sm" variant="secondary" className="text-xs"><ExternalLink size={13} /> View</Btn>
                        </a>
                        <Btn size="sm" variant={c.status === "published" ? "danger" : "success"} onClick={() => handleToggle(c)} className="text-xs hidden sm:inline-flex">
                          {c.status === "published" ? "Unpublish" : "Publish"}
                        </Btn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export default function SuperAdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile,  setIsMobile]  = useState(typeof window !== "undefined" && window.innerWidth < 768);
  const { toasts, add: toast } = useToast();

  const {
    stats, students, instructors, enrollments, courses, loading,
    verifyEnrollment, rejectEnrollment, setUserStatus, setCourseStatus,
  } = useSuperAdminData();

  React.useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) setCollapsed(false);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Route-level guard — belt-and-braces alongside whatever guard wraps
  // /superadmin/* in the main router (see SUPERADMIN_SETUP.md). Uses
  // role: "admin" to match the enum already defined on the real User model
  // in server.js (["student","instructor","admin"]) — no schema migration
  // needed for a new "superadmin" value.
  if (user && user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  const sidebarWidth = isMobile ? 0 : collapsed ? 64 : 230;
  const pendingCount = stats?.pendingVerifications ?? enrollments.filter((e) => e.status === "pending").length;

  return (
    <>
      <style>{`* { box-sizing: border-box; } html, body { overflow-x: hidden; }`}</style>

      <Sidebar admin={user} collapsed={collapsed} setCollapsed={setCollapsed} isMobile={isMobile} pendingCount={pendingCount} />
      <TopBar admin={user} sidebarWidth={sidebarWidth} isMobile={isMobile} onMenuClick={() => setCollapsed(false)} />

      <Layout sidebarWidth={sidebarWidth} isMobile={isMobile}>
        <Routes>
          <Route index element={
            <OverviewPage stats={stats} loadingStats={loading.stats} enrollments={enrollments} students={students} navigate={navigate} />
          } />
          <Route path="verifications" element={
            <VerificationsPage enrollments={enrollments} loading={loading.enrollments}
              verifyEnrollment={verifyEnrollment} rejectEnrollment={rejectEnrollment} toast={toast} />
          } />
          <Route path="students" element={
            <StudentsPage students={students} loading={loading.students} setUserStatus={setUserStatus} toast={toast} />
          } />
          <Route path="instructors" element={
            <InstructorsPage instructors={instructors} loading={loading.instructors} setUserStatus={setUserStatus} toast={toast} />
          } />
          <Route path="courses" element={
            <CoursesPage courses={courses} loading={loading.courses} setCourseStatus={setCourseStatus} toast={toast} />
          } />
          <Route path="theme" element={
            <ThemeEditorPage toast={toast} />
          } />
          <Route path="*" element={<Navigate to="" replace />} />
        </Routes>
      </Layout>

      <ToastContainer toasts={toasts} />
    </>
  );
}
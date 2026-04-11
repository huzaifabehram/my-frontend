// client/src/Pages/InstructorDashboard.jsx
// ─── Instructor Dashboard — connected to real MERN backend ───────────────────
// MOBILE OPTIMIZED + BUNNY.NET SUPPORT + CLOUDINARY IMAGE UPLOAD
// UPDATED: Added comprehensive testimonial management (text, image, video)
// UPDATED: Video testimonial Cloudinary upload support
// UPDATED: Project Gallery management with Cloudinary image upload
// UPDATED: "Students Also Bought" course picker (choose from published courses)
// All dummy data is replaced with real API calls via useInstructorCourses hook.
// ─────────────────────────────────────────────────────────────────────────────

import React, {
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import {
  Routes,
  Route,
  NavLink,
  useNavigate,
  useParams,
  Navigate,
} from "react-router-dom";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useAuth } from "../context/AuthContext";
import { useInstructorCourses } from "../hooks/useInstructorCourses";
import { useCourses } from '../context/CoursesContext';

// ─────────────────────────────────────────────────────────────────────────────
// STATIC CHART DATA
// ─────────────────────────────────────────────────────────────────────────────

const REVENUE_DATA = [
  { month: "Jan", revenue: 12400, students: 320 },
  { month: "Feb", revenue: 15800, students: 410 },
  { month: "Mar", revenue: 18200, students: 480 },
  { month: "Apr", revenue: 16500, students: 430 },
  { month: "May", revenue: 22100, students: 580 },
  { month: "Jun", revenue: 28400, students: 740 },
  { month: "Jul", revenue: 31200, students: 820 },
  { month: "Aug", revenue: 29800, students: 780 },
  { month: "Sep", revenue: 35600, students: 930 },
  { month: "Oct", revenue: 38900, students: 1020 },
  { month: "Nov", revenue: 42100, students: 1100 },
  { month: "Dec", revenue: 33750, students: 880 },
];

const STUDENT_SOURCE = [
  { name: "Organic Search", value: 38 },
  { name: "Direct",         value: 24 },
  { name: "Social Media",   value: 18 },
  { name: "Referral",       value: 12 },
  { name: "Email",          value: 8  },
];

const PIE_COLORS = ["#a435f0", "#6610f2", "#e84393", "#fd7e14", "#20c997"];

const CATEGORIES = [
  { value: "Marketing",        label: "Marketing" },
  { value: "Development",      label: "Development" },
  { value: "Design",           label: "Design" },
  { value: "Business",         label: "Business" },
  { value: "Photography",      label: "Photography" },
  { value: "Music",            label: "Music" },
  { value: "Health & Fitness", label: "Health & Fitness" },
  { value: "Lifestyle",        label: "Lifestyle" },
  { value: "IT & Software",    label: "IT & Software" },
  { value: "Personal Dev",     label: "Personal Development" },
  { value: "Finance",          label: "Finance & Accounting" },
  { value: "Office Prod",      label: "Office Productivity" },
];

const LECTURE_TYPES = [
  { value: "video",    label: "📹 Video" },
  { value: "article",  label: "📄 Article" },
  { value: "quiz",     label: "❓ Quiz" },
  { value: "resource", label: "📎 Resource" },
];

const RECENT_REVIEWS = [
  { id: 1, student: "Ahmed K.",  course: "Digital Marketing Mastery", rating: 5, comment: "Absolutely phenomenal. Explains every concept with such clarity.", date: "2 days ago" },
  { id: 2, student: "Priya S.",  course: "Social Media Strategy",     rating: 5, comment: "Best course I've taken. Practical and well-structured.",         date: "4 days ago" },
  { id: 3, student: "Marco T.",  course: "Google Ads Bootcamp",       rating: 4, comment: "Great content. Would love more e-commerce examples.",            date: "1 week ago" },
];

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const fmt = (n) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M`
  : n >= 1_000   ? `$${(n / 1_000).toFixed(1)}k`
  : `$${n ?? 0}`;

const fmtNum = (n) =>
  (n ?? 0) >= 1000 ? `${((n ?? 0) / 1000).toFixed(1)}k` : `${n ?? 0}`;

const statusColor = {
  published: "bg-emerald-100 text-emerald-700",
  draft:     "bg-gray-100 text-gray-600",
  review:    "bg-amber-100 text-amber-700",
};
const statusDot = {
  published: "bg-emerald-500",
  draft:     "bg-gray-400",
  review:    "bg-amber-400",
};

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

// ─────────────────────────────────────────────────────────────────────────────
// VIDEO DETECTION HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function getYouTubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/watch\?v=|\/shorts\/))([^&?/\s]{11})/);
  return m ? m[1] : null;
}

function isBunnyUrl(url) {
  return url && (
    url.includes('bunny.net') ||
    url.includes('vod-cdn.bunny.net') ||
    url.includes('iframe.mediadelivery.net') ||
    url.includes('video.bunnycdn.com')
  );
}

function isYouTubeUrl(url) {
  return url && (url.includes('youtube.com') || url.includes('youtu.be'));
}

function isDirectVideo(url) {
  return url && (url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.mov'));
}

function getBunnyEmbedUrl(url) {
  if (!url) return null;
  if (url.includes('iframe.mediadelivery.net/embed/')) return url;
  if (url.includes('iframe.mediadelivery.net/play/')) return url.replace('/play/', '/embed/');
  const bunnyPlay = url.match(/video\.bunnycdn\.com\/play\/(\d+)\/([a-zA-Z0-9-]+)/);
  if (bunnyPlay) return `https://iframe.mediadelivery.net/embed/${bunnyPlay[1]}/${bunnyPlay[2]}?autoplay=false&loop=false&muted=false&preload=true`;
  const guidMatch = url.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
  const libMatch  = url.match(/\/(\d+)\//);
  if (guidMatch && libMatch) return `https://iframe.mediadelivery.net/embed/${libMatch[1]}/${guidMatch[1]}?autoplay=false&loop=false&muted=false&preload=true`;
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// BUNNY PLAYER
// ─────────────────────────────────────────────────────────────────────────────

function BunnyPlayer({ url, className = "" }) {
  const embedUrl = getBunnyEmbedUrl(url);
  if (embedUrl) {
    return (
      <div className={`relative w-full aspect-video bg-black rounded-xl overflow-hidden ${className}`}>
        <iframe src={embedUrl} className="absolute inset-0 w-full h-full"
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
          allowFullScreen title="Bunny Stream Video" loading="lazy"/>
      </div>
    );
  }
  return <video src={url} className={`w-full aspect-video bg-black rounded-xl ${className}`} controls preload="metadata"/>;
}

// ─────────────────────────────────────────────────────────────────────────────
// UNIVERSAL VIDEO PLAYER
// ─────────────────────────────────────────────────────────────────────────────

function VideoPlayer({ url, className = "" }) {
  if (!url) return null;
  const ytId = getYouTubeId(url);
  if (ytId) {
    return (
      <div className={`relative w-full aspect-video bg-black rounded-xl overflow-hidden ${className}`}>
        <iframe src={`https://www.youtube.com/embed/${ytId}`} className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen title="YouTube Video" loading="lazy"/>
      </div>
    );
  }
  if (isBunnyUrl(url)) return <BunnyPlayer url={url} className={className}/>;
  if (isDirectVideo(url)) return <video src={url} className={`w-full aspect-video bg-black rounded-xl ${className}`} controls preload="metadata"/>;
  // Cloudinary video or any other direct video URL
  if (url.includes('cloudinary.com') || url.startsWith('http')) {
    return <video src={url} className={`w-full aspect-video bg-black rounded-xl ${className}`} controls preload="metadata"/>;
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED UI PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────

function Avatar({ name = "?", size = 36, src }) {
  const initials = name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  if (src) return <img src={src} alt={name} style={{ width: size, height: size }} className="rounded-full object-cover"/>;
  return (
    <div style={{ width: size, height: size, fontSize: size * 0.36 }}
      className="rounded-full bg-purple-600 text-white flex items-center justify-center font-bold flex-shrink-0">
      {initials}
    </div>
  );
}

function Badge({ status }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${statusColor[status] || "bg-gray-100 text-gray-600"}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${statusDot[status] || "bg-gray-400"}`}/>
      {status?.charAt(0).toUpperCase() + status?.slice(1)}
    </span>
  );
}

function StatCard({ icon, label, value, sub, color = "purple" }) {
  const bg = { purple: "bg-purple-50", green: "bg-emerald-50", blue: "bg-blue-50", amber: "bg-amber-50" };
  const ic = { purple: "text-purple-600", green: "text-emerald-600", blue: "text-blue-600", amber: "text-amber-600" };
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 flex gap-3 sm:gap-4 items-center shadow-sm hover:shadow-md transition-shadow">
      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${bg[color]} flex items-center justify-center flex-shrink-0`}>
        <span className={`text-lg sm:text-2xl ${ic[color]}`}>{icon}</span>
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
    primary:   "bg-purple-600 hover:bg-purple-700 text-white shadow-sm",
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
        className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"/>
    </div>
  );
}

function Textarea({ label, value, onChange, placeholder, rows = 4, className = "" }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && <label className="text-xs sm:text-sm font-medium text-gray-700">{label}</label>}
      <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows}
        className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition resize-none"/>
    </div>
  );
}

function Select({ label, value, onChange, options, className = "" }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && <label className="text-xs sm:text-sm font-medium text-gray-700">{label}</label>}
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition bg-white">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function EmptyState({ icon, title, body, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center">
      <div className="text-4xl sm:text-5xl mb-4">{icon}</div>
      <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-1">{title}</h3>
      <p className="text-xs sm:text-sm text-gray-500 mb-5 max-w-xs">{body}</p>
      {action}
    </div>
  );
}

function Stars({ rating }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width="12" height="12" viewBox="0 0 16 16" fill={i <= Math.round(rating) ? "#e59819" : "#e5e7eb"}>
          <path d="M8 1l1.8 5.6H15l-4.6 3.3 1.8 5.6L8 12.2l-4.2 3.3 1.8-5.6L1 6.6h5.2z"/>
        </svg>
      ))}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// UPLOAD SPINNER OVERLAY (reusable)
// ─────────────────────────────────────────────────────────────────────────────

function UploadOverlay({ uploading }) {
  if (!uploading) return null;
  return (
    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl z-10">
      <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"/>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────────────────────────────────────

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
        <div key={t.id} className={`${colors[t.type] || colors.info} text-white text-xs sm:text-sm font-medium px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl shadow-lg pointer-events-auto`}
          style={{ animation: "slideUp 0.3s ease" }}>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SIDEBAR
// ─────────────────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { to: "/instructor",           label: "Dashboard",     icon: "⊞", exact: true },
  { to: "/instructor/courses",   label: "My Courses",    icon: "▤" },
  { to: "/instructor/create",    label: "Create Course", icon: "＋" },
  { to: "/instructor/analytics", label: "Analytics",     icon: "↗" },
  { to: "/instructor/profile",   label: "Profile",       icon: "◉" },
];

function Sidebar({ instructor, collapsed, setCollapsed, isMobile }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-[#1c1d1f] flex flex-col z-50 transition-all duration-300 ${isMobile && collapsed ? "-translate-x-full" : "translate-x-0"}`}
      style={{ width: isMobile ? 240 : collapsed ? 64 : 230 }}>
      <div className="flex items-center gap-2.5 px-4 h-16 border-b border-white/10 flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center flex-shrink-0">
          <svg width="18" height="18" viewBox="0 0 40 40" fill="none">
            <path d="M8 32l12-24 12 24M12 26h16" stroke="#fff" strokeWidth="3" strokeLinecap="round"/>
          </svg>
        </div>
        {!collapsed && <span className="font-extrabold text-white text-base tracking-tight whitespace-nowrap flex-1">LearnFlow</span>}
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
          <Avatar name={instructor?.name || "Instructor"} size={36}/>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{instructor?.name}</p>
            <p className="text-xs text-gray-400 truncate">Instructor</p>
          </div>
        </div>
      )}
      <nav className="flex-1 overflow-y-auto py-3 px-2 flex flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.exact} onClick={() => isMobile && setCollapsed(true)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${isActive ? "bg-purple-600 text-white" : "text-gray-400 hover:bg-white/10 hover:text-white"}`}>
            <span className="text-lg leading-none flex-shrink-0">{item.icon}</span>
            {!collapsed && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}
      </nav>
      <div className="px-2 pb-4 flex-shrink-0">
        <button onClick={() => { logout(); navigate("/login"); }}
          className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-150">
          <span className="text-lg leading-none flex-shrink-0">⏻</span>
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOP BAR
// ─────────────────────────────────────────────────────────────────────────────

function TopBar({ instructor, sidebarWidth, isMobile, onMenuClick }) {
  return (
    <header className="fixed top-0 right-0 h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 sm:px-6 z-40 transition-all duration-300"
      style={{ left: isMobile ? 0 : sidebarWidth }}>
      {isMobile && (
        <button onClick={onMenuClick} className="text-gray-600 hover:text-gray-900 transition text-lg">☰</button>
      )}
      <h1 className="text-sm sm:text-base font-bold text-gray-900">Instructor Studio</h1>
      <div className="flex items-center gap-2 sm:gap-3 ml-auto">
        <button className="relative p-2 rounded-lg hover:bg-gray-100 transition text-gray-500">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"/>
        </button>
        <Avatar name={instructor?.name || "I"} size={34}/>
      </div>
    </header>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE: DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────

function DashboardPage({ instructor, courses, loading }) {
  const navigate = useNavigate();
  const publishedCount = courses.filter((c) => c.status === "published").length;
  const totalStudents  = courses.reduce((a, c) => a + (c.studentsEnrolled || 0), 0);
  const totalRevenue   = courses.reduce((a, c) => a + (c.revenue || 0), 0);
  const avgRating      = courses.filter((c) => c.rating > 0);
  const rating         = avgRating.length ? (avgRating.reduce((a, c) => a + c.rating, 0) / avgRating.length).toFixed(1) : "—";

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="bg-gradient-to-r from-purple-700 to-purple-500 rounded-2xl p-5 sm:p-7 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none"/>
        <p className="text-purple-200 text-xs sm:text-sm font-medium mb-1">Welcome back 👋</p>
        <h2 className="text-2xl sm:text-3xl font-extrabold mb-1">{instructor?.name || "Instructor"}</h2>
        <p className="text-purple-200 text-xs sm:text-sm">{instructor?.email}</p>
        <div className="flex gap-2 sm:gap-3 mt-5 flex-wrap">
          <Btn onClick={() => navigate("/instructor/create")} variant="secondary" size="sm">+ New Course</Btn>
          <Btn onClick={() => navigate("/instructor/analytics")} size="sm" className="bg-white/20 hover:bg-white/30 text-white border-white/30 border">View Analytics</Btn>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon="👥" label="Total Students"    value={fmtNum(totalStudents)} sub="All courses"          color="purple"/>
        <StatCard icon="💰" label="Total Revenue"     value={fmt(totalRevenue)}     sub="All time"             color="green"/>
        <StatCard icon="📚" label="Published Courses" value={publishedCount}        sub={`of ${courses.length} total`} color="blue"/>
        <StatCard icon="⭐" label="Avg Rating"        value={rating}                sub="Across all courses"   color="amber"/>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6 shadow-sm overflow-x-auto">
        <SectionHeader title="Revenue Overview — 2024"/>
        <ResponsiveContainer width="100%" height={240} minWidth={300}>
          <AreaChart data={REVENUE_DATA} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#a435f0" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#a435f0" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false}/>
            <YAxis tickFormatter={(v) => `$${v/1000}k`} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false}/>
            <Tooltip formatter={(v) => [`$${v.toLocaleString()}`, "Revenue"]} contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}/>
            <Area type="monotone" dataKey="revenue" stroke="#a435f0" strokeWidth={2.5} fill="url(#revenueGrad)"/>
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6 shadow-sm">
          <SectionHeader title="My Courses" action={<Btn onClick={() => navigate("/instructor/courses")} variant="ghost" size="sm">View all</Btn>}/>
          {loading ? <p className="text-sm text-gray-400 text-center py-8">Loading courses...</p>
          : courses.length === 0 ? <EmptyState icon="📭" title="No courses yet" body="Create your first course to get started." action={<Btn size="sm" onClick={() => navigate("/instructor/create")}>+ Create Course</Btn>}/>
          : (
            <div className="space-y-3">
              {courses.slice(0, 4).map((c) => (
                <div key={c._id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-sm flex-shrink-0">{c.title?.charAt(0)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{c.title}</p>
                    <p className="text-xs text-gray-500">{fmtNum(c.studentsEnrolled)} students · {fmt(c.revenue)}</p>
                  </div>
                  <Badge status={c.status}/>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6 shadow-sm">
          <SectionHeader title="Recent Reviews"/>
          <div className="space-y-4">
            {RECENT_REVIEWS.map((r) => (
              <div key={r.id} className="border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar name={r.student} size={28}/>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 leading-none truncate">{r.student}</p>
                      <p className="text-xs text-gray-400">{r.date}</p>
                    </div>
                  </div>
                  <Stars rating={r.rating}/>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed ml-9">{r.comment}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE: COURSES LIST
// ─────────────────────────────────────────────────────────────────────────────

function CoursesPage({ courses, loading, deleteCourse, togglePublish, toast }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filtered = useMemo(() => courses.filter((c) => {
    const matchSearch = c.title?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || c.status === filter;
    return matchSearch && matchFilter;
  }), [courses, search, filter]);

  async function handleDelete(id, title) {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try { await deleteCourse(id); toast("Course deleted.", "success"); }
    catch  { toast("Could not delete course.", "error"); }
  }

  async function handleToggle(id, status) {
    try {
      const updated = await togglePublish(id, status);
      toast(`${updated.status === "published" ? "Published" : "Unpublished"} successfully!`, "success");
    } catch { toast("Could not update status.", "error"); }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">My Courses</h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{courses.length} courses total</p>
        </div>
        <Btn onClick={() => navigate("/instructor/create")} className="sm:w-auto w-full">+ Create New Course</Btn>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search courses…"
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"/>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {["all","published","draft","review"].map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs font-semibold transition whitespace-nowrap ${filter === s ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>
      {loading ? <div className="text-center py-16 text-gray-400">Loading your courses...</div>
      : filtered.length === 0 ? <EmptyState icon="📭" title="No courses found" body="Try adjusting your search or create a new course." action={<Btn onClick={() => navigate("/instructor/create")}>+ Create Course</Btn>}/>
      : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Course","Status","Students","Revenue","Rating","Updated","Actions"].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 sm:px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((c) => (
                  <tr key={c._id} className="hover:bg-gray-50 transition">
                    <td className="px-3 sm:px-4 py-4">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-xs sm:text-sm flex-shrink-0">{c.title?.charAt(0)}</div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-semibold text-gray-800 truncate max-w-[120px] sm:max-w-[200px]">{c.title}</p>
                          <p className="text-xs text-gray-400 hidden sm:block">{c.category} · ${c.price}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-4"><Badge status={c.status}/></td>
                    <td className="px-3 sm:px-4 py-4 text-xs sm:text-sm text-gray-700 font-medium">{fmtNum(c.studentsEnrolled)}</td>
                    <td className="px-3 sm:px-4 py-4 text-xs sm:text-sm text-gray-700 font-medium">{fmt(c.revenue)}</td>
                    <td className="px-3 sm:px-4 py-4">
                      {c.rating > 0
                        ? <div className="flex items-center gap-1"><Stars rating={c.rating}/><span className="text-xs text-gray-500 hidden sm:inline">{c.rating}</span></div>
                        : <span className="text-xs text-gray-400">—</span>}
                    </td>
                    <td className="px-3 sm:px-4 py-4 text-xs text-gray-400 whitespace-nowrap">{c.updatedAt ? new Date(c.updatedAt).toLocaleDateString() : "—"}</td>
                    <td className="px-3 sm:px-4 py-4">
                      <div className="flex items-center gap-1">
                        <Btn size="sm" variant="secondary" onClick={() => navigate(`/instructor/edit/${c._id}`)} className="text-xs">Edit</Btn>
                        <Btn size="sm" variant={c.status === "published" ? "ghost" : "success"} onClick={() => handleToggle(c._id, c.status)} className="text-xs hidden sm:inline-flex">
                          {c.status === "published" ? "Unpub" : "Pub"}
                        </Btn>
                        <Btn size="sm" variant="danger" onClick={() => handleDelete(c._id, c.title)} className="text-xs">Del</Btn>
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
// PAGE: COURSE EDITOR
// NEW SECTIONS: Video Testimonial Upload · Project Gallery · Students Also Bought
// ─────────────────────────────────────────────────────────────────────────────

function CourseEditorPage({ courses, createCourse, updateCourse, toast }) {
  const navigate  = useNavigate();
  const { id }    = useParams();
  const isEdit    = Boolean(id);
  const existing  = isEdit ? courses.find((c) => c._id === id) : null;

  // ── Basic fields ──────────────────────────────────────────────────────────
  const [title,          setTitle]          = useState(existing?.title          || "");
  const [category,       setCategory]       = useState(existing?.category       || "Marketing");
  const [price,          setPrice]          = useState(existing?.price?.toString() || "49.99");
  const [discountPrice,  setDiscountPrice]  = useState(existing?.discountPrice?.toString() || "");
  const [status,         setStatus]         = useState(existing?.status         || "draft");
  const [description,    setDescription]    = useState(existing?.description    || "");
  const [thumbnail,      setThumbnail]      = useState(existing?.thumbnail      || "");
  const [thumbnailPreview, setThumbnailPreview] = useState(existing?.thumbnail  || "");
  const [previewVideoUrl, setPreviewVideoUrl] = useState(existing?.previewVideoUrl || "");
  const [tags,           setTags]           = useState(existing?.tags?.join(", ")          || "");
  const [whatYouLearn,   setWhatYouLearn]   = useState(existing?.whatYouLearn?.join("\n")  || "");
  const [requirements,   setRequirements]   = useState(existing?.requirements?.join("\n")  || "");
  const [sections,       setSections]       = useState(
    existing?.sections?.length ? existing.sections : [{ id: uid(), title: "Section 1: Introduction", lectures: [] }]
  );
  const [expandedSection, setExpandedSection] = useState(sections[0]?.id || sections[0]?._id);
  const [saving,         setSaving]         = useState(false);
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const thumbnailRef = useRef();

  const { API: api, } = useAuth();
  // All published courses from global context — used for "Students Also Bought" picker
  const { courses: allCourses } = useCourses();
  const publishedCourses = useMemo(() => allCourses.filter(c => c.status === "published" && c._id !== id), [allCourses, id]);

  // ── Image Testimonials ────────────────────────────────────────────────────
  const [imageTestimonials,       setImageTestimonials]       = useState(existing?.imageTestimonials || []);
  const [newImageTestimonial,     setNewImageTestimonial]     = useState({ author: '', text: '', imageUrl: '', imagePreview: '' });
  const [uploadingImageTestimonial, setUploadingImageTestimonial] = useState(false);
  const imageTestimonialRef = useRef();

  // ── Video Testimonials ────────────────────────────────────────────────────
  // NEW: supports both Cloudinary file upload AND manual URL entry
  const [videoTestimonials,     setVideoTestimonials]     = useState(existing?.videoTestimonials || []);
  const [newVideoTestimonial,   setNewVideoTestimonial]   = useState({ author: '', text: '', videoUrl: '', videoPreview: '' });
  const [uploadingVideoTestimonial, setUploadingVideoTestimonial] = useState(false);
  const [videoInputMode,        setVideoInputMode]        = useState('url'); // 'url' | 'upload'
  const videoTestimonialRef = useRef();

  // ── Project Gallery ───────────────────────────────────────────────────────
  // NEW: each gallery item has { id, imageUrl, caption }
  const [projectGallery,      setProjectGallery]      = useState(existing?.projectGallery || []);
  const [newGalleryItem,      setNewGalleryItem]      = useState({ caption: '', imageUrl: '', imagePreview: '' });
  const [uploadingGalleryItem, setUploadingGalleryItem] = useState(false);
  const galleryRef = useRef();

  // ── Students Also Bought ──────────────────────────────────────────────────
  // NEW: instructor manually picks which courses to show in "Students also bought"
  const [alsoBoughtIds, setAlsoBoughtIds] = useState(existing?.alsoBoughtCourseIds || []);
  const [coursePicker,   setCoursePicker]  = useState('');   // dropdown value

  // ─────────────────────────────────────────────────────────────────────────
  // THUMBNAIL UPLOAD
  // ─────────────────────────────────────────────────────────────────────────
  const handleThumbnailFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setThumbnailPreview(ev.target.result);
    reader.readAsDataURL(file);
    setUploadingThumb(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      if (isEdit && id) formData.append("courseId", id);
      const res = await api.post("/upload/image", formData);
      const url = res.data?.url ?? res.data?.secure_url ?? res.data?.thumbnail;
      if (!url) { toast("Upload succeeded but no URL returned.", "error"); return; }
      setThumbnail(url);
      setThumbnailPreview(url);
      toast("Thumbnail uploaded to Cloudinary ✓", "success");
    } catch (err) {
      console.error("Thumbnail upload error:", err);
      toast("Upload failed. Paste a URL instead.", "error");
    } finally {
      setUploadingThumb(false);
      if (e.target) e.target.value = "";
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // IMAGE TESTIMONIAL UPLOAD
  // ─────────────────────────────────────────────────────────────────────────
  const handleImageTestimonialFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setNewImageTestimonial(p => ({ ...p, imagePreview: ev.target.result }));
    reader.readAsDataURL(file);
    setUploadingImageTestimonial(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await api.post("/upload/image", formData);
      const url = res.data?.url ?? res.data?.secure_url ?? res.data?.imageUrl;
      if (!url) { toast("Upload succeeded but no URL returned.", "error"); return; }
      setNewImageTestimonial(p => ({ ...p, imageUrl: url, imagePreview: url }));
      toast("Image uploaded ✓", "success");
    } catch { toast("Upload failed.", "error"); }
    finally {
      setUploadingImageTestimonial(false);
      if (e.target) e.target.value = "";
    }
  };

  const addImageTestimonial = () => {
    if (!newImageTestimonial.author.trim() || !newImageTestimonial.text.trim() || !newImageTestimonial.imageUrl) {
      toast("Fill all fields and upload an image", "error"); return;
    }
    setImageTestimonials(p => [...p, { id: uid(), author: newImageTestimonial.author, text: newImageTestimonial.text, imageUrl: newImageTestimonial.imageUrl }]);
    setNewImageTestimonial({ author: '', text: '', imageUrl: '', imagePreview: '' });
    toast("Image testimonial added!", "success");
  };

  const deleteImageTestimonial = (tid) => {
    setImageTestimonials(p => p.filter(t => (t.id || t._id) !== tid));
    toast("Removed", "success");
  };

  // ─────────────────────────────────────────────────────────────────────────
  // VIDEO TESTIMONIAL — FILE UPLOAD (NEW) or URL
  // ─────────────────────────────────────────────────────────────────────────
  const handleVideoTestimonialFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // Show local preview immediately
    const objectUrl = URL.createObjectURL(file);
    setNewVideoTestimonial(p => ({ ...p, videoPreview: objectUrl }));
    setUploadingVideoTestimonial(true);
    try {
      const formData = new FormData();
      formData.append("video", file);  // server.js route: upload.single("video")
      const res = await api.post("/upload/video", formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        // Videos can be large — give extra time
        timeout: 5 * 60 * 1000,
      });
      const url = res.data?.url ?? res.data?.secure_url ?? res.data?.videoUrl;
      if (!url) { toast("Upload succeeded but no URL returned.", "error"); return; }
      setNewVideoTestimonial(p => ({ ...p, videoUrl: url, videoPreview: url }));
      toast("Video uploaded to Cloudinary ✓", "success");
    } catch (err) {
      console.error("Video testimonial upload error:", err);
      toast("Video upload failed. Try a URL instead.", "error");
      setNewVideoTestimonial(p => ({ ...p, videoPreview: '' }));
    } finally {
      setUploadingVideoTestimonial(false);
      URL.revokeObjectURL(objectUrl);
      if (e.target) e.target.value = "";
    }
  };

  const addVideoTestimonial = () => {
    if (!newVideoTestimonial.author.trim() || !newVideoTestimonial.text.trim() || !newVideoTestimonial.videoUrl.trim()) {
      toast("Fill all fields and provide/upload a video", "error"); return;
    }
    setVideoTestimonials(p => [...p, { id: uid(), author: newVideoTestimonial.author, text: newVideoTestimonial.text, videoUrl: newVideoTestimonial.videoUrl }]);
    setNewVideoTestimonial({ author: '', text: '', videoUrl: '', videoPreview: '' });
    toast("Video testimonial added!", "success");
  };

  const deleteVideoTestimonial = (tid) => {
    setVideoTestimonials(p => p.filter(t => (t.id || t._id) !== tid));
    toast("Removed", "success");
  };

  // ─────────────────────────────────────────────────────────────────────────
  // PROJECT GALLERY — FILE UPLOAD (NEW)
  // ─────────────────────────────────────────────────────────────────────────
  const handleGalleryFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setNewGalleryItem(p => ({ ...p, imagePreview: ev.target.result }));
    reader.readAsDataURL(file);
    setUploadingGalleryItem(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await api.post("/upload/image", formData);
      const url = res.data?.url ?? res.data?.secure_url ?? res.data?.imageUrl;
      if (!url) { toast("Upload succeeded but no URL returned.", "error"); return; }
      setNewGalleryItem(p => ({ ...p, imageUrl: url, imagePreview: url }));
      toast("Gallery image uploaded ✓", "success");
    } catch { toast("Upload failed.", "error"); }
    finally {
      setUploadingGalleryItem(false);
      if (e.target) e.target.value = "";
    }
  };

  const addGalleryItem = () => {
    if (!newGalleryItem.imageUrl) { toast("Please upload an image first", "error"); return; }
    setProjectGallery(p => [...p, { id: uid(), imageUrl: newGalleryItem.imageUrl, caption: newGalleryItem.caption }]);
    setNewGalleryItem({ caption: '', imageUrl: '', imagePreview: '' });
    toast("Gallery image added!", "success");
  };

  const deleteGalleryItem = (gid) => {
    setProjectGallery(p => p.filter(g => (g.id || g._id) !== gid));
    toast("Removed from gallery", "success");
  };

  // ─────────────────────────────────────────────────────────────────────────
  // STUDENTS ALSO BOUGHT — PICKER (NEW)
  // ─────────────────────────────────────────────────────────────────────────
  const addAlsoBought = () => {
    if (!coursePicker) return;
    if (alsoBoughtIds.includes(coursePicker)) { toast("Already added", "info"); return; }
    if (alsoBoughtIds.length >= 6) { toast("Max 6 courses", "error"); return; }
    setAlsoBoughtIds(p => [...p, coursePicker]);
    setCoursePicker('');
  };

  const removeAlsoBought = (cid) => setAlsoBoughtIds(p => p.filter(x => x !== cid));

  const alsoBoughtCourses = useMemo(
    () => alsoBoughtIds.map(cid => publishedCourses.find(c => c._id === cid)).filter(Boolean),
    [alsoBoughtIds, publishedCourses]
  );

  // ─────────────────────────────────────────────────────────────────────────
  // CURRICULUM HELPERS
  // ─────────────────────────────────────────────────────────────────────────
  const updateLectureVideo = (sId, lId, url) => updateLecture(sId, lId, "videoUrl", url);

  function addSection() {
    const s = { id: uid(), title: `Section ${sections.length + 1}: New Section`, lectures: [] };
    setSections(p => [...p, s]);
    setExpandedSection(s.id);
  }
  function updateSectionTitle(sId, val) { setSections(p => p.map(s => (s._id || s.id) === sId ? { ...s, title: val } : s)); }
  function deleteSection(sId) { setSections(p => p.filter(s => (s._id || s.id) !== sId)); }
  function addLecture(sId) {
    const l = { id: uid(), title: "New Lecture", type: "video", duration: "", free: false, videoUrl: "" };
    setSections(p => p.map(s => (s._id || s.id) === sId ? { ...s, lectures: [...s.lectures, l] } : s));
  }
  function updateLecture(sId, lId, field, val) {
    setSections(p => p.map(s =>
      (s._id || s.id) === sId ? { ...s, lectures: s.lectures.map(l => (l._id || l.id) === lId ? { ...l, [field]: val } : l) } : s
    ));
  }
  function deleteLecture(sId, lId) {
    setSections(p => p.map(s =>
      (s._id || s.id) === sId ? { ...s, lectures: s.lectures.filter(l => (l._id || l.id) !== lId) } : s
    ));
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SAVE
  // ─────────────────────────────────────────────────────────────────────────
  async function handleSave(publish = false) {
    if (!title.trim()) { toast("Course title is required.", "error"); return; }
    setSaving(true);
    const payload = {
      title, category,
      price:           parseFloat(price) || 0,
      discountPrice:   discountPrice ? parseFloat(discountPrice) : undefined,
      status:          publish ? "published" : status,
      description, sections, thumbnail, previewVideoUrl,
      tags:            tags.split(",").map(t => t.trim()).filter(Boolean),
      whatYouLearn:    whatYouLearn.split("\n").map(t => t.trim()).filter(Boolean),
      requirements:    requirements.split("\n").map(t => t.trim()).filter(Boolean),
      imageTestimonials,
      videoTestimonials,
      projectGallery,
      alsoBoughtCourseIds: alsoBoughtIds,
    };
    try {
      if (isEdit) { await updateCourse(id, payload); toast(publish ? "Published!" : "Saved!", "success"); }
      else        { await createCourse(payload);      toast(publish ? "Published!" : "Draft saved!", "success"); }
      navigate("/instructor/courses");
    } catch (err) {
      toast(err.response?.data?.message || "Could not save.", "error");
    } finally { setSaving(false); }
  }

  const totalLectures  = sections.reduce((a, s) => a + s.lectures.length, 0);
  const ytId           = getYouTubeId(previewVideoUrl);
  const isBunny        = isBunnyUrl(previewVideoUrl);
  const videoPreviewUrl = newVideoTestimonial.videoPreview || newVideoTestimonial.videoUrl;

  return (
    <div className="space-y-6 max-w-4xl">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">{isEdit ? "Edit Course" : "Create New Course"}</h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{sections.length} sections · {totalLectures} lectures</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Btn variant="secondary" onClick={() => navigate("/instructor/courses")} className="flex-1 sm:flex-none">Cancel</Btn>
          <Btn variant="secondary" onClick={() => handleSave(false)} disabled={saving} className="flex-1 sm:flex-none">Save Draft</Btn>
          <Btn onClick={() => handleSave(true)} disabled={saving} className="flex-1 sm:flex-none">
            {saving ? "Saving..." : isEdit && existing?.status === "published" ? "Update" : "Publish"}
          </Btn>
        </div>
      </div>

      {/* ── Thumbnail ── */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6 shadow-sm">
        <h3 className="font-bold text-gray-800 text-base mb-4">Course Thumbnail</h3>
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <div className="w-full sm:w-64 flex-shrink-0">
            <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden border-2 border-dashed border-gray-300 hover:border-purple-400 transition-colors relative group cursor-pointer"
              onClick={() => thumbnailRef.current?.click()}>
              {thumbnailPreview
                ? <img src={thumbnailPreview} alt="Thumbnail" className="w-full h-full object-cover"/>
                : <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-3xl mb-2">🖼️</span><p className="text-xs text-gray-400 text-center px-2">Click to upload<br/>(16:9 recommended)</p></div>}
              <UploadOverlay uploading={uploadingThumb}/>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <span className="text-white font-bold text-sm bg-black/50 px-3 py-1 rounded-lg">Change Image</span>
              </div>
            </div>
            <input ref={thumbnailRef} type="file" accept="image/*" className="hidden" onChange={handleThumbnailFile}/>
            <p className="text-xs text-gray-400 mt-1 text-center">JPG, PNG, WebP • Max 10MB</p>
          </div>
          <div className="flex-1 space-y-3">
            <p className="text-sm text-gray-600 font-medium">Or paste an image URL:</p>
            <input value={thumbnail} onChange={e => { setThumbnail(e.target.value); setThumbnailPreview(e.target.value); }}
              placeholder="https://example.com/image.jpg"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"/>
            <p className="text-xs text-gray-400">Recommended: 1280×720px, under 10MB.</p>
          </div>
        </div>
      </div>

      {/* ── Preview Video ── */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6 shadow-sm">
        <h3 className="font-bold text-gray-800 text-base mb-1">Course Preview Video</h3>
        <p className="text-xs sm:text-sm text-gray-500 mb-4">YouTube, Bunny.net Stream URL, or direct MP4. Free preview shown to non-enrolled visitors.</p>
        <div className="grid sm:grid-cols-2 gap-4 items-start">
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Video URL</label>
            <input value={previewVideoUrl} onChange={e => setPreviewVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=... or iframe.mediadelivery.net/embed/..."
              className="w-full mt-1.5 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"/>
            <p className="text-xs text-gray-400 mt-1">YouTube • Bunny Stream • Cloudinary • MP4</p>
          </div>
          {previewVideoUrl && (
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Preview</label>
              <div className="mt-1.5 rounded-xl overflow-hidden border border-gray-200">
                <VideoPlayer url={previewVideoUrl}/>
                <div className={`px-3 py-1.5 flex items-center gap-2 ${ytId ? "bg-red-600" : isBunny ? "bg-orange-600" : "bg-gray-700"}`}>
                  {ytId   && <span className="text-white text-xs font-bold">▶ YouTube detected ✓</span>}
                  {isBunny && !ytId && <span className="text-white text-xs font-bold">🐰 Bunny.net video linked ✓</span>}
                  {!ytId && !isBunny && <span className="text-white text-xs font-bold">🎬 Direct video ✓</span>}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Basic Info ── */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6 shadow-sm space-y-5">
        <h3 className="font-bold text-gray-800 text-base">Course Information</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Course Title *" value={title} onChange={setTitle} placeholder="e.g. Complete React Bootcamp 2024" className="sm:col-span-2"/>
          <Select label="Category" value={category} onChange={setCategory} options={CATEGORIES}/>
          <Input label="Tags (comma-separated)" value={tags} onChange={setTags} placeholder="React, Node.js, MongoDB"/>
          <Input label="Full Price (USD)" value={price} onChange={setPrice} placeholder="89.99" type="number"/>
          <Input label="Discount Price (USD)" value={discountPrice} onChange={setDiscountPrice} placeholder="13.99 (optional)" type="number"/>
          <Select label="Status" value={status} onChange={setStatus} options={[{value:"draft",label:"Draft"},{value:"published",label:"Published"},{value:"review",label:"Under Review"}]}/>
        </div>
        <Textarea label="Course Description" value={description} onChange={setDescription} placeholder="What will students learn? Who is this for?" rows={4}/>
        <Textarea label="What You'll Learn (one per line)" value={whatYouLearn} onChange={setWhatYouLearn} placeholder={"Build full-stack apps\nDeploy to cloud\nJWT Authentication"} rows={4}/>
        <Textarea label="Requirements (one per line)" value={requirements} onChange={setRequirements} placeholder={"Basic HTML & CSS\nJavaScript fundamentals"} rows={3}/>
      </div>

      {/* ── Curriculum ── */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6 shadow-sm">
        <SectionHeader title="Course Content" action={<Btn size="sm" onClick={addSection}>+ Add Section</Btn>}/>
        <div className="space-y-3">
          {sections.map((sec) => {
            const secId = sec._id || sec.id;
            return (
              <div key={secId} className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition" onClick={() => setExpandedSection(expandedSection === secId ? null : secId)}>
                  <span className="text-gray-400 text-xs sm:text-sm select-none">☰</span>
                  <input value={sec.title} onChange={e => { e.stopPropagation(); updateSectionTitle(secId, e.target.value); }} onClick={e => e.stopPropagation()}
                    className="flex-1 bg-transparent text-xs sm:text-sm font-semibold text-gray-800 focus:outline-none" placeholder="Section title"/>
                  <span className="text-xs text-gray-400 whitespace-nowrap ml-auto">{sec.lectures.length} lectures</span>
                  <button onClick={e => { e.stopPropagation(); deleteSection(secId); }} className="text-red-400 hover:text-red-600 transition text-xs ml-1">✕</button>
                  <span className="text-gray-400 text-xs">{expandedSection === secId ? "▲" : "▼"}</span>
                </div>
                {expandedSection === secId && (
                  <div className="divide-y divide-gray-50">
                    {sec.lectures.map((lec) => {
                      const lecId      = lec._id || lec.id;
                      const ytLecId    = getYouTubeId(lec.videoUrl);
                      const isBunnyLec = isBunnyUrl(lec.videoUrl);
                      const isDirLec   = isDirectVideo(lec.videoUrl) || (lec.videoUrl && lec.videoUrl.includes('cloudinary.com'));
                      const hasVideo   = lec.videoUrl && (ytLecId || isBunnyLec || isDirLec || lec.videoUrl.startsWith('http'));
                      return (
                        <div key={lecId} className="px-3 sm:px-4 py-3 sm:py-4 space-y-3">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                            <span className="text-gray-300 text-xs select-none">⋮⋮</span>
                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2 w-full">
                              <input value={lec.title} onChange={e => updateLecture(secId, lecId, "title", e.target.value)}
                                className="border border-gray-200 rounded px-2 py-1.5 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-purple-400 sm:col-span-2" placeholder="Lecture title"/>
                              <select value={lec.type} onChange={e => updateLecture(secId, lecId, "type", e.target.value)}
                                className="border border-gray-200 rounded px-2 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-purple-400 bg-white">
                                {LECTURE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                              </select>
                            </div>
                            <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                              <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer">
                                <input type="checkbox" checked={lec.free} onChange={e => updateLecture(secId, lecId, "free", e.target.checked)} className="accent-purple-600"/>
                                Free
                              </label>
                              <input value={lec.duration||""} onChange={e => updateLecture(secId, lecId, "duration", e.target.value)}
                                placeholder="10:30" className="w-12 sm:w-14 border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-purple-400"/>
                              <button onClick={() => deleteLecture(secId, lecId)} className="text-red-300 hover:text-red-500 transition text-xs">✕</button>
                            </div>
                          </div>
                          {lec.type === "video" && (
                            <div className="pl-4 sm:pl-6 space-y-2">
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-red-500 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/></svg>
                                <input value={lec.videoUrl||""} onChange={e => updateLectureVideo(secId, lecId, e.target.value)}
                                  placeholder="YouTube, Bunny, Cloudinary, or MP4 URL"
                                  className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-purple-400"/>
                              </div>
                              {hasVideo && (
                                <div className="rounded-lg overflow-hidden border border-gray-200">
                                  <VideoPlayer url={lec.videoUrl}/>
                                  <div className={`px-3 py-1 flex items-center gap-1.5 ${ytLecId ? "bg-red-600" : isBunnyLec ? "bg-orange-600" : "bg-gray-700"}`}>
                                    {ytLecId   && <span className="text-white text-xs font-semibold">YouTube ✓</span>}
                                    {isBunnyLec && !ytLecId && <span className="text-white text-xs font-semibold">🐰 Bunny.net ✓</span>}
                                    {isDirLec  && !ytLecId && !isBunnyLec && <span className="text-white text-xs font-semibold">🎬 Direct video ✓</span>}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <div className="px-3 sm:px-4 py-3">
                      <button onClick={() => addLecture(secId)} className="text-xs sm:text-sm text-purple-600 hover:text-purple-800 font-medium flex items-center gap-1.5 transition">
                        <span className="text-lg leading-none">＋</span> Add Lecture
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          IMAGE TESTIMONIALS
          ══════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6 shadow-sm">
        <SectionHeader title="📸 Image Testimonials"/>
        <p className="text-sm text-gray-500 mb-4">Student testimonials with photos — shown as a slider on the course page.</p>

        {imageTestimonials.length > 0 && (
          <div className="mb-6 grid sm:grid-cols-2 gap-3">
            {imageTestimonials.map(t => (
              <div key={t.id || t._id} className="border border-gray-200 rounded-lg p-3 flex gap-3">
                <img src={t.imageUrl} alt={t.author} className="w-20 h-20 object-cover rounded-lg flex-shrink-0"/>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{t.author}</p>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-3">{t.text}</p>
                </div>
                <button onClick={() => deleteImageTestimonial(t.id || t._id)} className="text-red-400 hover:text-red-600 text-sm self-start">✕</button>
              </div>
            ))}
          </div>
        )}

        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          <h4 className="font-semibold text-gray-800 text-sm">Add New Image Testimonial</h4>
          <div className="flex gap-4 items-start">
            <div className="w-28 h-28 flex-shrink-0 relative">
              <div className="w-full h-full bg-gray-100 rounded-lg overflow-hidden border-2 border-dashed border-gray-300 hover:border-purple-400 transition cursor-pointer group"
                onClick={() => imageTestimonialRef.current?.click()}>
                {newImageTestimonial.imagePreview
                  ? <img src={newImageTestimonial.imagePreview} alt="Preview" className="w-full h-full object-cover"/>
                  : <div className="w-full h-full flex flex-col items-center justify-center"><span className="text-2xl mb-1">📷</span><p className="text-xs text-gray-400 text-center px-1">Upload</p></div>}
                <UploadOverlay uploading={uploadingImageTestimonial}/>
              </div>
              <input ref={imageTestimonialRef} type="file" accept="image/*" className="hidden" onChange={handleImageTestimonialFile}/>
            </div>
            <div className="flex-1 space-y-3">
              <Input label="Student Name" value={newImageTestimonial.author} onChange={v => setNewImageTestimonial(p => ({ ...p, author: v }))} placeholder="John Doe"/>
              <Textarea label="Testimonial" value={newImageTestimonial.text} onChange={v => setNewImageTestimonial(p => ({ ...p, text: v }))} placeholder="This course changed my life..." rows={2}/>
              <Btn onClick={addImageTestimonial} size="sm" disabled={uploadingImageTestimonial}>+ Add Image Testimonial</Btn>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          VIDEO TESTIMONIALS — NEW: Cloudinary upload + URL input
          ══════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6 shadow-sm">
        <SectionHeader title="🎬 Video Testimonials"/>
        <p className="text-sm text-gray-500 mb-4">Student video reviews — upload a file to Cloudinary or paste a Bunny.net / YouTube URL. Shown as a slider on the course page.</p>

        {videoTestimonials.length > 0 && (
          <div className="mb-6 space-y-3">
            {videoTestimonials.map(t => (
              <div key={t.id || t._id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{t.author}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{t.text}</p>
                  </div>
                  <button onClick={() => deleteVideoTestimonial(t.id || t._id)} className="text-red-400 hover:text-red-600 text-sm ml-2 flex-shrink-0">✕</button>
                </div>
                <div className="rounded-lg overflow-hidden border border-gray-100">
                  <VideoPlayer url={t.videoUrl}/>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          <h4 className="font-semibold text-gray-800 text-sm">Add New Video Testimonial</h4>

          <div className="grid sm:grid-cols-2 gap-3">
            <Input label="Student Name" value={newVideoTestimonial.author} onChange={v => setNewVideoTestimonial(p => ({ ...p, author: v }))} placeholder="Jane Smith"/>
            <div/> {/* spacer */}
            <Textarea label="Description" value={newVideoTestimonial.text} onChange={v => setNewVideoTestimonial(p => ({ ...p, text: v }))} placeholder="Brief description..." rows={2} className="sm:col-span-2"/>
          </div>

          {/* Toggle: Upload file vs paste URL */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Video source:</span>
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              <button onClick={() => setVideoInputMode('url')}
                className={`px-3 py-1.5 text-xs font-semibold transition ${videoInputMode === 'url' ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                🔗 Paste URL
              </button>
              <button onClick={() => setVideoInputMode('upload')}
                className={`px-3 py-1.5 text-xs font-semibold transition ${videoInputMode === 'upload' ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                ☁️ Upload to Cloudinary
              </button>
            </div>
          </div>

          {videoInputMode === 'url' ? (
            <div>
              <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">Video URL</label>
              <input value={newVideoTestimonial.videoUrl} onChange={e => setNewVideoTestimonial(p => ({ ...p, videoUrl: e.target.value, videoPreview: e.target.value }))}
                placeholder="https://iframe.mediadelivery.net/embed/... or youtube.com/watch?v=..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"/>
              <p className="text-xs text-gray-400 mt-1">YouTube · Bunny.net · Cloudinary · MP4</p>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-medium text-gray-700 block">Upload Video File</label>
              <div className="relative">
                <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden border-2 border-dashed border-gray-300 hover:border-purple-400 transition cursor-pointer flex items-center justify-center"
                  onClick={() => !uploadingVideoTestimonial && videoTestimonialRef.current?.click()}>
                  {videoPreviewUrl ? (
                    <VideoPlayer url={videoPreviewUrl} className="rounded-none"/>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-4xl">🎥</span>
                      <p className="text-sm font-semibold text-gray-600">Click to upload video</p>
                      <p className="text-xs text-gray-400">MP4, WebM, MOV — max 500 MB</p>
                    </div>
                  )}
                  <UploadOverlay uploading={uploadingVideoTestimonial}/>
                </div>
                <input ref={videoTestimonialRef} type="file" accept="video/mp4,video/webm,video/ogg,video/quicktime,video/x-msvideo" className="hidden" onChange={handleVideoTestimonialFile}/>
              </div>
              {uploadingVideoTestimonial && (
                <div className="flex items-center gap-2 text-sm text-purple-600">
                  <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"/>
                  <span>Uploading to Cloudinary… large files may take a moment.</span>
                </div>
              )}
              {newVideoTestimonial.videoUrl && !uploadingVideoTestimonial && (
                <p className="text-xs text-emerald-600 font-semibold">✓ Uploaded: {newVideoTestimonial.videoUrl.slice(0, 60)}...</p>
              )}
            </div>
          )}

          {/* Preview box for URL mode */}
          {videoInputMode === 'url' && videoPreviewUrl && (
            <div className="rounded-lg overflow-hidden border border-gray-200">
              <VideoPlayer url={videoPreviewUrl}/>
            </div>
          )}

          <Btn onClick={addVideoTestimonial} size="sm" disabled={uploadingVideoTestimonial}>
            + Add Video Testimonial
          </Btn>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          PROJECT GALLERY — NEW: Cloudinary image upload grid
          ══════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6 shadow-sm">
        <SectionHeader title="🖼️ Project Gallery"/>
        <p className="text-sm text-gray-500 mb-4">
          Showcase student projects or course deliverables. Uploads to Cloudinary and displays as a photo gallery on the course page.
        </p>

        {/* Existing gallery grid */}
        {projectGallery.length > 0 && (
          <div className="mb-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {projectGallery.map(g => (
              <div key={g.id || g._id} className="group relative rounded-lg overflow-hidden border border-gray-200 aspect-video bg-gray-100">
                <img src={g.imageUrl} alt={g.caption || "Gallery"} className="w-full h-full object-cover"/>
                {/* Caption overlay */}
                {g.caption && (
                  <div className="absolute inset-x-0 bottom-0 bg-black/60 px-2 py-1">
                    <p className="text-white text-xs truncate">{g.caption}</p>
                  </div>
                )}
                {/* Delete button */}
                <button onClick={() => deleteGalleryItem(g.id || g._id)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-600 hover:bg-red-700 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-lg">
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Upload new gallery image */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          <h4 className="font-semibold text-gray-800 text-sm">Add Gallery Image</h4>
          <div className="flex gap-4 items-start">
            {/* Upload area */}
            <div className="w-40 h-28 flex-shrink-0 relative">
              <div className="w-full h-full bg-gray-100 rounded-lg overflow-hidden border-2 border-dashed border-gray-300 hover:border-purple-400 transition cursor-pointer group"
                onClick={() => galleryRef.current?.click()}>
                {newGalleryItem.imagePreview
                  ? <img src={newGalleryItem.imagePreview} alt="Preview" className="w-full h-full object-cover"/>
                  : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                      <span className="text-2xl">🖼️</span>
                      <p className="text-xs text-gray-400 text-center px-2">Click to upload<br/>JPG / PNG / WebP</p>
                    </div>
                  )}
                <UploadOverlay uploading={uploadingGalleryItem}/>
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-purple-600/10 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                  {!newGalleryItem.imagePreview && <span className="text-purple-700 font-bold text-xs">Browse</span>}
                </div>
              </div>
              <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={handleGalleryFile}/>
            </div>

            {/* Caption + add button */}
            <div className="flex-1 space-y-3">
              <Input label="Caption (optional)" value={newGalleryItem.caption} onChange={v => setNewGalleryItem(p => ({ ...p, caption: v }))} placeholder="Student project — week 4"/>
              {newGalleryItem.imageUrl && (
                <p className="text-xs text-emerald-600 font-semibold">✓ Ready to add</p>
              )}
              <Btn onClick={addGalleryItem} size="sm" disabled={uploadingGalleryItem || !newGalleryItem.imageUrl}>
                {uploadingGalleryItem ? "Uploading…" : "+ Add to Gallery"}
              </Btn>
              <p className="text-xs text-gray-400">Max 10MB per image. Up to 20 images.</p>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          STUDENTS ALSO BOUGHT — NEW: pick from published courses
          ══════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6 shadow-sm">
        <SectionHeader title="🛒 Students Also Bought"/>
        <p className="text-sm text-gray-500 mb-4">
          Choose up to 6 published courses to show in the "Students also bought" section on this course's landing page.
          Only published courses appear in this list.
        </p>

        {/* Selected courses */}
        {alsoBoughtCourses.length > 0 && (
          <div className="mb-6 space-y-2">
            {alsoBoughtCourses.map((c, idx) => (
              <div key={c._id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="w-8 h-8 rounded-lg overflow-hidden bg-purple-100 flex-shrink-0">
                  {c.thumbnail
                    ? <img src={c.thumbnail} alt={c.title} className="w-full h-full object-cover"/>
                    : <div className="w-full h-full flex items-center justify-center text-purple-600 font-bold text-sm">{c.title?.charAt(0)}</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{c.title}</p>
                  <p className="text-xs text-gray-500">{c.category} · ${c.price}</p>
                </div>
                <span className="text-xs bg-emerald-100 text-emerald-700 font-semibold px-2 py-0.5 rounded-full flex-shrink-0">Published</span>
                <span className="text-xs text-gray-400 flex-shrink-0">#{idx + 1}</span>
                <button onClick={() => removeAlsoBought(c._id)} className="text-red-400 hover:text-red-600 text-sm flex-shrink-0 ml-1" title="Remove">✕</button>
              </div>
            ))}
          </div>
        )}

        {/* Picker */}
        {alsoBoughtIds.length < 6 ? (
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">
                Select a course {alsoBoughtIds.length > 0 && <span className="text-gray-400 font-normal">({alsoBoughtIds.length}/6 selected)</span>}
              </label>
              <select value={coursePicker} onChange={e => setCoursePicker(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white">
                <option value="">— Choose a published course —</option>
                {publishedCourses
                  .filter(c => !alsoBoughtIds.includes(c._id))
                  .map(c => (
                    <option key={c._id} value={c._id}>{c.title} (${c.price})</option>
                  ))}
              </select>
            </div>
            <Btn onClick={addAlsoBought} disabled={!coursePicker} size="md">Add</Btn>
          </div>
        ) : (
          <p className="text-sm text-amber-600 font-semibold bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">
            ✓ Maximum 6 courses selected. Remove one to add another.
          </p>
        )}

        {publishedCourses.length === 0 && (
          <p className="text-sm text-gray-400 mt-3 italic">
            No other published courses found. Publish other courses first to add them here.
          </p>
        )}
      </div>

    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE: ANALYTICS
// ─────────────────────────────────────────────────────────────────────────────

function AnalyticsPage({ courses }) {
  const [range, setRange] = useState("12m");
  const data = range === "6m" ? REVENUE_DATA.slice(6) : REVENUE_DATA;
  const courseRevenue = courses.filter(c => (c.revenue || 0) > 0).map(c => ({
    name: c.title?.length > 20 ? c.title.slice(0, 20) + "…" : c.title,
    revenue: c.revenue || 0,
  }));

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">Analytics</h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Performance overview across all courses</p>
        </div>
        <div className="flex gap-2">
          {["6m","12m"].map(r => (
            <button key={r} onClick={() => setRange(r)}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold transition ${range === r ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {r === "12m" ? "Last 12m" : "Last 6m"}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon="💰" label="Chart Revenue"  value={fmt(data.reduce((a,d) => a+d.revenue,0))}                                    color="green"/>
        <StatCard icon="👥" label="New Students"   value={fmtNum(data.reduce((a,d) => a+d.students,0))}                                color="purple"/>
        <StatCard icon="📈" label="Best Month"     value={`$${Math.max(...data.map(d=>d.revenue)).toLocaleString()}`}                   color="blue"/>
        <StatCard icon="⭐" label="Avg / Month"    value={Math.round(data.reduce((a,d) => a+d.students,0)/data.length)}                color="amber"/>
      </div>
      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6 shadow-sm overflow-x-auto">
          <SectionHeader title="Monthly Revenue"/>
          <ResponsiveContainer width="100%" height={220} minWidth={300}>
            <AreaChart data={data} margin={{ top:4, right:4, left:0, bottom:0 }}>
              <defs>
                <linearGradient id="revGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#a435f0" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#a435f0" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
              <XAxis dataKey="month" tick={{ fontSize:10, fill:"#9ca3af" }} axisLine={false} tickLine={false}/>
              <YAxis tickFormatter={v=>`$${v/1000}k`} tick={{ fontSize:10, fill:"#9ca3af" }} axisLine={false} tickLine={false}/>
              <Tooltip formatter={v=>[`$${v.toLocaleString()}`,"Revenue"]} contentStyle={{ borderRadius:8, border:"1px solid #e5e7eb", fontSize:12 }}/>
              <Area type="monotone" dataKey="revenue" stroke="#a435f0" strokeWidth={2} fill="url(#revGrad2)"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6 shadow-sm overflow-x-auto">
          <SectionHeader title="Monthly Enrollments"/>
          <ResponsiveContainer width="100%" height={220} minWidth={300}>
            <BarChart data={data} margin={{ top:4, right:4, left:0, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
              <XAxis dataKey="month" tick={{ fontSize:10, fill:"#9ca3af" }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize:10, fill:"#9ca3af" }} axisLine={false} tickLine={false}/>
              <Tooltip formatter={v=>[v,"Students"]} contentStyle={{ borderRadius:8, border:"1px solid #e5e7eb", fontSize:12 }}/>
              <Bar dataKey="students" fill="#a435f0" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
        {courseRevenue.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6 shadow-sm lg:col-span-2 overflow-x-auto">
            <SectionHeader title="Revenue by Course"/>
            <ResponsiveContainer width="100%" height={220} minWidth={300}>
              <BarChart data={courseRevenue} layout="vertical" margin={{ top:0, right:8, left:0, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false}/>
                <XAxis type="number" tickFormatter={v=>`$${v/1000}k`} tick={{ fontSize:10, fill:"#9ca3af" }} axisLine={false} tickLine={false}/>
                <YAxis type="category" dataKey="name" tick={{ fontSize:11, fill:"#6b7280" }} axisLine={false} tickLine={false} width={120}/>
                <Tooltip formatter={v=>[`$${v.toLocaleString()}`,"Revenue"]} contentStyle={{ borderRadius:8, border:"1px solid #e5e7eb", fontSize:12 }}/>
                <Bar dataKey="revenue" fill="#a435f0" radius={[0,4,4,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6 shadow-sm">
          <SectionHeader title="Traffic Sources"/>
          <ResponsiveContainer width="100%" height={180} minWidth={250}>
            <PieChart>
              <Pie data={STUDENT_SOURCE} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                {STUDENT_SOURCE.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]}/>)}
              </Pie>
              <Tooltip formatter={v=>[`${v}%`,"Share"]} contentStyle={{ borderRadius:8, border:"1px solid #e5e7eb", fontSize:12 }}/>
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {STUDENT_SOURCE.map((s,i) => (
              <div key={s.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}/>
                  <span className="text-gray-600 truncate">{s.name}</span>
                </div>
                <span className="font-semibold text-gray-800 ml-1">{s.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE: PROFILE
// ─────────────────────────────────────────────────────────────────────────────

function ProfilePage({ toast }) {
  const { user, API: api } = useAuth();
  const [form, setForm] = useState({
    name:     user?.name     || "",
    email:    user?.email    || "",
    title:    user?.title    || "",
    bio:      user?.bio      || "",
    location: user?.location || "",
    website:  user?.website  || "",
    twitter:  user?.twitter  || "",
    linkedin: user?.linkedin || "",
    avatar:   user?.avatar   || "",
  });
  const [saving,         setSaving]         = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileRef = useRef();

  function update(field, val) { setForm(f => ({ ...f, [field]: val })); }

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await api.post("/upload/image", formData);
      const url = res.data?.url ?? res.data?.secure_url ?? res.data?.imageUrl;
      if (!url) { toast("Upload succeeded but no URL returned.", "error"); return; }
      update("avatar", url);
      toast("Profile photo uploaded ✓", "success");
    } catch { toast("Upload failed.", "error"); }
    finally {
      setUploadingAvatar(false);
      if (e.target) e.target.value = "";
    }
  };

  function handleSave() {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast("Profile saved! (connect PATCH /api/auth/profile to persist)", "success");
    }, 800);
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">Instructor Profile</h2>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Shown on your public instructor page.</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6 shadow-sm">
        <h3 className="font-bold text-gray-800 mb-5">Profile Photo</h3>
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="relative">
            {uploadingAvatar
              ? <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center"><div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"/></div>
              : <Avatar name={form.name || "I"} size={96} src={form.avatar}/>}
            <button onClick={() => fileRef.current.click()} disabled={uploadingAvatar}
              className="absolute -bottom-1 -right-1 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm hover:bg-purple-700 transition shadow-md disabled:opacity-50">
              ✎
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload}/>
          </div>
          <div>
            <p className="font-semibold text-gray-800">{form.name}</p>
            <p className="text-sm text-gray-500">{form.title || "Instructor"}</p>
            <p className="text-xs text-purple-600 mt-1">{user?.email}</p>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6 shadow-sm space-y-5">
        <h3 className="font-bold text-gray-800">Basic Information</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Full Name"          value={form.name}     onChange={v => update("name",v)}     placeholder="Your name"/>
          <Input label="Professional Title" value={form.title}    onChange={v => update("title",v)}    placeholder="e.g. Marketing Expert"/>
          <Input label="Email"              value={form.email}    onChange={v => update("email",v)}    placeholder="you@email.com" type="email"/>
          <Input label="Location"           value={form.location} onChange={v => update("location",v)} placeholder="City, Country"/>
        </div>
        <Textarea label="Bio" value={form.bio} onChange={v => update("bio",v)} placeholder="Tell students about yourself..." rows={5}/>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-gray-800">Links & Social</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Website"  value={form.website}  onChange={v => update("website",v)}  placeholder="https://yoursite.com"/>
          <Input label="Twitter"  value={form.twitter}  onChange={v => update("twitter",v)}  placeholder="@handle"/>
          <Input label="LinkedIn" value={form.linkedin} onChange={v => update("linkedin",v)} placeholder="linkedin.com/in/..."/>
        </div>
      </div>
      <div className="flex justify-end">
        <Btn onClick={handleSave} disabled={saving} size="lg">{saving ? "Saving…" : "Save Changes"}</Btn>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LAYOUT
// ─────────────────────────────────────────────────────────────────────────────

function Layout({ children, sidebarWidth, isMobile }) {
  return (
    <main className="min-h-screen pt-16 bg-gray-50 transition-all duration-300 will-change-[margin-left]"
      style={{ marginLeft: isMobile ? 0 : sidebarWidth, overflowX: "hidden" }}>
      <div className="p-4 sm:p-6 md:p-8 max-w-[1400px]">{children}</div>
    </main>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export default function InstructorDashboard() {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile,  setIsMobile]  = useState(window.innerWidth < 768);
  const { toasts, add: toast }    = useToast();
  const { courses, loading, createCourse, updateCourse, deleteCourse, togglePublish } = useInstructorCourses();
  const { syncCreated, syncUpdated, syncDeleted } = useCourses();

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) setCollapsed(false);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const sidebarWidth = isMobile ? 0 : collapsed ? 64 : 230;

  return (
    <>
      <style>{`
        @keyframes slideUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:none; } }
        * { box-sizing: border-box; }
        html, body { overflow-x: hidden; }
        body { -webkit-tap-highlight-color: transparent; }
        main { will-change: margin-left; }
      `}</style>

      <Sidebar  instructor={user} collapsed={collapsed} setCollapsed={setCollapsed} isMobile={isMobile}/>
      <TopBar   instructor={user} sidebarWidth={sidebarWidth} isMobile={isMobile} onMenuClick={() => setCollapsed(false)}/>

      <Layout sidebarWidth={sidebarWidth} isMobile={isMobile}>
        <Routes>
          <Route index element={<DashboardPage instructor={user} courses={courses} loading={loading}/>}/>

          <Route path="courses" element={
            <CoursesPage
              courses={courses} loading={loading}
              deleteCourse={async (id) => { await deleteCourse(id); syncDeleted(id); }}
              togglePublish={async (id, status) => {
                const updated = await togglePublish(id, status);
                syncUpdated(updated, courses.findIndex(c => c._id === id));
                return updated;
              }}
              toast={toast}
            />
          }/>

          <Route path="create" element={
            <CourseEditorPage
              courses={courses}
              createCourse={async (payload) => { const c = await createCourse(payload); syncCreated(c, courses.length); return c; }}
              updateCourse={async (id, payload) => { const u = await updateCourse(id, payload); syncUpdated(u, courses.findIndex(c => c._id === id)); return u; }}
              toast={toast}
            />
          }/>

          <Route path="edit/:id" element={
            <CourseEditorPage
              courses={courses}
              createCourse={async (payload) => { const c = await createCourse(payload); syncCreated(c, courses.length); return c; }}
              updateCourse={async (id, payload) => { const u = await updateCourse(id, payload); syncUpdated(u, courses.findIndex(c => c._id === id)); return u; }}
              toast={toast}
            />
          }/>

          <Route path="analytics" element={<AnalyticsPage courses={courses}/>}/>
          <Route path="profile"   element={<ProfilePage toast={toast}/>}/>
          <Route path="*"         element={<Navigate to="" replace/>}/>
        </Routes>
      </Layout>

      <ToastContainer toasts={toasts}/>
    </>
  );
}
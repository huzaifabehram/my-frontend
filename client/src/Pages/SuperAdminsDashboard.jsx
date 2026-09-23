// client/src/Pages/SuperAdminDashboard.jsx
// ─── Super Admin Panel ─────────────────────────────────────────────────────
// Platform-wide control panel: students across all courses, instructor
// management, all courses, and the payment-verification queue fed by the
// screenshots students submit on EnrolledPage.jsx.
//
// Mirrors the structure/style of InstructorDashboard.jsx (same Sidebar /
// TopBar / Layout pattern, same shared UI primitives duplicated locally,
// same self-contained-file convention already used across this codebase)
// but themed in rose/slate instead of purple so it's visually distinct from
// the instructor view at a glance.
//
// Data comes from useSuperAdminData() (see hooks/useSuperAdminData.js) — see
// SETUP_NOTES.md for the backend endpoints this expects.
// UPDATED: Added Settings (site logo upload → Cloudinary, shown on course
// pages/footer) and Messages (Contact Us submissions + newsletter
// subscribers) nav items/pages. Both call `api` from useAuth() directly
// rather than through useSuperAdminData(), so they load independently of
// the main dashboard's batched fetch.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Routes, Route, NavLink, useNavigate, useParams, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSuperAdminData } from "../hooks/useSuperAdminData";

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const fmt = (n) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M`
  : n >= 1_000   ? `$${(n / 1_000).toFixed(1)}k`
  : `$${n ?? 0}`;

const fmtNum = (n) =>
  (n ?? 0) >= 1000 ? `${((n ?? 0) / 1000).toFixed(1)}k` : `${n ?? 0}`;

const STATUS_STYLES = {
  active:    { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
  suspended: { bg: "bg-red-100",     text: "text-red-700",     dot: "bg-red-500" },
  pending:   { bg: "bg-amber-100",   text: "text-amber-700",   dot: "bg-amber-400" },
  verified:  { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
  rejected:  { bg: "bg-red-100",     text: "text-red-700",     dot: "bg-red-500" },
  published: { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
  draft:     { bg: "bg-gray-100",    text: "text-gray-600",    dot: "bg-gray-400" },
  review:    { bg: "bg-amber-100",   text: "text-amber-700",   dot: "bg-amber-400" },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.draft;
  const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : "Unknown";
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {label}
    </span>
  );
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED UI PRIMITIVES (self-contained, matching InstructorDashboard.jsx style)
// ─────────────────────────────────────────────────────────────────────────────

function Avatar({ name = "?", size = 36, src }) {
  const initials = name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  if (src) return <img src={src} alt={name} style={{ width: size, height: size }} className="rounded-full object-cover" />;
  return (
    <div style={{ width: size, height: size, fontSize: size * 0.36 }}
      className="rounded-full bg-rose-600 text-white flex items-center justify-center font-bold flex-shrink-0">
      {initials}
    </div>
  );
}

function StatCard({ icon, label, value, sub, color = "rose" }) {
  const bg = { rose: "bg-rose-50", purple: "bg-purple-50", green: "bg-emerald-50", blue: "bg-blue-50", amber: "bg-amber-50" };
  const ic = { rose: "text-rose-600", purple: "text-purple-600", green: "text-emerald-600", blue: "text-blue-600", amber: "text-amber-600" };
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
    primary:   "bg-rose-600 hover:bg-rose-700 text-white shadow-sm",
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

function Modal({ children, onClose, title }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => { document.body.style.overflow = "unset"; window.removeEventListener("keydown", handleKey); };
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-5 sm:p-6 max-w-lg w-full shadow-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {title && <h3 className="font-bold text-gray-900 mb-4">{title}</h3>}
        {children}
      </div>
    </div>
  );
}

// ── Toast ────────────────────────────────────────────────────────────────

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
    <div className="fixed bottom-4 sm:bottom-5 right-4 sm:right-5 z-[300] flex flex-col gap-2 pointer-events-none">
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
// SIDEBAR / TOP BAR / LAYOUT
// ─────────────────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { to: "/superadmin",              label: "Overview",      icon: "⊞", exact: true },
  { to: "/superadmin/students",     label: "Students",      icon: "🧑‍🎓" },
  { to: "/superadmin/instructors",  label: "Instructors",   icon: "🧑‍🏫" },
  { to: "/superadmin/courses",      label: "Courses",       icon: "📚" },
  { to: "/superadmin/verifications", label: "Verifications", icon: "🧾", badge: true },
  { to: "/superadmin/messages",     label: "Messages",      icon: "✉️" },
  { to: "/superadmin/automation",   label: "Automation Workflow", icon: "⚡" },
  { to: "/superadmin/whatsapp",     label: "WhatsApp",      icon: "💬" },
  { to: "/superadmin/pipeline",     label: "Pipeline",      icon: "📊" },
  { to: "/superadmin/review-importer", label: "Review Importer", icon: "⭐" },
  { to: "/superadmin/forms",        label: "Forms",         icon: "📄" },
  { to: "/superadmin/tags",         label: "Tags",          icon: "🏷️" },
  { to: "/superadmin/settings",     label: "Settings",      icon: "⚙️" },
];

function Sidebar({ admin, collapsed, setCollapsed, isMobile, pendingCount, onLogout }) {
  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-[#1c1d1f] flex flex-col z-50 transition-all duration-300 ${isMobile && collapsed ? "-translate-x-full" : "translate-x-0"}`}
      style={{ width: isMobile ? 240 : collapsed ? 64 : 230 }}>
      <div className="flex items-center gap-2.5 px-4 h-16 border-b border-white/10 flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center flex-shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
            <path d="M12 2l8 4v6c0 5-3.4 8.4-8 10-4.6-1.6-8-5-8-10V6l8-4z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        {!collapsed && <span className="font-extrabold text-white text-sm tracking-tight whitespace-nowrap flex-1 leading-tight">Super Admin</span>}
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
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.exact} onClick={() => isMobile && setCollapsed(true)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${isActive ? "bg-rose-600 text-white" : "text-gray-400 hover:bg-white/10 hover:text-white"}`}>
            <span className="text-lg leading-none flex-shrink-0">{item.icon}</span>
            {!collapsed && <span className="truncate flex-1">{item.label}</span>}
            {item.badge && pendingCount > 0 && (
              <span className={`flex-shrink-0 ${collapsed ? "absolute top-1 right-1" : ""} bg-amber-400 text-[#1c1d1f] text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1`}>
                {pendingCount > 99 ? "99+" : pendingCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="px-2 pb-4 flex-shrink-0">
        <button onClick={onLogout}
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
        <button onClick={onMenuClick} className="text-gray-600 hover:text-gray-900 transition text-lg">☰</button>
      )}
      <h1 className="text-sm sm:text-base font-bold text-gray-900">Platform Control</h1>
      <div className="flex items-center gap-2 sm:gap-3 ml-auto">
        <Avatar name={admin?.name || "A"} size={34} src={admin?.avatar} />
      </div>
    </header>
  );
}

function Layout({ children, sidebarWidth, isMobile }) {
  return (
    <main className="min-h-screen pt-16 bg-gray-50 transition-all duration-300 will-change-[margin-left]"
      style={{ marginLeft: isMobile ? 0 : sidebarWidth, overflowX: "hidden" }}>
      <div className="p-4 sm:p-6 md:p-8 max-w-[1400px]">{children}</div>
    </main>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE: OVERVIEW
// ─────────────────────────────────────────────────────────────────────────────

function OverviewPage({ overview, enrollments, loading, goTo }) {
  const pending = enrollments?.pending || [];

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="bg-gradient-to-r from-[#1c1d1f] to-[#3a0d1a] rounded-2xl p-5 sm:p-7 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <p className="text-rose-200 text-xs sm:text-sm font-medium mb-1">Platform overview</p>
        <h2 className="text-2xl sm:text-3xl font-extrabold mb-1">Every course, instructor, and student</h2>
        <p className="text-rose-200 text-xs sm:text-sm">One panel for the whole platform.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <StatCard icon="🧑‍🎓" label="Total Students" value={loading && !overview ? "—" : fmtNum(overview?.totalStudents)} color="rose" />
        <StatCard icon="🧑‍🏫" label="Instructors" value={loading && !overview ? "—" : fmtNum(overview?.totalInstructors)} color="purple" />
        <StatCard icon="📚" label="Courses" value={loading && !overview ? "—" : fmtNum(overview?.totalCourses)} color="blue" />
        <StatCard icon="💰" label="Platform Revenue" value={loading && !overview ? "—" : fmt(overview?.totalRevenue)} color="green" />
        <StatCard icon="🧾" label="Pending Verifications" value={loading && !overview ? "—" : fmtNum(overview?.pendingVerifications ?? pending.length)} color="amber" />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6 shadow-sm">
        <SectionHeader title="Awaiting payment verification" action={
          <Btn variant="ghost" size="sm" onClick={() => goTo("/superadmin/verifications")}>View all</Btn>
        } />
        {loading ? (
          <p className="text-sm text-gray-400 text-center py-8">Loading…</p>
        ) : pending.length === 0 ? (
          <EmptyState icon="✅" title="All caught up" body="New submissions from the enrollment page will show up here." />
        ) : (
          <div className="space-y-3">
            {pending.slice(0, 5).map((e) => {
              const eid = e._id || e.id;
              return (
                <div key={eid} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition cursor-pointer" onClick={() => goTo("/superadmin/verifications")}>
                  <Avatar name={e.student?.name || e.name || "Student"} size={36} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{e.student?.name || e.name || "Student"}</p>
                    <p className="text-xs text-gray-500 truncate">{e.course?.title || "Course"} · {e.paymentMethod || "—"}</p>
                  </div>
                  <StatusBadge status="pending" />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE: STUDENTS
// ─────────────────────────────────────────────────────────────────────────────

function StudentsPage({ students, loading, toggleStudentStatus, toast }) {
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState(null);

  const filtered = useMemo(
    () => students.filter((s) =>
      (s.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.email || "").toLowerCase().includes(search.toLowerCase())
    ),
    [students, search]
  );

  async function handleToggle(id, status) {
    setBusyId(id);
    try {
      const updated = await toggleStudentStatus(id, status);
      toast(updated.status === "suspended" ? "Student suspended." : "Student reactivated.", "success");
    } catch { toast("Could not update student.", "error"); }
    finally { setBusyId(null); }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">Students</h2>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{students.length} students across all courses</p>
      </div>
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email…"
        className="w-full sm:max-w-sm border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500 transition" />
      {loading ? <div className="text-center py-16 text-gray-400">Loading students…</div>
      : filtered.length === 0 ? <EmptyState icon="🧑‍🎓" title="No students found" body="Try a different search." />
      : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Student", "Email", "Courses Enrolled", "Joined", "Status", "Actions"].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 sm:px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((s) => (
                  <tr key={s._id} className="hover:bg-gray-50 transition">
                    <td className="px-3 sm:px-4 py-3">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <Avatar name={s.name || "Student"} size={32} src={s.avatar} />
                        <p className="text-xs sm:text-sm font-semibold text-gray-800 truncate max-w-[140px]">{s.name}</p>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-600 truncate max-w-[180px]">{s.email}</td>
                    <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-700 font-medium">{s.enrolledCourses?.length ?? s.coursesCount ?? 0}</td>
                    <td className="px-3 sm:px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{s.createdAt ? new Date(s.createdAt).toLocaleDateString() : "—"}</td>
                    <td className="px-3 sm:px-4 py-3"><StatusBadge status={s.status || "active"} /></td>
                    <td className="px-3 sm:px-4 py-3">
                      <Btn size="sm" variant={s.status === "suspended" ? "success" : "danger"} disabled={busyId === s._id} onClick={() => handleToggle(s._id, s.status)}>
                        {s.status === "suspended" ? "Reactivate" : "Suspend"}
                      </Btn>
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
// PAGE: INSTRUCTORS
// ─────────────────────────────────────────────────────────────────────────────

function InstructorsPage({ instructors, loading, toggleInstructorStatus, toast }) {
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState(null);

  const filtered = useMemo(
    () => instructors.filter((i) =>
      (i.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (i.email || "").toLowerCase().includes(search.toLowerCase())
    ),
    [instructors, search]
  );

  async function handleToggle(id, status) {
    setBusyId(id);
    try {
      const updated = await toggleInstructorStatus(id, status);
      toast(updated.status === "suspended" ? "Instructor suspended." : "Instructor reactivated.", "success");
    } catch { toast("Could not update instructor.", "error"); }
    finally { setBusyId(null); }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">Instructors</h2>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{instructors.length} instructors on the platform</p>
      </div>
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email…"
        className="w-full sm:max-w-sm border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500 transition" />
      {loading ? <div className="text-center py-16 text-gray-400">Loading instructors…</div>
      : filtered.length === 0 ? <EmptyState icon="🧑‍🏫" title="No instructors found" body="Try a different search." />
      : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Instructor", "Email", "Courses", "Students", "Revenue", "Status", "Actions"].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 sm:px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((i) => (
                  <tr key={i._id} className="hover:bg-gray-50 transition">
                    <td className="px-3 sm:px-4 py-3">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <Avatar name={i.name || "Instructor"} size={32} src={i.avatar} />
                        <p className="text-xs sm:text-sm font-semibold text-gray-800 truncate max-w-[140px]">{i.name}</p>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-600 truncate max-w-[180px]">{i.email}</td>
                    <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-700 font-medium">{i.totalCourses ?? i.coursesCount ?? 0}</td>
                    <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-700 font-medium">{fmtNum(i.totalStudents ?? i.studentsCount)}</td>
                    <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-700 font-medium">{fmt(i.revenue)}</td>
                    <td className="px-3 sm:px-4 py-3"><StatusBadge status={i.status || "active"} /></td>
                    <td className="px-3 sm:px-4 py-3">
                      <Btn size="sm" variant={i.status === "suspended" ? "success" : "danger"} disabled={busyId === i._id} onClick={() => handleToggle(i._id, i.status)}>
                        {i.status === "suspended" ? "Reactivate" : "Suspend"}
                      </Btn>
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
// PAGE: COURSES (platform-wide)
// ─────────────────────────────────────────────────────────────────────────────

function CoursesPage({ courses, loading }) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(
    () => courses.filter((c) => (c.title || "").toLowerCase().includes(search.toLowerCase())),
    [courses, search]
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">Courses</h2>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{courses.length} courses across all instructors</p>
      </div>
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search courses…"
        className="w-full sm:max-w-sm border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500 transition" />
      {loading ? <div className="text-center py-16 text-gray-400">Loading courses…</div>
      : filtered.length === 0 ? <EmptyState icon="📚" title="No courses found" body="Try a different search." />
      : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Course", "Instructor", "Price", "Students", "Revenue", "Status"].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 sm:px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((c) => (
                  <tr key={c._id} className="hover:bg-gray-50 transition">
                    <td className="px-3 sm:px-4 py-3">
                      <a href={`/course/${c._id}`} target="_blank" rel="noopener noreferrer"
                        className="text-xs sm:text-sm font-semibold text-gray-800 hover:text-rose-600 truncate max-w-[180px] block">
                        {c.title}
                      </a>
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-600">{c.instructor?.name || "—"}</td>
                    <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-700">${c.price ?? 0}</td>
                    <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-700">{fmtNum(c.studentsEnrolled)}</td>
                    <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-700">{fmt(c.revenue)}</td>
                    <td className="px-3 sm:px-4 py-3"><StatusBadge status={c.status} /></td>
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
// PAGE: SETTINGS — site logo upload (Cloudinary)
// ─────────────────────────────────────────────────────────────────────────────

// NEW CHANGE AK: one small reusable upload box, used for the header logo,
// footer logo, and now the four payment-method logos too. Each posts to the
// same /admin/settings/logo endpoint with a different `target` so the
// backend knows which slot to update.
const SETTINGS_FIELD_BY_TARGET = {
  header:            "logoUrl",
  footer:             "footerLogoUrl",
  payment_ubl:        "paymentLogoUbl",
  payment_allied:     "paymentLogoAllied",
  payment_jazzcash:   "paymentLogoJazzcash",
  payment_easypaisa:  "paymentLogoEasypaisa",
};
function LogoUploadBox({ toast, target, label, description, initialUrl, onUploaded }) {
  const { API: api } = useAuth();
  const [preview, setPreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = React.useRef();

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(file);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("target", target);
      const res = await api.post("/admin/settings/logo", formData);
      const url = res.data?.[SETTINGS_FIELD_BY_TARGET[target] || "logoUrl"];
      if (!url) { toast("Upload succeeded but no URL returned.", "error"); return; }
      onUploaded(url);
      toast(`${label} updated.`, "success");
    } catch (err) {
      toast(err.response?.data?.message || `Could not upload ${label.toLowerCase()}.`, "error");
    } finally {
      setUploading(false);
    }
  };

  const current = preview || initialUrl;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6 shadow-sm space-y-4">
      <h3 className="font-bold text-gray-800">{label}</h3>
      <p className="text-xs sm:text-sm text-gray-500">{description}</p>
      <div className="flex items-start gap-4">
        <div className="w-28 h-28 flex-shrink-0 relative">
          <div className="w-full h-full bg-gray-50 rounded-lg overflow-hidden border-2 border-dashed border-gray-300 hover:border-rose-400 transition cursor-pointer flex items-center justify-center"
            onClick={() => fileRef.current?.click()}>
            {current ? (
              <img src={current} alt={`${label} preview`} className="w-full h-full object-contain p-2" />
            ) : (
              <div className="text-center px-2">
                <span className="text-2xl block mb-1">🖼️</span>
                <p className="text-[10px] text-gray-400">Click to upload</p>
              </div>
            )}
            {uploading && (
              <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                <span className="w-5 h-5 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </div>
        <div className="flex-1 pt-1">
          <Btn size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {initialUrl ? `Replace ${label}` : `Upload ${label}`}
          </Btn>
          <p className="text-xs text-gray-400 mt-2">PNG, JPG, WebP or SVG. Square or wide logos both work — it's shown at a fixed height.</p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTOMATION WORKFLOW — Super Admin panel
// ─────────────────────────────────────────────────────────────────────────────
// A real, working GoHighLevel-style automation builder scoped to events that
// actually happen on this platform (see runWorkflows() call sites in
// server.js). Each workflow gets its own full page (not a modal) —
// /superadmin/automation/new or /superadmin/automation/:id — with a trigger
// picker, an ordered action/condition list, Publish/Unpublish, a Test Run
// button, and its run history on the same page.
//
// Honest capability notes (also shown inline in the UI where relevant):
//   • Email sending (Send Email action) was removed for now — SMTP isn't
//     set up and the nodemailer dependency wasn't installed, which broke
//     the server. See server.js for how to bring it back once SMTP is ready.
//   • send_whatsapp needs WHATSAPP_PHONE_NUMBER_ID + WHATSAPP_ACCESS_TOKEN
//     (Meta WhatsApp Cloud API) — shows a banner if unset
//   • customer_replied only fires once your provider's inbound webhook is
//     pointed at POST /api/inbound/message — it can't fire on its own
//   • video_tracking, appointment triggers, and site-wide page-view
//     tracking are NOT in the trigger list — they'd need features (%-watched
//     tracking, a booking system, sitewide analytics calls) that don't exist
//     on this platform yet, so they're left out rather than faked

const TRIGGER_LABELS = {
  form_submitted:          "Form Submitted",
  new_sign_up:             "New Sign Up",
  enrollment_created:      "Enrollment Created (Payment Pending)",
  payment_received:        "Payment Received",
  offer_access_granted:    "Offer Access Granted",
  payment_rejected:        "Payment Rejected",
  lesson_started:          "Lesson Started",
  lesson_completed:        "Lesson Completed",
  category_started:        "Category Started",
  category_completed:      "Category Completed",
  newsletter_subscribed:   "Newsletter Subscribed",
  opportunity_created:     "Opportunity Created",
  opportunity_status_changed: "Opportunity Status Changed",
  link_clicked:            "Link Clicked",
  whatsapp_sent:           "WhatsApp Message Sent",
  customer_replied:        "Customer Replied  (needs your provider's inbound webhook — see Settings)",
};

const ACTION_LABELS = {
  create_contact:        "Create Contact",
  add_contact_tag:       "Add Contact Tag",
  remove_contact_tag:    "Remove Contact Tag",
  assign_user:           "Assign To User",
  remove_assigned_user:  "Remove Assigned User",
  add_note:              "Add to Notes",
  internal_notification: "Send Internal Notification",
  notify_student:        "Send Student Notification",
  wait:                  "Wait",
  send_whatsapp:         "Send WhatsApp Message",
  add_to_pipeline:       "Add to Pipeline",
  update_opportunity_stage: "Update Opportunity Stage",
  webhook:               "Call Webhook",
};

const CONTEXT_FIELDS = ["studentName", "studentEmail", "courseTitle", "amount", "reason", "lectureId", "category", "name", "email", "message"];

// NEW: groups + icons for the trigger/action side panels below — matches
// the "pick from a categorized list" pattern (search box, category
// headers, icon + label rows) from the reference screenshots, instead of
// the old flat alphabetical list.
const TRIGGER_GROUPS = [
  { label: "Signup & Access", items: ["new_sign_up", "offer_access_granted"] },
  { label: "Courses", items: ["category_started", "category_completed", "lesson_started", "lesson_completed"] },
  { label: "Payments", items: ["enrollment_created", "payment_received", "payment_rejected"] },
  { label: "Forms & Contacts", items: ["form_submitted", "newsletter_subscribed"] },
  { label: "Pipeline", items: ["opportunity_created", "opportunity_status_changed"] },
  { label: "Engagement", items: ["link_clicked", "whatsapp_sent", "customer_replied"] },
];
const ACTION_GROUPS = [
  { label: "Contact", items: ["create_contact", "add_contact_tag", "remove_contact_tag", "assign_user", "remove_assigned_user", "add_note"] },
  { label: "Notifications", items: ["internal_notification", "notify_student"] },
  { label: "Messaging", items: ["send_whatsapp"] },
  { label: "Pipeline", items: ["add_to_pipeline", "update_opportunity_stage"] },
  { label: "Flow Control", items: ["wait"] },
  { label: "Developer", items: ["webhook"] },
];
const TRIGGER_ICONS = {
  new_sign_up: "👤", offer_access_granted: "🔓", category_started: "▦", category_completed: "▦",
  lesson_started: "✓", lesson_completed: "✓", enrollment_created: "📝", payment_received: "💳",
  payment_rejected: "❌", form_submitted: "📋", newsletter_subscribed: "✉️", opportunity_created: "📊",
  opportunity_status_changed: "📊", link_clicked: "🔗", whatsapp_sent: "💬", customer_replied: "💬",
};
const ACTION_ICONS = {
  create_contact: "👤", add_contact_tag: "🏷️", remove_contact_tag: "🏷️", assign_user: "👥",
  remove_assigned_user: "👥", add_note: "📝", internal_notification: "🔔", notify_student: "🔔",
  send_whatsapp: "💬", add_to_pipeline: "📊", update_opportunity_stage: "📊", wait: "⏱️", webhook: "🔌",
};

// Wraps/inserts text into a plain <textarea> at the cursor — used for Bold,
// variable insertion, and the [[Label|url]] tracked-link syntax the backend
// rewrites into a real clickable, click-tracked link at send time.
// NEW: rebuilt specifically around what WhatsApp text messages actually
// support — *bold*, _italic_, ~strikethrough~, and ```monospace``` are real
// WhatsApp formatting syntax that its app renders visually. WhatsApp has no
// concept of headings, arbitrary font sizing, or highlight/background
// color in a plain text message — those buttons would just insert
// decoration that WhatsApp displays as literal, meaningless characters, so
// they're deliberately left out rather than faked.
function RichMessageEditor({ value, onChange, rows = 4, placeholder }) {
  const ref = useRef(null);
  const wrap = (before, after = before) => {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart, end = el.selectionEnd;
    const next = value.slice(0, start) + before + value.slice(start, end) + after + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(start + before.length, end + before.length); });
  };
  const insertAtCursor = (text) => {
    const el = ref.current;
    const start = el ? el.selectionStart : value.length;
    onChange(value.slice(0, start) + text + value.slice(start));
  };
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
        <button type="button" onClick={() => wrap("*")} title="Bold" className="text-xs font-extrabold border border-gray-200 rounded px-2 py-1 bg-white hover:bg-gray-50 cursor-pointer">B</button>
        <button type="button" onClick={() => wrap("_")} title="Italic" className="text-xs italic font-bold border border-gray-200 rounded px-2 py-1 bg-white hover:bg-gray-50 cursor-pointer">I</button>
        <button type="button" onClick={() => wrap("~")} title="Strikethrough" className="text-xs line-through font-bold border border-gray-200 rounded px-2 py-1 bg-white hover:bg-gray-50 cursor-pointer">S</button>
        <button type="button" onClick={() => wrap("```")} title="Monospace" className="text-xs font-mono border border-gray-200 rounded px-2 py-1 bg-white hover:bg-gray-50 cursor-pointer">{"</>"}</button>
        <select onChange={(e) => { if (e.target.value) insertAtCursor(`{{${e.target.value}}}`); e.target.value = ""; }} defaultValue=""
          className="text-xs border border-gray-200 rounded px-2 py-1 bg-white cursor-pointer">
          <option value="" disabled>Insert variable…</option>
          {CONTEXT_FIELDS.map((f) => <option key={f} value={f}>{`{{${f}}}`}</option>)}
        </select>
        <button type="button" onClick={() => {
          const label = window.prompt("Link text?"); if (!label) return;
          const url = window.prompt("Link URL?"); if (!url) return;
          insertAtCursor(`[[${label}|${url}]]`);
        }} title="Insert tracked link" className="text-xs border border-gray-200 rounded px-2 py-1 bg-white hover:bg-gray-50 cursor-pointer">🔗 Link</button>
      </div>
      <textarea ref={ref} value={value} onChange={(e) => onChange(e.target.value)} rows={rows} placeholder={placeholder}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-rose-500" />
    </div>
  );
}

// Shared slide-in panel shell (fixed to the right edge, dims the page
// behind it, closes on backdrop click) — used for both the trigger picker
// and the step (condition/action) picker/editor.
function SidePanel({ title, subtitle, onClose, children }) {
  return (
    <div className="fixed inset-0 z-[200] flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative bg-white w-full sm:w-[400px] h-full shadow-2xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-start justify-between z-10">
          <div>
            <h3 className="font-bold text-gray-900">{title}</h3>
            {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 bg-transparent border-none cursor-pointer text-lg leading-none">✕</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function TriggerSidePanel({ meta, onPick, onClose }) {
  const [search, setSearch] = useState("");
  const groups = TRIGGER_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((t) => (meta.triggers || []).includes(t) && (TRIGGER_LABELS[t] || t).toLowerCase().includes(search.toLowerCase())),
  })).filter((g) => g.items.length > 0);

  return (
    <SidePanel title="Add New Trigger" onClose={onClose}>
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search triggers…"
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-5 focus:outline-none focus:ring-2 focus:ring-rose-500" />
      {groups.length === 0 && <p className="text-sm text-gray-400">No triggers match "{search}".</p>}
      {groups.map((g) => (
        <div key={g.label} className="mb-5">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">{g.label}</p>
          <div className="space-y-1.5">
            {g.items.map((t) => (
              <button key={t} onClick={() => onPick(t)} className="w-full flex items-center gap-3 text-left px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-rose-50 hover:text-rose-700 bg-white border border-gray-100 cursor-pointer transition">
                <span className="text-base flex-shrink-0">{TRIGGER_ICONS[t] || "⚡"}</span>
                {TRIGGER_LABELS[t] || t}
              </button>
            ))}
          </div>
        </div>
      ))}
    </SidePanel>
  );
}

// Handles both adding a brand-new step (starts on the "pick a type" list,
// matching the "Actions — Pick an action for this step" reference screen)
// and editing an existing one (opens straight into its config form).
function StepPanel({ meta, assignableUsers, whatsappInstances, tags, selfHostedSessions, initialStep, onSave, onRemove, onClose }) {
  const [stage, setStage] = useState(initialStep ? "configure" : "pick");
  const [step, setStep] = useState(initialStep || null);
  const [search, setSearch] = useState("");

  const pickType = (kind, actionType) => {
    // NEW: send_whatsapp starts with "To" already filled in as {{whatsapp}}
    // instead of blank with a placeholder — leaving it blank technically
    // already fell back to the same thing at send time, but it looked like
    // something still needed typing in. Now it's visibly there from the
    // start: nothing to fill in, the real number is pulled automatically
    // from whichever form/trigger fired the workflow.
    const defaultParams = actionType === "send_whatsapp" ? { to: "{{whatsapp}}" } : {};
    setStep(kind === "condition"
      ? { type: "condition", conditionField: "courseTitle", conditionOperator: "equals", conditionValue: "" }
      : { type: "action", actionType, params: defaultParams });
    setStage("configure");
  };
  const updateStep = (patch) => setStep((s) => ({ ...s, ...patch }));
  const updateParam = (key, value) => setStep((s) => ({ ...s, params: { ...(s.params || {}), [key]: value } }));

  if (stage === "pick") {
    const conditionMatches = "if condition flow control".includes(search.toLowerCase()) || search.trim() === "";
    const groups = ACTION_GROUPS.map((g) => ({
      ...g,
      items: g.items.filter((a) => (meta.actionTypes || []).includes(a) && (ACTION_LABELS[a] || a).toLowerCase().includes(search.toLowerCase())),
    })).filter((g) => g.items.length > 0);

    return (
      <SidePanel title="Actions" subtitle="Pick an action for this step" onClose={onClose}>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search Action"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-5 focus:outline-none focus:ring-2 focus:ring-rose-500" />
        {conditionMatches && (
          <div className="mb-5">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">Flow Control</p>
            <button onClick={() => pickType("condition")} className="w-full flex items-center gap-3 text-left px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-rose-50 hover:text-rose-700 bg-white border border-gray-100 cursor-pointer transition">
              <span className="text-base flex-shrink-0">🔀</span> If / Condition
            </button>
          </div>
        )}
        {groups.map((g) => (
          <div key={g.label} className="mb-5">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">{g.label}</p>
            <div className="space-y-1.5">
              {g.items.map((a) => (
                <button key={a} onClick={() => pickType("action", a)} className="w-full flex items-center gap-3 text-left px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-rose-50 hover:text-rose-700 bg-white border border-gray-100 cursor-pointer transition">
                  <span className="text-base flex-shrink-0">{ACTION_ICONS[a] || "⚙️"}</span>
                  {ACTION_LABELS[a] || a}
                </button>
              ))}
            </div>
          </div>
        ))}
      </SidePanel>
    );
  }

  // stage === "configure"
  const p = step?.params || {};
  return (
    <SidePanel title={step.type === "condition" ? "Condition" : (ACTION_LABELS[step.actionType] || "Action")} onClose={onClose}>
      {!initialStep && (
        <button onClick={() => setStage("pick")} className="text-xs font-semibold text-gray-500 hover:text-gray-800 bg-transparent border-none cursor-pointer p-0 mb-4 flex items-center gap-1">← Change type</button>
      )}

      {step.type === "condition" ? (
        <div className="space-y-2.5">
          <select value={step.conditionField} onChange={(e) => updateStep({ conditionField: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
            {CONTEXT_FIELDS.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
          <select value={step.conditionOperator} onChange={(e) => updateStep({ conditionOperator: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
            <option value="equals">equals</option>
            <option value="not_equals">not equals</option>
            <option value="contains">contains</option>
          </select>
          <input value={step.conditionValue} onChange={(e) => updateStep({ conditionValue: e.target.value })} placeholder="value" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </div>
      ) : (
        <div className="space-y-2.5">
          {step.actionType === "create_contact" && (
            <>
              <input value={p.name || ""} onChange={(e) => updateParam("name", e.target.value)} placeholder="Name (default: {{studentName}} / {{name}})" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              <input value={p.email || ""} onChange={(e) => updateParam("email", e.target.value)} placeholder="Email (default: {{studentEmail}} / {{email}})" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              <p className="text-[11px] text-gray-400">A contact is matched/created by email — running this again for the same email just updates it.</p>
            </>
          )}
          {(step.actionType === "add_contact_tag" || step.actionType === "remove_contact_tag") && (
            tags?.length > 0 ? (
              <select value={p.tag || ""} onChange={(e) => updateParam("tag", e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
                <option value="">Choose a tag…</option>
                {tags.map((t) => <option key={t._id} value={t.name}>{t.name}</option>)}
              </select>
            ) : (
              <>
                <p className="text-[11px] text-amber-600">No tags created yet — go to Super Admin → Tags → Create Tag first, or type one here.</p>
                <input value={p.tag || ""} onChange={(e) => updateParam("tag", e.target.value)} placeholder="Tag name" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </>
            )
          )}
          {step.actionType === "assign_user" && (
            <select value={p.userId || ""} onChange={(e) => updateParam("userId", e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
              <option value="">Choose a user…</option>
              {(assignableUsers || []).map((u) => <option key={u._id} value={u._id}>{u.name} ({u.role})</option>)}
            </select>
          )}
          {step.actionType === "add_note" && (
            <textarea value={p.text || ""} onChange={(e) => updateParam("text", e.target.value)} rows={2} placeholder="Note text — use {{studentName}}, {{courseTitle}}, etc." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none" />
          )}
          {step.actionType === "internal_notification" && (
            <textarea value={p.message || ""} onChange={(e) => updateParam("message", e.target.value)} rows={2} placeholder="Message shown to your admin team" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none" />
          )}
          {step.actionType === "notify_student" && (
            <>
              <input value={p.title || ""} onChange={(e) => updateParam("title", e.target.value)} placeholder="Notification title" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              <textarea value={p.message || ""} onChange={(e) => updateParam("message", e.target.value)} rows={2} placeholder="Message — use {{studentName}}, {{courseTitle}}, etc." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none" />
            </>
          )}
          {step.actionType === "wait" && (
            <div className="flex gap-2">
              <input type="number" min="1" value={p.amount || ""} onChange={(e) => updateParam("amount", e.target.value)} placeholder="Amount" className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              <select value={p.unit || "minutes"} onChange={(e) => updateParam("unit", e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
                {["seconds", "minutes", "hours", "days", "weeks", "years"].map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          )}
          {step.actionType === "send_whatsapp" && (
            <>
              {selfHostedSessions?.length > 0 && (
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 mb-1">Self-Hosted Server number (takes priority over WaBulkify below, if set)</label>
                  <select value={p.selfHostedSessionId || ""} onChange={(e) => updateParam("selfHostedSessionId", e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
                    <option value="">Don't use — use WaBulkify below instead</option>
                    {selfHostedSessions.map((s) => (
                      <option key={s._id} value={s._id} disabled={s.status !== "connected"}>{s.label} {s.status !== "connected" ? "(not connected)" : ""}</option>
                    ))}
                  </select>
                </div>
              )}
              {whatsappInstances?.length > 0 ? (
                <>
                  <select value={p.instanceId || ""} onChange={(e) => updateParam("instanceId", e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
                    <option value="">Choose a connected number…</option>
                    {whatsappInstances.map((inst) => (
                      <option key={inst._id} value={inst._id} disabled={inst.status !== "connected"}>{inst.label} {inst.status !== "connected" ? "(not connected)" : ""}</option>
                    ))}
                  </select>
                  <div className="flex gap-3 text-xs">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="radio" checked={p.recipientType !== "group"} onChange={() => updateParam("recipientType", "individual")} className="accent-rose-600" /> Individual
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="radio" checked={p.recipientType === "group"} onChange={() => updateParam("recipientType", "group")} className="accent-rose-600" /> Group
                    </label>
                  </div>
                  {p.recipientType === "group" ? (
                    <input value={p.groupId || ""} onChange={(e) => updateParam("groupId", e.target.value)} placeholder="Group ID (e.g. 8498761234@g.us)" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                  ) : (
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 mb-1">To — leave as {"{{whatsapp}}"} to auto-fill from the form/trigger; only change this if you need a different number</label>
                      <input value={p.to || ""} onChange={(e) => updateParam("to", e.target.value)} placeholder="{{whatsapp}}" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono" />
                    </div>
                  )}
                  <RichMessageEditor value={p.message || ""} onChange={(v) => updateParam("message", v)} rows={4} placeholder="WhatsApp message…" />
                  <div className="grid grid-cols-2 gap-2">
                    <input value={p.mediaUrl || ""} onChange={(e) => updateParam("mediaUrl", e.target.value)} placeholder="Media URL (optional)" className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                    <input value={p.filename || ""} onChange={(e) => updateParam("filename", e.target.value)} placeholder="Filename (documents only)" className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                  </div>
                </>
              ) : (
                <>
                  <p className="text-[11px] text-amber-600">No WhatsApp numbers connected yet — go to Super Admin → WhatsApp to add one, or this will fall back to the single Meta Cloud API connection in Settings if that's set up.</p>
                  <input value={p.to || ""} onChange={(e) => updateParam("to", e.target.value)} placeholder="To (default: {{whatsapp}})" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                  <RichMessageEditor value={p.message || ""} onChange={(v) => updateParam("message", v)} rows={4} placeholder="WhatsApp message…" />
                </>
              )}
            </>
          )}
          {step.actionType === "add_to_pipeline" && (
            <>
              <select value={p.stage || (meta.pipelineStages || [])[0] || ""} onChange={(e) => updateParam("stage", e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
                {(meta.pipelineStages || []).map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <input value={p.title || ""} onChange={(e) => updateParam("title", e.target.value)} placeholder="Opportunity title (default: course title)" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              <input type="number" value={p.value || ""} onChange={(e) => updateParam("value", e.target.value)} placeholder="Value (PKR, optional)" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </>
          )}
          {step.actionType === "update_opportunity_stage" && (
            <select value={p.stage || (meta.pipelineStages || [])[0] || ""} onChange={(e) => updateParam("stage", e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
              {(meta.pipelineStages || []).map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
          {step.actionType === "webhook" && (
            <input value={p.url || ""} onChange={(e) => updateParam("url", e.target.value)} placeholder="https://…  (Zapier / Make / n8n / your own endpoint)" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          )}
        </div>
      )}

      <div className="flex gap-2 mt-6 pt-4 border-t border-gray-100">
        <Btn onClick={() => onSave(step)}>Save</Btn>
        {initialStep && <Btn variant="danger" onClick={onRemove}>Remove Step</Btn>}
      </div>
    </SidePanel>
  );
}

function AutomationWorkflowListPage({ toast, navigate }) {
  const { API: api } = useAuth();
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api.get("/admin/workflows").then((res) => setWorkflows(res.data || [])).catch(() => toast("Failed to load workflows", "error")).finally(() => setLoading(false));
  }, [api]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const togglePublished = async (wf) => {
    try {
      const res = await api.put(`/admin/workflows/${wf._id}`, { published: !wf.published });
      setWorkflows((prev) => prev.map((w) => (w._id === wf._id ? res.data : w)));
    } catch { toast("Failed to update workflow", "error"); }
  };

  const deleteWorkflow = async (wf) => {
    if (!window.confirm(`Delete "${wf.name}"? This can't be undone.`)) return;
    try {
      await api.delete(`/admin/workflows/${wf._id}`);
      setWorkflows((prev) => prev.filter((w) => w._id !== wf._id));
      toast("Workflow deleted", "success");
    } catch { toast("Failed to delete workflow", "error"); }
  };

  return (
    <div>
      <SectionHeader title="Automation Workflow" action={<Btn onClick={() => navigate("/superadmin/automation/new")}>+ New Workflow</Btn>} />
      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : workflows.length === 0 ? (
        <EmptyState icon="⚡" title="No workflows yet"
          body="Create your first automation — pick a trigger, then add the actions that should run when it fires."
          action={<Btn onClick={() => navigate("/superadmin/automation/new")}>+ New Workflow</Btn>} />
      ) : (
        <div className="space-y-3">
          {workflows.map((wf) => (
            <div key={wf._id} className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col sm:flex-row sm:items-center gap-3 shadow-sm">
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/superadmin/automation/${wf._id}`)}>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-gray-900">{wf.name}</p>
                  <StatusBadge status={wf.published ? "active" : "draft"} />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Trigger: {TRIGGER_LABELS[wf.trigger] || wf.trigger} • {wf.steps?.length || 0} step{(wf.steps?.length || 0) === 1 ? "" : "s"} • Ran {wf.runCount || 0} time{(wf.runCount || 0) === 1 ? "" : "s"}
                  {wf.lastRunAt ? ` • last ${new Date(wf.lastRunAt).toLocaleString()}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Btn variant="secondary" size="sm" onClick={() => togglePublished(wf)}>{wf.published ? "Unpublish" : "Publish"}</Btn>
                <Btn variant="secondary" size="sm" onClick={() => navigate(`/superadmin/automation/${wf._id}`)}>Open</Btn>
                <Btn variant="danger" size="sm" onClick={() => deleteWorkflow(wf)}>Delete</Btn>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Visual canvas primitives ────────────────────────────────────────────────
function Connector() { return <div className="w-0.5 h-6 bg-gray-300" />; }
function PlusButton({ onClick, title }) {
  return (
    <button onClick={onClick} title={title || "Add a step"} className="w-7 h-7 rounded-full bg-white border-2 border-gray-300 hover:border-rose-400 hover:text-rose-500 text-gray-400 flex items-center justify-center text-sm font-bold cursor-pointer transition shadow-sm">+</button>
  );
}
function NodeCard({ icon, label, sublabel, onClick, onRemove, variant }) {
  return (
    <div className="relative group">
      <button onClick={onClick} className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 bg-white shadow-sm hover:shadow-md transition cursor-pointer text-left min-w-[260px] max-w-[320px] ${variant === "trigger" ? "border-rose-200" : "border-gray-200"}`}>
        <span className="text-xl flex-shrink-0">{icon}</span>
        <div className="min-w-0">
          {sublabel && <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{sublabel}</p>}
          <p className="text-sm font-bold text-gray-900 truncate">{label}</p>
        </div>
      </button>
      {onRemove && (
        <button onClick={(e) => { e.stopPropagation(); onRemove(); }} title="Remove step" className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-white border border-gray-300 text-gray-400 hover:text-red-500 hover:border-red-300 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition cursor-pointer">✕</button>
      )}
    </div>
  );
}

// Full dedicated page — /superadmin/automation/new or /superadmin/automation/:id
function AutomationWorkflowEditorPage({ toast, navigate, workflowId }) {
  const { API: api } = useAuth();
  const isNew = workflowId === "new";
  const [loaded, setLoaded] = useState(isNew);
  const [name, setName] = useState("");
  const [trigger, setTrigger] = useState("");
  const [published, setPublished] = useState(false);
  const [steps, setSteps] = useState([]);
  const [runCount, setRunCount] = useState(0);
  const [lastRunAt, setLastRunAt] = useState(null);
  const [meta, setMeta] = useState({ triggers: [], actionTypes: [], whatsappConfigured: false, pipelineStages: [] });
  const [assignableUsers, setAssignableUsers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [showTriggerPicker, setShowTriggerPicker] = useState(false);
  // NEW: replaces the old "+ Condition"/"+ Action" buttons under a plain
  // stacked list — insertAt is the position a brand-new step should land at
  // (from a "+" button between nodes), editIndex is the position of an
  // existing node that was clicked to edit it. Only one is ever set.
  const [insertAt, setInsertAt] = useState(null);
  const [editIndex, setEditIndex] = useState(null);
  const [runs, setRuns] = useState([]);
  const [runsLoading, setRunsLoading] = useState(false);
  // NEW: scopes a trigger to one real, specific thing instead of "every
  // lesson everywhere" / "every form everywhere" — { courseId, sectionId,
  // lectureId } for lesson_started/lesson_completed, or { formSlug } for
  // form_submitted. Empty object means unscoped (fires for everything),
  // same behavior as before this existed.
  const [triggerScope, setTriggerScope] = useState({});
  const [allCourses, setAllCourses] = useState([]);
  const [forms, setForms] = useState([]);
  const [whatsappInstances, setWhatsappInstances] = useState([]);
  const [tags, setTags] = useState([]);
  const [selfHostedSessions, setSelfHostedSessions] = useState([]);

  useEffect(() => {
    Promise.all([api.get("/admin/workflows/meta"), api.get("/admin/assignable-users"), api.get("/admin/courses"), api.get("/admin/forms"), api.get("/admin/whatsapp/instances"), api.get("/admin/tags"), api.get("/admin/whatsapp-server/sessions").catch(() => ({ data: [] }))])
      .then(([mRes, uRes, cRes, fRes, wRes, tRes, sRes]) => { setMeta(mRes.data || {}); setAssignableUsers(uRes.data || []); setAllCourses(cRes.data || []); setForms(fRes.data || []); setWhatsappInstances(wRes.data || []); setTags(tRes.data || []); setSelfHostedSessions(sRes.data || []); })
      .catch(() => {});
  }, [api]);

  useEffect(() => {
    if (isNew) return;
    api.get(`/admin/workflows/${workflowId}`)
      .then((res) => {
        const wf = res.data;
        setName(wf.name); setTrigger(wf.trigger); setPublished(!!wf.published);
        setSteps(wf.steps?.map((s) => ({ ...s, params: { ...(s.params || {}) } })) || []);
        setTriggerScope(wf.triggerScope || {});
        setRunCount(wf.runCount || 0); setLastRunAt(wf.lastRunAt);
      })
      .catch(() => toast("Failed to load workflow", "error"))
      .finally(() => setLoaded(true));
  }, [workflowId, isNew]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadRuns = useCallback(() => {
    if (isNew) return;
    setRunsLoading(true);
    api.get(`/admin/workflows/${workflowId}/runs`).then((res) => setRuns(res.data || [])).catch(() => {}).finally(() => setRunsLoading(false));
  }, [api, workflowId, isNew]);
  useEffect(() => { loadRuns(); }, [loadRuns]);

  const removeStep = (i) => setSteps((prev) => prev.filter((_, idx) => idx !== i));

  const saveStepFromPanel = (step) => {
    if (insertAt !== null) {
      setSteps((prev) => [...prev.slice(0, insertAt), step, ...prev.slice(insertAt)]);
      setInsertAt(null);
    } else if (editIndex !== null) {
      setSteps((prev) => prev.map((s, idx) => (idx === editIndex ? step : s)));
      setEditIndex(null);
    }
  };

  const save = async (publishOverride) => {
    if (!name.trim()) { toast("Name is required", "error"); return; }
    if (!trigger) { toast("Choose a trigger first", "error"); return; }
    setSaving(true);
    try {
      const payload = { name: name.trim(), trigger, steps, triggerScope, published: publishOverride !== undefined ? publishOverride : published };
      const res = isNew ? await api.post("/admin/workflows", payload) : await api.put(`/admin/workflows/${workflowId}`, payload);
      setPublished(res.data.published);
      toast("Workflow saved", "success");
      if (isNew) navigate(`/superadmin/automation/${res.data._id}`);
    } catch (err) {
      toast(err.response?.data?.message || "Failed to save workflow", "error");
    } finally {
      setSaving(false);
    }
  };

  const testRun = async () => {
    if (isNew) { toast("Save the workflow first", "error"); return; }
    try {
      await api.post(`/admin/workflows/${workflowId}/test`);
      toast("Test run completed — see History below", "success");
      loadRuns();
    } catch (err) { toast(err.response?.data?.message || "Test run failed", "error"); }
  };

  if (!loaded) return <p className="text-sm text-gray-400">Loading…</p>;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-2 mb-5">
        <button onClick={() => navigate("/superadmin/automation")} className="text-gray-400 hover:text-gray-700 bg-transparent border-none cursor-pointer text-lg">←</button>
        <h2 className="text-lg sm:text-xl font-bold text-gray-900">{isNew ? "New Workflow" : "Edit Workflow"}</h2>
        {!isNew && <StatusBadge status={published ? "active" : "draft"} />}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 mb-5">
        <label className="block text-xs font-bold text-gray-600 mb-1">Workflow Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Welcome new students"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
      </div>

      {/* NEW: visual canvas — trigger node, then each condition/action as its
          own connected node, with a "+" between every pair to insert a new
          step there, ending in an END pill. Replaces the old plain stacked
          list of step-editor cards. */}
      <div className="bg-white rounded-xl border border-gray-100 py-10 px-4 mb-5 flex flex-col items-center overflow-x-auto">
        {trigger ? (
          <NodeCard icon={TRIGGER_ICONS[trigger] || "⚡"} label={TRIGGER_LABELS[trigger] || trigger} sublabel="Trigger" variant="trigger" onClick={() => setShowTriggerPicker(true)} />
        ) : (
          <button onClick={() => setShowTriggerPicker(true)} className="flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-dashed border-rose-300 text-rose-500 hover:bg-rose-50 bg-white cursor-pointer font-semibold text-sm transition">
            + Add New Trigger
          </button>
        )}

        {/* NEW: scopes lesson_started/lesson_completed to one real lesson
            (Course → Section → Lecture, all real data from your courses)
            or form_submitted to one real form, instead of firing for
            every lesson or every form on the site. */}
        {(trigger === "lesson_started" || trigger === "lesson_completed") && (
          <div className="mt-3 w-full max-w-sm bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Scope to one lesson (optional)</p>
            <select value={triggerScope.courseId || ""} onChange={(e) => setTriggerScope({ courseId: e.target.value || undefined })}
              className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white">
              <option value="">Any course</option>
              {allCourses.map((c) => <option key={c._id} value={c._id}>{c.title}</option>)}
            </select>
            {triggerScope.courseId && (
              <select value={triggerScope.sectionId || ""} onChange={(e) => setTriggerScope((s) => ({ ...s, sectionId: e.target.value || undefined, lectureId: undefined }))}
                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white">
                <option value="">Any section</option>
                {(allCourses.find((c) => c._id === triggerScope.courseId)?.sections || []).map((sec) => (
                  <option key={sec._id} value={sec._id}>{sec.title}</option>
                ))}
              </select>
            )}
            {triggerScope.courseId && triggerScope.sectionId && (
              <select value={triggerScope.lectureId || ""} onChange={(e) => setTriggerScope((s) => ({ ...s, lectureId: e.target.value || undefined }))}
                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white">
                <option value="">Any lecture in this section</option>
                {(allCourses.find((c) => c._id === triggerScope.courseId)?.sections?.find((sec) => sec._id === triggerScope.sectionId)?.lectures || []).map((lec) => (
                  <option key={lec._id} value={lec._id}>{lec.title}</option>
                ))}
              </select>
            )}
            {(triggerScope.courseId || triggerScope.sectionId || triggerScope.lectureId) && (
              <button onClick={() => setTriggerScope({})} className="text-[11px] text-gray-400 hover:text-gray-700 bg-transparent border-none cursor-pointer p-0">Clear — fire for every lesson</button>
            )}
          </div>
        )}
        {trigger === "form_submitted" && (
          <div className="mt-3 w-full max-w-sm bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Scope to one form (optional)</p>
            <select value={triggerScope.formSlug || ""} onChange={(e) => setTriggerScope({ formSlug: e.target.value || undefined })}
              className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white">
              <option value="">Any form</option>
              {forms.map((f) => <option key={f._id} value={f.slug}>{f.name}</option>)}
            </select>
          </div>
        )}
        {(trigger === "category_started" || trigger === "category_completed") && (
          <div className="mt-3 w-full max-w-sm bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Scope to one category (optional)</p>
            <select value={triggerScope.category || ""} onChange={(e) => setTriggerScope({ category: e.target.value || undefined })}
              className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white">
              <option value="">Any category</option>
              {[...new Set(allCourses.map((c) => c.category).filter(Boolean))].sort().map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        )}

        {trigger && (
          <>
            <Connector />
            <PlusButton onClick={() => setInsertAt(0)} title="Add a step" />
            {steps.map((step, i) => (
              <React.Fragment key={i}>
                <Connector />
                <NodeCard
                  icon={step.type === "condition" ? "🔀" : (ACTION_ICONS[step.actionType] || "⚙️")}
                  label={step.type === "condition" ? `If ${step.conditionField} ${step.conditionOperator} "${step.conditionValue}"` : (ACTION_LABELS[step.actionType] || step.actionType)}
                  sublabel={step.type === "condition" ? "Condition" : "Action"}
                  onClick={() => setEditIndex(i)}
                  onRemove={() => removeStep(i)}
                />
                <Connector />
                <PlusButton onClick={() => setInsertAt(i + 1)} title="Add a step" />
              </React.Fragment>
            ))}
            <Connector />
            <div className="px-4 py-2 rounded-full bg-gray-800 text-white text-xs font-bold tracking-wide">END</div>
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-8">
        <Btn onClick={() => save()} disabled={saving}>{saving ? "Saving…" : "Save"}</Btn>
        {!isNew && (
          <>
            <Btn variant={published ? "secondary" : "success"} onClick={() => save(!published)} disabled={saving}>{published ? "Unpublish" : "Publish"}</Btn>
            <Btn variant="secondary" onClick={testRun}>Test Run</Btn>
          </>
        )}
        <span className="text-xs text-gray-400 ml-1">{!isNew && `Ran ${runCount} time${runCount === 1 ? "" : "s"}${lastRunAt ? ` • last ${new Date(lastRunAt).toLocaleString()}` : ""}`}</span>
      </div>

      {!isNew && (
        <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5">
          <h3 className="font-bold text-gray-900 text-sm mb-3">Run History</h3>
          {runsLoading ? (
            <p className="text-sm text-gray-400">Loading…</p>
          ) : runs.length === 0 ? (
            <p className="text-sm text-gray-400">No runs yet.</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {runs.map((r) => (
                <div key={r._id} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <StatusBadge status={r.status === "success" ? "verified" : r.status === "failed" ? "rejected" : r.status === "waiting" ? "pending" : "draft"} />
                    <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleString()}</span>
                  </div>
                  {r.summary && <p className="text-xs font-semibold text-gray-700 mb-1">{r.summary}</p>}
                  <ul className="text-xs text-gray-500 space-y-0.5">
                    {(r.log || []).map((line, i) => <li key={i}>• {line}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showTriggerPicker && (
        <TriggerSidePanel meta={meta} onClose={() => setShowTriggerPicker(false)} onPick={(t) => { setTrigger(t); setTriggerScope({}); setShowTriggerPicker(false); }} />
      )}

      {(insertAt !== null || editIndex !== null) && (
        <StepPanel
          meta={meta}
          assignableUsers={assignableUsers}
          whatsappInstances={whatsappInstances}
          tags={tags}
          selfHostedSessions={selfHostedSessions}
          initialStep={editIndex !== null ? steps[editIndex] : null}
          onSave={saveStepFromPanel}
          onRemove={() => { removeStep(editIndex); setEditIndex(null); }}
          onClose={() => { setInsertAt(null); setEditIndex(null); }}
        />
      )}
    </div>
  );
}


function AutomationWorkflowPage({ toast }) {
  const navigate = useNavigate();
  const { id } = useParams();
  return id
    ? <AutomationWorkflowEditorPage toast={toast} navigate={navigate} workflowId={id} />
    : <AutomationWorkflowListPage toast={toast} navigate={navigate} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// PIPELINE — Super Admin panel (Contacts + Opportunities)
// ─────────────────────────────────────────────────────────────────────────────
// Populated by workflow actions (Create Contact, Add to Pipeline, Update
// Opportunity Stage) — see AutomationWorkflowPage above. Moving a card's
// stage here also fires opportunity_status_changed, same as a workflow
// doing it, so both directions stay interlinked.

function PipelinePage({ toast }) {
  const { API: api } = useAuth();
  const [tab, setTab] = useState("opportunities"); // opportunities | contacts
  const [opportunities, setOpportunities] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [stages, setStages] = useState([]);
  const [assignableUsers, setAssignableUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [noteDrafts, setNoteDrafts] = useState({});

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([api.get("/admin/opportunities"), api.get("/admin/contacts"), api.get("/admin/workflows/meta"), api.get("/admin/assignable-users")])
      .then(([oRes, cRes, mRes, uRes]) => {
        setOpportunities(oRes.data || []); setContacts(cRes.data || []);
        setStages(mRes.data?.pipelineStages || []); setAssignableUsers(uRes.data || []);
      })
      .catch(() => toast("Failed to load pipeline", "error"))
      .finally(() => setLoading(false));
  }, [api]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const changeStage = async (opp, stage) => {
    try {
      const res = await api.patch(`/admin/opportunities/${opp._id}/stage`, { stage });
      setOpportunities((prev) => prev.map((o) => (o._id === opp._id ? res.data : o)));
    } catch { toast("Failed to update stage", "error"); }
  };

  const addNote = async (contact) => {
    const text = (noteDrafts[contact._id] || "").trim();
    if (!text) return;
    try {
      const res = await api.post(`/admin/contacts/${contact._id}/notes`, { text });
      setContacts((prev) => prev.map((c) => (c._id === contact._id ? res.data : c)));
      setNoteDrafts((prev) => ({ ...prev, [contact._id]: "" }));
    } catch { toast("Failed to add note", "error"); }
  };

  const assignContact = async (contact, userId) => {
    try {
      const res = await api.patch(`/admin/contacts/${contact._id}/assign`, { userId: userId || null });
      setContacts((prev) => prev.map((c) => (c._id === contact._id ? res.data : c)));
    } catch { toast("Failed to assign", "error"); }
  };

  const exportCsv = (kind) => {
    const url = `${api.defaults.baseURL}/admin/${kind}/export.csv`;
    const token = localStorage.getItem("token");
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((blob) => {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `${kind}.csv`;
        link.click();
      })
      .catch(() => toast("Export failed", "error"));
  };

  const opportunitiesByStage = useMemo(() => {
    const grouped = {};
    for (const s of stages) grouped[s] = [];
    for (const o of opportunities) (grouped[o.stage] || (grouped[o.stage] = [])).push(o);
    return grouped;
  }, [opportunities, stages]);

  return (
    <div>
      <SectionHeader title="Pipeline"
        action={<Btn variant="secondary" onClick={() => exportCsv(tab === "opportunities" ? "opportunities" : "contacts")}>Download CSV</Btn>} />

      <div className="flex gap-2 mb-5">
        <Btn variant={tab === "opportunities" ? "primary" : "secondary"} size="sm" onClick={() => setTab("opportunities")}>Opportunities</Btn>
        <Btn variant={tab === "contacts" ? "primary" : "secondary"} size="sm" onClick={() => setTab("contacts")}>Contacts</Btn>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : tab === "opportunities" ? (
        opportunities.length === 0 ? (
          <EmptyState icon="📊" title="No opportunities yet" body='Add an "Add to Pipeline" action to a workflow — e.g. when a form is submitted — to start populating this.' />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {stages.map((stage) => (
              <div key={stage} className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 px-1">{stage} ({(opportunitiesByStage[stage] || []).length})</p>
                <div className="space-y-2">
                  {(opportunitiesByStage[stage] || []).map((o) => (
                    <div key={o._id} className="bg-white rounded-lg border border-gray-100 p-3">
                      <p className="text-sm font-semibold text-gray-900 truncate">{o.contact?.name || o.contact?.email || "Unknown"}</p>
                      <p className="text-xs text-gray-500 mb-2 truncate">{o.title} {o.value > 0 ? `• PKR ${o.value.toLocaleString()}` : ""}</p>
                      <select value={o.stage} onChange={(e) => changeStage(o, e.target.value)} className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white">
                        {stages.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      ) : contacts.length === 0 ? (
        <EmptyState icon="👤" title="No contacts yet" body='Add a "Create Contact" action to a workflow — e.g. when the contact form is submitted — to start populating this.' />
      ) : (
        <div className="space-y-3">
          {contacts.map((c) => (
            <div key={c._id} className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div>
                  <p className="font-bold text-gray-900">{c.name || "(no name)"}</p>
                  <p className="text-xs text-gray-500">{c.email} {c.phone ? `• ${c.phone}` : ""}</p>
                </div>
                <select value={c.assignedTo?._id || ""} onChange={(e) => assignContact(c, e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white">
                  <option value="">Unassigned</option>
                  {assignableUsers.map((u) => <option key={u._id} value={u._id}>{u.name} ({u.role})</option>)}
                </select>
              </div>
              {c.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {c.tags.map((t) => <span key={t} className="text-[10px] font-semibold bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full">{t}</span>)}
                </div>
              )}
              {c.notes?.length > 0 && (
                <div className="space-y-1 mb-2">
                  {c.notes.map((n, i) => <p key={i} className="text-xs text-gray-500">• {n.text}</p>)}
                </div>
              )}
              <div className="flex gap-2">
                <input value={noteDrafts[c._id] || ""} onChange={(e) => setNoteDrafts((p) => ({ ...p, [c._id]: e.target.value }))}
                  placeholder="Add a note…" className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5" />
                <Btn size="sm" variant="secondary" onClick={() => addNote(c)}>Add</Btn>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// REVIEW IMPORTER — Super Admin panel
// ─────────────────────────────────────────────────────────────────────────────
// Bulk-add reviews to any course from a CSV sheet — Student Name, Date,
// Stars, Review — the exact same fields/format every review on that
// course's landing page already uses (they're written into the same Review
// collection), so imported reviews show up there for real.

function ReviewImporterPage({ toast, courses }) {
  const { API: api } = useAuth();
  const [courseId, setCourseId] = useState("");
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const fileRef = useRef(null);

  // Every course, not just published ones — an admin may want reviews ready
  // before a course goes live.
  const allCourses = useMemo(() => (courses || []).filter((c) => c && c._id), [courses]);

  const loadReviews = useCallback((id) => {
    if (!id) { setReviews([]); return; }
    setReviewsLoading(true);
    api.get(`/admin/courses/${id}/reviews`).then((res) => setReviews(res.data || [])).catch(() => toast("Failed to load reviews", "error")).finally(() => setReviewsLoading(false));
  }, [api]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadReviews(courseId); }, [courseId, loadReviews]);

  const downloadTemplate = () => {
    const url = `${api.defaults.baseURL}/admin/reviews-template.csv`;
    const token = localStorage.getItem("token");
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((blob) => {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "review-import-sample.csv";
        link.click();
      })
      .catch(() => toast("Download failed", "error"));
  };

  const doImport = async () => {
    if (!courseId) { toast("Choose a course first", "error"); return; }
    if (!file) { toast("Choose a CSV file first", "error"); return; }
    setImporting(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post(`/admin/courses/${courseId}/reviews/import`, formData, { headers: { "Content-Type": "multipart/form-data" } });
      setResult(res.data);
      toast(`Imported ${res.data.imported} review${res.data.imported === 1 ? "" : "s"}`, "success");
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      loadReviews(courseId);
    } catch (err) {
      toast(err.response?.data?.message || "Import failed", "error");
    } finally {
      setImporting(false);
    }
  };

  const deleteReview = async (id) => {
    if (!window.confirm("Remove this review?")) return;
    try {
      await api.delete(`/admin/reviews/${id}`);
      setReviews((prev) => prev.filter((r) => r._id !== id));
    } catch { toast("Failed to remove review", "error"); }
  };

  return (
    <div className="max-w-3xl">
      <SectionHeader title="Review Importer" />
      <p className="text-sm text-gray-500 mb-5 -mt-2">Bulk-add reviews to any course's landing page from a CSV sheet — Excel opens and saves .csv files natively, so it works fine from Excel too.</p>

      <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 mb-5 space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Course</label>
          <select value={courseId} onChange={(e) => { setCourseId(e.target.value); setResult(null); }} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-rose-500">
            <option value="">Choose a course…</option>
            {allCourses.map((c) => <option key={c._id} value={c._id}>{c.title}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Sample template</label>
          <Btn variant="secondary" size="sm" onClick={downloadTemplate}>Download CSV sample</Btn>
          <p className="text-[11px] text-gray-400 mt-1.5">Columns: Student Name, Date, Stars (1–5), Review.</p>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Upload file</label>
          <input ref={fileRef} type="file" accept=".csv" onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:bg-rose-50 file:text-rose-600 file:text-xs file:font-bold" />
        </div>

        <Btn onClick={doImport} disabled={importing || !courseId || !file}>{importing ? "Importing…" : "Import Reviews"}</Btn>

        {result && (
          <div className={`rounded-lg p-3 text-xs ${result.skipped > 0 ? "bg-amber-50 text-amber-700" : "bg-green-50 text-green-700"}`}>
            <p className="font-bold mb-1">Imported {result.imported}, skipped {result.skipped}.</p>
            {result.errors?.length > 0 && (
              <ul className="space-y-0.5">
                {result.errors.map((e, i) => <li key={i}>• {e}</li>)}
              </ul>
            )}
          </div>
        )}
      </div>

      {courseId && (
        <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5">
          <h3 className="font-bold text-gray-900 text-sm mb-3">Current Reviews on This Course</h3>
          {reviewsLoading ? (
            <p className="text-sm text-gray-400">Loading…</p>
          ) : reviews.length === 0 ? (
            <p className="text-sm text-gray-400">No reviews yet for this course.</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {reviews.map((r) => (
                <div key={r._id} className="border border-gray-100 rounded-lg p-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900">{r.authorName || "Anonymous"} <span className="font-normal text-gray-400">• {"★".repeat(r.rating)} • {new Date(r.createdAt).toLocaleDateString()}</span></p>
                    <p className="text-xs text-gray-600 mt-0.5">{r.comment || r.text}</p>
                  </div>
                  <button onClick={() => deleteReview(r._id)} className="text-gray-300 hover:text-red-500 bg-transparent border-none cursor-pointer flex-shrink-0">✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FORMS — Super Admin panel
// ─────────────────────────────────────────────────────────────────────────────
// A catalog of the real forms already live on the site — "Form 1" (course
// enrollment) and "Form 2" (package inquiry) are seeded automatically and
// can't be deleted since real pages already send their slug. Their slug is
// what the Automation Workflow's "Form Submitted" trigger can scope to, so
// a workflow can react to just one specific form instead of every form.

// ─────────────────────────────────────────────────────────────────────────────
// TAGS — Super Admin panel
// ─────────────────────────────────────────────────────────────────────────────
// A simple named-tag registry — two sub-tabs, "All Tags" and "Create Tag",
// matching the Forms page's pattern. Tag names created here are meant as a
// maintained reference list (e.g. for the Add/Remove Contact Tag actions in
// Automation Workflow) so tag names stay consistent instead of being
// free-typed differently each time.

// ─────────────────────────────────────────────────────────────────────────────
// WHATSAPP — Super Admin panel (WaBulkify — multiple QR-connected numbers)
// ─────────────────────────────────────────────────────────────────────────────
// "Add a WhatsApp Number" creates an instance on WaBulkify, shows its QR
// code to scan, then polls until the webhook (POST /api/whatsapp/webhook)
// reports it connected — add as many numbers as you want this way. Any
// connected instance can then be picked as the sender in the Automation
// Workflow's "Send WhatsApp Message" action.

function WhatsAppPage({ toast }) {
  const [subTab, setSubTab] = useState("numbers"); // numbers | messages | aibot | selfhosted
  const { API: api } = useAuth();
  const [instances, setInstances] = useState([]);
  const [loadingInstances, setLoadingInstances] = useState(true);

  const loadInstances = useCallback(() => {
    setLoadingInstances(true);
    api.get("/admin/whatsapp/instances").then((res) => setInstances(res.data || [])).catch(() => toast("Failed to load WhatsApp numbers", "error")).finally(() => setLoadingInstances(false));
  }, [api]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadInstances(); }, [loadInstances]);

  return (
    <div>
      <SectionHeader title="WhatsApp" />
      <div className="flex gap-2 mb-5 flex-wrap">
        <Btn variant={subTab === "numbers" ? "primary" : "secondary"} size="sm" onClick={() => setSubTab("numbers")}>Numbers</Btn>
        <Btn variant={subTab === "messages" ? "primary" : "secondary"} size="sm" onClick={() => setSubTab("messages")}>Messages</Btn>
        <Btn variant={subTab === "aibot" ? "primary" : "secondary"} size="sm" onClick={() => setSubTab("aibot")}>AI Bot</Btn>
        <Btn variant={subTab === "selfhosted" ? "primary" : "secondary"} size="sm" onClick={() => setSubTab("selfhosted")}>Self-Hosted Server</Btn>
      </div>
      {subTab === "numbers" ? (
        <NumbersTab toast={toast} instances={instances} loadingInstances={loadingInstances} setInstances={setInstances} loadInstances={loadInstances} />
      ) : subTab === "messages" ? (
        <MessagesTab toast={toast} instances={instances} />
      ) : subTab === "selfhosted" ? (
        <SelfHostedServerTab toast={toast} />
      ) : (
        <AiBotTab toast={toast} instances={instances} />
      )}
    </div>
  );
}

function NumbersTab({ toast, instances, loadingInstances, setInstances, loadInstances }) {
  const { API: api } = useAuth();
  const [tokenConnected, setTokenConnected] = useState(false);
  const [tokenInput, setTokenInput] = useState("");
  const [tokenLoading, setTokenLoading] = useState(true);
  const [savingToken, setSavingToken] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addLabel, setAddLabel] = useState("");
  const [addInstanceId, setAddInstanceId] = useState("");
  const [qrFor, setQrFor] = useState(null); // instance currently showing its QR
  const [qrImage, setQrImage] = useState("");
  const [qrLoading, setQrLoading] = useState(false);
  const [qrDebugRaw, setQrDebugRaw] = useState("");

  const loadToken = useCallback(() => {
    setTokenLoading(true);
    api.get("/admin/settings/wabulkify").then((res) => setTokenConnected(!!res.data?.connected)).catch(() => {}).finally(() => setTokenLoading(false));
  }, [api]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadToken(); }, [loadToken]);

  const openQr = async (instance) => {
    setQrFor(instance);
    setQrImage("");
    setQrDebugRaw("");
    setQrLoading(true);
    try {
      const res = await api.post(`/admin/whatsapp/instances/${instance._id}/qrcode`);
      if (res.data?.qrCode) {
        setQrImage(res.data.qrCode);
      } else {
        setQrDebugRaw(res.data?.raw || "");
        toast("WaBulkify didn't return a QR image — see the details below.", "error");
      }
    } catch (err) { toast(err.response?.data?.message || "Failed to fetch QR code", "error"); }
    finally { setQrLoading(false); }
  };

  const saveToken = async () => {
    if (!tokenInput.trim()) { toast("Enter your WaBulkify access token", "error"); return; }
    setSavingToken(true);
    try {
      await api.post("/admin/settings/wabulkify", { accessToken: tokenInput.trim() });
      setTokenInput(""); setTokenConnected(true);
      toast("WaBulkify connected", "success");
    } catch (err) { toast(err.response?.data?.message || "Failed to save token", "error"); }
    finally { setSavingToken(false); }
  };
  const disconnectToken = async () => {
    if (!window.confirm("Disconnect WaBulkify? Every connected number will stop being able to send until you reconnect.")) return;
    try { await api.delete("/admin/settings/wabulkify"); setTokenConnected(false); toast("Disconnected", "success"); }
    catch { toast("Failed to disconnect", "error"); }
  };

  // This is the only way to add a number — WaBulkify's own support team
  // confirmed QR scanning only works on their dashboard, not through a
  // custom one, so "create instance, show our own QR" genuinely can't work
  // here. You connect the number on wabulkify.com, then register its
  // Instance ID here so it shows up as an option in Automation Workflow.
  // There's also no "list all my instances" endpoint in WaBulkify's
  // documented API, so each number has to be added this way, one at a time.
  const addInstance = async () => {
    if (!addLabel.trim() || !addInstanceId.trim()) { toast("Both fields are required", "error"); return; }
    setBusyId("add");
    try {
      const res = await api.post("/admin/whatsapp/instances/manual", { label: addLabel.trim(), instanceId: addInstanceId.trim() });
      setInstances((prev) => [res.data, ...prev]);
      setAddLabel(""); setAddInstanceId(""); setShowAddForm(false);
      toast(`"${res.data.label}" added — send a test message from the Messages tab to confirm it's really connected`, "success");
    } catch (err) { toast(err.response?.data?.message || "Failed to add instance", "error"); }
    finally { setBusyId(null); }
  };

  const runAction = async (instance, action) => {
    setBusyId(instance._id);
    try {
      const res = await api.post(`/admin/whatsapp/instances/${instance._id}/${action}`);
      setInstances((prev) => prev.map((i) => (i._id === instance._id ? res.data : i)));
      toast(`${action[0].toUpperCase() + action.slice(1)} done`, "success");
    } catch (err) { toast(err.response?.data?.message || `Failed to ${action}`, "error"); }
    finally { setBusyId(null); }
  };

  const deleteInstance = async (instance) => {
    if (!window.confirm(`Remove "${instance.label}"? This only removes it here — it stays connected on WaBulkify's dashboard.`)) return;
    try { await api.delete(`/admin/whatsapp/instances/${instance._id}`); setInstances((prev) => prev.filter((i) => i._id !== instance._id)); toast("Removed", "success"); }
    catch { toast("Failed to remove", "error"); }
  };

  return (
    <div>
      <p className="text-sm text-gray-500 mb-5">
        Per WaBulkify support: numbers are connected by scanning a QR code on <a href="https://wabulkify.com" target="_blank" rel="noreferrer" className="text-rose-600 underline">wabulkify.com</a> directly — that step can't happen here. Once a number is connected there, register it below with its Instance ID so it becomes available as a sender in Automation Workflow's "Send WhatsApp Message" action (for individual messages and groups alike). Not sure it's really connected? Use the <strong>Messages</strong> tab above to send a real test message.
      </p>

      <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 mb-6">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold text-gray-800 text-sm">WaBulkify Account</h3>
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${tokenConnected ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"}`}>
            {tokenConnected ? "Connected" : "Not connected"}
          </span>
        </div>
        <p className="text-xs text-gray-500 mb-3">One access token from your wabulkify.com account authenticates every number below — needed for sending, reboot, reconnect, etc.</p>
        {tokenLoading ? (
          <p className="text-xs text-gray-400">Loading…</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            <input type="password" value={tokenInput} onChange={(e) => setTokenInput(e.target.value)} placeholder={tokenConnected ? "Enter a new token to replace it" : "Paste your WaBulkify access token"}
              className="flex-1 min-w-[220px] border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
            <Btn onClick={saveToken} disabled={savingToken}>{savingToken ? "Saving…" : tokenConnected ? "Update" : "Connect"}</Btn>
            {tokenConnected && <Btn variant="danger" onClick={disconnectToken}>Disconnect</Btn>}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h3 className="font-bold text-gray-800 text-sm">Connected Numbers</h3>
        <Btn onClick={() => setShowAddForm(true)} disabled={!tokenConnected}>+ Add WhatsApp Number</Btn>
      </div>
      {!tokenConnected && <p className="text-xs text-amber-600 mb-3">Connect your WaBulkify account above first.</p>}

      {showAddForm && (
        <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
          <p className="text-xs text-gray-500 mb-3">
            1. Go to your <a href="https://wabulkify.com" target="_blank" rel="noreferrer" className="text-rose-600 underline">WaBulkify dashboard</a> and add/scan a WhatsApp number there.<br/>
            2. Copy the Instance ID it shows you (e.g. <code className="bg-gray-100 px-1 rounded">6AB3A1A76BD76</code>).<br/>
            3. Paste it below to make it available here.
          </p>
          <div className="flex flex-wrap gap-2">
            <input value={addLabel} onChange={(e) => setAddLabel(e.target.value)} placeholder="Name this number — e.g. Sales, Support"
              className="flex-1 min-w-[160px] border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
            <input value={addInstanceId} onChange={(e) => setAddInstanceId(e.target.value)} placeholder="Instance ID from WaBulkify's dashboard"
              className="flex-1 min-w-[200px] border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
            <Btn onClick={addInstance} disabled={busyId === "add"}>{busyId === "add" ? "Adding…" : "Add"}</Btn>
            <Btn variant="secondary" onClick={() => setShowAddForm(false)}>Cancel</Btn>
          </div>
        </div>
      )}

      {loadingInstances ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : instances.length === 0 ? (
        <EmptyState icon="💬" title="No numbers added yet" body={'Connect a number on WaBulkify\'s dashboard first, then click "+ Add WhatsApp Number" and paste its Instance ID here.'} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {instances.map((inst) => (
            <div key={inst._id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="font-bold text-gray-900">{inst.label}</p>
                <StatusBadge status={inst.status === "connected" ? "verified" : inst.status === "disconnected" ? "rejected" : "pending"} />
              </div>
              <p className="text-xs text-gray-500 mb-3 font-mono">{inst.instanceId}</p>
              <div className="flex flex-wrap gap-1.5">
                <Btn size="sm" onClick={() => openQr(inst)} disabled={qrLoading && qrFor?._id === inst._id}>Show QR</Btn>
                <Btn size="sm" variant="secondary" onClick={() => runAction(inst, "reconnect")} disabled={busyId === inst._id}>Reconnect</Btn>
                <Btn size="sm" variant="secondary" onClick={() => runAction(inst, "reboot")} disabled={busyId === inst._id}>Reboot</Btn>
                <Btn size="sm" variant="danger" onClick={() => deleteInstance(inst)} disabled={busyId === inst._id}>Remove</Btn>
              </div>
            </div>
          ))}
        </div>
      )}

      {qrFor && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4" onClick={() => setQrFor(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 mb-1">Scan to connect "{qrFor.label}"</h3>
            <p className="text-xs text-gray-500 mb-4">Open WhatsApp on that phone → Linked Devices → Link a Device, then scan this code.</p>
            {qrLoading ? (
              <p className="text-sm text-gray-400 py-10">Loading QR code…</p>
            ) : qrImage ? (
              <img src={qrImage.startsWith("http") || qrImage.startsWith("data:") ? qrImage : `data:image/png;base64,${qrImage}`} alt="WhatsApp QR code" className="w-56 h-56 mx-auto rounded-lg border border-gray-100" />
            ) : (
              <div className="text-left">
                <p className="text-sm text-amber-600 mb-2">No QR image came back — WaBulkify's response didn't contain one.</p>
                {qrDebugRaw && (
                  <pre className="text-[10px] text-gray-500 bg-gray-50 border border-gray-100 rounded-lg p-2 overflow-x-auto whitespace-pre-wrap break-all max-h-32">{qrDebugRaw}</pre>
                )}
              </div>
            )}
            <Btn variant="secondary" onClick={() => setQrFor(null)} className="mt-4">Close</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

// Per-account message history + "Send a Message" — the most reliable way
// to actually confirm a number is connected: if a real message goes out
// (and, ideally, arrives), it's genuinely connected, independent of
// whatever the status badge says.
function MessagesTab({ toast, instances }) {
  const { API: api } = useAuth();
  const [selectedId, setSelectedId] = useState("");
  const [data, setData] = useState({ messages: [], sentCount: 0, receivedCount: 0, failedCount: 0 });
  const [loading, setLoading] = useState(false);
  const [showSend, setShowSend] = useState(false);
  const [recipientType, setRecipientType] = useState("individual");
  const [to, setTo] = useState("");
  const [groupId, setGroupId] = useState("");
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (instances.length > 0 && !selectedId) setSelectedId(instances[0]._id);
  }, [instances]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMessages = useCallback(() => {
    if (!selectedId) return;
    setLoading(true);
    api.get(`/admin/whatsapp/messages?instanceId=${instances.find((i) => i._id === selectedId)?.instanceId}`)
      .then((res) => setData(res.data || {}))
      .catch(() => toast("Failed to load messages", "error"))
      .finally(() => setLoading(false));
  }, [api, selectedId, instances]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadMessages(); }, [loadMessages]);

  const sendMessage = async () => {
    if (!messageText.trim()) { toast("Write a message first", "error"); return; }
    if (recipientType === "group" ? !groupId.trim() : !to.trim()) { toast(recipientType === "group" ? "Group ID is required" : "Recipient number is required", "error"); return; }
    setSending(true);
    try {
      await api.post("/admin/whatsapp/send", { instanceId: selectedId, recipientType, to, groupId, message: messageText.trim() });
      toast("Sent — check the recipient's WhatsApp to confirm it arrived", "success");
      setMessageText(""); setTo(""); setGroupId(""); setShowSend(false);
      loadMessages();
    } catch (err) { toast(err.response?.data?.message || "Send failed — this number likely isn't really connected", "error"); }
    finally { setSending(false); }
  };

  if (instances.length === 0) {
    return <EmptyState icon="💬" title="No numbers yet" body='Add a WhatsApp number in the "Numbers" tab first.' />;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
          {instances.map((i) => <option key={i._id} value={i._id}>{i.label}</option>)}
        </select>
        <Btn onClick={() => setShowSend(true)}>Send a Message</Btn>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{data.sentCount || 0}</p>
          <p className="text-xs text-gray-500">Sent</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{data.receivedCount || 0}</p>
          <p className="text-xs text-gray-500">Received</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-red-500">{data.failedCount || 0}</p>
          <p className="text-xs text-gray-500">Failed</p>
        </div>
      </div>

      {showSend && (
        <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4 space-y-2.5">
          <div className="flex gap-3 text-xs">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="radio" checked={recipientType !== "group"} onChange={() => setRecipientType("individual")} className="accent-rose-600" /> Individual
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="radio" checked={recipientType === "group"} onChange={() => setRecipientType("group")} className="accent-rose-600" /> Group
            </label>
          </div>
          {recipientType === "group" ? (
            <input value={groupId} onChange={(e) => setGroupId(e.target.value)} placeholder="Group ID (e.g. 8498761234@g.us)" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          ) : (
            <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="Phone number, with country code" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          )}
          <textarea value={messageText} onChange={(e) => setMessageText(e.target.value)} rows={3} placeholder="Message…" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none" />
          <div className="flex gap-2">
            <Btn onClick={sendMessage} disabled={sending}>{sending ? "Sending…" : "Send"}</Btn>
            <Btn variant="secondary" onClick={() => setShowSend(false)}>Cancel</Btn>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : data.messages?.length === 0 ? (
        <EmptyState icon="📭" title="No messages yet" body="Messages sent from this number (via workflows or manually) and any WaBulkify reports as incoming will show up here." />
      ) : (
        <div className="space-y-2">
          {data.messages?.map((m) => (
            <div key={m._id} className={`rounded-xl p-3 border text-sm ${m.direction === "outgoing" ? "bg-rose-50/50 border-rose-100" : "bg-gray-50 border-gray-100"}`}>
              <div className="flex items-center justify-between mb-1 flex-wrap gap-1">
                <span className="text-xs font-bold text-gray-700">{m.direction === "outgoing" ? "→" : "←"} {m.groupId || m.number || "Unknown"}</span>
                <div className="flex items-center gap-2">
                  {m.status === "failed" && <span className="text-[10px] font-bold text-red-500">FAILED</span>}
                  {m.source && <span className="text-[10px] text-gray-400">{m.source}</span>}
                  <span className="text-[11px] text-gray-400">{new Date(m.createdAt).toLocaleString()}</span>
                </div>
              </div>
              <p className="text-gray-700">{m.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


// "Train AI Bot" — write instructions (system prompt), pick a model, choose
// exactly which connected numbers should auto-reply, and test it live
// before turning it on for real customers. Uses Anthropic's Messages API
// directly — a real, documented API, unlike the WaBulkify field-guessing
// this has needed elsewhere.
function AiBotTab({ toast, instances }) {
  const { API: api } = useAuth();
  const [tokenConnected, setTokenConnected] = useState(false);
  const [tokenInput, setTokenInput] = useState("");
  const [tokenLoading, setTokenLoading] = useState(true);
  const [savingToken, setSavingToken] = useState(false);
  const [settings, setSettings] = useState({ enabled: false, instructions: "", model: "claude-haiku-4-5-20251001", enabledInstanceIds: [] });
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testInput, setTestInput] = useState("");
  const [testHistory, setTestHistory] = useState([]); // [{role, content}]
  const [testing, setTesting] = useState(false);

  const loadToken = useCallback(() => {
    setTokenLoading(true);
    api.get("/admin/settings/anthropic").then((res) => setTokenConnected(!!res.data?.connected)).catch(() => {}).finally(() => setTokenLoading(false));
  }, [api]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadSettings = useCallback(() => {
    setLoadingSettings(true);
    api.get("/admin/whatsapp/bot-settings").then((res) => setSettings(res.data || {})).catch(() => toast("Failed to load bot settings", "error")).finally(() => setLoadingSettings(false));
  }, [api]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadToken(); loadSettings(); }, [loadToken, loadSettings]);

  const saveToken = async () => {
    if (!tokenInput.trim()) { toast("Enter your Anthropic API key", "error"); return; }
    setSavingToken(true);
    try {
      await api.post("/admin/settings/anthropic", { apiKey: tokenInput.trim() });
      setTokenInput(""); setTokenConnected(true);
      toast("Anthropic API connected", "success");
    } catch (err) { toast(err.response?.data?.message || "Failed to save key", "error"); }
    finally { setSavingToken(false); }
  };
  const disconnectToken = async () => {
    if (!window.confirm("Disconnect the Anthropic API key? The AI Bot will stop working until you reconnect.")) return;
    try { await api.delete("/admin/settings/anthropic"); setTokenConnected(false); toast("Disconnected", "success"); }
    catch { toast("Failed to disconnect", "error"); }
  };

  const saveSettings = async (patch) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    setSaving(true);
    try {
      const res = await api.post("/admin/whatsapp/bot-settings", next);
      setSettings(res.data);
    } catch (err) { toast(err.response?.data?.message || "Failed to save", "error"); }
    finally { setSaving(false); }
  };

  const toggleInstanceEnabled = (instanceId) => {
    const has = settings.enabledInstanceIds.includes(instanceId);
    const next = has ? settings.enabledInstanceIds.filter((id) => id !== instanceId) : [...settings.enabledInstanceIds, instanceId];
    saveSettings({ enabledInstanceIds: next });
  };

  const sendTest = async () => {
    if (!testInput.trim()) return;
    const userMsg = { role: "user", content: testInput.trim() };
    setTestHistory((prev) => [...prev, userMsg]);
    setTestInput("");
    setTesting(true);
    try {
      const res = await api.post("/admin/whatsapp/bot-test", { message: userMsg.content, history: testHistory });
      setTestHistory((prev) => [...prev, { role: "assistant", content: res.data?.reply || "" }]);
    } catch (err) {
      toast(err.response?.data?.message || "Test failed", "error");
      setTestHistory((prev) => prev.slice(0, -1));
    } finally { setTesting(false); }
  };

  return (
    <div>
      <p className="text-sm text-gray-500 mb-5">
        Auto-replies to incoming WhatsApp messages using Claude, based on the instructions you write below. It only runs on numbers you explicitly turn it on for — connecting a new number never starts auto-responding by itself.
      </p>

      <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 mb-6">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold text-gray-800 text-sm">Anthropic API</h3>
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${tokenConnected ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"}`}>
            {tokenConnected ? "Connected" : "Not connected"}
          </span>
        </div>
        <p className="text-xs text-gray-500 mb-3">Get a key from <a href="https://console.anthropic.com" target="_blank" rel="noreferrer" className="text-rose-600 underline">console.anthropic.com</a> → API Keys.</p>
        {tokenLoading ? (
          <p className="text-xs text-gray-400">Loading…</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            <input type="password" value={tokenInput} onChange={(e) => setTokenInput(e.target.value)} placeholder={tokenConnected ? "Enter a new key to replace it" : "Paste your Anthropic API key"}
              className="flex-1 min-w-[220px] border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
            <Btn onClick={saveToken} disabled={savingToken}>{savingToken ? "Saving…" : tokenConnected ? "Update" : "Connect"}</Btn>
            {tokenConnected && <Btn variant="danger" onClick={disconnectToken}>Disconnect</Btn>}
          </div>
        )}
      </div>

      {loadingSettings ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800 text-sm">Bot Status</h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={settings.enabled} onChange={(e) => saveSettings({ enabled: e.target.checked })} className="w-4 h-4 accent-rose-600" disabled={!tokenConnected} />
                <span className="text-sm font-semibold text-gray-700">{settings.enabled ? "Enabled" : "Disabled"}</span>
              </label>
            </div>
            {!tokenConnected && <p className="text-xs text-amber-600 mb-3">Connect your Anthropic API key above first.</p>}

            <label className="block text-xs font-bold text-gray-600 mb-1">Model</label>
            <select value={settings.model} onChange={(e) => saveSettings({ model: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white mb-4">
              <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5 — fastest, cheapest, good for quick replies</option>
              <option value="claude-sonnet-5">Claude Sonnet 5 — more capable, a bit slower</option>
            </select>

            <label className="block text-xs font-bold text-gray-600 mb-1">Which numbers should auto-reply?</label>
            {instances.length === 0 ? (
              <p className="text-xs text-gray-400">Add a WhatsApp number in the Numbers tab first.</p>
            ) : (
              <div className="space-y-1.5">
                {instances.map((inst) => (
                  <label key={inst._id} className="flex items-center gap-2 cursor-pointer text-sm">
                    <input type="checkbox" checked={settings.enabledInstanceIds.includes(inst.instanceId)} onChange={() => toggleInstanceEnabled(inst.instanceId)} className="w-4 h-4 accent-rose-600" />
                    {inst.label}
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 mb-6">
            <h3 className="font-bold text-gray-800 text-sm mb-1">Train the Bot</h3>
            <p className="text-xs text-gray-500 mb-3">Describe your business, what it should answer, its tone, and when it should say it can't help and a human will follow up — the more specific, the better.</p>
            <textarea
              value={settings.instructions}
              onChange={(e) => setSettings((s) => ({ ...s, instructions: e.target.value }))}
              onBlur={() => saveSettings({ instructions: settings.instructions })}
              rows={8}
              placeholder={'e.g. "You are a support assistant for Motiviam, an e-commerce and digital marketing course platform. Answer questions about course pricing, content, and enrollment using only the facts given here: [list your courses/prices]. Keep replies short and friendly, in the language the customer writes in. If asked about a refund or anything you\'re unsure about, say a team member will follow up shortly — never promise a refund or discount yourself."'}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            {saving && <p className="text-[11px] text-gray-400 mt-1">Saving…</p>}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5">
            <h3 className="font-bold text-gray-800 text-sm mb-1">Test Chat</h3>
            <p className="text-xs text-gray-500 mb-3">Try it here — this never touches real WhatsApp, it's just you and the bot, using whatever's saved above.</p>
            <div className="border border-gray-100 rounded-lg p-3 h-64 overflow-y-auto mb-3 bg-gray-50 space-y-2">
              {testHistory.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-8">Send a message below to try it out.</p>
              ) : (
                testHistory.map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${m.role === "user" ? "bg-rose-100 text-gray-800" : "bg-white border border-gray-200 text-gray-700"}`}>{m.content}</div>
                  </div>
                ))
              )}
              {testing && <p className="text-xs text-gray-400">Thinking…</p>}
            </div>
            <div className="flex gap-2">
              <input value={testInput} onChange={(e) => setTestInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendTest()}
                placeholder="Type a message as a customer would…" disabled={!tokenConnected}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
              <Btn onClick={sendTest} disabled={testing || !tokenConnected}>Send</Btn>
              {testHistory.length > 0 && <Btn variant="secondary" onClick={() => setTestHistory([])}>Clear</Btn>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Self-built WhatsApp connection (Baileys), no WaBulkify involved — real
// numbers, real QR codes, single sends, bulk sends with pacing between
// messages, and an external API key so another app/service can send
// through it too.
function SelfHostedServerTab({ toast }) {
  const { API: api } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [creating, setCreating] = useState(false);
  const [qrSession, setQrSession] = useState(null);
  const [qrImage, setQrImage] = useState("");
  const [qrStatus, setQrStatus] = useState("pending_qr");
  const [busyId, setBusyId] = useState(null);
  const [apiKey, setApiKey] = useState("");
  const [generatingKey, setGeneratingKey] = useState(false);
  const [showSend, setShowSend] = useState(null); // session for single-send form
  const [sendTo, setSendTo] = useState("");
  const [sendMsg, setSendMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [showBulk, setShowBulk] = useState(null); // session for bulk-send form
  const [bulkNumbers, setBulkNumbers] = useState("");
  const [bulkMsg, setBulkMsg] = useState("");
  const [bulkJobId, setBulkJobId] = useState(null);
  const [bulkJob, setBulkJob] = useState(null);
  const [startingBulk, setStartingBulk] = useState(false);

  const loadSessions = useCallback(() => {
    setLoading(true);
    api.get("/admin/whatsapp-server/sessions").then((res) => setSessions(res.data || [])).catch(() => toast("Failed to load sessions — is the server installed? See the note below if not.", "error")).finally(() => setLoading(false));
  }, [api]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadKey = useCallback(() => {
    api.get("/admin/settings/whatsapp-server-key").then((res) => setApiKey(res.data?.apiKey || "")).catch(() => {});
  }, [api]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadSessions(); loadKey(); }, [loadSessions, loadKey]);

  const createSession = async () => {
    if (!newLabel.trim()) { toast("Name this number first", "error"); return; }
    setCreating(true);
    try {
      const res = await api.post("/admin/whatsapp-server/sessions", { label: newLabel.trim() });
      setSessions((prev) => [res.data, ...prev]);
      setNewLabel(""); setShowAdd(false);
      openQr(res.data);
    } catch (err) { toast(err.response?.data?.message || "Failed to create session", "error"); }
    finally { setCreating(false); }
  };

  const openQr = (session) => {
    setQrSession(session);
    setQrImage("");
    setQrStatus("pending_qr");
  };

  // Polls for the QR (Baileys emits it asynchronously) and then for the
  // connected status, while the QR modal is open.
  useEffect(() => {
    if (!qrSession) return;
    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/admin/whatsapp-server/sessions/${qrSession._id}/qr`);
        setQrStatus(res.data?.status || "pending_qr");
        if (res.data?.qr) setQrImage(`https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(res.data.qr)}`);
        if (res.data?.status === "connected") {
          toast(`"${qrSession.label}" connected!`, "success");
          setQrSession(null);
          loadSessions();
        }
      } catch { /* keep polling */ }
    }, 3000);
    return () => clearInterval(interval);
  }, [qrSession, api]); // eslint-disable-line react-hooks/exhaustive-deps

  const reconnect = async (session) => {
    setBusyId(session._id);
    try {
      await api.post(`/admin/whatsapp-server/sessions/${session._id}/reconnect`);
      toast("Reconnecting…", "success");
      openQr(session);
    } catch (err) { toast(err.response?.data?.message || "Failed to reconnect", "error"); }
    finally { setBusyId(null); }
  };

  const removeSession = async (session) => {
    if (!window.confirm(`Remove "${session.label}"? This logs it out completely.`)) return;
    try { await api.delete(`/admin/whatsapp-server/sessions/${session._id}`); setSessions((prev) => prev.filter((s) => s._id !== session._id)); toast("Removed", "success"); }
    catch { toast("Failed to remove", "error"); }
  };

  const generateKey = async () => {
    setGeneratingKey(true);
    try { const res = await api.post("/admin/settings/whatsapp-server-key"); setApiKey(res.data?.apiKey || ""); toast("New API key generated", "success"); }
    catch { toast("Failed to generate key", "error"); }
    finally { setGeneratingKey(false); }
  };

  const sendSingle = async () => {
    if (!sendTo.trim() || !sendMsg.trim()) { toast("Number and message are required", "error"); return; }
    setSending(true);
    try {
      await api.post("/admin/whatsapp-server/send", { sessionDocId: showSend._id, to: sendTo.trim(), message: sendMsg.trim() });
      toast("Sent", "success");
      setSendTo(""); setSendMsg(""); setShowSend(null);
    } catch (err) { toast(err.response?.data?.message || "Send failed", "error"); }
    finally { setSending(false); }
  };

  const startBulk = async () => {
    const numbers = bulkNumbers.split(/[\n,]+/).map((n) => n.trim()).filter(Boolean);
    if (numbers.length === 0 || !bulkMsg.trim()) { toast("Add at least one number and a message", "error"); return; }
    setStartingBulk(true);
    try {
      const res = await api.post("/admin/whatsapp-server/send-bulk", { sessionDocId: showBulk._id, numbers, message: bulkMsg.trim() });
      setBulkJobId(res.data.jobId);
      toast(`Bulk send started for ${numbers.length} number${numbers.length === 1 ? "" : "s"}`, "success");
    } catch (err) { toast(err.response?.data?.message || "Failed to start bulk send", "error"); }
    finally { setStartingBulk(false); }
  };

  useEffect(() => {
    if (!bulkJobId) return;
    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/admin/whatsapp-server/bulk-jobs/${bulkJobId}`);
        setBulkJob(res.data);
        if (res.data?.status === "done") clearInterval(interval);
      } catch { /* keep polling */ }
    }, 2000);
    return () => clearInterval(interval);
  }, [bulkJobId, api]);

  return (
    <div>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 text-xs text-amber-700 leading-relaxed">
        <strong>Before you use this:</strong> this connects to WhatsApp the same unofficial way WaBulkify does — it isn't Meta's official Business API. WhatsApp's Terms of Service don't allow automated/bulk messaging this way, and numbers used for it can be banned by Meta, especially for bulk sends. Use real pacing (already built in below) and avoid sending to people who haven't messaged you first or opted in.
      </div>

      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h3 className="font-bold text-gray-800 text-sm">Connected Numbers</h3>
        <Btn onClick={() => setShowAdd(true)}>+ Add a Number</Btn>
      </div>

      {showAdd && (
        <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4 flex flex-wrap gap-2 items-center">
          <input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Name this number — e.g. Sales, Support"
            className="flex-1 min-w-[200px] border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
          <Btn onClick={createSession} disabled={creating}>{creating ? "Creating…" : "Create & Show QR"}</Btn>
          <Btn variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Btn>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : sessions.length === 0 ? (
        <EmptyState icon="💬" title="No numbers yet" body='Click "+ Add a Number" to connect your first one by scanning a QR code.' />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {sessions.map((s) => (
            <div key={s._id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="font-bold text-gray-900">{s.label}</p>
                <StatusBadge status={s.status === "connected" ? "verified" : s.status === "disconnected" ? "rejected" : "pending"} />
              </div>
              <p className="text-xs text-gray-500 mb-3">{s.phoneNumber || "Not connected yet"}</p>
              <div className="flex flex-wrap gap-1.5">
                {s.status !== "connected" && <Btn size="sm" onClick={() => openQr(s)}>Show QR</Btn>}
                {s.status === "connected" && <Btn size="sm" onClick={() => setShowSend(s)}>Send Message</Btn>}
                {s.status === "connected" && <Btn size="sm" variant="secondary" onClick={() => setShowBulk(s)}>Bulk Send</Btn>}
                <Btn size="sm" variant="secondary" onClick={() => reconnect(s)} disabled={busyId === s._id}>Reconnect</Btn>
                <Btn size="sm" variant="danger" onClick={() => removeSession(s)} disabled={busyId === s._id}>Remove</Btn>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5">
        <h3 className="font-bold text-gray-800 text-sm mb-1">External API Access</h3>
        <p className="text-xs text-gray-500 mb-3">Let another app or service send through this server too — no Super Admin login needed, just this key. POST to <code className="bg-gray-100 px-1 rounded">/api/whatsapp-server/external/send</code> with <code className="bg-gray-100 px-1 rounded">{"{ apiKey, sessionId, to, message }"}</code> (sessionId is the connected number's ID shown above).</p>
        <div className="flex flex-wrap gap-2 items-center">
          <input readOnly value={apiKey || "No key generated yet"} className="flex-1 min-w-[220px] border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 font-mono" />
          <Btn variant="secondary" onClick={generateKey} disabled={generatingKey}>{generatingKey ? "Generating…" : apiKey ? "Regenerate" : "Generate Key"}</Btn>
        </div>
      </div>

      {qrSession && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4" onClick={() => setQrSession(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 mb-1">Scan to connect "{qrSession.label}"</h3>
            <p className="text-xs text-gray-500 mb-4">Open WhatsApp on that phone → Linked Devices → Link a Device, then scan this code.</p>
            {qrImage ? (
              <img src={qrImage} alt="WhatsApp QR code" className="w-56 h-56 mx-auto rounded-lg border border-gray-100" />
            ) : (
              <p className="text-sm text-gray-400 py-10">Waiting for the QR code…</p>
            )}
            <p className="text-xs text-gray-400 mt-4">Checking connection status automatically…</p>
            <Btn variant="secondary" onClick={() => setQrSession(null)} className="mt-3">Close</Btn>
          </div>
        </div>
      )}

      {showSend && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4" onClick={() => setShowSend(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 mb-3">Send from "{showSend.label}"</h3>
            <input value={sendTo} onChange={(e) => setSendTo(e.target.value)} placeholder="Number, with country code" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-2" />
            <textarea value={sendMsg} onChange={(e) => setSendMsg(e.target.value)} rows={3} placeholder="Message…" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none mb-3" />
            <div className="flex gap-2">
              <Btn onClick={sendSingle} disabled={sending}>{sending ? "Sending…" : "Send"}</Btn>
              <Btn variant="secondary" onClick={() => setShowSend(null)}>Cancel</Btn>
            </div>
          </div>
        </div>
      )}

      {showBulk && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4" onClick={() => { setShowBulk(null); setBulkJobId(null); setBulkJob(null); }}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 mb-1">Bulk Send from "{showBulk.label}"</h3>
            <p className="text-xs text-gray-500 mb-3">One number per line (or comma-separated). Sent with a few seconds' pace between each — this takes a while for a large list, and that's intentional.</p>
            <textarea value={bulkNumbers} onChange={(e) => setBulkNumbers(e.target.value)} rows={5} placeholder={"923001234567\n923009876543"} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none mb-2 font-mono" />
            <textarea value={bulkMsg} onChange={(e) => setBulkMsg(e.target.value)} rows={3} placeholder="Message…" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none mb-3" />
            <div className="flex gap-2 mb-3">
              <Btn onClick={startBulk} disabled={startingBulk || !!bulkJobId}>{startingBulk ? "Starting…" : "Start Bulk Send"}</Btn>
              <Btn variant="secondary" onClick={() => { setShowBulk(null); setBulkJobId(null); setBulkJob(null); }}>Close</Btn>
            </div>
            {bulkJob && (
              <div className="border border-gray-100 rounded-lg p-3 bg-gray-50">
                <p className="text-xs font-bold text-gray-700 mb-2">
                  {bulkJob.status === "done" ? "Done" : "Sending…"} — {bulkJob.results.length} / {bulkJob.numbers.length}
                  {" "}({bulkJob.results.filter((r) => r.success).length} sent, {bulkJob.results.filter((r) => !r.success).length} failed)
                </p>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {bulkJob.results.map((r, i) => (
                    <p key={i} className={`text-[11px] ${r.success ? "text-emerald-600" : "text-red-500"}`}>{r.number} — {r.success ? "sent" : r.error}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TagsPage({ toast }) {
  const { API: api } = useAuth();
  const [subTab, setSubTab] = useState("all"); // all | create
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.get("/admin/tags").then((res) => setTags(res.data || [])).catch(() => toast("Failed to load tags", "error")).finally(() => setLoading(false));
  }, [api]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const createTag = async () => {
    if (!name.trim()) { toast("Name is required", "error"); return; }
    setSaving(true);
    try {
      const res = await api.post("/admin/tags", { name: name.trim(), type: type.trim() });
      setTags((prev) => [...prev, res.data].sort((a, b) => a.name.localeCompare(b.name)));
      setName(""); setType("");
      toast("Tag created", "success");
      setSubTab("all");
    } catch (err) {
      toast(err.response?.data?.message || "Failed to create tag", "error");
    } finally {
      setSaving(false);
    }
  };

  const deleteTag = async (tag) => {
    if (!window.confirm(`Delete tag "${tag.name}"?`)) return;
    try {
      await api.delete(`/admin/tags/${tag._id}`);
      setTags((prev) => prev.filter((t) => t._id !== tag._id));
      toast("Tag deleted", "success");
    } catch { toast("Failed to delete tag", "error"); }
  };

  return (
    <div>
      <SectionHeader title="Tags" />
      <div className="flex gap-2 mb-5">
        <Btn variant={subTab === "all" ? "primary" : "secondary"} size="sm" onClick={() => setSubTab("all")}>All Tags</Btn>
        <Btn variant={subTab === "create" ? "primary" : "secondary"} size="sm" onClick={() => setSubTab("create")}>Create Tag</Btn>
      </div>

      {subTab === "create" ? (
        <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 max-w-md">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Tag Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. New Contact, VIP, Interested — Gold Package"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Type (optional, for grouping)</label>
              <input value={type} onChange={(e) => setType(e.target.value)} placeholder="e.g. Contact, Form" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
            </div>
          </div>
          <Btn onClick={createTag} disabled={saving} className="mt-4">{saving ? "Creating…" : "Create Tag"}</Btn>
        </div>
      ) : loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : tags.length === 0 ? (
        <EmptyState icon="🏷️" title="No tags yet" body='Create your first tag — e.g. "New Contact" — to use consistently across Automation Workflow actions.' action={<Btn onClick={() => setSubTab("create")}>+ Create Tag</Btn>} />
      ) : (
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <div key={t._id} className="flex items-center gap-2 bg-white border border-gray-200 rounded-full pl-3 pr-2 py-1.5 text-sm">
              <span className="font-semibold text-gray-800">{t.name}</span>
              {t.type && <span className="text-[10px] text-gray-400">{t.type}</span>}
              <button onClick={() => deleteTag(t)} className="text-gray-300 hover:text-red-500 bg-transparent border-none cursor-pointer text-xs">✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


function FormsPage({ toast, courses }) {
  const [subTab, setSubTab] = useState("submitted"); // submitted | create

  return (
    <div>
      <SectionHeader title="Forms" />
      <div className="flex gap-2 mb-5">
        <Btn variant={subTab === "submitted" ? "primary" : "secondary"} size="sm" onClick={() => setSubTab("submitted")}>Submitted Forms</Btn>
        <Btn variant={subTab === "create" ? "primary" : "secondary"} size="sm" onClick={() => setSubTab("create")}>Create Form</Btn>
      </div>
      {subTab === "submitted" ? <SubmittedFormsTab toast={toast} courses={courses} /> : <CreateFormTab toast={toast} />}
    </div>
  );
}

// ── Submitted Forms — real Form 1 (enrollment, per course) and Form 2
// (package inquiry) submissions, with full detail, a payment-screenshot
// lightbox, multi-select delete, and CSV export.
function SubmittedFormsTab({ toast, courses }) {
  const { API: api } = useAuth();
  const [scope, setScope] = useState("services"); // "services" | a course _id
  const [enrollments, setEnrollments] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [lightboxUrl, setLightboxUrl] = useState("");

  useEffect(() => {
    setLoading(true);
    Promise.all([api.get("/admin/enrollments"), api.get("/admin/package-inquiries")])
      .then(([eRes, iRes]) => { setEnrollments(eRes.data || []); setInquiries(iRes.data || []); })
      .catch(() => toast("Failed to load submitted forms", "error"))
      .finally(() => setLoading(false));
  }, [api]); // eslint-disable-line react-hooks/exhaustive-deps

  const isServices = scope === "services";
  const list = isServices ? inquiries : enrollments.filter((e) => String(e.course?._id) === String(scope));

  useEffect(() => { setSelected([]); }, [scope]);

  const toggleOne = (id) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const toggleAll = () => setSelected((prev) => (prev.length === list.length ? [] : list.map((x) => x._id)));

  const deleteSelected = async () => {
    if (selected.length === 0) return;
    if (!window.confirm(`Delete ${selected.length} submission${selected.length === 1 ? "" : "s"}? This can't be undone.`)) return;
    try {
      const endpoint = isServices ? "package-inquiries" : "enrollments";
      await Promise.all(selected.map((id) => api.delete(`/admin/${endpoint}/${id}`)));
      if (isServices) setInquiries((prev) => prev.filter((x) => !selected.includes(x._id)));
      else setEnrollments((prev) => prev.filter((x) => !selected.includes(x._id)));
      setSelected([]);
      toast("Deleted", "success");
    } catch { toast("Failed to delete some submissions", "error"); }
  };

  const downloadSelected = () => {
    const endpoint = isServices ? "package-inquiries" : "enrollments";
    const ids = selected.length > 0 ? selected : list.map((x) => x._id);
    if (ids.length === 0) { toast("Nothing to download", "error"); return; }
    const url = `${api.defaults.baseURL}/admin/${endpoint}/export.csv?ids=${ids.join(",")}`;
    const token = localStorage.getItem("token");
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((blob) => {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `${endpoint}.csv`;
        link.click();
      })
      .catch(() => toast("Download failed", "error"));
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-5">
        <button onClick={() => setScope("services")} className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer transition ${isServices ? "bg-[#e8540a] text-white border-[#e8540a]" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}>
          Services ({inquiries.length})
        </button>
        {courses?.map((c) => {
          const count = enrollments.filter((e) => String(e.course?._id) === String(c._id)).length;
          return (
            <button key={c._id} onClick={() => setScope(c._id)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer transition ${scope === c._id ? "bg-[#e8540a] text-white border-[#e8540a]" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}>
              {c.title} ({count})
            </button>
          );
        })}
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : list.length === 0 ? (
        <EmptyState icon="📄" title="No submissions yet" body={isServices ? "Package inquiry submissions from the Services page will show up here." : "Enrollment submissions for this course will show up here."} />
      ) : (
        <>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-600 cursor-pointer">
              <input type="checkbox" checked={selected.length === list.length && list.length > 0} onChange={toggleAll} className="w-4 h-4 accent-rose-600" />
              Select all ({list.length})
            </label>
            <div className="flex gap-2">
              <Btn variant="secondary" size="sm" onClick={downloadSelected}>Download {selected.length > 0 ? `Selected (${selected.length})` : "All"}</Btn>
              <Btn variant="danger" size="sm" onClick={deleteSelected} disabled={selected.length === 0}>Delete Selected</Btn>
            </div>
          </div>

          <div className="space-y-3">
            {list.map((item) => (
              <div key={item._id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex flex-col sm:flex-row gap-4">
                <input type="checkbox" checked={selected.includes(item._id)} onChange={() => toggleOne(item._id)} className="w-4 h-4 accent-rose-600 mt-1 flex-shrink-0" />

                {!isServices && (
                  <div className="w-full sm:w-32 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 cursor-pointer" onClick={() => item.paymentScreenshotUrl && setLightboxUrl(item.paymentScreenshotUrl)}>
                    {item.paymentScreenshotUrl ? (
                      <img src={item.paymentScreenshotUrl} alt="Payment screenshot" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl">🧾</div>
                    )}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    {isServices ? (
                      <div>
                        <p className="font-bold text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.email} • {item.whatsapp}</p>
                      </div>
                    ) : (
                      <div>
                        <p className="font-bold text-gray-900">{item.student?.name || "Student"}</p>
                        <p className="text-xs text-gray-500">{item.student?.email} • {item.whatsapp}</p>
                      </div>
                    )}
                    <StatusBadge status={isServices ? (item.status === "contacted" ? "verified" : "pending") : item.status} />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 mt-2 text-xs">
                    {isServices ? (
                      <div><span className="text-gray-400">Package: </span><span className="text-gray-700 font-semibold">{item.package === "gold" ? "Gold" : "Premium"}</span></div>
                    ) : (
                      <>
                        <div><span className="text-gray-400">Method: </span><span className="text-gray-700 font-semibold">{item.paymentMethod || "—"}</span></div>
                        <div><span className="text-gray-400">Amount: </span><span className="text-gray-700 font-semibold">PKR {item.amount || 0}</span></div>
                      </>
                    )}
                    <div><span className="text-gray-400">Submitted: </span><span className="text-gray-700">{new Date(item.createdAt).toLocaleDateString()}</span></div>
                  </div>
                  {!isServices && item.rejectionReason && <p className="text-xs text-red-500 italic mt-1">Reason: {item.rejectionReason}</p>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {lightboxUrl && (
        <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-4" onClick={() => setLightboxUrl("")}>
          <button onClick={() => setLightboxUrl("")} className="absolute top-4 right-4 sm:top-6 sm:right-6 text-white/80 hover:text-white bg-transparent border-none cursor-pointer text-3xl leading-none z-10">✕</button>
          <img src={lightboxUrl} alt="Payment screenshot full size" className="max-w-full sm:max-w-3xl max-h-[90vh] rounded-lg mx-auto block object-contain" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}

// ── Create Form — the form catalog itself: "Form 1"/"Form 2" (seeded,
// wired into live pages, can't be deleted) plus any new ones you add.
function CreateFormTab({ toast }) {
  const { API: api } = useAuth();
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | "new" | form object
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [fieldsText, setFieldsText] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.get("/admin/forms").then((res) => setForms(res.data || [])).catch(() => toast("Failed to load forms", "error")).finally(() => setLoading(false));
  }, [api]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const openEditor = (form) => {
    setEditing(form || "new");
    setName(form?.name || "");
    setSlug(form?.slug || "");
    setDescription(form?.description || "");
    setFieldsText((form?.fields || []).join(", "));
  };

  const save = async () => {
    if (!name.trim()) { toast("Name is required", "error"); return; }
    if (editing === "new" && !slug.trim()) { toast("Slug is required", "error"); return; }
    setSaving(true);
    try {
      const fields = fieldsText.split(",").map((f) => f.trim()).filter(Boolean);
      if (editing === "new") {
        const res = await api.post("/admin/forms", { name, slug, description, fields });
        setForms((prev) => [...prev, res.data].sort((a, b) => a.slug.localeCompare(b.slug)));
      } else {
        const res = await api.put(`/admin/forms/${editing._id}`, { name, description, fields });
        setForms((prev) => prev.map((f) => (f._id === editing._id ? res.data : f)));
      }
      toast("Form saved", "success");
      setEditing(null);
    } catch (err) {
      toast(err.response?.data?.message || "Failed to save form", "error");
    } finally {
      setSaving(false);
    }
  };

  const deleteForm = async (form) => {
    if (!window.confirm(`Delete "${form.name}"? This can't be undone.`)) return;
    try {
      await api.delete(`/admin/forms/${form._id}`);
      setForms((prev) => prev.filter((f) => f._id !== form._id));
      toast("Form deleted", "success");
    } catch (err) { toast(err.response?.data?.message || "Failed to delete form", "error"); }
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Btn onClick={() => openEditor(null)}>+ New Form</Btn>
      </div>
      <p className="text-sm text-gray-500 mb-5 -mt-2">"Form 1" and "Form 2" are already live on your site and can be selected when scoping an Automation Workflow's "Form Submitted" trigger.</p>

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : (
        <div className="space-y-3">
          {forms.map((f) => (
            <div key={f._id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-gray-900">{f.name}</p>
                    <span className="text-[10px] font-mono bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{f.slug}</span>
                  </div>
                  {f.description && <p className="text-sm text-gray-500 mt-1">{f.description}</p>}
                  {f.fields?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {f.fields.map((field) => <span key={field} className="text-[11px] bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full">{field}</span>)}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Btn variant="secondary" size="sm" onClick={() => openEditor(f)}>Edit</Btn>
                  {f.slug !== "form-1" && f.slug !== "form-2" && (
                    <Btn variant="danger" size="sm" onClick={() => deleteForm(f)}>Delete</Btn>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="bg-white rounded-2xl p-5 sm:p-6 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 mb-4">{editing === "new" ? "New Form" : "Edit Form"}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
              </div>
              {editing === "new" && (
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Slug (used to reference this form — can't be changed later)</label>
                  <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="e.g. newsletter-signup" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-rose-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Fields (comma-separated, for reference)</label>
                <input value={fieldsText} onChange={(e) => setFieldsText(e.target.value)} placeholder="Name, Email, Message" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <Btn variant="secondary" onClick={() => setEditing(null)}>Cancel</Btn>
              <Btn onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SettingsPage({ toast }) {
  const { API: api } = useAuth();
  const [logoUrl, setLogoUrl] = useState("");
  const [footerLogoUrl, setFooterLogoUrl] = useState("");
  const [paymentLogoUbl, setPaymentLogoUbl] = useState("");
  const [paymentLogoAllied, setPaymentLogoAllied] = useState("");
  const [paymentLogoJazzcash, setPaymentLogoJazzcash] = useState("");
  const [paymentLogoEasypaisa, setPaymentLogoEasypaisa] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/settings")
      .then((res) => {
        setLogoUrl(res.data?.logoUrl || "");
        setFooterLogoUrl(res.data?.footerLogoUrl || "");
        setPaymentLogoUbl(res.data?.paymentLogoUbl || "");
        setPaymentLogoAllied(res.data?.paymentLogoAllied || "");
        setPaymentLogoJazzcash(res.data?.paymentLogoJazzcash || "");
        setPaymentLogoEasypaisa(res.data?.paymentLogoEasypaisa || "");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [api]);

  return (
    <div className="space-y-4 sm:space-y-6 max-w-xl">
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">Settings</h2>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Site-wide branding, stored in the same Cloudinary account as every other image.</p>
      </div>
      {loading ? (
        <div className="text-sm text-gray-400">Loading…</div>
      ) : (
        <>
          <LogoUploadBox
            toast={toast}
            target="header"
            label="Header Logo"
            description="Shown in the header (top nav) of every page — course pages, About, Privacy Policy, Return Policy, Contact Us."
            initialUrl={logoUrl}
            onUploaded={setLogoUrl}
          />
          <LogoUploadBox
            toast={toast}
            target="footer"
            label="Footer Logo"
            description="Shown in the footer only. Use a transparent-background version here if the header logo has a white background — it'll blend into the dark footer instead of showing as a white box."
            initialUrl={footerLogoUrl}
            onUploaded={setFooterLogoUrl}
          />

          <div className="pt-2">
            <h3 className="font-bold text-gray-800 text-sm sm:text-base">Payment Method Logos</h3>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5 mb-3">Shown on the Enrollment page next to each payment option.</p>
          </div>
          <LogoUploadBox
            toast={toast}
            target="payment_ubl"
            label="United Bank Limited Logo"
            description="Shown next to the United Bank Limited account under Bank Transfer on the Enrollment page."
            initialUrl={paymentLogoUbl}
            onUploaded={setPaymentLogoUbl}
          />
          <LogoUploadBox
            toast={toast}
            target="payment_allied"
            label="Allied Bank Logo"
            description="Shown next to the Allied Bank account under Bank Transfer on the Enrollment page."
            initialUrl={paymentLogoAllied}
            onUploaded={setPaymentLogoAllied}
          />
          <LogoUploadBox
            toast={toast}
            target="payment_jazzcash"
            label="JazzCash Logo"
            description="Shown next to the JazzCash payment option on the Enrollment page."
            initialUrl={paymentLogoJazzcash}
            onUploaded={setPaymentLogoJazzcash}
          />
          <LogoUploadBox
            toast={toast}
            target="payment_easypaisa"
            label="Easypaisa Logo"
            description="Shown next to the Easypaisa payment option on the Enrollment page."
            initialUrl={paymentLogoEasypaisa}
            onUploaded={setPaymentLogoEasypaisa}
          />

          <WhatsAppIntegrationBox toast={toast} />
        </>
      )}
    </div>
  );
}

// Super Admin → Settings → WhatsApp — connects the account the "Send
// WhatsApp Message" workflow action actually sends from. Needs a Phone
// Number ID and an Access Token from Meta's WhatsApp Cloud API; the access
// token is never sent back down once saved, matching how a password field
// works everywhere else.
function WhatsAppIntegrationBox({ toast }) {
  const { API: api } = useAuth();
  const [connected, setConnected] = useState(false);
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.get("/admin/settings/whatsapp")
      .then((res) => { setPhoneNumberId(res.data?.whatsappPhoneNumberId || ""); setConnected(!!res.data?.whatsappConnected); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [api]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!phoneNumberId.trim() || !accessToken.trim()) { toast("Both fields are required", "error"); return; }
    setSaving(true);
    try {
      await api.post("/admin/settings/whatsapp", { whatsappPhoneNumberId: phoneNumberId.trim(), whatsappAccessToken: accessToken.trim() });
      setAccessToken("");
      setConnected(true);
      toast("WhatsApp connected", "success");
    } catch (err) {
      toast(err.response?.data?.message || "Failed to connect WhatsApp", "error");
    } finally {
      setSaving(false);
    }
  };

  const disconnect = async () => {
    if (!window.confirm("Disconnect WhatsApp? The \"Send WhatsApp Message\" workflow action will stop working until you reconnect.")) return;
    try {
      await api.delete("/admin/settings/whatsapp");
      setConnected(false);
      setPhoneNumberId("");
      toast("WhatsApp disconnected", "success");
    } catch { toast("Failed to disconnect", "error"); }
  };

  return (
    <div className="pt-4 border-t border-gray-100">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-bold text-gray-800 text-sm sm:text-base">WhatsApp Integration</h3>
        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${connected ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"}`}>
          {connected ? "Connected" : "Not connected"}
        </span>
      </div>
      <p className="text-xs sm:text-sm text-gray-500 mt-0.5 mb-3">Powers the "Send WhatsApp Message" action in Automation Workflow.</p>

      {loading ? (
        <p className="text-xs text-gray-400">Loading…</p>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Phone Number ID</label>
            <input value={phoneNumberId} onChange={(e) => setPhoneNumberId(e.target.value)} placeholder="e.g. 109876543210987"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Access Token {connected && <span className="font-normal text-gray-400">(already saved — enter a new one only to change it)</span>}</label>
            <input type="password" value={accessToken} onChange={(e) => setAccessToken(e.target.value)} placeholder={connected ? "••••••••••••••••" : "Paste your permanent access token"}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Btn onClick={save} disabled={saving}>{saving ? "Saving…" : connected ? "Update" : "Connect"}</Btn>
            {connected && <Btn variant="danger" onClick={disconnect}>Disconnect</Btn>}
            <Btn variant="secondary" onClick={() => setShowGuide((v) => !v)}>{showGuide ? "Hide" : "How do I get these?"}</Btn>
          </div>
          {showGuide && (
            <div className="text-xs text-gray-600 leading-relaxed bg-white border border-gray-200 rounded-lg p-3 space-y-1.5">
              <p><strong>1.</strong> Go to developers.facebook.com and create a Meta Developer account and a Business-type App.</p>
              <p><strong>2.</strong> Add the WhatsApp product to that app.</p>
              <p><strong>3.</strong> Under WhatsApp → API Setup, copy the Phone Number ID shown there.</p>
              <p><strong>4.</strong> For a permanent token (the temporary one on that page expires in 24 hours): go to Business Settings → System Users, create a system user, and generate a token with the whatsapp_business_messaging permission.</p>
              <p><strong>5.</strong> Paste both values above and click Connect.</p>
              <p className="text-gray-400 italic">Note: WhatsApp only allows free-form messages within 24 hours of the customer's last message — outside that window, only Meta-pre-approved message templates work.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE: MESSAGES — Contact Us submissions + Newsletter subscribers
// ─────────────────────────────────────────────────────────────────────────────

function MessagesPage() {
  const { API: api } = useAuth();
  const [tab, setTab] = useState("contact");
  const [contacts, setContacts] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get("/admin/contact-submissions").catch(() => ({ data: [] })),
      api.get("/admin/newsletter-subscribers").catch(() => ({ data: [] })),
    ]).then(([c, s]) => {
      setContacts(Array.isArray(c.data) ? c.data : []);
      setSubscribers(Array.isArray(s.data) ? s.data : []);
      setLoading(false);
    });
  }, [api]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">Messages</h2>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Contact Us submissions and newsletter signups from the public site.</p>
      </div>
      <div className="flex gap-2">
        {[["contact", `Contact Submissions (${contacts.length})`], ["newsletter", `Newsletter (${subscribers.length})`]].map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold transition ${tab === t ? "bg-rose-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading…</div>
      ) : tab === "contact" ? (
        contacts.length === 0 ? (
          <EmptyState icon="✉️" title="No messages yet" body="Submissions from the Contact Us page will show up here." />
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {["Name", "Email", "Message", "Received"].map((h) => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 sm:px-4 py-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {contacts.map((c) => (
                    <tr key={c._id} className="hover:bg-gray-50 transition align-top">
                      <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm font-semibold text-gray-800 whitespace-nowrap">{c.name}</td>
                      <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-600 whitespace-nowrap">{c.email}</td>
                      <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-700 max-w-sm">{c.message}</td>
                      <td className="px-3 sm:px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{c.createdAt ? new Date(c.createdAt).toLocaleString() : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        subscribers.length === 0 ? (
          <EmptyState icon="📰" title="No subscribers yet" body="Emails submitted through the footer newsletter box will show up here." />
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {["Email", "Subscribed"].map((h) => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 sm:px-4 py-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {subscribers.map((s) => (
                    <tr key={s._id} className="hover:bg-gray-50 transition">
                      <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm font-semibold text-gray-800">{s.email}</td>
                      <td className="px-3 sm:px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{s.createdAt ? new Date(s.createdAt).toLocaleString() : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE: PAYMENT VERIFICATIONS — the queue fed by EnrolledPage.jsx submissions
// ─────────────────────────────────────────────────────────────────────────────

function RejectReasonForm({ studentName, onCancel, onConfirm, busy }) {
  const [reason, setReason] = useState("");
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Let {studentName || "the student"} know why this payment couldn't be verified — this shows up on their
        Student Portal, so be specific. A reason is required.
      </p>
      <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3}
        placeholder="e.g. Fake screenshot of payment, or screenshot doesn't match the amount due"
        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none" />
      <div className="flex gap-2 justify-end">
        <Btn variant="secondary" onClick={onCancel}>Cancel</Btn>
        <Btn variant="danger" onClick={() => onConfirm(reason)} disabled={busy || !reason.trim()}>{busy ? "Rejecting…" : "Reject enrollment"}</Btn>
      </div>
    </div>
  );
}

function VerificationsPage({ enrollments, verifyEnrollment, rejectEnrollment, toast }) {
  const [tab, setTab] = useState("pending");
  const [lightboxUrl, setLightboxUrl] = useState("");
  const [rejectTarget, setRejectTarget] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const list = enrollments[tab] || [];

  async function handleVerify(id) {
    setBusyId(id);
    try { await verifyEnrollment(id); toast("Enrollment verified — student now has access.", "success"); }
    catch { toast("Could not verify enrollment.", "error"); }
    finally { setBusyId(null); }
  }

  async function handleReject(id, reason) {
    setBusyId(id);
    try { await rejectEnrollment(id, reason); toast("Enrollment rejected.", "success"); setRejectTarget(null); }
    catch { toast("Could not reject enrollment.", "error"); }
    finally { setBusyId(null); }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">Payment Verifications</h2>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Screenshots submitted at checkout, awaiting review</p>
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {["pending", "verified", "rejected"].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold transition ${tab === t ? "bg-rose-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {t.charAt(0).toUpperCase() + t.slice(1)} ({enrollments[t]?.length || 0})
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={tab === "pending" ? "✅" : "🧾"}
          title={tab === "pending" ? "Nothing waiting" : `No ${tab} enrollments`}
          body={tab === "pending" ? "New submissions from the enrollment page will show up here." : "Nothing here yet."}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((e) => {
            const eid = e._id || e.id;
            return (
              <div key={eid} className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                <div
                  className="aspect-video bg-gray-100 cursor-pointer flex items-center justify-center"
                  onClick={() => e.paymentScreenshotUrl && setLightboxUrl(e.paymentScreenshotUrl)}
                >
                  {e.paymentScreenshotUrl ? (
                    <img src={e.paymentScreenshotUrl} alt="Payment screenshot" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-300 text-3xl">🧾</span>
                  )}
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{e.student?.name || e.name || "Student"}</p>
                      <p className="text-xs text-gray-500 truncate">{e.student?.email || e.email}</p>
                    </div>
                    <StatusBadge status={e.status || tab} />
                  </div>
                  <p className="text-xs text-gray-600 truncate">{e.course?.title || "Course"}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{e.paymentMethod || "—"}</span>
                    <span>{e.whatsapp || ""}</span>
                  </div>
                  {e.createdAt && <p className="text-[11px] text-gray-400">{new Date(e.createdAt).toLocaleString()}</p>}
                  {tab === "pending" && (
                    <div className="flex gap-2 pt-2">
                      <Btn size="sm" variant="success" className="flex-1" disabled={busyId === eid} onClick={() => handleVerify(eid)}>
                        {busyId === eid ? "…" : "Verify"}
                      </Btn>
                      <Btn size="sm" variant="danger" className="flex-1" disabled={busyId === eid} onClick={() => setRejectTarget(e)}>
                        Reject
                      </Btn>
                    </div>
                  )}
                  {tab === "rejected" && e.rejectionReason && (
                    <p className="text-xs text-red-500 italic">Reason: {e.rejectionReason}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* NEW: was using the shared Modal component, capped at max-w-lg
          (512px) — too small to actually read transaction details on a
          payment screenshot clearly. This is now its own larger, dedicated
          lightbox sized for actually inspecting the picture before
          deciding Verify or Reject. */}
      {lightboxUrl && (
        <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-4" onClick={() => setLightboxUrl("")}>
          <button onClick={() => setLightboxUrl("")} className="absolute top-4 right-4 sm:top-6 sm:right-6 text-white/80 hover:text-white bg-transparent border-none cursor-pointer text-3xl leading-none z-10">✕</button>
          <img src={lightboxUrl} alt="Payment screenshot full size" className="max-w-full sm:max-w-3xl max-h-[90vh] rounded-lg mx-auto block object-contain" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {rejectTarget && (
        <Modal onClose={() => setRejectTarget(null)} title="Reject enrollment">
          <RejectReasonForm
            studentName={rejectTarget.student?.name || rejectTarget.name}
            busy={busyId === (rejectTarget._id || rejectTarget.id)}
            onCancel={() => setRejectTarget(null)}
            onConfirm={(reason) => handleReject(rejectTarget._id || rejectTarget.id, reason)}
          />
        </Modal>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export default function SuperAdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const { toasts, add: toast } = useToast();

  const {
    overview, students, instructors, courses, enrollments, loading,
    verifyEnrollment, rejectEnrollment, toggleStudentStatus, toggleInstructorStatus,
  } = useSuperAdminData();

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) setCollapsed(false);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const sidebarWidth = isMobile ? 0 : collapsed ? 64 : 230;
  const pendingCount = overview?.pendingVerifications ?? enrollments?.pending?.length ?? 0;

  function handleLogout() {
    logout();
    navigate("/auth/login");
  }

  // NEW: creating or editing a workflow (not the plain list page) now takes
  // over the full screen — no sidebar, no top bar — matching the reference
  // screenshots, where GHL's own workflow builder has no left nav either
  // once you're inside a workflow. Pulled straight from the URL rather than
  // through a <Route> match, since this needs to short-circuit before the
  // normal <Sidebar>/<TopBar>/<Layout> chrome ever renders.
  const workflowEditMatch = location.pathname.match(/^\/superadmin\/automation\/(.+)$/);
  const workflowEditId = workflowEditMatch ? workflowEditMatch[1] : null;

  if (workflowEditId) {
    return (
      <>
        <style>{`* { box-sizing: border-box; } html, body { overflow-x: hidden; }`}</style>
        <AutomationWorkflowEditorPage toast={toast} navigate={navigate} workflowId={workflowEditId} />
        <ToastContainer toasts={toasts} />
      </>
    );
  }

  return (
    <>
      <style>{`
        @keyframes slideUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:none; } }
        * { box-sizing: border-box; }
        html, body { overflow-x: hidden; }
      `}</style>

      <Sidebar admin={user} collapsed={collapsed} setCollapsed={setCollapsed} isMobile={isMobile} pendingCount={pendingCount} onLogout={handleLogout} />
      <TopBar admin={user} sidebarWidth={sidebarWidth} isMobile={isMobile} onMenuClick={() => setCollapsed(false)} />

      <Layout sidebarWidth={sidebarWidth} isMobile={isMobile}>
        <Routes>
          <Route index element={<OverviewPage overview={overview} enrollments={enrollments} loading={loading} goTo={navigate} />} />
          <Route path="students" element={<StudentsPage students={students} loading={loading} toggleStudentStatus={toggleStudentStatus} toast={toast} />} />
          <Route path="instructors" element={<InstructorsPage instructors={instructors} loading={loading} toggleInstructorStatus={toggleInstructorStatus} toast={toast} />} />
          <Route path="courses" element={<CoursesPage courses={courses} loading={loading} />} />
          <Route path="verifications" element={<VerificationsPage enrollments={enrollments} verifyEnrollment={verifyEnrollment} rejectEnrollment={rejectEnrollment} toast={toast} />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="automation" element={<AutomationWorkflowPage toast={toast} />} />
          <Route path="whatsapp" element={<WhatsAppPage toast={toast} />} />
          <Route path="pipeline" element={<PipelinePage toast={toast} />} />
          <Route path="review-importer" element={<ReviewImporterPage toast={toast} courses={courses} />} />
          <Route path="forms" element={<FormsPage toast={toast} courses={courses} />} />
          <Route path="tags" element={<TagsPage toast={toast} />} />
          <Route path="settings" element={<SettingsPage toast={toast} />} />
          <Route path="*" element={<Navigate to="" replace />} />
        </Routes>
      </Layout>

      <ToastContainer toasts={toasts} />
    </>
  );
}
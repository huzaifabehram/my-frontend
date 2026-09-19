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

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Routes, Route, NavLink, useNavigate, Navigate } from "react-router-dom";
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
                    <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-600">{c.instructorId?.name || c.instructor || "—"}</td>
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
// A real, working GoHighLevel-style automation builder scoped to the events
// that actually happen on this platform. Triggers fire from real backend
// events (see server.js: runWorkflows() calls in registration, enrollment,
// verify/reject, progress/mark, contact, newsletter). Actions: send an
// email (real SMTP send if the server has SMTP_* env vars configured —
// otherwise skipped and logged, never faked), call a webhook (POSTs the
// trigger's data to any URL — this is the bridge to WhatsApp/SMS/Zapier/
// Make/n8n providers without needing their credentials here), add/remove a
// tag on the student, create a real in-app notification, or wait/delay
// (genuinely pauses and resumes later, not an instant no-op).

const TRIGGER_LABELS = {
  student_registered:     "Student Registered",
  enrollment_created:     "Enrollment Created (Payment Pending)",
  payment_verified:       "Payment Verified",
  payment_rejected:       "Payment Rejected",
  lecture_completed:      "Lecture Completed",
  course_completed:       "Course Completed",
  contact_form_submitted: "Contact Form Submitted",
  newsletter_subscribed:  "Newsletter Subscribed",
};

const ACTION_LABELS = {
  send_email:  "Send Email",
  webhook:     "Call Webhook",
  add_tag:     "Add Tag",
  remove_tag:  "Remove Tag",
  notify:      "Send In-App Notification",
  delay:       "Wait / Delay",
};

// Fields available on the trigger's context object — used for condition
// pickers and shown as a hint for the {{field}} syntax in email/notify text.
const CONTEXT_FIELDS = ["studentName", "studentEmail", "courseTitle", "amount", "reason", "lectureId", "name", "email", "message"];

function emptyStep(type) {
  if (type === "condition") return { type: "condition", conditionField: "courseTitle", conditionOperator: "equals", conditionValue: "" };
  return { type: "action", actionType: "notify", params: {} };
}

function WorkflowStepEditor({ step, index, total, meta, onChange, onChangeParam, onRemove, onMove }) {
  return (
    <div className="border border-gray-200 rounded-xl p-3 bg-gray-50">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-gray-500">Step {index + 1} — {step.type === "condition" ? "Condition" : "Action"}</span>
        <div className="flex items-center gap-2">
          <button onClick={() => onMove(-1)} disabled={index === 0} className="text-gray-400 hover:text-gray-700 disabled:opacity-30 text-xs px-1 bg-transparent border-none cursor-pointer">↑</button>
          <button onClick={() => onMove(1)} disabled={index === total - 1} className="text-gray-400 hover:text-gray-700 disabled:opacity-30 text-xs px-1 bg-transparent border-none cursor-pointer">↓</button>
          <button onClick={onRemove} className="text-red-400 hover:text-red-600 text-xs px-1 bg-transparent border-none cursor-pointer">✕ Remove</button>
        </div>
      </div>

      {step.type === "condition" ? (
        <div className="grid grid-cols-3 gap-2">
          <select value={step.conditionField} onChange={(e) => onChange({ conditionField: e.target.value })} className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white">
            {CONTEXT_FIELDS.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
          <select value={step.conditionOperator} onChange={(e) => onChange({ conditionOperator: e.target.value })} className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white">
            <option value="equals">equals</option>
            <option value="not_equals">not equals</option>
            <option value="contains">contains</option>
          </select>
          <input value={step.conditionValue} onChange={(e) => onChange({ conditionValue: e.target.value })} placeholder="value" className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs" />
        </div>
      ) : (
        <div className="space-y-2">
          <select value={step.actionType} onChange={(e) => onChange({ actionType: e.target.value, params: {} })} className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white">
            {(meta.actionTypes || []).map((t) => <option key={t} value={t}>{ACTION_LABELS[t] || t}</option>)}
          </select>

          {step.actionType === "send_email" && (
            <>
              {!meta.emailConfigured && <p className="text-[11px] text-amber-600">SMTP isn't configured on the server yet — this step will be skipped (and logged) until it is.</p>}
              <input value={step.params.to || ""} onChange={(e) => onChangeParam("to", e.target.value)} placeholder="To (default: {{studentEmail}})" className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs" />
              <input value={step.params.subject || ""} onChange={(e) => onChangeParam("subject", e.target.value)} placeholder="Subject" className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs" />
              <textarea value={step.params.body || ""} onChange={(e) => onChangeParam("body", e.target.value)} placeholder="Body — use {{studentName}}, {{courseTitle}}, etc." rows={3} className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs resize-none" />
            </>
          )}
          {step.actionType === "webhook" && (
            <input value={step.params.url || ""} onChange={(e) => onChangeParam("url", e.target.value)} placeholder="https://…  (Zapier / Make / n8n / your WhatsApp or SMS provider)" className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs" />
          )}
          {(step.actionType === "add_tag" || step.actionType === "remove_tag") && (
            <input value={step.params.tag || ""} onChange={(e) => onChangeParam("tag", e.target.value)} placeholder="Tag name" className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs" />
          )}
          {step.actionType === "notify" && (
            <>
              <input value={step.params.title || ""} onChange={(e) => onChangeParam("title", e.target.value)} placeholder="Notification title" className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs" />
              <textarea value={step.params.message || ""} onChange={(e) => onChangeParam("message", e.target.value)} placeholder="Message — use {{studentName}}, {{courseTitle}}, etc." rows={2} className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs resize-none" />
            </>
          )}
          {step.actionType === "delay" && (
            <input type="number" min="1" value={step.params.minutes || ""} onChange={(e) => onChangeParam("minutes", e.target.value)} placeholder="Minutes to wait" className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs" />
          )}
        </div>
      )}
    </div>
  );
}

function WorkflowEditorModal({ workflow, meta, onClose, onSaved, toast }) {
  const { API: api } = useAuth();
  const [name, setName] = useState(workflow?.name || "");
  const [trigger, setTrigger] = useState(workflow?.trigger || meta.triggers?.[0] || "");
  const [active, setActive] = useState(workflow?.active !== false);
  const [steps, setSteps] = useState(workflow?.steps?.map((s) => ({ ...s, params: { ...(s.params || {}) } })) || []);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => { document.body.style.overflow = "unset"; window.removeEventListener("keydown", handleKey); };
  }, [onClose]);

  const addStep = (type) => setSteps((prev) => [...prev, emptyStep(type)]);
  const updateStep = (i, patch) => setSteps((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  const updateStepParam = (i, key, value) => setSteps((prev) => prev.map((s, idx) => (idx === i ? { ...s, params: { ...s.params, [key]: value } } : s)));
  const removeStep = (i) => setSteps((prev) => prev.filter((_, idx) => idx !== i));
  const moveStep = (i, dir) => setSteps((prev) => {
    const next = [...prev];
    const j = i + dir;
    if (j < 0 || j >= next.length) return prev;
    [next[i], next[j]] = [next[j], next[i]];
    return next;
  });

  const save = async () => {
    if (!name.trim()) { toast("Name is required", "error"); return; }
    setSaving(true);
    try {
      const payload = { name: name.trim(), trigger, active, steps };
      const res = workflow
        ? await api.put(`/admin/workflows/${workflow._id}`, payload)
        : await api.post("/admin/workflows", payload);
      onSaved(res.data);
    } catch (err) {
      toast(err.response?.data?.message || "Failed to save workflow", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-5 sm:p-6 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-bold text-gray-900 mb-4">{workflow ? "Edit Workflow" : "New Workflow"}</h3>

        <div className="space-y-4 mb-5">
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Welcome new students"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Trigger — when this workflow runs</label>
            <select value={trigger} onChange={(e) => setTrigger(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-rose-500">
              {(meta.triggers || []).map((t) => <option key={t} value={t}>{TRIGGER_LABELS[t] || t}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="w-4 h-4 accent-rose-600" />
            <span className="text-sm text-gray-700">Active</span>
          </label>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs font-bold text-gray-600 mb-3">Steps — run in order, top to bottom. A Condition stops the workflow here if it doesn't match.</p>
          <div className="space-y-3">
            {steps.map((step, i) => (
              <WorkflowStepEditor key={i} step={step} index={i} total={steps.length} meta={meta}
                onChange={(patch) => updateStep(i, patch)}
                onChangeParam={(key, value) => updateStepParam(i, key, value)}
                onRemove={() => removeStep(i)}
                onMove={(dir) => moveStep(i, dir)} />
            ))}
            {steps.length === 0 && <p className="text-xs text-gray-400 italic">No steps yet — add one below.</p>}
          </div>
          <div className="flex gap-2 mt-3">
            <Btn variant="secondary" size="sm" onClick={() => addStep("condition")}>+ Condition</Btn>
            <Btn variant="secondary" size="sm" onClick={() => addStep("action")}>+ Action</Btn>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-100">
          <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
          <Btn onClick={save} disabled={saving}>{saving ? "Saving…" : "Save Workflow"}</Btn>
        </div>
      </div>
    </div>
  );
}

function AutomationWorkflowPage({ toast }) {
  const { API: api } = useAuth();
  const [workflows, setWorkflows] = useState([]);
  const [meta, setMeta] = useState({ triggers: [], actionTypes: [], emailConfigured: false });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | "new" | workflow object
  const [historyFor, setHistoryFor] = useState(null);
  const [runs, setRuns] = useState([]);
  const [runsLoading, setRunsLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([api.get("/admin/workflows"), api.get("/admin/workflows/meta")])
      .then(([wRes, mRes]) => { setWorkflows(wRes.data || []); setMeta(mRes.data || {}); })
      .catch(() => toast("Failed to load workflows", "error"))
      .finally(() => setLoading(false));
  }, [api]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const toggleActive = async (wf) => {
    try {
      const res = await api.put(`/admin/workflows/${wf._id}`, { active: !wf.active });
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

  const testRun = async (wf) => {
    try {
      await api.post(`/admin/workflows/${wf._id}/test`);
      toast(`Test run completed for "${wf.name}" — check History for the log`, "success");
      load();
    } catch (err) { toast(err.response?.data?.message || "Test run failed", "error"); }
  };

  const openHistory = async (wf) => {
    setHistoryFor(wf);
    setRunsLoading(true);
    try {
      const res = await api.get(`/admin/workflows/${wf._id}/runs`);
      setRuns(res.data || []);
    } catch { toast("Failed to load run history", "error"); }
    finally { setRunsLoading(false); }
  };

  return (
    <div>
      <SectionHeader title="Automation Workflow" action={<Btn onClick={() => setEditing("new")}>+ New Workflow</Btn>} />

      {!meta.emailConfigured && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
          Email sending isn't configured on the server yet — add <code className="bg-amber-100 px-1 rounded">SMTP_HOST</code>, <code className="bg-amber-100 px-1 rounded">SMTP_PORT</code>, <code className="bg-amber-100 px-1 rounded">SMTP_USER</code>, <code className="bg-amber-100 px-1 rounded">SMTP_PASS</code> (and optionally <code className="bg-amber-100 px-1 rounded">SMTP_FROM</code>) to your server's .env to enable the "Send Email" action. Every other action — webhook, tags, in-app notifications, delay — already works without it.
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : workflows.length === 0 ? (
        <EmptyState icon="⚡" title="No workflows yet"
          body="Create your first automation — e.g. notify a student when their payment is rejected, or tag someone once they complete a course."
          action={<Btn onClick={() => setEditing("new")}>+ New Workflow</Btn>} />
      ) : (
        <div className="space-y-3">
          {workflows.map((wf) => (
            <div key={wf._id} className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col sm:flex-row sm:items-center gap-3 shadow-sm">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-gray-900">{wf.name}</p>
                  <StatusBadge status={wf.active ? "active" : "suspended"} />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Trigger: {TRIGGER_LABELS[wf.trigger] || wf.trigger} • {wf.steps?.length || 0} step{(wf.steps?.length || 0) === 1 ? "" : "s"} • Ran {wf.runCount || 0} time{(wf.runCount || 0) === 1 ? "" : "s"}
                  {wf.lastRunAt ? ` • last ${new Date(wf.lastRunAt).toLocaleString()}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Btn variant="secondary" size="sm" onClick={() => toggleActive(wf)}>{wf.active ? "Pause" : "Activate"}</Btn>
                <Btn variant="secondary" size="sm" onClick={() => testRun(wf)}>Test Run</Btn>
                <Btn variant="secondary" size="sm" onClick={() => openHistory(wf)}>History</Btn>
                <Btn variant="secondary" size="sm" onClick={() => setEditing(wf)}>Edit</Btn>
                <Btn variant="danger" size="sm" onClick={() => deleteWorkflow(wf)}>Delete</Btn>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <WorkflowEditorModal
          workflow={editing === "new" ? null : editing}
          meta={meta}
          onClose={() => setEditing(null)}
          onSaved={(saved) => {
            setWorkflows((prev) => (editing === "new" ? [saved, ...prev] : prev.map((w) => (w._id === saved._id ? saved : w))));
            setEditing(null);
            toast("Workflow saved", "success");
          }}
          toast={toast}
        />
      )}

      {historyFor && (
        <Modal title={`Run History — ${historyFor.name}`} onClose={() => setHistoryFor(null)}>
          {runsLoading ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : runs.length === 0 ? (
            <p className="text-sm text-gray-500">No runs yet.</p>
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
        </Modal>
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
        </>
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

      {lightboxUrl && (
        <Modal onClose={() => setLightboxUrl("")}>
          <img src={lightboxUrl} alt="Payment screenshot full size" className="max-w-full max-h-[75vh] rounded-lg mx-auto block" />
        </Modal>
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
          <Route path="settings" element={<SettingsPage toast={toast} />} />
          <Route path="*" element={<Navigate to="" replace />} />
        </Routes>
      </Layout>

      <ToastContainer toasts={toasts} />
    </>
  );
}
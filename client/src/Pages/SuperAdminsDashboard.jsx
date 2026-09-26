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
import { Routes, Route, NavLink, useNavigate, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSuperAdminData } from "../hooks/useSuperAdminData";
import { StatusBadge, SectionHeader, Btn, EmptyState } from "./SuperAdminUI";
import WhatsAppDashboard from "./WhatsAppDashboard";
import { AutomationWorkflowPage, AutomationWorkflowEditorPage, ContactsPage, TasksPage, OpportunitiesPage, TriggerLinksPage } from "./AutomationWorkflow";

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

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED UI PRIMITIVES (self-contained, matching InstructorDashboard.jsx style)
// ─────────────────────────────────────────────────────────────────────────────
// NEW: StatusBadge, SectionHeader, Btn, EmptyState moved to SuperAdminUI.jsx
// (imported above) — WhatsAppDashboard.jsx needs these too, and importing
// them from there instead of from this file avoids a circular import
// (this file imports WhatsAppDashboard as a component; if that file
// imported back from here, that's a cycle).

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
  { to: "/superadmin/contacts",     label: "Contacts",      icon: "👤" },
  { to: "/superadmin/tasks",        label: "Tasks",         icon: "✅" },
  { to: "/superadmin/opportunities", label: "Opportunities", icon: "📊" },
  { to: "/superadmin/triggers",     label: "Triggers",      icon: "🔗" },
  { to: "/superadmin/whatsapp",     label: "WhatsApp",      icon: "💬" },
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
// AUTOMATION WORKFLOW, CONTACTS, TASKS, OPPORTUNITIES, TRIGGERS
// ─────────────────────────────────────────────────────────────────────────────
// All moved into ./AutomationWorkflow.jsx (imported above) — the workflow
// builder (trigger picker, action/condition canvas, run history), plus the
// CRM screens it reads from and writes to. See that file's own header
// comment for what changed inside it.

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
          <Route path="contacts" element={<ContactsPage toast={toast} />} />
          <Route path="tasks" element={<TasksPage toast={toast} />} />
          <Route path="opportunities" element={<OpportunitiesPage toast={toast} />} />
          <Route path="triggers" element={<TriggerLinksPage toast={toast} />} />
          <Route path="whatsapp" element={<WhatsAppDashboard toast={toast} />} />
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
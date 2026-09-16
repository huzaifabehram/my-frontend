// client/src/hooks/useSuperAdminData.js
// ─────────────────────────────────────────────────────────────────────────────
// Data layer for SuperAdminDashboard.jsx — same shape as your existing
// useInstructorCourses hook. Talks to the backend endpoints described in
// SETUP_NOTES.md / server/routes/admin.js.
//
// ASSUMPTION: `api` (from useAuth()) is an axios instance whose baseURL
// already points at your API root (the same one every other page in this
// codebase calls with paths like `/users/:id`, `/courses/:id/reviews`, etc).
// Adjust the `/admin/...` paths below if your route prefix differs.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";

export function useSuperAdminData() {
  const { API: api } = useAuth();

  const [overview, setOverview] = useState(null);
  const [students, setStudents] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState({ pending: [], verified: [], rejected: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [overviewRes, studentsRes, instructorsRes, coursesRes, pendingRes, verifiedRes, rejectedRes] =
        await Promise.all([
          api.get("/admin/overview"),
          api.get("/admin/students"),
          api.get("/admin/instructors"),
          api.get("/admin/courses"),
          api.get("/admin/enrollments", { params: { status: "pending" } }),
          api.get("/admin/enrollments", { params: { status: "verified" } }),
          api.get("/admin/enrollments", { params: { status: "rejected" } }),
        ]);
      setOverview(overviewRes.data);
      setStudents(Array.isArray(studentsRes.data) ? studentsRes.data : []);
      setInstructors(Array.isArray(instructorsRes.data) ? instructorsRes.data : []);
      setCourses(Array.isArray(coursesRes.data) ? coursesRes.data : []);
      setEnrollments({
        pending: Array.isArray(pendingRes.data) ? pendingRes.data : [],
        verified: Array.isArray(verifiedRes.data) ? verifiedRes.data : [],
        rejected: Array.isArray(rejectedRes.data) ? rejectedRes.data : [],
      });
    } catch (err) {
      console.error("Failed to load super admin data:", err);
      setError("Could not load admin data.");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const verifyEnrollment = useCallback(async (id) => {
    const res = await api.patch(`/admin/enrollments/${id}/verify`);
    setEnrollments((p) => ({
      ...p,
      pending: p.pending.filter((e) => (e._id || e.id) !== id),
      verified: [res.data, ...p.verified],
    }));
    setOverview((o) => o ? { ...o, pendingVerifications: Math.max(0, (o.pendingVerifications || 1) - 1) } : o);
    return res.data;
  }, [api]);

  const rejectEnrollment = useCallback(async (id, reason) => {
    const res = await api.patch(`/admin/enrollments/${id}/reject`, { reason });
    setEnrollments((p) => ({
      ...p,
      pending: p.pending.filter((e) => (e._id || e.id) !== id),
      rejected: [res.data, ...p.rejected],
    }));
    setOverview((o) => o ? { ...o, pendingVerifications: Math.max(0, (o.pendingVerifications || 1) - 1) } : o);
    return res.data;
  }, [api]);

  const toggleStudentStatus = useCallback(async (id, currentStatus) => {
    const nextStatus = currentStatus === "suspended" ? "active" : "suspended";
    const res = await api.patch(`/admin/students/${id}/status`, { status: nextStatus });
    setStudents((p) => p.map((s) => (s._id === id ? res.data : s)));
    return res.data;
  }, [api]);

  const toggleInstructorStatus = useCallback(async (id, currentStatus) => {
    const nextStatus = currentStatus === "suspended" ? "active" : "suspended";
    const res = await api.patch(`/admin/instructors/${id}/status`, { status: nextStatus });
    setInstructors((p) => p.map((i) => (i._id === id ? res.data : i)));
    return res.data;
  }, [api]);

  return {
    overview, students, instructors, courses, enrollments,
    loading, error, refetch: fetchAll,
    verifyEnrollment, rejectEnrollment, toggleStudentStatus, toggleInstructorStatus,
  };
}
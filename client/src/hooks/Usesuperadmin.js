// client/src/hooks/useSuperAdmin.js
// ─────────────────────────────────────────────────────────────────────────────
// Data layer for the Super Admin panel. Mirrors the shape of
// `useInstructorCourses` already used by InstructorDashboard.jsx — same
// `API: api` axios instance from AuthContext, same load/refetch pattern.
//
// Expects these backend endpoints (see adminRoutes.js):
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
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";

export function useSuperAdminData() {
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
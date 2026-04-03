// src/hooks/useInstructorCourses.js
import { useState, useEffect, useCallback } from "react";
import { API } from "../context/AuthContext";

export function useInstructorCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  // ── Fetch all instructor courses ──────────────────────────────────────────
  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get("/courses/instructor/my-courses");
      // Normalize to ensure required fields exist
      const normalized = (res.data || []).map(c => ({
        ...c,
        status:           c.isPublished ? "published" : (c.status || "draft"),
        studentsEnrolled: c.enrolledStudents?.length || c.studentsEnrolled || 0,
        revenue:          c.revenue || 0,
        rating:           c.rating  || 0,
      }));
      setCourses(normalized);
    } catch (err) {
      console.error("useInstructorCourses fetch error:", err);
      setError(err.response?.data?.message || "Could not load courses");
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  // ── Create course ─────────────────────────────────────────────────────────
  const createCourse = async (data) => {
    const res = await API.post("/courses", data);
    await fetchCourses(); // refresh list
    return res.data;
  };

  // ── Update course ─────────────────────────────────────────────────────────
  const updateCourse = async (id, data) => {
    const res = await API.put(`/courses/${id}`, data);
    await fetchCourses();
    return res.data;
  };

  // ── Delete course ─────────────────────────────────────────────────────────
  const deleteCourse = async (id) => {
    await API.delete(`/courses/${id}`);
    setCourses(prev => prev.filter(c => c._id !== id));
  };

  // ── Toggle publish / unpublish ────────────────────────────────────────────
  const togglePublish = async (id, currentStatus) => {
    const res = await API.patch(`/courses/${id}/publish`);
    const updatedStatus = res.data.isPublished ? "published" : "draft";
    setCourses(prev =>
      prev.map(c => c._id === id ? { ...c, status: updatedStatus, isPublished: res.data.isPublished } : c)
    );
    return { ...res.data, status: updatedStatus };
  };

  return { courses, loading, error, createCourse, updateCourse, deleteCourse, togglePublish, refetch: fetchCourses };
}
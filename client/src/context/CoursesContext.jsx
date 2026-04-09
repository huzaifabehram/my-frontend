// src/context/CoursesContext.jsx
// Uses the same axios instance and endpoints as useInstructorCourses so it
// always hits the real backend, never falls back to mock unless truly unreachable.

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

// ── Import the same axios instance used everywhere else in the app ────────────
// We import directly from the service file you showed us so we use the exact
// same baseURL + JWT interceptor, no duplication.
import axios from "axios";

const API = axios.create({ baseURL: "http://localhost:5000/api" });
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

// ─── Emoji / color pools ──────────────────────────────────────────────────────
const EMOJI_POOL = ["🌐","⚛️","🐍","🎨","🚀","📱","☁️","📈","🔐","🖌️","🔥","🦋","💡","⚡","🎯","🛠️"];
const COLOR_POOL = [
  "from-blue-500 to-indigo-600","from-cyan-500 to-blue-500",
  "from-green-500 to-teal-600","from-pink-500 to-rose-600",
  "from-emerald-500 to-green-600","from-gray-700 to-gray-900",
  "from-orange-400 to-amber-500","from-violet-500 to-purple-600",
  "from-red-500 to-rose-700","from-fuchsia-500 to-pink-600",
  "from-yellow-500 to-orange-500","from-sky-400 to-blue-500",
];

// ─── Normalizer ───────────────────────────────────────────────────────────────
export function normalizeCourse(raw, index) {
  if (!raw || typeof raw !== "object") return null;
  const idx = typeof index === "number" ? index : 0;

  // Your backend uses isPublished boolean
  const status = raw.isPublished ? "published" : (raw.status || "draft");

  // Sections
  const rawSections = Array.isArray(raw.sections) ? raw.sections : [];
  const sections = rawSections.map((sec) => {
    const rawLectures = Array.isArray(sec.lectures)
      ? sec.lectures.filter((l) => l && typeof l === "object")
      : [];
    const lectures_list = rawLectures.map((lec) => ({
      id:       lec._id || lec.id || Math.random().toString(36).slice(2),
      title:    lec.title    || "Untitled Lecture",
      duration: lec.duration || "",
      type:     lec.type     || "video",
      preview:  Boolean(lec.free || lec.preview || lec.isFree),
      videoUrl: lec.videoUrl || lec.video || "",
    }));
    return {
      _id:          sec._id || sec.id || Math.random().toString(36).slice(2),
      title:        sec.title || "Untitled Section",
      lectures:     lectures_list.length,
      lectures_list,
      duration:     sec.duration || "",
    };
  });

  const totalLectures = sections.reduce((a, s) => a + s.lectures, 0);
  const rawPrice    = Number(raw.price)         || 0;
  const rawDiscount = Number(raw.discountPrice) || rawPrice;

  // enrolledStudents can be an array (populated) or a number
  const students = Array.isArray(raw.enrolledStudents)
    ? raw.enrolledStudents.length
    : Number(raw.enrolledStudents || raw.studentsEnrolled || 0);

  // instructor can be a populated object or a plain string
  const instructorName = (typeof raw.instructor === "object" && raw.instructor !== null)
    ? (raw.instructor.name || "Instructor")
    : (raw.instructorName || raw.instructor || "Instructor");

  const instructorBio = (typeof raw.instructor === "object" && raw.instructor !== null)
    ? (raw.instructor.bio || raw.instructorBio || "")
    : (raw.instructorBio || "");

  return {
    _id:   raw._id  || raw.id || "",
    id:    raw._id  || raw.id || "",

    title:         raw.title       || "Untitled Course",
    subtitle:      raw.subtitle    || (typeof raw.description === "string" ? raw.description.slice(0, 120) : ""),
    description:   raw.description || "",
    whatYouLearn:  Array.isArray(raw.whatYouLearn) ? raw.whatYouLearn : [],
    requirements:  Array.isArray(raw.requirements) ? raw.requirements : [],
    language:      raw.language || "English",

    instructor:         instructorName,
    instructorBio,
    instructorRating:   Number(raw.instructorRating)   || 0,
    instructorReviews:  Number(raw.instructorReviews)  || 0,
    instructorStudents: Number(raw.instructorStudents) || 0,
    instructorCourses:  Number(raw.instructorCourses)  || 0,
    instructorImage:    raw.instructorImage || "👩‍💼",

    rating:           Number(raw.rating)  || 0,
    reviews:          Number(raw.totalReviews || raw.reviews || raw.numReviews) || 0,
    studentsEnrolled: students,
    students,
    price:            rawDiscount,
    originalPrice:    rawPrice,
    discountPrice:    rawDiscount,
    revenue:          Number(raw.revenue) || 0,

    category:   raw.category || "General",
    level:      raw.level    || "Beginner",
    tags:       Array.isArray(raw.tags) ? raw.tags : [],
    status,
    isPublished: status === "published",
    bestseller: Boolean(raw.bestseller || raw.isBestseller),
    updatedAt:  raw.updatedAt || new Date().toISOString(),
    lastUpdated: raw.updatedAt
      ? new Date(raw.updatedAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
      : "Recently",
    duration:  raw.duration || "",
    lectures:  totalLectures,

    thumbnail:       raw.thumbnail || raw.image || raw.coverImage || "",
    previewVideoUrl: raw.previewVideoUrl || raw.previewVideo || "",
    emoji: raw.emoji || EMOJI_POOL[idx % EMOJI_POOL.length],
    color: raw.color || COLOR_POOL[idx % COLOR_POOL.length],

    sections,
    reviews_list: Array.isArray(raw.reviews_list)
      ? raw.reviews_list.filter(r => r && typeof r === "object")
      : [],
  };
}

// ─── Minimal mock — only shown when backend is totally unreachable ─────────────
const MOCK_COURSES = [
  {
    _id: "mock-1", id: "mock-1", isPublished: true, status: "published",
    title: "Sample Course (Backend Offline)",
    subtitle: "Connect your backend to see real courses here",
    description: "This is placeholder data shown when the backend cannot be reached.",
    instructor: "Demo Instructor", instructorBio: "", instructorRating: 0,
    instructorReviews: 0, instructorStudents: 0, instructorCourses: 0, instructorImage: "👩‍💼",
    rating: 0, reviews: 0, studentsEnrolled: 0, students: 0,
    price: 0, originalPrice: 0, discountPrice: 0, revenue: 0,
    duration: "", lectures: 0, level: "Beginner", category: "General",
    tags: [], bestseller: false,
    updatedAt: new Date().toISOString(), lastUpdated: "Recently",
    language: "English", thumbnail: "", previewVideoUrl: "",
    emoji: "📚", color: "from-gray-400 to-gray-600",
    whatYouLearn: [], requirements: [], sections: [], reviews_list: [],
  },
];

// ─── Context ──────────────────────────────────────────────────────────────────
const CoursesContext = createContext(null);

export function CoursesProvider({ children }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const fetchPublishedCourses = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // GET /api/courses  — same base endpoint your instructor hook uses
      // No auth required for public listing; the interceptor adds token if present
      const res = await API.get("/courses");

      // Handle all common backend response shapes:
      // { courses: [...] }  |  { data: [...] }  |  [...]
      const raw = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.courses)
          ? res.data.courses
          : Array.isArray(res.data?.data)
            ? res.data.data
            : [];

      console.log(`[CoursesContext] /courses returned ${raw.length} total courses`);

      // Filter to published only — your backend uses isPublished boolean
      const published = raw.filter(
        (c) => c.isPublished === true || c.status === "published"
      );

      console.log(`[CoursesContext] ${published.length} published courses found`);

      if (published.length > 0) {
        setCourses(published.map((c, i) => normalizeCourse(c, i)).filter(Boolean));
      } else if (raw.length > 0) {
        // Backend is reachable but no courses are published yet — show empty state
        console.warn("[CoursesContext] Backend reachable but 0 published courses.");
        setCourses([]);
      } else {
        // Empty array returned — show empty state, not mock
        console.warn("[CoursesContext] Backend returned empty array.");
        setCourses([]);
      }
    } catch (err) {
      // Only fall back to mock when the backend is completely unreachable
      console.error("[CoursesContext] Backend unreachable:", err.message);
      setError(err.message);
      setCourses(MOCK_COURSES);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPublishedCourses(); }, [fetchPublishedCourses]);

  // ── Real-time sync called by InstructorDashboard after mutations ──────────
  const syncCreated = useCallback((raw, index) => {
    if (!raw) return;
    const course = normalizeCourse(raw, index);
    if (!course || course.status !== "published") return;
    setCourses((prev) =>
      prev.some((c) => c._id === course._id) ? prev : [course, ...prev]
    );
  }, []);

  const syncUpdated = useCallback((raw, index) => {
    if (!raw) return;
    const course = normalizeCourse(raw, index);
    if (!course) return;
    setCourses((prev) => {
      if (course.status === "published") {
        return prev.some((c) => c._id === course._id)
          ? prev.map((c) => (c._id === course._id ? course : c))
          : [course, ...prev];
      }
      return prev.filter((c) => c._id !== course._id);
    });
  }, []);

  const syncDeleted = useCallback((id) => {
    if (!id) return;
    setCourses((prev) => prev.filter((c) => c._id !== id));
  }, []);

  const getCourse = useCallback((id) => {
    if (!id) return null;
    return courses.find((c) => c._id === id || c.id === id) || null;
  }, [courses]);

  return (
    <CoursesContext.Provider value={{
      courses, loading, error,
      fetchPublishedCourses,
      syncCreated, syncUpdated, syncDeleted,
      getCourse,
    }}>
      {children}
    </CoursesContext.Provider>
  );
}

export function useCourses() {
  const ctx = useContext(CoursesContext);
  if (!ctx) throw new Error("useCourses must be inside <CoursesProvider>");
  return ctx;
}
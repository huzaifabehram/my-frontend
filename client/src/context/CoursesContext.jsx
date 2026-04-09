// src/context/CoursesContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";

// Uses the same base URL as every other API call in the app
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
});
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

const EMOJI_POOL = ["🌐","⚛️","🐍","🎨","🚀","📱","☁️","📈","🔐","🖌️","🔥","🦋","💡","⚡","🎯","🛠️"];
const COLOR_POOL = [
  "from-blue-500 to-indigo-600","from-cyan-500 to-blue-500",
  "from-green-500 to-teal-600","from-pink-500 to-rose-600",
  "from-emerald-500 to-green-600","from-gray-700 to-gray-900",
  "from-orange-400 to-amber-500","from-violet-500 to-purple-600",
  "from-red-500 to-rose-700","from-fuchsia-500 to-pink-600",
  "from-yellow-500 to-orange-500","from-sky-400 to-blue-500",
];

export function normalizeCourse(raw, index) {
  if (!raw || typeof raw !== "object") return null;
  const idx = typeof index === "number" ? index : 0;

  // Your backend uses status: "published" (not isPublished)
  const status = raw.status || "draft";

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
      preview:  Boolean(lec.free || lec.preview),
      videoUrl: lec.videoUrl || "",
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
  const students    = Number(raw.studentsEnrolled) || 0;

  // instructor is populated as { name, avatar, title, bio }
  const inst = raw.instructor;
  const instructorName = inst && typeof inst === "object" ? inst.name : (inst || "Instructor");
  const instructorBio  = inst && typeof inst === "object" ? (inst.bio || "") : "";
  const instructorImg  = inst && typeof inst === "object" ? (inst.avatar || "👩‍💼") : "👩‍💼";

  return {
    _id:   raw._id || "",
    id:    raw._id || "",

    title:         raw.title       || "Untitled Course",
    subtitle:      raw.subtitle    || "",
    description:   raw.description || "",
    whatYouLearn:  Array.isArray(raw.whatYouLearn) ? raw.whatYouLearn : [],
    requirements:  Array.isArray(raw.requirements) ? raw.requirements : [],
    language:      raw.language || "English",

    instructor:         instructorName,
    instructorBio,
    instructorImage:    instructorImg,
    instructorRating:   0,
    instructorReviews:  0,
    instructorStudents: 0,
    instructorCourses:  0,

    rating:           Number(raw.rating)       || 0,
    reviews:          Number(raw.totalRatings) || 0,
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
    bestseller:  Boolean(raw.badge === "Bestseller"),
    updatedAt:   raw.updatedAt || new Date().toISOString(),
    lastUpdated: raw.updatedAt
      ? new Date(raw.updatedAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
      : "Recently",
    duration:  raw.duration || "",
    lectures:  totalLectures,

    thumbnail:       raw.thumbnail      || "",
    previewVideoUrl: raw.previewVideoUrl || "",
    emoji: EMOJI_POOL[idx % EMOJI_POOL.length],
    color: COLOR_POOL[idx % COLOR_POOL.length],

    sections,
    reviews_list: [],
  };
}

const CoursesContext = createContext(null);

export function CoursesProvider({ children }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const fetchPublishedCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // GET /api/courses already filters by status:"published" on the backend
      const res = await API.get("/courses");
      const raw = Array.isArray(res.data) ? res.data : (res.data?.courses || []);
      console.log(`[CoursesContext] fetched ${raw.length} published courses`);
      setCourses(raw.map((c, i) => normalizeCourse(c, i)).filter(Boolean));
    } catch (err) {
      console.error("[CoursesContext] fetch failed:", err.message);
      setError(err.message);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPublishedCourses(); }, [fetchPublishedCourses]);

  const syncCreated = useCallback((raw, index) => {
    if (!raw || raw.status !== "published") return;
    const course = normalizeCourse(raw, index);
    if (!course) return;
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
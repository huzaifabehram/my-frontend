// src/context/CoursesContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";

// ⚠️ USES SAME BASE URL AS AuthContext
const BASE_URL = process.env.REACT_APP_API_URL || "https://my-course-backend-8u69.onrender.com/api";

const API = axios.create({
  baseURL: BASE_URL,
});

// Attach token to every request
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
  const source = raw.course && typeof raw.course === "object" ? raw.course : raw;
  const idx = typeof index === "number" ? index : 0;

  const status = source.status || "draft";

  const rawSections = Array.isArray(source.sections) ? source.sections : [];
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
  const rawPrice    = Number(source.price)         || 0;
  const rawDiscount = Number(source.discountPrice) || rawPrice;
  const students    = Number(source.studentsEnrolled) || 0;

  const inst = source.instructor;
  const instructorName = inst && typeof inst === "object" ? inst.name : (inst || "Instructor");
  const instructorBio  = inst && typeof inst === "object" ? (inst.bio || "") : "";
  const instructorImg  = inst && typeof inst === "object" ? (inst.avatar || "👩‍💼") : "👩‍💼";
  const instructorId =
    inst && typeof inst === "object" && inst._id != null
      ? String(inst._id)
      : source.instructor && typeof source.instructor !== "object"
        ? String(source.instructor)
        : "";

  const imageTestimonials = Array.isArray(source.imageTestimonials)
    ? source.imageTestimonials
        .filter((t) => t && typeof t === "object" && t.imageUrl)
        .map((t) => ({
          id: t._id != null ? String(t._id) : t.id,
          _id: t._id,
          author: t.author || "",
          text: t.text || "",
          imageUrl: t.imageUrl || "",
        }))
    : [];

  const videoTestimonials = Array.isArray(source.videoTestimonials)
    ? source.videoTestimonials
        .filter((t) => t && typeof t === "object" && t.videoUrl)
        .map((t) => ({
          id: t._id != null ? String(t._id) : t.id,
          _id: t._id,
          author: t.author || "",
          text: t.text || "",
          videoUrl: t.videoUrl || "",
        }))
    : [];

  const projectGallery = Array.isArray(source.projectGallery)
    ? source.projectGallery
        .filter((g) => g && typeof g === "object" && g.imageUrl)
        .map((g) => ({
          id: g._id != null ? String(g._id) : g.id,
          _id: g._id,
          imageUrl: g.imageUrl || "",
          caption: g.caption || "",
        }))
    : [];

  const alsoBoughtCourseIds = Array.isArray(source.alsoBoughtCourseIds)
    ? source.alsoBoughtCourseIds.map((id) => String(id))
    : [];

  return {
    _id:   source._id || "",
    id:    source._id || "",

    title:         source.title       || "Untitled Course",
    subtitle:      source.subtitle    || "",
    description:   source.description || "",
    whatYouLearn:  Array.isArray(source.whatYouLearn) ? source.whatYouLearn : [],
    requirements:  Array.isArray(source.requirements) ? source.requirements : [],
    language:      source.language || "English",

    instructor:         instructorName,
    instructorId,
    instructorBio,
    instructorImage:    instructorImg,
    instructorRating:   0,
    instructorReviews:  0,
    instructorStudents: 0,
    instructorCourses:  0,

    rating:           Number(source.rating)       || 0,
    reviews:          Number(source.totalRatings) || 0,
    studentsEnrolled: students,
    students,
    price:            rawDiscount,
    originalPrice:    rawPrice,
    discountPrice:    rawDiscount,
    revenue:          Number(source.revenue) || 0,

    category:   source.category || "General",
    level:      source.level    || "Beginner",
    tags:       Array.isArray(source.tags) ? source.tags : [],
    status,
    isPublished: status === "published",
    bestseller:  Boolean(source.badge === "Bestseller"),
    updatedAt:   source.updatedAt || new Date().toISOString(),
    lastUpdated: source.updatedAt
      ? new Date(source.updatedAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
      : "Recently",
    duration:  source.duration || "",
    lectures:  totalLectures,

    thumbnail:       source.thumbnail      || "",
    previewVideoUrl: source.previewVideoUrl || "",
    emoji: EMOJI_POOL[idx % EMOJI_POOL.length],
    color: COLOR_POOL[idx % COLOR_POOL.length],

    sections,
    reviews_list: [],
    imageTestimonials,
    videoTestimonials,
    projectGallery,
    alsoBoughtCourseIds,
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
      console.log(`[CoursesContext] 🔍 Fetching from: ${BASE_URL}/courses`);
      const res = await API.get("/courses");
      const raw = Array.isArray(res.data) ? res.data : (res.data?.courses || []);
      console.log(`[CoursesContext] ✅ Fetched ${raw.length} published courses`);
      console.log(`[CoursesContext] Sample course:`, raw[0]);
      setCourses(raw.map((c, i) => normalizeCourse(c, i)).filter(Boolean));
    } catch (err) {
      console.error("[CoursesContext] ❌ Fetch failed:", err.message);
      console.error("[CoursesContext] Full error:", err.response?.data || err);
      setError(err.message);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPublishedCourses(); }, [fetchPublishedCourses]);

  // ─── NEW: Fetch a single course by ID with full sections data ─────────────
  // The list endpoint uses .select("-sections") so sections are stripped.
  // This hits /api/courses/:id which returns the full document including sections.
  const fetchCourseById = useCallback(async (id) => {
    if (!id) return null;
    try {
      console.log(`[CoursesContext] 🔍 Fetching full course: ${BASE_URL}/courses/${id}`);
      const res = await API.get(`/courses/${id}`);
      const index = courses.findIndex((c) => c._id === id);
      const course = normalizeCourse(res.data, index >= 0 ? index : 0);
      console.log(`[CoursesContext] ✅ Full course fetched, sections:`, course?.sections?.length);
      console.log(`[CoursesContext] ✅ Image testimonials:`, course?.imageTestimonials?.length);
      console.log(`[CoursesContext] ✅ Video testimonials:`, course?.videoTestimonials?.length);
      console.log(`[CoursesContext] ✅ Project gallery:`, course?.projectGallery?.length);
      console.log(`[CoursesContext] ✅ Also bought IDs:`, course?.alsoBoughtCourseIds?.length);
      return course;
    } catch (err) {
      console.error("[CoursesContext] ❌ fetchCourseById failed:", err.message);
      return null;
    }
  }, [courses]);

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
      fetchCourseById,
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
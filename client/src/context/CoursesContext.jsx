// src/context/CoursesContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { API } from "./AuthContext"; // ← same axios instance your hook uses

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
// Handles both `isPublished` (your backend) and `status` field variants
export function normalizeCourse(raw, index) {
  if (!raw || typeof raw !== "object") return null;

  const idx = typeof index === "number" ? index : 0;

  // Your backend uses `isPublished` boolean — map it to a status string
  const status = raw.status
    ? raw.status
    : raw.isPublished
      ? "published"
      : "draft";

  // Sections normalisation
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

  // enrolledStudents may be an array (populate) or a number
  const students = Array.isArray(raw.enrolledStudents)
    ? raw.enrolledStudents.length
    : Number(raw.enrolledStudents || raw.studentsEnrolled || 0);

  return {
    _id:   raw._id  || raw.id  || "",
    id:    raw._id  || raw.id  || "",

    title:         raw.title       || "Untitled Course",
    subtitle:      raw.subtitle    || (typeof raw.description === "string" ? raw.description.slice(0, 120) : ""),
    description:   raw.description || "",
    whatYouLearn:  Array.isArray(raw.whatYouLearn)  ? raw.whatYouLearn  : [],
    requirements:  Array.isArray(raw.requirements)  ? raw.requirements  : [],
    language:      raw.language    || "English",

    // instructor — backend may populate as object or store as string
    instructor:         raw.instructor?.name || raw.instructorName || raw.instructor || "Instructor",
    instructorBio:      raw.instructor?.bio  || raw.instructorBio  || "",
    instructorRating:   Number(raw.instructor?.rating   || raw.instructorRating)   || 0,
    instructorReviews:  Number(raw.instructor?.reviews  || raw.instructorReviews)  || 0,
    instructorStudents: Number(raw.instructor?.students || raw.instructorStudents) || 0,
    instructorCourses:  Number(raw.instructor?.courses  || raw.instructorCourses)  || 0,
    instructorImage:    raw.instructor?.avatar || raw.instructorImage || "👩‍💼",

    rating:           Number(raw.rating)           || 0,
    reviews:          Number(raw.totalReviews || raw.reviews || raw.numReviews) || 0,
    studentsEnrolled: students,
    students,
    price:            rawDiscount,
    originalPrice:    rawPrice,
    discountPrice:    rawDiscount,
    revenue:          Number(raw.revenue) || 0,

    category:   raw.category  || "General",
    level:      raw.level     || "Beginner",
    tags:       Array.isArray(raw.tags) ? raw.tags : [],
    status,
    isPublished: status === "published",
    bestseller: Boolean(raw.bestseller || raw.isBestseller),
    updatedAt:  raw.updatedAt || new Date().toISOString(),
    lastUpdated: raw.updatedAt
      ? new Date(raw.updatedAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
      : "Recently",
    duration:   raw.duration || "",
    lectures:   totalLectures,

    thumbnail:       raw.thumbnail       || raw.image || raw.coverImage || "",
    previewVideoUrl: raw.previewVideoUrl || raw.previewVideo || "",
    emoji: raw.emoji || EMOJI_POOL[idx % EMOJI_POOL.length],
    color: raw.color || COLOR_POOL[idx % COLOR_POOL.length],

    sections,
    reviews_list: Array.isArray(raw.reviews_list || raw.reviews)
      ? (raw.reviews_list || raw.reviews).filter(r => r && typeof r === "object")
      : [],
  };
}

// ─── Mock fallback (only shown when backend is totally unreachable) ────────────
export const MOCK_COURSES = [
  {
    _id: "mock-1", id: "mock-1", isPublished: true,
    title: "Complete Web Development Bootcamp 2024",
    subtitle: "Master HTML, CSS, JavaScript, React, and Node.js from scratch",
    description: "This comprehensive bootcamp will transform you into a full-stack web developer.",
    instructor: "Sarah Anderson", instructorBio: "Senior Full-Stack Developer with 10+ years of experience.",
    instructorRating: 4.9, instructorReviews: 45678, instructorStudents: 234567, instructorCourses: 12,
    instructorImage: "👩‍💼",
    rating: 4.8, reviews: 150232, studentsEnrolled: 89234, students: 89234,
    price: 99.99, originalPrice: 499.99, discountPrice: 99.99, revenue: 0,
    duration: "45h", lectures: 5, level: "Beginner", category: "Web Development",
    tags: ["HTML", "CSS", "JavaScript", "React", "Node.js"],
    bestseller: true, status: "published",
    updatedAt: "2024-01-15T00:00:00Z", lastUpdated: "January 2024",
    language: "English", thumbnail: "", previewVideoUrl: "",
    emoji: "🌐", color: "from-blue-500 to-indigo-600",
    whatYouLearn: ["Build web apps from scratch","Master JavaScript ES6+","CSS Grid and Flexbox","Node.js and Express APIs","Deploy to production","User authentication"],
    requirements: ["Computer with internet","Basic understanding of websites","VS Code recommended"],
    sections: [
      { _id: "s1", title: "Section 1: HTML Fundamentals", lectures: 3, duration: "3h 45m",
        lectures_list: [
          { id: "l1", title: "Introduction to HTML",    duration: "15m", type: "video", preview: true,  videoUrl: "" },
          { id: "l2", title: "HTML5 Semantic Elements", duration: "22m", type: "video", preview: false, videoUrl: "" },
          { id: "l3", title: "HTML Quiz #1",            duration: "5m",  type: "quiz",  preview: false, videoUrl: "" },
        ]},
      { _id: "s2", title: "Section 2: CSS Mastery", lectures: 2, duration: "6h 20m",
        lectures_list: [
          { id: "l4", title: "CSS Selectors",      duration: "28m", type: "video", preview: true,  videoUrl: "" },
          { id: "l5", title: "Flexbox Guide",       duration: "45m", type: "video", preview: false, videoUrl: "" },
        ]},
    ],
    reviews_list: [
      { author: "John Smith",   rating: 5, text: "Absolutely incredible!", verified: true },
      { author: "Emma Johnson", rating: 5, text: "Got my first dev job after this.", verified: true },
    ],
  },
  {
    _id: "mock-2", id: "mock-2", isPublished: true,
    title: "Advanced React Patterns & Architecture",
    subtitle: "Build scalable React apps with advanced patterns, hooks & performance",
    description: "Go beyond beginner React. Learn patterns the pros use to build large, maintainable apps.",
    instructor: "Michael Torres", instructorBio: "React contributor, 8 years in enterprise.",
    instructorRating: 4.8, instructorReviews: 23000, instructorStudents: 110000, instructorCourses: 6,
    instructorImage: "👨‍💻",
    rating: 4.7, reviews: 45890, studentsEnrolled: 32100, students: 32100,
    price: 84.99, originalPrice: 299.99, discountPrice: 84.99, revenue: 0,
    duration: "32h", lectures: 1, level: "Advanced", category: "Web Development",
    tags: ["React", "TypeScript", "Redux", "Performance"],
    bestseller: true, status: "published",
    updatedAt: "2024-02-10T00:00:00Z", lastUpdated: "February 2024",
    language: "English", thumbnail: "", previewVideoUrl: "",
    emoji: "⚛️", color: "from-cyan-500 to-blue-500",
    whatYouLearn: ["Master React patterns","Scalable architectures","Performance optimization"],
    requirements: ["React basics","JavaScript ES6+"],
    sections: [
      { _id: "s3", title: "Section 1: Advanced Hooks", lectures: 1, duration: "2h",
        lectures_list: [
          { id: "l6", title: "Custom Hooks Deep Dive", duration: "35m", type: "video", preview: true, videoUrl: "" },
        ]},
    ],
    reviews_list: [
      { author: "Priya S.", rating: 5, text: "Best React course I've taken.", verified: true },
    ],
  },
];

// ─── Context ──────────────────────────────────────────────────────────────────
const CoursesContext = createContext(null);

export function CoursesProvider({ children }) {
  const [courses, setCourses] = useState(MOCK_COURSES);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const fetchPublishedCourses = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Try endpoints in order until one works.
    // Your backend likely has a public GET /api/courses endpoint that
    // returns all courses (or published ones). We filter by isPublished client-side.
    const ENDPOINTS = [
      "/courses",                    // most common — returns all published courses publicly
      "/courses/public",             // some backends have a dedicated public route
      "/courses?isPublished=true",   // query param variant
    ];

    for (const endpoint of ENDPOINTS) {
      try {
        const res = await API.get(endpoint);
        const raw = Array.isArray(res.data)
          ? res.data
          : (res.data?.courses || res.data?.data || []);

        // Filter to only published courses (backend uses isPublished boolean)
        const published = raw.filter((c) =>
          c.isPublished === true || c.status === "published"
        );

        if (published.length > 0) {
          const normalised = published
            .map((c, i) => normalizeCourse(c, i))
            .filter(Boolean);
          setCourses(normalised);
          setLoading(false);
          return; // success — stop trying other endpoints
        }

        // Endpoint responded but returned 0 published courses —
        // still counts as "connected", just empty
        if (raw.length >= 0) {
          setCourses([]);
          setLoading(false);
          return;
        }
      } catch (err) {
        // 404 → try next endpoint; anything else → bail
        if (err.response?.status !== 404) {
          console.warn(`[CoursesContext] ${endpoint} failed:`, err.message);
          break;
        }
      }
    }

    // All endpoints failed → keep mock data
    console.warn("[CoursesContext] All endpoints failed, using mock data.");
    setError("Could not reach backend");
    setCourses(MOCK_COURSES);
    setLoading(false);
  }, []);

  useEffect(() => { fetchPublishedCourses(); }, [fetchPublishedCourses]);

  // ── Real-time sync (called by InstructorDashboard after mutations) ─────────
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
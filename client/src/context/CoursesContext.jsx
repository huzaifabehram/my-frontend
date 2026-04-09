// src/context/CoursesContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

// ─── Emoji / color pools for instructor-created courses ───────────────────────
const EMOJI_POOL = ["🌐","⚛️","🐍","🎨","🚀","📱","☁️","📈","🔐","🖌️","🔥","🦋","💡","⚡","🎯","🛠️"];
const COLOR_POOL = [
  "from-blue-500 to-indigo-600","from-cyan-500 to-blue-500",
  "from-green-500 to-teal-600","from-pink-500 to-rose-600",
  "from-emerald-500 to-green-600","from-gray-700 to-gray-900",
  "from-orange-400 to-amber-500","from-violet-500 to-purple-600",
  "from-red-500 to-rose-700","from-fuchsia-500 to-pink-600",
  "from-yellow-500 to-orange-500","from-sky-400 to-blue-500",
];

// ─── Safe normalizer ──────────────────────────────────────────────────────────
// Accepts ANY shape from backend or mock data and returns a consistent object.
export function normalizeCourse(raw, index) {
  if (!raw || typeof raw !== "object") return null;

  const idx = typeof index === "number" ? index : 0;

  // Sections: handle both { lectures: [{...}] } and already-normalised shapes
  const rawSections = Array.isArray(raw.sections) ? raw.sections : [];
  const sections = rawSections.map((sec) => {
    // lectures_list may already exist (mock data) OR we build it from sec.lectures
    const rawLectures = Array.isArray(sec.lectures)
      ? sec.lectures.filter((l) => typeof l === "object" && l !== null)
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
      lectures:     lectures_list.length,   // numeric count for header
      lectures_list,
      duration:     sec.duration || "",
    };
  });

  const totalLectures = sections.reduce((a, s) => a + s.lectures, 0);

  const rawPrice    = Number(raw.price)         || 0;
  const rawDiscount = Number(raw.discountPrice) || rawPrice;

  return {
    // identity
    _id:   raw._id  || raw.id  || "",
    id:    raw._id  || raw.id  || "",

    // text
    title:         raw.title       || "Untitled Course",
    subtitle:      raw.subtitle    || (typeof raw.description === "string" ? raw.description.slice(0, 100) : ""),
    description:   raw.description || "",
    whatYouLearn:  Array.isArray(raw.whatYouLearn)  ? raw.whatYouLearn  : [],
    requirements:  Array.isArray(raw.requirements)  ? raw.requirements  : [],
    language:      raw.language    || "English",

    // instructor
    instructor:         raw.instructorName   || raw.instructor || "Instructor",
    instructorBio:      raw.instructorBio    || "",
    instructorRating:   Number(raw.instructorRating)   || 0,
    instructorReviews:  Number(raw.instructorReviews)  || 0,
    instructorStudents: Number(raw.instructorStudents) || 0,
    instructorCourses:  Number(raw.instructorCourses)  || 0,
    instructorImage:    raw.instructorImage  || "👩‍💼",

    // numbers
    rating:           Number(raw.rating)           || 0,
    reviews:          Number(raw.totalReviews || raw.reviews) || 0,
    studentsEnrolled: Number(raw.studentsEnrolled) || 0,
    students:         Number(raw.studentsEnrolled) || 0,
    price:            rawDiscount,
    originalPrice:    rawPrice,
    discountPrice:    rawDiscount,
    revenue:          Number(raw.revenue) || 0,

    // meta
    category:   raw.category  || "General",
    level:      raw.level     || "Beginner",
    tags:       Array.isArray(raw.tags) ? raw.tags : [],
    status:     raw.status    || "draft",
    bestseller: Boolean(raw.bestseller),
    updatedAt:  raw.updatedAt || new Date().toISOString(),
    lastUpdated: raw.updatedAt
      ? new Date(raw.updatedAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
      : "Recently",
    duration:  raw.duration || "",
    lectures:  totalLectures,

    // media
    thumbnail:       raw.thumbnail       || "",
    previewVideoUrl: raw.previewVideoUrl || "",
    emoji: raw.emoji || EMOJI_POOL[idx % EMOJI_POOL.length],
    color: raw.color || COLOR_POOL[idx % COLOR_POOL.length],

    // curriculum
    sections,

    // reviews
    reviews_list: Array.isArray(raw.reviews_list) ? raw.reviews_list : [],
  };
}

// ─── Mock data (pre-normalised so shape is guaranteed) ────────────────────────
export const MOCK_COURSES = [
  {
    _id: "mock-1", id: "mock-1",
    title: "Complete Web Development Bootcamp 2024",
    subtitle: "Master HTML, CSS, JavaScript, React, and Node.js from scratch",
    description: "This comprehensive bootcamp will transform you into a full-stack web developer. Through hands-on projects, you'll build real applications while learning best practices.",
    instructor: "Sarah Anderson",
    instructorBio: "Senior Full-Stack Developer with 10+ years of experience.",
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
    whatYouLearn: [
      "Build fully functional web applications from scratch",
      "Master JavaScript ES6+ features and async programming",
      "Create responsive designs with CSS Grid and Flexbox",
      "Build backend APIs with Node.js and Express",
      "Deploy applications to production",
      "Implement user authentication and security",
    ],
    requirements: [
      "A computer with internet connection",
      "Basic understanding of how websites work",
      "Text editor (VS Code recommended)",
    ],
    sections: [
      {
        _id: "s1", title: "Section 1: HTML Fundamentals", lectures: 3, duration: "3h 45m",
        lectures_list: [
          { id: "l1", title: "Introduction to HTML",     duration: "15m", type: "video", preview: true,  videoUrl: "" },
          { id: "l2", title: "HTML5 Semantic Elements",  duration: "22m", type: "video", preview: false, videoUrl: "" },
          { id: "l3", title: "HTML Quiz #1",             duration: "5m",  type: "quiz",  preview: false, videoUrl: "" },
        ],
      },
      {
        _id: "s2", title: "Section 2: CSS Mastery", lectures: 2, duration: "6h 20m",
        lectures_list: [
          { id: "l4", title: "CSS Selectors & Specificity", duration: "28m", type: "video", preview: true,  videoUrl: "" },
          { id: "l5", title: "Flexbox Complete Guide",       duration: "45m", type: "video", preview: false, videoUrl: "" },
        ],
      },
    ],
    reviews_list: [
      { author: "John Smith",    rating: 5, text: "Absolutely incredible course! Explains everything clearly.",            verified: true },
      { author: "Emma Johnson",  rating: 5, text: "Best investment I've made. Got my first developer job.",              verified: true },
      { author: "Michael Chen",  rating: 4, text: "Great content and structure. Pacing is perfect for beginners.",       verified: true },
    ],
  },
  {
    _id: "mock-2", id: "mock-2",
    title: "Advanced React Patterns & Architecture",
    subtitle: "Build scalable React apps with advanced patterns, hooks & performance",
    description: "Go beyond beginner React. Learn the patterns the pros use to build large, maintainable apps.",
    instructor: "Michael Torres",
    instructorBio: "React core contributor with 8 years building enterprise apps.",
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
    whatYouLearn: ["Master React patterns", "Build scalable architectures", "Optimize performance"],
    requirements: ["React basics", "JavaScript ES6+"],
    sections: [
      {
        _id: "s3", title: "Section 1: Advanced Hooks", lectures: 1, duration: "2h",
        lectures_list: [
          { id: "l6", title: "Custom Hooks Deep Dive", duration: "35m", type: "video", preview: true, videoUrl: "" },
        ],
      },
    ],
    reviews_list: [
      { author: "Priya S.", rating: 5, text: "Best React course I've taken. Changed how I think about code.", verified: true },
    ],
  },
  {
    _id: "mock-3", id: "mock-3",
    title: "Python for Data Science & Machine Learning",
    subtitle: "Use Python, Pandas, NumPy, Matplotlib, Scikit-Learn, TensorFlow & more",
    description: "The most comprehensive ML course available. Covers everything from data cleaning to deploying models in production.",
    instructor: "Dr. Aisha Rahman",
    instructorBio: "PhD in ML, 12 years in data science at top tech companies.",
    instructorRating: 4.9, instructorReviews: 78000, instructorStudents: 320000, instructorCourses: 5,
    instructorImage: "👩‍🔬",
    rating: 4.9, reviews: 203410, studentsEnrolled: 145000, students: 145000,
    price: 119.99, originalPrice: 599.99, discountPrice: 119.99, revenue: 0,
    duration: "58h", lectures: 0, level: "Intermediate", category: "Data Science",
    tags: ["Python", "Machine Learning", "TensorFlow", "Pandas"],
    bestseller: true, status: "published",
    updatedAt: "2024-03-01T00:00:00Z", lastUpdated: "March 2024",
    language: "English", thumbnail: "", previewVideoUrl: "",
    emoji: "🐍", color: "from-green-500 to-teal-600",
    whatYouLearn: ["Build ML models", "Data analysis with Pandas", "Deep learning with TensorFlow"],
    requirements: ["Basic Python knowledge", "High school math"],
    sections: [],
    reviews_list: [
      { author: "Ahmad K.", rating: 5, text: "Dr. Rahman makes ML accessible. Outstanding course.", verified: true },
    ],
  },
];

// ─── Context ──────────────────────────────────────────────────────────────────
const CoursesContext = createContext(null);

export function CoursesProvider({ children }) {
  const [courses, setCourses] = useState(MOCK_COURSES);  // start with mock so UI never crashes
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const fetchPublishedCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const BASE = (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL)
        || "http://localhost:5000/api";
      const res = await fetch(`${BASE}/courses?status=published`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const raw  = Array.isArray(data) ? data : (data.courses || []);
      const normalised = raw
        .filter((c) => c && c.status === "published")
        .map((c, i) => normalizeCourse(c, i))
        .filter(Boolean);
      if (normalised.length > 0) setCourses(normalised);
      // if backend returns 0 published, keep mock data visible
    } catch (err) {
      console.warn("[CoursesContext] Using mock data:", err.message);
      setError(err.message);
      // courses already initialised with MOCK_COURSES — nothing to do
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPublishedCourses(); }, [fetchPublishedCourses]);

  // ── Real-time sync helpers (called by InstructorDashboard) ────────────────
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
          ? prev.map((c) => c._id === course._id ? course : c)
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
// src/context/CoursesContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config/apiBase";

const BASE_URL = API_BASE_URL;

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

// ─────────────────────────────────────────────────────────────────────────────
// DISPLAY STATS — the same "stable per-course fallback + real count" numbers
// shown on the course landing page (Shopify.jsx), exported here so every
// OTHER place a course card appears (Student Portal, Courses listing, Home
// page) shows the exact same rating/review/student numbers instead of the
// raw, much-smaller real counts. This is a copy of Shopify.jsx's own
// internal logic (stableCourseOffset/FALLBACK_RATING/etc.) — kept as an
// exact copy rather than having Shopify.jsx import this, so that page's
// already-working, heavily-tuned logic isn't disturbed; if the numbers here
// ever need to change, change them in both places.
// ─────────────────────────────────────────────────────────────────────────────
const DISPLAY_FALLBACK_RATING = 4.8;

function stableCourseOffset(seed, range) {
  const str = String(seed || "course");
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash % range;
}

// Takes a normalized course (i.e. already run through normalizeCourse) and
// returns { rating, reviewCount, studentCount } — the same numbers that
// course's own landing page shows, not the raw real-only counts.
export function getDisplayStats(course) {
  if (!course) return { rating: DISPLAY_FALLBACK_RATING, reviewCount: 0, studentCount: 0 };
  const courseSeed = course._id || course.id || course.title;
  const fallbackReviewCount  = 11800 + stableCourseOffset(courseSeed, 1100);
  const fallbackStudentCount = 61001 + stableCourseOffset(`${courseSeed}-students`, 999);
  const realReviewCount  = course.reviews  || 0;
  const realStudentCount = course.students || 0;
  return {
    rating:       course.rating || DISPLAY_FALLBACK_RATING,
    reviewCount:  fallbackReviewCount + realReviewCount,
    studentCount: fallbackStudentCount + realStudentCount,
  };
}

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
      // NEW: per-lecture downloadable resources (instructor-uploaded, via
      // the Course editor) — was silently dropped here before, so the
      // Resources tab in the Student Portal had nothing real to show.
      resources: Array.isArray(lec.resources) ? lec.resources : [],
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
  // NEW CHANGE AL: this used to assume an OLDER backend shape — `price` as
  // the full/original price and `discountPrice` as the sale price — and
  // flipped them into `{ price: discountPrice, originalPrice: price }`.
  // The backend no longer sends `discountPrice` at all (it now sends the
  // real charged amount directly as `price`, plus `originalPrice` as the
  // reference/strikethrough price, only when a sale is active). Because
  // `discountPrice` was always missing, `rawDiscount` silently fell back to
  // `rawPrice` every time — which made `price` come out right by accident,
  // but overwrote the real `originalPrice` from the backend with that same
  // value on EVERY course, so `originalPrice` always equalled `price` and
  // the course page could never detect a sale or show a % off. Reading the
  // two fields directly, matching what the backend actually sends now, fixes
  // both the price and the % off in one place.
  const rawPrice = Number(source.price) || 0;
  const rawOriginalPrice = source.originalPrice != null && Number(source.originalPrice) > 0
    ? Number(source.originalPrice)
    : null;
  const students    = Number(source.studentsEnrolled) || 0;

  const inst = source.instructor;
  const instructorName = inst && typeof inst === "object" ? inst.name : (inst || "Instructor");
  const instructorBio  = inst && typeof inst === "object" ? (inst.bio || "") : "";
  const instructorImg  = inst && typeof inst === "object" ? (inst.avatar || "👩‍💼") : "👩‍💼";
  const instructorTitle    = inst && typeof inst === "object" ? (inst.title || "") : "";
  const instructorLocation = inst && typeof inst === "object" ? (inst.location || "") : "";
  const instructorWebsite  = inst && typeof inst === "object" ? (inst.website || "") : "";
  const instructorTwitter  = inst && typeof inst === "object" ? (inst.twitter || "") : "";
  const instructorLinkedin = inst && typeof inst === "object" ? (inst.linkedin || "") : "";
  const instructorTotalRatings  = inst && typeof inst === "object" ? (Number(inst.totalRatings)  || 0) : 0;
  const instructorTotalReviews  = inst && typeof inst === "object" ? (Number(inst.totalReviews)  || 0) : 0;
  const instructorTotalStudents = inst && typeof inst === "object" ? (Number(inst.totalStudents) || 0) : 0;
  const instructorTotalCourses  = inst && typeof inst === "object" ? (Number(inst.totalCourses)  || 0) : 0;
  const instructorDescription   = inst && typeof inst === "object" ? (inst.instructorDescription || "") : "";
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

  // NEW: bundles — named packages set in the Instructor Dashboard's Course
  // Editor (own price, description, and a list of modules with their own
  // "original" prices). `_id` is kept as a string: it's what goes in the
  // "Enroll Now in this Bundle" link (?bundle=<_id>) and what the server
  // matches to charge the bundle's price.
  const bundles = Array.isArray(source.bundles)
    ? source.bundles
        .filter((b) => b && typeof b === "object")
        .map((b) => ({
          _id: b._id != null ? String(b._id) : undefined,
          name: b.name || "",
          description: b.description || "",
          price: Number(b.price) || 0,
          discountPercentage: Number(b.discountPercentage) || 0,
          items: Array.isArray(b.items)
            ? b.items
                .filter((it) => it && typeof it === "object")
                .map((it) => ({
                  _id: it._id != null ? String(it._id) : undefined,
                  title: it.title || "",
                  price: Number(it.price) || 0,
                  content: it.content || "",
                  imageUrl: it.imageUrl || "",
                }))
            : [],
        }))
    : [];

  // NEW: Custom Content Blocks (heading / sub heading / video or image / FAQ)
  // — free-form objects, passed through as saved.
  const customBlocks = Array.isArray(source.customBlocks)
    ? source.customBlocks.filter((b) => b && typeof b === "object")
    : [];

  const reviewsList = Array.isArray(source.reviews_list)
    ? source.reviews_list
        .filter((r) => r && typeof r === "object")
        .map((r) => ({
          _id:    r._id || r.id,
          author: r.author || r.authorName || r.user?.name || r.student?.name || "Anonymous",
          authorName: r.authorName || r.author || "",
          avatar: r.avatar || r.user?.avatar || r.student?.avatar || "",
          rating: Number(r.rating) || 5,
          text:   r.text ?? r.comment ?? r.content ?? "",
          date:   r.date || r.createdAt || null,
        }))
    : [];

  const reviewCount =
    Number(source.totalRatings) ||
    Number(source.reviews) ||
    reviewsList.length ||
    0;

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
    instructorTitle,
    instructorLocation,
    instructorWebsite,
    instructorTwitter,
    instructorLinkedin,
    instructorTotalRatings,
    instructorTotalReviews,
    instructorTotalStudents,
    instructorTotalCourses,
    instructorDescription,
    instructorRating:   instructorTotalRatings,
    instructorReviews:  instructorTotalReviews,
    instructorStudents: instructorTotalStudents,
    instructorCourses:  instructorTotalCourses,

    rating:           Number(source.rating)       || 0,
    reviews:          reviewCount,
    studentsEnrolled: students,
    students,
    price:            rawPrice,
    originalPrice:    rawOriginalPrice,
    discountPrice:    rawPrice,
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
    reviews_list: reviewsList,
    imageTestimonials,
    videoTestimonials,
    projectGallery,
    alsoBoughtCourseIds,

    // NEW: these were being dropped here, which is why a custom breadcrumb,
    // bundles and custom blocks set in the Instructor Dashboard never reached
    // the course page. `breadcrumbText` is ALWAYS present (empty string when
    // unset) so the course page can tell "this course has no custom
    // breadcrumb" apart from "this copy of the course predates the field".
    breadcrumbText:     typeof source.breadcrumbText === "string" ? source.breadcrumbText : "",
    bundles,
    customBlocks,
    editorSectionOrder: Array.isArray(source.editorSectionOrder) ? source.editorSectionOrder.map(String) : [],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// COURSE LIST — remembered between visits
// The list of published courses used to start EMPTY on every page load, so the
// Home and Courses pages sat on skeleton cards (and a "loading" course page)
// until the server answered — which can take a long time when it has to wake
// up. The last list is now kept in localStorage: the site paints from that
// immediately and refreshes it quietly in the background. If the refresh
// fails (server asleep / offline) the remembered list stays on screen instead
// of being wiped to "no courses".
// ─────────────────────────────────────────────────────────────────────────────
const LIST_CACHE_KEY = "lerni_courses_list_v2";
let listCacheRead = false;
let listCacheValue = null;

function readListCache() {
  if (listCacheRead) return listCacheValue;
  listCacheRead = true;
  try {
    const raw = localStorage.getItem(LIST_CACHE_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr) && arr.length) listCacheValue = arr;
    }
  } catch { /* unreadable cache — start empty */ }
  return listCacheValue;
}

function writeListCache(list) {
  try {
    if (!Array.isArray(list) || list.length === 0) { localStorage.removeItem(LIST_CACHE_KEY); return; }
    const json = JSON.stringify(list);
    if (json.length < 1500000) localStorage.setItem(LIST_CACHE_KEY, json);
  } catch { /* storage full/unavailable — the site just loads fresh next time */ }
}

// Called from index.js before React starts, so the request is already under
// way (and a sleeping server already waking) while the app boots. The
// provider's first load picks this promise up instead of asking again.
let earlyListRequest = null;
export function prefetchCourseList() {
  if (!earlyListRequest) earlyListRequest = API.get("/courses");
  return earlyListRequest;
}

const CoursesContext = createContext(null);

export function CoursesProvider({ children }) {
  const [courses, setCourses] = useState(() => readListCache() || []);
  const [loading, setLoading] = useState(() => !readListCache());
  const [error,   setError]   = useState(null);

  const hasDataRef = useRef(courses.length > 0);
  const coursesRef = useRef(courses);
  coursesRef.current = courses;

  const fetchPublishedCourses = useCallback(async () => {
    // With a remembered list on screen we refresh silently — no loading state.
    if (!hasDataRef.current) setLoading(true);
    setError(null);
    try {
      const request = earlyListRequest || API.get("/courses");
      earlyListRequest = null; // later refreshes must be fresh requests
      const res = await request;
      const raw = Array.isArray(res.data) ? res.data : (res.data?.courses || []);
      const list = raw.map((c, i) => normalizeCourse(c, i)).filter(Boolean);
      hasDataRef.current = list.length > 0;
      setCourses(list);
    } catch (err) {
      console.error("[CoursesContext] ❌ Fetch failed:", err.message);
      setError(err.message);
      // keep a remembered list on screen if we have one
      if (!hasDataRef.current) setCourses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPublishedCourses(); }, [fetchPublishedCourses]);

  // Keep the remembered list in step with the live one (fetches AND the
  // instructor dashboard's create/update/delete syncs below).
  const skipFirstWrite = useRef(true);
  useEffect(() => {
    if (skipFirstWrite.current) { skipFirstWrite.current = false; return undefined; }
    if (loading) return undefined;
    const t = setTimeout(() => writeListCache(courses), 400);
    return () => clearTimeout(t);
  }, [courses, loading]);

  // ─── Fetch a single course by ID with full sections data ──────────────────
  // The list endpoint strips sections (and other heavy fields), so this hits
  // /api/courses/:id which returns the full document.
  // Reads the list through a ref so this function keeps the SAME identity for
  // the life of the app — before, it was re-created whenever the list changed,
  // which made everything depending on it re-run.
  const fetchCourseById = useCallback(async (id) => {
    if (!id) return null;
    try {
      const res = await API.get(`/courses/${id}`);
      const index = coursesRef.current.findIndex((c) => c._id === id);
      return normalizeCourse(res.data, index >= 0 ? index : 0);
    } catch (err) {
      console.error("[CoursesContext] ❌ fetchCourseById failed:", err.message);
      return null;
    }
  }, []);

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

  const value = useMemo(() => ({
    courses, loading, error,
    fetchPublishedCourses,
    fetchCourseById,
    syncCreated, syncUpdated, syncDeleted,
    getCourse,
  }), [courses, loading, error, fetchPublishedCourses, fetchCourseById, syncCreated, syncUpdated, syncDeleted, getCourse]);

  return (
    <CoursesContext.Provider value={value}>
      {children}
    </CoursesContext.Provider>
  );
}

export function useCourses() {
  const ctx = useContext(CoursesContext);
  if (!ctx) throw new Error("useCourses must be inside <CoursesProvider>");
  return ctx;
} 
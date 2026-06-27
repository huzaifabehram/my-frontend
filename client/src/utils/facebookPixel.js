/**
 * Meta (Facebook) Pixel — centralized tracking utility
 * Pixel ID: 1480084257206510
 *
 * Custom Audience ideas (configure in Meta Events Manager):
 *   • FreeLecture50 AND NOT Purchase  — warm leads who watched half a free lecture
 *   • FreeLecture95 AND NOT Purchase  — high-intent viewers who nearly finished
 *   • ViewContent AND NOT Purchase    — browsed course page but did not buy
 *   • AddToCart AND NOT Purchase      — clicked Enroll but did not complete
 */

const PIXEL_ID =
  import.meta.env.VITE_META_PIXEL_ID || "1480084257206510";

const PENDING_COURSE_KEY = "meta_pixel_pending_course";
const PKR_MULTIPLIER = 280;

/** Milestone percentages → custom event names */
const FREE_LECTURE_MILESTONES = [3, 10, 20, 50, 75, 95, 100];

/** Per viewing session: `${courseId}:${lectureId}` → Set<eventName> */
const firedMilestones = new Map();

let initialized = false;

// ─── Low-level helpers ───────────────────────────────────────────────────────

function getFbq() {
  return typeof window !== "undefined" ? window.fbq : null;
}

function safeFbq(...args) {
  const fbq = getFbq();
  if (fbq) fbq(...args);
}

// ─── Initialization (once per app lifetime) ──────────────────────────────────

/**
 * Loads the Meta Pixel script and calls fbq('init', …).
 * Does NOT auto-fire PageView — MetaPixelRouteTracker handles that per route.
 */
export function initMetaPixel() {
  if (typeof window === "undefined" || initialized) return;

  if (window.fbq) {
    initialized = true;
    return;
  }

  /* eslint-disable */
  !(function (f, b, e, v, n, t, s) {
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = !0;
    n.version = "2.0";
    n.queue = [];
    t = b.createElement(e);
    t.async = !0;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
  /* eslint-enable */

  safeFbq("init", PIXEL_ID);
  initialized = true;
}

// ─── Course helpers ──────────────────────────────────────────────────────────

export function getCoursePixelPrice(course) {
  if (!course) return 0;
  const usd = Number(course.discountPrice ?? course.price) || 0;
  return Math.round(usd * PKR_MULTIPLIER);
}

export function getInstructorId(course) {
  if (!course) return "";
  if (course.instructorId) return String(course.instructorId);
  const inst = course.instructor;
  if (inst && typeof inst === "object" && inst._id) return String(inst._id);
  if (typeof inst === "string") return inst;
  return "";
}

export function buildCourseCommercePayload(course) {
  const price = getCoursePixelPrice(course);
  return {
    content_name: course?.title || "",
    content_ids:  [String(course?._id || course?.id || "")],
    value:        price,
    currency:     "PKR",
  };
}

export function buildFreeLecturePayload(course, lecture, watchPercentage = 0) {
  return {
    course_id:        String(course?._id || course?.id || ""),
    course_name:      course?.title || "",
    lecture_id:       String(lecture?.id || lecture?._id || ""),
    lecture_name:     lecture?.title || "",
    course_category:  course?.category || "",
    instructor_id:    getInstructorId(course),
    watch_percentage: watchPercentage,
  };
}

// ─── Pending course (AddToCart → Register → Purchase funnel) ─────────────────

export function setPendingCourse(course) {
  if (!course || typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(
      PENDING_COURSE_KEY,
      JSON.stringify({
        _id:           String(course._id || course.id || ""),
        id:            String(course._id || course.id || ""),
        title:         course.title || "",
        price:         course.price,
        discountPrice: course.discountPrice,
        category:      course.category || "",
        instructorId:  getInstructorId(course),
      })
    );
  } catch {
    /* quota / private mode */
  }
}

export function getPendingCourse() {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(PENDING_COURSE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearPendingCourse() {
  try {
    sessionStorage.removeItem(PENDING_COURSE_KEY);
  } catch {
    /* ignore */
  }
}

// ─── Standard Meta events ────────────────────────────────────────────────────

/** Fires on every React Router navigation (including first load). */
export function trackPageView() {
  initMetaPixel();
  safeFbq("track", "PageView");
}

/**
 * Course landing page viewed.
 * Custom Audience: ViewContent AND NOT Purchase
 */
export function trackViewContent(course) {
  if (!course?._id && !course?.id) return;
  initMetaPixel();
  safeFbq("track", "ViewContent", {
    content_type: "course",
    content_name: course.title || "",
    content_ids:  [String(course._id || course.id)],
    value:        getCoursePixelPrice(course),
    currency:     "PKR",
  });
}

/** User completed registration (not login). */
export function trackCompleteRegistration() {
  initMetaPixel();
  safeFbq("track", "CompleteRegistration");
}

/**
 * User clicked Enroll / added course to intent.
 * Custom Audience: AddToCart AND NOT Purchase
 */
export function trackAddToCart(course) {
  if (!course) return;
  initMetaPixel();
  safeFbq("track", "AddToCart", buildCourseCommercePayload(course));
}

/** User landed on checkout / registration to complete purchase. */
export function trackInitiateCheckout(course) {
  if (!course) return;
  initMetaPixel();
  safeFbq("track", "InitiateCheckout", buildCourseCommercePayload(course));
}

/** Enrollment / purchase completed successfully. */
export function trackPurchase(course) {
  if (!course) return;
  initMetaPixel();
  safeFbq("track", "Purchase", buildCourseCommercePayload(course));
}

// ─── Free lecture custom events ──────────────────────────────────────────────

export function getFreeLectureSessionKey(courseId, lectureId) {
  return `${courseId}:${lectureId}`;
}

/** Reset milestone tracking when a new lecture session begins (same page, new lecture). */
export function resetFreeLectureSession(courseId, lectureId) {
  firedMilestones.delete(getFreeLectureSessionKey(courseId, lectureId));
}

function getFiredSet(courseId, lectureId) {
  const key = getFreeLectureSessionKey(courseId, lectureId);
  if (!firedMilestones.has(key)) firedMilestones.set(key, new Set());
  return firedMilestones.get(key);
}

/**
 * Fire a custom free-lecture event once per viewing session.
 * Custom Audiences: FreeLecture50/95 AND NOT Purchase
 */
export function trackFreeLectureCustom(eventName, course, lecture, watchPercentage = 0) {
  if (!course || !lecture) return;
  const courseId  = String(course._id || course.id || "");
  const lectureId = String(lecture.id || lecture._id || "");
  if (!courseId || !lectureId) return;

  const fired = getFiredSet(courseId, lectureId);
  if (fired.has(eventName)) return;
  fired.add(eventName);

  initMetaPixel();
  safeFbq(
    "trackCustom",
    eventName,
    buildFreeLecturePayload(course, lecture, watchPercentage)
  );
}

/** Fire FreeLectureStarted once when playback begins. */
export function trackFreeLectureStarted(course, lecture) {
  trackFreeLectureCustom("FreeLectureStarted", course, lecture, 0);
}

/**
 * Poll video.currentTime / video.duration and fire milestone events once each.
 * Only works on native <video> elements (MP4, WebM, Cloudinary direct).
 */
export function processFreeLectureProgress(videoEl, course, lecture) {
  if (!videoEl || !course || !lecture) return;

  const duration = videoEl.duration;
  if (!duration || !Number.isFinite(duration) || duration <= 0) return;

  const pct = (videoEl.currentTime / duration) * 100;
  const courseId  = String(course._id || course.id || "");
  const lectureId = String(lecture.id || lecture._id || "");
  const fired = getFiredSet(courseId, lectureId);

  for (const milestone of FREE_LECTURE_MILESTONES) {
    const eventName = `FreeLecture${milestone}`;
    if (pct >= milestone && !fired.has(eventName)) {
      trackFreeLectureCustom(eventName, course, lecture, milestone);
    }
  }
}

export { PIXEL_ID, PENDING_COURSE_KEY };

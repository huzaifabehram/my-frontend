// src/utils/courseCache.js
// ─────────────────────────────────────────────────────────────────────────────
// Remembers courses that have already been opened, so opening one again — via a
// link, Back, or a browser refresh — paints immediately from that copy while the
// fresh version loads quietly in the background (stale-while-revalidate). Also
// lets a course start loading the moment someone hovers/touches its card
// (prefetch), and makes sure that if the course page then asks for the same
// course, it joins the request already in flight instead of starting another.
// ─────────────────────────────────────────────────────────────────────────────
const COURSE_CACHE_PREFIX = 'lerni_course_full_v1:';
const EXTRAS_CACHE_PREFIX = 'lerni_course_extras_v1:';
const memoryCourseCache = new Map();
const inflight = new Map();

export function readCachedCourse(id) {
  if (!id) return null;
  if (memoryCourseCache.has(id)) return memoryCourseCache.get(id);
  try {
    const raw = localStorage.getItem(COURSE_CACHE_PREFIX + id);
    if (raw) { const obj = JSON.parse(raw); memoryCourseCache.set(id, obj); return obj; }
  } catch { /* unreadable cache — behave as if there is none */ }
  return null;
}

export function writeCachedCourse(id, course) {
  if (!id || !course) return;
  memoryCourseCache.set(id, course);
  try {
    const json = JSON.stringify(course);
    if (json.length < 600000) localStorage.setItem(COURSE_CACHE_PREFIX + id, json); // skip absurdly large ones
  } catch { /* storage full/unavailable — the in-memory copy still works this session */ }
}

// `fetcher` is the app's own course loader (useCourses().fetchCourseById).
// Concurrent callers for the same course share one request.
export function loadCourseOnce(id, fetcher) {
  if (!id || typeof fetcher !== 'function') return Promise.resolve(null);
  if (inflight.has(id)) return inflight.get(id);
  const p = Promise.resolve()
    .then(() => fetcher(id))
    .then((course) => { if (course) writeCachedCourse(id, course); return course || null; })
    .catch(() => null)
    .finally(() => { inflight.delete(id); });
  inflight.set(id, p);
  return p;
}

// The newer fields read straight from the API (custom breadcrumb, bundles,
// custom blocks, section order) — cached separately, only those fields.
export function readExtrasCache(id) {
  if (!id) return null;
  try { const raw = localStorage.getItem(EXTRAS_CACHE_PREFIX + id); return raw ? JSON.parse(raw) : null; } catch { return null; }
}
export function writeExtrasCache(id, c) {
  if (!id || !c) return;
  try {
    localStorage.setItem(EXTRAS_CACHE_PREFIX + id, JSON.stringify({
      _id: c._id,
      breadcrumbText: c.breadcrumbText || '',
      bundles: c.bundles || [],
      customBlocks: c.customBlocks || [],
      editorSectionOrder: c.editorSectionOrder || [],
    }));
  } catch { /* cache is a nice-to-have */ }
}
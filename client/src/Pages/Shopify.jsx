// src/Pages/Shopify.jsx  (Course Landing Page)
// CHANGE 1: Preview Section – "Free Lectures" text color fixed to dark
// CHANGE 2: Course Content – removed play icon from Free label, text changed to "Free Lecture"
// CHANGE 3: Requirements section styled like "What You'll Learn"
// CHANGE 4: Description – rich text support + Show Less no-scroll fix
// CHANGE 5: Video cards sized to match image testimonials (200x390px), slider auto-play muted, full-screen viewer with sound
// CHANGE 6: Enroll Now buttons show "Enroll Now • PKR X • XX% OFF" format
// CHANGE 7: Video likes default to 6690 per video with individual counters
// ─── NEW CHANGE A: Sticky enroll button — premium gradient, shadow, typography, text/color rules
// ─── NEW CHANGE B: Announcement bar — seamless infinite marquee (no jump/pause)
// ─── NEW CHANGE C: Video Reviews — no play overlay, center-video autoplay, pause-on-leave
// ─── FIX 1: Instructor data — reads all fields from backend user object correctly
// ─── FIX 2: Reviews display — reads reviews_list OR reviews array as fallback
// ─── FIX 3: Review submission — auth guard, correct error handling, re-fetch after submit
// ─── FIX 4: Reviews now render reliably as Udemy-style cards regardless of backend field
//            naming, support pagination ("Show more reviews"), and a user may submit as
//            many reviews as they like (no client-side "already reviewed" gate); newly
//            submitted review is appended optimistically so it appears immediately.
// ─── FIX 5: Review text content now always shows — broadened normalizeReview to catch
//            every possible backend field, removed the typeof guard that silently dropped
//            valid reviews arrays, and added a debug-friendly console.warn for empty text.
// ─── FIX 6: Show All Reviews now routes to a dedicated Reviews Page (see
//            src/pages/ReviewsPage.jsx). Hero rating is now a clickable link into that
//            page. "Created by <Instructor>" now smooth-scrolls to the Instructor section
//            instead of navigating away. Course Content free-lecture rows are now fully
//            clickable (not just the badge). Instructor section is redesigned with a
//            large banner image and the long bio/description copy removed.
// ─── FIX 7: normalizeReview, formatNumber, and RatingDistribution are now exported so the
//            dedicated Reviews Page (src/pages/ReviewsPage.jsx) can reuse the exact same
//            review-parsing logic and distribution UI instead of duplicating it.
// ─── FIX 8: Instructor image now displays the FULL uploaded picture, uncropped, inside an
//            edge-to-edge SQUARE frame (aspect-ratio 1 / 1, object-contain, no rounding),
//            instead of the previous cropped 16:6 banner crop.
// ─── UX FIX 9: Removed ellipsis/truncation from course content titles, section titles and
//            the breadcrumb — long text now wraps naturally with consistent spacing instead
//            of being clipped. Free Lecture badge stays top-aligned regardless of how many
//            lines the title wraps to.
// ─── UX FIX 10: Header mobile menu trigger is now a real 3-line hamburger icon (was a
//            rotated chevron that looked like an arrow).
// ─── UX FIX 11: Instructor section rebuilt to a circular photo + stat-grid layout (photo
//            left / stats beside it on desktop, stacked on mobile), with the instructor's
//            bio/description now actually rendered underneath.
// ─── UX FIX 12: Reviews header now reads "★ rating • X ratings". Review cards are equal
//            height (a long review no longer stretches its card — it scrolls internally via
//            "Show more") and are laid out as an arrow-free horizontal swipe/scroll slider.
// ─── NEW CHANGE D: Course + instructor descriptions now run through richTextToHtml() —
//            real HTML from the dashboard's editor renders as-is; plain text with **bold**
//            markers and line breaks is converted into proper <strong>/<p>/<br /> so
//            formatting done in the instructor dashboard always shows correctly here.
// ─── NEW CHANGE E: Instructor section rebuilt to a cleaner, Udemy-style layout — circular
//            photo + name/title on the left, a 2x2 grid of stat cards (Total Rating /
//            Reviews / Students / Courses) lined up beside it, and the instructor's bio now
//            renders as rich text with its own "Show more/less" toggle.
// ─── NEW CHANGE F: Reviews header rating number now uses the standard body font instead of
//            the decorative serif, and a fallback rating (4.8 / 5,676 reviews) with sample
//            Urdu/Roman-Urdu reviews is shown whenever the course has no real reviews yet.
// ─── NEW CHANGE G: "Show All Reviews", both rating links (hero + free preview), and every
//            review card now open a Ratings & Reviews view INSIDE this same page (no route
//            change) — same pattern as the free-lecture preview popup — showing the overall
//            rating, distribution, and full review list.
// ─── NEW CHANGE H: Student testimonials and video reviews are now a 2-column "waterfall"
//            grid (4 items visible: 2 rows × 2 columns) that scrolls continuously downward.
//            Video tiles autoplay muted while scrolling; tapping one opens a plain native
//            video player (default browser controls, sound on) instead of a custom
//            reels-style viewer.
// ─── NEW CHANGE I: First 3 Course Content sections now expand automatically on load (still
//            freely togglable afterward, including those first three).
// ─── UX FIX 13: Instructor name column widened and its font sized so a typical two-word
//            name stays on one line instead of wrapping. Instructor "Show more" button no
//            longer sits under the description's fade-out gradient (that overlay was
//            washing its color out compared to "Show less"). Instructor location line
//            removed.
// ─── NEW CHANGE J: Ratings & Reviews overlay's sticky header now reads "{rating} Total
//            Rating · {count} Reviews" (dynamic, same data as the rest of the page) instead
//            of a static "Ratings & Reviews" label. Background page scroll is now locked
//            while the overlay is open (previously unlocked, which let the overlay's own
//            scroll area and the page behind it fight over scroll on mobile and made the
//            overlay feel like it "hung" partway down).
// ─── NEW CHANGE K: Testimonial and video-review tiles enlarged (~50% taller). Both columns
//            of the waterfall grid now share one animation duration (previously staggered)
//            and an exact per-column loop distance (previously a flat -50%, which drifted by
//            half a gap) so the two columns move in sync with no visible jump at the loop
//            boundary. Added a top/bottom edge fade (CSS mask) so the grid fades out at the
//            edges and stays sharp in the middle. Testimonial images are now clickable and
//            open in a full-size lightbox (reusing the existing, previously-unwired
//            imageSliderOpen state) without affecting the auto-scroll animation.
// ─── NEW CHANGE L: Reviews overlay header now reads "{rating} Rating • {count} Reviews" in
//            the exact same typography (size/weight/color, tabular-nums) as the clickable
//            rating line on the main course page, instead of the page-heading serif style.
// ─── NEW CHANGE M: Both waterfall columns (Testimonials + Video Reviews) are now always
//            built to the exact same length (cycling the item list if the count is odd), so
//            their loop distance is always identical and the two columns can never drift out
//            of sync, regardless of how many items are passed in. Added a real progressive
//            blur at the top/bottom edges (a masked backdrop-filter layer, tapering from full
//            blur at the boundary to none toward the center) layered with the existing
//            opacity fade, so content sharpens in the middle and blurs+fades out completely
//            at the edges instead of a hard cutoff.
// ─── NEW CHANGE N: Header nav (desktop + mobile) now includes "Home" and "Services" links
//            alongside Categories/Instructor/About, so the course page can link straight to
//            HomePage.jsx and ServicesPage.jsx.
// ─── NEW CHANGE O: Reviews/students count shown right below the free-preview thumbnail
//            (and everywhere else displayRatingCount is used on this page) now falls back
//            to a large, stable-per-course number — reviews ~11,800–12,899, students
//            61,001–62,000 — instead of the old flat FALLBACK_REVIEW_COUNT / nothing at
//            all for students. Real backend counts still win whenever a course actually
//            has them.
// ─── NEW CHANGE P: Description's "Show more/less" button is now centered on mobile and
//            left-aligned from sm: up, matching the Instructor description's button exactly
//            (same mx-auto sm:mx-0 pattern).
// ─── NEW CHANGE Q: Instructor stat cards (Total Rating / Reviews / Students / Courses) —
//            the label text no longer forces whitespace-nowrap, which was pushing it past
//            the white card's edge on narrow screens; it now wraps within the card instead,
//            with overflow-hidden on the card as a backstop.
// ─── NEW CHANGE R: Review avatars (both the horizontal review cards and the Ratings &
//            Reviews overlay) no longer show the student's uploaded photo — every review
//            now shows a plain black circle with the student's first initial in white,
//            regardless of whether an avatar URL exists.
// ─── NEW CHANGE S: Video Reviews tiles — the YouTube iframe was relying on `object-cover`,
//            which has no effect on <iframe> (object-fit only works on <img>/<video>), so
//            YouTube's own letterboxing was showing as extra empty space inside each tile.
//            Fixed by oversizing the iframe and centering+cropping it manually, matching
//            how the Student Testimonials image tiles actually fill their space.
// ─── NEW CHANGE T: The waterfall auto-scroll (both Student Testimonials and Video Reviews)
//            now pauses for as long as its lightbox/video modal is open, and resumes the
//            moment it's closed — previously it kept scrolling behind the fullscreen view.
// ─── NEW CHANGE U: Reviews/students are now ADDITIVE, not "real-or-fallback" — every
//            course shows the fallback base number (reviews ~11,800–12,899, students
//            61,001–62,000) no matter what, and any real reviews/enrollments a course
//            actually has are added on top of that base instead of replacing it. Previously
//            a course with even one real review/enrollment would show that small real
//            number instead of the big fallback one.
// ─── NEW CHANGE V: Instructor stat card labels — reverted Reviews/Students/Courses back to
//            whitespace-nowrap (that's how they already fit correctly before NEW CHANGE Q;
//            only "Total Rating" was ever overflowing). NEW CHANGE Q's blanket break-words
//            was fracturing "Students" into "Student"/"s" on two lines. Now only two-word
//            labels (just "Total Rating") are allowed to wrap.
// ─── NEW CHANGE W: Video Reviews' baseDuration now matches Student Testimonials' exactly
//            (28s, was 30s) for full parity between the two waterfall grids.
// ─── NEW CHANGE X: Removed the custom orange in-page loading spinner shown while a course
//            loads — the page now renders nothing during that moment, so only the browser's
//            own default tab/address-bar loading indicator is visible.
// ─── NEW CHANGE Y: Instructor section now reads the media gallery (photos + videos, each
//            with a heading and description) set on the Instructor Dashboard → Profile →
//            Description page, and renders it as a small grid right below the instructor's
//            description — same white-card / cream / orange-accent styling as the rest of
//            this section. Clicking a photo opens it in the existing full-size lightbox;
//            clicking a video opens it in the existing native video modal — both reused
//            as separate instances so they don't interfere with the Student Testimonials /
//            Video Reviews grids elsewhere on the page. Nothing else in the Instructor
//            section was touched.
// ─── NEW CHANGE Z: The Student Testimonials image lightbox and the Video Reviews video
//            modal (and the new Instructor photo/video modals from NEW CHANGE Y) now blur
//            everything behind them — a real backdrop blur layered under the dark overlay
//            — instead of just a flat dark scrim, so the previous content behind the
//            opened photo/video is visibly softened rather than just dimmed.
// ─── NEW CHANGE AA: Replaced NEW CHANGE Y's separate "Photos & Videos" grid with a single
//            ordered rendering of instructor.instructorDescriptionBlocks — paragraphs,
//            photos and videos now render in exactly the order the instructor arranged
//            them on the dashboard (a photo/video can sit right after any paragraph),
//            instead of all text first and all media in a grid at the end. Falls back to
//            the older flat instructorDescription + instructorMedia fields (and, if even
//            those are empty, to the instructor's short bio) for any instructor who
//            hasn't re-saved their profile since this change.
// ─── NEW CHANGE AB: The Instructor section's description now defaults to fully expanded
//            (was collapsed behind "Show more") — the whole paragraph/photo/video block
//            is visible as soon as the page loads, with "Show less" at the bottom to
//            collapse it if someone wants to.
// ─── NEW CHANGE AC: Fixed a leftover useEffect that was silently re-collapsing the
//            Instructor description every time a course loaded, overriding NEW CHANGE AB's
//            default-open state before the page ever rendered.
// ─── NEW CHANGE AD: Instructor stat cards (Total Rating / Reviews / Students / Courses) —
//            on narrower Android phones the label text no longer has any risk of fracturing
//            mid-word ("TO"/"TAL", "RA"/"TING"); it now only ever wraps at a real word space,
//            and the icon stacks above the value/label instead of beside it at the smallest
//            size, freeing up enough width for the label to render cleanly.
// ─── NEW CHANGE AE: A video block from the Instructor Dashboard can now carry more than one
//            video link (added there via "+ Add Another Video"). A block with just one link
//            still renders as the same single video card as before; a block with 2+ links
//            renders as a slider (left/right arrows + dots) under that one shared
//            heading/description. A brand new video block started from the top-level
//            "🎬 Add Video" button is always its own separate card, never merged into another
//            block's slider. The full-screen video modal still pages through every video on
//            the profile, in order, regardless of which block or slide it was opened from.
// ─── NEW CHANGE AF: Instructor video blocks with 2+ links now show every video side by side
//            (no arrows) instead of one-at-a-time, so it's obvious at a glance it's a group of
//            videos. Heading/description alignment, size and bold/italic — set per block on
//            the Instructor Dashboard — now render here exactly as chosen.
// ─── NEW CHANGE AG: Announcement bar no longer has the 🎉 emoji, and its "Save X%" now reads
//            the same real price/originalPrice the rest of the page uses (was reading the
//            unused `discountPrice` field, so it never matched an instructor's actual sale).
// ─── NEW CHANGE AH: Footer rebuilt — logo now comes from Super Admin → Settings (Cloudinary),
//            falling back to the original "Lerni" text wordmark when none is set; added the
//            Motiviam Pvt Ltd address/phone/email; replaced the old 6-column link grid with a
//            3-tab FAQ-style accordion (About / Policies / Contact Us, chevron flips open↔closed);
//            added a newsletter box outside the tabs that posts to the backend.
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronDown, Play, Star, Users, Clock, BookOpen, Menu, X, Search, Check, Award, Smartphone, Film, Download, Globe, Shield, ChevronLeft, ChevronRight, MessageCircle, Volume2, VolumeX, ArrowLeft } from 'lucide-react';
import { useCourses } from '../context/CoursesContext';
import { useAuth } from '../context/AuthContext';
import {
  trackViewContent,
  trackAddToCart,
  setPendingCourse,
} from '../utils/facebookPixel';
import FreeLectureVideoTracker, { FreeLectureIframeTracker } from '../components/FreeLectureVideoTracker';

// ─────────────────────────────────────────────────────────────────────────────
// REVIEW NORMALIZATION — broadened to catch every possible backend shape
// Exported (FIX 7) so ReviewsPage.jsx can reuse identical parsing logic.
// ─────────────────────────────────────────────────────────────────────────────
export function normalizeReview(raw, idx) {
  // Accept anything that is a non-null object
  if (!raw || typeof raw !== 'object') return null;

  // ── Author: try every known field name ──────────────────────────────────
  const author =
    raw.authorName ||
    raw.author ||
    raw.userName ||
    raw.username ||
    raw.studentName ||
    raw.name ||
    raw.fullName ||
    raw.full_name ||
    raw.displayName ||
    raw.display_name ||
    raw.user?.name ||
    raw.user?.username ||
    raw.user?.fullName ||
    raw.student?.name ||
    'Student';

  // ── Review text: try every known field name ──────────────────────────────
  const text =
    raw.text      != null ? String(raw.text)      :
    raw.comment   != null ? String(raw.comment)   :
    raw.content   != null ? String(raw.content)   :
    raw.message   != null ? String(raw.message)   :
    raw.body      != null ? String(raw.body)       :
    raw.review    != null ? String(raw.review)     :
    raw.feedback  != null ? String(raw.feedback)   :
    raw.description != null ? String(raw.description) :
    raw.reviewText != null ? String(raw.reviewText) :
    raw.review_text != null ? String(raw.review_text) :
    raw.commentText != null ? String(raw.commentText) :
    raw.details   != null ? String(raw.details)   :
    raw.note      != null ? String(raw.note)       :
    raw.notes     != null ? String(raw.notes)      :
    '';

  if (!text && process.env.NODE_ENV === 'development') {
    console.warn('[normalizeReview] Could not find review text in object. Keys available:', Object.keys(raw));
  }

  // ── Rating ───────────────────────────────────────────────────────────────
  const rating = Number(
    raw.rating ?? raw.stars ?? raw.score ?? raw.value ?? raw.ratingValue ?? 5
  ) || 5;

  // ── Date ─────────────────────────────────────────────────────────────────
  const dateRaw = raw.date || raw.createdAt || raw.created_at || raw.timestamp || raw.postedAt || raw.posted_at || null;
  let date = null;
  if (dateRaw) {
    const d = new Date(dateRaw);
    date = isNaN(d.getTime()) ? String(dateRaw) : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  // ── Avatar ───────────────────────────────────────────────────────────────
  const avatar =
    raw.avatar ||
    raw.profileImage ||
    raw.profile_image ||
    raw.userImage ||
    raw.user_image ||
    raw.photo ||
    raw.picture ||
    raw.user?.avatar ||
    raw.user?.profileImage ||
    null;

  // ── Stable key ───────────────────────────────────────────────────────────
  const textSnippet = text.slice(0, 30).replace(/\s+/g, '-');
  const tsSnippet   = dateRaw ? String(dateRaw).slice(0, 24) : String(idx);
  const key = raw._id || raw.id || raw.reviewId || raw.review_id
    || `review-${author}-${textSnippet}-${tsSnippet}`;

  return { key, author, text, rating, date, avatar, userId: raw.userId || raw.user_id || raw.user?._id || null };
}

export function formatNumber(num) {
  if (!num) return '0';
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
  if (num >= 1_000)     return (num / 1_000).toFixed(1) + 'K';
  return String(num);
}

// ─────────────────────────────────────────────────────────────────────────────
// STABLE PER-COURSE SOCIAL-PROOF NUMBERS — used only as a fallback when a
// course has no real review/student data yet (same purpose as
// FALLBACK_RATING/FALLBACK_REVIEW_COUNT below, just per-course instead of one
// flat number for every course). The same course always gets the same number
// on every load (deterministic hash of its id), but different courses land
// on different numbers within the requested range.
// ─────────────────────────────────────────────────────────────────────────────
function stableCourseOffset(seed, range) {
  const str = String(seed || 'course');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash % range;
}

// ─────────────────────────────────────────────────────────────────────────────
// RATING DISTRIBUTION — animated 5→1 star progress bars (used on ReviewsPage)
// Exported (FIX 7) so ReviewsPage.jsx can render the exact same distribution UI.
// ─────────────────────────────────────────────────────────────────────────────
export function RatingDistribution({ distribution }) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="space-y-3" role="list" aria-label="Rating distribution">
      {distribution.map(({ star, count, percentage }) => (
        <div key={star} role="listitem" className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-sm font-semibold text-[#1a1208] w-10 flex-shrink-0">
            {star}
            <Star size={13} className="text-[#f9c97a]" fill="currentColor" />
          </span>
          <div className="flex-1 h-2.5 md:h-3 rounded-full bg-[#f0ebe3] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#f9c97a] transition-all duration-1000 ease-out"
              style={{ width: animated ? `${percentage}%` : '0%' }}
              aria-hidden="true"
            />
          </div>
          <span className="text-sm text-[#9e9789] w-20 text-right flex-shrink-0">
            {percentage}% ({count})
          </span>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RICH TEXT RENDERING — course/instructor descriptions are written with a rich
// text editor in the instructor dashboard. If the saved content already
// contains real HTML tags (from a WYSIWYG editor) it is trusted and rendered
// as-is via .lerni-prose. If it's plain text (e.g. **bold** markers and plain
// line breaks), the same formatting is converted into real HTML so bold text
// and paragraph/line spacing always show correctly here — regardless of how
// the dashboard happened to save it.
// ─────────────────────────────────────────────────────────────────────────────
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function richTextToHtml(raw) {
  if (!raw) return '';
  const text = String(raw);

  // Already real HTML (from a WYSIWYG editor) — trust it as-is.
  if (/<\/?(p|div|br|ul|ol|li|h[1-6]|strong|b|em|i|u|blockquote|a|span)[\s>]/i.test(text)) {
    return text;
  }

  // Plain text: escape it, then re-introduce the formatting.
  let html = escapeHtml(text.trim());

  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.+?)_/g, '<em>$1</em>');

  html = html
    .split(/\n{2,}/)
    .map((block) => `<p>${block.replace(/\n/g, '<br />')}</p>`)
    .join('');

  return html;
}

// ─────────────────────────────────────────────────────────────────────────────
// INSTRUCTOR DESCRIPTION — LEGACY MIGRATION
// Older accounts (or a course whose instructor hasn't re-saved their profile
// since this update) only have the previous flat `instructorDescription`
// string plus a separate `instructorMedia` array, instead of one ordered
// `instructorDescriptionBlocks` list. This turns the old shape into the new
// one on the fly (text first, then each media item) so nothing disappears
// for instructors who haven't touched their profile yet.
// ─────────────────────────────────────────────────────────────────────────────
function buildLegacyDescriptionBlocks(text, media) {
  const blocks = [];
  if (text) blocks.push({ type: 'text', text });
  (Array.isArray(media) ? media : []).forEach((m) => {
    blocks.push({
      type: m.type === 'video' ? 'video' : 'image',
      heading: m.heading || '',
      description: m.description || '',
      videoUrl: m.videoUrl || '',
      imageUrl: m.imageUrl || '',
    });
  });
  return blocks;
}

// A video block may carry several links (`videoUrls`, added via "+ Add
// Another Video" on the dashboard) or just the older single `videoUrl`
// string — this always returns a plain array of non-empty URLs regardless
// of which shape the block was saved with.
function getBlockVideoUrls(b) {
  if (Array.isArray(b.videoUrls)) return b.videoUrls.filter(Boolean);
  return b.videoUrl ? [b.videoUrl] : [];
}

// Heading/description alignment + size + style set per block on the
// Instructor Dashboard — translated into Tailwind classes here so the course
// page renders exactly what was chosen.
const BLOCK_TEXT_ALIGN_CLASS = { left: 'text-left', center: 'text-center', right: 'text-right' };
const BLOCK_HEADING_SIZE_CLASS = { sm: 'text-xs md:text-sm', base: 'text-sm md:text-base', lg: 'text-base md:text-lg', xl: 'text-lg md:text-xl' };
const BLOCK_DESC_SIZE_CLASS = { sm: 'text-[11px] md:text-xs', base: 'text-xs md:text-sm', lg: 'text-sm md:text-base', xl: 'text-base md:text-lg' };
function blockTextClass(block, kind) {
  const align = BLOCK_TEXT_ALIGN_CLASS[block.textAlign] || BLOCK_TEXT_ALIGN_CLASS.left;
  const size = (kind === 'heading' ? BLOCK_HEADING_SIZE_CLASS : BLOCK_DESC_SIZE_CLASS)[block.textSize] || (kind === 'heading' ? BLOCK_HEADING_SIZE_CLASS.base : BLOCK_DESC_SIZE_CLASS.base);
  const weight = kind === 'heading' ? (block.textBold === false ? 'font-normal' : 'font-bold') : (block.textBold ? 'font-bold' : '');
  const italic = block.textItalic ? 'italic' : '';
  return [align, size, weight, italic].filter(Boolean).join(' ');
}

// ─────────────────────────────────────────────────────────────────────────────
// FALLBACK REVIEW DATA — shown only when the course has no real reviews yet.
// Real fetched/submitted reviews always take priority; this is placeholder
// content for this digital marketing & e-commerce course so the page never
// looks empty while real reviews are still coming in.
// ─────────────────────────────────────────────────────────────────────────────
const FALLBACK_RATING = 4.8;
const FALLBACK_REVIEW_COUNT = 5676;
const FALLBACK_RATING_DISTRIBUTION = [
  { star: 5, count: 4427, percentage: 78 },
  { star: 4, count: 851,  percentage: 15 },
  { star: 3, count: 227,  percentage: 4 },
  { star: 2, count: 114,  percentage: 2 },
  { star: 1, count: 57,   percentage: 1 },
];
const FALLBACK_REVIEWS = [
  { key: 'fb-1', author: 'Ayesha Siddiqui', rating: 5, date: 'Aug 12, 2026', avatar: null,
    text: "Yeh course mera business dekhne ka tareeqa hi badal gaya. Facebook Ads aur Shopify wali videos bohat practical thi. Highly recommended for beginners!" },
  { key: 'fb-2', author: 'Muhammad Bilal', rating: 4, date: 'Aug 3, 2026', avatar: null,
    text: "Content is solid, especially the e-commerce dropshipping module. Kuch sections thori lambi lagti hain lekin overall bohat value hai." },
  { key: 'fb-3', author: 'Zainab Fatima', rating: 5, date: 'Jul 27, 2026', avatar: null,
    text: "Sir ne har concept itni acchi tarhan explain kiya keh mujhe apna Instagram store shuru karne ka confidence mil gaya. Best marketing course in Urdu!" },
  { key: 'fb-4', author: 'Usman Tariq', rating: 5, date: 'Jul 19, 2026', avatar: null,
    text: "I run a small clothing brand and this course helped me set up my first proper ad campaign. Roman Urdu explanation makes everything very easy to follow." },
  { key: 'fb-5', author: 'Hina Rafiq', rating: 4, date: 'Jul 10, 2026', avatar: null,
    text: "SEO wala section thora aur detailed ho sakta tha, but overall the course is amazing for e-commerce beginners." },
  { key: 'fb-6', author: 'Ahmed Raza', rating: 5, date: 'Jun 30, 2026', avatar: null,
    text: "Bohat zabardast course hai! Google Ads aur email marketing dono clearly samajh aa gaye. Worth every rupee." },
  { key: 'fb-7', author: 'Sana Malik', rating: 5, date: 'Jun 22, 2026', avatar: null,
    text: "Great mix of theory and hands-on practice. Mujhe apni Daraz store ki sales double karne mein madad mili." },
  { key: 'fb-8', author: 'Fahad Iqbal', rating: 4, date: 'Jun 15, 2026', avatar: null,
    text: "Acha course hai, beginners ke liye perfect starting point digital marketing seekhne ka." },
];

function computeRatingDistribution(reviews) {
  const total = reviews.length || 1;
  return [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => Math.round(r.rating) === star).length;
    return { star, count, percentage: Math.round((count / total) * 100) };
  });
}

// ── YouTube embed helper ───────────────────────────────────────────────────
function getYouTubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/watch\?v=|\/shorts\/))([^&?/\s]{11})/);
  return m ? m[1] : null;
}

function isBunnyUrl(url) {
  return url && (
    url.includes('bunny.net') ||
    url.includes('vod-cdn.bunny.net') ||
    url.includes('iframe.mediadelivery.net') ||
    url.includes('player.mediadelivery.net') ||
    url.includes('video.bunnycdn.com') ||
    url.includes('b-cdn.net')
  );
}

function isDirectVideo(url) {
  if (!url) return false;
  const path = url.split("?")[0].split("#")[0].toLowerCase();
  return path.endsWith(".mp4") || path.endsWith(".webm") || path.endsWith(".mov");
}

function isCloudinaryVideo(url) {
  return url && /res\.cloudinary\.com\/.+\/(video|raw)\//i.test(url);
}

function getBunnyEmbedUrl(url) {
  if (!url) return null;
  if (url.includes('iframe.mediadelivery.net/embed/')) return url;
  if (url.includes('iframe.mediadelivery.net/play/')) return url.replace('/play/', '/embed/');
  const playerMatch = url.match(/player\.mediadelivery\.net\/play\/(\d+)\/([a-zA-Z0-9-]+)/);
  if (playerMatch) return `https://iframe.mediadelivery.net/embed/${playerMatch[1]}/${playerMatch[2]}?autoplay=false&loop=false&muted=false&preload=true`;
  const bunnyPlay = url.match(/video\.bunnycdn\.com\/play\/(\d+)\/([a-zA-Z0-9-]+)/);
  if (bunnyPlay) return `https://iframe.mediadelivery.net/embed/${bunnyPlay[1]}/${bunnyPlay[2]}?autoplay=false&loop=false&muted=false&preload=true`;
  const guidMatch = url.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
  const libMatch  = url.match(/\/(\d+)\//);
  if (guidMatch && libMatch) return `https://iframe.mediadelivery.net/embed/${libMatch[1]}/${guidMatch[1]}?autoplay=false&loop=false&muted=false&preload=true`;
  return null;
}

function BunnyPlayer({ url, className = "", autoPlay = false, muted = false, controls = true }) {
  const embedUrl = getBunnyEmbedUrl(url);
  if (embedUrl) {
    const finalUrl = autoPlay ? `${embedUrl.includes('?') ? embedUrl + '&' : embedUrl + '?'}autoplay=true&muted=${muted}` : embedUrl;
    return (
      <div className={`relative w-full aspect-video bg-black ${className}`}>
        <iframe src={finalUrl} className="absolute inset-0 w-full h-full"
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
          allowFullScreen title="Bunny Stream Video" loading="lazy" style={{ border: 'none' }} />
      </div>
    );
  }
  return <video src={url} className={`w-full aspect-video bg-black ${className}`} controls={controls} autoPlay={autoPlay} muted={muted} preload="metadata" />;
}

function VideoPlayer({ url, className = "", isReelsStyle = false, autoPlay = false, muted = false, loop = false, controls = true, videoRef = null }) {
  if (!url) return null;
  const ytId = getYouTubeId(url);
  const aspectClass = isReelsStyle ? "h-full w-full" : "aspect-video";
  if (ytId) {
    const ytSrc = `https://www.youtube.com/embed/${ytId}?autoplay=${autoPlay ? 1 : 0}&mute=${muted ? 1 : 0}&loop=${loop ? 1 : 0}&controls=${controls ? 1 : 0}&playsinline=1`;
    return (
      <div className={`relative w-full ${aspectClass} bg-black ${className}`}>
        <iframe src={ytSrc} className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen title="YouTube Video" loading="lazy" style={{ border: 'none' }} />
      </div>
    );
  }
  if (isBunnyUrl(url)) return <BunnyPlayer url={url} className={`${aspectClass} ${className}`} autoPlay={autoPlay} muted={muted} controls={controls} />;
  if (isDirectVideo(url) || isCloudinaryVideo(url)) {
    return (
      <video ref={videoRef} src={url}
        className={`w-full ${aspectClass} bg-black object-cover ${className}`}
        controls={controls} autoPlay={autoPlay} muted={muted} loop={loop} playsInline preload="metadata" />
    );
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// TWO-COLUMN "WATERFALL" GRID — shared by Student Testimonials and Video
// Reviews. Always renders exactly 2 columns; each column loops its items in a
// continuous, seamless downward scroll. The viewport is fixed to exactly 2
// item-heights tall, so 4 items (2 columns × 2 rows) are visible at once.
// Both columns are built to the SAME length (cycling through the item list if
// needed) so their loop distance is always identical — with the same duration
// this guarantees the two columns move at exactly the same speed and never
// drift apart, however many items are passed in.
// ─────────────────────────────────────────────────────────────────────────────
function TwoColumnWaterfall({ items, itemHeight = 260, gap = 12, renderItem, baseDuration = 26, isPaused = false }) {
  const columns = useMemo(() => {
    if (items.length === 0) return [[], []];
    const colLen = Math.ceil(items.length / 2);
    const colA = [];
    const colB = [];
    for (let i = 0; i < colLen; i++) {
      colA.push({ item: items[i % items.length], originalIndex: i % items.length });
      colB.push({ item: items[(i + colLen) % items.length], originalIndex: (i + colLen) % items.length });
    }
    return [colA, colB];
  }, [items]);

  const viewportHeight = itemHeight * 2 + gap;
  // Height of the progressive blur/fade cap at each edge — content sharpens as
  // it clears this band and blurs+fades as it enters it, disappearing exactly
  // at the boundary.
  const capHeight = Math.round(viewportHeight * 0.24);

  return (
    <div className="relative">
      <style>{`
        @keyframes waterfall-scroll-down {
          0%   { transform: translateY(calc(-1 * var(--scroll-distance, 50%))); }
          100% { transform: translateY(0%); }
        }
      `}</style>
      <div
        className="relative grid grid-cols-2 gap-3 overflow-hidden rounded-2xl"
        style={{
          height: `${viewportHeight}px`,
          // Fades the top/bottom edges of the scrolling grid to fully transparent
          // (so content truly disappears at the boundary, not just blurs) while
          // the middle stays fully opaque/sharp. Combined with the two blur caps
          // below for a soft, gradual transition rather than a harsh cutoff.
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)',
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)',
        }}
      >
        {columns.map((colEntries, colIdx) => {
          if (colEntries.length === 0) return null;
          const looped = [...colEntries, ...colEntries];
          // Same duration AND same per-column scroll distance (both columns are
          // built to equal length above) — the two columns move at exactly the
          // same speed, start together, and loop together with no drift. The
          // scroll distance is the exact pixel height of one (un-doubled) copy
          // of the column, so the loop restarts on an exact boundary instead of
          // a flat -50% that can drift by half a gap and cause a visible jump.
          const oneCopyHeight = colEntries.length * itemHeight + Math.max(0, colEntries.length - 1) * gap;
          return (
            <div key={colIdx} className="relative h-full overflow-hidden">
              <div
                className="flex flex-col"
                style={{
                  gap: `${gap}px`,
                  animation: `waterfall-scroll-down ${baseDuration}s linear infinite`,
                  animationPlayState: isPaused ? 'paused' : 'running',
                  '--scroll-distance': `${oneCopyHeight}px`,
                  willChange: 'transform',
                }}
              >
                {looped.map((entry, i) => (
                  <div
                    key={i}
                    style={{ height: `${itemHeight}px`, flexShrink: 0 }}
                    aria-hidden={i >= colEntries.length}
                  >
                    {renderItem(entry.item, entry.originalIndex)}
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* PROGRESSIVE BLUR CAPS — a real blur (not just opacity) that fades in as
            content approaches each edge and fades back out toward the center, so
            content genuinely transitions sharp → blurred → gone, not a hard cut.
            Implemented as a backdrop-blur layer whose own alpha is masked by a
            gradient, so the blur strength itself tapers smoothly with distance
            from the edge instead of applying uniformly. Sits above the columns
            but is pointer-events-none so clicks still reach the tiles underneath. */}
        <div
          className="absolute top-0 left-0 right-0 pointer-events-none"
          style={{
            height: `${capHeight}px`,
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)',
            maskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)',
          }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 pointer-events-none"
          style={{
            height: `${capHeight}px`,
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            WebkitMaskImage: 'linear-gradient(to top, black 0%, transparent 100%)',
            maskImage: 'linear-gradient(to top, black 0%, transparent 100%)',
          }}
        />
      </div>
    </div>
  );
}

function VideoReviewsSlider({ videoTestimonials, onCardClick, isPaused }) {
  return (
    <TwoColumnWaterfall
      items={videoTestimonials}
      itemHeight={390}
      gap={12}
      baseDuration={28}
      isPaused={isPaused}
      renderItem={(testimonial, originalIndex) => {
        const ytId = getYouTubeId(testimonial.videoUrl);
        return (
          <div
            role="button"
            tabIndex={0}
            onClick={() => onCardClick(originalIndex)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onCardClick(originalIndex); } }}
            className="w-full h-full rounded-xl overflow-hidden relative shadow-lg cursor-pointer group"
          >
            {ytId ? (
              // `object-cover` has no effect on <iframe> — CSS object-fit only
              // applies to replaced elements like <img>/<video>. Without this,
              // YouTube's own player letterboxes the video to fit the iframe's
              // box, which reads as extra empty space at the edges of the
              // tile (this was the "extra spacing at the bottom" bug). Fix:
              // oversize the iframe and center+crop it manually, the same
              // effect object-fit:cover would have given a real video element.
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <iframe
                  src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}&controls=0&playsinline=1`}
                  className="absolute top-1/2 left-1/2"
                  style={{ border: 'none', width: '300%', height: '300%', transform: 'translate(-50%, -50%)' }}
                  allow="autoplay; encrypted-media"
                  title="Video testimonial"
                />
              </div>
            ) : (
              <video
                src={testimonial.videoUrl}
                className="w-full h-full object-cover"
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
              />
            )}
            <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center pointer-events-none">
              <VolumeX size={14} className="text-white" />
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-14 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
          </div>
        );
      }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT VIDEO MODAL — the "mobile default" video placement: a plain native
// <video>/embed with the browser's own controls and sound on, the way tapping
// a video normally opens on any website. No custom like/comment/share chrome.
// ─────────────────────────────────────────────────────────────────────────────
function DefaultVideoModal({ isOpen, onClose, videos, startIndex = 0 }) {
  const [currentIndex, setCurrentIndex] = useState(startIndex);

  useEffect(() => {
    if (isOpen) { document.body.style.overflow = 'hidden'; setCurrentIndex(startIndex); }
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen, startIndex]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && currentIndex < videos.length - 1) setCurrentIndex(i => i + 1);
      if (e.key === 'ArrowLeft' && currentIndex > 0) setCurrentIndex(i => i - 1);
    };
    if (isOpen) window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose, currentIndex, videos.length]);

  if (!isOpen) return null;

  const currentVideo = videos[currentIndex];
  const ytId = currentVideo ? getYouTubeId(currentVideo.videoUrl) : null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xl z-[9999] flex items-center justify-center p-4">
      <button onClick={onClose} aria-label="Close video"
        className="fixed top-4 right-4 z-50 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition border-none cursor-pointer">
        <X size={22} />
      </button>

      {currentIndex > 0 && (
        <button onClick={() => setCurrentIndex(i => i - 1)} aria-label="Previous video"
          className="fixed left-2 md:left-6 top-1/2 -translate-y-1/2 z-50 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition border-none cursor-pointer">
          <ChevronLeft size={24} />
        </button>
      )}
      {currentIndex < videos.length - 1 && (
        <button onClick={() => setCurrentIndex(i => i + 1)} aria-label="Next video"
          className="fixed right-2 md:right-6 top-1/2 -translate-y-1/2 z-50 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition border-none cursor-pointer">
          <ChevronRight size={24} />
        </button>
      )}

      <div className="w-full max-w-3xl">
        {ytId ? (
          <div className="w-full aspect-video bg-black">
            <iframe
              src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=0&controls=1&playsinline=1`}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen title="Video" style={{ border: 'none' }} />
          </div>
        ) : (
          <video
            key={currentVideo?.videoUrl}
            src={currentVideo?.videoUrl}
            className="w-full max-h-[85vh] bg-black"
            controls
            autoPlay
            playsInline
          />
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// INSTRUCTOR VIDEO BLOCK — one video link renders as a single clickable card,
// exactly as before. A block with 2+ links (added via "+ Add Another Video"
// on the Instructor Dashboard) renders every video side by side in a small
// grid instead of one-at-a-time — so it's obvious at a glance that there's
// more than one video, with no arrows to click through. Each thumbnail opens
// the full-screen DefaultVideoModal at its own exact position in the
// profile's video list, via clickIndexes[i].
// ─────────────────────────────────────────────────────────────────────────────
function InstructorVideoBlock({ urls, clickIndexes, heading, onOpen }) {
  if (urls.length === 1) {
    const ytId = getYouTubeId(urls[0]);
    return (
      <button
        onClick={() => onOpen(clickIndexes[0])}
        className="relative block w-full aspect-video rounded-xl overflow-hidden border border-[#ece6dd] shadow-sm hover:shadow-md transition cursor-pointer bg-[#2d2416] p-0"
      >
        {ytId && (
          <img src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`} alt={heading || 'Video'} className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#e8540a] flex items-center justify-center shadow-lg">
            <Play size={16} className="text-white ml-0.5" fill="currentColor" />
          </div>
        </div>
      </button>
    );
  }

  // NEW CHANGE AJ: was a static grid-cols-2 (both videos small, side by side,
  // no motion). Facebook-style slider instead — bigger cards in a horizontally
  // scrollable, snap-to-card row. With exactly 2 videos both are still fully
  // visible (each ~46% of the row width), just larger than before; with 3+
  // videos, both/all are reachable by sliding the row rather than shrinking
  // every card to fit.
  return (
    <div className="relative -mx-1 px-1">
      <div className="fb-video-slider flex gap-3 md:gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-1">
        {urls.map((url, i) => {
          const ytId = getYouTubeId(url);
          return (
            <button
              key={i}
              onClick={() => onOpen(clickIndexes[i])}
              className="relative flex-shrink-0 snap-center block w-[78%] sm:w-[60%] md:w-[47%] aspect-video rounded-xl overflow-hidden border border-[#ece6dd] shadow-sm hover:shadow-md transition cursor-pointer bg-[#2d2416] p-0"
            >
              {ytId && (
                <img src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`} alt={heading || 'Video'} className="absolute inset-0 w-full h-full object-cover" />
              )}
              <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#e8540a] flex items-center justify-center shadow-lg">
                  <Play size={20} className="text-white ml-0.5" fill="currentColor" />
                </div>
              </div>
            </button>
          );
        })}
      </div>
      <style>{`
        .fb-video-slider::-webkit-scrollbar { display: none; }
        .fb-video-slider { scrollbar-width: none; -ms-overflow-style: none; }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT TESTIMONIALS — same 2-column waterfall grid, downward-scrolling.
// ─────────────────────────────────────────────────────────────────────────────
function AutoSlideImageTestimonials({ imageTestimonials, onImageClick, isPaused }) {
  return (
    <TwoColumnWaterfall
      items={imageTestimonials}
      itemHeight={390}
      gap={12}
      baseDuration={28}
      isPaused={isPaused}
      renderItem={(testimonial, originalIndex) => (
        <div
          role="button"
          tabIndex={0}
          onClick={() => onImageClick?.(originalIndex)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onImageClick?.(originalIndex); } }}
          className="w-full h-full rounded-xl overflow-hidden relative shadow-lg cursor-pointer"
        >
          <img
            src={testimonial.imageUrl}
            alt={testimonial.author || 'Student testimonial'}
            className="w-full h-full object-cover"
            draggable={false}
          />
          <div className="absolute bottom-0 left-0 right-0 h-14 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />
          {testimonial.author && (
            <p className="absolute bottom-2 left-2 right-2 text-white text-xs sm:text-sm font-semibold drop-shadow line-clamp-1">
              {testimonial.author}
            </p>
          )}
        </div>
      )}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// IMAGE LIGHTBOX — clicking a Student Testimonial image opens it here at full
// size, mirroring DefaultVideoModal's plain full-screen pattern (close button,
// prev/next arrows, Escape to close, background scroll locked while open).
// ─────────────────────────────────────────────────────────────────────────────
function ImageLightbox({ isOpen, onClose, images, startIndex = 0 }) {
  const [currentIndex, setCurrentIndex] = useState(startIndex);

  useEffect(() => {
    if (isOpen) { document.body.style.overflow = 'hidden'; setCurrentIndex(startIndex); }
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen, startIndex]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && currentIndex < images.length - 1) setCurrentIndex(i => i + 1);
      if (e.key === 'ArrowLeft' && currentIndex > 0) setCurrentIndex(i => i - 1);
    };
    if (isOpen) window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose, currentIndex, images.length]);

  if (!isOpen) return null;

  const current = images[currentIndex];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xl z-[9999] flex items-center justify-center p-4">
      <button onClick={onClose} aria-label="Close image"
        className="fixed top-4 right-4 z-50 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition border-none cursor-pointer">
        <X size={22} />
      </button>

      {currentIndex > 0 && (
        <button onClick={() => setCurrentIndex(i => i - 1)} aria-label="Previous image"
          className="fixed left-2 md:left-6 top-1/2 -translate-y-1/2 z-50 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition border-none cursor-pointer">
          <ChevronLeft size={24} />
        </button>
      )}
      {currentIndex < images.length - 1 && (
        <button onClick={() => setCurrentIndex(i => i + 1)} aria-label="Next image"
          className="fixed right-2 md:right-6 top-1/2 -translate-y-1/2 z-50 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition border-none cursor-pointer">
          <ChevronRight size={24} />
        </button>
      )}

      <div className="w-full max-w-3xl flex flex-col items-center">
        <img
          key={current?.imageUrl}
          src={current?.imageUrl}
          alt={current?.author || 'Student testimonial'}
          className="w-full max-h-[80vh] object-contain rounded-lg"
        />
        {current?.author && (
          <p className="text-white/90 text-sm md:text-base font-semibold mt-4">{current.author}</p>
        )}
      </div>
    </div>
  );
}

// ── Course thumbnail with fallback ────────────────────────────────────────
function CourseThumbnail({ course }) {
  const [imgErr, setImgErr] = useState(false);
  const ytId = getYouTubeId(course.previewVideoUrl);
  const thumbnailContent = (
    <div className="absolute inset-0 bg-black bg-opacity-30 group-hover:bg-opacity-40 transition flex flex-col items-center justify-center gap-3">
      <div className="w-16 h-16 rounded-full bg-[#e8540a] hover:bg-[#c94708] flex items-center justify-center shadow-2xl transition transform group-hover:scale-110">
        <Play size={24} className="text-white ml-1" fill="currentColor" />
      </div>
      <div className="bg-white bg-opacity-90 px-4 py-2 rounded-full inline-block">
        <p className="text-[#1a1208] font-semibold text-base whitespace-nowrap">Free Lectures</p>
      </div>
    </div>
  );
  if (ytId) return (
    <div className="relative w-full h-full bg-[#2d2416] flex items-center justify-center group">
      <img src={`https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`} alt={course.title} className="w-full h-full object-cover" />
      {thumbnailContent}
    </div>
  );
  if (course.thumbnail && !imgErr) return (
    <div className="relative w-full h-full bg-[#2d2416] flex items-center justify-center group">
      <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" onError={() => setImgErr(true)} />
      {thumbnailContent}
    </div>
  );
  return (
    <div className="relative w-full h-full bg-[#2d2416] flex items-center justify-center group">
      <span className="text-8xl">{course.emoji || '📚'}</span>
      {thumbnailContent}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SINGLE REVIEW CARD — fixed height so every visible card lines up. Longer
// reviews never stretch the card: the text is clamped, and "Show more" reveals
// the rest inside an internal scroll area instead of growing the card itself.
// ─────────────────────────────────────────────────────────────────────────────
function ReviewCard({ review, onOpenReviews }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = review.text && review.text.length > 140;

  return (
    <div
      className="flex-shrink-0 w-[280px] sm:w-[320px] h-[300px] bg-white rounded-2xl shadow-sm hover:shadow-md transition border border-[#ece6dd] p-5 flex flex-col cursor-pointer"
      style={{ scrollSnapAlign: 'start' }}
      onClick={onOpenReviews}
      role={onOpenReviews ? 'button' : undefined}
      tabIndex={onOpenReviews ? 0 : undefined}
    >
      <div className="flex items-start gap-3 mb-3 flex-shrink-0">
        <div
          className="w-11 h-11 rounded-full bg-black text-white flex items-center justify-center font-bold text-lg flex-shrink-0 overflow-hidden"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {review.author.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-[#1a1208] text-sm leading-snug break-words">{review.author}</p>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={12}
                  className="text-[#f9c97a]"
                  fill={i < Math.round(review.rating) ? 'currentColor' : 'none'}
                />
              ))}
            </div>
            {review.date && <span className="text-xs text-[#9e9789]">{review.date}</span>}
          </div>
        </div>
      </div>

      <div className={`flex-1 min-h-0 ${expanded ? 'overflow-y-auto pr-1' : 'overflow-hidden'}`}>
        {review.text ? (
          <p className={`text-[#3d3020] text-sm leading-relaxed break-words ${expanded ? '' : 'line-clamp-5'}`}>
            {review.text}
          </p>
        ) : (
          <p className="text-[#b0a898] text-sm italic">No written feedback provided.</p>
        )}
      </div>

      {isLong && (
        <button
          onClick={(e) => { e.stopPropagation(); setExpanded((x) => !x); }}
          className="text-[#e8540a] hover:text-[#c94708] font-semibold text-xs mt-2 flex-shrink-0 bg-transparent border-none cursor-pointer p-0 self-start"
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TEXT REVIEWS SLIDER — horizontal swipe/scroll carousel, no arrow controls.
// Cards are equal height (see ReviewCard). Scrollbar hidden via .reviews-scroll.
// Clicking any card opens the full Ratings & Reviews view inside this page.
// ─────────────────────────────────────────────────────────────────────────────
function TextReviewsList({ reviews, onOpenReviews }) {
  if (!reviews.length) return null;

  return (
    <>
      <style>{`
        .reviews-scroll::-webkit-scrollbar { display: none; }
      `}</style>
      <div
        className="reviews-scroll flex gap-4 overflow-x-auto pb-2"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          scrollSnapType: 'x proximity',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {reviews.map((review) => (
          <ReviewCard key={review.key} review={review} onOpenReviews={onOpenReviews} />
        ))}
      </div>
    </>
  );
}

// ── Preview player with Meta Pixel free-lecture tracking ─────────────────────
function PreviewVideoWithTracking({ url, course, lecture }) {
  if (!url) return null;

  const ytId     = getYouTubeId(url);
  const isNative = !ytId && !isBunnyUrl(url) && (isDirectVideo(url) || isCloudinaryVideo(url));

  if (!course || !lecture) {
    return <VideoPlayer url={url} className="w-full" />;
  }

  if (isNative) {
    return (
      <FreeLectureVideoTracker
        course={course}
        lecture={lecture}
        src={url}
        className="w-full aspect-video bg-black object-cover"
        controls
      />
    );
  }

  return (
    <FreeLectureIframeTracker course={course} lecture={lecture}>
      <VideoPlayer url={url} className="w-full" />
    </FreeLectureIframeTracker>
  );
}

export default function CourseLandingPage() {
  const navigate = useNavigate();
  const { id }   = useParams();
  const { courses, loading, getCourse, fetchCourseById } = useCourses();
  const { API: api, user } = useAuth();

  const [mobileMenuOpen,        setMobileMenuOpen]        = useState(false);
  const [expandedSection,       setExpandedSection]       = useState([0, 1, 2]);
  const [showFullDescription,   setShowFullDescription]   = useState(false);
  const [showFullInstructorBio, setShowFullInstructorBio] = useState(false);
  // NEW CHANGE AB: defaults to true now — the Instructor section shows its
  // full description (and any photos/videos in it) as soon as the page
  // loads. Clicking "Show less" collapses it; clicking it again re-expands.
  const [showFullInstructorDescription, setShowFullInstructorDescription] = useState(true);
  const [isPreviewOpen,         setIsPreviewOpen]         = useState(false);
  const [currentVideo,          setCurrentVideo]          = useState('');
  const [activePreviewLecture,  setActivePreviewLecture]  = useState(null);
  const [fullCourse,            setFullCourse]            = useState(null);
  const [fullCourseLoading,     setFullCourseLoading]     = useState(false);
  const [instructorData,        setInstructorData]        = useState(null);
  const [loadingInstructor,     setLoadingInstructor]     = useState(false);
  const [videoReelsOpen,        setVideoReelsOpen]        = useState(false);
  const [videoReelsStartIndex,  setVideoReelsStartIndex]  = useState(0);
  const [imageSliderOpen,       setImageSliderOpen]       = useState(false);
  const [imageSliderStartIndex, setImageSliderStartIndex] = useState(0);

  // Instructor profile media gallery (Photos & Videos, set from the
  // Instructor Dashboard → Profile → Description) — its own lightbox/video
  // modal state, separate from the Student Testimonials / Video Reviews ones
  // above so opening one never affects the other.
  const [instructorImageOpen,      setInstructorImageOpen]      = useState(false);
  const [instructorImageStartIndex, setInstructorImageStartIndex] = useState(0);
  const [instructorVideoOpen,      setInstructorVideoOpen]      = useState(false);
  const [instructorVideoStartIndex, setInstructorVideoStartIndex] = useState(0);

  // ── FOOTER — site logo (Super Admin → Settings), FAQ accordion, newsletter ──
  const [siteLogoUrl, setSiteLogoUrl] = useState('');       // header logo
  const [footerLogoUrl, setFooterLogoUrl] = useState('');   // NEW CHANGE AK: separate footer logo
  const [openFooterTab, setOpenFooterTab] = useState(null); // 'about' | 'policies' | 'contact' | null
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState('idle'); // idle | sending | sent | error

  useEffect(() => {
    api.get('/settings')
      .then((res) => {
        setSiteLogoUrl(res.data?.logoUrl || '');
        setFooterLogoUrl(res.data?.footerLogoUrl || '');
      })
      .catch(() => {}); // logo is optional — falls back to the text wordmark
  }, [api]);

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (!newsletterEmail.trim() || newsletterStatus === 'sending') return;
    setNewsletterStatus('sending');
    api.post('/newsletter', { email: newsletterEmail.trim() })
      .then(() => { setNewsletterStatus('sent'); setNewsletterEmail(''); })
      .catch(() => setNewsletterStatus('error'));
  };

  const [localNewReviews,   setLocalNewReviews]   = useState([]);
  const [fetchedReviews,    setFetchedReviews]    = useState([]);
  const [reviewsOverlayOpen,  setReviewsOverlayOpen]  = useState(false);
  const [reviewsVisibleCount, setReviewsVisibleCount] = useState(10);

  const descriptionRef = useRef(null);
  const instructorSectionRef = useRef(null);
  const viewContentFiredRef = useRef(null);

  // Requirement 3: "Created by <Instructor>" smooth-scrolls to the Instructor
  // section on this same page instead of navigating away.
  const scrollToInstructor = useCallback(() => {
    instructorSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  useEffect(() => {
    if (!id) return;
    setFullCourse(null);
    setFullCourseLoading(true);
    fetchCourseById(id).then((course) => {
      if (course) setFullCourse(course);
      setFullCourseLoading(false);
    });
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fallback: fetch reviews directly when course detail omits reviews_list
  useEffect(() => {
    if (!id) return;
    api.get(`/courses/${id}/reviews`)
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : [];
        setFetchedReviews(list);
      })
      .catch(() => setFetchedReviews([]));
  }, [id, api]);

  const courseData = useMemo(() => {
    if (id) return fullCourse || getCourse(id);
    const publishedCourses = courses.filter(c => c.status === 'published');
    return publishedCourses.length > 0 ? publishedCourses[0] : null;
  }, [id, fullCourse, courses, getCourse]);

  // ─── FIX 1: Instructor data fetch ───────────────────────────────────────
  useEffect(() => {
    if (!courseData?.instructorId) return;
    setLoadingInstructor(true);
    api.get(`/users/${courseData.instructorId}`)
      .then(res => {
        setInstructorData(res.data);
        setLoadingInstructor(false);
      })
      .catch(err => {
        console.error('Failed to fetch instructor:', err);
        setLoadingInstructor(false);
      });
  }, [courseData?.instructorId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setLocalNewReviews([]);
    setShowFullInstructorBio(false);
    // NEW CHANGE AC: this was resetting the Instructor description back to
    // collapsed (false) every time courseData loaded — which is exactly why
    // "default open" never actually showed up, no matter what the useState
    // default above said. This effect fires right after the course data
    // arrives, so it was winning every time. Reset to true (open) instead,
    // matching the new default.
    setShowFullInstructorDescription(true);
  }, [courseData?._id]);

  const sections = courseData?.sections || [];

  const studentsBoughtCourses = useMemo(() => {
    if (!courseData?._id) return [];
    const picked = courseData.alsoBoughtCourseIds;
    if (Array.isArray(picked) && picked.length > 0) {
      const byId = new Map(courses.map((c) => [String(c._id), c]));
      return picked.map((cid) => byId.get(String(cid))).filter(Boolean)
        .filter((c) => c.status === "published" && String(c._id) !== String(courseData._id));
    }
    return courses.filter((c) => c._id !== courseData._id && c.status === "published").slice(0, 4);
  }, [courses, courseData?._id, courseData?.alsoBoughtCourseIds]);

  const previewLectures = useMemo(() => {
    const lectures = [];
    sections.forEach((section, sectionIdx) => {
      section.lectures_list?.forEach((lecture, lectureIdx) => {
        if (lecture.preview && lecture.videoUrl) {
          lectures.push({ ...lecture, sectionTitle: section.title, sectionIdx, lectureIdx });
        }
      });
    });
    return lectures;
  }, [sections]);

  const handleNavigate = (path) => { setMobileMenuOpen(false); navigate(path); };

  // Meta Pixel: ViewContent when a specific course landing page loads
  useEffect(() => {
    if (!id || !courseData?._id) return;
    const key = String(courseData._id);
    if (viewContentFiredRef.current === key) return;
    viewContentFiredRef.current = key;
    trackViewContent(courseData);
  }, [id, courseData?._id, courseData?.title]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleEnrollClick = useCallback(() => {
    if (!courseData?._id) return;
    trackAddToCart(courseData);
    setPendingCourse(courseData);
    const courseId = courseData._id || courseData.id;
    // Goes to the new two-step Enrollment page (name/email/WhatsApp, then
    // payment method) instead of straight to sign-up. That page itself sends
    // guests on to /auth/register once both steps are filled in.
    navigate(`/course/${courseId}/enroll`);
    setMobileMenuOpen(false);
  }, [courseData, navigate]);

  const handlePreviewClick  = () => {
    setCurrentVideo(courseData?.previewVideoUrl || '');
    setActivePreviewLecture({
      id:    'main-preview',
      _id:   'main-preview',
      title: `${courseData?.title || 'Course'} Preview`,
    });
    setIsPreviewOpen(true);
  };
  const handleClosePreview  = () => {
    setIsPreviewOpen(false);
    setCurrentVideo('');
    setActivePreviewLecture(null);
  };
  const handleLectureClick  = (lecture) => {
    setCurrentVideo(lecture.videoUrl);
    setActivePreviewLecture(lecture);
    setIsPreviewOpen(true);
  };

  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === 'Escape' && isPreviewOpen) handleClosePreview(); };
    if (isPreviewOpen) { window.addEventListener('keydown', handleKeyDown); document.body.style.overflow = 'hidden'; }
    return () => { window.removeEventListener('keydown', handleKeyDown); document.body.style.overflow = 'unset'; };
  }, [isPreviewOpen]);

  const handleToggleDescription = () => {
    if (showFullDescription) {
      const el = descriptionRef.current;
      if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top, behavior: 'smooth' });
      }
      setShowFullDescription(false);
    } else {
      setShowFullDescription(true);
    }
  };

  // Ratings & Reviews open INSIDE this same course page — no route change —
  // the same way the free-lecture preview opens inline. Reachable from the
  // hero rating link, the free-preview rating link, "Show All Reviews", and
  // every individual review card.
  const openReviewsOverlay = useCallback(() => {
    setReviewsVisibleCount(10);
    setReviewsOverlayOpen(true);
  }, []);
  const closeReviewsOverlay = useCallback(() => setReviewsOverlayOpen(false), []);

  // While the Ratings & Reviews overlay is open, lock background body scroll
  // (same pattern used for the preview popup / video modal above). Without
  // this, the page behind the fixed overlay could still scroll at the same
  // time as the overlay's own internal scroll area, which is what caused the
  // reviews view to feel like it "hangs" partway through scrolling on mobile.
  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === 'Escape' && reviewsOverlayOpen) closeReviewsOverlay(); };
    if (reviewsOverlayOpen) { window.addEventListener('keydown', handleKeyDown); document.body.style.overflow = 'hidden'; }
    return () => { window.removeEventListener('keydown', handleKeyDown); document.body.style.overflow = 'unset'; };
  }, [reviewsOverlayOpen, closeReviewsOverlay]);

  // NEW CHANGE X: No custom in-page loading spinner anymore — while the course
  // is loading we render nothing at all, so the only loading feedback the
  // visitor sees is the browser's own default tab/address-bar indicator.
  if (loading || fullCourseLoading) {
    return null;
  }

  if (!courseData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFAF6] gap-4">
        <p className="text-6xl">😕</p>
        <h2 className="text-2xl font-bold text-[#1a1208]" style={{ fontFamily: "'Playfair Display', serif" }}>Course not found</h2>
        <button onClick={() => navigate('/courses')} className="px-6 py-3 bg-[#e8540a] text-white font-semibold rounded-lg hover:bg-[#c94708] transition border-none cursor-pointer">Browse all courses</button>
      </div>
    );
  }

  // ─── FIX 1: Build instructor object ─────────────────────────────────────
  const instructor = instructorData ? {
    name:        instructorData.name                || courseData.instructor        || 'Instructor',
    title:       instructorData.title               || courseData.instructorTitle   || '',
    location:    instructorData.location            || courseData.instructorLocation|| '',
    website:     instructorData.website             || courseData.instructorWebsite || '',
    twitter:     instructorData.twitter             || courseData.instructorTwitter || '',
    linkedin:    instructorData.linkedin            || courseData.instructorLinkedin|| '',
    rating:      Number(instructorData.totalRatings  ?? courseData.instructorTotalRatings  ?? 0) || 0,
    reviews:     Number(instructorData.totalReviews  ?? courseData.instructorTotalReviews  ?? 0) || 0,
    students:    Number(instructorData.totalStudents ?? courseData.instructorTotalStudents ?? 0) || 0,
    courses:     Number(instructorData.totalCourses  ?? courseData.instructorTotalCourses  ?? 0) || 0,
    bio:         instructorData.bio                 || courseData.instructorBio     || '',
    description: instructorData.instructorDescription || courseData.instructorDescription || '',
    image:       instructorData.avatar              || instructorData.profileImage  || instructorData.instructorImage || courseData.instructorImage || '👩‍💼',
    descriptionBlocks: Array.isArray(instructorData.instructorDescriptionBlocks) && instructorData.instructorDescriptionBlocks.length
      ? instructorData.instructorDescriptionBlocks
      : buildLegacyDescriptionBlocks(
          instructorData.instructorDescription || courseData.instructorDescription || instructorData.bio || courseData.instructorBio || '',
          Array.isArray(instructorData.instructorMedia) ? instructorData.instructorMedia : (Array.isArray(courseData.instructorMedia) ? courseData.instructorMedia : [])
        ),
  } : {
    name:        courseData.instructor        || 'Instructor',
    title:       courseData.instructorTitle   || '',
    location:    courseData.instructorLocation|| '',
    website:     courseData.instructorWebsite || '',
    twitter:     courseData.instructorTwitter || '',
    linkedin:    courseData.instructorLinkedin|| '',
    rating:      Number(courseData.instructorTotalRatings  ?? 0) || 0,
    reviews:     Number(courseData.instructorTotalReviews  ?? 0) || 0,
    students:    Number(courseData.instructorTotalStudents ?? 0) || 0,
    courses:     Number(courseData.instructorTotalCourses  ?? 0) || 0,
    bio:         courseData.instructorBio     || '',
    description: courseData.instructorDescription || '',
    image:       courseData.instructorImage   || '👩‍💼',
    descriptionBlocks: Array.isArray(courseData.instructorDescriptionBlocks) && courseData.instructorDescriptionBlocks.length
      ? courseData.instructorDescriptionBlocks
      : buildLegacyDescriptionBlocks(courseData.instructorDescription || courseData.instructorBio || '', Array.isArray(courseData.instructorMedia) ? courseData.instructorMedia : []),
  };

  // instructor.descriptionBlocks is the ordered paragraph/picture/video list
  // set on the Instructor Dashboard's Profile → Description page. Rendered
  // in exactly that order below (NOT as a separate gallery), and also split
  // out into flat images/videos arrays purely so the lightbox/video modal
  // can page through "all photos" / "all videos" regardless of which one was
  // clicked first.
  const instructorImages = (instructor.descriptionBlocks || [])
    .filter((b) => b.type === 'image' && b.imageUrl)
    .map((b) => ({ imageUrl: b.imageUrl, author: b.heading || '' }));

  // NEW: a video block can now hold several links (added via "+ Add Another
  // Video" on the Instructor Dashboard) instead of just one — getBlockVideoUrls
  // reads either shape: the new `videoUrls` array, or the older single
  // `videoUrl` string, so nothing breaks for a block saved before this change.
  const instructorVideos = (instructor.descriptionBlocks || [])
    .filter((b) => b.type === 'video')
    .flatMap((b) => getBlockVideoUrls(b).map((url) => ({ videoUrl: url, author: b.heading || '' })));

  // The same blocks, in original order, each tagged with what it needs to
  // render: image blocks get a single click-through index into
  // instructorImages; video blocks get an ARRAY of click-through indexes
  // (_clickIndexes), one per video link in that block, into instructorVideos
  // — so InstructorVideoBlock below can render a slider when a block has
  // more than one link and a single card when it has exactly one, while
  // every individual video still opens the full-screen modal at the right
  // spot. Text blocks are left untagged — they render as plain paragraphs.
  let __instrVidIdx = 0, __instrImgIdx = 0;
  const instructorFlowBlocks = (instructor.descriptionBlocks || []).map((b, idx) => {
    if (b.type === 'video') {
      const urls = getBlockVideoUrls(b);
      if (!urls.length) return { ...b, _key: idx, _kind: 'text' };
      const clickIndexes = urls.map(() => __instrVidIdx++);
      return { ...b, _key: idx, _kind: 'video', _urls: urls, _clickIndexes: clickIndexes };
    }
    if (b.type === 'image' && b.imageUrl) return { ...b, _key: idx, _kind: 'image', _clickIndex: __instrImgIdx++ };
    return { ...b, _key: idx, _kind: 'text' };
  });

  const totalLectures = sections.reduce((a, s) => a + (s.lectures || 0), 0);

  // ─── FIX 5 + FIX 6: Build the reviews array ────────────────────────────
  // Merge ALL possible sources (reviews_list, reviews, localNewReviews) then
  // de-dupe by server _id so we never show the same card twice even if both
  // fields are populated. This also fixes "disappears on refresh" — previously
  // safeReviewsArr was skipped whenever reviews_list was non-empty, meaning
  // whichever field the backend uses after a POST was silently ignored.
  const safeReviewsList = Array.isArray(courseData.reviews_list)
    ? courseData.reviews_list.filter(r => r && typeof r === 'object')
    : [];

  const safeReviewsArr = Array.isArray(courseData.reviews)
    ? courseData.reviews.filter(r => r && typeof r === 'object')
    : [];

  // Always merge all sources; de-dupe handles any overlap.
  const rawReviews = [
    ...localNewReviews,
    ...safeReviewsList,
    ...safeReviewsArr,
    ...fetchedReviews,
  ];

  const textReviews = rawReviews
    .map((r, idx) => normalizeReview(r, idx))
    .filter(Boolean)
    // De-dupe by stable key — server _id makes this safe even when both
    // reviews_list and reviews contain the same document.
    .filter((r, idx, arr) => arr.findIndex(x => x.key === r.key) === idx);

  const imageTestimonials = courseData.imageTestimonials || [];
  const videoTestimonials = courseData.videoTestimonials || [];
  const projectGallery    = courseData.projectGallery   || [];

  const discountPct = courseData.originalPrice > courseData.price
    ? Math.round((1 - courseData.price / courseData.originalPrice) * 100)
    : null;
  // NEW CHANGE AI: was multiplying by an approximate USD→PKR rate (×280),
  // which showed a fake, inflated number that didn't match what the
  // instructor actually entered. Course Price / Sale Price are now entered
  // directly in PKR on the Instructor Dashboard, so this just displays the
  // real stored value — discountPct above already compares the real
  // price/originalPrice, so the % off was already correct either way.
  const priceLabel = `PKR ${courseData.price.toLocaleString()}`;

  const hasRealReviews = textReviews.length > 0;
  const displayReviews = hasRealReviews ? textReviews : FALLBACK_REVIEWS;
  const displayRating = courseData.rating
    || (hasRealReviews ? (textReviews.reduce((s, r) => s + r.rating, 0) / textReviews.length) : FALLBACK_RATING);

  // Per-course fallback base numbers — reviews land somewhere in 11,800–12,899,
  // enrolled students in 61,001–62,000. Every course gets this base by
  // default; real reviews/enrollments ADD ON TOP of it rather than replacing
  // it, so the number only ever grows from here, never resets to a small
  // real count.
  const courseSeed = courseData._id || courseData.id || courseData.title;
  const fallbackReviewCount  = 11800 + stableCourseOffset(courseSeed, 1100);
  const fallbackStudentCount = 61001 + stableCourseOffset(`${courseSeed}-students`, 999);

  const realReviewCount  = courseData.reviews  || (hasRealReviews ? textReviews.length : 0);
  const realStudentCount = courseData.students || 0;

  const displayRatingCount  = fallbackReviewCount + realReviewCount;
  const displayStudentCount = fallbackStudentCount + realStudentCount;
  const displayRatingDistribution = hasRealReviews ? computeRatingDistribution(textReviews) : FALLBACK_RATING_DISTRIBUTION;

  return (
    <div className="min-h-screen bg-[#FDFAF6] overflow-x-hidden w-full" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* FULL-SCREEN COURSE PREVIEW POPUP */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-[9999] bg-black bg-opacity-95 flex flex-col">
          <div className="absolute top-4 right-4 z-10">
            <button onClick={handleClosePreview}
              className="p-3 bg-white bg-opacity-10 hover:bg-opacity-20 rounded-full transition border-none cursor-pointer backdrop-blur-sm">
              <X size={24} className="text-white" />
            </button>
          </div>
          <div className="w-full bg-gradient-to-r from-[#1a1208] to-[#0f0a05] border-b border-[#3d3020] py-4 md:py-6">
            <div className="max-w-7xl mx-auto px-4 md:px-6">
              <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-white mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>Course Preview</h2>
              <p className="text-base md:text-lg text-[#c8bfaf]">{courseData.title}</p>
            </div>
          </div>
          <div className="w-full bg-black">
            <div className="max-w-7xl mx-auto"><PreviewVideoWithTracking url={currentVideo} course={courseData} lecture={activePreviewLecture} /></div>
          </div>

          {/* Clickable rating link below the free lecture video player — closes this
              preview and opens the Ratings & Reviews view inside the page. */}
          {displayRating > 0 && (
            <div className="w-full bg-black border-b border-[#2d2416]">
              <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => { handleClosePreview(); openReviewsOverlay(); }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleClosePreview();
                      openReviewsOverlay();
                    }
                  }}
                  aria-label="View all course reviews"
                  className="inline-flex items-center gap-1.5 cursor-pointer rounded-md hover:opacity-80 transition focus:outline-none focus:ring-2 focus:ring-[#e8540a] focus:ring-offset-2 focus:ring-offset-black"
                >
                  <Star size={16} className="text-[#f9c97a] md:w-[18px] md:h-[18px]" fill="currentColor" />
                  <span className="text-[#f9c97a] font-bold text-sm md:text-base">{displayRating.toFixed(1)}</span>
                  <span className="text-[#c8bfaf] text-sm md:text-base">·</span>
                  <span className="text-[#c8bfaf] text-sm md:text-base underline decoration-[#c8bfaf]/40">{formatNumber(displayRatingCount)} reviews</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto bg-gradient-to-b from-black to-[#1a1208]">
            <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
              <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-white mb-4 md:mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>Free Preview Lectures</h3>
              {previewLectures.length === 0 ? (
                <div className="text-center py-12"><p className="text-[#9e8e7a] text-base md:text-lg">No preview lectures available</p></div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  {previewLectures.map((lecture, idx) => (
                    <div key={`${lecture.sectionIdx}-${lecture.lectureIdx}`}
                      onClick={() => handleLectureClick(lecture)}
                      className="bg-white bg-opacity-5 hover:bg-opacity-10 border border-[#3d3020] rounded-lg p-3 md:p-4 cursor-pointer transition group">
                      <div className="flex items-start gap-3 md:gap-4">
                        <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#e8540a] group-hover:bg-[#c94708] flex items-center justify-center transition mt-0.5">
                          <Play size={14} className="text-white ml-0.5" fill="currentColor" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm md:text-base text-white group-hover:text-[#f0a070] transition leading-relaxed break-words">{lecture.title}</p>
                          <p className="text-xs md:text-sm text-[#9e8e7a] mt-1">{lecture.sectionTitle}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* RATINGS & REVIEWS — opens inside this same course page (no route change),
          reachable from the hero rating link, the free-preview rating link,
          "Show All Reviews", and any individual review card. */}
      {reviewsOverlayOpen && (
        <div className="fixed inset-0 z-[9999] bg-[#FDFAF6] flex flex-col">
          <div className="sticky top-0 z-10 bg-white border-b border-[#ece6dd] shadow-sm">
            <div className="max-w-4xl mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center gap-3">
              <button
                onClick={closeReviewsOverlay}
                aria-label="Back to course"
                className="p-2 -ml-2 rounded-full hover:bg-[#f0ebe3] transition border-none bg-transparent cursor-pointer text-[#1a1208]"
              >
                <ArrowLeft size={22} />
              </button>
              {/* Compact dynamic summary, in the exact same typography as the
                  clickable rating line on the main course page (same size,
                  weight, color, tabular-nums number) — not the page-heading
                  serif font used elsewhere. */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-2xl md:text-3xl font-bold text-[#1a1208]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {displayRating ? displayRating.toFixed(1) : '—'} Rating
                </span>
                <span className="text-[#9e9789] text-lg md:text-xl">•</span>
                <span className="text-sm md:text-base text-[#9e9789] font-medium">
                  {formatNumber(displayRatingCount)} Reviews
                </span>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-10">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 md:gap-12 mb-8 md:mb-10 pb-8 md:pb-10 border-b border-[#ece6dd]">
                <div className="flex flex-col items-center flex-shrink-0">
                  <span className="text-5xl md:text-6xl font-bold text-[#1a1208]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {displayRating ? displayRating.toFixed(1) : '—'}
                  </span>
                  <div className="flex gap-1 mt-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={18} className="text-[#f9c97a]" fill={i < Math.round(displayRating) ? 'currentColor' : 'none'} />
                    ))}
                  </div>
                  <p className="text-sm text-[#9e9789] mt-2">{formatNumber(displayRatingCount)} ratings</p>
                </div>
                <div className="flex-1 w-full">
                  <RatingDistribution distribution={displayRatingDistribution} />
                </div>
              </div>

              <div className="space-y-4 md:space-y-5">
                {displayReviews.slice(0, reviewsVisibleCount).map((review) => (
                  <div key={review.key} className="bg-white border border-[#ece6dd] rounded-2xl p-5 md:p-6">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-11 h-11 rounded-full bg-black text-white flex items-center justify-center font-bold text-lg flex-shrink-0 overflow-hidden">
                        {review.author.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[#1a1208] text-sm md:text-base leading-snug break-words">{review.author}</p>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <div className="flex gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} size={12} className="text-[#f9c97a]" fill={i < Math.round(review.rating) ? 'currentColor' : 'none'} />
                            ))}
                          </div>
                          {review.date && <span className="text-xs text-[#9e9789]">{review.date}</span>}
                        </div>
                      </div>
                    </div>
                    {review.text ? (
                      <p className="text-[#3d3020] text-sm md:text-base leading-relaxed break-words">{review.text}</p>
                    ) : (
                      <p className="text-[#b0a898] text-sm italic">No written feedback provided.</p>
                    )}
                  </div>
                ))}
              </div>

              {reviewsVisibleCount < displayReviews.length && (
                <button
                  onClick={() => setReviewsVisibleCount((c) => c + 10)}
                  className="w-full mt-6 bg-white hover:bg-[#fdf2ea] text-[#e8540a] font-bold py-3 rounded-xl transition text-base border-2 border-[#e8540a] cursor-pointer"
                >
                  Show more reviews
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DEFAULT VIDEO PLAYER — plain native controls, sound on, opened by tapping
          any tile in the Video Reviews grid. */}
      <DefaultVideoModal
        isOpen={videoReelsOpen}
        onClose={() => setVideoReelsOpen(false)}
        videos={videoTestimonials}
        startIndex={videoReelsStartIndex}
      />

      {/* IMAGE LIGHTBOX — opened by tapping any tile in the Student Testimonials
          grid; the background waterfall keeps auto-scrolling behind it. */}
      <ImageLightbox
        isOpen={imageSliderOpen}
        onClose={() => setImageSliderOpen(false)}
        images={imageTestimonials}
        startIndex={imageSliderStartIndex}
      />

      {/* INSTRUCTOR PHOTOS & VIDEOS — same lightbox/video-modal pattern as the
          testimonial grids above, fed by the instructor's own media gallery. */}
      <DefaultVideoModal
        isOpen={instructorVideoOpen}
        onClose={() => setInstructorVideoOpen(false)}
        videos={instructorVideos}
        startIndex={instructorVideoStartIndex}
      />
      <ImageLightbox
        isOpen={instructorImageOpen}
        onClose={() => setInstructorImageOpen(false)}
        images={instructorImages}
        startIndex={instructorImageStartIndex}
      />

      {/* ANNOUNCEMENT BAR — uses the same real price/originalPrice as the rest
          of the page (was reading the unused `discountPrice` field before,
          so this never actually reflected what the instructor set). */}
      {discountPct > 0 && (
        <div className="bg-[#1a1208] py-2 md:py-3 w-full overflow-hidden">
          <style>{`
            @keyframes announcement-marquee {
              0%   { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
            .announcement-track {
              display: flex;
              width: max-content;
              animation: announcement-marquee 18s linear infinite;
              will-change: transform;
            }
            .announcement-track:hover {
              animation-play-state: paused;
            }
          `}</style>
          <div className="announcement-track">
            {[0, 1].map((copy) => (
              <span
                key={copy}
                className="text-sm md:text-base font-semibold text-[#f9c97a] whitespace-nowrap px-16"
                aria-hidden={copy === 1}
              >
                Limited Time Offer: Save {discountPct}% — Ends Soon!
                &nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;
                Limited Time Offer: Save {discountPct}% — Ends Soon!
              </span>
            ))}
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white shadow-sm w-full border-b border-[#ece6dd]">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-3 md:py-4 flex items-center justify-between">
          <button
            className="lg:hidden p-2 -ml-2 bg-transparent border-none cursor-pointer text-[#1a1208]"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className="absolute left-1/2 transform -translate-x-1/2 lg:relative lg:left-auto lg:transform-none">
            <button onClick={() => handleNavigate('/')}
              className="cursor-pointer hover:opacity-80 transition bg-transparent border-none p-0 flex items-center"
              style={{ fontFamily: "'Playfair Display', serif" }}>
              {siteLogoUrl ? (
                <img src={siteLogoUrl} alt="Logo" className="h-14 md:h-16 lg:h-20 w-auto object-contain" />
              ) : (
                <span className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-[#1a1208]">
                  Ler<span className="text-[#e8540a]">ni</span>
                </span>
              )}
            </button>
          </div>
          {/* NEW CHANGE N: added Home + Services links alongside the existing ones */}
          <nav className="hidden lg:flex items-center gap-8 flex-1 ml-12">
            <button onClick={() => handleNavigate('/')} className="text-base text-[#3d3020] hover:text-[#e8540a] transition bg-transparent border-none cursor-pointer p-0 font-medium">Home</button>
            <button onClick={() => handleNavigate('/courses')} className="text-base text-[#3d3020] hover:text-[#e8540a] transition bg-transparent border-none cursor-pointer p-0 font-medium">Categories</button>
            <button onClick={() => handleNavigate('/services')} className="text-base text-[#3d3020] hover:text-[#e8540a] transition bg-transparent border-none cursor-pointer p-0 font-medium">Services</button>
            <button onClick={() => handleNavigate('/instructor')} className="text-base text-[#3d3020] hover:text-[#e8540a] transition bg-transparent border-none cursor-pointer p-0 font-medium">Instructor</button>
            <button onClick={() => handleNavigate('/courses')} className="text-base text-[#3d3020] hover:text-[#e8540a] transition bg-transparent border-none cursor-pointer p-0 font-medium">About</button>
          </nav>
          <div className="flex items-center gap-2 md:gap-3">
            <Search className="hidden lg:block text-[#9e9789] cursor-pointer hover:text-[#1a1208] transition" size={22} />
            <button onClick={() => handleNavigate('/auth/login')} className="px-4 md:px-6 py-2 md:py-2.5 bg-[#e8540a] text-white rounded-lg hover:bg-[#c94708] transition font-semibold border-none cursor-pointer text-sm md:text-base shadow-sm">Log In</button>
          </div>
        </div>
        {mobileMenuOpen && (
          <>
            <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
            <div className="fixed top-0 left-0 h-full w-64 bg-[#1a1208] z-50 lg:hidden shadow-2xl">
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>Menu</span>
                  <button onClick={() => setMobileMenuOpen(false)} className="p-2 hover:bg-white/10 rounded-lg transition bg-transparent border-none cursor-pointer text-white"><X size={24} /></button>
                </div>
                {/* NEW CHANGE N: same Home + Services links added to the mobile drawer */}
                <button onClick={() => handleNavigate('/')} className="block w-full text-left text-white hover:text-[#f0a070] bg-transparent border-none cursor-pointer p-3 rounded-lg hover:bg-white/5 font-medium transition text-base">Home</button>
                <button onClick={() => handleNavigate('/courses')} className="block w-full text-left text-white hover:text-[#f0a070] bg-transparent border-none cursor-pointer p-3 rounded-lg hover:bg-white/5 font-medium transition text-base">Categories</button>
                <button onClick={() => handleNavigate('/services')} className="block w-full text-left text-white hover:text-[#f0a070] bg-transparent border-none cursor-pointer p-3 rounded-lg hover:bg-white/5 font-medium transition text-base">Services</button>
                <button onClick={() => handleNavigate('/instructor')} className="block w-full text-left text-white hover:text-[#f0a070] bg-transparent border-none cursor-pointer p-3 rounded-lg hover:bg-white/5 font-medium transition text-base">Instructor</button>
              </div>
            </div>
          </>
        )}
      </header>

      {/* BREADCRUMB — wraps naturally instead of truncating on narrow screens */}
      <div className="bg-white border-b border-[#ece6dd]">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-2 md:py-3 text-sm md:text-base text-[#9e9789] w-full flex flex-wrap items-center gap-x-2 gap-y-1">
          <button onClick={() => handleNavigate('/')} className="hover:text-[#e8540a] bg-transparent border-none cursor-pointer text-[#9e9789] p-0 transition">Development</button>
          <ChevronDown size={16} className="rotate-[-90deg] text-[#ccc5b8] flex-shrink-0" />
          <button onClick={() => handleNavigate('/courses')} className="hover:text-[#e8540a] bg-transparent border-none cursor-pointer text-[#9e9789] p-0 transition">{courseData.category || 'Courses'}</button>
          <ChevronDown size={16} className="rotate-[-90deg] text-[#ccc5b8] flex-shrink-0" />
          <span className="text-[#1a1208] font-semibold break-words">{courseData.title}</span>
        </div>
      </div>

      {/* COURSE HERO SECTION */}
      <section className="w-full bg-[#1a1208] text-white py-6 md:py-8 lg:py-12 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
            <div className="lg:col-span-2">
              <div className="mb-3 md:mb-4 flex items-center gap-2 flex-wrap">
                {courseData.bestseller && (
                  <span className="inline-flex items-center gap-1 bg-[#f9c97a] text-[#7a4a00] font-bold px-3 md:px-4 py-1.5 md:py-2 rounded text-sm">
                    <Award size={14} /> Bestseller
                  </span>
                )}
                {courseData.level && (
                  <span className="inline-block bg-[#e8540a] text-white font-semibold px-3 md:px-4 py-1.5 md:py-2 rounded text-sm">{courseData.level}</span>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-3 md:mb-4 leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>{courseData.title}</h1>
              <p className="text-lg md:text-xl lg:text-2xl text-[#c8bfaf] mb-4 md:mb-6 leading-relaxed">{courseData.subtitle}</p>
              <div className="-mx-4 lg:-mx-6 mb-4 md:mb-6">
                <div className="relative w-full bg-black aspect-video cursor-pointer" onClick={handlePreviewClick}>
                  <CourseThumbnail course={courseData} />
                </div>
              </div>
              {/* Rating link below the free lecture video player — the entire area is
                  clickable and opens the Ratings & Reviews view inside this page. */}
              <div className="flex flex-wrap items-center gap-3 md:gap-4 mb-4 md:mb-6">
                {displayRating > 0 && (
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={openReviewsOverlay}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        openReviewsOverlay();
                      }
                    }}
                    aria-label="View all course reviews"
                    className="flex items-center gap-1.5 cursor-pointer rounded-md hover:opacity-80 transition focus:outline-none focus:ring-2 focus:ring-[#e8540a] focus:ring-offset-2 focus:ring-offset-[#1a1208]"
                  >
                    <Star size={16} className="text-[#f9c97a] md:w-[18px] md:h-[18px]" fill="currentColor" />
                    <span className="text-[#f9c97a] font-bold text-sm md:text-base">{displayRating.toFixed(1)}</span>
                    <span className="text-[#c8bfaf] text-sm md:text-base">·</span>
                    <span className="text-[#c8bfaf] text-sm md:text-base underline decoration-[#c8bfaf]/40">{formatNumber(displayRatingCount)} reviews</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-[#c8bfaf] text-sm md:text-base">
                  <Users size={16} /><span>{displayStudentCount.toLocaleString()} students</span>
                </div>
              </div>
              <div className="mb-4 md:mb-6">
                <p className="text-[#9e8e7a] text-sm md:text-base">
                  Created by{' '}
                  <button onClick={scrollToInstructor}
                    className="text-[#e87040] hover:text-[#f0a070] font-semibold bg-transparent border-none cursor-pointer p-0 underline">
                    {instructor.name}
                  </button>
                  {instructor.title && (
                    <span className="text-[#c8bfaf]"> · {instructor.title}</span>
                  )}
                </p>
              </div>
              <div className="flex flex-wrap gap-3 md:gap-4 text-[#7a6e62] text-sm md:text-base">
                <div className="flex items-center gap-1.5"><Clock size={16} /><span>Last updated {courseData.lastUpdated || 'Recently'}</span></div>
                <div className="flex items-center gap-1.5"><Globe size={16} /><span>Urdu</span></div>
              </div>
            </div>

            {/* Desktop sidebar card */}
            <div className="hidden lg:block">
              <div className="sticky top-24">
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#ece6dd]">
                  <div className="relative aspect-video cursor-pointer group" onClick={handlePreviewClick}>
                    <CourseThumbnail course={courseData} />
                  </div>
                  <div className="p-6">
                    <div className="flex items-baseline gap-3 mb-4">
                      <span className="text-3xl font-bold text-[#1a1208]" style={{ fontFamily: "'Playfair Display', serif" }}>
                        {priceLabel}
                      </span>
                      {discountPct && <span className="text-base font-semibold text-[#e8540a]">{discountPct}% off</span>}
                    </div>
                    <button onClick={handleEnrollClick}
                      className="w-full bg-[#e8540a] hover:bg-[#c94708] text-white font-bold py-3 rounded-xl transition text-lg border-none cursor-pointer shadow-lg mb-3">
                      {discountPct ? (
                        <span>Enroll Now • {priceLabel} • <span className="text-[#fde8d8]">{discountPct}% OFF</span></span>
                      ) : `Enroll Now in ${priceLabel}`}
                    </button>
                    <button onClick={handleEnrollClick}
                      className="w-full bg-white hover:bg-[#f8f4ed] text-[#1a1208] font-semibold py-3 rounded-xl transition text-lg border-2 border-[#ece6dd] cursor-pointer">
                      Buy now
                    </button>
                    <p className="text-center text-sm text-[#9e9789] mt-4 flex items-center justify-center gap-1.5">
                      <Shield size={14} className="text-[#3d7a4e]" />30-Day Money-Back Guarantee
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <section className="w-full bg-white py-8 md:py-12 lg:py-16 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
            <div className="lg:col-span-2 w-full min-w-0">

              {/* WHAT YOU'LL LEARN */}
              {courseData.whatYouLearn?.length > 0 && (
                <div className="mb-8 md:mb-12 w-full">
                  <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#1a1208] mb-4 md:mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>What you'll learn</h2>
                  <div className="border border-[#ece6dd] rounded-2xl p-4 md:p-6 lg:p-8 bg-[#f8f4ed] w-full">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                      {courseData.whatYouLearn.map((outcome, idx) => (
                        <div key={idx} className="flex gap-2 md:gap-3 items-start">
                          <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-[#e8540a] flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check size={12} className="text-white" strokeWidth={3} />
                          </div>
                          <p className="text-[#3d3020] text-sm md:text-base leading-relaxed">{outcome}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* COURSE CONTENT — titles wrap naturally, no ellipsis/truncation */}
              {sections.length > 0 && (
                <>
                  <div className="mb-4 md:mb-6">
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#1a1208] mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>Course Content</h2>
                    <div className="flex flex-wrap gap-2 text-[#9e9789] text-sm md:text-base">
                      <span className="font-semibold text-[#1a1208]">{sections.length} sections</span>
                      <span>•</span>
                      <span className="font-semibold text-[#1a1208]">{totalLectures} lectures</span>
                      {courseData.duration && <><span>•</span><span>{courseData.duration} total length</span></>}
                    </div>
                  </div>
                  <div className="space-y-2 mb-8 md:mb-12 w-full">
                    {sections.map((section, idx) => {
                      const isExpanded = expandedSection.includes(idx);
                      return (
                        <div key={idx} className="border border-[#ece6dd] rounded-xl overflow-hidden hover:border-[#ddd5c4] transition w-full">
                          <button
                            onClick={() => setExpandedSection(isExpanded ? expandedSection.filter(i => i !== idx) : [...expandedSection, idx])}
                            className="w-full px-4 md:px-5 py-3 md:py-4 flex items-start justify-between bg-[#f8f4ed] hover:bg-[#f0ebe3] transition border-none cursor-pointer text-left">
                            <div className="flex items-start gap-2 md:gap-3 flex-1 text-left min-w-0">
                              <ChevronDown size={18} className={`text-[#9e9789] transition-transform flex-shrink-0 mt-0.5 ${isExpanded ? 'rotate-180' : ''}`} />
                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-[#1a1208] text-base md:text-lg leading-snug break-words">{section.title}</h3>
                                <p className="text-sm text-[#9e9789] mt-1">{section.lectures || 0} lectures{section.duration ? ` • ${section.duration}` : ''}</p>
                              </div>
                            </div>
                          </button>
                          {isExpanded && section.lectures_list?.length > 0 && (
                            <div className="border-t border-[#ece6dd] bg-white">
                              {section.lectures_list.map((lecture, lectureIdx) => {
                                const isClickable = Boolean(lecture.preview && lecture.videoUrl);
                                return (
                                  <div
                                    key={lectureIdx}
                                    onClick={isClickable ? () => handleLectureClick(lecture) : undefined}
                                    onKeyDown={isClickable ? (e) => {
                                      if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        handleLectureClick(lecture);
                                      }
                                    } : undefined}
                                    role={isClickable ? 'button' : undefined}
                                    tabIndex={isClickable ? 0 : undefined}
                                    aria-label={isClickable ? `Play free lecture: ${lecture.title}` : undefined}
                                    className={`px-4 md:px-6 py-3 md:py-3.5 border-b border-[#f0ebe3] last:border-b-0 flex items-start justify-between gap-3 transition ${isClickable ? 'cursor-pointer hover:bg-[#fbf8f3] focus:outline-none focus:bg-[#fbf8f3]' : ''}`}
                                  >
                                    <div className="flex items-start gap-2 md:gap-3 flex-1 min-w-0">
                                      <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-[#f0ebe3] flex items-center justify-center flex-shrink-0 mt-0.5">
                                        {lecture.type === 'video'
                                          ? <Play size={12} className="text-[#6b5e4e] ml-0.5" />
                                          : <BookOpen size={12} className="text-[#6b5e4e]" />}
                                      </div>
                                      <p className="text-[#1a1208] text-sm md:text-base font-medium leading-relaxed break-words">{lecture.title}</p>
                                    </div>
                                    <div className="flex items-center gap-2 md:gap-3 flex-shrink-0 mt-0.5">
                                      {lecture.duration && <span className="text-sm text-[#9e9789] whitespace-nowrap">{lecture.duration}</span>}
                                      {isClickable && (
                                        <span className="flex items-center bg-[#e8540a] text-white font-semibold text-xs md:text-sm whitespace-nowrap px-2.5 py-1.5 rounded-full">
                                          Free Lecture
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* ENROLL NOW BUTTON */}
              <div className="mb-8 md:mb-12 w-full">
                <button onClick={handleEnrollClick}
                  className="w-full bg-[#1a1208] hover:bg-[#2d2416] text-white font-bold py-3 md:py-4 rounded-xl transition text-lg md:text-xl border-none cursor-pointer shadow-lg">
                  {discountPct ? (
                    <span>Enroll Now • {priceLabel} • <span className="text-[#f9c97a]">{discountPct}% OFF</span></span>
                  ) : `Enroll Now in ${priceLabel}`}
                </button>
              </div>

              {/* REQUIREMENTS */}
              {courseData.requirements?.length > 0 && (
                <div className="mb-8 md:mb-12 w-full">
                  <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#1a1208] mb-4 md:mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>Requirements</h2>
                  <div className="border border-[#ece6dd] rounded-2xl p-4 md:p-6 lg:p-8 bg-[#f8f4ed] w-full">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                      {courseData.requirements.map((req, idx) => (
                        <div key={idx} className="flex gap-2 md:gap-3 items-start">
                          <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-[#e8540a] flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check size={12} className="text-white" strokeWidth={3} />
                          </div>
                          <p className="text-[#3d3020] text-sm md:text-base leading-relaxed">{req}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* DESCRIPTION */}
              {courseData.description && (
                <div className="mb-8 md:mb-12 w-full" ref={descriptionRef}>
                  <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#1a1208] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Description</h2>
                  <div className="relative">
                    <div
                      className={`text-[#3d3020] leading-relaxed text-sm md:text-base lerni-prose max-w-none ${!showFullDescription ? 'max-h-48 overflow-hidden' : ''}`}
                      style={{ wordBreak: 'break-word' }}
                      dangerouslySetInnerHTML={{ __html: richTextToHtml(courseData.description) }}
                    />
                    {!showFullDescription && (
                      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white via-white/90 to-transparent pointer-events-none" />
                    )}
                  </div>
                  <button onClick={handleToggleDescription}
                    className="text-[#e8540a] hover:text-[#c94708] mt-3 text-sm md:text-base font-bold transition flex items-center gap-1 bg-transparent border-none cursor-pointer p-0 mx-auto sm:mx-0">
                    <span>{showFullDescription ? 'Show less' : 'Show more'}</span>
                    <ChevronDown size={16} className={`transition-transform ${showFullDescription ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              )}

              {/* INSTRUCTOR — circular photo + stat grid beside it (desktop), stacked (mobile) */}
              <div className="mb-8 md:mb-12 pt-6 md:pt-8 border-t border-[#ece6dd] w-full" ref={instructorSectionRef} id="instructor-section">
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#1a1208] mb-6 md:mb-8" style={{ fontFamily: "'Playfair Display', serif" }}>Instructor</h2>
                {loadingInstructor ? (
                  <p className="text-[#9e9789] text-base md:text-lg">Loading instructor...</p>
                ) : (
                  <div className="border border-[#ece6dd] rounded-2xl p-5 md:p-8 bg-[#f8f4ed] w-full">
                    {/* PROFILE ROW — two columns side by side at ALL breakpoints (never stacks
                        the photo above the stats, even on mobile):
                          LEFT column  = circular photo, with Name + Title directly beneath it
                          RIGHT column = Total Rating / Reviews / Students / Courses, icons
                                         aligned in a straight sequence with each other */}
                    <div className="flex flex-row items-start gap-8 sm:gap-12 md:gap-16">
                      {/* LEFT: photo + name + title, stacked as one column.
                          Column is a touch wider than the photo itself (photo size is
                          unchanged) so a typical two-word instructor name has room to sit
                          on a single line instead of wrapping. */}
                      <div className="flex flex-col items-center flex-shrink-0 w-32 sm:w-40 md:w-48">
                        <div className="w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 rounded-full overflow-hidden bg-[#f0ebe3] border-4 border-white shadow-md flex-shrink-0" style={{ aspectRatio: '1 / 1' }}>
                          {instructor.image && instructor.image.startsWith('http') ? (
                            <img src={instructor.image} alt={instructor.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-[#e8540a]">
                              <span className="text-white font-bold text-3xl sm:text-4xl md:text-5xl">{instructor.name?.charAt(0) || 'I'}</span>
                            </div>
                          )}
                        </div>
                        <p className="mt-3 font-bold text-[#1a1208] text-sm sm:text-lg md:text-xl leading-tight text-center whitespace-nowrap" style={{ fontFamily: "'Playfair Display', serif" }}>
                          {instructor.name}
                        </p>
                        {instructor.title && (
                          <p className="mt-1 text-sm sm:text-base md:text-lg text-[#9e9789] font-medium text-center break-words">{instructor.title}</p>
                        )}
                      </div>

                      {/* RIGHT: stat cards — 2x2 grid, Udemy-style.
                          NEW CHANGE AD: on Android the icon+gap were eating so much of each
                          card's already-narrow width that even single words like "Total" or
                          "Rating" didn't fit — and break-words was then splitting mid-word
                          ("TO"/"TAL", "RA"/"TING") to force them in, since overflow-wrap:
                          break-word breaks inside a word once it has no other choice. iPhone
                          happened to render the same layout just wide enough to never hit that
                          case, which is why it looked fine there. Real fix: (1) never let text
                          fracture mid-word — swap break-words for plain wrapping, which only
                          breaks at the space in "Total Rating" and otherwise lets a card clip
                          via its own overflow-hidden instead of shredding letters; (2) stack the
                          icon above the value/label at the smallest size instead of beside it,
                          so the label gets the card's full width to wrap into on narrow phones,
                          then return to the icon-beside-text row from sm: up. */}
                      <div className="grid grid-cols-2 gap-2 sm:gap-3.5 flex-1 min-w-0 pt-1 sm:pt-4 md:pt-6">
                        {[
                          { label: 'Total Rating', value: instructor.rating > 0 ? instructor.rating.toFixed(1) : '0', Icon: Star },
                          { label: 'Reviews', value: formatNumber(instructor.reviews), Icon: MessageCircle },
                          { label: 'Students', value: formatNumber(instructor.students), Icon: Users },
                          { label: 'Courses', value: formatNumber(instructor.courses), Icon: BookOpen },
                        ].map((stat) => {
                          const StatIcon = stat.Icon;
                          return (
                            <div key={stat.label} className="flex flex-col sm:flex-row items-center sm:items-center gap-1 sm:gap-3 bg-white rounded-xl border border-[#ece6dd] px-1.5 sm:px-4 py-2 sm:py-3 overflow-hidden text-center sm:text-left">
                              <div className="w-6 h-6 sm:w-9 sm:h-9 rounded-full bg-[#fdf0e4] flex items-center justify-center flex-shrink-0">
                                <StatIcon size={12} className="text-[#e8540a] sm:hidden" fill={StatIcon === Star ? 'currentColor' : 'none'} />
                                <StatIcon size={14} className="text-[#e8540a] hidden sm:block" fill={StatIcon === Star ? 'currentColor' : 'none'} />
                              </div>
                              <div className="min-w-0 flex-1 w-full">
                                <p className="text-sm sm:text-base md:text-lg font-bold text-[#1a1208] leading-tight">{stat.value}</p>
                                <p className="text-[10px] sm:text-xs text-[#9e9789] leading-tight whitespace-normal break-normal">{stat.label}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* INSTRUCTOR DESCRIPTION — one flowing mix of paragraphs, photos
                        and videos, in exactly the order set on the Instructor
                        Dashboard's Profile → Description page (not a separate
                        gallery below the text — a photo or video can sit right
                        after any paragraph). Open by default; "Show less"
                        collapses it, and clicking again re-expands. */}
                    <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t border-[#ece6dd] text-center sm:text-left">
                      {instructorFlowBlocks.length > 0 && (
                        <div className="mt-4">
                          {/* The fade overlay is scoped to ONLY this inner wrapper (not the
                              button below), and only shows up while collapsed. */}
                          <div className="relative">
                            <div className={`text-left space-y-4 ${!showFullInstructorDescription ? 'max-h-64 overflow-hidden' : ''}`}>
                              {instructorFlowBlocks.map((block) => {
                                if (block._kind === 'text') {
                                  if (!block.text) return null;
                                  return (
                                    <div
                                      key={block._key}
                                      className="text-[#3d3020] text-sm md:text-base leading-relaxed break-words lerni-prose max-w-none"
                                      dangerouslySetInnerHTML={{ __html: richTextToHtml(block.text) }}
                                    />
                                  );
                                }

                                const isVideo = block._kind === 'video';
                                const onImageClick = () => { setInstructorImageStartIndex(block._clickIndex); setInstructorImageOpen(true); };

                                return (
                                  <div key={block._key}>
                                    {block.heading && <p className={`${blockTextClass(block, 'heading')} text-[#1a1208] mb-2`}>{block.heading}</p>}
                                    {isVideo ? (
                                      <InstructorVideoBlock
                                        urls={block._urls}
                                        clickIndexes={block._clickIndexes}
                                        heading={block.heading}
                                        onOpen={(clickIndex) => { setInstructorVideoStartIndex(clickIndex); setInstructorVideoOpen(true); }}
                                      />
                                    ) : (
                                      <button
                                        onClick={onImageClick}
                                        className="block w-full rounded-xl overflow-hidden border border-[#ece6dd] shadow-sm hover:shadow-md transition cursor-pointer bg-white p-0"
                                      >
                                        <img src={block.imageUrl} alt={block.heading || 'Photo'} className="w-full max-h-80 object-cover" />
                                      </button>
                                    )}
                                    {block.description && <p className={`${blockTextClass(block, 'description')} text-[#9e9789] mt-2`}>{block.description}</p>}
                                  </div>
                                );
                              })}
                            </div>
                            {!showFullInstructorDescription && (
                              <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#f8f4ed] via-[#f8f4ed]/90 to-transparent pointer-events-none" />
                            )}
                          </div>
                          <button
                            onClick={() => setShowFullInstructorDescription((v) => !v)}
                            className="text-[#e8540a] hover:text-[#c94708] mt-3 text-sm md:text-base font-bold transition flex items-center gap-1 bg-transparent border-none cursor-pointer p-0 mx-auto sm:mx-0"
                          >
                            <span>{showFullInstructorDescription ? 'Show less' : 'Show more'}</span>
                            <ChevronDown size={16} className={`transition-transform ${showFullInstructorDescription ? 'rotate-180' : ''}`} />
                          </button>
                        </div>
                      )}

                      {(instructor.website || instructor.twitter || instructor.linkedin) && (
                        <div className="flex flex-wrap justify-center sm:justify-start gap-3 text-sm text-[#9e9789] mt-4">
                          {instructor.website && (
                            <a href={instructor.website.startsWith('http') ? instructor.website : `https://${instructor.website}`}
                              target="_blank" rel="noopener noreferrer"
                              className="text-[#e8540a] hover:underline">Website</a>
                          )}
                          {instructor.twitter && <span>Twitter: {instructor.twitter}</span>}
                          {instructor.linkedin && (
                            <a href={instructor.linkedin.startsWith('http') ? instructor.linkedin : `https://${instructor.linkedin}`}
                              target="_blank" rel="noopener noreferrer"
                              className="text-[#e8540a] hover:underline">LinkedIn</a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* ─────────────────────────────────────────────────────────────
                  TEXT REVIEWS — equal-height horizontal slider (no arrows).
                  Header reads "★ rating • X ratings". Every review card is the
                  same size; long reviews scroll internally via "Show more"
                  instead of stretching the card.
              ───────────────────────────────────────────────────────────── */}
              <div className="mb-8 md:mb-12 pt-6 md:pt-8 border-t border-[#ece6dd] w-full">
                <div
                  className="mb-6 md:mb-8 flex items-center gap-2 cursor-pointer w-fit"
                  role="button"
                  tabIndex={0}
                  onClick={openReviewsOverlay}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openReviewsOverlay(); } }}
                  aria-label="View all course reviews"
                >
                  <Star size={28} className="text-[#f9c97a] flex-shrink-0" fill="currentColor" />
                  <span className="text-2xl md:text-3xl font-bold text-[#1a1208]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {displayRating ? displayRating.toFixed(1) : '—'}
                  </span>
                  {displayRatingCount > 0 && (
                    <>
                      <span className="text-[#9e9789] text-lg md:text-xl">•</span>
                      <span className="text-sm md:text-base text-[#9e9789] font-medium underline decoration-[#9e9789]/40">
                        {formatNumber(displayRatingCount)} {displayRatingCount === 1 ? 'rating' : 'ratings'}
                      </span>
                    </>
                  )}
                </div>

                {displayReviews.length === 0 ? (
                  <div className="border border-dashed border-[#ddd5c4] rounded-2xl p-8 text-center bg-[#fbf8f3]">
                    <p className="text-[#9e9789] text-sm md:text-base">Be the first to leave a review for this course.</p>
                  </div>
                ) : (
                  <TextReviewsList reviews={displayReviews} onOpenReviews={openReviewsOverlay} />
                )}
              </div>

              {/* SHOW ALL REVIEWS — opens the Ratings & Reviews view inside this page */}
              <div className="mb-8 md:mb-12 pt-6 md:pt-8 border-t border-[#ece6dd] w-full">
                <button
                  onClick={openReviewsOverlay}
                  className="w-full bg-white hover:bg-[#fdf2ea] text-[#e8540a] font-bold py-3 md:py-3.5 rounded-xl transition text-base md:text-lg border-2 border-[#e8540a] cursor-pointer">
                  Show All Reviews
                </button>
              </div>

              {/* IMAGE TESTIMONIALS */}
              {imageTestimonials.length > 0 && (
                <div className="mb-8 md:mb-12 pt-6 md:pt-8 border-t border-[#ece6dd] w-full">
                  <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#1a1208] mb-2 md:mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>Student Testimonials</h2>
                  <p className="text-[#9e9789] text-sm md:text-base mb-4 md:mb-6">See what our students have to say</p>
                  <AutoSlideImageTestimonials
                    imageTestimonials={imageTestimonials}
                    onImageClick={(idx) => { setImageSliderStartIndex(idx); setImageSliderOpen(true); }}
                    isPaused={imageSliderOpen}
                  />
                </div>
              )}

              {/* VIDEO TESTIMONIALS */}
              {videoTestimonials.length > 0 && (
                <div className="mb-8 md:mb-12 pt-6 md:pt-8 border-t border-[#ece6dd] w-full">
                  <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#1a1208] mb-2 md:mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>Video Reviews</h2>
                  <p className="text-[#9e9789] text-sm md:text-base mb-4 md:mb-6">Watch authentic testimonials from our graduates</p>
                  <VideoReviewsSlider
                    videoTestimonials={videoTestimonials}
                    onCardClick={(idx) => { setVideoReelsStartIndex(idx); setVideoReelsOpen(true); }}
                    isPaused={videoReelsOpen}
                  />
                </div>
              )}

              {/* PROJECT GALLERY */}
              {projectGallery.length > 0 && (
                <div className="mb-8 md:mb-12 pt-6 md:pt-8 border-t border-[#ece6dd] w-full">
                  <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#1a1208] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>Project gallery</h2>
                  <p className="text-sm md:text-base text-[#9e9789] mb-4 md:mb-6">Student work and course outcomes</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                    {projectGallery.map((item) => (
                      <figure key={item.id || item._id || item.imageUrl}
                        className="group rounded-2xl overflow-hidden border border-[#ece6dd] bg-white shadow-sm hover:shadow-md transition">
                        <div className="aspect-video bg-[#f0ebe3] overflow-hidden">
                          <img src={item.imageUrl} alt={item.caption || "Project"}
                            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300" />
                        </div>
                        {item.caption && (
                          <figcaption className="px-3 py-2.5 text-sm md:text-base text-[#3d3020] border-t border-[#f0ebe3]">{item.caption}</figcaption>
                        )}
                      </figure>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar (Desktop) */}
            <div className="hidden lg:block lg:col-span-1">
              <div className="sticky top-24">
                <div className="bg-white border border-[#ece6dd] rounded-2xl p-6 mb-6 shadow-sm">
                  <h3 className="text-xl font-bold text-[#1a1208] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>This course includes:</h3>
                  <div className="space-y-3">
                    {[
                      { icon: Film, text: courseData.duration ? `${courseData.duration} on-demand video` : 'On-demand video' },
                      { icon: Download, text: 'Downloadable resources' },
                      { icon: Smartphone, text: 'Access on mobile and TV' },
                      { icon: Shield, text: 'Full lifetime access' },
                      { icon: Award, text: 'Certificate of completion' },
                    ].map((item, idx) => {
                      const Icon = item.icon;
                      return (
                        <div key={idx} className="flex items-center gap-3 pb-3 border-b border-[#f0ebe3] last:border-b-0 last:pb-0">
                          <Icon size={20} className="text-[#e8540a]" />
                          <p className="text-base text-[#3d3020]">{item.text}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* STUDENTS ALSO BOUGHT */}
          {studentsBoughtCourses.length > 0 && (
            <div className="mt-12 md:mt-16 pt-8 md:pt-12 border-t border-[#ece6dd]">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#1a1208] mb-6 md:mb-8" style={{ fontFamily: "'Playfair Display', serif" }}>Students also bought</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {studentsBoughtCourses.map(course => (
                  <div key={course._id} onClick={() => navigate(`/course/${course._id}`)}
                    className="bg-white border border-[#ece6dd] rounded-2xl overflow-hidden hover:shadow-lg transition cursor-pointer group">
                    <div className="h-36 md:h-44 bg-[#f0ebe3] flex items-center justify-center relative overflow-hidden">
                      {course.thumbnail
                        ? <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        : <span className="text-5xl md:text-6xl">{course.emoji || '📚'}</span>}
                    </div>
                    <div className="p-3 md:p-4">
                      <h3 className="font-bold text-[#1a1208] text-sm md:text-base mb-2 line-clamp-2 group-hover:text-[#e8540a] transition">{course.title}</h3>
                      <p className="text-xs md:text-sm text-[#9e9789] mb-2">{course.instructor || 'Instructor'}</p>
                      <div className="flex items-center gap-1 mb-2">
                        <span className="font-bold text-sm md:text-base text-[#1a1208]">{course.rating}</span>
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} size={12} className="text-[#f9c97a]" fill={i < Math.floor(course.rating) ? 'currentColor' : 'none'} />
                          ))}
                        </div>
                        <span className="text-xs md:text-sm text-[#9e9789]">({formatNumber(course.reviews)})</span>
                      </div>
                      <p className="text-base md:text-lg font-bold text-[#1a1208]" style={{ fontFamily: "'Playfair Display', serif" }}>${course.price}</p>
                      {course.bestseller && <span className="inline-block bg-[#f9c97a] text-[#7a4a00] font-bold px-2 py-1 rounded text-xs mt-2">Bestseller</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#1a1208] text-[#9e8e7a] py-8 md:py-12 w-full border-t border-[#2d2416]">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="grid md:grid-cols-3 gap-8 md:gap-12 mb-8 md:mb-10">
            {/* Logo + address/phone/email — same brand mark as before, now
                pulled from Super Admin → Settings when one has been uploaded,
                falling back to the original text wordmark otherwise. */}
            <div>
              <button onClick={() => handleNavigate('/')}
                className="cursor-pointer hover:opacity-80 transition bg-transparent border-none p-0 block mb-4">
                {footerLogoUrl ? (
                  <img src={footerLogoUrl} alt="Logo" className="h-16 md:h-20 w-auto object-contain" />
                ) : (
                  <span className="text-xl md:text-2xl font-extrabold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                    Ler<span className="text-[#f9c97a]">ni</span>
                  </span>
                )}
              </button>
              <div className="text-xs md:text-sm space-y-2 leading-relaxed">
                <p className="flex items-start gap-2"><span aria-hidden="true">📍</span><span>Motiviam Pvt Ltd Building Opposite Attock Petrol Pump Adjacent Baluchistan Marble Ghazikot Mansehra</span></p>
                <p className="flex items-center gap-2">
                  <span aria-hidden="true">📞</span>
                  <a href="tel:03446199711" className="hover:text-white transition">03446199711</a>
                </p>
                <p className="flex items-center gap-2">
                  <span aria-hidden="true">✉️</span>
                  <a href="mailto:motiviampvtltd@gmail.com" className="hover:text-white transition">motiviampvtltd@gmail.com</a>
                </p>
              </div>
            </div>

            {/* FAQ-style accordion — About / Policies / Contact Us. Chevron
                points down while closed, up while open. */}
            <div>
              {[
                { key: 'about',    label: 'About',      rows: [{ label: 'About Page', path: '/about' }] },
                { key: 'policies', label: 'Policies',    rows: [{ label: '1. Return Policy', path: '/return-policy' }, { label: '2. Privacy Policy', path: '/privacy-policy' }] },
                { key: 'contact',  label: 'Contact Us',  rows: [{ label: 'Contact Us', path: '/contact-us' }] },
              ].map((tab) => {
                const isOpen = openFooterTab === tab.key;
                return (
                  <div key={tab.key} className="border-b border-[#2d2416]">
                    <button
                      onClick={() => setOpenFooterTab(isOpen ? null : tab.key)}
                      className="w-full flex items-center justify-between py-3 bg-transparent border-none cursor-pointer text-left"
                    >
                      <span className="font-bold text-[#f9c97a] text-xs md:text-sm uppercase tracking-wide">{tab.label}</span>
                      <ChevronDown size={16} className={`text-[#9e8e7a] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isOpen && (
                      <ul className="pb-3 space-y-2 text-xs md:text-sm">
                        {tab.rows.map((row) => (
                          <li key={row.path}>
                            <button onClick={() => handleNavigate(row.path)} className="hover:text-white transition bg-transparent border-none cursor-pointer text-[#9e8e7a] p-0 text-left">
                              {row.label}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Newsletter — outside the accordion tabs */}
            <div>
              <h3 className="font-bold text-[#f9c97a] mb-3 text-xs md:text-sm uppercase tracking-wide">Newsletter</h3>
              <p className="text-xs md:text-sm mb-3">Get news and updates in your inbox.</p>
              <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                <input
                  type="email"
                  required
                  value={newsletterEmail}
                  onChange={(e) => { setNewsletterEmail(e.target.value); if (newsletterStatus !== 'sending') setNewsletterStatus('idle'); }}
                  placeholder="you@example.com"
                  className="flex-1 min-w-0 bg-[#241c10] border border-[#2d2416] rounded-lg px-3 py-2 text-xs md:text-sm text-white placeholder-[#6b5e4e] focus:outline-none focus:ring-2 focus:ring-[#e8540a]"
                />
                <button
                  type="submit"
                  disabled={newsletterStatus === 'sending'}
                  className="flex-shrink-0 bg-[#e8540a] hover:bg-[#c94708] disabled:opacity-60 text-white text-xs md:text-sm font-semibold px-4 py-2 rounded-lg transition border-none cursor-pointer"
                >
                  {newsletterStatus === 'sending' ? '...' : 'Send'}
                </button>
              </form>
              {newsletterStatus === 'sent' && <p className="text-xs text-emerald-400 mt-2">✓ Subscribed — thanks!</p>}
              {newsletterStatus === 'error' && <p className="text-xs text-red-400 mt-2">Something went wrong — try again.</p>}
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center pt-6 md:pt-8 border-t border-[#2d2416] gap-3">
            <button onClick={() => handleNavigate('/')}
              className="text-xl md:text-2xl font-extrabold text-white cursor-pointer hover:opacity-80 transition bg-transparent border-none p-0"
              style={{ fontFamily: "'Playfair Display', serif" }}>
              {footerLogoUrl ? <img src={footerLogoUrl} alt="Logo" className="h-12 md:h-14 w-auto object-contain" /> : <>Ler<span className="text-[#f9c97a]">ni</span></>}
            </button>
            <p className="text-xs md:text-sm text-[#6b5e4e]">© {new Date().getFullYear()} Motiviam Pvt Ltd. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* STICKY BOTTOM BAR — MOBILE */}
      <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-white border-t-2 border-[#ece6dd] p-3 md:p-4 z-50 flex items-center w-full shadow-2xl">
        <button
          onClick={handleEnrollClick}
          style={{
            background: 'linear-gradient(135deg, #FF5A00 0%, #FF6A00 100%)',
            boxShadow: '0 8px 24px rgba(255, 90, 0, 0.25)',
            fontFamily: "'Inter', 'SF Pro Display', 'Poppins', sans-serif",
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            cursor: 'pointer',
            width: '100%',
          }}
          className="text-white py-2.5 md:py-3 rounded-xl transition text-sm md:text-base whitespace-nowrap"
        >
          {discountPct ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', flexWrap: 'nowrap' }}>
              <span style={{ color: '#FFFFFF' }}>Enroll Now In {priceLabel}</span>
              <span style={{ color: '#FFFFFF', margin: '0 2px' }}> • </span>
              <span style={{ color: '#000000' }}>{discountPct}% OFF</span>
            </span>
          ) : (
            <span style={{ color: '#FFFFFF' }}>Enroll Now In {priceLabel}</span>
          )}
        </button>
      </div>

      <div className="h-16 md:h-20 lg:h-0" />

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Playfair+Display:wght@700;800;900&display=swap');

        .lerni-prose { line-height: 1.8; }
        .lerni-prose p { margin: 0.85rem 0; }
        .lerni-prose ul { list-style-type: disc; padding-left: 1.5rem; margin: 0.75rem 0; }
        .lerni-prose ol { list-style-type: decimal; padding-left: 1.5rem; margin: 0.75rem 0; }
        .lerni-prose li { margin: 0.35rem 0; line-height: 1.7; }
        .lerni-prose strong, .lerni-prose b { font-weight: 700; color: #1a1208; }
        .lerni-prose em, .lerni-prose i { font-style: italic; }
        .lerni-prose u { text-decoration: underline; }
        .lerni-prose h1 { font-family: 'Playfair Display', serif; font-size: 1.75rem; font-weight: 800; margin: 1.75rem 0 0.75rem; color: #1a1208; line-height: 1.2; }
        .lerni-prose h2 { font-family: 'Playfair Display', serif; font-size: 1.4rem; font-weight: 700; margin: 1.5rem 0 0.65rem; color: #1a1208; line-height: 1.25; }
        .lerni-prose h3 { font-family: 'Playfair Display', serif; font-size: 1.15rem; font-weight: 700; margin: 1.25rem 0 0.5rem; color: #1a1208; }
        .lerni-prose h4, .lerni-prose h5, .lerni-prose h6 { font-family: 'Playfair Display', serif; font-weight: 700; margin: 1rem 0 0.5rem; color: #1a1208; }
        .lerni-prose a { color: #e8540a; text-decoration: underline; }
        .lerni-prose a:hover { color: #c94708; }
        .lerni-prose blockquote { border-left: 3px solid #e8540a; padding-left: 1rem; margin: 1rem 0; color: #6b5e4e; font-style: italic; }
        .lerni-prose code { background: #f0ebe3; color: #1a1208; padding: 0.1em 0.35em; border-radius: 4px; font-size: 0.88em; }
        .lerni-prose hr { border: none; border-top: 1px solid #ece6dd; margin: 1.5rem 0; }
      `}</style>
    </div>
  );
}
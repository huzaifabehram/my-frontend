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
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronDown, Play, Star, Users, Clock, BookOpen, Menu, X, Search, Check, Award, Smartphone, Film, Download, Globe, Shield, ChevronLeft, ChevronRight, MessageCircle, Share2, Bookmark, ThumbsUp, Volume2, VolumeX } from 'lucide-react';
import { useCourses } from '../context/CoursesContext';
import { useAuth } from '../context/AuthContext';
import {
  trackViewContent,
  trackAddToCart,
  setPendingCourse,
} from '../utils/facebookPixel';
import FreeLectureVideoTracker, { FreeLectureIframeTracker } from '../components/FreeLectureVideoTracker';

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
        <iframe src={ytSrc} className="absolute inset-0 w-full h-full object-cover"
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
// VIDEO SLIDER CARD
// ─────────────────────────────────────────────────────────────────────────────
const VideoSliderCard = React.forwardRef(function VideoSliderCard({ videoUrl, onClick, index, isActive }, ref) {
  const ytId = getYouTubeId(videoUrl);

  return (
    <div
      className="flex-shrink-0 rounded-xl overflow-hidden relative cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-300"
      style={{ width: '200px', height: '390px' }}
      onClick={onClick}
    >
      {ytId ? (
        <img
          src={`https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`}
          alt="Video thumbnail"
          className="w-full h-full object-cover"
        />
      ) : (
        <video
          ref={ref}
          src={videoUrl}
          className="w-full h-full object-cover"
          muted
          loop
          playsInline
          preload="metadata"
        />
      )}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />
    </div>
  );
});

function VideoReviewsSlider({ videoTestimonials, onCardClick }) {
  const sliderRef  = useRef(null);
  const cardRefs   = useRef([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const getCardRef = (idx) => (el) => { cardRefs.current[idx] = el; };

  useEffect(() => {
    cardRefs.current.forEach((videoEl, idx) => {
      if (!videoEl) return;
      if (idx === activeIndex) {
        videoEl.muted = true;
        videoEl.play().catch(() => {});
      } else {
        videoEl.pause();
      }
    });
  }, [activeIndex]);

  useEffect(() => {
    const cards = sliderRef.current?.querySelectorAll('[data-video-card]');
    if (!cards || cards.length === 0) return;

    const ratios = new Array(videoTestimonials.length).fill(0);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const idx = Number(entry.target.dataset.videoCard);
          ratios[idx] = entry.intersectionRatio;
        });
        let best = 0;
        ratios.forEach((r, i) => { if (r > ratios[best]) best = i; });
        setActiveIndex(best);
      },
      {
        root: sliderRef.current,
        threshold: Array.from({ length: 21 }, (_, i) => i / 20),
      }
    );

    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [videoTestimonials.length]);

  return (
    <div
      ref={sliderRef}
      className="flex gap-3 overflow-x-auto px-1 pb-4"
      style={{
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        scrollSnapType: 'x mandatory',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {videoTestimonials.map((testimonial, idx) => {
        const ytId = getYouTubeId(testimonial.videoUrl);
        return (
          <div
            key={idx}
            data-video-card={idx}
            style={{ scrollSnapAlign: 'center', flexShrink: 0 }}
          >
            <VideoSliderCard
              ref={ytId ? null : getCardRef(idx)}
              videoUrl={testimonial.videoUrl}
              index={idx}
              isActive={idx === activeIndex}
              onClick={() => onCardClick(idx)}
            />
          </div>
        );
      })}
    </div>
  );
}

function VideoFullScreenViewer({ isOpen, onClose, videos, startIndex = 0, likes, onLike }) {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const videoRefs = useRef([]);

  useEffect(() => {
    if (isOpen) { document.body.style.overflow = 'hidden'; setCurrentIndex(startIndex); }
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen, startIndex]);

  useEffect(() => {
    videoRefs.current.forEach((video, idx) => {
      if (!video) return;
      if (idx === currentIndex) { video.muted = false; video.play().catch(() => {}); }
      else { video.pause(); video.muted = true; }
    });
  }, [currentIndex]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowDown' && currentIndex < videos.length - 1) setCurrentIndex(i => i + 1);
      if (e.key === 'ArrowUp' && currentIndex > 0) setCurrentIndex(i => i - 1);
    };
    if (isOpen) window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose, currentIndex, videos.length]);

  if (!isOpen) return null;

  const currentVideo = videos[currentIndex];
  const ytId = currentVideo ? getYouTubeId(currentVideo.videoUrl) : null;

  return (
    <div className="fixed inset-0 bg-black z-[9999] flex flex-col items-center justify-center">
      <button onClick={onClose}
        className="fixed top-4 right-4 z-50 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition border-none cursor-pointer">
        <X size={24} />
      </button>

      {currentIndex > 0 && (
        <button onClick={() => setCurrentIndex(i => i - 1)}
          className="fixed left-4 top-1/2 -translate-y-1/2 z-50 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition border-none cursor-pointer">
          <ChevronLeft size={26} />
        </button>
      )}
      {currentIndex < videos.length - 1 && (
        <button onClick={() => setCurrentIndex(i => i + 1)}
          className="fixed right-16 top-1/2 -translate-y-1/2 z-50 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition border-none cursor-pointer">
          <ChevronRight size={26} />
        </button>
      )}

      <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-sm px-3 py-1 rounded-full z-50">
        {currentIndex + 1} / {videos.length}
      </div>

      <div className="relative w-full h-full flex items-center justify-center">
        {ytId ? (
          <div className="w-full max-w-3xl aspect-video">
            <iframe
              src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=0&controls=1&playsinline=1`}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen title="Video" style={{ border: 'none' }} />
          </div>
        ) : (
          <video
            ref={(el) => (videoRefs.current[currentIndex] = el)}
            src={currentVideo?.videoUrl}
            className="max-h-screen max-w-full object-contain"
            controls autoPlay playsInline />
        )}

        <div className="fixed right-3 bottom-28 flex flex-col items-center gap-5 text-white z-50">
          <button
            onClick={() => onLike(currentIndex)}
            className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer">
            <div className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition">
              <ThumbsUp size={22} />
            </div>
            <span className="text-xs font-semibold">{(likes[currentIndex] || 6690).toLocaleString()}</span>
          </button>
          <button className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer">
            <div className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition">
              <MessageCircle size={22} />
            </div>
            <span className="text-xs">{currentVideo?.comments || 0}</span>
          </button>
          <button className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer">
            <div className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition">
              <Share2 size={22} />
            </div>
            <span className="text-xs">Share</span>
          </button>
          <button className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer">
            <div className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition">
              <Bookmark size={22} />
            </div>
            <span className="text-xs">Save</span>
          </button>
        </div>

        <div className="fixed bottom-8 left-4 max-w-[65%] text-white z-50">
          {currentVideo?.author && <p className="font-bold text-base mb-1">{currentVideo.author}</p>}
          {currentVideo?.text && <p className="text-sm leading-relaxed line-clamp-3 text-white/80">{currentVideo.text}</p>}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTO-SLIDE IMAGE TESTIMONIALS CAROUSEL
// ─────────────────────────────────────────────────────────────────────────────
function AutoSlideImageTestimonials({ imageTestimonials }) {
  const sectionRef  = useRef(null);
  const [isPaused, setIsPaused] = useState(false);
  const isPausedRef = useRef(false);
  const CARD_WIDTH = 200;
  const CARD_GAP   = 12;
  const totalDuration = imageTestimonials.length * 4;

  const pause  = () => { isPausedRef.current = true;  setIsPaused(true);  };
  const resume = () => { isPausedRef.current = false; setIsPaused(false); };

  useEffect(() => {
    const handleSectionWheel = () => pause();
    const handleSectionTouch = () => pause();
    const handleWindowWheel  = (e) => { if (isPausedRef.current && sectionRef.current && !sectionRef.current.contains(e.target)) resume(); };
    const handleWindowTouch  = (e) => { if (isPausedRef.current && sectionRef.current && !sectionRef.current.contains(e.target)) resume(); };
    const section = sectionRef.current;
    if (section) {
      section.addEventListener('wheel',     handleSectionWheel, { passive: true });
      section.addEventListener('touchmove', handleSectionTouch, { passive: true });
    }
    window.addEventListener('wheel',     handleWindowWheel, { passive: true });
    window.addEventListener('touchmove', handleWindowTouch, { passive: true });
    return () => {
      if (section) {
        section.removeEventListener('wheel',     handleSectionWheel);
        section.removeEventListener('touchmove', handleSectionTouch);
      }
      window.removeEventListener('wheel',     handleWindowWheel);
      window.removeEventListener('touchmove', handleWindowTouch);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const doubled = [...imageTestimonials, ...imageTestimonials];

  return (
    <div ref={sectionRef} className="relative select-none">
      <style>{`
        @keyframes testimonial-marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .testimonial-track {
          animation: testimonial-marquee ${totalDuration}s linear infinite;
          will-change: transform;
        }
        .testimonial-track.paused { animation-play-state: paused; }
      `}</style>
      <div className="overflow-hidden" style={{
        WebkitMaskImage: 'linear-gradient(to right, transparent 0px, black 40px, black calc(100% - 40px), transparent 100%)',
        maskImage: 'linear-gradient(to right, transparent 0px, black 40px, black calc(100% - 40px), transparent 100%)',
      }}>
        <div className={`testimonial-track flex pb-3${isPaused ? ' paused' : ''}`}
          style={{ gap: `${CARD_GAP}px`, width: 'max-content' }}>
          {doubled.map((testimonial, idx) => (
            <div key={idx} className="flex-shrink-0 rounded-xl overflow-hidden relative shadow-lg"
              style={{ width: `${CARD_WIDTH}px`, height: '390px', cursor: 'default' }}
              aria-hidden={idx >= imageTestimonials.length}>
              <img src={testimonial.imageUrl} alt={testimonial.author || 'Student testimonial'}
                className="w-full h-full object-cover" draggable={false} />
              <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/75 to-transparent pointer-events-none" />
              {testimonial.author && (
                <p className="absolute bottom-3 left-3 right-3 text-white text-sm font-semibold pointer-events-none drop-shadow line-clamp-1">
                  {testimonial.author}
                </p>
              )}
            </div>
          ))}
        </div>
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

function formatNumber(num) {
  if (!num) return '0';
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
  if (num >= 1_000)     return (num / 1_000).toFixed(1) + 'K';
  return String(num);
}

// ─────────────────────────────────────────────────────────────────────────────
// FIX 5: REVIEW NORMALIZATION — broadened to catch every possible backend shape
// ─────────────────────────────────────────────────────────────────────────────
function normalizeReview(raw, idx) {
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
  // This is the field that was silently missing before.
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

  // Warn in dev if we still ended up with nothing, so the backend field can be identified
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
  // Server _id is always unique and preferred. When absent (e.g. optimistic
  // local reviews), combine author + text snippet + createdAt timestamp so
  // the same person can submit multiple reviews and each gets its own card.
  const textSnippet = text.slice(0, 30).replace(/\s+/g, '-');
  const tsSnippet   = dateRaw ? String(dateRaw).slice(0, 24) : String(idx);
  const key = raw._id || raw.id || raw.reviewId || raw.review_id
    || `review-${author}-${textSnippet}-${tsSnippet}`;

  return { key, author, text, rating, date, avatar, userId: raw.userId || raw.user_id || raw.user?._id || null };
}

// ─────────────────────────────────────────────────────────────────────────────
// TEXT REVIEWS SLIDER — Udemy-style horizontal cards
// ─────────────────────────────────────────────────────────────────────────────
function TextReviewsSlider({ reviews }) {
  const sliderRef = useRef(null);
  const [canScrollLeft,  setCanScrollLeft]  = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollButtons = useCallback(() => {
    const el = sliderRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateScrollButtons();
    const el = sliderRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScrollButtons, { passive: true });
    window.addEventListener('resize', updateScrollButtons);
    return () => {
      el.removeEventListener('scroll', updateScrollButtons);
      window.removeEventListener('resize', updateScrollButtons);
    };
  }, [reviews.length, updateScrollButtons]);

  const scroll = (dir) => {
    const el = sliderRef.current;
    if (!el) return;
    const card = el.querySelector('[data-review-card]');
    const step = card ? card.offsetWidth + 16 : 360;
    el.scrollBy({ left: dir * step, behavior: 'smooth' });
  };

  if (!reviews.length) return null;

  return (
    <div className="relative group">
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scroll(-1)}
          aria-label="Previous reviews"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white shadow-lg border border-[#ece6dd] flex items-center justify-center text-[#1a1208] hover:bg-[#fdf2ea] hover:text-[#e8540a] transition cursor-pointer"
        >
          <ChevronLeft size={22} />
        </button>
      )}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => scroll(1)}
          aria-label="Next reviews"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white shadow-lg border border-[#ece6dd] flex items-center justify-center text-[#1a1208] hover:bg-[#fdf2ea] hover:text-[#e8540a] transition cursor-pointer"
        >
          <ChevronRight size={22} />
        </button>
      )}

      <div
        ref={sliderRef}
        className="flex gap-4 overflow-x-auto px-1 py-1 scroll-smooth"
        style={{
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {reviews.map((review) => (
          <div
            key={review.key}
            data-review-card
            className="flex-shrink-0 w-[min(88vw,340px)] md:w-[380px] bg-white rounded-2xl shadow-sm hover:shadow-md transition border border-[#ece6dd] p-5 flex flex-col gap-3"
            style={{ scrollSnapAlign: 'start' }}
          >
            <div className="flex items-start gap-3 md:gap-4">
              <div
                className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-[#e8540a] text-white flex items-center justify-center font-bold text-lg md:text-xl flex-shrink-0 overflow-hidden"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {review.avatar ? (
                  <img src={review.avatar} alt={review.author} className="w-full h-full object-cover" />
                ) : (
                  review.author.charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[#1a1208] text-base md:text-lg leading-tight truncate">{review.author}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        className="text-[#f9c97a]"
                        fill={i < Math.round(review.rating) ? 'currentColor' : 'none'}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-semibold text-[#1a1208]">{review.rating.toFixed(1)}</span>
                  {review.date && (
                    <span className="text-xs md:text-sm text-[#9e9789]">• {review.date}</span>
                  )}
                </div>
              </div>
            </div>
            {review.text ? (
              <p className="text-[#3d3020] text-sm md:text-base leading-relaxed line-clamp-6">{review.text}</p>
            ) : (
              <p className="text-[#b0a898] text-sm italic">No written feedback provided.</p>
            )}
          </div>
        ))}
      </div>
    </div>
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
  const [expandedSection,       setExpandedSection]       = useState([0]);
  const [showFullDescription,   setShowFullDescription]   = useState(false);
  const [showFullInstructorBio, setShowFullInstructorBio] = useState(false);
  const [showFullInstructorDescription, setShowFullInstructorDescription] = useState(false);
  const [isPreviewOpen,         setIsPreviewOpen]         = useState(false);
  const [currentVideo,          setCurrentVideo]          = useState('');
  const [activePreviewLecture,  setActivePreviewLecture]  = useState(null);
  const [fullCourse,            setFullCourse]            = useState(null);
  const [fullCourseLoading,     setFullCourseLoading]     = useState(false);
  const [instructorData,        setInstructorData]        = useState(null);
  const [loadingInstructor,     setLoadingInstructor]     = useState(false);
  const [showReviewForm,        setShowReviewForm]        = useState(false);
  const [reviewText,            setReviewText]            = useState('');
  const [reviewAuthorName,      setReviewAuthorName]      = useState('');
  const [reviewRating,          setReviewRating]          = useState(5);
  const [submittingReview,      setSubmittingReview]      = useState(false);
  const [videoReelsOpen,        setVideoReelsOpen]        = useState(false);
  const [videoReelsStartIndex,  setVideoReelsStartIndex]  = useState(0);
  const [imageSliderOpen,       setImageSliderOpen]       = useState(false);
  const [imageSliderStartIndex, setImageSliderStartIndex] = useState(0);

  const [localNewReviews,   setLocalNewReviews]   = useState([]);
  const [fetchedReviews,    setFetchedReviews]    = useState([]);

  const descriptionRef = useRef(null);
  const viewContentFiredRef = useRef(null);

  const [videoLikes, setVideoLikes] = useState({});
  const handleVideoLike = useCallback((idx) => {
    setVideoLikes(prev => ({ ...prev, [idx]: (prev[idx] ?? 6690) + 1 }));
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

  useEffect(() => {
    if (user?.name && !reviewAuthorName) {
      setReviewAuthorName(user.name);
    }
  }, [user?.name]); // eslint-disable-line react-hooks/exhaustive-deps

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
    setShowFullInstructorDescription(false);
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
    navigate(`/auth/register?redirect=${encodeURIComponent('/portal')}&courseId=${courseId}`);
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

  // ─── FIX 3: Review submission ─────────────────────────────────────────────
  const handleReviewSubmit = async (e) => {
    e.preventDefault();

    const trimmedName = reviewAuthorName.trim();
    if (!trimmedName) {
      alert('Please enter your name');
      return;
    }

    if (!reviewText.trim()) {
      alert('Please write a review');
      return;
    }

    setSubmittingReview(true);

    const optimisticReview = {
      _id: `local-${Date.now()}`,
      text: reviewText,
      rating: reviewRating,
      author: trimmedName,
      authorName: trimmedName,
      createdAt: new Date().toISOString(),
      userId: user?._id || user?.id || null,
    };

    try {
      const res = await api.post(`/courses/${courseData._id}/reviews`, {
        text: reviewText,
        rating: reviewRating,
        authorName: trimmedName,
      });

      const created = res?.data?.review || res?.data || optimisticReview;
      setLocalNewReviews(prev => [created, ...prev]);

      setReviewText('');
      setReviewRating(5);
      if (!user) setReviewAuthorName('');
      setShowReviewForm(false);
      alert('Review submitted successfully!');

      // Re-fetch in the background. Only drop the optimistic local copy once
      // the server actually echoes reviews back — some backends are eventually
      // consistent and the re-fetch may arrive before the write is visible,
      // which would make the card vanish until the next hard refresh.
      fetchCourseById(courseData._id).then(updatedCourse => {
        if (!updatedCourse) return;
        setFullCourse(updatedCourse);
        const serverReviewCount =
          (Array.isArray(updatedCourse.reviews_list) ? updatedCourse.reviews_list.filter(r => r && typeof r === 'object').length : 0) +
          (Array.isArray(updatedCourse.reviews) ? updatedCourse.reviews.filter(r => r && typeof r === 'object').length : 0);
        // Only clear optimistic list once server confirms reviews exist
        if (serverReviewCount > 0) setLocalNewReviews([]);
      }).catch(() => { /* network error — keep local copy visible */ });

      api.get(`/courses/${courseData._id}/reviews`)
        .then((res) => setFetchedReviews(Array.isArray(res.data) ? res.data : []))
        .catch(() => {});
    } catch (err) {
      console.error('Failed to submit review:', err);
      setLocalNewReviews(prev => [optimisticReview, ...prev]);
      setReviewText('');
      setReviewRating(5);
      if (!user) setReviewAuthorName('');
      setShowReviewForm(false);
      const msg = err?.response?.data?.message || 'Could not reach the server — your review is shown locally and will sync once you retry.';
      alert(msg);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading || fullCourseLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFAF6]">
        <div className="w-12 h-12 border-4 border-[#e8540a] border-t-transparent rounded-full animate-spin" />
      </div>
    );
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
  };

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
  const priceLabel = `PKR ${(courseData.price * 280).toLocaleString()}`;

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
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#e8540a] group-hover:bg-[#c94708] flex items-center justify-center transition">
                          <Play size={14} className="text-white ml-0.5" fill="currentColor" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm md:text-base text-white group-hover:text-[#f0a070] transition truncate">{lecture.title}</p>
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

      {/* FULL-SCREEN VIDEO VIEWER */}
      <VideoFullScreenViewer
        isOpen={videoReelsOpen}
        onClose={() => setVideoReelsOpen(false)}
        videos={videoTestimonials}
        startIndex={videoReelsStartIndex}
        likes={videoLikes}
        onLike={handleVideoLike}
      />

      {/* ANNOUNCEMENT BAR */}
      {courseData.discountPrice && courseData.discountPrice < courseData.originalPrice && (
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
                🎉 Limited Time Offer: Save {Math.round((1 - courseData.discountPrice / courseData.originalPrice) * 100)}% — Ends Soon!
                &nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;
                🎉 Limited Time Offer: Save {Math.round((1 - courseData.discountPrice / courseData.originalPrice) * 100)}% — Ends Soon!
              </span>
            ))}
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white shadow-sm w-full border-b border-[#ece6dd]">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-3 md:py-4 flex items-center justify-between">
          <button className="lg:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={24} /> : <ChevronDown size={24} className="rotate-[-90deg]" />}
          </button>
          <div className="absolute left-1/2 transform -translate-x-1/2 lg:relative lg:left-auto lg:transform-none">
            <button onClick={() => handleNavigate('/')}
              className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-[#1a1208] cursor-pointer hover:opacity-80 transition bg-transparent border-none p-0"
              style={{ fontFamily: "'Playfair Display', serif" }}>
              Ler<span className="text-[#e8540a]">ni</span>
            </button>
          </div>
          <nav className="hidden lg:flex items-center gap-8 flex-1 ml-12">
            <button onClick={() => handleNavigate('/courses')} className="text-base text-[#3d3020] hover:text-[#e8540a] transition bg-transparent border-none cursor-pointer p-0 font-medium">Categories</button>
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
                <button onClick={() => handleNavigate('/courses')} className="block w-full text-left text-white hover:text-[#f0a070] bg-transparent border-none cursor-pointer p-3 rounded-lg hover:bg-white/5 font-medium transition text-base">Categories</button>
                <button onClick={() => handleNavigate('/instructor')} className="block w-full text-left text-white hover:text-[#f0a070] bg-transparent border-none cursor-pointer p-3 rounded-lg hover:bg-white/5 font-medium transition text-base">Instructor</button>
              </div>
            </div>
          </>
        )}
      </header>

      {/* BREADCRUMB */}
      <div className="bg-white border-b border-[#ece6dd]">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-2 md:py-3 text-sm md:text-base text-[#9e9789] w-full flex items-center gap-2 overflow-x-auto">
          <button onClick={() => handleNavigate('/')} className="hover:text-[#e8540a] bg-transparent border-none cursor-pointer text-[#9e9789] p-0 transition whitespace-nowrap">Development</button>
          <ChevronDown size={16} className="rotate-[-90deg] text-[#ccc5b8] flex-shrink-0" />
          <button onClick={() => handleNavigate('/courses')} className="hover:text-[#e8540a] bg-transparent border-none cursor-pointer text-[#9e9789] p-0 transition whitespace-nowrap">{courseData.category || 'Courses'}</button>
          <ChevronDown size={16} className="rotate-[-90deg] text-[#ccc5b8] flex-shrink-0" />
          <span className="text-[#1a1208] font-semibold truncate">{courseData.title}</span>
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
              <div className="flex flex-wrap items-center gap-3 md:gap-4 mb-4 md:mb-6">
                {courseData.rating > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-[#f9c97a] font-bold text-sm md:text-base">{courseData.rating}</span>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={16} className="text-[#f9c97a] md:w-5 md:h-5" fill={i < Math.floor(courseData.rating) ? 'currentColor' : 'none'} />
                      ))}
                    </div>
                    <span className="text-[#c8bfaf] text-sm md:text-base">({courseData.reviews?.toLocaleString?.() || textReviews.length} ratings)</span>
                  </div>
                )}
                {courseData.students > 0 && (
                  <div className="flex items-center gap-1.5 text-[#c8bfaf] text-sm md:text-base">
                    <Users size={16} /><span>{courseData.students.toLocaleString()} students</span>
                  </div>
                )}
              </div>
              <div className="mb-4 md:mb-6">
                <p className="text-[#9e8e7a] text-sm md:text-base">
                  Created by{' '}
                  <button onClick={() => handleNavigate('/instructor')}
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
                <div className="flex items-center gap-1.5"><Globe size={16} /><span>{courseData.language || 'English'}</span></div>
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

              {/* COURSE CONTENT */}
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
                            className="w-full px-4 md:px-5 py-3 md:py-4 flex items-center justify-between bg-[#f8f4ed] hover:bg-[#f0ebe3] transition border-none cursor-pointer">
                            <div className="flex items-center gap-2 md:gap-3 flex-1 text-left min-w-0">
                              <ChevronDown size={18} className={`text-[#9e9789] transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-[#1a1208] text-base md:text-lg truncate">{section.title}</h3>
                                <p className="text-sm text-[#9e9789] mt-1">{section.lectures || 0} lectures{section.duration ? ` • ${section.duration}` : ''}</p>
                              </div>
                            </div>
                          </button>
                          {isExpanded && section.lectures_list?.length > 0 && (
                            <div className="border-t border-[#ece6dd] bg-white">
                              {section.lectures_list.map((lecture, lectureIdx) => (
                                <div key={lectureIdx} className="px-4 md:px-6 py-3 md:py-3.5 border-b border-[#f0ebe3] last:border-b-0 flex items-center justify-between hover:bg-[#fbf8f3] transition">
                                  <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-[#f0ebe3] flex items-center justify-center flex-shrink-0">
                                      {lecture.type === 'video'
                                        ? <Play size={12} className="text-[#6b5e4e] ml-0.5" />
                                        : <BookOpen size={12} className="text-[#6b5e4e]" />}
                                    </div>
                                    <p className="text-[#1a1208] text-sm md:text-base font-medium truncate">{lecture.title}</p>
                                  </div>
                                  <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
                                    {lecture.duration && <span className="text-sm text-[#9e9789]">{lecture.duration}</span>}
                                    {lecture.preview && lecture.videoUrl && (
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleLectureClick(lecture); }}
                                        className="flex items-center bg-[#fde8d8] hover:bg-[#fbdcc3] text-[#9a3c0e] font-bold text-xs md:text-sm cursor-pointer border-none whitespace-nowrap transition px-2.5 py-1.5 rounded-full">
                                        Free Lecture
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
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
                      dangerouslySetInnerHTML={{ __html: courseData.description }}
                    />
                    {!showFullDescription && (
                      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white via-white/90 to-transparent pointer-events-none" />
                    )}
                  </div>
                  <button onClick={handleToggleDescription}
                    className="text-[#e8540a] hover:text-[#c94708] mt-3 text-sm md:text-base font-bold transition flex items-center gap-1 bg-transparent border-none cursor-pointer p-0">
                    <span>{showFullDescription ? 'Show less' : 'Show more'}</span>
                    <ChevronDown size={16} className={`transition-transform ${showFullDescription ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              )}

              {/* INSTRUCTOR */}
              <div className="mb-8 md:mb-12 pt-6 md:pt-8 border-t border-[#ece6dd] w-full">
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#1a1208] mb-6 md:mb-8" style={{ fontFamily: "'Playfair Display', serif" }}>Instructor</h2>
                {loadingInstructor ? (
                  <p className="text-[#9e9789] text-base md:text-lg">Loading instructor...</p>
                ) : (
                  <>
                    {/* Profile + stats row */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-6 md:gap-10 mb-6 md:mb-8">
                      {/* Left — photo + name */}
                      <div className="flex flex-col items-center sm:items-start text-center sm:text-left flex-shrink-0">
                        <div className="w-[110px] h-[110px] md:w-[120px] md:h-[120px] rounded-full bg-[#e8540a] flex items-center justify-center shadow-lg overflow-hidden ring-4 ring-[#fdf2ea]">
                          {instructor.image && instructor.image.startsWith('http') ? (
                            <img src={instructor.image} alt={instructor.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-white font-bold text-4xl">{instructor.name?.charAt(0) || 'I'}</span>
                          )}
                        </div>
                        <p className="mt-4 font-bold text-[#1a1208] text-lg md:text-xl leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                          {instructor.name}
                        </p>
                        {instructor.title && (
                          <p className="mt-1 text-sm text-[#9e9789] font-medium">{instructor.title}</p>
                        )}
                      </div>

                      {/* Right — stat cards */}
                      <div className="flex-1 grid grid-cols-2 gap-3 md:gap-4 w-full">
                        {[
                          { icon: '⭐', value: instructor.rating > 0 ? instructor.rating.toFixed(1) : '0', label: 'Total Ratings' },
                          { icon: '📝', value: formatNumber(instructor.reviews), label: 'Reviews' },
                          { icon: '👥', value: formatNumber(instructor.students), label: 'Students' },
                          { icon: '🎓', value: formatNumber(instructor.courses), label: 'Courses' },
                        ].map((stat) => (
                          <div
                            key={stat.label}
                            className="bg-white border border-[#ece6dd] rounded-xl px-4 py-3 md:px-5 md:py-4 shadow-sm flex flex-col gap-0.5"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-lg md:text-xl" aria-hidden="true">{stat.icon}</span>
                              <span className="text-xl md:text-2xl font-bold text-[#1a1208] leading-none">{stat.value}</span>
                            </div>
                            <span className="text-xs md:text-sm text-[#9e9789] font-medium pl-7 md:pl-8">{stat.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bio */}
                    {instructor.bio && (
                      <div className="mb-6 md:mb-8">
                        <div className="relative">
                          <div className={`text-[#3d3020] leading-relaxed text-sm md:text-base ${!showFullInstructorBio ? 'max-h-20 overflow-hidden' : ''}`}>
                            <p>{instructor.bio}</p>
                          </div>
                          {!showFullInstructorBio && <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#FDFAF6] via-[#FDFAF6]/90 to-transparent pointer-events-none" />}
                        </div>
                        {instructor.bio.length > 120 && (
                          <button onClick={() => setShowFullInstructorBio(!showFullInstructorBio)}
                            className="text-[#e8540a] hover:text-[#c94708] mt-3 text-sm md:text-base font-bold transition flex items-center gap-1 bg-transparent border-none cursor-pointer p-0">
                            <span>{showFullInstructorBio ? 'Show less' : 'Show more'}</span>
                            <ChevronDown size={16} className={`transition-transform ${showFullInstructorBio ? 'rotate-180' : ''}`} />
                          </button>
                        )}
                      </div>
                    )}

                    {/* Description */}
                    {instructor.description && (
                      <div className="mb-6 md:mb-8 pt-2 border-t border-[#f0ebe3]">
                        <h3 className="text-xl md:text-2xl font-bold text-[#1a1208] mb-3 md:mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Description</h3>
                        <div className="relative">
                          {/<[a-z][\s\S]*>/i.test(instructor.description) ? (
                            <div
                              className={`text-[#3d3020] leading-relaxed text-sm md:text-base prose prose-sm md:prose-base max-w-none ${!showFullInstructorDescription ? 'max-h-40 overflow-hidden' : ''}`}
                              dangerouslySetInnerHTML={{ __html: instructor.description }}
                            />
                          ) : (
                            <div
                              className={`text-[#3d3020] leading-relaxed text-sm md:text-base whitespace-pre-wrap ${!showFullInstructorDescription ? 'max-h-40 overflow-hidden' : ''}`}
                            >
                              {instructor.description}
                            </div>
                          )}
                          {!showFullInstructorDescription && (
                            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#FDFAF6] via-[#FDFAF6]/90 to-transparent pointer-events-none" />
                          )}
                        </div>
                        {instructor.description.length > 200 && (
                          <button onClick={() => setShowFullInstructorDescription(!showFullInstructorDescription)}
                            className="text-[#e8540a] hover:text-[#c94708] mt-3 text-sm md:text-base font-bold transition flex items-center gap-1 bg-transparent border-none cursor-pointer p-0">
                            <span>{showFullInstructorDescription ? 'Show less' : 'Show more'}</span>
                            <ChevronDown size={16} className={`transition-transform ${showFullInstructorDescription ? 'rotate-180' : ''}`} />
                          </button>
                        )}
                      </div>
                    )}

                    {(instructor.location || instructor.website || instructor.twitter || instructor.linkedin) && (
                      <div className="flex flex-wrap gap-3 text-sm text-[#9e9789]">
                        {instructor.location && (
                          <span className="flex items-center gap-1.5"><Globe size={14} className="text-[#e8540a]" />{instructor.location}</span>
                        )}
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
                  </>
                )}
              </div>

              {/* ─────────────────────────────────────────────────────────────
                  TEXT REVIEWS — UDEMY-STYLE CARDS (FIX 5)
                  Every review card now always shows:
                    • Author initial avatar (orange circle) or profile image
                    • Author name + star rating + date
                    • Review text body — previously missing due to narrow field
                      matching in normalizeReview; now catches 15+ field names
                  The "already reviewed" gate is removed; anyone can post again.
              ───────────────────────────────────────────────────────────── */}
              <div className="mb-8 md:mb-12 pt-6 md:pt-8 border-t border-[#ece6dd] w-full">
                <div className="mb-6 md:mb-8 flex items-center gap-3 md:gap-4">
                  <Star size={36} className="text-[#f9c97a] md:w-12 md:h-12" fill="currentColor" />
                  <div>
                    <p className="text-3xl md:text-4xl font-bold text-[#1a1208]" style={{ fontFamily: "'Playfair Display', serif" }}>
                      {courseData.rating || (textReviews.length ? (textReviews.reduce((s, r) => s + r.rating, 0) / textReviews.length).toFixed(1) : '—')}
                    </p>
                    <p className="text-sm md:text-base text-[#9e9789]">
                      {textReviews.length > 0 ? `${formatNumber(textReviews.length)} course ${textReviews.length === 1 ? 'rating' : 'ratings'}` : 'No ratings yet'}
                    </p>
                  </div>
                </div>

                {textReviews.length === 0 ? (
                  <div className="border border-dashed border-[#ddd5c4] rounded-2xl p-8 text-center bg-[#fbf8f3]">
                    <p className="text-[#9e9789] text-sm md:text-base">Be the first to leave a review for this course.</p>
                  </div>
                ) : (
                  <TextReviewsSlider reviews={textReviews} />
                )}
              </div>

              {/* WRITE A REVIEW */}
              <div className="mb-8 md:mb-12 pt-6 md:pt-8 border-t border-[#ece6dd] w-full">
                <button
                  onClick={() => setShowReviewForm(!showReviewForm)}
                  className="w-full bg-white hover:bg-[#fdf2ea] text-[#e8540a] font-bold py-3 md:py-3.5 rounded-xl transition text-base md:text-lg border-2 border-[#e8540a] cursor-pointer">
                  {showReviewForm ? 'Cancel Review' : 'Write a Review'}
                </button>

                {showReviewForm && (
                  <form onSubmit={handleReviewSubmit} className="mt-4 md:mt-6 bg-[#f8f4ed] rounded-2xl p-4 md:p-6 border border-[#ece6dd]">
                    <h3 className="text-lg md:text-xl font-bold text-[#1a1208] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Share Your Experience</h3>
                    <div className="mb-4">
                      <label className="block text-sm md:text-base font-semibold text-[#3d3020] mb-2">
                        Your Name <span className="text-[#e8540a]">*</span>
                      </label>
                      <input
                        type="text"
                        value={reviewAuthorName}
                        onChange={(e) => setReviewAuthorName(e.target.value)}
                        placeholder="Enter your name"
                        required
                        className="w-full border border-[#ddd5c4] rounded-xl px-3 md:px-4 py-2 md:py-3 text-sm md:text-base text-[#1a1208] placeholder-[#9e9789] focus:outline-none focus:ring-2 focus:ring-[#e8540a] bg-white"
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm md:text-base font-semibold text-[#3d3020] mb-2">Rating</label>
                      <div className="flex gap-1.5 md:gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button key={star} type="button" onClick={() => setReviewRating(star)} className="bg-transparent border-none cursor-pointer p-0">
                            <Star size={32} className={`${star <= reviewRating ? 'text-[#f9c97a]' : 'text-[#ddd5c4]'} hover:text-[#f9c97a] transition`} fill={star <= reviewRating ? 'currentColor' : 'none'} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm md:text-base font-semibold text-[#3d3020] mb-2">Your Review</label>
                      <textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)}
                        placeholder="Share your thoughts about this course..." rows={5}
                        required
                        className="w-full border border-[#ddd5c4] rounded-xl px-3 md:px-4 py-2 md:py-3 text-sm md:text-base text-[#1a1208] placeholder-[#9e9789] focus:outline-none focus:ring-2 focus:ring-[#e8540a] resize-none bg-white" />
                    </div>
                    <button type="submit" disabled={submittingReview}
                      className="w-full bg-[#e8540a] hover:bg-[#c94708] text-white font-bold py-3 md:py-3.5 rounded-xl transition border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-base md:text-lg">
                      {submittingReview ? 'Submitting...' : 'Submit Review'}
                    </button>
                    <p className="text-xs md:text-sm text-[#9e9789] mt-3">
                      No account needed — you can submit as many reviews as you like.
                    </p>
                  </form>
                )}
              </div>

              {/* IMAGE TESTIMONIALS */}
              {imageTestimonials.length > 0 && (
                <div className="mb-8 md:mb-12 pt-6 md:pt-8 border-t border-[#ece6dd] w-full">
                  <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#1a1208] mb-2 md:mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>Student Testimonials</h2>
                  <p className="text-[#9e9789] text-sm md:text-base mb-4 md:mb-6">See what our students have to say</p>
                  <AutoSlideImageTestimonials imageTestimonials={imageTestimonials} />
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 md:gap-8 mb-8 md:mb-12">
            {[
              { title: 'Lerni',     links: ['About', 'Press', 'Contact', 'Careers'] },
              { title: 'Community', links: ['Learners', 'Partners', 'Developers', 'Beta Testers'] },
              { title: 'Teaching',  links: ['Become Instructor', 'Teaching Center', 'Resources'] },
              { title: 'Programs',  links: ['Enterprise', 'Government', 'Lerni Business'] },
              { title: 'Support',   links: ['Help Center', 'Get the App', 'FAQ', 'Accessibility'] },
              { title: 'Legal',     links: ['Terms', 'Privacy Policy', 'Cookie Settings', 'Sitemap'] },
            ].map(col => (
              <div key={col.title}>
                <h3 className="font-bold text-[#f9c97a] mb-3 md:mb-4 text-xs md:text-sm uppercase tracking-wide">{col.title}</h3>
                <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm">
                  {col.links.map(link => (
                    <li key={link}><button onClick={() => handleNavigate('/')} className="hover:text-white transition bg-transparent border-none cursor-pointer text-[#9e8e7a] p-0">{link}</button></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center pt-6 md:pt-8 border-t border-[#2d2416]">
            <button onClick={() => handleNavigate('/')}
              className="text-xl md:text-2xl font-extrabold text-white cursor-pointer hover:opacity-80 transition bg-transparent border-none p-0 mb-4 md:mb-0"
              style={{ fontFamily: "'Playfair Display', serif" }}>
              Ler<span className="text-[#f9c97a]">ni</span>
            </button>
            <p className="text-xs md:text-sm text-[#6b5e4e]">© 2024 Lerni, Inc. All rights reserved.</p>
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
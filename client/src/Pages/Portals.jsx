// src/Pages/Portals.jsx
// ─────────────────────────────────────────────────────────────────────────────
// STUDENT PORTAL — reached at /portal after logging in as a student.
//
// Every feature from the original mockup is here — Dashboard, My Courses,
// Course Player (Content/Q&A/Notes/Resources tabs), Progress, Certificates,
// Profile (with real photo upload), Settings, notification + profile
// dropdowns — but now wired to real data instead of mock data, and rebranded
// to match the course landing page (Shopify.jsx): cream background, dark
// #1a1208 header/sidebar, burnt-orange (#e8540a) accent, Playfair Display +
// DM Sans.
//
// Real data sources:
//   • GET  /api/enrollments/my         — this student's enrollments
//     (paymentStatus: pending | verified | rejected — drives the lock state)
//   • GET  /api/progress/my            — completed-lecture progress
//   • POST /api/progress/mark          — mark a lecture complete
//   • fetchCourseById(id)              — full course detail (sections/
//     lectures), same helper the course landing page uses
//   • GET/POST /api/notes, /api/notes/:courseId, DELETE /api/notes/:id
//   • GET/POST /api/courses/:id/questions, POST /api/questions/:id/answers,
//     POST /api/questions/:id/upvote
//   • PATCH /api/auth/profile          — name/bio
//   • POST  /api/upload/image          — real avatar upload (Cloudinary)
//
// A course only opens (the player) once paymentStatus is "verified"; until
// then it shows locked on Dashboard/My Courses with the reason why (pending
// vs. rejected — rejected also raises a one-time notification).
//
// Settings (notification/privacy toggles, language, theme) persist to
// localStorage — there's no backend for account preferences, so this is
// real per-device persistence rather than a page that resets on reload.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCourses, normalizeCourse, getDisplayStats } from '../context/CoursesContext';
import {
  Play, Pause, SkipForward, SkipBack, Volume2, Maximize,
  CheckCircle, Circle, Clock, BookOpen, Download, FileText,
  MessageSquare, Star, Award, Menu, X, Home, Users,
  GraduationCap, User, Settings as SettingsIcon, LogOut, Bell, ChevronDown,
  ChevronRight, ChevronLeft, TrendingUp, Share2, ThumbsUp, Edit3, Trash2,
  Send, Camera, Lock, AlertCircle, Loader2, Save,
} from 'lucide-react';

// ── Video embedding — same detection/embed logic as the course landing page
// (Shopify.jsx), duplicated here since it isn't exported from a shared file.
function getYouTubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/watch\?v=|\/shorts\/))([^&?/\s]{11})/);
  return m ? m[1] : null;
}
function isBunnyUrl(url) {
  return url && (
    url.includes('bunny.net') || url.includes('vod-cdn.bunny.net') ||
    url.includes('iframe.mediadelivery.net') || url.includes('player.mediadelivery.net') ||
    url.includes('video.bunnycdn.com') || url.includes('b-cdn.net')
  );
}
function isDirectVideo(url) {
  if (!url) return false;
  const path = url.split('?')[0].split('#')[0].toLowerCase();
  return path.endsWith('.mp4') || path.endsWith('.webm') || path.endsWith('.mov');
}
function isCloudinaryVideo(url) { return url && /res\.cloudinary\.com\/.+\/(video|raw)\//i.test(url); }
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

function formatTime(seconds) {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Real custom controls (play/pause, ±10s, speed, fullscreen, scrub bar) —
// these work against an actual HTML5 <video> element via its own API, for
// direct/Bunny/Cloudinary-hosted video. YouTube embeds use YouTube's own
// native controls instead (below) — building custom controls for those
// needs YouTube's separate IFrame Player API/postMessage bridge, which is
// its own project; native controls are what YouTube gives for free and work
// reliably everywhere.
function CustomVideoPlayer({ url, poster }) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  useEffect(() => { setCurrent(0); setPlaying(false); }, [url]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); } else { v.pause(); setPlaying(false); }
  };
  const seek = (delta) => { const v = videoRef.current; if (v) v.currentTime = Math.max(0, Math.min(duration, v.currentTime + delta)); };
  const scrubTo = (e) => {
    const v = videoRef.current; if (!v || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    v.currentTime = ((e.clientX - rect.left) / rect.width) * duration;
  };
  const changeSpeed = (s) => { const v = videoRef.current; if (v) v.playbackRate = s; setSpeed(s); setShowSpeedMenu(false); };
  const toggleFullscreen = () => { videoRef.current?.parentElement?.requestFullscreen?.(); };

  return (
    <div className="relative w-full aspect-video bg-black group">
      <video
        ref={videoRef}
        src={url}
        poster={poster || undefined}
        className="w-full h-full"
        onClick={togglePlay}
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        preload="metadata"
      />
      {!playing && (
        <button onClick={togglePlay} className="absolute inset-0 flex items-center justify-center bg-black/20 border-none cursor-pointer">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-[#e8540a] hover:bg-[#c94708] flex items-center justify-center transition shadow-lg"><Play size={30} className="text-white ml-1.5" fill="white" /></div>
        </button>
      )}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/85 to-transparent px-3 pt-8 pb-2 opacity-0 group-hover:opacity-100 transition">
        <div onClick={scrubTo} className="w-full h-1.5 bg-white/25 rounded-full cursor-pointer mb-2.5">
          <div className="h-full bg-[#e8540a] rounded-full" style={{ width: duration ? `${(current / duration) * 100}%` : '0%' }} />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <button onClick={togglePlay} className="bg-transparent border-none cursor-pointer text-white p-1">{playing ? <Pause size={18} /> : <Play size={18} />}</button>
            <button onClick={() => seek(-10)} className="bg-transparent border-none cursor-pointer text-white p-1"><SkipBack size={16} /></button>
            <button onClick={() => seek(10)} className="bg-transparent border-none cursor-pointer text-white p-1"><SkipForward size={16} /></button>
            <span className="text-xs text-white/80">{formatTime(current)} / {formatTime(duration)}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button onClick={() => setShowSpeedMenu(!showSpeedMenu)} className="bg-transparent border-none cursor-pointer text-white text-xs font-bold px-1.5">{speed}x</button>
              {showSpeedMenu && (
                <div className="absolute bottom-full right-0 mb-2 bg-black/90 rounded-lg p-1 min-w-[64px]">
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map((s) => (
                    <button key={s} onClick={() => changeSpeed(s)} className={`block w-full text-center px-2 py-1.5 rounded text-xs border-none cursor-pointer ${speed === s ? 'bg-[#e8540a] text-white' : 'bg-transparent text-white/80 hover:bg-white/10'}`}>{s}x</button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={toggleFullscreen} className="bg-transparent border-none cursor-pointer text-white p-1"><Maximize size={16} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

// NEW: shows a static thumbnail with our own orange play button before
// playing, instead of YouTube's own thumbnail/branding/play button showing
// through immediately — the actual player (including the YouTube iframe)
// only loads once the visitor taps it.
// NEW: loads YouTube's IFrame Player API once (shared across every lecture),
// so playback can be started programmatically via player.playVideo()
// instead of relying only on the ?autoplay=1 URL param — mobile browsers in
// particular often ignore that param inside a cross-origin iframe even
// right after a genuine click, which is what was showing YouTube's own
// play button a second time after tapping our custom one. Calling
// .playVideo() explicitly, the way YouTube's own docs recommend, is what
// actually starts it reliably in response to that click.
function useYouTubeIframeAPI() {
  const [ready, setReady] = useState(() => !!(window.YT && window.YT.Player));
  useEffect(() => {
    if (ready) return;
    if (!document.getElementById('youtube-iframe-api')) {
      const tag = document.createElement('script');
      tag.id = 'youtube-iframe-api';
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { setReady(true); if (prev) prev(); };
  }, [ready]);
  return ready;
}

function YouTubePlayer({ videoId }) {
  const apiReady = useYouTubeIframeAPI();
  // NEW: fixes the "app crashed / removeChild / The object can not be
  // found here" crash that happened when switching lectures. The old
  // version pointed `new YT.Player(elementId, ...)` straight at a
  // JSX-rendered <div id={elementId}>, which React was ALSO tracking in
  // its own virtual DOM. The YouTube IFrame API replaces that div with an
  // <iframe> in place — not as a child of it — so React's internal
  // reference to "its" div silently went stale the moment YouTube's script
  // touched the page. The next time React tried to update or remove that
  // node (switching to another lecture), it crashed trying to operate on a
  // DOM node that YouTube had already swapped out from under it.
  // The fix: containerRef below is the ONLY element React ever renders/
  // diffs here — nothing is declared inside it in JSX, so React never
  // forms an opinion about what's inside. The actual YouTube target <div>
  // is created and destroyed imperatively, entirely outside React's
  // reconciliation, so there's nothing left for the two to conflict over.
  const containerRef = useRef(null);
  const playerRef = useRef(null);

  useEffect(() => {
    if (!apiReady || !containerRef.current) return;
    const target = document.createElement('div');
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(target);

    playerRef.current = new window.YT.Player(target, {
      videoId,
      // NEW: no longer forcing mute:1 — this is triggered by a real click
      // on our custom play button, which counts as a genuine user gesture
      // in virtually every modern browser, so autoplay-with-sound works
      // without needing to start muted and rely on a manual unmute.
      playerVars: { autoplay: 1, rel: 0, playsinline: 1 },
      events: {
        onReady: (e) => { try { e.target.playVideo(); } catch { /* ignore */ } },
      },
    });

    return () => {
      try { playerRef.current?.destroy(); } catch { /* ignore */ }
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, [apiReady, videoId]); // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={containerRef} className="absolute inset-0 w-full h-full" />;
}

function VideoPlayer({ url, thumbnail }) {
  const [started, setStarted] = useState(false);
  useEffect(() => { setStarted(false); }, [url]);

  if (!url) {
    return <div className="w-full aspect-video bg-black flex items-center justify-center"><p className="text-white/50 text-sm">No video for this lecture yet.</p></div>;
  }

  const ytId = getYouTubeId(url);
  const posterUrl = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : thumbnail;

  if (!started && (ytId || isBunnyUrl(url))) {
    return (
      <button onClick={() => setStarted(true)} className="relative w-full aspect-video bg-black border-none cursor-pointer p-0 block group">
        {posterUrl ? (
          <img src={posterUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-[#1a1208]" />
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/35 transition">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-[#e8540a] group-hover:bg-[#c94708] flex items-center justify-center transition shadow-lg">
            <Play size={30} className="text-white ml-1.5" fill="white" />
          </div>
        </div>
      </button>
    );
  }

  if (ytId) {
    return (
      <div className="relative w-full aspect-video bg-black">
        <YouTubePlayer videoId={ytId} />
      </div>
    );
  }
  if (isBunnyUrl(url)) {
    const embedUrl = getBunnyEmbedUrl(url);
    if (embedUrl) {
      return (
        <div className="relative w-full aspect-video bg-black">
          <iframe src={`${embedUrl}&autoplay=true`} className="absolute inset-0 w-full h-full"
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
            allowFullScreen title="Lecture video" loading="lazy" style={{ border: 'none' }} />
        </div>
      );
    }
  }
  if (isDirectVideo(url) || isCloudinaryVideo(url)) return <CustomVideoPlayer url={url} poster={thumbnail} />;
  return <div className="w-full aspect-video bg-black flex items-center justify-center"><p className="text-white/50 text-sm">Couldn't load this video format.</p></div>;
}

function lockMessage(paymentStatus, rejectionReason) {
  if (paymentStatus === 'rejected') {
    return rejectionReason ? `Your payment verification was rejected: ${rejectionReason}` : 'Your payment verification was rejected. Please contact us for details.';
  }
  return 'This course will unlock once your payment is verified by our team.';
}

function CourseThumb({ course }) {
  const [imgErr, setImgErr] = useState(false);
  if (course?.thumbnail && !imgErr) return <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" onError={() => setImgErr(true)} />;
  return <div className="w-full h-full bg-[#f0ebe3] flex items-center justify-center text-4xl">📚</div>;
}

function EnrollmentCard({ enrollment, progressPct, onOpen }) {
  const rawCourse = enrollment.course || {};
  const locked = enrollment.paymentStatus !== 'verified';
  // Run the raw course doc through the same normalizeCourse() the rest of
  // the site uses, so title/thumbnail/instructor come out the same way.
  const course = useMemo(() => normalizeCourse(rawCourse) || rawCourse, [rawCourse]);
  // NEW: now pulled from CoursesContext's shared getDisplayStats() instead
  // of a locally-duplicated copy of the same formula — this is what makes a
  // course card here show the exact same "61,0xx students" number as its
  // own landing page, instead of just the tiny raw enrollment count, and
  // keeps this in sync with that page automatically going forward.
  const { rating: displayRating, reviewCount: displayRatingCount, studentCount: displayStudentCount } = useMemo(() => getDisplayStats(course), [course]);

  return (
    <div
      onClick={() => !locked && onOpen(enrollment)}
      className={`bg-white border border-[#ece6dd] rounded-2xl overflow-hidden transition flex flex-col ${locked ? 'opacity-90' : 'hover:shadow-lg hover:-translate-y-0.5 cursor-pointer'}`}
    >
      <div className="relative h-36 md:h-40">
        <CourseThumb course={course} />
        {locked && <div className="absolute inset-0 bg-[#1a1208]/60 flex items-center justify-center"><Lock size={28} className="text-white" /></div>}
        {!locked && progressPct === 100 && (
          <span className="absolute top-2 right-2 bg-[#e8540a] text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1"><CheckCircle size={11} /> Completed</span>
        )}
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-bold text-[#1a1208] text-sm md:text-base leading-snug mb-1 line-clamp-2">{course.title || 'Untitled course'}</h3>
        <p className="text-xs text-[#9e9789] mb-1.5">{course.instructor || 'Instructor'}</p>
        <div className="flex items-center gap-1.5 mb-3 flex-wrap">
          <span className="font-bold text-[#1a1208] text-xs">{displayRating.toFixed(1)}</span>
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={11} className="text-[#f9c97a]" fill={i < Math.round(displayRating) ? 'currentColor' : 'none'} />
            ))}
          </div>
          <span className="text-[11px] text-[#9e9789]">({displayRatingCount.toLocaleString()})</span>
          <span className="flex items-center gap-1 text-[11px] text-[#9e9789] ml-1"><Users size={11} />{displayStudentCount.toLocaleString()} students</span>
        </div>
        {locked ? (
          <div className={`mt-auto flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs leading-relaxed ${enrollment.paymentStatus === 'rejected' ? 'bg-red-50 text-red-700' : 'bg-[#fdf2ea] text-[#7a4a00]'}`}>
            <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
            <span>{lockMessage(enrollment.paymentStatus, enrollment.rejectionReason)}</span>
          </div>
        ) : (
          <div className="mt-auto">
            <div className="w-full h-1.5 bg-[#f0ebe3] rounded-full overflow-hidden mb-1.5"><div className="h-full bg-[#e8540a] rounded-full transition-all" style={{ width: `${progressPct}%` }} /></div>
            <p className="text-xs text-[#9e9789]">{progressPct}% complete</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Extracts a readable filename from a resource URL, since LectureSchema
// stores resources as plain URL strings with no separate display name.
function resourceLabel(url, idx) {
  try {
    const clean = url.split('?')[0];
    const name = decodeURIComponent(clean.split('/').pop() || '');
    return name || `Resource ${idx + 1}`;
  } catch { return `Resource ${idx + 1}`; }
}

export default function Portals() {
  const navigate = useNavigate();
  const { user, API: api, logout } = useAuth();
  const { fetchCourseById } = useCourses();

  const [currentView, setCurrentView] = useState('dashboard'); // dashboard | courses | course | progress | certificates | profile | settings
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const [enrollments, setEnrollments] = useState([]);
  const [progressMap, setProgressMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [courseFilter, setCourseFilter] = useState('all');

  // NEW: real header logo (same one used sitewide, uploaded via Super Admin
  // → Settings) — same localStorage-caching pattern as SiteHeader.jsx, so it
  // was previously just a hardcoded "Lerni Portal" wordmark + generic icon.
  const [siteLogoUrl, setSiteLogoUrl] = useState(() => { try { return localStorage.getItem('lerni_header_logo_url') || ''; } catch { return ''; } });
  useEffect(() => {
    api.get('/settings')
      .then((res) => {
        const url = res.data?.logoUrl || '';
        setSiteLogoUrl(url);
        try { localStorage.setItem('lerni_header_logo_url', url); } catch { /* cache is a nice-to-have */ }
      })
      .catch(() => {});
  }, [api]);

  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseLoading, setCourseLoading] = useState(false);
  const [activeLecture, setActiveLecture] = useState(null);
  const [expandedSections, setExpandedSections] = useState([]);
  const [activeTab, setActiveTab] = useState('content'); // content | qa | notes | resources

  const [seenRejections, setSeenRejections] = useState(() => {
    try { return JSON.parse(localStorage.getItem('lerni_seen_rejections') || '[]'); } catch { return []; }
  });

  const loadData = useCallback(() => {
    setLoading(true);
    Promise.all([api.get('/enrollments/my'), api.get('/progress/my')])
      .then(([enrollRes, progRes]) => {
        setEnrollments(Array.isArray(enrollRes.data) ? enrollRes.data : []);
        const pm = {};
        (Array.isArray(progRes.data) ? progRes.data : []).forEach((p) => { pm[String(p.courseId)] = p.completedLectures || []; });
        setProgressMap(pm);
      })
      .catch((err) => console.error('[Portal] failed to load enrollments/progress:', err.message))
      .finally(() => setLoading(false));
  }, [api]);

  useEffect(() => { loadData(); }, [loadData]);

  const totalLecturesFor = (course) => (course?.sections || []).reduce((a, s) => a + (s.lectures?.length || 0), 0);
  const progressPctFor = (enrollment) => {
    const courseId = String(enrollment.course?._id || enrollment.course);
    const done = (progressMap[courseId] || []).length;
    const total = totalLecturesFor(enrollment.course);
    if (!total) return 0;
    return Math.min(100, Math.round((done / total) * 100));
  };

  const unseenRejection = useMemo(() => enrollments.find((e) => e.paymentStatus === 'rejected' && !seenRejections.includes(e._id)), [enrollments, seenRejections]);
  const dismissRejection = (id) => {
    const next = [...seenRejections, id];
    setSeenRejections(next);
    try { localStorage.setItem('lerni_seen_rejections', JSON.stringify(next)); } catch { /* best-effort */ }
  };

  const filteredEnrollments = useMemo(() => {
    switch (courseFilter) {
      case 'progress':  return enrollments.filter((e) => e.paymentStatus === 'verified' && progressPctFor(e) < 100);
      case 'completed': return enrollments.filter((e) => e.paymentStatus === 'verified' && progressPctFor(e) === 100);
      case 'locked':    return enrollments.filter((e) => e.paymentStatus !== 'verified');
      default:          return enrollments;
    }
  }, [enrollments, courseFilter, progressMap]);

  const handleNavigate = (view) => {
    setCurrentView(view);
    setMobileMenuOpen(false);
    setShowProfileMenu(false);
    window.history.pushState({ portal: true, view }, '');
  };

  // NEW: the browser/device Back button should never take a student out of
  // the portal onto the marketing site — the only way out is Logout. Back
  // should still work BETWEEN views inside the portal (Dashboard → My
  // Courses → Course, etc.), so this doesn't just block Back outright: it
  // pushes a history entry per internal view change (see handleNavigate
  // and openCourse) and only traps the boundary — the one Back press that
  // would otherwise leave the portal entirely re-lands on the portal
  // instead of exiting it.
  useEffect(() => {
    window.history.replaceState({ portal: true, view: 'dashboard' }, '');
    const handlePop = (e) => {
      if (e.state && e.state.portal) {
        // 'course' isn't restorable from history state alone (the full
        // course object isn't serialized into it) — land on My Courses
        // instead, which is a reasonable, safe place to land either way.
        setCurrentView(e.state.view === 'course' ? 'courses' : (e.state.view || 'dashboard'));
      } else {
        // Tried to go before the portal's first entry — trap it right here.
        window.history.pushState({ portal: true, view: currentView }, '');
      }
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Q&A / Notes state for the open course ─────────────────────────────
  const [questions, setQuestions] = useState([]);
  const [qaLoading, setQaLoading] = useState(false);
  const [questionText, setQuestionText] = useState('');
  const [answerDrafts, setAnswerDrafts] = useState({});
  const [notes, setNotes] = useState([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [noteText, setNoteText] = useState('');

  // NEW: sidebar-level Notes/Q&A/Resources — aggregated across every course,
  // not just the one currently open in the player.
  const [myNotes, setMyNotes] = useState(null);
  const [myNotesLoading, setMyNotesLoading] = useState(false);
  const [myQuestions, setMyQuestions] = useState(null);
  const [myQuestionsLoading, setMyQuestionsLoading] = useState(false);
  const [myResources, setMyResources] = useState(null);
  const [myResourcesLoading, setMyResourcesLoading] = useState(false);

  useEffect(() => {
    // NEW: these used to only fetch the FIRST time each tab was opened
    // (guarded by `=== null`), then never again — so a note/question saved
    // after that first visit never showed up here, even though it was
    // really saved; the tab just kept showing its stale first-load
    // snapshot. Now it refetches fresh every time the tab is opened.
    if (currentView === 'my-notes') {
      setMyNotesLoading(true);
      api.get('/notes/my').then((res) => setMyNotes(res.data || [])).catch(() => setMyNotes([])).finally(() => setMyNotesLoading(false));
    }
    if (currentView === 'my-qa') {
      setMyQuestionsLoading(true);
      api.get('/questions/my-courses').then((res) => setMyQuestions(res.data || [])).catch(() => setMyQuestions([])).finally(() => setMyQuestionsLoading(false));
    }
    if (currentView === 'my-resources') {
      setMyResourcesLoading(true);
      const verified = enrollments.filter((e) => e.paymentStatus === 'verified');
      Promise.all(verified.map((e) => fetchCourseById(e.course?._id || e.course)))
        .then((fullCourses) => {
          const flat = [];
          fullCourses.forEach((course, idx) => {
            if (!course) return;
            (course.sections || []).forEach((section) => {
              (section.lectures_list || []).forEach((lecture) => {
                (lecture.resources || []).forEach((url) => {
                  flat.push({ courseTitle: course.title, lectureTitle: lecture.title, url, key: `${idx}-${lecture.id}-${url}` });
                });
              });
            });
          });
          setMyResources(flat);
        })
        .catch(() => setMyResources([]))
        .finally(() => setMyResourcesLoading(false));
    }
  }, [currentView]); // eslint-disable-line react-hooks/exhaustive-deps

  // NEW: fires the "Lesson Started" automation trigger for real, the first
  // time a lecture is opened (not just completed) — used both for the
  // auto-selected first lecture and for clicking one in the curriculum.
  const openLecture = (lecture, course) => {
    setActiveLecture(lecture);
    if (!lecture || !course) return;
    api.post('/progress/lesson-started', { courseId: course._id, lectureId: lecture.id, lectureTitle: lecture.title }).catch(() => {});
  };

  const openCourse = async (enrollment) => {
    if (enrollment.paymentStatus !== 'verified') return;
    setSelectedEnrollment(enrollment);
    setCurrentView('course');
    setActiveTab('content');
    window.history.pushState({ portal: true, view: 'course' }, '');
    setCourseLoading(true);
    const courseId = enrollment.course?._id || enrollment.course;
    const full = await fetchCourseById(courseId);
    setSelectedCourse(full);
    if (full?.sections?.length) {
      setExpandedSections([full.sections[0]._id]);
      const done = progressMap[String(courseId)] || [];
      const firstIncomplete = full.sections.flatMap((s) => s.lectures_list).find((l) => !done.includes(String(l.id)));
      openLecture(firstIncomplete || full.sections[0]?.lectures_list?.[0] || null, full);
    }
    setCourseLoading(false);

    setQaLoading(true);
    api.get(`/courses/${courseId}/questions`).then((res) => setQuestions(res.data || [])).catch(() => {}).finally(() => setQaLoading(false));
    setNotesLoading(true);
    api.get(`/notes/${courseId}`).then((res) => setNotes(res.data || [])).catch(() => {}).finally(() => setNotesLoading(false));
  };

  const toggleSection = (id) => setExpandedSections((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);

  const markComplete = async (lecture) => {
    if (!selectedCourse || !lecture) return;
    const courseId = selectedCourse._id;
    try {
      await api.post('/progress/mark', { courseId, lectureId: lecture.id });
      setProgressMap((prev) => {
        const existing = prev[courseId] || [];
        if (existing.includes(String(lecture.id))) return prev;
        return { ...prev, [courseId]: [...existing, String(lecture.id)] };
      });
    } catch (err) { console.error('[Portal] failed to mark lecture complete:', err.message); }
  };

  const postQuestion = async () => {
    if (!questionText.trim() || !selectedCourse) return;
    try {
      const res = await api.post(`/courses/${selectedCourse._id}/questions`, {
        lectureId: activeLecture?.id || '', lectureTitle: activeLecture?.title || '', text: questionText.trim(),
      });
      setQuestions((prev) => [res.data, ...prev]);
      setQuestionText('');
    } catch (err) { console.error('[Portal] failed to post question:', err.message); }
  };

  const postAnswer = async (questionId) => {
    const text = (answerDrafts[questionId] || '').trim();
    if (!text) return;
    try {
      const res = await api.post(`/questions/${questionId}/answers`, { text });
      setQuestions((prev) => prev.map((q) => (q._id === questionId ? res.data : q)));
      setAnswerDrafts((prev) => ({ ...prev, [questionId]: '' }));
    } catch (err) { console.error('[Portal] failed to post answer:', err.message); }
  };

  const toggleUpvote = async (questionId) => {
    try {
      const res = await api.post(`/questions/${questionId}/upvote`);
      setQuestions((prev) => prev.map((q) => (q._id === questionId ? { ...q, upvotes: new Array(res.data.upvotes).fill(null) } : q)));
    } catch (err) { console.error('[Portal] failed to upvote:', err.message); }
  };

  const saveNote = async () => {
    if (!noteText.trim() || !selectedCourse) return;
    try {
      const res = await api.post('/notes', {
        courseId: selectedCourse._id, lectureId: activeLecture?.id || 'general', lectureTitle: activeLecture?.title || '', content: noteText.trim(),
      });
      setNotes((prev) => [res.data, ...prev]);
      setNoteText('');
    } catch (err) { console.error('[Portal] failed to save note:', err.message); }
  };

  const deleteNote = async (id) => {
    try { await api.delete(`/notes/${id}`); setNotes((prev) => prev.filter((n) => n._id !== id)); }
    catch (err) { console.error('[Portal] failed to delete note:', err.message); }
  };

  // Same actions as above, but against the aggregate sidebar-level state
  // (myNotes/myQuestions) instead of the single open course's.
  const deleteMyNote = async (id) => {
    try { await api.delete(`/notes/${id}`); setMyNotes((prev) => (prev || []).filter((n) => n._id !== id)); }
    catch (err) { console.error('[Portal] failed to delete note:', err.message); }
  };
  const toggleMyUpvote = async (questionId) => {
    try {
      const res = await api.post(`/questions/${questionId}/upvote`);
      setMyQuestions((prev) => (prev || []).map((q) => (q._id === questionId ? { ...q, upvotes: new Array(res.data.upvotes).fill(null) } : q)));
    } catch (err) { console.error('[Portal] failed to upvote:', err.message); }
  };
  const [myAnswerDrafts, setMyAnswerDrafts] = useState({});
  const postMyAnswer = async (questionId) => {
    const text = (myAnswerDrafts[questionId] || '').trim();
    if (!text) return;
    try {
      const res = await api.post(`/questions/${questionId}/answers`, { text });
      setMyQuestions((prev) => (prev || []).map((q) => (q._id === questionId ? res.data : q)));
      setMyAnswerDrafts((prev) => ({ ...prev, [questionId]: '' }));
    } catch (err) { console.error('[Portal] failed to post answer:', err.message); }
  };

  // Maps a raw courseId (as stored on a Note/Question) to that course's
  // title, using the enrollments this student already has loaded — avoids
  // a separate lookup call just to label each group.
  const courseTitleFor = (courseId) => {
    const match = enrollments.find((e) => String(e.course?._id || e.course) === String(courseId));
    return match?.course?.title || 'Course';
  };

  // NEW: groups each aggregate list by course (Notes/Q&A) so it reads as
  // "Course → its notes/questions" instead of one long flat list with no
  // structure, matching how the data is actually organized.
  const notesByCourse = useMemo(() => {
    if (!myNotes) return [];
    const groups = {};
    myNotes.forEach((n) => {
      const key = String(n.courseId);
      if (!groups[key]) groups[key] = { key, title: courseTitleFor(n.courseId), items: [] };
      groups[key].items.push(n);
    });
    return Object.values(groups);
  }, [myNotes, enrollments]); // eslint-disable-line react-hooks/exhaustive-deps

  const questionsByCourse = useMemo(() => {
    if (!myQuestions) return [];
    const groups = {};
    myQuestions.forEach((q) => {
      const key = String(q.courseId);
      if (!groups[key]) groups[key] = { key, title: courseTitleFor(q.courseId), items: [] };
      groups[key].items.push(q);
    });
    return Object.values(groups);
  }, [myQuestions, enrollments]); // eslint-disable-line react-hooks/exhaustive-deps

  const resourcesByCourse = useMemo(() => {
    if (!myResources) return [];
    const groups = {};
    myResources.forEach((r) => {
      if (!groups[r.courseTitle]) groups[r.courseTitle] = { key: r.courseTitle, title: r.courseTitle, items: [] };
      groups[r.courseTitle].items.push(r);
    });
    return Object.values(groups);
  }, [myResources]);

  const handleLogout = () => { logout(); navigate('/login'); };

  // ── PROFILE (real name/bio + real avatar upload) ──────────────────────
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileBio, setProfileBio] = useState(user?.bio || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || '');
  const [avatarUploading, setAvatarUploading] = useState(false);

  const saveProfile = async () => {
    setProfileSaving(true); setProfileSaved(false);
    try {
      await api.patch('/auth/profile', { name: profileName.trim(), bio: profileBio });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
    } catch (err) { console.error('[Portal] failed to save profile:', err.message); }
    finally { setProfileSaving(false); }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('type', 'avatar'); // routes to the avatar Cloudinary folder + square crop
      const uploadRes = await api.post('/upload/image', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const url = uploadRes.data?.url || uploadRes.data?.secure_url;
      if (url) {
        await api.patch('/auth/profile', { avatar: url });
        setAvatarUrl(url);
      }
    } catch (err) { console.error('[Portal] failed to upload avatar:', err.message); }
    finally { setAvatarUploading(false); }
  };

  // ── SETTINGS (localStorage — no account-preferences backend exists) ───
  const [settings, setSettings] = useState(() => {
    try { return JSON.parse(localStorage.getItem('lerni_portal_settings')) || {
      emailNotifs: true, pushNotifs: true, weeklyReports: false, showProfile: true, showActivity: false,
    }; } catch { return { emailNotifs: true, pushNotifs: true, weeklyReports: false, showProfile: true, showActivity: false }; }
  });
  const updateSetting = (key, value) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    try { localStorage.setItem('lerni_portal_settings', JSON.stringify(next)); } catch { /* best-effort */ }
  };

  const enrolledCount  = enrollments.length;
  const verifiedCount  = enrollments.filter((e) => e.paymentStatus === 'verified').length;
  const completedEnrollments = enrollments.filter((e) => e.paymentStatus === 'verified' && progressPctFor(e) === 100);

  // ═══════════════════════════════════════════════════════════════════════
  // COURSE PLAYER
  // ═══════════════════════════════════════════════════════════════════════
  if (currentView === 'course') {
    const locked = selectedEnrollment && selectedEnrollment.paymentStatus !== 'verified';
    const done = selectedCourse ? (progressMap[selectedCourse._id] || []) : [];
    return (
      <div className="min-h-screen bg-[#FDFAF6] flex flex-col" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <div className="bg-[#1a1208] text-white px-4 md:px-6 py-3 md:py-4 flex items-center gap-3">
          <button onClick={() => handleNavigate('courses')} className="p-2 -ml-2 bg-transparent border-none cursor-pointer text-white hover:text-[#f0a070] transition"><ChevronLeft size={22} /></button>
          <p className="font-bold text-sm md:text-base truncate" style={{ fontFamily: "'Playfair Display', serif" }}>{selectedCourse?.title || 'Loading…'}</p>
        </div>

        {courseLoading ? (
          <div className="flex-1 flex items-center justify-center py-24"><Loader2 size={28} className="animate-spin text-[#e8540a]" /></div>
        ) : locked ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 gap-3">
            <Lock size={36} className="text-[#9e9789]" />
            <p className="text-[#1a1208] font-bold max-w-md">{lockMessage(selectedEnrollment.paymentStatus, selectedEnrollment.rejectionReason)}</p>
          </div>
        ) : !selectedCourse ? (
          <div className="flex-1 flex items-center justify-center py-24"><p className="text-[#9e9789]">Couldn't load this course.</p></div>
        ) : (
          <div className={`flex-1 grid ${activeTab === 'content' ? 'lg:grid-cols-[1fr_380px]' : 'lg:grid-cols-1'}`}>
            <div className="bg-white">
              <VideoPlayer url={activeLecture?.videoUrl} thumbnail={selectedCourse?.thumbnail} />
              <div className="p-4 md:p-6">
                <h1 className="text-lg md:text-xl font-bold text-[#1a1208] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>{activeLecture?.title || 'Select a lecture'}</h1>
                <div className="flex items-center gap-3 text-xs text-[#9e9789] mb-4 flex-wrap">
                  <span>{selectedCourse.instructor}</span>
                  {selectedCourse.rating > 0 && <span className="flex items-center gap-1"><Star size={13} className="text-[#f9c97a]" fill="currentColor" />{selectedCourse.rating}</span>}
                </div>
                {activeLecture && (
                  <button onClick={() => markComplete(activeLecture)} disabled={done.includes(String(activeLecture.id))}
                    className="flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-lg border-none cursor-pointer transition disabled:opacity-60 disabled:cursor-not-allowed bg-[#e8540a] hover:bg-[#c94708] text-white mb-6">
                    <CheckCircle size={16} /> {done.includes(String(activeLecture.id)) ? 'Completed' : 'Mark as Complete'}
                  </button>
                )}

                {/* TABS */}
                <div className="flex gap-5 border-b border-[#ece6dd] mb-4 overflow-x-auto">
                  {[
                    { id: 'content', label: 'Course Content', icon: BookOpen },
                    { id: 'qa', label: 'Q&A', icon: MessageSquare },
                    { id: 'notes', label: 'Notes', icon: Edit3 },
                    { id: 'resources', label: 'Resources', icon: Download },
                  ].map((t) => (
                    <button key={t.id} onClick={() => setActiveTab(t.id)}
                      className={`flex items-center gap-1.5 pb-3 border-none bg-transparent cursor-pointer text-sm font-semibold whitespace-nowrap transition ${
                        activeTab === t.id ? 'text-[#e8540a] border-b-2 border-[#e8540a]' : 'text-[#9e9789] border-b-2 border-transparent hover:text-[#3d3020]'
                      }`}>
                      <t.icon size={15} /> {t.label}
                    </button>
                  ))}
                </div>

                {/* CONTENT TAB — same curriculum accordion, shown in-panel on this side too for wide screens... actually mirrored in the right rail; here we show Q&A/Notes/Resources */}
                {activeTab === 'content' && (
                  <p className="text-sm text-[#9e9789]">Use the curriculum on the right to pick a lecture.</p>
                )}

                {activeTab === 'qa' && (
                  <div className="space-y-5">
                    <div className="bg-[#f8f4ed] rounded-xl p-4">
                      <p className="text-sm font-bold text-[#1a1208] mb-2">Ask a Question</p>
                      <textarea value={questionText} onChange={(e) => setQuestionText(e.target.value)} rows={3}
                        placeholder={`Ask about "${activeLecture?.title || 'this course'}"…`}
                        className="w-full border border-[#ece6dd] rounded-lg px-3 py-2.5 text-sm text-[#1a1208] outline-none focus:border-[#e8540a] transition resize-none mb-2" />
                      <button onClick={postQuestion} disabled={!questionText.trim()} className="flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-lg border-none cursor-pointer bg-[#e8540a] hover:bg-[#c94708] disabled:opacity-50 text-white transition">
                        <Send size={14} /> Post Question
                      </button>
                    </div>
                    {qaLoading ? (
                      <Loader2 size={20} className="animate-spin text-[#e8540a]" />
                    ) : questions.length === 0 ? (
                      <p className="text-sm text-[#9e9789] text-center py-6">No questions yet — be the first to ask.</p>
                    ) : (
                      questions.map((q) => (
                        <div key={q._id} className="border border-[#ece6dd] rounded-xl p-4">
                          <div className="flex items-center gap-2.5 mb-2">
                            <div className="w-8 h-8 rounded-full bg-[#e8540a] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">{(q.author?.name || '?').charAt(0).toUpperCase()}</div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-[#1a1208] truncate">{q.author?.name || 'Student'}</p>
                              {q.lectureTitle && <p className="text-xs text-[#9e9789] truncate">{q.lectureTitle} • {new Date(q.createdAt).toLocaleDateString()}</p>}
                            </div>
                          </div>
                          <p className="text-sm text-[#3d3020] mb-2.5">{q.text}</p>
                          <button onClick={() => toggleUpvote(q._id)} className="flex items-center gap-1.5 text-xs text-[#9e9789] hover:text-[#e8540a] bg-transparent border-none cursor-pointer p-0 mb-3">
                            <ThumbsUp size={13} /> {q.upvotes?.length || 0}
                          </button>
                          {(q.answers || []).map((a, i) => (
                            <div key={i} className="ml-4 pl-3 border-l-2 border-[#f0ebe3] mb-2">
                              <p className="text-xs font-bold text-[#1a1208]">{a.author?.name || 'User'}</p>
                              <p className="text-xs text-[#6b5e4e]">{a.text}</p>
                            </div>
                          ))}
                          <div className="flex gap-2 mt-2">
                            <input value={answerDrafts[q._id] || ''} onChange={(e) => setAnswerDrafts((p) => ({ ...p, [q._id]: e.target.value }))}
                              placeholder="Write an answer…" className="flex-1 border border-[#ece6dd] rounded-lg px-3 py-1.5 text-xs text-[#1a1208] outline-none focus:border-[#e8540a]" />
                            <button onClick={() => postAnswer(q._id)} className="text-xs font-bold px-3 py-1.5 rounded-lg border-none cursor-pointer bg-[#f0ebe3] hover:bg-[#e8dfd0] text-[#3d3020]">Reply</button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'notes' && (
                  <div className="space-y-4">
                    <div className="bg-[#f8f4ed] rounded-xl p-4">
                      <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} rows={3}
                        placeholder={`Add a note for "${activeLecture?.title || 'this lecture'}"…`}
                        className="w-full border border-[#ece6dd] rounded-lg px-3 py-2.5 text-sm text-[#1a1208] outline-none focus:border-[#e8540a] transition resize-none mb-2" />
                      <button onClick={saveNote} disabled={!noteText.trim()} className="flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-lg border-none cursor-pointer bg-[#e8540a] hover:bg-[#c94708] disabled:opacity-50 text-white transition">
                        <Send size={14} /> Save Note
                      </button>
                    </div>
                    {notesLoading ? (
                      <Loader2 size={20} className="animate-spin text-[#e8540a]" />
                    ) : notes.length === 0 ? (
                      <p className="text-sm text-[#9e9789] text-center py-6">No notes yet.</p>
                    ) : (
                      notes.map((n) => (
                        <div key={n._id} className="border border-[#ece6dd] rounded-xl p-4">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-bold text-[#e8540a]">{n.lectureTitle || 'General'}</span>
                            <button onClick={() => deleteNote(n._id)} className="bg-transparent border-none cursor-pointer text-[#9e9789] hover:text-red-500 p-0"><Trash2 size={14} /></button>
                          </div>
                          <p className="text-sm text-[#3d3020] mb-1.5">{n.content}</p>
                          <span className="text-xs text-[#9e9789]">{new Date(n.createdAt).toLocaleString()}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'resources' && (
                  <div className="space-y-2">
                    {(activeLecture?.resources || []).length === 0 ? (
                      <p className="text-sm text-[#9e9789] text-center py-6">No downloadable resources for this lecture.</p>
                    ) : (
                      activeLecture.resources.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3.5 border border-[#ece6dd] rounded-xl hover:border-[#e8540a] transition no-underline">
                          <FileText size={20} className="text-[#e8540a] flex-shrink-0" />
                          <span className="text-sm text-[#1a1208] flex-1 truncate">{resourceLabel(url, i)}</span>
                          <Download size={16} className="text-[#9e9789] flex-shrink-0" />
                        </a>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* CURRICULUM RAIL — only shown on the Course Content tab now;
                previously this rendered next to every tab (Q&A/Notes/
                Resources too), which on narrower screens made it look like
                a second, out-of-place "Course Content" block sitting below
                those tabs. */}
            {activeTab === 'content' && (
              <div className="bg-white border-l border-[#ece6dd] overflow-y-auto max-h-[calc(100vh-64px)]">
                <div className="p-4 border-b border-[#ece6dd]"><h2 className="font-bold text-[#1a1208] text-sm">Course Content</h2></div>
                {(selectedCourse.sections || []).map((section) => {
                  const expanded = expandedSections.includes(section._id);
                  return (
                    <div key={section._id} className="border-b border-[#f0ebe3]">
                      <button onClick={() => toggleSection(section._id)} className="w-full flex items-center justify-between px-4 py-3 bg-transparent border-none cursor-pointer text-left">
                        <span className="font-semibold text-sm text-[#1a1208] flex items-center gap-2">{expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}{section.title}</span>
                        <span className="text-xs text-[#9e9789]">{section.lectures} lectures</span>
                      </button>
                      {expanded && (
                        <div>
                          {(section.lectures_list || []).map((lecture) => {
                            const isDone = done.includes(String(lecture.id));
                            const isActive = activeLecture?.id === lecture.id;
                            return (
                              <button key={lecture.id} onClick={() => openLecture(lecture, selectedCourse)}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 border-none cursor-pointer text-left transition ${isActive ? 'bg-[#fdf2ea]' : 'bg-transparent hover:bg-[#f8f4ed]'}`}>
                                {isDone ? <CheckCircle size={16} className="text-[#e8540a] flex-shrink-0" /> : <Circle size={16} className="text-[#ccc5b8] flex-shrink-0" />}
                                {/* NEW: text-sm instead of text-xs — kept the
                                    exact same order/structure, just larger. */}
                                <span className={`text-sm flex-1 truncate ${isActive ? 'text-[#e8540a] font-semibold' : 'text-[#3d3020]'}`}>{lecture.title}</span>
                                {lecture.duration && <span className="text-xs text-[#9e9789] flex-shrink-0">{lecture.duration}</span>}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // DASHBOARD SHELL
  // ═══════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-[#FDFAF6]" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {unseenRejection && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3 flex items-start gap-3">
          <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 flex-1"><strong>{unseenRejection.course?.title || 'A course'} enrollment rejected: </strong>{unseenRejection.rejectionReason || 'Please contact us for details.'}</p>
          <button onClick={() => dismissRejection(unseenRejection._id)} className="text-red-500 hover:text-red-700 bg-transparent border-none cursor-pointer p-0 flex-shrink-0"><X size={16} /></button>
        </div>
      )}

      <header className="sticky top-0 z-40 bg-white border-b border-[#ece6dd]">
        <div className="px-4 md:px-6 py-3 flex items-center gap-3">
          <button className="lg:hidden p-2 -ml-2 bg-transparent border-none cursor-pointer text-[#1a1208]" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>{mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}</button>
          <div className="flex items-center gap-2 text-[#1a1208] font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
            {siteLogoUrl ? (
              <img src={siteLogoUrl} alt="Logo" className="h-12 md:h-16 w-auto object-contain" />
            ) : (
              <>
                <GraduationCap size={26} className="text-[#e8540a]" /><span className="text-lg md:text-xl">Ler<span className="text-[#e8540a]">ni</span> Portal</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <div className="relative">
              <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 bg-transparent border-none cursor-pointer text-[#3d3020] hover:text-[#1a1208] transition">
                <Bell size={20} />
                {enrollments.some((e) => e.paymentStatus === 'rejected' && !seenRejections.includes(e._id)) && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#e8540a]" />}
              </button>
              {showNotifications && (
                <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-[#ece6dd] overflow-hidden z-50">
                  <div className="p-3 border-b border-[#f0ebe3] flex justify-between items-center">
                    <span className="font-bold text-sm text-[#1a1208]">Notifications</span>
                    <button onClick={() => setShowNotifications(false)} className="bg-transparent border-none cursor-pointer text-[#9e9789]"><X size={16} /></button>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {enrollments.filter((e) => e.paymentStatus === 'rejected').length === 0 ? (
                      <p className="text-xs text-[#9e9789] p-4 text-center">No notifications yet.</p>
                    ) : (
                      enrollments.filter((e) => e.paymentStatus === 'rejected').map((e) => (
                        <div key={e._id} className="p-3 border-b border-[#f8f4ed] text-xs text-[#3d3020]">
                          <p className="font-semibold text-[#1a1208] mb-0.5">{e.course?.title || 'A course'}</p>
                          <p className="text-[#9e9789]">Rejected: {e.rejectionReason || 'No reason given.'}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="relative">
              <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-transparent border-none cursor-pointer hover:bg-[#f8f4ed] transition">
                {avatarUrl ? <img src={avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" /> : (
                  <div className="w-8 h-8 rounded-full bg-[#e8540a] text-white flex items-center justify-center font-bold text-sm flex-shrink-0">{(user?.name || 'S').charAt(0).toUpperCase()}</div>
                )}
                <span className="hidden md:inline text-sm font-semibold text-[#1a1208]">{user?.name || 'Student'}</span>
                <ChevronDown size={14} className="text-[#9e9789]" />
              </button>
              {showProfileMenu && (
                <div className="absolute top-full right-0 mt-2 w-44 bg-white rounded-xl shadow-lg border border-[#ece6dd] overflow-hidden z-50">
                  <button onClick={() => handleNavigate('profile')} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[#3d3020] hover:bg-[#f8f4ed] bg-transparent border-none cursor-pointer text-left"><User size={15} /> Profile</button>
                  <button onClick={() => handleNavigate('settings')} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[#3d3020] hover:bg-[#f8f4ed] bg-transparent border-none cursor-pointer text-left"><SettingsIcon size={15} /> Settings</button>
                  <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 bg-transparent border-none cursor-pointer text-left border-t border-[#f0ebe3]"><LogOut size={15} /> Logout</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className={`fixed lg:sticky top-[72px] lg:top-[88px] left-0 h-[calc(100vh-72px)] lg:h-[calc(100vh-88px)] w-64 bg-[#1a1208] flex-shrink-0 transition-transform z-30 overflow-y-auto ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
          <nav className="p-4 space-y-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Home },
              { id: 'courses', label: 'My Courses', icon: BookOpen },
              { id: 'my-notes', label: 'Notes', icon: Edit3 },
              { id: 'my-qa', label: 'Q&A', icon: MessageSquare },
              { id: 'my-resources', label: 'Resources', icon: Download },
              { id: 'progress', label: 'Progress', icon: TrendingUp },
              { id: 'certificates', label: 'Certificates', icon: Award },
              { id: 'profile', label: 'Profile', icon: User },
              { id: 'settings', label: 'Settings', icon: SettingsIcon },
            ].map((item) => {
              const Icon = item.icon;
              const active = currentView === item.id;
              return (
                <button key={item.id} onClick={() => handleNavigate(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition border-none cursor-pointer text-left ${active ? 'bg-[#e8540a] text-white' : 'bg-transparent text-[#c8bfaf] hover:bg-white/5 hover:text-white'}`}>
                  <Icon size={18} /> {item.label}
                </button>
              );
            })}
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition border-none cursor-pointer text-left bg-transparent text-[#e08a6a] hover:bg-white/5 mt-4">
              <LogOut size={18} /> Logout
            </button>
          </nav>
        </aside>
        {mobileMenuOpen && <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={() => setMobileMenuOpen(false)} />}

        <main className="flex-1 min-w-0 px-4 md:px-6 py-6 md:py-8">
          {loading ? (
            <div className="flex items-center justify-center py-24"><Loader2 size={28} className="animate-spin text-[#e8540a]" /></div>

          ) : currentView === 'settings' ? (
            <div className="max-w-xl space-y-6">
              <h1 className="text-2xl font-bold text-[#1a1208]" style={{ fontFamily: "'Playfair Display', serif" }}>Settings</h1>
              <div className="bg-white border border-[#ece6dd] rounded-2xl p-5 md:p-6">
                <h3 className="font-bold text-[#1a1208] mb-3">Notifications</h3>
                {[
                  { key: 'emailNotifs', label: 'Email notifications' },
                  { key: 'pushNotifs', label: 'Push notifications' },
                  { key: 'weeklyReports', label: 'Weekly progress reports' },
                ].map((opt) => (
                  <label key={opt.key} className="flex items-center gap-3 py-2 cursor-pointer">
                    <input type="checkbox" checked={settings[opt.key]} onChange={(e) => updateSetting(opt.key, e.target.checked)} className="w-4 h-4 accent-[#e8540a]" />
                    <span className="text-sm text-[#3d3020]">{opt.label}</span>
                  </label>
                ))}
              </div>
              <div className="bg-white border border-[#ece6dd] rounded-2xl p-5 md:p-6">
                <h3 className="font-bold text-[#1a1208] mb-3">Privacy</h3>
                {[
                  { key: 'showProfile', label: 'Show profile to other students' },
                  { key: 'showActivity', label: 'Show learning activity' },
                ].map((opt) => (
                  <label key={opt.key} className="flex items-center gap-3 py-2 cursor-pointer">
                    <input type="checkbox" checked={settings[opt.key]} onChange={(e) => updateSetting(opt.key, e.target.checked)} className="w-4 h-4 accent-[#e8540a]" />
                    <span className="text-sm text-[#3d3020]">{opt.label}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-[#9e9789]">Saved on this device.</p>
            </div>

          ) : currentView === 'profile' ? (
            <div className="max-w-xl">
              <h1 className="text-2xl font-bold text-[#1a1208] mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>Profile</h1>
              <div className="bg-white border border-[#ece6dd] rounded-2xl p-5 md:p-6 space-y-5">
                <div className="flex items-center gap-4 pb-5 border-b border-[#f0ebe3]">
                  <div className="relative">
                    {avatarUrl ? <img src={avatarUrl} alt="" className="w-20 h-20 rounded-full object-cover border-4 border-[#f0ebe3]" /> : (
                      <div className="w-20 h-20 rounded-full bg-[#e8540a] text-white flex items-center justify-center font-bold text-2xl border-4 border-[#f0ebe3]">{(user?.name || 'S').charAt(0).toUpperCase()}</div>
                    )}
                    {avatarUploading && <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center"><Loader2 size={20} className="animate-spin text-white" /></div>}
                  </div>
                  <div>
                    <label htmlFor="avatar-upload" className="inline-flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-lg border-none cursor-pointer bg-[#e8540a] hover:bg-[#c94708] text-white transition">
                      <Camera size={15} /> Change Photo
                    </label>
                    <input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                    <p className="text-xs text-[#9e9789] mt-1.5">JPG, PNG or WebP.</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#3d3020] mb-1.5">Full Name</label>
                  <input value={profileName} onChange={(e) => setProfileName(e.target.value)} className="w-full border border-[#ece6dd] rounded-xl px-4 py-2.5 text-base text-[#1a1208] outline-none focus:border-[#e8540a] transition" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#3d3020] mb-1.5">Email</label>
                  <input value={user?.email || ''} disabled className="w-full border border-[#ece6dd] rounded-xl px-4 py-2.5 text-base text-[#9e9789] bg-[#f8f4ed]" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#3d3020] mb-1.5">Bio</label>
                  <textarea value={profileBio} onChange={(e) => setProfileBio(e.target.value)} rows={4} placeholder="Tell us about yourself…"
                    className="w-full border border-[#ece6dd] rounded-xl px-4 py-2.5 text-base text-[#1a1208] outline-none focus:border-[#e8540a] transition resize-none" />
                </div>
                <button onClick={saveProfile} disabled={profileSaving} className="flex items-center gap-2 bg-[#e8540a] hover:bg-[#c94708] disabled:opacity-60 text-white font-bold px-5 py-2.5 rounded-xl border-none cursor-pointer transition">
                  {profileSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} {profileSaved ? 'Saved!' : 'Save Changes'}
                </button>
              </div>
            </div>

          ) : currentView === 'certificates' ? (
            <div>
              <h1 className="text-2xl font-bold text-[#1a1208] mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>Certificates</h1>
              <p className="text-[#6b5e4e] mb-6 max-w-xl leading-relaxed">
                Once you complete 100% of a course, your certificate becomes available here to download — it includes your name and the profile photo from your <button onClick={() => handleNavigate('profile')} className="text-[#e8540a] font-semibold bg-transparent border-none p-0 cursor-pointer underline">Profile</button> page, so make sure that's up to date.
              </p>
              {completedEnrollments.length === 0 ? (
                <p className="text-[#9e9789] py-12 text-center">No certificates yet — finish a course to earn one.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {completedEnrollments.map((e) => (
                    <div key={e._id} className="bg-white border-2 border-[#e8dfd0] rounded-2xl p-6 text-center">
                      <div className="relative w-16 h-16 mx-auto mb-4">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-[#fdf2ea]" />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-[#e8540a] text-white flex items-center justify-center font-bold text-xl">{(user?.name || 'S').charAt(0).toUpperCase()}</div>
                        )}
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#fdf2ea] text-[#e8540a] flex items-center justify-center border-2 border-white"><Award size={12} /></div>
                      </div>
                      <h3 className="font-bold text-[#1a1208] mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>{e.course?.title}</h3>
                      <p className="text-xs text-[#9e9789] mb-4">Completed by {user?.name}</p>
                      <button onClick={() => window.print()} className="flex items-center gap-1.5 mx-auto text-sm font-bold px-4 py-2 rounded-lg border-none cursor-pointer bg-[#e8540a] hover:bg-[#c94708] text-white transition">
                        <Download size={14} /> Print / Save PDF
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          ) : currentView === 'progress' ? (
            <div>
              <h1 className="text-2xl font-bold text-[#1a1208] mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>My Progress</h1>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                {[
                  { icon: BookOpen,    label: 'Courses Enrolled', value: enrolledCount,              accent: '#e8540a', bg: '#fdf2ea' },
                  { icon: CheckCircle, label: 'Unlocked',         value: verifiedCount,               accent: '#1a7a4a', bg: '#e8f5ee' },
                  { icon: Award,       label: 'Completed',        value: completedEnrollments.length, accent: '#a5762f', bg: '#faf3e6' },
                ].map((s) => (
                  <div key={s.label} className="bg-white border border-[#ece6dd] rounded-2xl p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: s.bg, color: s.accent }}>
                      <s.icon size={22} />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-[#1a1208] leading-none" style={{ fontVariantNumeric: 'tabular-nums' }}>{s.value}</p>
                      <p className="text-xs font-semibold text-[#9e9789] mt-1.5 uppercase tracking-wide">{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <h2 className="font-bold text-[#1a1208] mb-4">Course Progress</h2>
                {enrollments.length === 0 ? (
                  <p className="text-sm text-[#9e9789]">No courses yet.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {enrollments.map((e) => (
                      <EnrollmentCard key={e._id} enrollment={e} progressPct={progressPctFor(e)} onOpen={openCourse} />
                    ))}
                  </div>
                )}
              </div>
            </div>

          ) : currentView === 'my-notes' ? (
            <div>
              <h1 className="text-2xl font-bold text-[#1a1208] mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>Notes</h1>
              <p className="text-[#9e9789] mb-6">Every note you've saved, grouped by course.</p>
              {myNotesLoading ? (
                <Loader2 size={24} className="animate-spin text-[#e8540a]" />
              ) : notesByCourse.length === 0 ? (
                <p className="text-[#9e9789] py-12 text-center">No notes yet — save one from inside any lecture.</p>
              ) : (
                <div className="max-w-2xl space-y-7">
                  {notesByCourse.map((group) => (
                    <div key={group.key}>
                      <h2 className="text-sm font-bold text-[#1a1208] mb-3 pb-2 border-b border-[#ece6dd]">{group.title}</h2>
                      <div className="space-y-3">
                        {group.items.map((n) => (
                          <div key={n._id} className="bg-white border border-[#ece6dd] rounded-xl p-4">
                            <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                              {n.lectureTitle && <span className="text-xs font-semibold text-[#e8540a]">{n.lectureTitle}</span>}
                              <button onClick={() => deleteMyNote(n._id)} className="bg-transparent border-none cursor-pointer text-[#9e9789] hover:text-red-500 p-0 ml-auto"><Trash2 size={14} /></button>
                            </div>
                            <p className="text-sm text-[#3d3020] mb-1.5">{n.content}</p>
                            <span className="text-xs text-[#9e9789]">{new Date(n.createdAt).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          ) : currentView === 'my-qa' ? (
            <div>
              <h1 className="text-2xl font-bold text-[#1a1208] mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>Q&A</h1>
              <p className="text-[#9e9789] mb-6">Questions and answers, grouped by course.</p>
              {myQuestionsLoading ? (
                <Loader2 size={24} className="animate-spin text-[#e8540a]" />
              ) : questionsByCourse.length === 0 ? (
                <p className="text-[#9e9789] py-12 text-center">No questions yet — ask one from inside any lecture.</p>
              ) : (
                <div className="max-w-2xl space-y-7">
                  {questionsByCourse.map((group) => (
                    <div key={group.key}>
                      <h2 className="text-sm font-bold text-[#1a1208] mb-3 pb-2 border-b border-[#ece6dd]">{group.title}</h2>
                      <div className="space-y-3">
                        {group.items.map((q) => (
                          <div key={q._id} className="bg-white border border-[#ece6dd] rounded-xl p-4">
                            <div className="flex items-center gap-2.5 mb-2">
                              <div className="w-8 h-8 rounded-full bg-[#e8540a] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">{(q.author?.name || '?').charAt(0).toUpperCase()}</div>
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-[#1a1208] truncate">{q.author?.name || 'Student'}</p>
                                <p className="text-xs text-[#9e9789] truncate">{q.lectureTitle ? `${q.lectureTitle} • ` : ''}{new Date(q.createdAt).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <p className="text-sm text-[#3d3020] mb-2.5">{q.text}</p>
                            <button onClick={() => toggleMyUpvote(q._id)} className="flex items-center gap-1.5 text-xs text-[#9e9789] hover:text-[#e8540a] bg-transparent border-none cursor-pointer p-0 mb-3">
                              <ThumbsUp size={13} /> {q.upvotes?.length || 0}
                            </button>
                            {(q.answers || []).map((a, i) => (
                              <div key={i} className="ml-4 pl-3 border-l-2 border-[#f0ebe3] mb-2">
                                <p className="text-xs font-bold text-[#1a1208]">{a.author?.name || 'User'}</p>
                                <p className="text-xs text-[#6b5e4e]">{a.text}</p>
                              </div>
                            ))}
                            <div className="flex gap-2 mt-2">
                              <input value={myAnswerDrafts[q._id] || ''} onChange={(e) => setMyAnswerDrafts((p) => ({ ...p, [q._id]: e.target.value }))}
                                placeholder="Write an answer…" className="flex-1 border border-[#ece6dd] rounded-lg px-3 py-1.5 text-xs text-[#1a1208] outline-none focus:border-[#e8540a]" />
                              <button onClick={() => postMyAnswer(q._id)} className="text-xs font-bold px-3 py-1.5 rounded-lg border-none cursor-pointer bg-[#f0ebe3] hover:bg-[#e8dfd0] text-[#3d3020]">Reply</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          ) : currentView === 'my-resources' ? (
            <div>
              <h1 className="text-2xl font-bold text-[#1a1208] mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>Resources</h1>
              <p className="text-[#9e9789] mb-6">Downloadable resources, grouped by course.</p>
              {myResourcesLoading ? (
                <Loader2 size={24} className="animate-spin text-[#e8540a]" />
              ) : resourcesByCourse.length === 0 ? (
                <p className="text-[#9e9789] py-12 text-center">No resources available yet.</p>
              ) : (
                <div className="max-w-2xl space-y-7">
                  {resourcesByCourse.map((group) => (
                    <div key={group.key}>
                      <h2 className="text-sm font-bold text-[#1a1208] mb-3 pb-2 border-b border-[#ece6dd]">{group.title}</h2>
                      <div className="space-y-2">
                        {group.items.map((r) => (
                          <a key={r.key} href={r.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3.5 bg-white border border-[#ece6dd] rounded-xl hover:border-[#e8540a] transition no-underline">
                            <FileText size={20} className="text-[#e8540a] flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-[#1a1208] truncate">{resourceLabel(r.url, 0)}</p>
                              <p className="text-xs text-[#9e9789] truncate">{r.lectureTitle}</p>
                            </div>
                            <Download size={16} className="text-[#9e9789] flex-shrink-0" />
                          </a>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          ) : currentView === 'courses' ? (
            <div>
              <h1 className="text-2xl font-bold text-[#1a1208] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>My Courses</h1>
              <div className="flex gap-2 mb-6 flex-wrap">
                {[{ id: 'all', label: 'All' }, { id: 'progress', label: 'In Progress' }, { id: 'completed', label: 'Completed' }, { id: 'locked', label: 'Locked' }].map((f) => (
                  <button key={f.id} onClick={() => setCourseFilter(f.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer ${courseFilter === f.id ? 'bg-[#e8540a] text-white border-[#e8540a]' : 'bg-white text-[#3d3020] border-[#ece6dd] hover:border-[#e8540a]'}`}>
                    {f.label}
                  </button>
                ))}
              </div>
              {filteredEnrollments.length === 0 ? <p className="text-[#9e9789] py-12 text-center">No courses in this category yet.</p> : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredEnrollments.map((e) => <EnrollmentCard key={e._id} enrollment={e} progressPct={progressPctFor(e)} onOpen={openCourse} />)}
                </div>
              )}
            </div>

          ) : (
            <div>
              <h1 className="text-2xl font-bold text-[#1a1208] mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>Welcome back, {(user?.name || 'Student').split(' ')[0]}!</h1>
              <p className="text-[#9e9789] mb-6">Continue your learning journey</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                {[
                  { icon: BookOpen,    label: 'Courses Enrolled', value: enrolledCount,               accent: '#e8540a', bg: '#fdf2ea' },
                  { icon: CheckCircle, label: 'Unlocked',         value: verifiedCount,                accent: '#1a7a4a', bg: '#e8f5ee' },
                  { icon: Award,       label: 'Completed',        value: completedEnrollments.length,  accent: '#a5762f', bg: '#faf3e6' },
                ].map((s) => (
                  <div key={s.label} className="bg-white border border-[#ece6dd] rounded-2xl p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: s.bg, color: s.accent }}>
                      <s.icon size={22} />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-[#1a1208] leading-none" style={{ fontVariantNumeric: 'tabular-nums' }}>{s.value}</p>
                      <p className="text-xs font-semibold text-[#9e9789] mt-1.5 uppercase tracking-wide">{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>
              <h2 className="text-lg font-bold text-[#1a1208] mb-4">Your Courses</h2>
              {enrollments.length === 0 ? (
                <div className="bg-white border border-[#ece6dd] rounded-2xl p-8 text-center">
                  <p className="text-[#9e9789] mb-4">You haven't enrolled in any courses yet.</p>
                  <button onClick={() => navigate('/courses')} className="px-5 py-2.5 bg-[#e8540a] hover:bg-[#c94708] text-white font-bold rounded-xl border-none cursor-pointer transition">Browse Courses</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {enrollments.map((e) => <EnrollmentCard key={e._id} enrollment={e} progressPct={progressPctFor(e)} onOpen={openCourse} />)}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
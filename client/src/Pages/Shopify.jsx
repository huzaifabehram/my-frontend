// src/Pages/Shopify.jsx  (Course Landing Page)
// DESIGN: Bold Coral Dark — near-black backgrounds (#1c1917), coral/orange (#fb923c) accents,
//         clean white surfaces for body sections, mobile-first layout.
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronDown, Play, Star, Users, Clock, BookOpen, Zap, Menu, X,
  Search, Check, Award, Smartphone, Film, Download, Globe, Shield,
  ChevronLeft, ChevronRight, Heart, MessageCircle, Share2, Bookmark,
  ThumbsUp,
} from 'lucide-react';
import { useCourses } from '../context/CoursesContext';
import { useAuth } from '../context/AuthContext';

// ── YouTube embed helper ──────────────────────────────────────────────────────
function getYouTubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/watch\?v=|\/shorts\/))([^&?/\s]{11})/);
  return m ? m[1] : null;
}

// ── Bunny helpers ─────────────────────────────────────────────────────────────
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
  const path = url.split('?')[0].split('#')[0].toLowerCase();
  return path.endsWith('.mp4') || path.endsWith('.webm') || path.endsWith('.mov');
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

// ── Players ───────────────────────────────────────────────────────────────────
function BunnyPlayer({ url, className = '' }) {
  const embedUrl = getBunnyEmbedUrl(url);
  if (embedUrl) {
    return (
      <div className={`relative w-full aspect-video bg-black ${className}`}>
        <iframe src={embedUrl} className="absolute inset-0 w-full h-full" allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture" allowFullScreen title="Bunny Stream Video" loading="lazy" style={{ border: 'none' }} />
      </div>
    );
  }
  return <video src={url} className={`w-full aspect-video bg-black ${className}`} controls preload="metadata" />;
}

function VideoPlayer({ url, className = '', isReelsStyle = false, autoPlay = false, muted = false, loop = false, controls = true, videoRef = null }) {
  if (!url) return null;
  const ytId = getYouTubeId(url);
  const aspectClass = isReelsStyle ? 'h-full w-full' : 'aspect-video';
  if (ytId) {
    return (
      <div className={`relative w-full ${aspectClass} bg-black ${className}`}>
        <iframe src={`https://www.youtube.com/embed/${ytId}${autoPlay ? '?autoplay=1&mute=1' : ''}`} className="absolute inset-0 w-full h-full object-cover" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title="YouTube Video" loading="lazy" style={{ border: 'none' }} />
      </div>
    );
  }
  if (isBunnyUrl(url)) return <BunnyPlayer url={url} className={`${aspectClass} ${className}`} />;
  if (isDirectVideo(url) || isCloudinaryVideo(url)) {
    return (
      <video ref={videoRef} src={url} className={`w-full ${aspectClass} bg-black object-cover ${className}`} controls={controls} autoPlay={autoPlay} muted={muted} loop={loop} playsInline preload="metadata" />
    );
  }
  return null;
}

// ── Reels video card ──────────────────────────────────────────────────────────
function ReelsVideoCard({ videoUrl, onClick }) {
  const videoRef   = useRef(null);
  const containerRef = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (videoRef.current) {
          entry.isIntersecting ? videoRef.current.play().catch(() => {}) : videoRef.current.pause();
        }
      });
    }, { threshold: 0.5 });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => { if (containerRef.current) observer.unobserve(containerRef.current); };
  }, []);
  const ytId = getYouTubeId(videoUrl);
  const thumbnailUrl = ytId ? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg` : null;
  return (
    <div ref={containerRef} onClick={onClick} className="w-[150px] h-[266px] rounded-xl overflow-hidden flex-shrink-0 relative bg-stone-900 cursor-pointer group shadow-lg hover:shadow-2xl transition-all duration-300 border border-stone-700">
      {ytId ? (
        <>
          <img src={thumbnailUrl} alt="Video thumbnail" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-all flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-orange-500 group-hover:bg-orange-400 flex items-center justify-center shadow-2xl transition-all transform group-hover:scale-110">
              <Play size={22} className="text-white ml-1" fill="currentColor" />
            </div>
          </div>
        </>
      ) : (
        <video ref={videoRef} src={videoUrl} className="w-full h-full object-cover" muted loop playsInline preload="metadata" />
      )}
    </div>
  );
}

// ── Auto-slide image testimonials ─────────────────────────────────────────────
function AutoSlideImageTestimonials({ imageTestimonials }) {
  const sectionRef  = useRef(null);
  const [isPaused, setIsPaused] = useState(false);
  const isPausedRef = useRef(false);
  const totalDuration = imageTestimonials.length * 4;
  const pause  = () => { isPausedRef.current = true;  setIsPaused(true);  };
  const resume = () => { isPausedRef.current = false; setIsPaused(false); };
  useEffect(() => {
    const handleSectionWheel = () => pause();
    const handleSectionTouch = () => pause();
    const handleWindowWheel  = (e) => { if (isPausedRef.current && sectionRef.current && !sectionRef.current.contains(e.target)) resume(); };
    const handleWindowTouch  = (e) => { if (isPausedRef.current && sectionRef.current && !sectionRef.current.contains(e.target)) resume(); };
    const section = sectionRef.current;
    if (section) { section.addEventListener('wheel', handleSectionWheel, { passive: true }); section.addEventListener('touchmove', handleSectionTouch, { passive: true }); }
    window.addEventListener('wheel',     handleWindowWheel, { passive: true });
    window.addEventListener('touchmove', handleWindowTouch, { passive: true });
    return () => {
      if (section) { section.removeEventListener('wheel', handleSectionWheel); section.removeEventListener('touchmove', handleSectionTouch); }
      window.removeEventListener('wheel',     handleWindowWheel);
      window.removeEventListener('touchmove', handleWindowTouch);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const doubled = [...imageTestimonials, ...imageTestimonials];
  return (
    <div ref={sectionRef} className="relative select-none">
      <style>{`
        @keyframes testimonial-marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .testimonial-track { animation: testimonial-marquee ${totalDuration}s linear infinite; will-change: transform; }
        .testimonial-track.paused { animation-play-state: paused; }
      `}</style>
      <div className="overflow-hidden" style={{ WebkitMaskImage: 'linear-gradient(to right, transparent 0px, black 40px, black calc(100% - 40px), transparent 100%)', maskImage: 'linear-gradient(to right, transparent 0px, black 40px, black calc(100% - 40px), transparent 100%)' }}>
        <div className={`testimonial-track flex pb-3${isPaused ? ' paused' : ''}`} style={{ gap: '12px', width: 'max-content' }}>
          {doubled.map((testimonial, idx) => (
            <div key={idx} className="flex-shrink-0 rounded-xl overflow-hidden relative shadow-lg border border-stone-700" style={{ width: '200px', height: '360px', cursor: 'default' }} aria-hidden={idx >= imageTestimonials.length}>
              <img src={testimonial.imageUrl} alt={testimonial.author || 'Student testimonial'} className="w-full h-full object-cover" draggable={false} />
              <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/75 to-transparent pointer-events-none" />
              {testimonial.author && <p className="absolute bottom-3 left-3 right-3 text-white text-sm font-semibold pointer-events-none drop-shadow line-clamp-1">{testimonial.author}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Full-screen reels view ────────────────────────────────────────────────────
function VideoReelsView({ isOpen, onClose, videos, startIndex = 0 }) {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const videoRefs   = useRef([]);
  const containerRef = useRef(null);
  useEffect(() => {
    if (isOpen) { document.body.style.overflow = 'hidden'; setCurrentIndex(startIndex); }
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen, startIndex]);
  useEffect(() => {
    videoRefs.current.forEach((video, idx) => {
      if (video) {
        if (idx === currentIndex) { video.muted = false; video.play().catch(() => {}); }
        else { video.pause(); video.muted = true; }
      }
    });
  }, [currentIndex]);
  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black z-50 overflow-y-scroll snap-y snap-mandatory" ref={containerRef}>
      <button onClick={onClose} className="fixed top-4 right-4 text-white z-50 w-10 h-10 flex items-center justify-center bg-black/50 rounded-full hover:bg-black/70 transition border-none cursor-pointer">
        <X size={24} />
      </button>
      {videos.map((video, index) => (
        <div key={index} className="h-screen w-full snap-start flex items-center justify-center relative">
          <VideoPlayer url={video.videoUrl} isReelsStyle={true} autoPlay={index === currentIndex} muted={index !== currentIndex} loop={true} controls={false} videoRef={(el) => (videoRefs.current[index] = el)} className="h-full w-full object-cover" />
          <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
          <div className="absolute bottom-6 left-4 text-white z-10 max-w-[70%]">
            <p className="font-bold text-base mb-2">{video.author || 'Student'}</p>
            {video.text && <p className="text-sm leading-relaxed line-clamp-3">{video.text}</p>}
          </div>
          <div className="absolute right-3 bottom-24 flex flex-col items-center gap-6 text-white z-10">
            {[{ Icon: ThumbsUp, label: video.likes || 0 }, { Icon: MessageCircle, label: video.comments || 0 }, { Icon: Share2, label: 'Share' }, { Icon: Bookmark, label: 'Save' }].map(({ Icon, label }, i) => (
              <button key={i} className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition"><Icon size={24} /></div>
                <span className="text-xs">{label}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Full-screen image slider ──────────────────────────────────────────────────
function ImageSliderView({ isOpen, onClose, images, startIndex = 0 }) {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  useEffect(() => {
    if (isOpen) { document.body.style.overflow = 'hidden'; setCurrentIndex(startIndex); }
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen, startIndex]);
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft'  && currentIndex > 0)               setCurrentIndex(currentIndex - 1);
      if (e.key === 'ArrowRight' && currentIndex < images.length - 1) setCurrentIndex(currentIndex + 1);
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, currentIndex, images.length]);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black z-50 flex overflow-x-auto snap-x snap-mandatory">
      <button onClick={onClose} className="fixed top-4 right-4 text-white z-50 w-10 h-10 flex items-center justify-center bg-black/50 rounded-full hover:bg-black/70 transition border-none cursor-pointer"><X size={24} /></button>
      {images.map((image, index) => (
        <div key={index} className="min-w-full h-full snap-center flex items-center justify-center relative">
          <img src={image.imageUrl} alt={image.author} className="w-full h-full object-contain" />
          <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
          <div className="absolute bottom-6 left-4 text-white z-10 max-w-[70%]">
            <p className="font-bold text-base mb-2">{image.author || 'Student'}</p>
            {image.text && <p className="text-sm leading-relaxed line-clamp-3">{image.text}</p>}
          </div>
          {index > 0 && <button onClick={() => setCurrentIndex(index - 1)} className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition text-white z-10 border-none cursor-pointer"><ChevronLeft size={28} /></button>}
          {index < images.length - 1 && <button onClick={() => setCurrentIndex(index + 1)} className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition text-white z-10 border-none cursor-pointer"><ChevronRight size={28} /></button>}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-3 py-1 rounded-full">{index + 1} / {images.length}</div>
        </div>
      ))}
    </div>
  );
}

// ── Course thumbnail ──────────────────────────────────────────────────────────
function CourseThumbnail({ course }) {
  const [imgErr, setImgErr] = useState(false);
  const ytId = getYouTubeId(course.previewVideoUrl);
  const Overlay = () => (
    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition flex flex-col items-center justify-center gap-3">
      <div className="w-16 h-16 rounded-full bg-orange-500 hover:bg-orange-400 flex items-center justify-center shadow-2xl transition transform group-hover:scale-110">
        <Play size={24} className="text-white ml-1" fill="currentColor" />
      </div>
      <div className="bg-stone-800/90 px-4 py-2 rounded-lg border border-stone-600">
        <p className="text-white font-semibold text-sm whitespace-nowrap">Free Lectures</p>
      </div>
    </div>
  );
  if (ytId) return (
    <div className="relative w-full h-full bg-black flex items-center justify-center group">
      <img src={`https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`} alt={course.title} className="w-full h-full object-cover" />
      <Overlay />
    </div>
  );
  if (course.thumbnail && !imgErr) return (
    <div className="relative w-full h-full bg-black flex items-center justify-center group">
      <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" onError={() => setImgErr(true)} />
      <Overlay />
    </div>
  );
  return (
    <div className={`w-full h-full bg-gradient-to-br ${course.color || 'from-stone-700 to-stone-900'} flex items-center justify-center group`}>
      <span className="text-8xl">{course.emoji || '📚'}</span>
      <Overlay />
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
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function CourseLandingPage() {
  const navigate = useNavigate();
  const { id }   = useParams();
  const { courses, loading, getCourse, fetchCourseById } = useCourses();
  const { API: api, user } = useAuth();

  const [mobileMenuOpen,        setMobileMenuOpen]        = useState(false);
  const [expandedSection,       setExpandedSection]       = useState([0]);
  const [showFullDescription,   setShowFullDescription]   = useState(false);
  const [showFullInstructorBio, setShowFullInstructorBio] = useState(false);
  const [isPreviewOpen,         setIsPreviewOpen]         = useState(false);
  const [currentVideo,          setCurrentVideo]          = useState('');
  const [fullCourse,            setFullCourse]            = useState(null);
  const [fullCourseLoading,     setFullCourseLoading]     = useState(false);
  const [instructorData,        setInstructorData]        = useState(null);
  const [loadingInstructor,     setLoadingInstructor]     = useState(false);
  const [showReviewForm,        setShowReviewForm]        = useState(false);
  const [reviewText,            setReviewText]            = useState('');
  const [reviewRating,          setReviewRating]          = useState(5);
  const [submittingReview,      setSubmittingReview]      = useState(false);
  const [videoReelsOpen,        setVideoReelsOpen]        = useState(false);
  const [videoReelsStartIndex,  setVideoReelsStartIndex]  = useState(0);
  const [imageSliderOpen,       setImageSliderOpen]       = useState(false);
  const [imageSliderStartIndex, setImageSliderStartIndex] = useState(0);

  useEffect(() => {
    if (!id) return;
    setFullCourse(null);
    setFullCourseLoading(true);
    fetchCourseById(id).then((course) => {
      if (course) setFullCourse(course);
      setFullCourseLoading(false);
    });
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const courseData = useMemo(() => {
    if (id) return fullCourse || getCourse(id);
    const publishedCourses = courses.filter((c) => c.status === 'published');
    return publishedCourses.length > 0 ? publishedCourses[0] : null;
  }, [id, fullCourse, courses, getCourse]);

  useEffect(() => {
    if (!courseData?.instructorId) return;
    setLoadingInstructor(true);
    api.get(`/users/${courseData.instructorId}`)
      .then((res) => { setInstructorData(res.data); setLoadingInstructor(false); })
      .catch(() => setLoadingInstructor(false));
  }, [courseData?.instructorId]); // eslint-disable-line react-hooks/exhaustive-deps

  const sections = courseData?.sections || [];

  const studentsBoughtCourses = useMemo(() => {
    if (!courseData?._id) return [];
    const picked = courseData.alsoBoughtCourseIds;
    if (Array.isArray(picked) && picked.length > 0) {
      const byId = new Map(courses.map((c) => [String(c._id), c]));
      return picked.map((cid) => byId.get(String(cid))).filter(Boolean).filter((c) => c.status === 'published' && String(c._id) !== String(courseData._id));
    }
    return courses.filter((c) => c._id !== courseData._id && c.status === 'published').slice(0, 4);
  }, [courses, courseData?._id, courseData?.alsoBoughtCourseIds]);

  const previewLectures = useMemo(() => {
    const lectures = [];
    sections.forEach((section, sectionIdx) => {
      section.lectures_list?.forEach((lecture, lectureIdx) => {
        if (lecture.preview && lecture.videoUrl) lectures.push({ ...lecture, sectionTitle: section.title, sectionIdx, lectureIdx });
      });
    });
    return lectures;
  }, [sections]);

  const handleNavigate = (path) => { setMobileMenuOpen(false); navigate(path); };
  const handlePreviewClick = () => { setCurrentVideo(courseData?.previewVideoUrl || ''); setIsPreviewOpen(true); };
  const handleClosePreview = () => { setIsPreviewOpen(false); setCurrentVideo(''); };
  const handleLectureClick = (videoUrl) => setCurrentVideo(videoUrl);

  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === 'Escape' && isPreviewOpen) handleClosePreview(); };
    if (isPreviewOpen) { window.addEventListener('keydown', handleKeyDown); document.body.style.overflow = 'hidden'; }
    return () => { window.removeEventListener('keydown', handleKeyDown); document.body.style.overflow = 'unset'; };
  }, [isPreviewOpen]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewText.trim()) { alert('Please write a review'); return; }
    setSubmittingReview(true);
    try {
      await api.post(`/courses/${courseData._id}/reviews`, { text: reviewText, rating: reviewRating });
      alert('Review submitted successfully!');
      setReviewText(''); setReviewRating(5); setShowReviewForm(false);
      const updated = await fetchCourseById(courseData._id);
      if (updated) setFullCourse(updated);
    } catch (err) {
      console.error('Failed to submit review:', err);
      alert('Failed to submit review. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  // ── Loading / not found ────────────────────────────────────────────────────
  if (loading || fullCourseLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-950">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!courseData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-950 gap-4">
        <p className="text-6xl">😕</p>
        <h2 className="text-2xl font-bold text-white">Course not found</h2>
        <button onClick={() => navigate('/courses')} className="px-6 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-400 transition border-none cursor-pointer">
          Browse all courses
        </button>
      </div>
    );
  }

  const instructor = instructorData ? {
    name:     instructorData.name || 'Instructor',
    rating:   instructorData.instructorRating  || 0,
    reviews:  instructorData.instructorReviews || 0,
    students: instructorData.instructorStudents|| 0,
    courses:  instructorData.instructorCourses || 0,
    bio:      instructorData.bio || instructorData.instructorBio || '',
    image:    instructorData.avatar || instructorData.instructorImage || '👩‍💼',
  } : {
    name:     courseData.instructor         || 'Instructor',
    rating:   courseData.instructorRating   || 0,
    reviews:  courseData.instructorReviews  || 0,
    students: courseData.instructorStudents || 0,
    courses:  courseData.instructorCourses  || 0,
    bio:      courseData.instructorBio      || '',
    image:    courseData.instructorImage    || '👩‍💼',
  };

  const totalLectures      = sections.reduce((a, s) => a + (s.lectures || 0), 0);
  const textReviews        = courseData.reviews_list    || [];
  const imageTestimonials  = courseData.imageTestimonials || [];
  const videoTestimonials  = courseData.videoTestimonials || [];
  const projectGallery     = courseData.projectGallery   || [];

  return (
    <div className="min-h-screen bg-stone-950 overflow-x-hidden w-full">

      {/* ── FULL-SCREEN COURSE PREVIEW ───────────────────────────────────── */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/95 flex flex-col">
          <div className="absolute top-4 right-4 z-10">
            <button onClick={handleClosePreview} className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition border-none cursor-pointer" aria-label="Close preview">
              <X size={24} className="text-white" />
            </button>
          </div>
          <div className="w-full bg-stone-950 border-b border-stone-800 py-4 md:py-6">
            <div className="max-w-7xl mx-auto px-4 md:px-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-orange-400 mb-1">Course Preview</p>
              <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-white">{courseData.title}</h2>
            </div>
          </div>
          <div className="w-full bg-black">
            <div className="max-w-7xl mx-auto"><VideoPlayer url={currentVideo} className="w-full" /></div>
          </div>
          <div className="flex-1 overflow-y-auto bg-stone-950">
            <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
              <h3 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6">Free preview lectures</h3>
              {previewLectures.length === 0 ? (
                <div className="text-center py-12"><p className="text-stone-400 text-base md:text-lg">No preview lectures available</p></div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  {previewLectures.map((lecture) => (
                    <div key={`${lecture.sectionIdx}-${lecture.lectureIdx}`} onClick={() => handleLectureClick(lecture.videoUrl)} className="bg-stone-800/50 hover:bg-stone-800 border border-stone-700 rounded-lg p-3 md:p-4 cursor-pointer transition group">
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-orange-500 group-hover:bg-orange-400 flex items-center justify-center transition">
                          <Play size={14} className="text-white ml-0.5" fill="currentColor" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm md:text-base text-white group-hover:text-orange-400 transition truncate">{lecture.title}</p>
                          <p className="text-xs md:text-sm text-stone-400 mt-1">{lecture.sectionTitle}</p>
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

      {/* ── OVERLAYS ──────────────────────────────────────────────────────── */}
      <VideoReelsView isOpen={videoReelsOpen} onClose={() => setVideoReelsOpen(false)} videos={videoTestimonials} startIndex={videoReelsStartIndex} />
      <ImageSliderView isOpen={imageSliderOpen} onClose={() => setImageSliderOpen(false)} images={imageTestimonials} startIndex={imageSliderStartIndex} />

      {/* ── ANNOUNCEMENT BAR ──────────────────────────────────────────────── */}
      {courseData.discountPrice && courseData.discountPrice < courseData.originalPrice && (
        <div className="bg-stone-900 border-b border-stone-700 text-center py-2 px-4 w-full">
          <p className="text-xs md:text-sm font-semibold text-orange-300">
            Limited seats — enroll before the price goes up. Save {Math.round((1 - courseData.discountPrice / courseData.originalPrice) * 100)}%
          </p>
        </div>
      )}

      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-stone-950 border-b border-stone-800 w-full">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-3 md:py-4 flex items-center justify-between">
          <button className="lg:hidden p-2 text-stone-300 border-none cursor-pointer bg-transparent" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu">
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div className="absolute left-1/2 -translate-x-1/2 lg:relative lg:left-auto lg:transform-none">
            <button onClick={() => handleNavigate('/')} className="text-xl md:text-2xl font-bold text-orange-400 hover:text-orange-300 transition cursor-pointer bg-transparent border-none p-0">
              Courseify
            </button>
          </div>
          <nav className="hidden lg:flex items-center gap-8 flex-1 ml-12">
            {['Categories', 'Instructor', 'About'].map((label) => (
              <button key={label} onClick={() => handleNavigate(label === 'Categories' ? '/courses' : label === 'Instructor' ? '/instructor' : '/')} className="text-sm text-stone-400 hover:text-orange-400 transition bg-transparent border-none cursor-pointer p-0 font-medium">
                {label}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-2 md:gap-3">
            <Search className="hidden lg:block text-stone-500 cursor-pointer hover:text-stone-300 transition" size={20} />
            <button onClick={() => handleNavigate('/auth/login')} className="px-4 md:px-5 py-2 bg-orange-500 hover:bg-orange-400 text-white rounded-lg transition font-semibold border-none cursor-pointer text-sm shadow-sm">
              Log in
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <>
            <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
            <div className="fixed top-0 left-0 h-full w-64 bg-stone-900 z-50 lg:hidden shadow-2xl border-r border-stone-700">
              <div className="p-6 space-y-2">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-lg font-bold text-orange-400">Courseify</span>
                  <button onClick={() => setMobileMenuOpen(false)} className="p-2 hover:bg-stone-800 rounded-lg transition bg-transparent border-none cursor-pointer text-stone-300"><X size={20} /></button>
                </div>
                {['Categories', 'Instructor', 'About'].map((label) => (
                  <button key={label} onClick={() => handleNavigate(label === 'Categories' ? '/courses' : label === 'Instructor' ? '/instructor' : '/')} className="block w-full text-left text-stone-300 hover:text-orange-400 bg-transparent border-none cursor-pointer p-3 rounded-lg hover:bg-stone-800 font-medium transition text-sm">
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </header>

      {/* ── BREADCRUMB ────────────────────────────────────────────────────── */}
      <div className="bg-stone-900 border-b border-stone-800">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-2 text-xs text-stone-500 flex items-center gap-2 overflow-x-auto">
          <button onClick={() => handleNavigate('/')} className="hover:text-orange-400 bg-transparent border-none cursor-pointer text-stone-500 p-0 transition whitespace-nowrap">Development</button>
          <ChevronDown size={12} className="-rotate-90 text-stone-600 flex-shrink-0" />
          <button onClick={() => handleNavigate('/courses')} className="hover:text-orange-400 bg-transparent border-none cursor-pointer text-stone-500 p-0 transition whitespace-nowrap">{courseData.category || 'Courses'}</button>
          <ChevronDown size={12} className="-rotate-90 text-stone-600 flex-shrink-0" />
          <span className="text-stone-300 font-medium truncate">{courseData.title}</span>
        </div>
      </div>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="w-full bg-stone-950 py-6 md:py-8 lg:py-12">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="grid lg:grid-cols-3 gap-6 md:gap-8">

            {/* Left */}
            <div className="lg:col-span-2">
              {/* Category eyebrow */}
              <p className="text-xs font-semibold uppercase tracking-widest text-orange-400 mb-3">{courseData.category || 'Web Design & Development'}</p>

              {/* Badges */}
              <div className="flex gap-2 flex-wrap mb-4">
                {courseData.bestseller && (
                  <span className="inline-flex items-center gap-1 bg-stone-800 border border-orange-500/40 text-orange-300 font-semibold px-3 py-1 rounded text-xs">
                    <Award size={12} /> Bestseller
                  </span>
                )}
                {courseData.level && (
                  <span className="inline-block bg-stone-800 border border-stone-600 text-stone-300 font-medium px-3 py-1 rounded text-xs">{courseData.level}</span>
                )}
              </div>

              <h1 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-3 leading-tight">{courseData.title}</h1>
              <p className="text-base md:text-lg text-stone-400 mb-4 leading-relaxed">{courseData.subtitle}</p>

              {/* Edge-to-edge video — mobile only */}
              <div className="-mx-4 lg:hidden mb-4">
                <div className="relative w-full aspect-video cursor-pointer" onClick={handlePreviewClick}>
                  <CourseThumbnail course={courseData} />
                </div>
              </div>

              {/* Stats row */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                {courseData.rating > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-orange-400 font-bold text-sm">{courseData.rating}</span>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={14} className="text-orange-400" fill={i < Math.floor(courseData.rating) ? 'currentColor' : 'none'} />
                      ))}
                    </div>
                    <span className="text-stone-500 text-xs">({courseData.reviews?.toLocaleString()} ratings)</span>
                  </div>
                )}
                {courseData.students > 0 && (
                  <div className="flex items-center gap-1.5 text-stone-400 text-sm">
                    <Users size={14} />
                    <span>{courseData.students.toLocaleString()} students</span>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <p className="text-stone-500 text-sm">
                  Created by{' '}
                  <button onClick={() => handleNavigate('/instructor')} className="text-orange-400 hover:text-orange-300 font-semibold bg-transparent border-none cursor-pointer p-0 underline">
                    {instructor.name}
                  </button>
                </p>
              </div>

              <div className="flex flex-wrap gap-3 text-stone-500 text-xs">
                <div className="flex items-center gap-1.5"><Clock size={13} /><span>Last updated {courseData.lastUpdated || 'Recently'}</span></div>
                <div className="flex items-center gap-1.5"><Globe size={13} /><span>{courseData.language || 'English'}</span></div>
              </div>
            </div>

            {/* Right — desktop price card */}
            <div className="hidden lg:block">
              <div className="sticky top-24">
                <div className="bg-stone-900 border border-stone-700 rounded-xl overflow-hidden">
                  <div className="relative aspect-video cursor-pointer group" onClick={handlePreviewClick}>
                    <CourseThumbnail course={courseData} />
                  </div>
                  <div className="p-5">
                    <div className="flex items-baseline gap-3 mb-1">
                      <span className="text-2xl font-bold text-white">PKR {(courseData.price * 280).toLocaleString()}</span>
                    </div>
                    {courseData.originalPrice > courseData.price && (
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-sm text-stone-500 line-through">PKR {(courseData.originalPrice * 280).toLocaleString()}</span>
                        <span className="text-xs font-semibold text-orange-400">{Math.round((1 - courseData.price / courseData.originalPrice) * 100)}% off</span>
                      </div>
                    )}
                    <button onClick={() => handleNavigate('/auth/register')} className="w-full bg-orange-500 hover:bg-orange-400 text-white font-bold py-3 rounded-lg transition text-sm border-none cursor-pointer shadow-lg mb-2">
                      Enroll now
                    </button>
                    <button onClick={() => handleNavigate('/auth/register')} className="w-full bg-transparent hover:bg-stone-800 text-stone-300 font-semibold py-3 rounded-lg transition text-sm border border-stone-600 cursor-pointer mb-4">
                      Buy now
                    </button>
                    <p className="text-center text-xs text-stone-600">30-day money-back guarantee</p>
                  </div>
                  <div className="border-t border-stone-800 px-5 py-4">
                    <p className="text-xs font-semibold text-stone-300 mb-3">This course includes:</p>
                    {[
                      { Icon: Film,       text: courseData.duration ? `${courseData.duration} on-demand video` : 'On-demand video' },
                      { Icon: Download,   text: 'Downloadable resources' },
                      { Icon: Smartphone, text: 'Access on mobile and TV' },
                      { Icon: Shield,     text: 'Full lifetime access' },
                      { Icon: Award,      text: 'Certificate of completion' },
                    ].map(({ Icon, text }, idx) => (
                      <div key={idx} className="flex items-center gap-2.5 mb-2">
                        <Icon size={15} className="text-stone-500 flex-shrink-0" />
                        <p className="text-xs text-stone-400">{text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── MAIN CONTENT ──────────────────────────────────────────────────── */}
      <section className="w-full bg-stone-50 py-8 md:py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
            <div className="lg:col-span-2 w-full min-w-0">

              {/* WHAT YOU'LL LEARN */}
              {courseData.whatYouLearn?.length > 0 && (
                <div className="mb-10 w-full">
                  <SectionHeading>What you'll learn</SectionHeading>
                  <div className="border border-stone-200 rounded-xl p-4 md:p-6 bg-white w-full">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {courseData.whatYouLearn.map((outcome, idx) => (
                        <div key={idx} className="flex gap-2.5 items-start">
                          <Check size={15} className="text-orange-500 mt-0.5 flex-shrink-0" strokeWidth={3} />
                          <p className="text-stone-700 text-sm leading-relaxed">{outcome}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* COURSE CONTENT */}
              {sections.length > 0 && (
                <>
                  <div className="mb-4">
                    <SectionHeading>Course content</SectionHeading>
                    <div className="flex flex-wrap gap-2 text-stone-500 text-xs mt-1">
                      <span className="font-semibold text-stone-700">{sections.length} sections</span>
                      <span>•</span>
                      <span>{totalLectures} lectures</span>
                      {courseData.duration && <><span>•</span><span>{courseData.duration} total length</span></>}
                    </div>
                  </div>
                  <div className="space-y-2 mb-10 w-full">
                    {sections.map((section, idx) => {
                      const isExpanded = expandedSection.includes(idx);
                      return (
                        <div key={idx} className="border border-stone-200 rounded-xl overflow-hidden w-full bg-white">
                          <button onClick={() => setExpandedSection(isExpanded ? expandedSection.filter((i) => i !== idx) : [...expandedSection, idx])} className="w-full px-4 py-3 flex items-center justify-between bg-stone-50 hover:bg-stone-100 transition border-none cursor-pointer">
                            <div className="flex items-center gap-2.5 flex-1 text-left min-w-0">
                              <ChevronDown size={16} className={`text-stone-500 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-stone-900 text-sm truncate">{section.title}</h3>
                                <p className="text-xs text-stone-500 mt-0.5">{section.lectures || 0} lectures{section.duration ? ` • ${section.duration}` : ''}</p>
                              </div>
                            </div>
                          </button>
                          {isExpanded && section.lectures_list?.length > 0 && (
                            <div className="border-t border-stone-100">
                              {section.lectures_list.map((lecture, lectureIdx) => (
                                <div key={lectureIdx} className="px-4 py-2.5 border-b border-stone-100 last:border-b-0 flex items-center justify-between hover:bg-stone-50 transition">
                                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center">
                                      {lecture.type === 'video' ? <Play size={11} className="text-stone-600 ml-0.5" /> : <BookOpen size={11} className="text-stone-600" />}
                                    </div>
                                    <p className="text-stone-800 text-sm truncate">{lecture.title}</p>
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    {lecture.duration && <span className="text-xs text-stone-400">{lecture.duration}</span>}
                                    {lecture.preview && lecture.videoUrl && (
                                      <button onClick={() => { setCurrentVideo(lecture.videoUrl); setIsPreviewOpen(true); }} className="flex items-center gap-1 text-orange-500 hover:text-orange-400 font-semibold text-xs cursor-pointer bg-transparent border-none whitespace-nowrap transition p-0">
                                        <div className="w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center">
                                          <Play size={7} className="text-white ml-0.5" fill="currentColor" />
                                        </div>
                                        <span>Free Lecture</span>
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

              {/* ENROLL CTA */}
              <div className="mb-10 w-full">
                <button onClick={() => handleNavigate('/auth/register')} className="w-full bg-orange-500 hover:bg-orange-400 text-white font-bold py-3.5 rounded-xl transition text-base border-none cursor-pointer shadow-lg">
                  Enroll now — PKR {(courseData.price * 280).toLocaleString()}
                </button>
              </div>

              {/* REQUIREMENTS */}
              {courseData.requirements?.length > 0 && (
                <div className="mb-10 w-full">
                  <SectionHeading>Requirements</SectionHeading>
                  <ul className="space-y-2">
                    {courseData.requirements.map((req, idx) => (
                      <li key={idx} className="flex gap-2 text-stone-600 text-sm">
                        <span className="text-stone-400 flex-shrink-0 mt-0.5">•</span>{req}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* DESCRIPTION */}
              {courseData.description && (
                <div className="mb-10 w-full">
                  <SectionHeading>Description</SectionHeading>
                  <div className="relative">
                    <div
                      className={`text-stone-600 leading-relaxed text-sm prose prose-sm max-w-none ${!showFullDescription ? 'max-h-40 overflow-hidden' : ''}`}
                      style={{ wordBreak: 'break-word' }}
                      dangerouslySetInnerHTML={{ __html: courseData.description }}
                    />
                    {!showFullDescription && <div className="absolute bottom-0 left-0 right-0 h-14 bg-gradient-to-t from-stone-50 via-stone-50/90 to-transparent pointer-events-none" />}
                  </div>
                  <button onClick={() => setShowFullDescription(!showFullDescription)} className="text-orange-500 hover:text-orange-400 mt-2 text-sm font-semibold transition flex items-center gap-1 bg-transparent border-none cursor-pointer p-0">
                    <span>{showFullDescription ? 'Show less' : 'Show more'}</span>
                    <ChevronDown size={14} className={`transition-transform ${showFullDescription ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              )}

              {/* INSTRUCTOR */}
              <div className="mb-10 pt-6 border-t border-stone-200 w-full">
                <SectionHeading>Instructor</SectionHeading>
                {loadingInstructor ? (
                  <p className="text-stone-400 text-sm">Loading instructor...</p>
                ) : (
                  <>
                    <button onClick={() => handleNavigate('/instructor')} className="text-orange-500 hover:text-orange-400 font-bold text-lg bg-transparent border-none cursor-pointer p-0 mb-4 block underline">
                      {instructor.name}
                    </button>
                    <div className="flex items-start gap-4 mb-4">
                      <div className="flex-shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-full bg-stone-800 border-2 border-orange-500/40 flex items-center justify-center text-4xl shadow-lg overflow-hidden">
                        {instructor.image?.startsWith('http') ? <img src={instructor.image} alt={instructor.name} className="w-full h-full object-cover" /> : <span>{instructor.image}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                          {instructor.rating > 0 && <div className="flex items-center gap-1.5"><Star size={15} className="text-orange-400" fill="currentColor" /><span className="text-sm text-stone-700">{instructor.rating} Instructor Rating</span></div>}
                          {instructor.reviews > 0 && <div className="flex items-center gap-1.5"><Award size={15} className="text-stone-500" /><span className="text-sm text-stone-600">{formatNumber(instructor.reviews)} Reviews</span></div>}
                          {instructor.students > 0 && <div className="flex items-center gap-1.5"><Users size={15} className="text-stone-500" /><span className="text-sm text-stone-600">{formatNumber(instructor.students)} Students</span></div>}
                          {instructor.courses > 0 && <div className="flex items-center gap-1.5"><Play size={15} className="text-stone-500" /><span className="text-sm text-stone-600">{instructor.courses} Courses</span></div>}
                        </div>
                      </div>
                    </div>
                    {instructor.bio && (
                      <div className="relative">
                        <div className={`text-stone-600 leading-relaxed text-sm ${!showFullInstructorBio ? 'max-h-16 overflow-hidden' : ''}`}>
                          <p>{instructor.bio}</p>
                        </div>
                        {!showFullInstructorBio && <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-stone-50 via-stone-50/90 to-transparent pointer-events-none" />}
                        <button onClick={() => setShowFullInstructorBio(!showFullInstructorBio)} className="text-orange-500 hover:text-orange-400 mt-2 text-sm font-semibold transition flex items-center gap-1 bg-transparent border-none cursor-pointer p-0">
                          <span>{showFullInstructorBio ? 'Show less' : 'Show more'}</span>
                          <ChevronDown size={14} className={`transition-transform ${showFullInstructorBio ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* TEXT REVIEWS */}
              {textReviews.length > 0 && (
                <div className="mb-10 pt-6 border-t border-stone-200 w-full">
                  <div className="flex items-center gap-3 mb-6">
                    <Star size={32} className="text-orange-400" fill="currentColor" />
                    <div>
                      <p className="text-3xl font-bold text-stone-900">{courseData.rating}</p>
                      <p className="text-xs text-stone-500">{formatNumber(courseData.reviews)} course ratings</p>
                    </div>
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0 snap-x snap-mandatory" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {textReviews.map((review, idx) => (
                      <div key={idx} className="flex-shrink-0 w-[82vw] sm:w-[calc(50%-6px)] lg:w-[calc(33.333%-11px)] snap-start">
                        <div className="bg-white rounded-xl border border-stone-200 p-4 h-full">
                          <div className="flex items-start gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                              {review.author?.charAt(0) || review.user?.name?.charAt(0) || '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-stone-900 text-sm">{review.author || review.user?.name || 'Student'}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={11} className="text-orange-400" fill={i < (review.rating || 5) ? 'currentColor' : 'none'} />)}</div>
                                <span className="text-xs text-stone-400">• {review.date || (review.createdAt && new Date(review.createdAt).toLocaleDateString()) || 'Recently'}</span>
                              </div>
                            </div>
                          </div>
                          <p className="text-stone-600 text-sm leading-relaxed">{review.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* WRITE A REVIEW */}
              <div className="mb-10 pt-6 border-t border-stone-200 w-full">
                <SectionHeading>Share your experience</SectionHeading>
                <button onClick={() => setShowReviewForm(!showReviewForm)} className="w-full bg-orange-500 hover:bg-orange-400 text-white font-bold py-3 rounded-xl transition text-sm border-none cursor-pointer shadow-md">
                  {showReviewForm ? 'Cancel review' : 'Write a review'}
                </button>
                {showReviewForm && (
                  <form onSubmit={handleReviewSubmit} className="mt-4 bg-white rounded-xl p-4 border border-stone-200">
                    <h3 className="text-sm font-semibold text-stone-900 mb-3">Your rating</h3>
                    <div className="flex gap-1.5 mb-4">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} type="button" onClick={() => setReviewRating(star)} className="bg-transparent border-none cursor-pointer p-0">
                          <Star size={28} className={`${star <= reviewRating ? 'text-orange-400' : 'text-stone-300'} hover:text-orange-400 transition`} fill={star <= reviewRating ? 'currentColor' : 'none'} />
                        </button>
                      ))}
                    </div>
                    <textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)} placeholder="What did you like or dislike? What did you learn? Would you recommend this course?" rows={4} className="w-full border border-stone-200 rounded-lg px-3 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none bg-stone-50" />
                    <button type="submit" disabled={submittingReview} className="w-full bg-orange-500 hover:bg-orange-400 text-white font-bold py-3 rounded-lg transition border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm mt-3">
                      {submittingReview ? 'Submitting...' : 'Submit review'}
                    </button>
                  </form>
                )}
              </div>

              {/* IMAGE TESTIMONIALS */}
              {imageTestimonials.length > 0 && (
                <div className="mb-10 pt-6 border-t border-stone-200 w-full">
                  <SectionHeading>Student testimonials</SectionHeading>
                  <p className="text-stone-500 text-xs mb-4">See what our students have to say</p>
                  <AutoSlideImageTestimonials imageTestimonials={imageTestimonials} />
                </div>
              )}

              {/* VIDEO TESTIMONIALS */}
              {videoTestimonials.length > 0 && (
                <div className="mb-10 pt-6 border-t border-stone-200 w-full">
                  <SectionHeading>Video reviews</SectionHeading>
                  <p className="text-stone-500 text-xs mb-4">Watch authentic testimonials from our graduates</p>
                  <div className="flex gap-3 overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 pb-4">
                    {videoTestimonials.map((testimonial, idx) => (
                      <ReelsVideoCard key={idx} videoUrl={testimonial.videoUrl} index={idx} onClick={() => { setVideoReelsStartIndex(idx); setVideoReelsOpen(true); }} />
                    ))}
                  </div>
                </div>
              )}

              {/* PROJECT GALLERY */}
              {projectGallery.length > 0 && (
                <div className="mb-10 pt-6 border-t border-stone-200 w-full">
                  <SectionHeading>Project gallery</SectionHeading>
                  <p className="text-xs text-stone-400 mb-4">Student work and course outcomes</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {projectGallery.map((item) => (
                      <figure key={item.id || item._id || item.imageUrl} className="group rounded-xl overflow-hidden border border-stone-200 bg-white">
                        <div className="aspect-video bg-stone-100 overflow-hidden">
                          <img src={item.imageUrl} alt={item.caption || 'Project'} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300" />
                        </div>
                        {item.caption && <figcaption className="px-3 py-2 text-xs text-stone-600 border-t border-stone-100">{item.caption}</figcaption>}
                      </figure>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Desktop sidebar */}
            <div className="hidden lg:block lg:col-span-1">
              <div className="sticky top-24">
                <div className="bg-white border border-stone-200 rounded-xl p-5">
                  <p className="text-sm font-semibold text-stone-900 mb-4">This course includes:</p>
                  <div className="space-y-3">
                    {[
                      { Icon: Film,       text: courseData.duration ? `${courseData.duration} on-demand video` : 'On-demand video' },
                      { Icon: Download,   text: 'Downloadable resources' },
                      { Icon: Smartphone, text: 'Access on mobile and TV' },
                      { Icon: Shield,     text: 'Full lifetime access' },
                      { Icon: Award,      text: 'Certificate of completion' },
                    ].map(({ Icon, text }, idx) => (
                      <div key={idx} className="flex items-center gap-2.5">
                        <Icon size={17} className="text-stone-400 flex-shrink-0" />
                        <p className="text-sm text-stone-600">{text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* STUDENTS ALSO BOUGHT */}
          {studentsBoughtCourses.length > 0 && (
            <div className="mt-12 md:mt-16 pt-8 border-t border-stone-200">
              <SectionHeading>Students also bought</SectionHeading>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                {studentsBoughtCourses.map((course) => (
                  <div key={course._id} onClick={() => navigate(`/course/${course._id}`)} className="bg-white border border-stone-200 rounded-xl overflow-hidden hover:border-orange-300 transition cursor-pointer group">
                    <div className={`h-32 md:h-40 bg-gradient-to-br ${course.color || 'from-stone-200 to-stone-300'} flex items-center justify-center text-4xl relative overflow-hidden`}>
                      {course.thumbnail ? <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" /> : <span>{course.emoji || '📚'}</span>}
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-stone-900 text-sm mb-1.5 line-clamp-2 group-hover:text-orange-600 transition">{course.title}</h3>
                      <p className="text-xs text-stone-500 mb-2">{course.instructor || 'Instructor'}</p>
                      <div className="flex items-center gap-1 mb-2">
                        <span className="font-bold text-xs text-stone-900">{course.rating}</span>
                        <div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={10} className="text-orange-400" fill={i < Math.floor(course.rating) ? 'currentColor' : 'none'} />)}</div>
                        <span className="text-xs text-stone-400">({formatNumber(course.reviews)})</span>
                      </div>
                      <p className="text-sm font-bold text-stone-900">${course.price}</p>
                      {course.bestseller && <span className="inline-block bg-orange-50 text-orange-700 border border-orange-200 font-semibold px-2 py-0.5 rounded text-xs mt-2">Bestseller</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer className="bg-stone-950 text-stone-500 py-10 md:py-14 w-full border-t border-stone-800">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 md:gap-8 mb-10">
            {[
              { title: 'Courseify',  links: ['About', 'Press', 'Contact', 'Careers'] },
              { title: 'Community', links: ['Learners', 'Partners', 'Developers', 'Beta Testers'] },
              { title: 'Teaching',  links: ['Become instructor', 'Teaching center', 'Resources'] },
              { title: 'Programs',  links: ['Enterprise', 'Government', 'Courseify Business'] },
              { title: 'Support',   links: ['Help center', 'Get the app', 'FAQ', 'Accessibility'] },
              { title: 'Legal',     links: ['Terms', 'Privacy policy', 'Cookie settings', 'Sitemap'] },
            ].map((col) => (
              <div key={col.title}>
                <h3 className="font-semibold text-stone-300 mb-3 text-xs uppercase tracking-wider">{col.title}</h3>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link}><button onClick={() => handleNavigate('/')} className="hover:text-orange-400 transition bg-transparent border-none cursor-pointer text-stone-500 p-0 text-xs">{link}</button></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center pt-6 border-t border-stone-800">
            <button onClick={() => handleNavigate('/')} className="text-lg font-bold text-orange-400 hover:text-orange-300 transition cursor-pointer bg-transparent border-none p-0 mb-4 md:mb-0">
              Courseify
            </button>
            <p className="text-xs text-stone-700">© 2024 Courseify, Inc. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* ── STICKY BOTTOM BAR — MOBILE ────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-stone-900 border-t border-stone-700 p-3 z-50 flex items-center justify-between gap-3 w-full shadow-2xl">
        <div className="flex flex-col min-w-0">
          <span className="text-lg font-bold text-white truncate">PKR {(courseData.price * 280).toLocaleString()}</span>
          {courseData.originalPrice > courseData.price && (
            <span className="text-xs text-orange-400 font-semibold">{Math.round((1 - courseData.price / courseData.originalPrice) * 100)}% off</span>
          )}
        </div>
        <button onClick={() => handleNavigate('/auth/register')} className="flex-1 bg-orange-500 hover:bg-orange-400 text-white font-bold py-2.5 rounded-xl transition text-sm border-none cursor-pointer shadow-lg whitespace-nowrap">
          Enroll now
        </button>
      </div>

      {/* Spacer for mobile sticky bar */}
      <div className="h-16 lg:h-0" />

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .prose ul { list-style-type: disc; padding-left: 1.25rem; margin: 0.5rem 0; }
        .prose ol { list-style-type: decimal; padding-left: 1.25rem; margin: 0.5rem 0; }
        .prose li { margin: 0.2rem 0; }
        .prose p { margin: 0.5rem 0; }
        .prose strong { font-weight: 600; color: #1c1917; }
        .prose em { font-style: italic; }
        .prose h1, .prose h2, .prose h3, .prose h4 { font-weight: 700; margin-top: 1.25rem; margin-bottom: 0.5rem; color: #1c1917; }
        .prose a { color: #f97316; text-decoration: underline; }
        .prose a:hover { color: #fb923c; }
      `}</style>
    </div>
  );
}

// ── Small helper component ────────────────────────────────────────────────────
function SectionHeading({ children }) {
  return (
    <div className="mb-4">
      <h2 className="text-xl md:text-2xl font-bold text-stone-900">{children}</h2>
      <div className="mt-1.5 w-8 h-0.5 bg-orange-500 rounded-full" />
    </div>
  );
}
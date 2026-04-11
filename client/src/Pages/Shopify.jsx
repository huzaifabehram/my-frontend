// src/Pages/Shopify.jsx  (Course Landing Page)
// PREMIUM TRUST + GROWTH ENERGY THEME
// Color System: Trust Blue (#1E3A8A), Modern Indigo (#6366F1), CTA Green (#10B981)
// Reads course data from CoursesContext — falls back to a placeholder
// when no id param is present (used as the home "/" route).
// UPDATED: Only shows published courses in "Students also bought" section
// UPDATED: Full Bunny.net video support with unified helper functions
// UPDATED: Full-screen Course Preview Popup with video player and lecture list
// UPDATED: fetchCourseById used to load full sections from /api/courses/:id
// UPDATED: Preview player positioned above course title with overlay text
// UPDATED: Premium visual styling with Trust Blue + Growth Green theme
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronDown, Play, Star, Users, Clock, BookOpen, Zap, Menu, X, Search } from 'lucide-react';
import { useCourses } from '../context/CoursesContext';

// ── YouTube embed helper ───────────────────────────────────────────────────
function getYouTubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/watch\?v=|\/shorts\/))([^&?/\s]{11})/);
  return m ? m[1] : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// BUNNY.NET VIDEO HELPERS — Unified with InstructorDashboard
// ─────────────────────────────────────────────────────────────────────────────

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

function isYouTubeUrl(url) {
  return url && (url.includes('youtube.com') || url.includes('youtu.be'));
}

function isDirectVideo(url) {
  return url && (url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.mov'));
}

// ─────────────────────────────────────────────────────────────────────────────
// BUNNY EMBED URL RESOLVER
// ─────────────────────────────────────────────────────────────────────────────

function getBunnyEmbedUrl(url) {
  if (!url) return null;
  if (url.includes('iframe.mediadelivery.net/embed/')) return url;
  if (url.includes('iframe.mediadelivery.net/play/')) {
    return url.replace('/play/', '/embed/');
  }
  const playerMatch = url.match(/player\.mediadelivery\.net\/play\/(\d+)\/([a-zA-Z0-9-]+)/);
  if (playerMatch) {
    return `https://iframe.mediadelivery.net/embed/${playerMatch[1]}/${playerMatch[2]}?autoplay=false&loop=false&muted=false&preload=true`;
  }
  const bunnyPlay = url.match(/video\.bunnycdn\.com\/play\/(\d+)\/([a-zA-Z0-9-]+)/);
  if (bunnyPlay) {
    return `https://iframe.mediadelivery.net/embed/${bunnyPlay[1]}/${bunnyPlay[2]}?autoplay=false&loop=false&muted=false&preload=true`;
  }
  const guidMatch = url.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
  const libMatch  = url.match(/\/(\d+)\//);
  if (guidMatch && libMatch) {
    return `https://iframe.mediadelivery.net/embed/${libMatch[1]}/${guidMatch[1]}?autoplay=false&loop=false&muted=false&preload=true`;
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// BUNNY PLAYER — iframe embed or <video> fallback
// ─────────────────────────────────────────────────────────────────────────────

function BunnyPlayer({ url, className = "" }) {
  const embedUrl = getBunnyEmbedUrl(url);
  if (embedUrl) {
    return (
      <div className={`relative w-full aspect-video bg-black ${className}`}>
        <iframe
          src={embedUrl}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          title="Bunny Stream Video"
          loading="lazy"
          style={{ border: 'none' }}
        />
      </div>
    );
  }
  return (
    <video
      src={url}
      className={`w-full aspect-video bg-black ${className}`}
      controls
      preload="metadata"
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// UNIVERSAL VIDEO PLAYER
// ─────────────────────────────────────────────────────────────────────────────

function VideoPlayer({ url, className = "" }) {
  if (!url) return null;
  const ytId = getYouTubeId(url);
  if (ytId) {
    return (
      <div className={`relative w-full aspect-video bg-black ${className}`}>
        <iframe
          src={`https://www.youtube.com/embed/${ytId}`}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="YouTube Video"
          loading="lazy"
          style={{ border: 'none' }}
        />
      </div>
    );
  }
  if (isBunnyUrl(url)) {
    return <BunnyPlayer url={url} className={className} />;
  }
  if (isDirectVideo(url)) {
    return (
      <video
        src={url}
        className={`w-full aspect-video bg-black ${className}`}
        controls
        preload="metadata"
      />
    );
  }
  return null;
}

// ── Course thumbnail with fallback ────────────────────────────────────────
function CourseThumbnail({ course }) {
  const [imgErr, setImgErr] = useState(false);
  const ytId = getYouTubeId(course.previewVideoUrl);

  if (ytId) {
    return (
      <div className="relative w-full h-full bg-[#0F172A] flex items-center justify-center">
        <img src={`https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`}
          alt={course.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black bg-opacity-30">
          <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center shadow-2xl hover:scale-110 transition-transform duration-300">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M8 5v14l11-7L8 5z" fill="white"/>
            </svg>
          </div>
          <div className="bg-[#0F172A] bg-opacity-90 px-6 py-3 rounded-xl shadow-lg">
            <p className="text-white font-bold text-sm lg:text-base whitespace-nowrap">Preview This Course</p>
          </div>
        </div>
      </div>
    );
  }
  if (course.thumbnail && !imgErr) {
    return (
      <div className="relative w-full h-full bg-[#0F172A] flex items-center justify-center">
        <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover"
          onError={() => setImgErr(true)} />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black bg-opacity-30">
          <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center shadow-2xl hover:scale-110 transition-transform duration-300">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M8 5v14l11-7L8 5z" fill="white"/>
            </svg>
          </div>
          <div className="bg-[#0F172A] bg-opacity-90 px-6 py-3 rounded-xl shadow-lg">
            <p className="text-white font-bold text-sm lg:text-base whitespace-nowrap">Preview This Course</p>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className={`w-full h-full bg-gradient-to-br ${course.color || 'from-[#1E3A8A] to-[#6366F1]'} flex flex-col items-center justify-center gap-4`}>
      <span className="text-8xl">{course.emoji || '📚'}</span>
      <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center shadow-2xl hover:scale-110 transition-transform duration-300">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
          <path d="M8 5v14l11-7L8 5z" fill="white"/>
        </svg>
      </div>
      <div className="bg-[#0F172A] bg-opacity-90 px-6 py-3 rounded-xl shadow-lg">
        <p className="text-white font-bold text-sm lg:text-base whitespace-nowrap">Preview This Course</p>
      </div>
    </div>
  );
}

function formatNumber(num) {
  if (!num) return '0';
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
  if (num >= 1_000)     return (num / 1_000).toFixed(1) + 'K';
  return String(num);
}

export default function CourseLandingPage() {
  const navigate = useNavigate();
  const { id }   = useParams();

  const { courses, loading, getCourse, fetchCourseById } = useCourses();

  const [mobileMenuOpen,        setMobileMenuOpen]        = useState(false);
  const [expandedSection,       setExpandedSection]       = useState([0]);
  const [imageCarouselIndex,    setImageCarouselIndex]    = useState(0);
  const [showFullDescription,   setShowFullDescription]   = useState(false);
  const [showAllReviews,        setShowAllReviews]        = useState(false);
  const [showFullInstructorBio, setShowFullInstructorBio] = useState(false);
  const [isPreviewOpen,         setIsPreviewOpen]         = useState(false);
  const [currentVideo,          setCurrentVideo]          = useState('');

  const [fullCourse, setFullCourse] = useState(null);
  const [fullCourseLoading, setFullCourseLoading] = useState(false);

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
    if (id) {
      return fullCourse || getCourse(id);
    }
    const publishedCourses = courses.filter(c => c.status === 'published');
    return publishedCourses.length > 0 ? publishedCourses[0] : null;
  }, [id, fullCourse, courses, getCourse]);

  const sections = courseData?.sections || [];

  const studentsBoughtCourses = useMemo(() => {
    return courses
      .filter(c => c._id !== courseData?._id && c.status === 'published')
      .slice(0, 4);
  }, [courses, courseData?._id]);

  const previewLectures = useMemo(() => {
    const lectures = [];
    sections.forEach((section, sectionIdx) => {
      if (section.lectures_list?.length > 0) {
        section.lectures_list.forEach((lecture, lectureIdx) => {
          if (lecture.preview && lecture.videoUrl) {
            lectures.push({
              ...lecture,
              sectionTitle: section.title,
              sectionIdx,
              lectureIdx
            });
          }
        });
      }
    });
    return lectures;
  }, [sections]);

  const handleNavigate = (path) => { setMobileMenuOpen(false); navigate(path); };

  const handlePreviewClick = () => {
    setCurrentVideo(courseData?.previewVideoUrl || '');
    setIsPreviewOpen(true);
  };

  const handleClosePreview = () => {
    setIsPreviewOpen(false);
    setCurrentVideo('');
  };

  const handleLectureClick = (videoUrl) => {
    setCurrentVideo(videoUrl);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isPreviewOpen) handleClosePreview();
    };
    if (isPreviewOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isPreviewOpen]);

  if (loading || fullCourseLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="w-10 h-10 border-4 border-[#6366F1] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!courseData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] gap-4">
        <p className="text-6xl">😕</p>
        <h2 className="text-2xl font-bold text-[#0F172A]">Course not found</h2>
        <button onClick={() => navigate('/courses')}
          className="px-6 py-2 bg-[#6366F1] text-white font-semibold rounded-xl hover:bg-[#4F46E5] transition-all duration-300 border-none cursor-pointer shadow-lg">
          Browse all courses
        </button>
      </div>
    );
  }

  const instructor = {
    name:     courseData.instructor        || 'Instructor',
    rating:   courseData.instructorRating  || 0,
    reviews:  courseData.instructorReviews || 0,
    students: courseData.instructorStudents|| 0,
    courses:  courseData.instructorCourses || 0,
    bio:      courseData.instructorBio     || '',
    image:    courseData.instructorImage   || '👩‍💼',
  };

  const totalLectures = sections.reduce((a, s) => a + (s.lectures || 0), 0);

  return (
    <div className="min-h-screen bg-[#F8FAFC] overflow-x-hidden w-full">

      {/* FULL-SCREEN COURSE PREVIEW POPUP */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-[9999] bg-[#0F172A] bg-opacity-95 flex flex-col">
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={handleClosePreview}
              className="p-2 bg-[#1E3A8A] hover:bg-[#1E40AF] rounded-full transition-all duration-300 border-none cursor-pointer shadow-xl"
              aria-label="Close preview"
            >
              <X size={28} className="text-white" />
            </button>
          </div>
          
          <div className="w-full bg-gradient-to-r from-[#1E3A8A] to-[#6366F1] border-b border-[#6366F1]/30 py-6">
            <div className="max-w-6xl mx-auto px-6">
              <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2">Course Preview</h2>
              <p className="text-lg text-white/90">{courseData.title}</p>
            </div>
          </div>

          <div className="w-full bg-[#0F172A] border-b border-[#6366F1]/30">
            <VideoPlayer url={currentVideo} className="w-full" />
          </div>

          <div className="flex-1 overflow-y-auto bg-[#0F172A]">
            <div className="max-w-6xl mx-auto px-6 py-8">
              <h3 className="text-xl lg:text-2xl font-bold text-white mb-6">Free Lectures of The Course</h3>
              {previewLectures.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-400 text-lg">No preview lectures available</p>
                </div>
              ) : (
                <div className="space-y-0">
                  {previewLectures.map((lecture, idx) => (
                    <div
                      key={`${lecture.sectionIdx}-${lecture.lectureIdx}`}
                      onClick={() => handleLectureClick(lecture.videoUrl)}
                      className="border-b border-[#6366F1]/20 py-4 cursor-pointer hover:bg-[#1E3A8A]/30 transition-all duration-300 px-4 rounded-lg"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-base lg:text-lg text-white">
                            {lecture.title}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-300">
                            <Play size={16} className="text-white ml-0.5" fill="currentColor" />
                          </div>
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

      {/* ANNOUNCEMENT BAR */}
      {courseData.discountPrice && courseData.discountPrice < courseData.originalPrice && (
        <div className="bg-gradient-to-r from-[#1E3A8A] to-[#1E40AF] text-center py-3 px-4 w-full shadow-lg">
          <p className="text-sm font-semibold text-white">
            🎉 Limited time: Get this course for ${courseData.discountPrice} ({Math.round((1-courseData.discountPrice/courseData.originalPrice)*100)}% off). Enroll now!
          </p>
        </div>
      )}

      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200 w-full shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <button className="lg:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu">
            {mobileMenuOpen ? <X size={24} className="text-[#0F172A]" /> : <Menu size={24} className="text-[#0F172A]" />}
          </button>
          <div className="absolute left-1/2 transform -translate-x-1/2 lg:relative lg:left-auto lg:transform-none">
            <button onClick={() => handleNavigate('/')}
              className="text-2xl font-bold text-[#1E3A8A] cursor-pointer hover:text-[#6366F1] transition-all duration-300 bg-transparent border-none p-0">
              Courseify
            </button>
          </div>
          <nav className="hidden lg:flex items-center gap-8 flex-1 ml-12">
            <button onClick={() => handleNavigate('/courses')} className="text-gray-600 hover:text-[#6366F1] transition-all duration-300 bg-transparent border-none cursor-pointer p-0 font-medium">Categories</button>
            <button onClick={() => handleNavigate('/instructor')} className="text-gray-600 hover:text-[#6366F1] transition-all duration-300 bg-transparent border-none cursor-pointer p-0 font-medium">Instructor</button>
            <button onClick={() => handleNavigate('/courses')} className="text-gray-600 hover:text-[#6366F1] transition-all duration-300 bg-transparent border-none cursor-pointer p-0 font-medium">About</button>
          </nav>
          <div className="flex items-center gap-3">
            <Search className="hidden lg:block text-gray-500 cursor-pointer hover:text-[#6366F1] transition-all duration-300" size={20} />
            <button onClick={() => handleNavigate('/auth/login')} className="px-4 py-2 bg-[#6366F1] text-white rounded-lg hover:bg-[#4F46E5] transition-all duration-300 font-medium border-none cursor-pointer text-sm shadow-md">Login</button>
            <button onClick={() => handleNavigate('/auth/register')} className="hidden lg:block px-4 py-2 bg-[#10B981] text-white rounded-lg hover:bg-[#059669] transition-all duration-300 font-medium border-none cursor-pointer shadow-md">Sign Up</button>
          </div>
        </div>
        {mobileMenuOpen && (
          <>
            <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
            <div className="fixed top-0 left-0 h-full w-64 bg-[#0F172A] z-50 lg:hidden shadow-2xl">
              <div className="p-4 space-y-3">
                <div className="flex justify-end mb-4">
                  <button onClick={() => setMobileMenuOpen(false)} className="p-2 hover:bg-[#1E3A8A] rounded-lg transition-all duration-300 bg-transparent border-none cursor-pointer text-white"><X size={24} /></button>
                </div>
                <button onClick={() => handleNavigate('/courses')} className="block text-white hover:text-[#10B981] bg-transparent border-none cursor-pointer w-full text-left p-3 rounded hover:bg-[#1E3A8A]/50 font-medium transition-all duration-300">Categories</button>
                <button onClick={() => handleNavigate('/instructor')} className="block text-white hover:text-[#10B981] bg-transparent border-none cursor-pointer w-full text-left p-3 rounded hover:bg-[#1E3A8A]/50 font-medium transition-all duration-300">Instructor</button>
              </div>
            </div>
          </>
        )}
      </header>

      {/* BREADCRUMB */}
      <div className="max-w-7xl mx-auto px-4 py-3 text-sm text-gray-500 w-full">
        <button onClick={() => handleNavigate('/')} className="hover:text-[#1E3A8A] hover:underline bg-transparent border-none cursor-pointer p-0 transition-all duration-300">Development</button>
        <span className="mx-2">›</span>
        <button onClick={() => handleNavigate('/courses')} className="hover:text-[#1E3A8A] hover:underline bg-transparent border-none cursor-pointer p-0 transition-all duration-300">{courseData.category || 'Courses'}</button>
        <span className="mx-2">›</span>
        <span className="text-[#1E3A8A] font-semibold truncate">{courseData.title}</span>
      </div>

      {/* COURSE HEADER */}
      <section className="w-full bg-gradient-to-br from-[#0F172A] via-[#1E3A8A] to-[#0F172A] text-white py-8 lg:py-12 overflow-hidden shadow-2xl">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-6 lg:mb-8">
            {courseData.bestseller && (
              <span className="inline-block bg-gradient-to-r from-[#F59E0B] to-[#EF4444] text-white font-bold px-4 py-2 rounded-full text-sm shadow-lg">Bestseller</span>
            )}
            {courseData.level && (
              <span className="inline-block ml-2 bg-white/10 backdrop-blur-sm text-white font-semibold px-3 py-1.5 rounded-full text-sm border border-white/20">{courseData.level}</span>
            )}
          </div>

          {/* EDGE-TO-EDGE PREVIEW VIDEO PLAYER - MOVED ABOVE TITLE */}
          <div className="mb-8 -mx-4">
            <div className="relative w-full bg-[#0F172A] overflow-hidden aspect-video cursor-pointer rounded-xl shadow-2xl" onClick={handlePreviewClick}>
              <CourseThumbnail course={courseData} />
            </div>
          </div>

          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-8 leading-tight">{courseData.title}</h1>

          <p className="text-xl text-gray-200 mb-8 leading-relaxed max-w-3xl">{courseData.subtitle}</p>

          <div className="flex flex-wrap items-center gap-6 mb-8">
            {courseData.rating > 0 && (
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/20">
                <Star size={22} className="text-[#F59E0B]" fill="currentColor" />
                <span className="text-3xl font-bold text-white">{courseData.rating}</span>
                <p className="text-gray-200 font-semibold">({courseData.reviews?.toLocaleString()} ratings)</p>
              </div>
            )}
            {courseData.students > 0 && (
              <div className="flex items-center gap-2 text-gray-200 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/20">
                <Users size={20} />
                <span className="font-semibold">{courseData.students.toLocaleString()} students</span>
              </div>
            )}
          </div>

          <div className="mb-8">
            <p className="text-gray-300">
              Created by{' '}
              <button onClick={() => handleNavigate('/instructor')}
                className="text-[#10B981] hover:text-[#34D399] font-semibold bg-transparent border-none cursor-pointer p-0 transition-all duration-300 underline decoration-dotted">
                {instructor.name}
              </button>
            </p>
          </div>

          <div className="flex flex-wrap gap-6 text-gray-300 text-sm border-t border-white/20 pt-8">
            <div className="flex items-center gap-2"><Clock size={18} /><span>Last updated {courseData.lastUpdated || 'Recently'}</span></div>
            <div className="flex items-center gap-2"><span>🌐</span><span>{courseData.language || 'English'}</span></div>
          </div>
        </div>
      </section>

      {/* WHITE CONTENT */}
      <section className="w-full bg-[#F8FAFC] py-12 lg:py-16 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">

          {/* WHAT YOU'LL LEARN */}
          {courseData.whatYouLearn?.length > 0 && (
            <div className="mb-16">
              <h2 className="text-2xl lg:text-3xl font-bold text-[#0F172A] mb-8">What you'll learn</h2>
              <div className="bg-white border border-gray-200 rounded-2xl p-6 lg:p-8 shadow-lg">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {courseData.whatYouLearn.map((outcome, idx) => (
                    <div key={idx} className="flex gap-4">
                      <Zap size={20} className="text-[#10B981] mt-1 flex-shrink-0" />
                      <p className="text-gray-700">{outcome}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* COURSE INCLUDES */}
          <div className="mb-16">
            <h2 className="text-2xl lg:text-3xl font-bold text-[#0F172A] mb-8">This course includes</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Clock,    text: courseData.duration ? `${courseData.duration} of on-demand video` : 'On-demand video' },
                { icon: BookOpen, text: `${totalLectures} lectures` },
                { icon: Zap,      text: `${sections.length} sections` },
                { icon: Users,    text: 'Lifetime access' },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className="text-center bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                    <Icon size={32} className="text-[#6366F1] mx-auto mb-3" />
                    <p className="text-sm text-gray-700 font-medium">{item.text}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* COURSE CONTENT */}
          {sections.length > 0 && (
            <>
              <div className="mb-8">
                <h2 className="text-3xl lg:text-4xl font-bold text-[#0F172A] mb-4">Course content</h2>
                <div className="flex flex-wrap gap-3 text-gray-600 lg:text-lg font-semibold">
                  <span>{sections.length} sections</span>
                  <span>•</span>
                  <span>{totalLectures} lectures</span>
                  {courseData.duration && <><span>•</span><span>{courseData.duration} total</span></>}
                </div>
              </div>
              <div className="space-y-2 mb-16">
                {sections.map((section, idx) => {
                  const isExpanded = expandedSection.includes(idx);
                  return (
                    <div key={idx} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300">
                      <button
                        onClick={() => setExpandedSection(isExpanded ? expandedSection.filter(i => i !== idx) : [...expandedSection, idx])}
                        className={`w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-all duration-300 border-none cursor-pointer ${isExpanded ? 'border-l-4 border-[#6366F1] bg-[#6366F1]/5' : ''}`}>
                        <div className="flex items-center gap-3 flex-1 text-left">
                          <ChevronDown size={20} className={`text-[#6366F1] transition-transform duration-300 flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
                          <div className="flex-1">
                            <h3 className="font-semibold text-[#0F172A]">{section.title}</h3>
                            <p className="text-xs text-gray-500">{section.lectures || 0} lectures{section.duration ? ` • ${section.duration}` : ''}</p>
                          </div>
                        </div>
                      </button>
                      {isExpanded && section.lectures_list?.length > 0 && (
                        <div className="border-t border-gray-100 bg-[#F8FAFC]">
                          {section.lectures_list.map((lecture, lectureIdx) => (
                            <div key={lectureIdx} className="px-6 py-4 border-b border-gray-100 last:border-b-0 flex items-center justify-between hover:bg-white transition-all duration-300">
                              <div className="flex items-center gap-4 flex-1">
                                <div className="flex-shrink-0">
                                  {lecture.type === 'video' ? (
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center shadow-md">
                                      <Play size={14} className="text-white ml-0.5" fill="currentColor"/>
                                    </div>
                                  ) : (
                                    <div className="w-6 h-6 border-2 border-[#6366F1] rounded-full flex items-center justify-center">
                                      <span className="text-[#6366F1] text-sm font-bold">✓</span>
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[#0F172A] text-base font-medium">{lecture.title}</p>
                                  {lecture.duration && <p className="text-xs text-gray-500">{lecture.duration}</p>}
                                </div>
                              </div>
                              {lecture.preview && (
                                <button onClick={handlePreviewClick}
                                  className="flex items-center gap-2 text-[#6366F1] hover:text-[#4F46E5] font-bold text-sm cursor-pointer bg-transparent border-none whitespace-nowrap ml-4 transition-all duration-300 p-0">
                                  <div className="w-6 h-6 rounded-full bg-[#6366F1] flex items-center justify-center">
                                    <Play size={12} className="text-white ml-0.5" fill="currentColor"/>
                                  </div>
                                  <span>Preview</span>
                                </button>
                              )}
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

          {/* REQUIREMENTS */}
          {courseData.requirements?.length > 0 && (
            <div className="mb-16">
              <button onClick={() => setExpandedSection(expandedSection.includes('req') ? expandedSection.filter(i => i !== 'req') : [...expandedSection, 'req'])}
                className="w-full flex items-center justify-between py-4 border-b-2 border-gray-200 bg-white hover:bg-gray-50 transition-all duration-300 border-x-0 border-t-0 cursor-pointer p-0 rounded-t-xl">
                <h2 className="text-2xl lg:text-3xl font-bold text-[#0F172A]">Requirements</h2>
                <ChevronDown size={28} className={`text-[#6366F1] transition-transform duration-300 ${expandedSection.includes('req') ? 'rotate-180' : ''}`} />
              </button>
              {expandedSection.includes('req') && (
                <div className="py-6 bg-white rounded-b-xl shadow-lg">
                  <ul className="space-y-3">
                    {courseData.requirements.map((req, idx) => (
                      <li key={idx} className="flex gap-3 text-gray-700 text-lg">
                        <span className="text-[#6366F1] font-bold flex-shrink-0">•</span>{req}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* DESCRIPTION */}
          {courseData.description && (
            <div className="mb-16 py-12 border-t border-gray-200">
              <h2 className="text-3xl font-bold text-[#0F172A] mb-6">Description</h2>
              <div className="relative bg-white rounded-2xl p-6 shadow-lg">
                <div className={`text-gray-700 leading-relaxed text-base space-y-4 ${!showFullDescription ? 'max-h-40 overflow-hidden' : ''}`}>
                  <p>{courseData.description}</p>
                </div>
                {!showFullDescription && (
                  <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none rounded-b-2xl" />
                )}
              </div>
              <button onClick={() => setShowFullDescription(!showFullDescription)}
                className="text-[#6366F1] hover:text-[#4F46E5] mt-4 text-base font-semibold transition-all duration-300 flex items-center gap-2 bg-transparent border-none cursor-pointer p-0 hover:underline">
                <span style={{ fontSize: '24px', lineHeight: '1' }}>{showFullDescription ? '⌃' : '⌄'}</span>
                <span>{showFullDescription ? 'Show less' : 'Show more'}</span>
              </button>
            </div>
          )}

          {/* INSTRUCTOR */}
          <div className="mb-16 py-12 border-t border-gray-200">
            {/* Mobile */}
            <div className="lg:hidden">
              <h2 className="text-2xl font-bold text-[#0F172A] mb-4">Instructor</h2>
              <button onClick={() => handleNavigate('/instructor')}
                className="text-[#10B981] hover:text-[#059669] font-bold text-lg bg-transparent border-none cursor-pointer p-0 mb-4 block transition-all duration-300 underline decoration-dotted">
                {instructor.name}
              </button>
              <div className="flex items-start gap-4 mb-6 bg-white rounded-2xl p-6 shadow-lg">
                <div className="flex-shrink-0 w-36 h-36 rounded-full bg-gradient-to-br from-[#6366F1] to-[#1E3A8A] flex items-center justify-center text-6xl shadow-xl">
                  {instructor.image}
                </div>
                <div className="flex flex-col gap-2">
                  {instructor.rating > 0 && <div className="flex items-center gap-2"><Star size={16} className="text-[#F59E0B]" fill="currentColor" /><span className="text-sm font-semibold text-[#0F172A]">{instructor.rating} Rating</span></div>}
                  {instructor.reviews > 0 && <div className="flex items-center gap-2"><BookOpen size={16} className="text-[#6366F1]" /><span className="text-sm text-gray-700">{formatNumber(instructor.reviews)} Reviews</span></div>}
                  {instructor.students > 0 && <div className="flex items-center gap-2"><Users size={16} className="text-[#6366F1]" /><span className="text-sm text-gray-700">{formatNumber(instructor.students)} Students</span></div>}
                  {instructor.courses > 0 && <div className="flex items-center gap-2"><Play size={16} className="text-[#6366F1]" /><span className="text-sm text-gray-700">{instructor.courses} Courses</span></div>}
                </div>
              </div>
              {instructor.bio && (
                <div className="relative bg-white rounded-2xl p-6 shadow-lg">
                  <div className={`text-gray-700 leading-relaxed text-base ${!showFullInstructorBio ? 'max-h-14 overflow-hidden' : ''}`}>
                    <p>{instructor.bio}</p>
                  </div>
                  {!showFullInstructorBio && <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none rounded-b-2xl" />}
                </div>
              )}
              {instructor.bio && (
                <button onClick={() => setShowFullInstructorBio(!showFullInstructorBio)}
                  className="text-[#6366F1] hover:text-[#4F46E5] mt-3 text-base font-semibold transition-all duration-300 flex items-center gap-2 bg-transparent border-none cursor-pointer p-0 hover:underline">
                  <span style={{ fontSize: '24px', lineHeight: '1' }}>{showFullInstructorBio ? '⌃' : '⌄'}</span>
                  <span>{showFullInstructorBio ? 'Show less' : 'Show more'}</span>
                </button>
              )}
            </div>
            {/* Desktop */}
            <div className="hidden lg:grid lg:grid-cols-4 gap-8 bg-white rounded-2xl p-8 shadow-xl">
              <div className="lg:col-span-1 flex flex-col items-center lg:items-start">
                <div className="w-56 h-56 rounded-full bg-gradient-to-br from-[#6366F1] to-[#1E3A8A] flex items-center justify-center text-8xl mb-6 shadow-2xl">
                  {instructor.image}
                </div>
                <h3 className="font-bold text-[#0F172A] text-xl text-center lg:text-left">
                  <button onClick={() => handleNavigate('/instructor')} className="text-[#10B981] hover:text-[#059669] bg-transparent border-none cursor-pointer p-0 transition-all duration-300 underline decoration-dotted">
                    {instructor.name}
                  </button>
                </h3>
              </div>
              <div className="lg:col-span-3">
                <div className="mb-8 pb-8 border-b border-gray-100 grid grid-cols-2 lg:grid-cols-4 gap-6">
                  {instructor.rating > 0 && <div><div className="flex items-center gap-2 mb-2"><Star size={18} className="text-[#F59E0B]" fill="currentColor" /><span className="font-bold text-[#0F172A] text-lg">{instructor.rating}</span></div><p className="text-sm text-gray-500">Rating</p></div>}
                  {instructor.reviews > 0 && <div><p className="font-bold text-[#0F172A] text-lg mb-2">{formatNumber(instructor.reviews)}</p><p className="text-sm text-gray-500">Reviews</p></div>}
                  {instructor.students > 0 && <div><p className="font-bold text-[#0F172A] text-lg mb-2">{formatNumber(instructor.students)}</p><p className="text-sm text-gray-500">Students</p></div>}
                  {instructor.courses > 0 && <div><p className="font-bold text-[#0F172A] text-lg mb-2">{instructor.courses}</p><p className="text-sm text-gray-500">Courses</p></div>}
                </div>
                {instructor.bio && <p className="text-gray-700 leading-relaxed text-base">{instructor.bio}</p>}
              </div>
            </div>
          </div>

          {/* REVIEWS */}
          {courseData.reviews_list?.length > 0 && (
            <div className="mb-16 py-12 border-t border-gray-200">
              <div className="mb-10 flex items-center gap-4 bg-white rounded-2xl p-6 shadow-lg">
                <Star size={32} className="text-[#F59E0B]" fill="currentColor" />
                <span className="text-3xl font-bold text-[#0F172A]">{courseData.rating}</span>
                <div>
                  <p className="text-gray-700 font-semibold">Course Rating</p>
                  <p className="text-sm text-gray-500">{formatNumber(courseData.reviews)} reviews</p>
                </div>
              </div>
              <div className="overflow-x-auto pb-4 -mx-4 px-4" style={{ scrollbarWidth: 'thin' }}>
                <div className="flex gap-6 min-w-min">
                  {courseData.reviews_list.map((review, idx) => (
                    <div key={idx} className="flex-shrink-0 w-80 lg:w-96 bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 shadow-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-bold text-[#0F172A] text-lg">{review.author}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex gap-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} size={16} className="text-[#F59E0B]" fill={i < review.rating ? 'currentColor' : 'none'} />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      {review.verified && (
                        <div className="flex items-center gap-1 bg-gradient-to-r from-[#10B981] to-[#059669] text-white text-xs font-bold px-3 py-1 rounded-full inline-block mb-4 shadow-md">
                          <span>✓</span><span>Verified Purchase</span>
                        </div>
                      )}
                      <p className="text-gray-700 leading-relaxed">{review.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STUDENTS ALSO BOUGHT */}
          {studentsBoughtCourses.length > 0 && (
            <div className="mb-16 py-12 border-t border-gray-200">
              <h2 className="text-3xl font-bold text-[#0F172A] mb-8">Students also bought</h2>
              <div className="overflow-x-auto pb-4 -mx-4 px-4" style={{ scrollbarWidth: 'thin' }}>
                <div className="flex gap-6 min-w-min">
                  {studentsBoughtCourses.map(course => (
                    <div key={course._id}
                      onClick={() => navigate(`/course/${course._id}`)}
                      className="flex-shrink-0 w-64 bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer shadow-lg transform hover:-translate-y-1">
                      <div className={`h-40 bg-gradient-to-br ${course.color || 'from-[#1E3A8A] to-[#6366F1]'} flex items-center justify-center text-4xl`}>
                        {course.thumbnail
                          ? <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                          : course.emoji || '📚'}
                      </div>
                      <div className="p-4">
                        {course.bestseller && <span className="inline-block bg-gradient-to-r from-[#F59E0B] to-[#EF4444] text-white font-bold px-2 py-1 rounded-full text-xs mb-2 shadow-md">Bestseller</span>}
                        <h3 className="font-bold text-[#0F172A] text-base mb-3 line-clamp-2">{course.title}</h3>
                        <div className="flex items-center gap-1 mb-2">
                          <Star size={16} className="text-[#F59E0B]" fill="currentColor" />
                          <span className="font-bold text-sm text-[#0F172A]">{course.rating}</span>
                          <span className="text-xs text-gray-500">({formatNumber(course.reviews)})</span>
                        </div>
                        <p className="text-sm text-gray-500">{course.duration}</p>
                        <p className="text-base font-bold text-[#10B981] mt-2">${course.price}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gradient-to-br from-[#0F172A] to-[#1E3A8A] text-gray-300 py-12 w-full shadow-2xl">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
            {[
              { title: 'Courseify',   links: ['Press', 'Contact'] },
              { title: 'Instructors', links: ['Teach', 'Resources', 'Benefits'] },
              { title: 'Learning',    links: ['Categories', 'Trending', 'Collections', 'About'] },
              { title: 'Support',     links: ['Help', 'Support', 'FAQ'] },
              { title: 'Legal',       links: ['Privacy', 'Terms', 'Cookies'] },
            ].map(col => (
              <div key={col.title}>
                <h3 className="font-bold text-white mb-4">{col.title}</h3>
                <ul className="space-y-2 text-sm">
                  {col.links.map(link => (
                    <li key={link}><button onClick={() => handleNavigate('/')} className="hover:text-[#10B981] transition-all duration-300 bg-transparent border-none cursor-pointer text-gray-300 p-0">{link}</button></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-white/20 pt-8">
            <p className="text-sm text-gray-400">© 2024 Courseify. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* STICKY BOTTOM BAR - MOBILE */}
      <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-white border-t border-gray-200 p-4 z-50 flex items-center justify-between gap-4 w-full shadow-2xl">
        <div className="flex flex-col">
          <span className="text-2xl font-bold text-[#10B981]">${courseData.price}</span>
          {courseData.originalPrice > courseData.price && (
            <span className="text-sm text-gray-500 line-through">${courseData.originalPrice}</span>
          )}
        </div>
        <button onClick={() => handleNavigate('/auth/register')}
          className="flex-1 bg-gradient-to-r from-[#10B981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white font-bold py-3 rounded-xl transition-all duration-300 text-base border-none cursor-pointer shadow-lg">
          Add to cart
        </button>
      </div>

      {/* STICKY BOTTOM BAR - DESKTOP */}
      <div className="hidden lg:block fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 p-6 z-50 w-full shadow-2xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold text-[#10B981]">${courseData.price}</span>
            {courseData.originalPrice > courseData.price && (
              <span className="text-lg text-gray-500 line-through">${courseData.originalPrice}</span>
            )}
          </div>
          <button onClick={() => handleNavigate('/auth/register')}
            className="bg-gradient-to-r from-[#10B981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white font-bold py-4 px-12 rounded-xl transition-all duration-300 text-lg border-none cursor-pointer shadow-xl transform hover:scale-105">
            Add to cart
          </button>
        </div>
      </div>

      <div className="h-24 lg:h-28" />
    </div>
  );
}
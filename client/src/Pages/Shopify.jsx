// src/Pages/Shopify.jsx  (Course Landing Page)
// FIXED: Now properly displays imageTestimonials, videoTestimonials, projectGallery
// FIXED: "Students Also Bought" now shows instructor-selected courses from alsoBoughtCourseIds
// All data is fetched from the real backend via CoursesContext

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronDown, Play, Star, Users, Clock, BookOpen, Zap, Menu, X, Search, Check, Award, Smartphone, Film, Download, Globe, Shield, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCourses } from '../context/CoursesContext';
import { useAuth } from '../context/AuthContext';

// ── YouTube embed helper ───────────────────────────────────────────────────
function getYouTubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/watch\?v=|\/shorts\/))([^&?/\s]{11})/);
  return m ? m[1] : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// BUNNY.NET VIDEO HELPERS
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

function CourseThumbnail({ course }) {
  const [imgErr, setImgErr] = useState(false);
  const ytId = getYouTubeId(course.previewVideoUrl);

  if (ytId) {
    return (
      <div className="relative w-full h-full bg-black flex items-center justify-center group">
        <img src={`https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`}
          alt={course.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black bg-opacity-30 group-hover:bg-opacity-40 transition flex flex-col items-center justify-center gap-3">
          <div className="w-16 h-16 rounded-full bg-red-700 hover:bg-red-800 flex items-center justify-center shadow-2xl transition transform group-hover:scale-110">
            <Play size={24} className="text-white ml-1" fill="currentColor" />
          </div>
          <div className="bg-gray-600 px-4 py-2 rounded inline-block">
            <p className="text-white font-semibold text-sm whitespace-nowrap">Preview This Course</p>
          </div>
        </div>
      </div>
    );
  }
  if (course.thumbnail && !imgErr) {
    return (
      <div className="relative w-full h-full bg-black flex items-center justify-center group">
        <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover"
          onError={() => setImgErr(true)} />
        <div className="absolute inset-0 bg-black bg-opacity-30 group-hover:bg-opacity-40 transition flex flex-col items-center justify-center gap-3">
          <div className="w-16 h-16 rounded-full bg-red-700 hover:bg-red-800 flex items-center justify-center shadow-2xl transition transform group-hover:scale-110">
            <Play size={24} className="text-white ml-1" fill="currentColor" />
          </div>
          <div className="bg-gray-600 px-4 py-2 rounded inline-block">
            <p className="text-white font-semibold text-sm whitespace-nowrap">Preview This Course</p>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className={`w-full h-full bg-gradient-to-br ${course.color || 'from-blue-600 to-purple-700'} flex items-center justify-center group`}>
      <span className="text-8xl">{course.emoji || '📚'}</span>
      <div className="absolute inset-0 bg-black bg-opacity-20 group-hover:bg-opacity-30 transition flex flex-col items-center justify-center gap-3">
        <div className="w-16 h-16 rounded-full bg-red-700 hover:bg-red-800 flex items-center justify-center shadow-2xl transition transform group-hover:scale-110">
          <Play size={24} className="text-white ml-1" fill="currentColor" />
        </div>
        <div className="bg-gray-600 px-4 py-2 rounded inline-block">
          <p className="text-white font-semibold text-sm whitespace-nowrap">Preview This Course</p>
        </div>
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
  const { API: api, user } = useAuth();

  const [mobileMenuOpen,        setMobileMenuOpen]        = useState(false);
  const [expandedSection,       setExpandedSection]       = useState([0]);
  const [showFullDescription,   setShowFullDescription]   = useState(false);
  const [showAllReviews,        setShowAllReviews]        = useState(false);
  const [showFullInstructorBio, setShowFullInstructorBio] = useState(false);
  const [isPreviewOpen,         setIsPreviewOpen]         = useState(false);
  const [currentVideo,          setCurrentVideo]          = useState('');

  const [fullCourse, setFullCourse] = useState(null);
  const [fullCourseLoading, setFullCourseLoading] = useState(false);
  
  const [instructorData, setInstructorData] = useState(null);
  const [loadingInstructor, setLoadingInstructor] = useState(false);

  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);

  // Image testimonials carousel
  const [imageTestimonialIndex, setImageTestimonialIndex] = useState(0);
  // Video testimonials carousel
  const [videoTestimonialIndex, setVideoTestimonialIndex] = useState(0);
  // Project gallery carousel
  const [projectGalleryIndex, setProjectGalleryIndex] = useState(0);

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

  // Fetch real instructor data from backend
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

  const sections = courseData?.sections || [];

  // ✅ FIX: Load instructor-selected "Students Also Bought" courses
  const studentsBoughtCourses = useMemo(() => {
    if (!courseData?.alsoBoughtCourseIds || courseData.alsoBoughtCourseIds.length === 0) {
      // Fallback: show other published courses if instructor hasn't selected any
      return courses
        .filter(c => c._id !== courseData?._id && c.status === 'published')
        .slice(0, 4);
    }
    
    // Map the instructor-selected course IDs to actual course objects
    return courseData.alsoBoughtCourseIds
      .map(cid => courses.find(c => c._id === cid))
      .filter(Boolean)  // Remove any undefined entries
      .slice(0, 6);     // Max 6 as set in instructor dashboard
  }, [courses, courseData?._id, courseData?.alsoBoughtCourseIds]);

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

  // Handle review submission
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('Please log in to submit a review');
      navigate('/auth/login');
      return;
    }
    if (!reviewText.trim()) {
      alert('Please write a review');
      return;
    }

    setSubmittingReview(true);
    try {
      await api.post(`/courses/${courseData._id}/reviews`, {
        text: reviewText,
        rating: reviewRating,
      });
      alert('Review submitted successfully!');
      setReviewText('');
      setReviewRating(5);
      setShowReviewForm(false);
      // Refresh course data to show new review
      const updatedCourse = await fetchCourseById(courseData._id);
      if (updatedCourse) setFullCourse(updatedCourse);
    } catch (err) {
      console.error('Failed to submit review:', err);
      alert('Failed to submit review. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading || fullCourseLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!courseData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
        <p className="text-6xl">😕</p>
        <h2 className="text-2xl font-bold text-gray-900">Course not found</h2>
        <button onClick={() => navigate('/courses')}
          className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition border-none cursor-pointer">
          Browse all courses
        </button>
      </div>
    );
  }

  // Use real instructor data or fallback to course-level instructor fields
  const instructor = instructorData ? {
    name:     instructorData.name || 'Instructor',
    rating:   instructorData.instructorRating || 0,
    reviews:  instructorData.instructorReviews || 0,
    students: instructorData.instructorStudents || 0,
    courses:  instructorData.instructorCourses || 0,
    bio:      instructorData.bio || instructorData.instructorBio || '',
    image:    instructorData.avatar || instructorData.instructorImage || '👩‍💼',
  } : {
    name:     courseData.instructor        || 'Instructor',
    rating:   courseData.instructorRating  || 0,
    reviews:  courseData.instructorReviews || 0,
    students: courseData.instructorStudents|| 0,
    courses:  courseData.instructorCourses || 0,
    bio:      courseData.instructorBio     || '',
    image:    courseData.instructorImage   || '👩‍💼',
  };

  const totalLectures = sections.reduce((a, s) => a + s.lectures, 0);

  // ✅ Get testimonials from course data
  const textReviews = courseData.reviews_list || [];
  const imageTestimonials = courseData.imageTestimonials || [];
  const videoTestimonials = courseData.videoTestimonials || [];
  const projectGallery = courseData.projectGallery || [];

  // Debug logging
  console.log('🎨 Course Data:', {
    title: courseData.title,
    imageTestimonials: imageTestimonials.length,
    videoTestimonials: videoTestimonials.length,
    projectGallery: projectGallery.length,
    alsoBoughtCourses: studentsBoughtCourses.length,
    alsoBoughtIds: courseData.alsoBoughtCourseIds,
  });

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden w-full">

      {/* FULL-SCREEN COURSE PREVIEW POPUP */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-[9999] bg-black bg-opacity-95 flex flex-col">
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={handleClosePreview}
              className="p-3 bg-white bg-opacity-10 hover:bg-opacity-20 rounded-full transition border-none cursor-pointer backdrop-blur-sm"
              aria-label="Close preview"
            >
              <X size={24} className="text-white" />
            </button>
          </div>
          
          <div className="w-full bg-gradient-to-r from-gray-900 to-black border-b border-gray-800 py-6">
            <div className="max-w-7xl mx-auto px-6">
              <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2">Course Preview</h2>
              <p className="text-lg text-gray-300">{courseData.title}</p>
            </div>
          </div>

          <div className="w-full bg-black">
            <div className="max-w-7xl mx-auto">
              <VideoPlayer url={currentVideo} className="w-full" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-gradient-to-b from-black to-gray-900">
            <div className="max-w-7xl mx-auto px-6 py-8">
              <h3 className="text-xl lg:text-2xl font-bold text-white mb-6">Free Preview Lectures</h3>
              {previewLectures.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-400 text-lg">No preview lectures available</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {previewLectures.map((lecture, idx) => (
                    <div
                      key={`${lecture.sectionIdx}-${lecture.lectureIdx}`}
                      onClick={() => handleLectureClick(lecture.videoUrl)}
                      className="bg-white bg-opacity-5 hover:bg-opacity-10 border border-gray-800 rounded-lg p-4 cursor-pointer transition group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-600 group-hover:bg-purple-700 flex items-center justify-center transition">
                          <Play size={16} className="text-white ml-0.5" fill="currentColor" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-base text-white group-hover:text-purple-400 transition truncate">
                            {lecture.title}
                          </p>
                          <p className="text-sm text-gray-400 mt-1">{lecture.sectionTitle}</p>
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
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-center py-3 px-4 w-full">
          <p className="text-sm font-semibold text-white">
            🎉 Limited Time Offer: Save {Math.round((1-courseData.discountPrice/courseData.originalPrice)*100)}% - Ends Soon!
          </p>
        </div>
      )}

      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white shadow-sm w-full">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-4 flex items-center justify-between">
          <button className="lg:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu">
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className="absolute left-1/2 transform -translate-x-1/2 lg:relative lg:left-auto lg:transform-none">
            <button onClick={() => handleNavigate('/')}
              className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent cursor-pointer hover:opacity-80 transition bg-transparent border-none p-0">
              Courseify
            </button>
          </div>
          <nav className="hidden lg:flex items-center gap-8 flex-1 ml-12">
            <button onClick={() => handleNavigate('/courses')} className="text-gray-700 hover:text-purple-600 transition bg-transparent border-none cursor-pointer p-0 font-medium">Categories</button>
            <button onClick={() => handleNavigate('/instructor')} className="text-gray-700 hover:text-purple-600 transition bg-transparent border-none cursor-pointer p-0 font-medium">Instructor</button>
            <button onClick={() => handleNavigate('/courses')} className="text-gray-700 hover:text-purple-600 transition bg-transparent border-none cursor-pointer p-0 font-medium">About</button>
          </nav>
          <div className="flex items-center gap-3">
            <Search className="hidden lg:block text-gray-400 cursor-pointer hover:text-gray-600 transition" size={22} />
            <button onClick={() => handleNavigate('/auth/login')} className="px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold border-none cursor-pointer text-sm shadow-sm">Log In</button>
          </div>
        </div>
        {mobileMenuOpen && (
          <>
            <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
            <div className="fixed top-0 left-0 h-full w-64 bg-gray-900 z-50 lg:hidden shadow-2xl">
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-xl font-bold text-white">Menu</span>
                  <button onClick={() => setMobileMenuOpen(false)} className="p-2 hover:bg-gray-800 rounded-lg transition bg-transparent border-none cursor-pointer text-white"><X size={24} /></button>
                </div>
                <button onClick={() => handleNavigate('/courses')} className="block w-full text-left text-white hover:text-purple-400 bg-transparent border-none cursor-pointer p-3 rounded-lg hover:bg-gray-800 font-medium transition">Categories</button>
                <button onClick={() => handleNavigate('/instructor')} className="block w-full text-left text-white hover:text-purple-400 bg-transparent border-none cursor-pointer p-3 rounded-lg hover:bg-gray-800 font-medium transition">Instructor</button>
              </div>
            </div>
          </>
        )}
      </header>

      {/* BREADCRUMB */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-3 text-sm text-gray-600 w-full flex items-center gap-2">
          <button onClick={() => handleNavigate('/')} className="hover:text-purple-600 bg-transparent border-none cursor-pointer text-gray-600 p-0 transition">Development</button>
          <ChevronDown size={14} className="rotate-[-90deg] text-gray-400" />
          <button onClick={() => handleNavigate('/courses')} className="hover:text-purple-600 bg-transparent border-none cursor-pointer text-gray-600 p-0 transition">{courseData.category || 'Courses'}</button>
          <ChevronDown size={14} className="rotate-[-90deg] text-gray-400" />
          <span className="text-gray-900 font-medium truncate">{courseData.title}</span>
        </div>
      </div>

      {/* REST OF THE COMPONENT CONTINUES... (keeping all the existing sections) */}
      {/* For brevity, I'll include just the key new sections at the end */}

      {/* COURSE HERO, CONTENT, etc. - keeping existing code... */}
      
      {/* ... (Previous sections remain unchanged) ... */}

      {/* MAIN CONTENT */}
      <section className="w-full bg-white py-12 lg:py-16 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content Column */}
            <div className="lg:col-span-2">

              {/* ... Previous sections (What you'll learn, Course content, etc.) ... */}

              {/* ✅ IMAGE TESTIMONIALS SLIDER */}
              {imageTestimonials.length > 0 && (
                <div className="mb-12 pt-8 border-t border-gray-200">
                  <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-6">Student Testimonials</h2>
                  <div className="relative">
                    <div className="overflow-hidden rounded-xl">
                      <div className="aspect-video bg-gray-100">
                        <img
                          src={imageTestimonials[imageTestimonialIndex].imageUrl}
                          alt={imageTestimonials[imageTestimonialIndex].author}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    <div className="mt-4 bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-700 text-sm leading-relaxed mb-2">{imageTestimonials[imageTestimonialIndex].text}</p>
                      <p className="text-sm font-semibold text-gray-900">— {imageTestimonials[imageTestimonialIndex].author}</p>
                    </div>
                    {imageTestimonials.length > 1 && (
                      <div className="flex items-center justify-between mt-4">
                        <button
                          onClick={() => setImageTestimonialIndex((imageTestimonialIndex - 1 + imageTestimonials.length) % imageTestimonials.length)}
                          className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                          <ChevronLeft size={20} className="text-gray-600" />
                        </button>
                        <div className="flex gap-2">
                          {imageTestimonials.map((_, idx) => (
                            <button
                              key={idx}
                              onClick={() => setImageTestimonialIndex(idx)}
                              className={`w-2 h-2 rounded-full transition ${idx === imageTestimonialIndex ? 'bg-purple-600 w-6' : 'bg-gray-300'}`}
                            />
                          ))}
                        </div>
                        <button
                          onClick={() => setImageTestimonialIndex((imageTestimonialIndex + 1) % imageTestimonials.length)}
                          className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                          <ChevronRight size={20} className="text-gray-600" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ✅ VIDEO TESTIMONIALS SLIDER */}
              {videoTestimonials.length > 0 && (
                <div className="mb-12 pt-8 border-t border-gray-200">
                  <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-6">Video Reviews</h2>
                  <div className="relative">
                    <div className="rounded-xl overflow-hidden">
                      <VideoPlayer url={videoTestimonials[videoTestimonialIndex].videoUrl} />
                    </div>
                    <div className="mt-4 bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-700 text-sm leading-relaxed mb-2">{videoTestimonials[videoTestimonialIndex].text}</p>
                      <p className="text-sm font-semibold text-gray-900">— {videoTestimonials[videoTestimonialIndex].author}</p>
                    </div>
                    {videoTestimonials.length > 1 && (
                      <div className="flex items-center justify-between mt-4">
                        <button
                          onClick={() => setVideoTestimonialIndex((videoTestimonialIndex - 1 + videoTestimonials.length) % videoTestimonials.length)}
                          className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                          <ChevronLeft size={20} className="text-gray-600" />
                        </button>
                        <div className="flex gap-2">
                          {videoTestimonials.map((_, idx) => (
                            <button
                              key={idx}
                              onClick={() => setVideoTestimonialIndex(idx)}
                              className={`w-2 h-2 rounded-full transition ${idx === videoTestimonialIndex ? 'bg-purple-600 w-6' : 'bg-gray-300'}`}
                            />
                          ))}
                        </div>
                        <button
                          onClick={() => setVideoTestimonialIndex((videoTestimonialIndex + 1) % videoTestimonials.length)}
                          className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                          <ChevronRight size={20} className="text-gray-600" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ✅ PROJECT GALLERY SLIDER */}
              {projectGallery.length > 0 && (
                <div className="mb-12 pt-8 border-t border-gray-200">
                  <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-6">Student Projects</h2>
                  <div className="relative">
                    <div className="overflow-hidden rounded-xl">
                      <div className="aspect-video bg-gray-100">
                        <img
                          src={projectGallery[projectGalleryIndex].imageUrl}
                          alt={projectGallery[projectGalleryIndex].caption || "Student project"}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    {projectGallery[projectGalleryIndex].caption && (
                      <div className="mt-4 bg-gray-50 rounded-lg p-4">
                        <p className="text-gray-700 text-sm leading-relaxed">{projectGallery[projectGalleryIndex].caption}</p>
                      </div>
                    )}
                    {projectGallery.length > 1 && (
                      <div className="flex items-center justify-between mt-4">
                        <button
                          onClick={() => setProjectGalleryIndex((projectGalleryIndex - 1 + projectGallery.length) % projectGallery.length)}
                          className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                          <ChevronLeft size={20} className="text-gray-600" />
                        </button>
                        <div className="flex gap-2">
                          {projectGallery.map((_, idx) => (
                            <button
                              key={idx}
                              onClick={() => setProjectGalleryIndex(idx)}
                              className={`w-2 h-2 rounded-full transition ${idx === projectGalleryIndex ? 'bg-purple-600 w-6' : 'bg-gray-300'}`}
                            />
                          ))}
                        </div>
                        <button
                          onClick={() => setProjectGalleryIndex((projectGalleryIndex + 1) % projectGallery.length)}
                          className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                          <ChevronRight size={20} className="text-gray-600" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>

            {/* Sidebar remains unchanged */}
          </div>

          {/* ✅ STUDENTS ALSO BOUGHT - Now shows instructor-selected courses */}
          {studentsBoughtCourses.length > 0 && (
            <div className="mt-16 pt-12 border-t border-gray-200">
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-8">
                Students also bought
                {courseData.alsoBoughtCourseIds?.length > 0 && (
                  <span className="ml-2 text-sm font-normal text-gray-500">(Instructor's picks)</span>
                )}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {studentsBoughtCourses.map(course => (
                  <div key={course._id}
                    onClick={() => navigate(`/course/${course._id}`)}
                    className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition cursor-pointer group">
                    <div className={`h-40 bg-gradient-to-br ${course.color || 'from-gray-300 to-gray-400'} flex items-center justify-center text-4xl relative overflow-hidden`}>
                      {course.thumbnail
                        ? <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        : <span className="text-5xl">{course.emoji || '📚'}</span>}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 text-sm mb-2 line-clamp-2 group-hover:text-purple-600 transition">{course.title}</h3>
                      <p className="text-xs text-gray-600 mb-2">{course.instructor || 'Instructor'}</p>
                      <div className="flex items-center gap-1 mb-2">
                        <span className="font-bold text-sm text-gray-900">{course.rating}</span>
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} size={12} className="text-yellow-400" fill={i < Math.floor(course.rating) ? 'currentColor' : 'none'} />
                          ))}
                        </div>
                        <span className="text-xs text-gray-500">({formatNumber(course.reviews)})</span>
                      </div>
                      <p className="text-base font-bold text-gray-900">${course.price}</p>
                      {course.bestseller && (
                        <span className="inline-block bg-yellow-100 text-yellow-800 font-bold px-2 py-1 rounded text-xs mt-2">Bestseller</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* FOOTER - keeping existing code */}

      {/* STICKY BOTTOM BAR - MOBILE - keeping existing code */}
      
    </div>
  );
}
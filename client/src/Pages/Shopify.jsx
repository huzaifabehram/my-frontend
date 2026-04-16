// src/Pages/Shopify.jsx  (Course Landing Page)
// UPDATED: Facebook-style cards for Video Reviews and Image Testimonials
// Modern card design with social interactions (like/comment)
// Interactive modals for full-screen view
// Horizontal slider with responsive behavior

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronDown, Play, Star, Users, Clock, BookOpen, Zap, Menu, X, Search, Check, Award, Smartphone, Film, Download, Globe, Shield, ChevronLeft, ChevronRight, Heart, MessageCircle, Maximize2 } from 'lucide-react';
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
  if (isDirectVideo(url) || isCloudinaryVideo(url)) {
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

// ═════════════════════════════════════════════════════════════════════════════
// NEW: FACEBOOK-STYLE CARD COMPONENTS
// ═════════════════════════════════════════════════════════════════════════════

// Social Actions Component (Like & Comment)
function SocialActions({ likes = 0, comments = 0, onLike, onComment, isLiked = false }) {
  return (
    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
      <div className="flex items-center gap-4">
        <button
          onClick={onLike}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
            isLiked 
              ? 'bg-red-50 text-red-600' 
              : 'hover:bg-gray-50 text-gray-600'
          }`}
        >
          <Heart 
            size={18} 
            className={isLiked ? 'fill-current' : ''} 
          />
          <span className="text-sm font-medium">{likes > 0 ? formatNumber(likes) : 'Like'}</span>
        </button>
        
        <button
          onClick={onComment}
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-600 transition-all duration-200"
        >
          <MessageCircle size={18} />
          <span className="text-sm font-medium">{comments > 0 ? formatNumber(comments) : 'Comment'}</span>
        </button>
      </div>
    </div>
  );
}

// Image Testimonial Card (Facebook-style)
function ImageTestimonialCard({ testimonial, onImageClick, onLike, onComment, isLiked }) {
  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group flex-shrink-0 w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.67rem)]">
      {/* Image Container */}
      <div 
        className="relative aspect-video bg-gray-100 cursor-pointer overflow-hidden"
        onClick={onImageClick}
      >
        <img
          src={testimonial.imageUrl}
          alt={testimonial.author}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white rounded-full p-3 shadow-lg">
            <Maximize2 size={24} className="text-gray-900" />
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4">
        {/* Author Info */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {testimonial.author?.charAt(0) || 'S'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 text-sm truncate">{testimonial.author}</p>
            <p className="text-xs text-gray-500">Course Student</p>
          </div>
        </div>
        
        {/* Testimonial Text */}
        <p className="text-sm text-gray-700 leading-relaxed line-clamp-3 mb-3">
          {testimonial.text}
        </p>
        
        {/* Social Actions */}
        <SocialActions
          likes={testimonial.likes || 0}
          comments={testimonial.comments || 0}
          onLike={onLike}
          onComment={onComment}
          isLiked={isLiked}
        />
      </div>
    </div>
  );
}

// Video Testimonial Card (Facebook-style)
function VideoTestimonialCard({ testimonial, onVideoClick, onLike, onComment, isLiked }) {
  const getVideoThumbnail = (url) => {
    const ytId = getYouTubeId(url);
    if (ytId) return `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`;
    return null;
  };

  const thumbnail = getVideoThumbnail(testimonial.videoUrl);

  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group flex-shrink-0 w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.67rem)]">
      {/* Video Thumbnail */}
      <div 
        className="relative aspect-video bg-gray-900 cursor-pointer overflow-hidden"
        onClick={onVideoClick}
      >
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={testimonial.author}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-900 to-purple-700 flex items-center justify-center">
            <Film size={48} className="text-white opacity-50" />
          </div>
        )}
        
        {/* Play Button Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-30 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-white bg-opacity-95 group-hover:bg-opacity-100 flex items-center justify-center shadow-2xl transition-all duration-300 transform group-hover:scale-110">
            <Play size={28} className="text-purple-600 ml-1" fill="currentColor" />
          </div>
        </div>
        
        {/* Video Badge */}
        <div className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
          <Film size={12} />
          <span>VIDEO</span>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4">
        {/* Author Info */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {testimonial.author?.charAt(0) || 'S'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 text-sm truncate">{testimonial.author}</p>
            <p className="text-xs text-gray-500">Video Review</p>
          </div>
        </div>
        
        {/* Testimonial Text */}
        <p className="text-sm text-gray-700 leading-relaxed line-clamp-3 mb-3">
          {testimonial.text}
        </p>
        
        {/* Social Actions */}
        <SocialActions
          likes={testimonial.likes || 0}
          comments={testimonial.comments || 0}
          onLike={onLike}
          onComment={onComment}
          isLiked={isLiked}
        />
      </div>
    </div>
  );
}

// Full-Screen Image Modal
function ImageModal({ isOpen, onClose, imageUrl, author, text }) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-black bg-opacity-95 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-3 bg-white bg-opacity-10 hover:bg-opacity-20 rounded-full transition z-10"
      >
        <X size={24} className="text-white" />
      </button>
      
      <div className="max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
        <img
          src={imageUrl}
          alt={author}
          className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
        />
        <div className="mt-4 bg-white rounded-lg p-4">
          <p className="font-bold text-gray-900 mb-2">{author}</p>
          <p className="text-sm text-gray-700">{text}</p>
        </div>
      </div>
    </div>
  );
}

// Full-Screen Video Modal
function VideoModal({ isOpen, onClose, videoUrl, author, text }) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-black bg-opacity-95 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-3 bg-white bg-opacity-10 hover:bg-opacity-20 rounded-full transition z-10"
      >
        <X size={24} className="text-white" />
      </button>
      
      <div className="max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
        <div className="rounded-lg overflow-hidden">
          <VideoPlayer url={videoUrl} />
        </div>
        <div className="mt-4 bg-white rounded-lg p-4">
          <p className="font-bold text-gray-900 mb-2">{author}</p>
          <p className="text-sm text-gray-700">{text}</p>
        </div>
      </div>
    </div>
  );
}

// Horizontal Scrollable Container
function HorizontalScrollContainer({ children, onPrev, onNext, showNav }) {
  const scrollRef = useRef(null);

  const handleScroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.offsetWidth * 0.8;
      scrollRef.current.scrollBy({
        left: direction === 'next' ? scrollAmount : -scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="relative">
      {/* Scroll Container */}
      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-4 scroll-smooth snap-x snap-mandatory hide-scrollbar"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {children}
      </div>

      {/* Navigation Buttons - Desktop Only */}
      {showNav && (
        <>
          <button
            onClick={() => handleScroll('prev')}
            className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-12 h-12 bg-white rounded-full shadow-lg items-center justify-center hover:shadow-xl transition-all duration-300 z-10"
          >
            <ChevronLeft size={24} className="text-gray-900" />
          </button>
          
          <button
            onClick={() => handleScroll('next')}
            className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-12 h-12 bg-white rounded-full shadow-lg items-center justify-center hover:shadow-xl transition-all duration-300 z-10"
          >
            <ChevronRight size={24} className="text-gray-900" />
          </button>
        </>
      )}

      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════

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

  // NEW: Modal states for image/video testimonials
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);

  // NEW: Like states (UI only - connected to existing logic if available)
  const [likedItems, setLikedItems] = useState(new Set());

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

  // Fetch instructor data
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

  const studentsBoughtCourses = useMemo(() => {
    if (!courseData?._id) return [];
    const picked = courseData.alsoBoughtCourseIds;
    if (Array.isArray(picked) && picked.length > 0) {
      const byId = new Map(courses.map((c) => [String(c._id), c]));
      return picked
        .map((cid) => byId.get(String(cid)))
        .filter(Boolean)
        .filter((c) => c.status === "published" && String(c._id) !== String(courseData._id));
    }
    return courses
      .filter((c) => c._id !== courseData._id && c.status === "published")
      .slice(0, 4);
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
      if (e.key === 'Escape') {
        if (isPreviewOpen) handleClosePreview();
        if (imageModalOpen) setImageModalOpen(false);
        if (videoModalOpen) setVideoModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPreviewOpen, imageModalOpen, videoModalOpen]);

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
      const updatedCourse = await fetchCourseById(courseData._id);
      if (updatedCourse) setFullCourse(updatedCourse);
    } catch (err) {
      console.error('Failed to submit review:', err);
      alert('Failed to submit review. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  // NEW: Handle like/comment (UI only - connect to your existing logic)
  const handleLike = (itemId) => {
    setLikedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
    // TODO: Connect to your backend if you want to persist likes
  };

  const handleComment = () => {
    alert('Comment feature - connect to your existing comment system');
    // TODO: Open comment modal/section
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

  const totalLectures = sections.reduce((a, s) => a + (s.lectures || 0), 0);

  const textReviews = courseData.reviews_list || [];
  const imageTestimonials = courseData.imageTestimonials || [];
  const videoTestimonials = courseData.videoTestimonials || [];
  const projectGallery = courseData.projectGallery || [];

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden w-full">

      {/* EXISTING PREVIEW POPUP */}
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

      {/* NEW: Image Modal */}
      <ImageModal
        isOpen={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
        imageUrl={selectedImage?.imageUrl}
        author={selectedImage?.author}
        text={selectedImage?.text}
      />

      {/* NEW: Video Modal */}
      <VideoModal
        isOpen={videoModalOpen}
        onClose={() => setVideoModalOpen(false)}
        videoUrl={selectedVideo?.videoUrl}
        author={selectedVideo?.author}
        text={selectedVideo?.text}
      />

      {/* ANNOUNCEMENT BAR */}
      {courseData.discountPrice && courseData.discountPrice < courseData.originalPrice && (
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-center py-3 px-4 w-full">
          <p className="text-sm font-semibold text-white">
            🎉 Limited Time Offer: Save {Math.round((1-courseData.discountPrice/courseData.originalPrice)*100)}% - Ends Soon!
          </p>
        </div>
      )}

      {/* HEADER - Keep existing */}
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

      {/* BREADCRUMB - Keep existing */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-3 text-sm text-gray-600 w-full flex items-center gap-2">
          <button onClick={() => handleNavigate('/')} className="hover:text-purple-600 bg-transparent border-none cursor-pointer text-gray-600 p-0 transition">Development</button>
          <ChevronDown size={14} className="rotate-[-90deg] text-gray-400" />
          <button onClick={() => handleNavigate('/courses')} className="hover:text-purple-600 bg-transparent border-none cursor-pointer text-gray-600 p-0 transition">{courseData.category || 'Courses'}</button>
          <ChevronDown size={14} className="rotate-[-90deg] text-gray-400" />
          <span className="text-gray-900 font-medium truncate">{courseData.title}</span>
        </div>
      </div>

      {/* HERO SECTION - Keep existing (truncated for brevity - same as original) */}
      <section className="w-full bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white py-8 lg:py-12 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="mb-4 flex items-center gap-2 flex-wrap">
                {courseData.bestseller && (
                  <span className="inline-flex items-center gap-1 bg-yellow-400 text-gray-900 font-bold px-3 py-1.5 rounded text-xs">
                    <Award size={14} />
                    Bestseller
                  </span>
                )}
                {courseData.level && (
                  <span className="inline-block bg-purple-600 text-white font-semibold px-3 py-1.5 rounded text-xs">{courseData.level}</span>
                )}
              </div>

              <h1 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-4 leading-tight">{courseData.title}</h1>
              <p className="text-lg lg:text-xl text-gray-300 mb-6 leading-relaxed">{courseData.subtitle}</p>

              <div className="-mx-4 lg:-mx-6 mb-6">
                <div className="relative w-full bg-black aspect-video cursor-pointer" onClick={handlePreviewClick}>
                  <CourseThumbnail course={courseData} />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 mb-6">
                {courseData.rating > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-400 font-bold text-sm">{courseData.rating}</span>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={16} className="text-yellow-400" fill={i < Math.floor(courseData.rating) ? 'currentColor' : 'none'} />
                      ))}
                    </div>
                    <span className="text-purple-300 text-sm">({courseData.reviews?.toLocaleString()} ratings)</span>
                  </div>
                )}
                {courseData.students > 0 && (
                  <div className="flex items-center gap-1.5 text-gray-300 text-sm">
                    <Users size={16} />
                    <span>{courseData.students.toLocaleString()} students</span>
                  </div>
                )}
              </div>

              <div className="mb-6">
                <p className="text-gray-400 text-sm">
                  Created by{' '}
                  <button onClick={() => handleNavigate('/instructor')}
                    className="text-purple-400 hover:text-purple-300 font-semibold bg-transparent border-none cursor-pointer p-0 underline">
                    {instructor.name}
                  </button>
                </p>
              </div>

              <div className="flex flex-wrap gap-4 text-gray-400 text-sm">
                <div className="flex items-center gap-1.5"><Clock size={16} /><span>Last updated {courseData.lastUpdated || 'Recently'}</span></div>
                <div className="flex items-center gap-1.5"><Globe size={16} /><span>{courseData.language || 'English'}</span></div>
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="sticky top-24">
                <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
                  <div className="relative aspect-video cursor-pointer group" onClick={handlePreviewClick}>
                    <CourseThumbnail course={courseData} />
                  </div>
                  <div className="p-6">
                    <div className="flex items-baseline gap-3 mb-4">
                      <span className="text-3xl font-bold text-gray-900">PKR {(courseData.price * 280).toLocaleString()}</span>
                      {courseData.originalPrice > courseData.price && (
                        <span className="text-sm font-semibold text-purple-600">{Math.round((1-courseData.price/courseData.originalPrice)*100)}% off</span>
                      )}
                    </div>
                    <button onClick={() => handleNavigate('/auth/register')}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg transition text-base border-none cursor-pointer shadow-lg mb-3">
                      Enroll Now in PKR {(courseData.price * 280).toLocaleString()}
                    </button>
                    <button onClick={() => handleNavigate('/auth/register')}
                      className="w-full bg-white hover:bg-gray-50 text-gray-900 font-semibold py-3 rounded-lg transition text-base border-2 border-gray-300 cursor-pointer">
                      Buy now
                    </button>
                    <p className="text-center text-xs text-gray-500 mt-4">30-Day Money-Back Guarantee</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <section className="w-full bg-white py-12 lg:py-16 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">

              {/* Keep all existing sections: What You'll Learn, Course Content, Requirements, Description, Instructor, Text Reviews, Write Review */}
              {/* ... (Same as original - truncated for brevity) ... */}

              {/* ═══════════════════════════════════════════════════════════════ */}
              {/* NEW: STUDENT TESTIMONIALS - FACEBOOK STYLE CARDS */}
              {/* ═══════════════════════════════════════════════════════════════ */}
              {imageTestimonials.length > 0 && (
                <div className="mb-12 pt-8 border-t border-gray-200">
                  {/* Section Header */}
                  <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3">
                    Student Testimonials
                  </h2>
                  
                  {/* Dynamic Description */}
                  <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                    Hear what our students have to say about their learning experience. 
                    Real stories from real students who transformed their skills.
                  </p>
                  
                  {/* Horizontal Scrollable Cards */}
                  <HorizontalScrollContainer showNav={imageTestimonials.length > 3}>
                    {imageTestimonials.map((testimonial, idx) => (
                      <ImageTestimonialCard
                        key={testimonial.id || testimonial._id || idx}
                        testimonial={testimonial}
                        onImageClick={() => {
                          setSelectedImage(testimonial);
                          setImageModalOpen(true);
                        }}
                        onLike={() => handleLike(`image-${idx}`)}
                        onComment={handleComment}
                        isLiked={likedItems.has(`image-${idx}`)}
                      />
                    ))}
                  </HorizontalScrollContainer>
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════════════ */}
              {/* NEW: VIDEO REVIEWS - FACEBOOK STYLE CARDS */}
              {/* ═══════════════════════════════════════════════════════════════ */}
              {videoTestimonials.length > 0 && (
                <div className="mb-12 pt-8 border-t border-gray-200">
                  {/* Section Header */}
                  <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3">
                    Video Reviews
                  </h2>
                  
                  {/* Dynamic Description */}
                  <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                    Watch authentic video testimonials from students who have completed this course. 
                    See their journey and results firsthand.
                  </p>
                  
                  {/* Horizontal Scrollable Cards */}
                  <HorizontalScrollContainer showNav={videoTestimonials.length > 3}>
                    {videoTestimonials.map((testimonial, idx) => (
                      <VideoTestimonialCard
                        key={testimonial.id || testimonial._id || idx}
                        testimonial={testimonial}
                        onVideoClick={() => {
                          setSelectedVideo(testimonial);
                          setVideoModalOpen(true);
                        }}
                        onLike={() => handleLike(`video-${idx}`)}
                        onComment={handleComment}
                        isLiked={likedItems.has(`video-${idx}`)}
                      />
                    ))}
                  </HorizontalScrollContainer>
                </div>
              )}

              {/* PROJECT GALLERY - Keep existing */}
              {projectGallery.length > 0 && (
                <div className="mb-12 pt-8 border-t border-gray-200">
                  <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Project gallery</h2>
                  <p className="text-sm text-gray-500 mb-6">Student work and course outcomes</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {projectGallery.map((item) => (
                      <figure
                        key={item.id || item._id || item.imageUrl}
                        className="group rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm hover:shadow-md transition"
                      >
                        <div className="aspect-video bg-gray-100 overflow-hidden">
                          <img
                            src={item.imageUrl}
                            alt={item.caption || "Project"}
                            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                          />
                        </div>
                        {item.caption ? (
                          <figcaption className="px-3 py-2.5 text-sm text-gray-700 border-t border-gray-100">
                            {item.caption}
                          </figcaption>
                        ) : null}
                      </figure>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar - Keep existing */}
            <div className="hidden lg:block lg:col-span-1">
              <div className="sticky top-24">
                <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">This course includes:</h3>
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
                        <div key={idx} className="flex items-center gap-3">
                          <Icon size={20} className="text-gray-600" />
                          <p className="text-sm text-gray-700">{item.text}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* STUDENTS ALSO BOUGHT - Keep existing */}
          {studentsBoughtCourses.length > 0 && (
            <div className="mt-16 pt-12 border-t border-gray-200">
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-8">Students also bought</h2>
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

      {/* FOOTER - Keep existing */}
      <footer className="bg-gray-900 text-gray-400 py-12 w-full border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 mb-12">
            {[
              { title: 'Courseify',   links: ['About', 'Press', 'Contact', 'Careers'] },
              { title: 'Community',   links: ['Learners', 'Partners', 'Developers', 'Beta Testers'] },
              { title: 'Teaching',    links: ['Become Instructor', 'Teaching Center', 'Resources'] },
              { title: 'Programs',    links: ['Enterprise', 'Government', 'Courseify Business'] },
              { title: 'Support',     links: ['Help Center', 'Get the App', 'FAQ', 'Accessibility'] },
              { title: 'Legal',       links: ['Terms', 'Privacy Policy', 'Cookie Settings', 'Sitemap'] },
            ].map(col => (
              <div key={col.title}>
                <h3 className="font-bold text-white mb-4 text-sm">{col.title}</h3>
                <ul className="space-y-2 text-sm">
                  {col.links.map(link => (
                    <li key={link}><button onClick={() => handleNavigate('/')} className="hover:text-white transition bg-transparent border-none cursor-pointer text-gray-400 p-0">{link}</button></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-gray-800">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <button onClick={() => handleNavigate('/')}
                className="text-xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent cursor-pointer hover:opacity-80 transition bg-transparent border-none p-0">
                Courseify
              </button>
            </div>
            <p className="text-sm text-gray-500">© 2024 Courseify, Inc. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* STICKY BOTTOM BAR - Keep existing */}
      <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-white border-t-2 border-gray-200 p-4 z-50 flex items-center justify-between gap-4 w-full shadow-2xl">
        <div className="flex flex-col">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">PKR {(courseData.price * 280).toLocaleString()}</span>
          </div>
          {courseData.originalPrice > courseData.price && (
            <span className="text-xs text-purple-600 font-semibold">{Math.round((1-courseData.price/courseData.originalPrice)*100)}% off</span>
          )}
        </div>
        <button onClick={() => handleNavigate('/auth/register')}
          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg transition text-base border-none cursor-pointer shadow-lg">
          Enroll Now in PKR {(courseData.price * 280).toLocaleString()}
        </button>
      </div>

      <div className="h-20 lg:h-0" />
    </div>
  );
}
// src/Pages/Shopify.jsx  (Course Landing Page)
// Reads course data from CoursesContext — falls back to a placeholder
// when no id param is present (used as the home "/" route).
// UPDATED: Only shows published courses in "Students also bought" section
// UPDATED: Bunny.net video support added
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

// ── Bunny.net video helper ────────────────────────────────────────────────
function getBunnyNetInfo(url) {
  if (!url) return null;
  
  // Check for iframe embed URL: https://iframe.mediadelivery.net/embed/{libraryId}/{videoId}
  const embedMatch = url.match(/iframe\.mediadelivery\.net\/embed\/(\d+)\/([a-f0-9-]+)/i);
  if (embedMatch) {
    return {
      libraryId: embedMatch[1],
      videoId: embedMatch[2],
      embedUrl: url
    };
  }
  
  // Check for direct CDN URL: https://vz-{hash}.b-cdn.net/{videoId}/playlist.m3u8
  const cdnMatch = url.match(/vz-[^.]+\.b-cdn\.net\/([a-f0-9-]+)/i);
  if (cdnMatch) {
    return {
      videoId: cdnMatch[1],
      isCdn: true
    };
  }
  
  return null;
}

// ── Course thumbnail with fallback ────────────────────────────────────────
function CourseThumbnail({ course }) {
  const [imgErr, setImgErr] = useState(false);
  const ytId = getYouTubeId(course.previewVideoUrl);
  const bunnyInfo = getBunnyNetInfo(course.previewVideoUrl);

  // Bunny.net video player
  if (bunnyInfo) {
    return (
      <div className="relative w-full h-full bg-black">
        <iframe
          src={bunnyInfo.embedUrl || `https://iframe.mediadelivery.net/embed/${bunnyInfo.libraryId}/${bunnyInfo.videoId}?autoplay=false&preload=true`}
          loading="lazy"
          style={{
            border: 'none',
            width: '100%',
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0
          }}
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
          allowFullScreen={true}
        />
      </div>
    );
  }

  // YouTube video
  if (ytId) {
    return (
      <div className="relative w-full h-full bg-black flex items-center justify-center group cursor-pointer">
        <img src={`https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`}
          alt={course.title} className="w-full h-full object-cover opacity-80" />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-red-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M8 5v14l11-7L8 5z" fill="white"/>
            </svg>
          </div>
          <p className="text-white font-semibold text-base lg:text-lg">Preview this course</p>
        </div>
      </div>
    );
  }

  if (course.previewVideoUrl && !imgErr) {
    return (
      <video src={course.previewVideoUrl} className="w-full h-full object-cover" controls
        onError={() => setImgErr(true)} />
    );
  }

  if (course.thumbnail && !imgErr) {
    return (
      <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover"
        onError={() => setImgErr(true)} />
    );
  }

  // Emoji fallback
  return (
    <div className={`w-full h-full bg-gradient-to-br ${course.color || 'from-blue-600 to-purple-700'} flex flex-col items-center justify-center gap-4`}>
      <span className="text-8xl">{course.emoji || '📚'}</span>
      <p className="text-white font-semibold text-base">Preview this course</p>
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
  const { courses, loading, getCourse } = useCourses();

  const [mobileMenuOpen,       setMobileMenuOpen]       = useState(false);
  const [expandedSection,      setExpandedSection]      = useState([0]);
  const [imageCarouselIndex,   setImageCarouselIndex]   = useState(0);
  const [showFullDescription,  setShowFullDescription]  = useState(false);
  const [showAllReviews,       setShowAllReviews]       = useState(false);
  const [showFullInstructorBio,setShowFullInstructorBio]= useState(false);

  // ═══════════════════════════════════════════════════════════════════════════
  // CRITICAL: Resolve which course to show
  // - If we have an :id param (route /course/:id) → find that specific course
  // - If we're at "/" with no id → show the first PUBLISHED course as demo
  // ═══════════════════════════════════════════════════════════════════════════
  const courseData = useMemo(() => {
    if (id) {
      return getCourse(id);
    }
    // For homepage demo, show first published course
    const publishedCourses = courses.filter(c => c.status === 'published');
    return publishedCourses.length > 0 ? publishedCourses[0] : null;
  }, [id, courses, getCourse]);

  // Sections are already normalised by CoursesContext
  const sections = courseData?.sections || [];

  // ═══════════════════════════════════════════════════════════════════════════
  // Students-also-bought: ONLY show other PUBLISHED courses
  // Filter out the current course and any draft/review courses
  // ═══════════════════════════════════════════════════════════════════════════
  const studentsBoughtCourses = useMemo(() => {
    return courses
      .filter(c => c._id !== courseData?._id && c.status === 'published')
      .slice(0, 4);
  }, [courses, courseData?._id]);

  const handleNavigate = (path) => { setMobileMenuOpen(false); navigate(path); };
  const handlePreviewClick = () => {};

  // ── Loading state ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Not found ────────────────────────────────────────────────────────────
  if (!courseData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-4">
        <p className="text-6xl">😕</p>
        <h2 className="text-2xl font-bold text-gray-900">Course not found</h2>
        <button onClick={() => navigate('/courses')}
          className="px-6 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition border-none cursor-pointer">
          Browse all courses
        </button>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECURITY CHECK: If someone tries to access a draft/review course via URL,
  // redirect them to courses page (optional - remove if instructors should preview)
  // ═══════════════════════════════════════════════════════════════════════════
  // Uncomment this if you want to prevent public access to unpublished courses:
  // if (courseData.status !== 'published') {
  //   return (
  //     <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-4">
  //       <p className="text-6xl">🔒</p>
  //       <h2 className="text-2xl font-bold text-gray-900">This course is not published yet</h2>
  //       <button onClick={() => navigate('/courses')}
  //         className="px-6 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition border-none cursor-pointer">
  //         Browse published courses
  //       </button>
  //     </div>
  //   );
  // }

  // ── Instructor shape (normalised by context, with fallbacks) ─────────────
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
    <div className="min-h-screen bg-white overflow-x-hidden w-full">

      {/* ANNOUNCEMENT BAR */}
      {courseData.discountPrice && courseData.discountPrice < courseData.originalPrice && (
        <div className="bg-amber-50 text-center py-3 px-4 w-full">
          <p className="text-sm font-medium text-gray-800">
            🎉 Limited time: Get this course for ${courseData.discountPrice} ({Math.round((1-courseData.discountPrice/courseData.originalPrice)*100)}% off). Enroll now!
          </p>
        </div>
      )}

      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 w-full">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <button className="lg:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu">
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className="absolute left-1/2 transform -translate-x-1/2 lg:relative lg:left-auto lg:transform-none">
            <button onClick={() => handleNavigate('/')}
              className="text-2xl font-bold text-gray-900 cursor-pointer hover:text-purple-600 transition bg-transparent border-none p-0">
              Courseify
            </button>
          </div>
          <nav className="hidden lg:flex items-center gap-8 flex-1 ml-12">
            <button onClick={() => handleNavigate('/courses')} className="text-gray-700 hover:text-gray-900 transition bg-transparent border-none cursor-pointer p-0 font-medium">Categories</button>
            <button onClick={() => handleNavigate('/instructor')} className="text-gray-700 hover:text-gray-900 transition bg-transparent border-none cursor-pointer p-0 font-medium">Instructor</button>
            <button onClick={() => handleNavigate('/courses')} className="text-gray-700 hover:text-gray-900 transition bg-transparent border-none cursor-pointer p-0 font-medium">About</button>
          </nav>
          <div className="flex items-center gap-3">
            <Search className="hidden lg:block text-gray-400 cursor-pointer hover:text-gray-600 transition" size={20} />
            <button onClick={() => handleNavigate('/auth/login')} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium border-none cursor-pointer text-sm">Login</button>
            <button onClick={() => handleNavigate('/auth/register')} className="hidden lg:block px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition font-medium border-none cursor-pointer">Sign Up</button>
          </div>
        </div>
        {mobileMenuOpen && (
          <>
            <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
            <div className="fixed top-0 left-0 h-full w-1/2 bg-gray-900 z-50 lg:hidden shadow-2xl">
              <div className="p-4 space-y-3">
                <div className="flex justify-end mb-4">
                  <button onClick={() => setMobileMenuOpen(false)} className="p-2 hover:bg-gray-800 rounded-lg transition bg-transparent border-none cursor-pointer text-white"><X size={24} /></button>
                </div>
                <button onClick={() => handleNavigate('/courses')} className="block text-white hover:text-gray-300 bg-transparent border-none cursor-pointer w-full text-left p-3 rounded hover:bg-gray-800 font-medium">Categories</button>
                <button onClick={() => handleNavigate('/instructor')} className="block text-white hover:text-gray-300 bg-transparent border-none cursor-pointer w-full text-left p-3 rounded hover:bg-gray-800 font-medium">Instructor</button>
              </div>
            </div>
          </>
        )}
      </header>

      {/* BREADCRUMB */}
      <div className="max-w-7xl mx-auto px-4 py-3 text-sm text-gray-600 w-full">
        <button onClick={() => handleNavigate('/')} className="hover:underline bg-transparent border-none cursor-pointer text-gray-600 p-0">Development</button>
        <span className="mx-2">›</span>
        <button onClick={() => handleNavigate('/courses')} className="hover:underline bg-transparent border-none cursor-pointer text-gray-600 p-0">{courseData.category || 'Courses'}</button>
        <span className="mx-2">›</span>
        <span className="text-gray-900 font-medium truncate">{courseData.title}</span>
      </div>

      {/* COURSE HEADER */}
      <section className="w-full bg-black text-white py-8 lg:py-12 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-6 lg:mb-8">
            {courseData.bestseller && (
              <span className="inline-block bg-yellow-400 text-black font-bold px-4 py-2 rounded-full text-sm">Bestseller</span>
            )}
            {courseData.level && (
              <span className="inline-block ml-2 bg-white/10 text-white font-semibold px-3 py-1.5 rounded-full text-sm">{courseData.level}</span>
            )}
          </div>

          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-8 leading-tight">{courseData.title}</h1>

          {/* VIDEO / THUMBNAIL */}
          <div className="mb-8">
            <div className="relative bg-gray-800 rounded-xl overflow-hidden aspect-video">
              <CourseThumbnail course={courseData} />
            </div>
          </div>

          <p className="text-xl text-gray-300 mb-8 leading-relaxed max-w-3xl">{courseData.subtitle}</p>

          <div className="flex flex-wrap items-center gap-6 mb-8">
            {courseData.rating > 0 && (
              <div className="flex items-center gap-2">
                <Star size={22} className="text-yellow-400" fill="currentColor" />
                <span className="text-3xl font-bold text-white">{courseData.rating}</span>
                <p className="text-gray-300 font-semibold">({courseData.reviews?.toLocaleString()} ratings)</p>
              </div>
            )}
            {courseData.students > 0 && (
              <div className="flex items-center gap-2 text-gray-300">
                <Users size={20} />
                <span className="font-semibold">{courseData.students.toLocaleString()} students</span>
              </div>
            )}
          </div>

          <div className="mb-8">
            <p className="text-gray-400">
              Created by{' '}
              <button onClick={() => handleNavigate('/instructor')}
                className="text-green-400 hover:text-green-300 font-semibold bg-transparent border-none cursor-pointer p-0">
                {instructor.name}
              </button>
            </p>
          </div>

          <div className="flex flex-wrap gap-6 text-gray-400 text-sm border-t border-gray-800 pt-8">
            <div className="flex items-center gap-2"><Clock size={18} /><span>Last updated {courseData.lastUpdated || 'Recently'}</span></div>
            <div className="flex items-center gap-2"><span>🌐</span><span>{courseData.language || 'English'}</span></div>
          </div>
        </div>
      </section>

      {/* WHITE CONTENT */}
      <section className="w-full bg-white py-12 lg:py-16 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">

          {/* WHAT YOU'LL LEARN */}
          {courseData.whatYouLearn?.length > 0 && (
            <div className="mb-16">
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-8">What you'll learn</h2>
              <div className="border border-gray-300 rounded-lg p-6 lg:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {courseData.whatYouLearn.map((outcome, idx) => (
                    <div key={idx} className="flex gap-4">
                      <Zap size={20} className="text-purple-600 mt-1 flex-shrink-0" />
                      <p className="text-gray-700">{outcome}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* COURSE INCLUDES */}
          <div className="mb-16">
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-8">This course includes</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Clock,    text: courseData.duration ? `${courseData.duration} of on-demand video` : 'On-demand video' },
                { icon: BookOpen, text: `${courseData.lectures || 0} lectures` },
                { icon: Zap,      text: sections.length + ' sections' },
                { icon: Users,    text: 'Lifetime access' },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className="text-center">
                    <Icon size={32} className="text-purple-600 mx-auto mb-3" />
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
                <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Course content</h2>
                <div className="flex flex-wrap gap-3 text-gray-700 lg:text-lg font-semibold">
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
                    <div key={idx} className="border border-gray-300 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setExpandedSection(isExpanded ? expandedSection.filter(i=>i!==idx) : [...expandedSection, idx])}
                        className="w-full px-5 py-4 flex items-center justify-between bg-white hover:bg-gray-50 transition border-none cursor-pointer">
                        <div className="flex items-center gap-3 flex-1 text-left">
                          <ChevronDown size={20} className={`text-gray-600 transition flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{section.title}</h3>
                            <p className="text-xs text-gray-600">{section.lectures || 0} lectures{section.duration ? ` • ${section.duration}` : ''}</p>
                          </div>
                        </div>
                      </button>
                      {isExpanded && section.lectures_list?.length > 0 && (
                        <div className="border-t border-gray-200 bg-gray-50">
                          {section.lectures_list.map((lecture, lectureIdx) => (
                            <div key={lectureIdx} className="px-6 py-4 border-b border-gray-200 last:border-b-0 flex items-center justify-between hover:bg-white transition">
                              <div className="flex items-center gap-4 flex-1">
                                <div className="flex-shrink-0">
                                  {lecture.type === 'video' ? (
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                      <circle cx="12" cy="12" r="11" fill="#FF0000"/>
                                      <path d="M10 8.5L15.5 12L10 15.5V8.5Z" fill="white"/>
                                    </svg>
                                  ) : (
                                    <div className="w-6 h-6 border-2 border-gray-600 rounded-full flex items-center justify-center">
                                      <span className="text-gray-600 text-sm font-bold">✓</span>
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-gray-900 text-base font-medium">{lecture.title}</p>
                                  {lecture.duration && <p className="text-xs text-gray-600">{lecture.duration}</p>}
                                </div>
                              </div>
                              {lecture.preview && (
                                <button onClick={handlePreviewClick}
                                  className="flex items-center gap-2 text-purple-600 hover:text-purple-700 font-bold text-sm cursor-pointer bg-transparent border-none whitespace-nowrap ml-4 transition p-0">
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <circle cx="12" cy="12" r="11" fill="#FF0000"/>
                                    <path d="M10 8.5L15.5 12L10 15.5V8.5Z" fill="white"/>
                                  </svg>
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
              <button onClick={() => setExpandedSection(expandedSection.includes('req') ? expandedSection.filter(i=>i!=='req') : [...expandedSection,'req'])}
                className="w-full flex items-center justify-between py-4 border-b-2 border-gray-300 bg-white hover:bg-gray-50 transition border-x-0 border-t-0 cursor-pointer p-0">
                <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">Requirements</h2>
                <ChevronDown size={28} className={`text-gray-600 transition ${expandedSection.includes('req') ? 'rotate-180' : ''}`} />
              </button>
              {expandedSection.includes('req') && (
                <div className="py-6">
                  <ul className="space-y-3">
                    {courseData.requirements.map((req, idx) => (
                      <li key={idx} className="flex gap-3 text-gray-700 text-lg">
                        <span className="text-purple-600 font-bold flex-shrink-0">•</span>{req}
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
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Description</h2>
              <div className="relative">
                <div className={`text-gray-700 leading-relaxed text-base space-y-4 ${!showFullDescription ? 'max-h-40 overflow-hidden' : ''}`}>
                  <p>{courseData.description}</p>
                </div>
                {!showFullDescription && (
                  <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />
                )}
              </div>
              <button onClick={() => setShowFullDescription(!showFullDescription)}
                className="text-purple-600 hover:text-purple-700 mt-4 text-base font-semibold transition flex items-center gap-2 bg-transparent border-none cursor-pointer p-0">
                <span style={{ fontSize: '24px', lineHeight: '1' }}>{showFullDescription ? '⌃' : '⌄'}</span>
                <span>{showFullDescription ? 'Show less' : 'Show more'}</span>
              </button>
            </div>
          )}

          {/* INSTRUCTOR */}
          <div className="mb-16 py-12 border-t border-gray-200">
            {/* Mobile */}
            <div className="lg:hidden">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Instructor</h2>
              <button onClick={() => handleNavigate('/instructor')}
                className="text-green-600 hover:text-green-700 font-bold text-lg bg-transparent border-none cursor-pointer p-0 mb-4 block">
                {instructor.name}
              </button>
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0 w-36 h-36 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-6xl">
                  {instructor.image}
                </div>
                <div className="flex flex-col gap-2">
                  {instructor.rating > 0 && <div className="flex items-center gap-2"><Star size={16} className="text-yellow-400" fill="currentColor" /><span className="text-sm font-semibold text-gray-900">{instructor.rating} Rating</span></div>}
                  {instructor.reviews > 0 && <div className="flex items-center gap-2"><BookOpen size={16} className="text-gray-600" /><span className="text-sm text-gray-700">{formatNumber(instructor.reviews)} Reviews</span></div>}
                  {instructor.students > 0 && <div className="flex items-center gap-2"><Users size={16} className="text-gray-600" /><span className="text-sm text-gray-700">{formatNumber(instructor.students)} Students</span></div>}
                  {instructor.courses > 0 && <div className="flex items-center gap-2"><Play size={16} className="text-gray-600" /><span className="text-sm text-gray-700">{instructor.courses} Courses</span></div>}
                </div>
              </div>
              {instructor.bio && (
                <div className="relative">
                  <div className={`text-gray-700 leading-relaxed text-base ${!showFullInstructorBio ? 'max-h-14 overflow-hidden' : ''}`}>
                    <p>{instructor.bio}</p>
                  </div>
                  {!showFullInstructorBio && <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />}
                </div>
              )}
              {instructor.bio && (
                <button onClick={() => setShowFullInstructorBio(!showFullInstructorBio)}
                  className="text-purple-600 hover:text-purple-700 mt-3 text-base font-semibold transition flex items-center gap-2 bg-transparent border-none cursor-pointer p-0">
                  <span style={{ fontSize:'24px', lineHeight:'1' }}>{showFullInstructorBio ? '⌃' : '⌄'}</span>
                  <span>{showFullInstructorBio ? 'Show less' : 'Show more'}</span>
                </button>
              )}
            </div>
            {/* Desktop */}
            <div className="hidden lg:grid lg:grid-cols-4 gap-8">
              <div className="lg:col-span-1 flex flex-col items-center lg:items-start">
                <div className="w-56 h-56 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-8xl mb-6">
                  {instructor.image}
                </div>
                <h3 className="font-bold text-gray-900 text-xl text-center lg:text-left">
                  <button onClick={() => handleNavigate('/instructor')} className="text-green-600 hover:text-green-700 bg-transparent border-none cursor-pointer p-0">
                    {instructor.name}
                  </button>
                </h3>
              </div>
              <div className="lg:col-span-3">
                <div className="mb-8 pb-8 border-b border-gray-200 grid grid-cols-2 lg:grid-cols-4 gap-6">
                  {instructor.rating > 0 && <div><div className="flex items-center gap-2 mb-2"><Star size={18} className="text-yellow-400" fill="currentColor" /><span className="font-bold text-gray-900 text-lg">{instructor.rating}</span></div><p className="text-sm text-gray-600">Rating</p></div>}
                  {instructor.reviews > 0 && <div><p className="font-bold text-gray-900 text-lg mb-2">{formatNumber(instructor.reviews)}</p><p className="text-sm text-gray-600">Reviews</p></div>}
                  {instructor.students > 0 && <div><p className="font-bold text-gray-900 text-lg mb-2">{formatNumber(instructor.students)}</p><p className="text-sm text-gray-600">Students</p></div>}
                  {instructor.courses > 0 && <div><p className="font-bold text-gray-900 text-lg mb-2">{instructor.courses}</p><p className="text-sm text-gray-600">Courses</p></div>}
                </div>
                {instructor.bio && <p className="text-gray-700 leading-relaxed text-base">{instructor.bio}</p>}
              </div>
            </div>
          </div>

          {/* REVIEWS */}
          {courseData.reviews_list?.length > 0 && (
            <div className="mb-16 py-12 border-t border-gray-200">
              <div className="mb-10 flex items-center gap-4">
                <Star size={32} className="text-yellow-400" fill="currentColor" />
                <span className="text-3xl font-bold text-gray-900">{courseData.rating}</span>
                <div>
                  <p className="text-gray-700 font-semibold">Course Rating</p>
                  <p className="text-sm text-gray-600">{formatNumber(courseData.reviews)} reviews</p>
                </div>
              </div>
              <div className="overflow-x-auto pb-4 -mx-4 px-4" style={{ scrollbarWidth: 'thin' }}>
                <div className="flex gap-6 min-w-min">
                  {courseData.reviews_list.map((review, idx) => (
                    <div key={idx} className="flex-shrink-0 w-80 lg:w-96 border border-gray-300 rounded-lg p-6 hover:shadow-md transition">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-bold text-gray-900 text-lg">{review.author}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex gap-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} size={16} className="text-yellow-400" fill={i < review.rating ? 'currentColor' : 'none'} />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      {review.verified && (
                        <div className="flex items-center gap-1 bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded inline-block mb-4">
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

          {/* STUDENTS ALSO BOUGHT - PUBLISHED COURSES ONLY */}
          {studentsBoughtCourses.length > 0 && (
            <div className="mb-16 py-12 border-t border-gray-200">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Students also bought</h2>
              <div className="overflow-x-auto pb-4 -mx-4 px-4" style={{ scrollbarWidth: 'thin' }}>
                <div className="flex gap-6 min-w-min">
                  {studentsBoughtCourses.map(course => (
                    <div key={course._id}
                      onClick={() => navigate(`/course/${course._id}`)}
                      className="flex-shrink-0 w-64 bg-white border border-gray-300 rounded-lg overflow-hidden hover:shadow-lg transition cursor-pointer">
                      <div className={`h-40 bg-gradient-to-br ${course.color || 'from-gray-300 to-gray-400'} flex items-center justify-center text-4xl`}>
                        {course.thumbnail
                          ? <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                          : course.emoji || '📚'}
                      </div>
                      <div className="p-4">
                        {course.bestseller && <span className="inline-block bg-yellow-400 text-black font-bold px-2 py-1 rounded text-xs mb-2">Bestseller</span>}
                        <h3 className="font-bold text-gray-900 text-base mb-3 line-clamp-2">{course.title}</h3>
                        <div className="flex items-center gap-1 mb-2">
                          <Star size={16} className="text-yellow-400" fill="currentColor" />
                          <span className="font-bold text-sm text-gray-900">{course.rating}</span>
                          <span className="text-xs text-gray-600">({formatNumber(course.reviews)})</span>
                        </div>
                        <p className="text-sm text-gray-600">{course.duration}</p>
                        <p className="text-base font-bold text-gray-900 mt-2">${course.price}</p>
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
      <footer className="bg-gray-900 text-gray-300 py-12 w-full">
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
                    <li key={link}><button onClick={() => handleNavigate('/')} className="hover:text-white transition bg-transparent border-none cursor-pointer text-gray-300 p-0">{link}</button></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-700 pt-8">
            <p className="text-sm text-gray-400">© 2024 Courseify. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* STICKY BOTTOM BAR - MOBILE */}
      <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-white border-t border-gray-300 p-4 z-50 flex items-center justify-between gap-4 w-full">
        <div className="flex flex-col">
          <span className="text-2xl font-bold text-gray-900">${courseData.price}</span>
          {courseData.originalPrice > courseData.price && (
            <span className="text-sm text-gray-600 line-through">${courseData.originalPrice}</span>
          )}
        </div>
        <button onClick={() => handleNavigate('/auth/register')}
          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg transition text-base border-none cursor-pointer">
          Add to cart
        </button>
      </div>

      {/* STICKY BOTTOM BAR - DESKTOP */}
      <div className="hidden lg:block fixed bottom-0 left-0 right-0 bg-white border-t border-gray-300 p-6 z-50 w-full">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold text-gray-900">${courseData.price}</span>
            {courseData.originalPrice > courseData.price && (
              <span className="text-lg text-gray-600 line-through">${courseData.originalPrice}</span>
            )}
          </div>
          <button onClick={() => handleNavigate('/auth/register')}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-12 rounded-lg transition text-lg border-none cursor-pointer">
            Add to cart
          </button>
        </div>
      </div>

      <div className="h-24 lg:h-28" />
    </div>
  );
}
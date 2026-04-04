import React, { useState } from 'react';
import { ChevronDown, Play, Star, Users, Clock, BookOpen, Zap, Menu, X, Search, User, ChevronRight } from 'lucide-react';

export default function CourseLandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState([0]);
  const [videoCarouselIndex, setVideoCarouselIndex] = useState(0);
  const [imageCarouselIndex, setImageCarouselIndex] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);

  const courseData = {
    title: 'Complete Web Development Bootcamp 2024',
    subtitle: 'Master HTML, CSS, JavaScript, React, and Node.js from scratch',
    rating: 4.8,
    reviews: 150232,
    students: 89234,
    price: 99.99,
    originalPrice: 499.99,
    language: 'English',
    lastUpdated: 'January 2024',
    instructor: {
      name: 'Sarah Anderson',
      rating: 4.9,
      reviews: 45678,
      students: 234567,
      courses: 12,
      bio: 'Senior Full-Stack Developer with 10+ years of experience. I\'ve helped over 200,000 students launch their coding careers.',
      image: '👩‍💼'
    },
    learningOutcomes: [
      'Build fully functional web applications from scratch',
      'Master JavaScript ES6+ features and async programming',
      'Create responsive designs with CSS Grid and Flexbox',
      'Build backend APIs with Node.js and Express',
      'Deploy applications to production',
      'Implement user authentication and security'
    ],
    courseIncludes: [
      { icon: Clock, text: '45 hours of on-demand video' },
      { icon: BookOpen, text: '200+ coding exercises' },
      { icon: Zap, text: '5 real-world projects' },
      { icon: User, text: 'Lifetime access' }
    ],
    sections: [
      {
        title: 'Section 1: HTML Fundamentals',
        lectures: 12,
        duration: '3h 45m',
        lectures_list: [
          { id: 1, title: 'Introduction to HTML', duration: '15m', type: 'video', preview: true },
          { id: 2, title: 'HTML5 Semantic Elements', duration: '22m', type: 'video', preview: false },
          { id: 3, title: 'HTML Quiz #1', duration: '5m', type: 'quiz', preview: false }
        ]
      },
      {
        title: 'Section 2: CSS Mastery',
        lectures: 18,
        duration: '6h 20m',
        lectures_list: [
          { id: 4, title: 'CSS Selectors & Specificity', duration: '28m', type: 'video', preview: true },
          { id: 5, title: 'Flexbox Complete Guide', duration: '45m', type: 'video', preview: false },
          { id: 6, title: 'CSS Grid Layout', duration: '38m', type: 'video', preview: false }
        ]
      },
      {
        title: 'Section 3: JavaScript Basics',
        lectures: 24,
        duration: '8h 15m',
        lectures_list: [
          { id: 7, title: 'JavaScript Variables & Types', duration: '35m', type: 'video', preview: true },
          { id: 8, title: 'Functions & Scope', duration: '42m', type: 'video', preview: false },
          { id: 9, title: 'JavaScript Quiz #2', duration: '10m', type: 'quiz', preview: false }
        ]
      }
    ],
    requirements: [
      'A computer with internet connection',
      'Basic understanding of how websites work',
      'Text editor (VS Code recommended)',
      'Willingness to practice and build projects'
    ],
    description: 'This comprehensive bootcamp will transform you into a full-stack web developer. Through hands-on projects, you\'ll build real applications while learning best practices and industry standards. Whether you\'re starting from zero or transitioning careers, this course provides everything you need to succeed in web development.',
    reviews_list: [
      { author: 'John Smith', rating: 5, text: 'Absolutely incredible course! Sarah explains everything clearly and the projects were really helpful.', verified: true },
      { author: 'Emma Johnson', rating: 5, text: 'Best investment I\'ve made. Got my first developer job 3 months after completing this course.', verified: true },
      { author: 'Michael Chen', rating: 4, text: 'Great content and structure. The pacing is just right for beginners.', verified: true }
    ]
  };

  const videoReviews = [
    { id: 1, name: 'Alex Rivera', thumbnail: '🎥' },
    { id: 2, name: 'Jordan Lee', thumbnail: '🎥' },
    { id: 3, name: 'Sam Wilson', thumbnail: '🎥' },
    { id: 4, name: 'Casey Brown', thumbnail: '🎥' }
  ];

  const imageGallery = [
    { id: 1, image: '📸' },
    { id: 2, image: '📸' },
    { id: 3, image: '📸' },
    { id: 4, image: '📸' },
    { id: 5, image: '📸' }
  ];

  // Shared style to make buttons look like links
  const linkStyle = "bg-transparent border-none p-0 cursor-pointer underline";

  return (
    <div className="min-h-screen bg-white">
      {/* ANNOUNCEMENT BAR */}
      <div className="bg-amber-50 text-center py-3 px-4">
        <p className="text-sm font-medium text-gray-800">
          🎉 Limited time: Get this course for $99 (80% off). Enroll now!
        </p>
      </div>

      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <button className="lg:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <div className="absolute left-1/2 transform -translate-x-1/2 lg:relative lg:left-auto lg:transform-none">
            <h1 className="text-2xl font-bold text-gray-900">Courseify</h1>
          </div>

          <nav className="hidden lg:flex items-center gap-8 flex-1 ml-12">
            <button className="text-gray-700 hover:text-gray-900 transition bg-transparent border-none cursor-pointer">Categories</button>
            <button className="text-gray-700 hover:text-gray-900 transition bg-transparent border-none cursor-pointer">Instructor</button>
            <button className="text-gray-700 hover:text-gray-900 transition bg-transparent border-none cursor-pointer">About</button>
          </nav>

          <div className="flex items-center gap-3">
            <Search className="hidden lg:block text-gray-400 cursor-pointer" size={20} />
            <button className="hidden lg:block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition font-medium">
              Login
            </button>
            <button className="hidden lg:block px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition font-medium">
              Sign Up
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white p-4 space-y-3">
            <button className="block text-gray-700 hover:text-gray-900 bg-transparent border-none cursor-pointer w-full text-left">Categories</button>
            <button className="block text-gray-700 hover:text-gray-900 bg-transparent border-none cursor-pointer w-full text-left">Instructor</button>
            <button className="block text-gray-700 hover:text-gray-900 bg-transparent border-none cursor-pointer w-full text-left">About</button>
            <button className="w-full text-left py-2 text-gray-700">Login</button>
            <button className="w-full text-left py-2 text-gray-700">Sign Up</button>
          </div>
        )}
      </header>

      {/* BREADCRUMB */}
      <div className="max-w-7xl mx-auto px-4 py-3 text-sm text-gray-600">
        <span>Development</span>
        <span className="mx-2">›</span>
        <span>Web Development</span>
        <span className="mx-2">›</span>
        <span className="text-gray-900 font-medium">Complete Web Development Bootcamp</span>
      </div>

      {/* BLACK HERO SECTION - COURSE PREVIEW */}
      <section className="w-full bg-black text-white py-8 lg:py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 lg:gap-8">
            <div className="lg:col-span-1">
              <div className="relative bg-gray-800 rounded-xl overflow-hidden aspect-video flex items-center justify-center cursor-pointer hover:bg-gray-700 transition group">
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/40 to-transparent">
                  <button className="bg-white text-black p-5 rounded-full hover:bg-gray-100 transition transform group-hover:scale-110 duration-200 shadow-lg">
                    <Play size={40} fill="currentColor" />
                  </button>
                </div>
              </div>
              <p className="text-gray-400 text-sm mt-4">Preview this course</p>
            </div>
          </div>
        </div>
      </section>

      {/* BLACK SECTION - COURSE INFORMATION */}
      <section className="w-full bg-black text-white py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-4">
            <span className="inline-block bg-yellow-400 text-black font-bold px-4 py-2 rounded-full text-sm">
              Bestseller
            </span>
          </div>

          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
            {courseData.title}
          </h1>

          <p className="text-xl text-gray-300 mb-8 leading-relaxed max-w-3xl">
            {courseData.subtitle}
          </p>

          <div className="flex flex-wrap items-center gap-6 mb-8">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Star size={22} className="text-yellow-400" fill="currentColor" />
                <span className="text-3xl font-bold text-white">{courseData.rating}</span>
              </div>
              <div>
                <p className="text-gray-300 font-semibold">({courseData.reviews.toLocaleString()} ratings)</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <Users size={20} />
              <span className="font-semibold">{courseData.students.toLocaleString()} students</span>
            </div>
          </div>

          <div className="mb-8">
            <p className="text-gray-400">
              Created by{' '}
              <button className={`text-green-400 hover:text-green-300 font-semibold ${linkStyle}`}>
                {courseData.instructor.name}
              </button>
            </p>
          </div>

          <div className="flex flex-wrap gap-6 text-gray-400 text-sm border-t border-gray-800 pt-8">
            <div className="flex items-center gap-2">
              <Clock size={18} />
              <span>Last updated {courseData.lastUpdated}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🌐</span>
              <span>{courseData.language}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>📝</span>
              <span>English, Spanish [+2]</span>
            </div>
          </div>
        </div>
      </section>

      {/* WHITE SECTION */}
      <section className="w-full bg-white py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4">
          {/* WHAT YOU WILL LEARN */}
          <div className="mb-16">
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-8">What you'll learn</h2>
            <div className="border border-gray-300 rounded-lg p-6 lg:p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {courseData.learningOutcomes.map((outcome, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="flex-shrink-0">
                      <Zap size={20} className="text-purple-600 mt-1" />
                    </div>
                    <p className="text-gray-700">{outcome}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* THIS COURSE INCLUDES */}
          <div className="mb-16">
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-8">This course includes</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {courseData.courseIncludes.map((item, idx) => {
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

          {/* COURSE CONTENT HEADER */}
          <div className="mb-8">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Course content</h2>
            <div className="flex flex-wrap gap-3 text-gray-700 lg:text-lg font-semibold">
              <span>{courseData.sections.length} sections</span>
              <span>•</span>
              <span>{courseData.sections.reduce((acc, s) => acc + s.lectures, 0)} lectures</span>
              <span>•</span>
              <span>18h 20m total duration</span>
            </div>
          </div>

          {/* COURSE CONTENT ACCORDION */}
          <div className="space-y-2 mb-16">
            {courseData.sections.map((section, idx) => {
              const isExpanded = expandedSection.includes(idx);
              return (
                <div key={idx} className="border border-gray-300 rounded-lg overflow-hidden">
                  <button
                    onClick={() => {
                      if (isExpanded) {
                        setExpandedSection(expandedSection.filter(i => i !== idx));
                      } else {
                        setExpandedSection([idx]);
                      }
                    }}
                    className="w-full px-5 py-3 flex items-center justify-between bg-white hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center gap-3 flex-1 text-left">
                      <ChevronDown
                        size={20}
                        className={`text-gray-600 transition flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{section.title}</h3>
                        <p className="text-xs text-gray-600">{section.lectures} lectures • {section.duration}</p>
                      </div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-gray-200 bg-gray-50">
                      {section.lectures_list.map((lecture, lectureIdx) => (
                        <div
                          key={lectureIdx}
                          className="px-5 py-3 border-b border-gray-200 last:border-b-0 flex items-center justify-between hover:bg-white transition"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-gray-600">
                              {lecture.type === 'video' ? (
                                <Play size={16} fill="currentColor" className="text-gray-600" />
                              ) : (
                                <span>✓</span>
                              )}
                            </span>
                            <div className="flex-1">
                              <p className="text-gray-900 text-sm font-medium">{lecture.title}</p>
                              <p className="text-xs text-gray-600">{lecture.duration}</p>
                            </div>
                          </div>
                          {lecture.preview && (
                            <button className="text-purple-600 font-bold text-xs cursor-pointer hover:text-purple-700 whitespace-nowrap ml-2 bg-transparent border-none">
                              Preview
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

          {/* REQUIREMENTS */}
          <div className="mb-16">
            <button
              onClick={() => setExpandedSection(expandedSection.includes('requirements') ? expandedSection.filter(i => i !== 'requirements') : [...expandedSection, 'requirements'])}
              className="w-full flex items-center justify-between py-4 border-b-2 border-gray-300 bg-white hover:bg-gray-50 transition"
            >
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">Requirements</h2>
              <ChevronDown
                size={28}
                className={`text-gray-600 transition flex-shrink-0 ${expandedSection.includes('requirements') ? 'rotate-180' : ''}`}
              />
            </button>
            {expandedSection.includes('requirements') && (
              <div className="py-6 space-y-4">
                <ul className="space-y-3">
                  {courseData.requirements.map((req, idx) => (
                    <li key={idx} className="flex gap-3 text-gray-700 text-lg">
                      <span className="text-purple-600 font-bold flex-shrink-0">•</span>
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* DESCRIPTION */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Description</h2>
            <p className={`text-gray-700 leading-relaxed text-base ${!showFullDescription ? 'line-clamp-3' : ''}`}>
              {courseData.description}
            </p>
            <button
              onClick={() => setShowFullDescription(!showFullDescription)}
              className="text-gray-700 hover:text-gray-900 mt-3 text-sm transition flex items-center gap-1 bg-transparent border-none cursor-pointer"
            >
              <span>{showFullDescription ? '▲' : '▼'}</span>
              <span className="text-xs">{showFullDescription ? 'Show less' : 'Show more'}</span>
            </button>
          </div>

          {/* INSTRUCTOR SECTION */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Instructor</h2>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <div className="lg:col-span-1">
                <div className="w-full lg:w-40 h-40 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-6xl mb-6">
                  {courseData.instructor.image}
                </div>
                <h3 className="font-bold text-gray-900 text-xl mb-2">
                  <button className={`text-green-600 hover:text-green-700 ${linkStyle}`}>
                    {courseData.instructor.name}
                  </button>
                </h3>
                <p className="text-gray-700 font-medium text-sm">Lead Instructor at London App Brewery</p>
              </div>

              <div className="lg:col-span-3">
                <div className="flex flex-wrap gap-6 mb-8 pb-8 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <Star size={18} className="text-yellow-400" fill="currentColor" />
                    <span className="font-bold text-gray-900">{courseData.instructor.rating}</span>
                    <span className="text-sm text-gray-600">Instructor Rating</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">👥</span>
                    <span className="font-bold text-gray-900">{courseData.instructor.reviews.toLocaleString()}</span>
                    <span className="text-sm text-gray-600">Reviews</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📚</span>
                    <span className="font-bold text-gray-900">{courseData.instructor.students.toLocaleString()}</span>
                    <span className="text-sm text-gray-600">Students</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🎓</span>
                    <span className="font-bold text-gray-900">{courseData.instructor.courses}</span>
                    <span className="text-sm text-gray-600">Courses</span>
                  </div>
                </div>
                <p className="text-gray-700 leading-relaxed text-base">{courseData.instructor.bio}</p>
              </div>
            </div>
          </div>

          {/* COURSE REVIEWS */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Student reviews</h2>
            <p className="text-gray-600 mb-8 text-lg">
              <span className="font-bold text-gray-900">{courseData.reviews.toLocaleString()}</span> reviews
            </p>
            <div className="relative bg-white rounded-lg p-8">
              <div className="flex items-center justify-between gap-4">
                <button
                  onClick={() => setVideoCarouselIndex((prev) => (prev - 1 + courseData.reviews_list.length) % courseData.reviews_list.length)}
                  className="p-2 hover:bg-gray-100 rounded-full transition flex-shrink-0 text-gray-600"
                >
                  ←
                </button>
                <div className="flex-1 overflow-hidden">
                  <div className="flex gap-6">
                    {courseData.reviews_list.map((review, idx) => (
                      <div
                        key={idx}
                        className={`flex-shrink-0 w-full transition-opacity duration-300 ${idx === videoCarouselIndex ? 'opacity-100' : 'hidden'}`}
                      >
                        <div className="bg-white rounded-lg p-8 border border-gray-300">
                          <div className="flex gap-1 mb-4">
                            {Array.from({ length: review.rating }).map((_, i) => (
                              <Star key={i} size={24} className="text-yellow-400" fill="currentColor" />
                            ))}
                          </div>
                          <p className="font-bold text-gray-900 mb-3 text-xl">{review.author}</p>
                          {review.verified && (
                            <div className="flex items-center gap-1 bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded inline-block mb-4">
                              <span>✓</span>
                              <span>Verified Purchase</span>
                            </div>
                          )}
                          <p className="text-gray-700 leading-relaxed text-base">{review.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => setVideoCarouselIndex((prev) => (prev + 1) % courseData.reviews_list.length)}
                  className="p-2 hover:bg-gray-100 rounded-full transition flex-shrink-0 text-gray-600"
                >
                  →
                </button>
              </div>
              <div className="flex justify-center gap-2 mt-8">
                {courseData.reviews_list.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setVideoCarouselIndex(idx)}
                    className={`w-2 h-2 rounded-full transition ${idx === videoCarouselIndex ? 'bg-purple-600' : 'bg-gray-300'}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* VIDEO REVIEW CAROUSEL */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Student testimonials</h2>
            <div className="flex items-center justify-center gap-6">
              <button
                onClick={() => setVideoCarouselIndex((prev) => (prev - 1 + videoReviews.length) % videoReviews.length)}
                className="p-3 hover:bg-gray-100 rounded-full transition text-gray-600"
              >
                ←
              </button>
              <div className="flex gap-6 overflow-hidden">
                {videoReviews.map((review, idx) => (
                  <div
                    key={idx}
                    className={`flex-shrink-0 w-80 h-56 bg-gray-300 rounded-lg flex items-center justify-center text-6xl transition transform ${
                      idx === videoCarouselIndex ? 'scale-100 opacity-100' : 'scale-75 opacity-50'
                    }`}
                  >
                    {review.thumbnail}
                  </div>
                ))}
              </div>
              <button
                onClick={() => setVideoCarouselIndex((prev) => (prev + 1) % videoReviews.length)}
                className="p-3 hover:bg-gray-100 rounded-full transition text-gray-600"
              >
                →
              </button>
            </div>
          </div>

          {/* IMAGE REVIEW CAROUSEL */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Project gallery</h2>
            <div className="flex items-center justify-center gap-6">
              <button
                onClick={() => setImageCarouselIndex((prev) => (prev - 1 + imageGallery.length) % imageGallery.length)}
                className="p-3 hover:bg-gray-100 rounded-full transition text-gray-600"
              >
                ←
              </button>
              <div className="flex gap-4 overflow-hidden">
                {imageGallery.map((item, idx) => (
                  <div
                    key={idx}
                    className={`flex-shrink-0 w-56 h-56 bg-gray-300 rounded-lg flex items-center justify-center text-5xl transition cursor-pointer ${
                      idx === imageCarouselIndex ? 'ring-4 ring-purple-600' : 'opacity-60'
                    }`}
                    onClick={() => setImageCarouselIndex(idx)}
                  >
                    {item.image}
                  </div>
                ))}
              </div>
              <button
                onClick={() => setImageCarouselIndex((prev) => (prev + 1) % imageGallery.length)}
                className="p-3 hover:bg-gray-100 rounded-full transition text-gray-600"
              >
                →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-white mb-4">Courseify</h3>
              <ul className="space-y-2 text-sm">
                <li><button className="hover:text-white transition bg-transparent border-none cursor-pointer text-gray-300">Press</button></li>
                <li><button className="hover:text-white transition bg-transparent border-none cursor-pointer text-gray-300">Contact</button></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-white mb-4">Instructors</h3>
              <ul className="space-y-2 text-sm">
                <li><button className="hover:text-white transition bg-transparent border-none cursor-pointer text-gray-300">Teach</button></li>
                <li><button className="hover:text-white transition bg-transparent border-none cursor-pointer text-gray-300">Resources</button></li>
                <li><button className="hover:text-white transition bg-transparent border-none cursor-pointer text-gray-300">Benefits</button></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-white mb-4">Learning</h3>
              <ul className="space-y-2 text-sm">
                <li><button className="hover:text-white transition bg-transparent border-none cursor-pointer text-gray-300">Categories</button></li>
                <li><button className="hover:text-white transition bg-transparent border-none cursor-pointer text-gray-300">Trending</button></li>
                <li><button className="hover:text-white transition bg-transparent border-none cursor-pointer text-gray-300">Collections</button></li>
                <li><button className="hover:text-white transition bg-transparent border-none cursor-pointer text-gray-300">About</button></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-white mb-4">Support</h3>
              <ul className="space-y-2 text-sm">
                <li><button className="hover:text-white transition bg-transparent border-none cursor-pointer text-gray-300">Help</button></li>
                <li><button className="hover:text-white transition bg-transparent border-none cursor-pointer text-gray-300">Support</button></li>
                <li><button className="hover:text-white transition bg-transparent border-none cursor-pointer text-gray-300">FAQ</button></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-white mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li><button className="hover:text-white transition bg-transparent border-none cursor-pointer text-gray-300">Privacy</button></li>
                <li><button className="hover:text-white transition bg-transparent border-none cursor-pointer text-gray-300">Terms</button></li>
                <li><button className="hover:text-white transition bg-transparent border-none cursor-pointer text-gray-300">Cookies</button></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-8">
            <p className="text-sm text-gray-400">© 2024 Courseify. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* STICKY ENROLL BUTTON - DESKTOP */}
      <div className="hidden lg:block fixed bottom-0 left-0 right-0 bg-white border-t border-gray-300 p-6 z-50">
        <div className="max-w-7xl mx-auto">
          <button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-5 rounded-lg transition text-xl">
            Enroll Now
          </button>
        </div>
      </div>

      {/* MOBILE STICKY CTA */}
      <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-white border-t border-gray-300 p-3 flex gap-3 z-50">
        <button className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-lg transition text-lg">
          Enroll Now
        </button>
      </div>
      <div className="h-20 lg:h-24" />
    </div>
  );
}
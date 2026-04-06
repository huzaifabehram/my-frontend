import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Play, Star, Users, Clock, BookOpen, Zap, Menu, X, Search } from 'lucide-react';

export default function CourseLandingPage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState([0]);
  const [videoCarouselIndex, setVideoCarouselIndex] = useState(0);
  const [imageCarouselIndex, setImageCarouselIndex] = useState(0);
  const [reviewCarouselIndex, setReviewCarouselIndex] = useState(0);
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
      { icon: Users, text: 'Lifetime access' }
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

  const studentsBoughtCourses = [
    { id: 1, title: 'Advanced React Patterns', rating: 4.7, students: '45K', duration: '32h', bestseller: true },
    { id: 2, title: 'Node.js & Express Mastery', rating: 4.6, students: '38K', duration: '28h', bestseller: false },
    { id: 3, title: 'Full Stack JavaScript', rating: 4.8, students: '52K', duration: '40h', bestseller: true },
    { id: 4, title: 'Web Design Fundamentals', rating: 4.5, students: '62K', duration: '24h', bestseller: false }
  ];

  const handleNavigate = (path) => {
    setMobileMenuOpen(false);
    navigate(path);
  };

  const handlePreviewClick = (lectureTitle) => {
    console.log('Previewing:', lectureTitle);
  };

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
          <button 
            className="lg:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <div className="absolute left-1/2 transform -translate-x-1/2 lg:relative lg:left-auto lg:transform-none">
            <button
              onClick={() => handleNavigate('/')}
              className="text-2xl font-bold text-gray-900 cursor-pointer hover:text-purple-600 transition bg-transparent border-none p-0"
            >
              Courseify
            </button>
          </div>

          <nav className="hidden lg:flex items-center gap-8 flex-1 ml-12">
            <button
              onClick={() => handleNavigate('/courses')}
              className="text-gray-700 hover:text-gray-900 transition bg-transparent border-none cursor-pointer p-0 font-medium"
            >
              Categories
            </button>
            <button
              onClick={() => handleNavigate('/instructor')}
              className="text-gray-700 hover:text-gray-900 transition bg-transparent border-none cursor-pointer p-0 font-medium"
            >
              Instructor
            </button>
            <button
              onClick={() => handleNavigate('/courses')}
              className="text-gray-700 hover:text-gray-900 transition bg-transparent border-none cursor-pointer p-0 font-medium"
            >
              About
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <Search className="hidden lg:block text-gray-400 cursor-pointer hover:text-gray-600 transition" size={20} />
            <button
              onClick={() => handleNavigate('/auth/login')}
              className="hidden lg:block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition font-medium bg-transparent border-none cursor-pointer"
            >
              Login
            </button>
            <button
              onClick={() => handleNavigate('/auth/register')}
              className="hidden lg:block px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition font-medium border-none cursor-pointer"
            >
              Sign Up
            </button>
            {/* MOBILE LOGIN BUTTON */}
            <button
              onClick={() => handleNavigate('/auth/login')}
              className="lg:hidden px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium border-none cursor-pointer text-sm"
            >
              Login
            </button>
          </div>
        </div>

        {/* MOBILE MENU - HALF SCREEN DARK */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 top-16 z-50 w-1/2 bg-gray-900 text-white p-4 space-y-3 h-screen overflow-y-auto">
            <button
              onClick={() => handleNavigate('/courses')}
              className="block text-white hover:text-gray-300 bg-transparent border-none cursor-pointer w-full text-left p-3 rounded hover:bg-gray-800 text-sm"
            >
              Categories
            </button>
            <button
              onClick={() => handleNavigate('/instructor')}
              className="block text-white hover:text-gray-300 bg-transparent border-none cursor-pointer w-full text-left p-3 rounded hover:bg-gray-800 text-sm"
            >
              Instructor
            </button>
            <button
              onClick={() => handleNavigate('/courses')}
              className="block text-white hover:text-gray-300 bg-transparent border-none cursor-pointer w-full text-left p-3 rounded hover:bg-gray-800 text-sm"
            >
              About
            </button>
            <div className="border-t border-gray-700 pt-3 mt-3">
              <button
                onClick={() => handleNavigate('/auth/register')}
                className="block text-white hover:text-gray-300 bg-transparent border-none cursor-pointer w-full text-left p-3 rounded hover:bg-gray-800 text-sm"
              >
                Sign Up
              </button>
            </div>
          </div>
        )}
      </header>

      {/* BREADCRUMB - SMALLER FONT */}
      <div className="max-w-7xl mx-auto px-4 py-2 text-xs text-gray-600">
        <button 
          onClick={() => handleNavigate('/')} 
          className="hover:underline bg-transparent border-none cursor-pointer text-gray-600 p-0"
        >
          Development
        </button>
        <span className="mx-1">›</span>
        <button 
          onClick={() => handleNavigate('/courses')} 
          className="hover:underline bg-transparent border-none cursor-pointer text-gray-600 p-0"
        >
          Web Development
        </button>
        <span className="mx-1">›</span>
        <span className="text-gray-900 font-medium">Complete Web Development Bootcamp</span>
      </div>

      {/* COURSE HEADER - ABOVE VIDEO PLAYER */}
      <section className="w-full bg-black text-white py-8 lg:py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-4 lg:mb-6">
            <span className="inline-block bg-yellow-400 text-black font-bold px-4 py-2 rounded-full text-xs lg:text-sm">
              Bestseller
            </span>
          </div>

          {/* COURSE TITLE - SMALLER */}
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-4 leading-tight">
            {courseData.title}
          </h1>

          {/* VIDEO PREVIEW PLAYER - POSITIONED HERE */}
          <div className="mb-6 lg:mb-8">
            <div className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video flex items-center justify-center cursor-pointer hover:bg-gray-700 transition group max-w-2xl">
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/40 to-transparent">
                <button 
                  className="bg-white text-black p-4 rounded-full hover:bg-gray-100 transition transform group-hover:scale-110 duration-200 shadow-lg border-none cursor-pointer"
                  aria-label="Play preview"
                >
                  <Play size={32} fill="currentColor" />
                </button>
              </div>
            </div>
            {/* PREVIEW TEXT BOX - SMALLER AND LIGHT GREY */}
            <div className="mt-3 inline-block bg-gray-200 rounded px-3 py-1.5">
              <p className="text-gray-800 font-medium text-xs">Preview this course</p>
            </div>
          </div>

          {/* COURSE SUBTITLE */}
          <p className="text-lg lg:text-xl text-gray-300 mb-6 leading-relaxed max-w-3xl">
            {courseData.subtitle}
          </p>

          <div className="flex flex-wrap items-center gap-6 mb-6">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Star size={22} className="text-yellow-400" fill="currentColor" />
                <span className="text-2xl lg:text-3xl font-bold text-white">{courseData.rating}</span>
              </div>
              <div>
                <p className="text-gray-300 font-semibold text-sm">({courseData.reviews.toLocaleString()} ratings)</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-300 text-sm">
              <Users size={18} />
              <span className="font-semibold">{courseData.students.toLocaleString()} students</span>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-gray-400 text-sm">
              Created by{' '}
              <button
                onClick={() => handleNavigate('/instructor')}
                className="text-green-400 hover:text-green-300 font-semibold bg-transparent border-none cursor-pointer p-0"
              >
                {courseData.instructor.name}
              </button>
            </p>
          </div>

          <div className="flex flex-wrap gap-4 lg:gap-6 text-gray-400 text-xs lg:text-sm border-t border-gray-800 pt-6">
            <div className="flex items-center gap-2">
              <Clock size={16} />
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

      {/* WHITE CONTENT SECTION */}
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
                    <p className="text-gray-700 text-sm lg:text-base">{outcome}</p>
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
                    <p className="text-xs lg:text-sm text-gray-700 font-medium">{item.text}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* COURSE CONTENT HEADER */}
          <div className="mb-8">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Course content</h2>
            <div className="flex flex-wrap gap-3 text-gray-700 text-sm lg:text-lg font-semibold">
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
                        setExpandedSection([...expandedSection, idx]);
                      }
                    }}
                    className="w-full px-5 py-4 flex items-center justify-between bg-white hover:bg-gray-50 transition border-none cursor-pointer"
                  >
                    <div className="flex items-center gap-3 flex-1 text-left">
                      <ChevronDown
                        size={20}
                        className={`text-gray-600 transition flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-sm lg:text-base">{section.title}</h3>
                        <p className="text-xs text-gray-600">{section.lectures} lectures • {section.duration}</p>
                      </div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-gray-200 bg-gray-50">
                      {section.lectures_list.map((lecture, lectureIdx) => (
                        <div
                          key={lectureIdx}
                          className="px-4 lg:px-6 py-3 lg:py-4 border-b border-gray-200 last:border-b-0 flex items-center justify-between hover:bg-white transition"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {/* PLAY BUTTON ICON */}
                            <div className="flex-shrink-0 w-6 h-6 border-2 border-gray-600 rounded-full flex items-center justify-center">
                              {lecture.type === 'video' ? (
                                <Play size={12} className="text-gray-600" fill="currentColor" />
                              ) : (
                                <span className="text-gray-600 text-xs font-bold">✓</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-gray-900 text-sm lg:text-base font-medium truncate">{lecture.title}</p>
                              <p className="text-xs text-gray-600">{lecture.duration}</p>
                            </div>
                          </div>
                          
                          {/* PREVIEW BUTTON */}
                          {lecture.preview && (
                            <button 
                              onClick={() => handlePreviewClick(lecture.title)}
                              className="text-purple-600 hover:text-purple-700 font-bold text-xs lg:text-sm cursor-pointer bg-transparent border-none whitespace-nowrap ml-3 transition p-0 flex items-center gap-1"
                            >
                              <Play size={12} fill="currentColor" />
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

          {/* REQUIREMENTS */}
          <div className="mb-16">
            <button
              onClick={() => setExpandedSection(expandedSection.includes('requirements') ? expandedSection.filter(i => i !== 'requirements') : [...expandedSection, 'requirements'])}
              className="w-full flex items-center justify-between py-4 border-b-2 border-gray-300 bg-white hover:bg-gray-50 transition border-none cursor-pointer p-0"
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
                    <li key={idx} className="flex gap-3 text-gray-700 text-base lg:text-lg">
                      <span className="text-purple-600 font-bold flex-shrink-0">•</span>
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* DESCRIPTION */}
          <div className="mb-16 py-12 border-t border-gray-200">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Description</h2>
            
            <div className={`text-gray-700 leading-relaxed text-sm lg:text-base space-y-4 ${!showFullDescription ? 'max-h-40 overflow-hidden' : ''}`}>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">What you'll learn</h3>
                <p className="text-gray-700">
                  {courseData.description}
                </p>
              </div>
              
              {showFullDescription && (
                <div className="space-y-4 pt-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Who this course is for</h3>
                    <p className="text-gray-700">
                      This course is designed for complete beginners who want to become professional web developers. Whether you're career switching or starting your coding journey, this comprehensive program will guide you step by step.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Course highlights</h3>
                    <p className="text-gray-700">
                      Learn from industry-leading instructors, build real-world projects, and get lifetime access to all course materials. You'll receive personalized feedback and have access to an active learning community.
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            <button
              onClick={() => setShowFullDescription(!showFullDescription)}
              className="text-purple-600 hover:text-purple-700 mt-4 text-xs lg:text-sm font-semibold transition flex items-center gap-2 bg-transparent border-none cursor-pointer p-0"
            >
              <span>{showFullDescription ? '▲ Show less' : '▼ Show more'}</span>
            </button>
          </div>

          {/* INSTRUCTOR SECTION */}
          <div className="mb-16 py-12 border-t border-gray-200">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <div className="lg:col-span-1 flex flex-col items-center lg:items-start">
                <div className="w-40 h-40 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-6xl mb-6">
                  {courseData.instructor.image}
                </div>
                <h3 className="font-bold text-gray-900 text-xl text-center lg:text-left">
                  <button
                    onClick={() => handleNavigate('/instructor')}
                    className="text-green-600 hover:text-green-700 bg-transparent border-none cursor-pointer p-0"
                  >
                    {courseData.instructor.name}
                  </button>
                </h3>
                <p className="text-gray-700 font-medium text-sm text-center lg:text-left mt-2">
                  Lead Instructor at London App Brewery
                </p>
              </div>

              <div className="lg:col-span-3">
                <div className="mb-8 pb-8 border-b border-gray-200">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Star size={18} className="text-yellow-400" fill="currentColor" />
                        <span className="font-bold text-gray-900 text-lg">{courseData.instructor.rating}</span>
                      </div>
                      <p className="text-xs lg:text-sm text-gray-600">Instructor Rating</p>
                    </div>

                    <div>
                      <p className="font-bold text-gray-900 text-lg mb-2">
                        {(courseData.instructor.reviews / 1000).toFixed(1)}K
                      </p>
                      <p className="text-xs lg:text-sm text-gray-600">Reviews</p>
                    </div>

                    <div>
                      <p className="font-bold text-gray-900 text-lg mb-2">
                        {(courseData.instructor.students / 1000000).toFixed(1)}M
                      </p>
                      <p className="text-xs lg:text-sm text-gray-600">Students</p>
                    </div>

                    <div>
                      <p className="font-bold text-gray-900 text-lg mb-2">{courseData.instructor.courses}</p>
                      <p className="text-xs lg:text-sm text-gray-600">Courses</p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-gray-700 leading-relaxed text-sm lg:text-base">{courseData.instructor.bio}</p>
                </div>
              </div>
            </div>
          </div>

          {/* COURSE REVIEWS - CAROUSEL SLIDER */}
          <div className="mb-16 py-12 border-t border-gray-200">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Student reviews</h2>
            
            <div className="flex items-center justify-between gap-4">
              <button
                onClick={() => setReviewCarouselIndex((prev) => (prev - 1 + courseData.reviews_list.length) % courseData.reviews_list.length)}
                className="p-2 hover:bg-gray-100 rounded-full transition text-gray-600 bg-transparent border-none cursor-pointer flex-shrink-0"
              >
                ←
              </button>

              <div className="flex-1 overflow-hidden">
                <div className="flex gap-6">
                  {courseData.reviews_list.map((review, idx) => (
                    <div
                      key={idx}
                      className={`flex-shrink-0 w-full transition-opacity duration-300 ${
                        idx === reviewCarouselIndex ? 'opacity-100' : 'hidden'
                      }`}
                    >
                      <div className="border border-gray-300 rounded-lg p-6 hover:shadow-md transition">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="font-bold text-gray-900 text-lg">{review.author}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex gap-0.5">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    size={16}
                                    className="text-yellow-400"
                                    fill={i < review.rating ? 'currentColor' : 'none'}
                                  />
                                ))}
                              </div>
                              <span className="text-xs text-gray-600">2 months ago</span>
                            </div>
                          </div>
                          <button
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition bg-transparent border-none cursor-pointer text-lg"
                            aria-label="More options"
                          >
                            ⋮
                          </button>
                        </div>

                        {review.verified && (
                          <div className="flex items-center gap-1 bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded inline-block mb-4">
                            <span>✓</span>
                            <span>Verified Purchase</span>
                          </div>
                        )}

                        <p className="text-gray-700 leading-relaxed mb-4 text-sm">{review.text}</p>

                        <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
                          <button className="flex items-center gap-1 text-gray-600 hover:text-gray-900 text-xs bg-transparent border-none cursor-pointer transition p-0">
                            <span>👍</span>
                            <span>Helpful</span>
                          </button>
                          <button className="flex items-center gap-1 text-gray-600 hover:text-gray-900 text-xs bg-transparent border-none cursor-pointer transition p-0">
                            <span>👎</span>
                            <span>Not helpful</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setReviewCarouselIndex((prev) => (prev + 1) % courseData.reviews_list.length)}
                className="p-2 hover:bg-gray-100 rounded-full transition text-gray-600 bg-transparent border-none cursor-pointer flex-shrink-0"
              >
                →
              </button>
            </div>

            <div className="flex justify-center gap-2 mt-6">
              {courseData.reviews_list.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setReviewCarouselIndex(idx)}
                  className={`w-2 h-2 rounded-full transition bg-transparent border-none cursor-pointer ${
                    idx === reviewCarouselIndex ? 'bg-purple-600' : 'bg-gray-300'
                  }`}
                  aria-label={`Go to review ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* STUDENTS ALSO BOUGHT */}
          <div className="mb-16 py-12 border-t border-gray-200">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Students also bought</h2>
            
            <div className="flex gap-6 overflow-x-auto pb-4 -mx-4 px-4 scroll-smooth">
              {studentsBoughtCourses.map(course => (
                <div key={course.id} className="flex-shrink-0 w-64 bg-white border border-gray-300 rounded-lg overflow-hidden hover:shadow-lg transition cursor-pointer">
                  <div className="bg-gradient-to-br from-gray-300 to-gray-400 h-40 flex items-center justify-center text-4xl">
                    📚
                  </div>
                  <div className="p-4">
                    {course.bestseller && (
                      <span className="inline-block bg-yellow-400 text-black font-bold px-2 py-1 rounded text-xs mb-2">
                        Bestseller
                      </span>
                    )}
                    <h3 className="font-bold text-gray-900 text-base mb-3 line-clamp-2">{course.title}</h3>
                    
                    <div className="flex items-center gap-1 mb-2">
                      <Star size={16} className="text-yellow-400" fill="currentColor" />
                      <span className="font-bold text-sm text-gray-900">{course.rating}</span>
                      <span className="text-xs text-gray-600">({course.students})</span>
                    </div>
                    
                    <p className="text-sm text-gray-600">{course.duration}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* VIDEO TESTIMONIALS */}
          <div className="mb-16 py-12 border-t border-gray-200">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Student testimonials</h2>
            
            <div className="relative">
              <div className="flex gap-6 overflow-x-auto pb-4 -mx-4 px-4 scroll-smooth">
                {videoReviews.map((review, idx) => (
                  <div
                    key={idx}
                    className="flex-shrink-0 w-96 h-64 bg-gray-300 rounded-lg flex items-center justify-center text-6xl cursor-pointer hover:shadow-lg transition"
                  >
                    {review.thumbnail}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-center gap-2 mt-6">
              {videoReviews.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setVideoCarouselIndex(idx)}
                  className={`w-3 h-3 rounded-full transition bg-transparent border-none cursor-pointer ${idx === videoCarouselIndex ? 'bg-purple-600' : 'bg-gray-300'}`}
                  aria-label={`Go to video ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* PROJECT GALLERY */}
          <div className="mb-16 py-12 border-t border-gray-200">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Project gallery</h2>
            
            <div className="relative">
              <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scroll-smooth">
                {imageGallery.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => setImageCarouselIndex(idx)}
                    className={`flex-shrink-0 w-64 h-64 bg-gray-300 rounded-lg flex items-center justify-center text-5xl cursor-pointer transition ${
                      idx === imageCarouselIndex ? 'ring-4 ring-purple-600' : 'hover:shadow-lg'
                    }`}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setImageCarouselIndex(idx);
                      }
                    }}
                    aria-label={`Select image ${idx + 1}`}
                  >
                    {item.image}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-white mb-4 text-sm">Courseify</h3>
              <ul className="space-y-2 text-xs">
                <li><button onClick={() => handleNavigate('/')} className="hover:text-white transition bg-transparent border-none cursor-pointer text-gray-300 p-0">Press</button></li>
                <li><button onClick={() => handleNavigate('/')} className="hover:text-white transition bg-transparent border-none cursor-pointer text-gray-300 p-0">Contact</button></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-white mb-4 text-sm">Instructors</h3>
              <ul className="space-y-2 text-xs">
                <li><button onClick={() => handleNavigate('/instructor')} className="hover:text-white transition bg-transparent border-none cursor-pointer text-gray-300 p-0">Teach</button></li>
                <li><button onClick={() => handleNavigate('/instructor')} className="hover:text-white transition bg-transparent border-none cursor-pointer text-gray-300 p-0">Resources</button></li>
                <li><button onClick={() => handleNavigate('/instructor')} className="hover:text-white transition bg-transparent border-none cursor-pointer text-gray-300 p-0">Benefits</button></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-white mb-4 text-sm">Learning</h3>
              <ul className="space-y-2 text-xs">
                <li><button onClick={() => handleNavigate('/courses')} className="hover:text-white transition bg-transparent border-none cursor-pointer text-gray-300 p-0">Categories</button></li>
                <li><button onClick={() => handleNavigate('/courses')} className="hover:text-white transition bg-transparent border-none cursor-pointer text-gray-300 p-0">Trending</button></li>
                <li><button onClick={() => handleNavigate('/courses')} className="hover:text-white transition bg-transparent border-none cursor-pointer text-gray-300 p-0">Collections</button></li>
                <li><button onClick={() => handleNavigate('/')} className="hover:text-white transition bg-transparent border-none cursor-pointer text-gray-300 p-0">About</button></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-white mb-4 text-sm">Support</h3>
              <ul className="space-y-2 text-xs">
                <li><button onClick={() => handleNavigate('/')} className="hover:text-white transition bg-transparent border-none cursor-pointer text-gray-300 p-0">Help</button></li>
                <li><button onClick={() => handleNavigate('/')} className="hover:text-white transition bg-transparent border-none cursor-pointer text-gray-300 p-0">Support</button></li>
                <li><button onClick={() => handleNavigate('/')} className="hover:text-white transition bg-transparent border-none cursor-pointer text-gray-300 p-0">FAQ</button></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-white mb-4 text-sm">Legal</h3>
              <ul className="space-y-2 text-xs">
                <li><button onClick={() => handleNavigate('/')} className="hover:text-white transition bg-transparent border-none cursor-pointer text-gray-300 p-0">Privacy</button></li>
                <li><button onClick={() => handleNavigate('/')} className="hover:text-white transition bg-transparent border-none cursor-pointer text-gray-300 p-0">Terms</button></li>
                <li><button onClick={() => handleNavigate('/')} className="hover:text-white transition bg-transparent border-none cursor-pointer text-gray-300 p-0">Cookies</button></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-8">
            <p className="text-xs text-gray-400">© 2024 Courseify. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* STICKY BOTTOM BAR - MOBILE */}
      <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-white border-t border-gray-300 p-4 z-50 flex items-center justify-between gap-4">
        <div className="flex flex-col">
          <span className="text-2xl font-bold text-gray-900">${courseData.price}</span>
          <span className="text-xs text-gray-600 line-through">${courseData.originalPrice}</span>
        </div>
        <button
          onClick={() => handleNavigate('/auth/register')}
          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg transition text-base border-none cursor-pointer"
        >
          Add to cart
        </button>
      </div>

      {/* STICKY BOTTOM BAR - DESKTOP */}
      <div className="hidden lg:block fixed bottom-0 left-0 right-0 bg-white border-t border-gray-300 p-6 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold text-gray-900">${courseData.price}</span>
            <span className="text-lg text-gray-600 line-through">${courseData.originalPrice}</span>
          </div>
          <button
            onClick={() => handleNavigate('/auth/register')}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-12 rounded-lg transition text-lg border-none cursor-pointer"
          >
            Add to cart
          </button>
        </div>
      </div>

      {/* Bottom padding to prevent content from being hidden under sticky bar */}
      <div className="h-24 lg:h-28" />
    </div>
  );
}
import React, { useState } from 'react';
import { 
  ChevronDown, ChevronRight, Star, Users, Clock, Globe,
  Play, CheckCircle, BarChart3, FileText, Zap, Menu, Search, LogIn,
  ChevronLeft, ChevronRightIcon
} from 'lucide-react';

export default function CourseLandingPage() {
  const [expandedSection, setExpandedSection] = useState(0);
  const [expandedRequirements, setExpandedRequirements] = useState(false);
  const [expandedDescription, setExpandedDescription] = useState(false);
  const [videoCarouselIndex, setVideoCarouselIndex] = useState(0);
  const [imageCarouselIndex, setImageCarouselIndex] = useState(0);

  // Mock data
  const courseSections = [
    {
      id: 1,
      title: 'Getting Started',
      lectures: [
        { id: 1, title: 'Course Introduction', duration: '5:32', isFree: true },
        { id: 2, title: 'What You Need to Know', duration: '8:15', isFree: true },
        { id: 3, title: 'Setting Up Your Environment', duration: '12:45', isFree: false },
      ],
    },
    {
      id: 2,
      title: 'Core Concepts',
      lectures: [
        { id: 4, title: 'Understanding Fundamentals', duration: '15:20', isFree: false },
        { id: 5, title: 'Deep Dive into Theory', duration: '22:10', isFree: false },
        { id: 6, title: 'Practical Applications', duration: '18:05', isFree: false },
      ],
    },
    {
      id: 3,
      title: 'Advanced Techniques',
      lectures: [
        { id: 7, title: 'Pro Tips and Tricks', duration: '12:30', isFree: false },
        { id: 8, title: 'Real-World Projects', duration: '45:20', isFree: false },
      ],
    },
  ];

  const reviews = [
    { id: 1, author: 'Sarah Johnson', rating: 5, text: 'Outstanding course! Clear explanations and practical examples.', image: '👩‍💼' },
    { id: 2, author: 'Michael Chen', rating: 5, text: 'Best investment for my career. Highly recommended!', image: '👨‍💻' },
    { id: 3, author: 'Emma Davis', rating: 4.5, text: 'Great content with hands-on projects.', image: '👩‍🎓' },
  ];

  const videoReviews = [
    { id: 1, title: 'Student Success Story', thumbnail: '🎬' },
    { id: 2, title: 'Course Overview', thumbnail: '📹' },
    { id: 3, title: 'Student Testimonial', thumbnail: '🎥' },
  ];

  const imageReviews = [
    { id: 1, title: 'Project Showcase', image: '🖼️' },
    { id: 2, title: 'Certificate Examples', image: '📜' },
    { id: 3, title: 'Student Work', image: '🎨' },
  ];

  const toggleSection = (id) => {
    setExpandedSection(expandedSection === id ? null : id);
  };

  const nextVideoCarousel = () => {
    setVideoCarouselIndex((prev) => (prev + 1) % videoReviews.length);
  };

  const prevVideoCarousel = () => {
    setVideoCarouselIndex((prev) => (prev - 1 + videoReviews.length) % videoReviews.length);
  };

  const nextImageCarousel = () => {
    setImageCarouselIndex((prev) => (prev + 1) % imageReviews.length);
  };

  const prevImageCarousel = () => {
    setImageCarouselIndex((prev) => (prev - 1 + imageReviews.length) % imageReviews.length);
  };

  return (
    <div className="bg-white overflow-x-hidden">
      {/* 1. ANNOUNCEMENT BAR */}
      <div className="w-full bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <p className="text-center text-sm font-medium text-amber-900">
            🎉 Limited Time: Get 50% off with code LAUNCH50 - Offer ends in 2 days
          </p>
        </div>
      </div>

      {/* 2. HEADER */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Menu Icon */}
            <button className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition">
              <Menu size={24} className="text-gray-700" />
            </button>

            {/* Center: Logo */}
            <div className="flex-1 lg:flex-none flex justify-center lg:justify-start ml-0 lg:ml-0">
              <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Edu
              </div>
            </div>

            {/* Right: Search, Login */}
            <div className="flex items-center gap-4">
              <button className="hidden md:flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full hover:bg-gray-200 transition">
                <Search size={18} className="text-gray-500" />
                <span className="text-sm text-gray-500">Search</span>
              </button>
              <button className="p-2 md:hidden hover:bg-gray-100 rounded-lg transition">
                <Search size={20} className="text-gray-700" />
              </button>
              <button className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition font-medium">
                <LogIn size={18} />
                <span>Log in</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 3. BREADCRUMB */}
      <div className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Development</span>
            <ChevronRight size={16} />
            <span>Web Development</span>
            <ChevronRight size={16} />
            <span className="text-gray-900 font-medium">The Complete React Course</span>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT CONTAINER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT COLUMN - Main Content */}
          <div className="lg:col-span-2">
            {/* 4. COURSE PREVIEW SECTION */}
            <div className="mb-10">
              <div className="relative bg-gradient-to-br from-slate-700 to-slate-900 rounded-lg overflow-hidden aspect-video flex items-center justify-center group cursor-pointer">
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition duration-300" />
                <div className="relative flex flex-col items-center gap-3 z-10">
                  <button className="w-16 h-16 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition transform group-hover:scale-110 duration-300 shadow-lg">
                    <Play size={28} className="text-blue-600 ml-1" />
                  </button>
                  <p className="text-white font-medium text-sm">Preview this course</p>
                </div>
              </div>
            </div>

            {/* 5. COURSE INFORMATION */}
            <div className="mb-10">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
                The Complete React Mastery Course 2024
              </h1>
              <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                Learn React from scratch and build production-ready applications. Master hooks, state management, routing, and modern JavaScript patterns.
              </p>

              {/* Metadata */}
              <div className="flex flex-wrap gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Last updated</span>
                  <span className="font-medium text-gray-900">December 2024</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe size={16} className="text-gray-400" />
                  <span className="font-medium text-gray-900">English</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={16} className={i < 4 ? 'fill-amber-400 text-amber-400' : 'fill-gray-300 text-gray-300'} />
                    ))}
                  </div>
                  <span className="text-gray-600">(4.8) 12,543 ratings</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-gray-400" />
                  <span className="font-medium text-gray-900">245K students</span>
                </div>
              </div>
            </div>

            {/* 6. WHAT YOU WILL LEARN */}
            <div className="mb-10 p-6 border border-gray-200 rounded-lg bg-gray-50">
              <h2 className="text-xl font-bold text-gray-900 mb-6">What you will learn</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  'Master React fundamentals and advanced patterns',
                  'Build modern, responsive user interfaces',
                  'Work with React Hooks and custom hooks',
                  'Manage state with Redux and Context API',
                  'Implement routing and navigation',
                  'Connect to APIs and handle async operations',
                ].map((item, i) => (
                  <div key={i} className="flex gap-3">
                    <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 7. THIS COURSE INCLUDES */}
            <div className="mb-10 py-6 border-t border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6">This course includes</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex gap-3">
                  <Clock size={20} className="text-blue-600 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">42 hours</p>
                    <p className="text-sm text-gray-600">on-demand video</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <FileText size={20} className="text-blue-600 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">24 articles</p>
                    <p className="text-sm text-gray-600">downloadable resources</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Zap size={20} className="text-blue-600 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">Lifetime access</p>
                    <p className="text-sm text-gray-600">on all devices</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 8. COURSE CONTENT HEADER */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Course content</h2>
              <p className="text-gray-600">
                <span className="font-medium">{courseSections.length} sections</span>
                {' •  '}
                <span className="font-medium">
                  {courseSections.reduce((acc, sec) => acc + sec.lectures.length, 0)} lectures
                </span>
                {' •  '}
                <span className="font-medium">42h 15m total duration</span>
              </p>
            </div>

            {/* 9. COURSE CONTENT ACCORDION */}
            <div className="mb-10 border border-gray-200 rounded-lg overflow-hidden">
              {courseSections.map((section) => (
                <div key={section.id} className="border-b border-gray-200 last:border-b-0">
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition duration-200"
                  >
                    <div className="flex items-center gap-4 flex-1 text-left">
                      <ChevronDown
                        size={20}
                        className={`text-gray-600 transition-transform duration-300 ${
                          expandedSection === section.id ? 'rotate-180' : ''
                        }`}
                      />
                      <div>
                        <h3 className="font-semibold text-gray-900">{section.title}</h3>
                        <p className="text-sm text-gray-600">{section.lectures.length} lectures</p>
                      </div>
                    </div>
                  </button>

                  {expandedSection === section.id && (
                    <div className="bg-gray-50 border-t border-gray-200">
                      {section.lectures.map((lecture, idx) => (
                        <div
                          key={lecture.id}
                          className="px-6 py-4 border-t border-gray-200 first:border-t-0 flex items-center justify-between hover:bg-gray-100 transition group"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <FileText size={16} className="text-gray-400" />
                            <div className="flex-1">
                              <p className="text-gray-900 font-medium">{lecture.title}</p>
                            </div>
                            {lecture.isFree && (
                              <span className="text-purple-600 font-medium text-sm ml-2">Preview</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-600">{lecture.duration}</span>
                            <Play size={16} className="text-gray-400 group-hover:text-blue-600 transition" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* 10. REQUIREMENTS SECTION */}
            <div className="mb-10">
              <button
                onClick={() => setExpandedRequirements(!expandedRequirements)}
                className="w-full py-4 flex items-center justify-between text-left font-semibold text-gray-900 text-lg hover:text-blue-600 transition"
              >
                <span>Requirements</span>
                <ChevronDown
                  size={20}
                  className={`transition-transform duration-300 ${
                    expandedRequirements ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {expandedRequirements && (
                <div className="p-6 border border-gray-200 rounded-lg bg-gray-50 space-y-3">
                  <p className="text-gray-700 flex gap-2">
                    <span>•</span>
                    <span>Basic JavaScript knowledge (ES6 or higher)</span>
                  </p>
                  <p className="text-gray-700 flex gap-2">
                    <span>•</span>
                    <span>HTML and CSS fundamentals</span>
                  </p>
                  <p className="text-gray-700 flex gap-2">
                    <span>•</span>
                    <span>A code editor (VS Code recommended)</span>
                  </p>
                  <p className="text-gray-700 flex gap-2">
                    <span>•</span>
                    <span>Node.js installed on your machine</span>
                  </p>
                </div>
              )}
            </div>

            {/* 11. DESCRIPTION SECTION */}
            <div className="mb-10">
              <button
                onClick={() => setExpandedDescription(!expandedDescription)}
                className="w-full py-4 flex items-center justify-between text-left font-semibold text-gray-900 text-lg hover:text-blue-600 transition"
              >
                <span>Description</span>
                <ChevronDown
                  size={20}
                  className={`transition-transform duration-300 ${
                    expandedDescription ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {expandedDescription && (
                <div className="p-6 border border-gray-200 rounded-lg bg-white space-y-4 text-gray-700">
                  <p>
                    This comprehensive React course is designed for developers who want to master modern JavaScript web development. Whether you're a beginner or have some programming experience, this course will take you from React basics to advanced production-ready patterns.
                  </p>
                  <p>
                    Throughout this course, you'll build real-world projects, learn industry best practices, and gain hands-on experience with tools used by top companies. We cover everything from component fundamentals to advanced state management and performance optimization.
                  </p>
                  <p>
                    By the end of this course, you'll have the skills and confidence to build modern, scalable web applications and advance your career as a React developer.
                  </p>
                </div>
              )}
            </div>

            {/* 12. INSTRUCTOR SECTION */}
            <div className="mb-10 p-6 border border-gray-200 rounded-lg">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Instructor</h2>
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-4xl flex-shrink-0">
                  👨‍🏫
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Sarah Anderson</h3>
                  <div className="flex flex-wrap gap-4 text-sm mb-4">
                    <div className="flex items-center gap-1">
                      <Star size={16} className="fill-amber-400 text-amber-400" />
                      <span className="text-gray-700"><span className="font-semibold">4.8</span> Instructor Rating</span>
                    </div>
                    <div>
                      <span className="text-gray-700"><span className="font-semibold">98K</span> Reviews</span>
                    </div>
                    <div>
                      <span className="text-gray-700"><span className="font-semibold">450K</span> Students</span>
                    </div>
                    <div>
                      <span className="text-gray-700"><span className="font-semibold">12</span> Courses</span>
                    </div>
                  </div>
                  <p className="text-gray-700 leading-relaxed">
                    Sarah is a full-stack developer with 8+ years of experience building web applications. She's passionate about teaching and has helped 450,000+ students master web development technologies.
                  </p>
                </div>
              </div>
            </div>

            {/* 13. COURSE REVIEWS */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Student reviews</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {reviews.map((review) => (
                  <div key={review.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-lg">
                        {review.image}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{review.author}</p>
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={14}
                              className={i < Math.round(review.rating) ? 'fill-amber-400 text-amber-400' : 'fill-gray-300 text-gray-300'}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-700 text-sm">{review.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 14. VIDEO REVIEW CAROUSEL */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Student video reviews</h2>
              <div className="relative bg-gradient-to-br from-slate-700 to-slate-900 rounded-lg overflow-hidden aspect-video flex items-center justify-center">
                <div className="text-6xl">{videoReviews[videoCarouselIndex].thumbnail}</div>
                <p className="absolute bottom-4 left-4 text-white text-sm font-medium">
                  {videoReviews[videoCarouselIndex].title}
                </p>

                {/* Carousel Controls */}
                <button
                  onClick={prevVideoCarousel}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full transition"
                >
                  <ChevronLeft size={20} className="text-gray-900" />
                </button>
                <button
                  onClick={nextVideoCarousel}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full transition"
                >
                  <ChevronRightIcon size={20} className="text-gray-900" />
                </button>

                {/* Dots */}
                <div className="absolute bottom-4 right-4 flex gap-2">
                  {videoReviews.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setVideoCarouselIndex(i)}
                      className={`w-2 h-2 rounded-full transition ${
                        i === videoCarouselIndex ? 'bg-white' : 'bg-white/40'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* 15. IMAGE REVIEW CAROUSEL */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Student projects</h2>
              <div className="relative bg-gray-100 rounded-lg overflow-hidden aspect-video flex items-center justify-center">
                <div className="text-8xl">{imageReviews[imageCarouselIndex].image}</div>
                <p className="absolute bottom-4 left-4 text-gray-900 text-sm font-medium bg-white px-3 py-1 rounded">
                  {imageReviews[imageCarouselIndex].title}
                </p>

                {/* Carousel Controls */}
                <button
                  onClick={prevImageCarousel}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full transition shadow-md"
                >
                  <ChevronLeft size={20} className="text-gray-900" />
                </button>
                <button
                  onClick={nextImageCarousel}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full transition shadow-md"
                >
                  <ChevronRightIcon size={20} className="text-gray-900" />
                </button>

                {/* Dots */}
                <div className="absolute bottom-4 right-4 flex gap-2">
                  {imageReviews.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setImageCarouselIndex(i)}
                      className={`w-2 h-2 rounded-full transition ${
                        i === imageCarouselIndex ? 'bg-gray-900' : 'bg-gray-400'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN - Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-4">
              {/* Course Preview Card */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-40 flex items-center justify-center">
                  <Play size={48} className="text-white opacity-80" />
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Price</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-gray-900">$99.99</span>
                      <span className="text-lg text-gray-500 line-through">$199.99</span>
                    </div>
                    <p className="text-xs text-green-600 font-medium mt-1">50% off - Ends soon!</p>
                  </div>

                  <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 rounded-lg hover:shadow-lg transition transform hover:scale-105 duration-200">
                    Enroll Now
                  </button>

                  <button className="w-full border-2 border-gray-300 text-gray-900 font-semibold py-2 rounded-lg hover:border-gray-400 transition">
                    Add to Wishlist
                  </button>

                  <div className="space-y-3 pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-3 text-sm">
                      <Zap size={16} className="text-blue-600" />
                      <span className="text-gray-700">42 hours video content</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <FileText size={16} className="text-blue-600" />
                      <span className="text-gray-700">Downloadable resources</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <BarChart3 size={16} className="text-blue-600" />
                      <span className="text-gray-700">Certificate included</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Share Card */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-gray-900 mb-3">Share this course</p>
                <div className="flex gap-2">
                  <button className="flex-1 py-2 bg-blue-50 text-blue-600 rounded font-medium text-sm hover:bg-blue-100 transition">
                    F
                  </button>
                  <button className="flex-1 py-2 bg-blue-50 text-blue-600 rounded font-medium text-sm hover:bg-blue-100 transition">
                    𝕏
                  </button>
                  <button className="flex-1 py-2 bg-blue-50 text-blue-600 rounded font-medium text-sm hover:bg-blue-100 transition">
                    in
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 16. FOOTER */}
      <footer className="bg-gray-900 text-gray-300 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            {/* Column 1 */}
            <div>
              <h3 className="text-white font-bold text-lg mb-4">Edu</h3>
              <p className="text-sm leading-relaxed">
                Empowering learners worldwide with quality education and expert instruction.
              </p>
            </div>

            {/* Column 2 */}
            <div>
              <h4 className="text-white font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Browse courses</a></li>
                <li><a href="#" className="hover:text-white transition">Become an instructor</a></li>
                <li><a href="#" className="hover:text-white transition">Mobile app</a></li>
                <li><a href="#" className="hover:text-white transition">Pricing</a></li>
              </ul>
            </div>

            {/* Column 3 */}
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">About us</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-white transition">Careers</a></li>
              </ul>
            </div>

            {/* Column 4 */}
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Privacy policy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms of service</a></li>
                <li><a href="#" className="hover:text-white transition">Cookie preferences</a></li>
                <li><a href="#" className="hover:text-white transition">Accessibility</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col sm:flex-row justify-between items-center text-sm">
              <p>&copy; 2024 Edu. All rights reserved.</p>
              <div className="flex gap-6 mt-4 sm:mt-0">
                <a href="#" className="hover:text-white transition">🌐 English</a>
                <a href="#" className="hover:text-white transition">💬 Feedback</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
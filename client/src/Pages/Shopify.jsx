// ===================================================
// COURSE LANDING PAGE - UI/UX IMPROVEMENTS
// ===================================================
// 
// INSTRUCTIONS: Replace specific sections in your CourseLandingPage.jsx
// Keep all existing logic and state management intact
// 
// ===================================================

// 1. REPLACE THE BLACK HERO SECTION (Course Preview)
// Location: Look for "BLACK HERO SECTION - COURSE PREVIEW" comment
// ===================================================

{/* COURSE HEADER - ABOVE VIDEO PLAYER */}
<section className="w-full bg-black text-white py-8 lg:py-12">
  <div className="max-w-7xl mx-auto px-4">
    <div className="mb-6 lg:mb-8">
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
        <button
          onClick={() => navigate('/instructor')}
          className={`text-green-400 hover:text-green-300 font-semibold ${linkStyle}`}
        >
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

{/* VIDEO PREVIEW PLAYER */}
<section className="w-full bg-black text-white py-8 lg:py-16">
  <div className="max-w-7xl mx-auto px-4">
    <div className="relative bg-gray-800 rounded-xl overflow-hidden aspect-video flex items-center justify-center cursor-pointer hover:bg-gray-700 transition group">
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/40 to-transparent">
        <button className="bg-white text-black p-5 rounded-full hover:bg-gray-100 transition transform group-hover:scale-110 duration-200 shadow-lg">
          <Play size={40} fill="currentColor" />
        </button>
      </div>
    </div>
    <div className="mt-6 bg-gray-700 rounded-lg p-4 text-center">
      <p className="text-white font-bold text-lg">Preview this course</p>
    </div>
  </div>
</section>

// ===================================================
// 2. UPDATE COURSE CONTENT ACCORDION (Lecture List)
// Location: Look for "COURSE CONTENT ACCORDION" comment
// Replace the entire accordion section
// ===================================================

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
          className="w-full px-5 py-4 flex items-center justify-between bg-white hover:bg-gray-50 transition"
        >
          <div className="flex items-center gap-3 flex-1 text-left">
            <ChevronDown
              size={20}
              className={`text-gray-600 transition flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
            />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-lg">{section.title}</h3>
              <p className="text-sm text-gray-600">{section.lectures} lectures • {section.duration}</p>
            </div>
          </div>
        </button>

        {isExpanded && (
          <div className="border-t border-gray-200 bg-gray-50">
            {section.lectures_list.map((lecture, lectureIdx) => (
              <div
                key={lectureIdx}
                className="px-6 py-4 border-b border-gray-200 last:border-b-0 flex items-center justify-between hover:bg-white transition"
              >
                <div className="flex items-center gap-4 flex-1">
                  {/* Hollow Play Icon */}
                  <div className="flex-shrink-0 w-6 h-6 border-2 border-gray-600 rounded-full flex items-center justify-center">
                    {lecture.type === 'video' ? (
                      <Play size={14} className="text-gray-600" />
                    ) : (
                      <span className="text-gray-600 text-sm font-bold">✓</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 text-base font-medium">{lecture.title}</p>
                    <p className="text-xs text-gray-600">{lecture.duration}</p>
                  </div>
                </div>
                
                {/* Preview Button */}
                {lecture.preview && (
                  <button 
                    onClick={() => console.log('Preview:', lecture.title)}
                    className="text-purple-600 hover:text-purple-700 font-bold text-sm cursor-pointer bg-transparent border-none whitespace-nowrap ml-4 transition"
                  >
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

// ===================================================
// 3. UPDATE DESCRIPTION SECTION (with Show More Toggle)
// Location: Look for "DESCRIPTION" comment
// ===================================================

{/* DESCRIPTION */}
<div className="mb-16">
  <h2 className="text-3xl font-bold text-gray-900 mb-6">Description</h2>
  
  <div className={`text-gray-700 leading-relaxed text-base space-y-4 ${!showFullDescription ? 'max-h-40 overflow-hidden' : ''}`}>
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
    className="text-purple-600 hover:text-purple-700 mt-4 text-sm font-semibold transition flex items-center gap-2 bg-transparent border-none cursor-pointer"
  >
    <span>{showFullDescription ? '▲ Show less' : '▼ Show more'}</span>
  </button>
</div>

// ===================================================
// 4. UPDATE INSTRUCTOR SECTION (Match exact UI)
// Location: Look for "INSTRUCTOR SECTION" comment
// ===================================================

{/* INSTRUCTOR SECTION */}
<div className="mb-16 border-t border-gray-200 pt-12">
  <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
    {/* Instructor Image - Left */}
    <div className="lg:col-span-1 flex flex-col items-center lg:items-start">
      <div className="w-40 h-40 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-6xl mb-6">
        {courseData.instructor.image}
      </div>
      <h3 className="font-bold text-gray-900 text-xl text-center lg:text-left">
        <button
          onClick={() => navigate('/instructor')}
          className={`text-green-600 hover:text-green-700 ${linkStyle}`}
        >
          {courseData.instructor.name}
        </button>
      </h3>
      <p className="text-gray-700 font-medium text-sm text-center lg:text-left mt-2">
        Lead Instructor at London App Brewery
      </p>
    </div>

    {/* Instructor Stats & Bio - Right */}
    <div className="lg:col-span-3">
      {/* Stats Section */}
      <div className="mb-8 pb-8 border-b border-gray-200">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Rating */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Star size={18} className="text-yellow-400" fill="currentColor" />
              <span className="font-bold text-gray-900 text-lg">{courseData.instructor.rating}</span>
            </div>
            <p className="text-sm text-gray-600">Instructor Rating</p>
          </div>

          {/* Reviews */}
          <div>
            <p className="font-bold text-gray-900 text-lg mb-2">
              {(courseData.instructor.reviews / 1000).toFixed(1)}K
            </p>
            <p className="text-sm text-gray-600">Reviews</p>
          </div>

          {/* Students */}
          <div>
            <p className="font-bold text-gray-900 text-lg mb-2">
              {(courseData.instructor.students / 1000000).toFixed(1)}M
            </p>
            <p className="text-sm text-gray-600">Students</p>
          </div>

          {/* Courses */}
          <div>
            <p className="font-bold text-gray-900 text-lg mb-2">{courseData.instructor.courses}</p>
            <p className="text-sm text-gray-600">Courses</p>
          </div>
        </div>
      </div>

      {/* Bio Section */}
      <div>
        <p className="text-gray-700 leading-relaxed text-base">{courseData.instructor.bio}</p>
        <button
          onClick={() => setShowFullDescription(!showFullDescription)}
          className="text-purple-600 hover:text-purple-700 mt-4 text-sm font-semibold transition bg-transparent border-none cursor-pointer"
        >
          {showFullDescription ? '▲ Show less' : '▼ Show more'}
        </button>
      </div>
    </div>
  </div>
</div>

// ===================================================
// 5. REPLACE REVIEWS SECTION (Complete Redesign)
// Location: Look for "COURSE REVIEWS" comment
// ===================================================

{/* COURSE REVIEWS */}
<div className="mb-16 py-12 border-t border-gray-200">
  <div className="mb-10">
    <div className="flex items-center gap-4 mb-4">
      <div className="flex items-center gap-2">
        <Star size={32} className="text-yellow-400" fill="currentColor" />
        <span className="text-3xl font-bold text-gray-900">{courseData.rating}</span>
      </div>
      <div>
        <p className="text-gray-700">Course Rating</p>
        <p className="text-sm text-gray-600">{courseData.reviews.toLocaleString()} reviews</p>
      </div>
    </div>
  </div>

  {/* Individual Reviews */}
  <div className="space-y-6 mb-8">
    {courseData.reviews_list.map((review, idx) => (
      <div key={idx} className="border border-gray-300 rounded-lg p-6 hover:shadow-md transition">
        {/* Review Header */}
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

          {/* Action Buttons */}
          <button
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition bg-transparent border-none cursor-pointer text-lg"
            title="More options"
          >
            ⋮
          </button>
        </div>

        {/* Verified Badge */}
        {review.verified && (
          <div className="flex items-center gap-1 bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded inline-block mb-4">
            <span>✓</span>
            <span>Verified Purchase</span>
          </div>
        )}

        {/* Review Text */}
        <p className="text-gray-700 leading-relaxed mb-4">{review.text}</p>

        {/* Helpful Buttons */}
        <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
          <button className="flex items-center gap-1 text-gray-600 hover:text-gray-900 text-sm bg-transparent border-none cursor-pointer transition">
            <span>👍</span>
            <span>Helpful</span>
          </button>
          <button className="flex items-center gap-1 text-gray-600 hover:text-gray-900 text-sm bg-transparent border-none cursor-pointer transition">
            <span>👎</span>
            <span>Not helpful</span>
          </button>
        </div>
      </div>
    ))}
  </div>

  {/* Show All Reviews Button */}
  <button className="w-full border-2 border-gray-300 text-gray-900 font-bold py-3 rounded-lg hover:bg-gray-50 transition">
    Show all reviews
  </button>
</div>

// ===================================================
// 6. ADD NEW SECTION: STUDENTS ALSO BOUGHT
// Location: After Reviews section, before Video Testimonials
// ===================================================

{/* STUDENTS ALSO BOUGHT */}
<div className="mb-16 py-12 border-t border-gray-200">
  <h2 className="text-3xl font-bold text-gray-900 mb-8">Students also bought</h2>
  
  <div className="flex gap-6 overflow-x-auto pb-4 -mx-4 px-4">
    {[
      { id: 1, title: 'Advanced React Patterns', rating: 4.7, students: '45K', duration: '32h', bestseller: true },
      { id: 2, title: 'Node.js & Express Mastery', rating: 4.6, students: '38K', duration: '28h', bestseller: false },
      { id: 3, title: 'Full Stack JavaScript', rating: 4.8, students: '52K', duration: '40h', bestseller: true },
      { id: 4, title: 'Web Design Fundamentals', rating: 4.5, students: '62K', duration: '24h', bestseller: false }
    ].map(course => (
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

// ===================================================
// 7. UPDATE VIDEO TESTIMONIALS (Horizontal Slider)
// Location: Look for "VIDEO REVIEW CAROUSEL" comment
// ===================================================

{/* VIDEO TESTIMONIALS - HORIZONTAL SLIDER */}
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
        className="w-3 h-3 rounded-full bg-gray-300 hover:bg-purple-600 transition"
      />
    ))}
  </div>
</div>

// ===================================================
// 8. UPDATE IMAGE GALLERY (Slider)
// Location: Look for "IMAGE REVIEW CAROUSEL" comment
// ===================================================

{/* PROJECT GALLERY - SLIDER */}
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
        >
          {item.image}
        </div>
      ))}
    </div>
  </div>
</div>

// ===================================================
// 9. REPLACE STICKY BOTTOM BAR (Mobile & Desktop)
// Location: Look for "STICKY ENROLL BUTTON" and "MOBILE STICKY CTA" comments
// ===================================================

{/* STICKY BOTTOM BAR - MOBILE */}
<div className="fixed bottom-0 left-0 right-0 lg:hidden bg-white border-t border-gray-300 p-4 z-50 flex items-center justify-between gap-4">
  <div className="flex flex-col">
    <span className="text-2xl font-bold text-gray-900">${courseData.price}</span>
    <span className="text-sm text-gray-600 line-through">${courseData.originalPrice}</span>
  </div>
  <button
    onClick={() => navigate('/auth/register')}
    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg transition text-base"
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
      onClick={() => navigate('/auth/register')}
      className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-12 rounded-lg transition text-lg"
    >
      Add to cart
    </button>
  </div>
</div>

{/* Bottom padding to prevent content from being hidden under sticky bar */}
<div className="h-24 lg:h-28" />
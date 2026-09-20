// src/Pages/CoursesPage.jsx
// ─────────────────────────────────────────────────────────────────────────────
// COURSES PAGE — lists every published course. Rebranded to match the rest
// of the site (Shopify.jsx / course landing page): cream background, dark
// #1a1208 header/hero, burnt-orange (#e8540a) accent, Playfair Display +
// DM Sans, and the shared <SiteHeader />/<SiteFooter /> (real Super Admin
// logo, expandable "Courses" list in the mobile drawer) instead of this
// page's previous unrelated purple "Courseify" template.
//
// Each course card shows the same rating / review count / student count
// that appears on that course's own landing page (Shopify.jsx) — these all
// come straight from CoursesContext's normalized course object (rating,
// reviews, students), so a card's numbers always match its course page.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Clock, Users, Search, Filter, X, ChevronDown, BookOpen, Zap } from 'lucide-react';
import { useCourses, getDisplayStats } from '../context/CoursesContext';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';

const LEVELS = ['All Levels', 'Beginner', 'Intermediate', 'Advanced'];
const SORT_OPTIONS = [
  { value: 'popular',    label: 'Most Popular' },
  { value: 'rating',     label: 'Highest Rated' },
  { value: 'newest',     label: 'Newest' },
  { value: 'price-low',  label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
];

function formatNumber(n) {
  if (!n) return '0';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(0) + 'K';
  return String(n);
}

function CourseThumbnail({ course }) {
  const [imgErr, setImgErr] = useState(false);
  if (course.thumbnail && !imgErr) {
    return (
      <img src={course.thumbnail} alt={course.title}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        onError={() => setImgErr(true)} />
    );
  }
  return (
    <div className="w-full h-full bg-[#f0ebe3] flex items-center justify-center">
      <span className="text-5xl md:text-6xl select-none">{course.emoji || '📚'}</span>
    </div>
  );
}

// Card styling matches the "Students also bought" cards on the course
// landing page (Shopify.jsx) exactly — same border, rounded corners, gold
// star rating, and price styling — so a course looks the same wherever it
// shows up on the site.
function CourseCard({ course, onClick }) {
  const discount = course.originalPrice && course.originalPrice > course.price
    ? Math.round((1 - course.price / course.originalPrice) * 100)
    : null;
  // NEW: pulled from the shared getDisplayStats() (CoursesContext.jsx) —
  // this is what actually makes these match the course's own landing page;
  // the raw course.rating/reviews/students fields below are just the small
  // real counts on their own.
  const { rating: displayRating, reviewCount: displayReviewCount, studentCount: displayStudentCount } = useMemo(() => getDisplayStats(course), [course]);
  return (
    <div onClick={onClick}
      className="group bg-white border border-[#ece6dd] rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer flex flex-col">
      <div className="relative h-40 md:h-44 overflow-hidden">
        <CourseThumbnail course={course} />
        {course.bestseller && (
          <span className="absolute top-3 left-3 bg-[#f9c97a] text-[#7a4a00] text-xs font-bold px-2 py-0.5 rounded">Bestseller</span>
        )}
        <span className="absolute top-3 right-3 bg-[#1a1208]/60 text-white text-xs font-semibold px-2 py-0.5 rounded backdrop-blur-sm">
          {course.level || 'All Levels'}
        </span>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-bold text-[#1a1208] text-sm md:text-base leading-snug mb-1 line-clamp-2 group-hover:text-[#e8540a] transition-colors">
          {course.title}
        </h3>
        <p className="text-xs text-[#9e9789] mb-1 line-clamp-1">{course.subtitle}</p>
        <p className="text-xs text-[#6b5e4e] mb-2">by {course.instructor}</p>

        {/* Rating + review count + student count — same numbers, same
            source, as the course's own landing page. */}
        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
          <span className="font-bold text-[#1a1208] text-sm">{displayRating.toFixed(1)}</span>
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={12} className="text-[#f9c97a]" fill={i < Math.floor(displayRating) ? 'currentColor' : 'none'} />
            ))}
          </div>
          <span className="text-xs text-[#9e9789]">({formatNumber(displayReviewCount)})</span>
          {displayStudentCount > 0 && (
            <span className="flex items-center gap-1 text-xs text-[#9e9789] ml-1">
              <Users size={11} />{formatNumber(displayStudentCount)} students
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-[#9e9789] mb-3 flex-wrap">
          {course.duration       && <span className="flex items-center gap-1"><Clock    size={11} />{course.duration}</span>}
          {course.lectures > 0   && <span className="flex items-center gap-1"><BookOpen size={11} />{course.lectures} lectures</span>}
        </div>

        {course.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {course.tags.slice(0, 3).map(tag => (
              <span key={tag} className="bg-[#f8f4ed] text-[#6b5e4e] text-xs px-2 py-0.5 rounded-full">{tag}</span>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-center gap-2">
          <span className="text-base md:text-lg font-bold text-[#1a1208]" style={{ fontFamily: "'Playfair Display', serif" }}>
            PKR {Number(course.price || 0).toLocaleString()}
          </span>
          {discount && (
            <>
              <span className="text-sm text-[#c8bfaf] line-through">PKR {Number(course.originalPrice || 0).toLocaleString()}</span>
              <span className="ml-auto text-xs font-semibold text-[#1a7a4a] bg-[#e8f5ee] px-2 py-0.5 rounded">{discount}% off</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white border border-[#ece6dd] rounded-2xl overflow-hidden animate-pulse">
      <div className="h-40 md:h-44 bg-[#f0ebe3]" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-[#ece6dd] rounded w-3/4" />
        <div className="h-3 bg-[#f0ebe3] rounded w-full" />
        <div className="h-3 bg-[#f0ebe3] rounded w-1/2" />
        <div className="h-6 bg-[#ece6dd] rounded w-1/4 mt-4" />
      </div>
    </div>
  );
}

export default function CoursesPage() {
  const navigate = useNavigate();
  const { courses, loading } = useCourses();

  const [search,     setSearch]     = useState('');
  const [category,   setCategory]   = useState('All');
  const [level,      setLevel]      = useState('All Levels');
  const [sort,       setSort]       = useState('popular');
  const [filterOpen, setFilterOpen] = useState(false);

  const CATEGORIES = useMemo(() => {
    // Only get categories from published courses
    const publishedCourses = courses.filter(c => c.status === 'published');
    const cats = [...new Set(publishedCourses.map(c => c.category).filter(Boolean))];
    return ['All', ...cats.sort()];
  }, [courses]);

  const filtered = useMemo(() => {
    // ═══════════════════════════════════════════════════════════════════════
    // CRITICAL: Only show PUBLISHED courses on the public courses page
    // This ensures draft/review courses from instructor dashboard stay hidden
    // ═══════════════════════════════════════════════════════════════════════
    let list = courses.filter(c => c.status === 'published');

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.title?.toLowerCase().includes(q) ||
        c.subtitle?.toLowerCase().includes(q) ||
        c.tags?.some(t => t.toLowerCase().includes(q)) ||
        c.instructor?.toLowerCase().includes(q)
      );
    }
    if (category !== 'All')        list = list.filter(c => c.category === category);
    if (level    !== 'All Levels') list = list.filter(c => c.level    === level);
    switch (sort) {
      case 'rating':     list.sort((a,b) => (b.rating||0) - (a.rating||0)); break;
      case 'newest':     list.sort((a,b) => new Date(b.updatedAt) - new Date(a.updatedAt)); break;
      case 'price-low':  list.sort((a,b) => (a.price||0) - (b.price||0)); break;
      case 'price-high': list.sort((a,b) => (b.price||0) - (a.price||0)); break;
      default:           list.sort((a,b) => (b.students||0) - (a.students||0)); break;
    }
    return list;
  }, [courses, search, category, level, sort]);

  // Calculate total students from published courses only
  const totalStudents = useMemo(() => {
    return courses
      .filter(c => c.status === 'published')
      .reduce((a, c) => a + (c.students || 0), 0);
  }, [courses]);

  return (
    <div className="min-h-screen bg-[#FDFAF6] overflow-x-hidden w-full" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* HEADER — shared header used across the whole site */}
      <SiteHeader />

      {/* HERO */}
      <div className="w-full bg-[#1a1208] text-white py-12 md:py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <p className="text-[#f9c97a] text-sm font-semibold uppercase tracking-widest mb-2">Learning Hub</p>
          <h1 className="text-3xl md:text-5xl font-bold mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>All Courses</h1>
          <p className="text-[#c8bfaf] text-base md:text-lg max-w-2xl">
            Explore {loading ? '…' : filtered.length} expert-led courses in digital marketing and e-commerce.
          </p>
          <div className="flex flex-wrap gap-6 mt-6">
            {[
              { icon: BookOpen, label: `${loading ? '…' : filtered.length} Courses` },
              { icon: Users,    label: `${loading ? '…' : formatNumber(totalStudents)}+ Students` },
              { icon: Star,     label: 'Expert Instructors' },
              { icon: Zap,      label: 'Lifetime Access' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-sm text-[#c8bfaf]">
                <Icon size={16} className="text-[#e8540a]" /><span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="bg-white border-b border-[#ece6dd]">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-3 flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px] max-w-xl relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9e9789] pointer-events-none" />
            <input type="text" placeholder="Search courses, topics, instructors…"
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-[#ece6dd] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e8540a] bg-white text-[#1a1208]" />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9e9789] hover:text-[#1a1208] bg-transparent border-none cursor-pointer p-0">
                <X size={14} />
              </button>
            )}
          </div>
          <div className="hidden lg:flex items-center gap-2 flex-wrap">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer ${
                  category === cat ? 'bg-[#e8540a] text-white border-[#e8540a]' : 'bg-white text-[#3d3020] border-[#ece6dd] hover:border-[#e8540a] hover:text-[#e8540a]'
                }`}>
                {cat}
              </button>
            ))}
          </div>
          <button onClick={() => setFilterOpen(!filterOpen)}
            className="lg:hidden flex items-center gap-2 px-3 py-2 border border-[#ece6dd] rounded-lg text-sm font-medium text-[#3d3020] hover:bg-[#f8f4ed] transition bg-white cursor-pointer">
            <Filter size={14} />Filters
            {(category !== 'All' || level !== 'All Levels') && (
              <span className="bg-[#e8540a] text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {(category !== 'All' ? 1 : 0) + (level !== 'All Levels' ? 1 : 0)}
              </span>
            )}
          </button>
          <div className="relative">
            <select value={level} onChange={e => setLevel(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 border border-[#ece6dd] rounded-lg text-sm text-[#3d3020] bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#e8540a]">
              {LEVELS.map(l => <option key={l}>{l}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9e9789] pointer-events-none" />
          </div>
          <div className="relative ml-auto">
            <select value={sort} onChange={e => setSort(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 border border-[#ece6dd] rounded-lg text-sm text-[#3d3020] bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#e8540a]">
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9e9789] pointer-events-none" />
          </div>
        </div>
        {filterOpen && (
          <div className="lg:hidden px-4 pb-3 border-t border-[#f0ebe3] pt-3">
            <p className="text-xs font-bold text-[#9e9789] uppercase tracking-wider mb-2">Category</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => { setCategory(cat); setFilterOpen(false); }}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition cursor-pointer ${
                    category === cat ? 'bg-[#e8540a] text-white border-[#e8540a]' : 'bg-white text-[#3d3020] border-[#ece6dd]'
                  }`}>{cat}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MAIN */}
      <main className="max-w-7xl mx-auto px-4 lg:px-6 py-8 md:py-12 w-full">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            {!loading && (
              <p className="text-[#6b5e4e] text-sm">
                <span className="font-bold text-[#1a1208]">{filtered.length}</span> {filtered.length === 1 ? 'course' : 'courses'} found
                {search && <span> for "<span className="font-semibold text-[#e8540a]">{search}</span>"</span>}
              </p>
            )}
            {category !== 'All' && (
              <span className="inline-flex items-center gap-1 bg-[#fdf2ea] text-[#e8540a] text-xs font-semibold px-2 py-1 rounded-full">
                {category}
                <button onClick={() => setCategory('All')} className="bg-transparent border-none cursor-pointer p-0 text-[#e8540a] hover:text-[#c94708]"><X size={10} /></button>
              </span>
            )}
            {level !== 'All Levels' && (
              <span className="inline-flex items-center gap-1 bg-[#fdf2ea] text-[#e8540a] text-xs font-semibold px-2 py-1 rounded-full">
                {level}
                <button onClick={() => setLevel('All Levels')} className="bg-transparent border-none cursor-pointer p-0 text-[#e8540a] hover:text-[#c94708]"><X size={10} /></button>
              </span>
            )}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-6xl mb-4">🔍</p>
            <h2 className="text-2xl font-bold text-[#1a1208] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>No courses found</h2>
            <p className="text-[#9e9789] mb-6">Try adjusting your search or filters</p>
            <button onClick={() => { setSearch(''); setCategory('All'); setLevel('All Levels'); }}
              className="px-6 py-2 bg-[#e8540a] text-white font-semibold rounded-lg hover:bg-[#c94708] transition border-none cursor-pointer">
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map(course => (
              <CourseCard key={course._id} course={course}
                onClick={() => navigate(`/course/${course._id}`)} />
            ))}
          </div>
        )}
      </main>

      {/* FOOTER — shared footer used across the whole site */}
      <SiteFooter />
    </div>
  );
}
// src/Pages/CoursesPage.jsx
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Clock, Users, Search, Filter, X, ChevronDown, BookOpen, Menu, Zap } from 'lucide-react';
import { useCourses } from '../context/CoursesContext';

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

function StarRow({ rating, size = 14 }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={size} className="text-yellow-400"
          fill={i <= Math.round(rating) ? 'currentColor' : 'none'} />
      ))}
    </span>
  );
}

function CourseThumbnail({ course }) {
  const [imgErr, setImgErr] = useState(false);
  if (course.thumbnail && !imgErr) {
    return (
      <img src={course.thumbnail} alt={course.title}
        className="w-full h-full object-cover"
        onError={() => setImgErr(true)} />
    );
  }
  return (
    <div className={`w-full h-full bg-gradient-to-br ${course.color || 'from-purple-500 to-indigo-600'} flex items-center justify-center`}>
      <span className="text-6xl select-none">{course.emoji || '📚'}</span>
    </div>
  );
}

function CourseCard({ course, onClick }) {
  const discount = course.originalPrice && course.originalPrice > course.price
    ? Math.round((1 - course.price / course.originalPrice) * 100)
    : null;
  return (
    <div onClick={onClick}
      className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col">
      <div className="relative h-44 overflow-hidden">
        <CourseThumbnail course={course} />
        {course.bestseller && (
          <span className="absolute top-3 left-3 bg-yellow-400 text-black text-xs font-bold px-2 py-0.5 rounded">Bestseller</span>
        )}
        <span className="absolute top-3 right-3 bg-black/30 text-white text-xs font-semibold px-2 py-0.5 rounded backdrop-blur-sm">
          {course.level || 'All Levels'}
        </span>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-bold text-gray-900 text-sm leading-snug mb-1 line-clamp-2 group-hover:text-purple-700 transition-colors">
          {course.title}
        </h3>
        <p className="text-xs text-gray-500 mb-1 line-clamp-1">{course.subtitle}</p>
        <p className="text-xs text-gray-600 mb-2">by {course.instructor}</p>
        <div className="flex items-center gap-1.5 mb-2">
          <span className="font-bold text-amber-600 text-sm">{course.rating || '—'}</span>
          {course.rating > 0 && <StarRow rating={course.rating} />}
          <span className="text-xs text-gray-500">({formatNumber(course.reviews)})</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500 mb-3 flex-wrap">
          {course.duration   && <span className="flex items-center gap-1"><Clock    size={11} />{course.duration}</span>}
          {course.lectures > 0 && <span className="flex items-center gap-1"><BookOpen size={11} />{course.lectures} lectures</span>}
          {course.students > 0 && <span className="flex items-center gap-1"><Users    size={11} />{formatNumber(course.students)}</span>}
        </div>
        {course.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {course.tags.slice(0, 3).map(tag => (
              <span key={tag} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{tag}</span>
            ))}
          </div>
        )}
        <div className="mt-auto flex items-center gap-2">
          <span className="text-lg font-bold text-gray-900">${course.price}</span>
          {discount && (
            <>
              <span className="text-sm text-gray-400 line-through">${course.originalPrice}</span>
              <span className="ml-auto text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded">{discount}% off</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden animate-pulse">
      <div className="h-44 bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-full" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="h-6 bg-gray-200 rounded w-1/4 mt-4" />
      </div>
    </div>
  );
}

export default function CoursesPage() {
  const navigate = useNavigate();
  const { courses, loading } = useCourses();

  const [search,         setSearch]         = useState('');
  const [category,       setCategory]       = useState('All');
  const [level,          setLevel]          = useState('All Levels');
  const [sort,           setSort]           = useState('popular');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [filterOpen,     setFilterOpen]     = useState(false);

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

  const handleNavigate = (path) => { setMobileMenuOpen(false); navigate(path); };

  // Calculate total students from published courses only
  const totalStudents = useMemo(() => {
    return courses
      .filter(c => c.status === 'published')
      .reduce((a, c) => a + (c.students || 0), 0);
  }, [courses]);

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <button className="lg:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <button onClick={() => handleNavigate('/')}
            className="text-2xl font-bold text-gray-900 hover:text-purple-600 transition bg-transparent border-none cursor-pointer p-0 shrink-0">
            Courseify
          </button>
          <nav className="hidden lg:flex items-center gap-6 ml-4">
            <button onClick={() => handleNavigate('/courses')} className="text-purple-600 font-semibold bg-transparent border-none cursor-pointer p-0">Courses</button>
            <button onClick={() => handleNavigate('/instructor')} className="text-gray-600 hover:text-gray-900 bg-transparent border-none cursor-pointer p-0 font-medium">Instructors</button>
            <button onClick={() => handleNavigate('/')} className="text-gray-600 hover:text-gray-900 bg-transparent border-none cursor-pointer p-0 font-medium">About</button>
          </nav>
          <div className="flex-1 max-w-xl mx-4 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input type="text" placeholder="Search courses, topics, instructors…"
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white" />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer p-0">
                <X size={14} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={() => handleNavigate('/auth/login')} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition border-none cursor-pointer">Login</button>
            <button onClick={() => handleNavigate('/auth/register')} className="hidden lg:block px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition border-none cursor-pointer">Sign Up</button>
          </div>
        </div>
        {mobileMenuOpen && (
          <>
            <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setMobileMenuOpen(false)} />
            <div className="fixed top-0 left-0 h-full w-64 bg-gray-900 z-50 p-4 space-y-2">
              <div className="flex justify-end mb-4">
                <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-white bg-transparent border-none cursor-pointer"><X size={22} /></button>
              </div>
              {['/', '/courses', '/instructor'].map((path, i) => (
                <button key={i} onClick={() => handleNavigate(path)}
                  className="block text-white w-full text-left p-3 rounded hover:bg-gray-800 bg-transparent border-none cursor-pointer font-medium">
                  {['Home', 'Courses', 'Instructors'][i]}
                </button>
              ))}
            </div>
          </>
        )}
      </header>

      {/* HERO */}
      <div className="bg-gradient-to-r from-gray-900 via-purple-950 to-gray-900 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <p className="text-purple-300 text-sm font-semibold uppercase tracking-widest mb-2">Learning Hub</p>
          <h1 className="text-4xl lg:text-5xl font-extrabold mb-3">All Courses</h1>
          <p className="text-gray-300 text-lg max-w-2xl">
            Explore {loading ? '…' : filtered.length} expert-led courses across web development, data science, design, and more.
          </p>
          <div className="flex flex-wrap gap-6 mt-6">
            {[
              { icon: BookOpen, label: `${loading ? '…' : filtered.length} Courses` },
              { icon: Users,    label: `${loading ? '…' : formatNumber(totalStudents)}+ Students` },
              { icon: Star,     label: 'Expert Instructors' },
              { icon: Zap,      label: 'Lifetime Access' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-sm text-gray-300">
                <Icon size={16} className="text-purple-400" /><span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="bg-white border-b border-gray-200 sticky top-[72px] z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3">
          <div className="hidden lg:flex items-center gap-2 flex-wrap flex-1">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer ${
                  category === cat ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-700 border-gray-300 hover:border-purple-400 hover:text-purple-600'
                }`}>
                {cat}
              </button>
            ))}
          </div>
          <button onClick={() => setFilterOpen(!filterOpen)}
            className="lg:hidden flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition bg-white cursor-pointer">
            <Filter size={14} />Filters
            {(category !== 'All' || level !== 'All Levels') && (
              <span className="bg-purple-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {(category !== 'All' ? 1 : 0) + (level !== 'All Levels' ? 1 : 0)}
              </span>
            )}
          </button>
          <div className="relative">
            <select value={level} onChange={e => setLevel(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-400">
              {LEVELS.map(l => <option key={l}>{l}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          <div className="relative ml-auto">
            <select value={sort} onChange={e => setSort(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-400">
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
        {filterOpen && (
          <div className="lg:hidden px-4 pb-3 border-t border-gray-100 pt-3">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Category</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => { setCategory(cat); setFilterOpen(false); }}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition cursor-pointer ${
                    category === cat ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-700 border-gray-300'
                  }`}>{cat}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MAIN */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            {!loading && (
              <p className="text-gray-600 text-sm">
                <span className="font-bold text-gray-900">{filtered.length}</span> {filtered.length === 1 ? 'course' : 'courses'} found
                {search && <span> for "<span className="font-semibold text-purple-700">{search}</span>"</span>}
              </p>
            )}
            {category !== 'All' && (
              <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 text-xs font-semibold px-2 py-1 rounded-full">
                {category}
                <button onClick={() => setCategory('All')} className="bg-transparent border-none cursor-pointer p-0 text-purple-500 hover:text-purple-800"><X size={10} /></button>
              </span>
            )}
            {level !== 'All Levels' && (
              <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 text-xs font-semibold px-2 py-1 rounded-full">
                {level}
                <button onClick={() => setLevel('All Levels')} className="bg-transparent border-none cursor-pointer p-0 text-purple-500 hover:text-purple-800"><X size={10} /></button>
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No courses found</h2>
            <p className="text-gray-500 mb-6">Try adjusting your search or filters</p>
            <button onClick={() => { setSearch(''); setCategory('All'); setLevel('All Levels'); }}
              className="px-6 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition border-none cursor-pointer">
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

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-300 py-10 mt-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
            {[
              { title: 'Courseify',   links: ['Press', 'Contact'] },
              { title: 'Instructors', links: ['Teach', 'Resources', 'Benefits'] },
              { title: 'Learning',    links: ['Categories', 'Trending', 'Collections'] },
              { title: 'Support',     links: ['Help', 'Support', 'FAQ'] },
              { title: 'Legal',       links: ['Privacy', 'Terms', 'Cookies'] },
            ].map(col => (
              <div key={col.title}>
                <h3 className="font-bold text-white mb-3 text-sm">{col.title}</h3>
                <ul className="space-y-2">
                  {col.links.map(link => (
                    <li key={link}>
                      <button onClick={() => navigate('/')} className="text-gray-400 hover:text-white text-sm bg-transparent border-none cursor-pointer p-0 transition">{link}</button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-700 pt-6">
            <p className="text-sm text-gray-500">© 2024 Courseify. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
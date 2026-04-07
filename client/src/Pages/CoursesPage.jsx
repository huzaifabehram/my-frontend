import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Clock, Users, Search, Filter, X, ChevronDown, BookOpen, Menu, Zap } from 'lucide-react';

// ── Sample published courses data ─────────────────────────────────────────────
const ALL_COURSES = [
  {
    id: 1,
    title: 'Complete Web Development Bootcamp 2024',
    subtitle: 'Master HTML, CSS, JavaScript, React, and Node.js from scratch',
    instructor: 'Sarah Anderson',
    rating: 4.8,
    reviews: 150232,
    students: 89234,
    price: 99.99,
    originalPrice: 499.99,
    duration: '45h',
    lectures: 312,
    level: 'Beginner',
    category: 'Web Development',
    tags: ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js'],
    bestseller: true,
    updated: 'Jan 2024',
    emoji: '🌐',
    color: 'from-blue-500 to-indigo-600',
  },
  {
    id: 2,
    title: 'Advanced React Patterns & Architecture',
    subtitle: 'Build scalable React apps with advanced patterns, hooks & performance',
    instructor: 'Michael Torres',
    rating: 4.7,
    reviews: 45890,
    students: 32100,
    price: 84.99,
    originalPrice: 299.99,
    duration: '32h',
    lectures: 198,
    level: 'Advanced',
    category: 'Web Development',
    tags: ['React', 'TypeScript', 'Redux', 'Performance'],
    bestseller: true,
    updated: 'Feb 2024',
    emoji: '⚛️',
    color: 'from-cyan-500 to-blue-500',
  },
  {
    id: 3,
    title: 'Python for Data Science & Machine Learning',
    subtitle: 'Use Python, Pandas, NumPy, Matplotlib, Scikit-Learn, TensorFlow & more',
    instructor: 'Dr. Aisha Rahman',
    rating: 4.9,
    reviews: 203410,
    students: 145000,
    price: 119.99,
    originalPrice: 599.99,
    duration: '58h',
    lectures: 400,
    level: 'Intermediate',
    category: 'Data Science',
    tags: ['Python', 'Machine Learning', 'TensorFlow', 'Pandas'],
    bestseller: true,
    updated: 'Mar 2024',
    emoji: '🐍',
    color: 'from-green-500 to-teal-600',
  },
  {
    id: 4,
    title: 'UI/UX Design Masterclass',
    subtitle: 'Learn UI/UX design theory and apply it to real-world projects in Figma',
    instructor: 'Emma Clarke',
    rating: 4.6,
    reviews: 67340,
    students: 51200,
    price: 74.99,
    originalPrice: 249.99,
    duration: '24h',
    lectures: 156,
    level: 'Beginner',
    category: 'Design',
    tags: ['Figma', 'UI', 'UX', 'Prototyping', 'Design Systems'],
    bestseller: false,
    updated: 'Dec 2023',
    emoji: '🎨',
    color: 'from-pink-500 to-rose-600',
  },
  {
    id: 5,
    title: 'Node.js & Express — Backend Mastery',
    subtitle: 'Build REST APIs, authenticate users, and deploy Node.js applications',
    instructor: 'James O\'Brien',
    rating: 4.6,
    reviews: 38450,
    students: 27300,
    price: 79.99,
    originalPrice: 299.99,
    duration: '28h',
    lectures: 170,
    level: 'Intermediate',
    category: 'Web Development',
    tags: ['Node.js', 'Express', 'MongoDB', 'REST API'],
    bestseller: false,
    updated: 'Jan 2024',
    emoji: '🚀',
    color: 'from-emerald-500 to-green-600',
  },
  {
    id: 6,
    title: 'iOS & Swift Development Bootcamp',
    subtitle: 'Learn iOS 17 app development with Swift & SwiftUI from beginner to pro',
    instructor: 'Kevin Zhang',
    rating: 4.8,
    reviews: 89120,
    students: 62000,
    price: 109.99,
    originalPrice: 449.99,
    duration: '50h',
    lectures: 350,
    level: 'Beginner',
    category: 'Mobile Development',
    tags: ['Swift', 'SwiftUI', 'iOS', 'Xcode'],
    bestseller: true,
    updated: 'Feb 2024',
    emoji: '📱',
    color: 'from-gray-700 to-gray-900',
  },
  {
    id: 7,
    title: 'AWS Cloud Practitioner & Solutions Architect',
    subtitle: 'Pass the AWS exam and architect real-world cloud solutions',
    instructor: 'Priya Sharma',
    rating: 4.7,
    reviews: 54200,
    students: 41800,
    price: 89.99,
    originalPrice: 349.99,
    duration: '36h',
    lectures: 220,
    level: 'Intermediate',
    category: 'Cloud & DevOps',
    tags: ['AWS', 'Cloud', 'DevOps', 'Lambda', 'EC2'],
    bestseller: false,
    updated: 'Mar 2024',
    emoji: '☁️',
    color: 'from-orange-400 to-amber-500',
  },
  {
    id: 8,
    title: 'Complete Digital Marketing Course',
    subtitle: 'SEO, Social Media, Email Marketing, Google Ads — 12 courses in 1',
    instructor: 'Lena Schmidt',
    rating: 4.5,
    reviews: 112300,
    students: 93400,
    price: 69.99,
    originalPrice: 299.99,
    duration: '40h',
    lectures: 280,
    level: 'Beginner',
    category: 'Marketing',
    tags: ['SEO', 'Social Media', 'Google Ads', 'Email Marketing'],
    bestseller: false,
    updated: 'Nov 2023',
    emoji: '📈',
    color: 'from-violet-500 to-purple-600',
  },
  {
    id: 9,
    title: 'Cybersecurity & Ethical Hacking',
    subtitle: 'Penetration testing, network security, and ethical hacking for beginners',
    instructor: 'Alex Mercer',
    rating: 4.7,
    reviews: 31000,
    students: 24500,
    price: 94.99,
    originalPrice: 399.99,
    duration: '22h',
    lectures: 140,
    level: 'Intermediate',
    category: 'Cybersecurity',
    tags: ['Cybersecurity', 'Ethical Hacking', 'Network Security', 'Linux'],
    bestseller: false,
    updated: 'Jan 2024',
    emoji: '🔐',
    color: 'from-red-500 to-rose-700',
  },
  {
    id: 10,
    title: 'Figma to React — Design System Workshop',
    subtitle: 'Transform Figma designs into production React components and design systems',
    instructor: 'Nina Patel',
    rating: 4.8,
    reviews: 19870,
    students: 14200,
    price: 64.99,
    originalPrice: 199.99,
    duration: '18h',
    lectures: 110,
    level: 'Intermediate',
    category: 'Design',
    tags: ['Figma', 'React', 'Design Systems', 'CSS'],
    bestseller: false,
    updated: 'Feb 2024',
    emoji: '🖌️',
    color: 'from-fuchsia-500 to-pink-600',
  },
  {
    id: 11,
    title: 'Full Stack JavaScript — MERN Stack',
    subtitle: 'Build complete web apps with MongoDB, Express, React, and Node.js',
    instructor: 'David Kim',
    rating: 4.8,
    reviews: 52000,
    students: 39800,
    price: 109.99,
    originalPrice: 499.99,
    duration: '40h',
    lectures: 260,
    level: 'Intermediate',
    category: 'Web Development',
    tags: ['MongoDB', 'Express', 'React', 'Node.js', 'JavaScript'],
    bestseller: true,
    updated: 'Mar 2024',
    emoji: '🔥',
    color: 'from-yellow-500 to-orange-500',
  },
  {
    id: 12,
    title: 'Flutter & Dart — Cross-Platform Mobile',
    subtitle: 'Build beautiful iOS and Android apps with Flutter and Dart',
    instructor: 'Sarah Anderson',
    rating: 4.6,
    reviews: 28900,
    students: 21300,
    price: 84.99,
    originalPrice: 349.99,
    duration: '30h',
    lectures: 190,
    level: 'Beginner',
    category: 'Mobile Development',
    tags: ['Flutter', 'Dart', 'iOS', 'Android', 'Mobile'],
    bestseller: false,
    updated: 'Jan 2024',
    emoji: '🦋',
    color: 'from-sky-400 to-blue-500',
  },
];

const CATEGORIES = ['All', 'Web Development', 'Data Science', 'Design', 'Mobile Development', 'Cloud & DevOps', 'Marketing', 'Cybersecurity'];
const LEVELS = ['All Levels', 'Beginner', 'Intermediate', 'Advanced'];
const SORT_OPTIONS = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
];

function formatNumber(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(0) + 'K';
  return n.toString();
}

function StarRow({ rating, size = 14 }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          size={size}
          className="text-yellow-400"
          fill={i <= Math.round(rating) ? 'currentColor' : 'none'}
        />
      ))}
    </span>
  );
}

function CourseCard({ course, onClick }) {
  return (
    <div
      onClick={onClick}
      className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col"
    >
      {/* Thumbnail */}
      <div className={`relative h-44 bg-gradient-to-br ${course.color} flex items-center justify-center`}>
        <span className="text-6xl select-none">{course.emoji}</span>
        {course.bestseller && (
          <span className="absolute top-3 left-3 bg-yellow-400 text-black text-xs font-bold px-2 py-0.5 rounded">
            Bestseller
          </span>
        )}
        <span className="absolute top-3 right-3 bg-black/30 text-white text-xs font-semibold px-2 py-0.5 rounded backdrop-blur-sm">
          {course.level}
        </span>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-bold text-gray-900 text-sm leading-snug mb-1 line-clamp-2 group-hover:text-purple-700 transition-colors">
          {course.title}
        </h3>
        <p className="text-xs text-gray-500 mb-1 line-clamp-1">{course.subtitle}</p>
        <p className="text-xs text-gray-600 mb-2">by {course.instructor}</p>

        <div className="flex items-center gap-1.5 mb-2">
          <span className="font-bold text-amber-600 text-sm">{course.rating}</span>
          <StarRow rating={course.rating} />
          <span className="text-xs text-gray-500">({formatNumber(course.reviews)})</span>
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
          <span className="flex items-center gap-1"><Clock size={11} />{course.duration}</span>
          <span className="flex items-center gap-1"><BookOpen size={11} />{course.lectures} lectures</span>
          <span className="flex items-center gap-1"><Users size={11} />{formatNumber(course.students)}</span>
        </div>

        <div className="flex flex-wrap gap-1 mb-3">
          {course.tags.slice(0, 3).map(tag => (
            <span key={tag} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{tag}</span>
          ))}
        </div>

        <div className="mt-auto flex items-center gap-2">
          <span className="text-lg font-bold text-gray-900">${course.price}</span>
          <span className="text-sm text-gray-400 line-through">${course.originalPrice}</span>
          <span className="ml-auto text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded">
            {Math.round((1 - course.price / course.originalPrice) * 100)}% off
          </span>
        </div>
      </div>
    </div>
  );
}

export default function CoursesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [level, setLevel] = useState('All Levels');
  const [sort, setSort] = useState('popular');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  const filtered = useMemo(() => {
    let list = [...ALL_COURSES];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.title.toLowerCase().includes(q) ||
        c.subtitle.toLowerCase().includes(q) ||
        c.tags.some(t => t.toLowerCase().includes(q)) ||
        c.instructor.toLowerCase().includes(q)
      );
    }
    if (category !== 'All') list = list.filter(c => c.category === category);
    if (level !== 'All Levels') list = list.filter(c => c.level === level);

    switch (sort) {
      case 'rating':    list.sort((a, b) => b.rating - a.rating); break;
      case 'newest':    list.sort((a, b) => b.id - a.id); break;
      case 'price-low': list.sort((a, b) => a.price - b.price); break;
      case 'price-high':list.sort((a, b) => b.price - a.price); break;
      default:          list.sort((a, b) => b.students - a.students); break;
    }
    return list;
  }, [search, category, level, sort]);

  const handleNavigate = (path) => { setMobileMenuOpen(false); navigate(path); };

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      {/* ── HEADER ── */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <button className="lg:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <button
            onClick={() => handleNavigate('/')}
            className="text-2xl font-bold text-gray-900 hover:text-purple-600 transition bg-transparent border-none cursor-pointer p-0 shrink-0"
          >
            Courseify
          </button>

          <nav className="hidden lg:flex items-center gap-6 ml-4">
            <button onClick={() => handleNavigate('/courses')} className="text-purple-600 font-semibold bg-transparent border-none cursor-pointer p-0">Courses</button>
            <button onClick={() => handleNavigate('/instructor')} className="text-gray-600 hover:text-gray-900 bg-transparent border-none cursor-pointer p-0 font-medium">Instructors</button>
            <button onClick={() => handleNavigate('/')} className="text-gray-600 hover:text-gray-900 bg-transparent border-none cursor-pointer p-0 font-medium">About</button>
          </nav>

          {/* Search bar */}
          <div className="flex-1 max-w-xl mx-4 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search courses, topics, instructors…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
            />
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

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <>
            <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setMobileMenuOpen(false)} />
            <div className="fixed top-0 left-0 h-full w-64 bg-gray-900 z-50 p-4 space-y-2">
              <div className="flex justify-end mb-4">
                <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-white bg-transparent border-none cursor-pointer"><X size={22} /></button>
              </div>
              {['/', '/courses', '/instructor'].map((path, i) => (
                <button key={i} onClick={() => handleNavigate(path)} className="block text-white w-full text-left p-3 rounded hover:bg-gray-800 bg-transparent border-none cursor-pointer font-medium">
                  {['Home', 'Courses', 'Instructors'][i]}
                </button>
              ))}
            </div>
          </>
        )}
      </header>

      {/* ── HERO BANNER ── */}
      <div className="bg-gradient-to-r from-gray-900 via-purple-950 to-gray-900 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <p className="text-purple-300 text-sm font-semibold uppercase tracking-widest mb-2">Learning Hub</p>
          <h1 className="text-4xl lg:text-5xl font-extrabold mb-3">All Courses</h1>
          <p className="text-gray-300 text-lg max-w-2xl">
            Explore {ALL_COURSES.length} expert-led courses across web development, data science, design, and more.
          </p>
          {/* Quick stats */}
          <div className="flex flex-wrap gap-6 mt-6">
            {[
              { icon: BookOpen, label: `${ALL_COURSES.length} Courses` },
              { icon: Users, label: '500K+ Students' },
              { icon: Star, label: '4.7 Avg Rating' },
              { icon: Zap, label: 'Lifetime Access' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-sm text-gray-300">
                <Icon size={16} className="text-purple-400" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FILTERS BAR ── */}
      <div className="bg-white border-b border-gray-200 sticky top-[72px] z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3">
          {/* Category pills */}
          <div className="hidden lg:flex items-center gap-2 flex-wrap flex-1">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer ${
                  category === cat
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-purple-400 hover:text-purple-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Mobile filter toggle */}
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className="lg:hidden flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition bg-white cursor-pointer"
          >
            <Filter size={14} />
            Filters
            {(category !== 'All' || level !== 'All Levels') && (
              <span className="bg-purple-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {(category !== 'All' ? 1 : 0) + (level !== 'All Levels' ? 1 : 0)}
              </span>
            )}
          </button>

          {/* Level select */}
          <div className="relative">
            <select
              value={level}
              onChange={e => setLevel(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              {LEVELS.map(l => <option key={l}>{l}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Sort select */}
          <div className="relative ml-auto">
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Mobile expanded filters */}
        {filterOpen && (
          <div className="lg:hidden px-4 pb-3 space-y-3 border-t border-gray-100 pt-3">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Category</p>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => { setCategory(cat); setFilterOpen(false); }}
                    className={`px-3 py-1 rounded-full text-xs font-semibold border transition cursor-pointer ${
                      category === cat ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-700 border-gray-300'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── MAIN CONTENT ── */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Results count + active filters */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <p className="text-gray-600 text-sm">
              <span className="font-bold text-gray-900">{filtered.length}</span> {filtered.length === 1 ? 'course' : 'courses'} found
              {search && <span> for "<span className="font-semibold text-purple-700">{search}</span>"</span>}
            </p>
            {/* Active filter badges */}
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

        {filtered.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-6xl mb-4">🔍</p>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No courses found</h2>
            <p className="text-gray-500 mb-6">Try adjusting your search or filters</p>
            <button
              onClick={() => { setSearch(''); setCategory('All'); setLevel('All Levels'); }}
              className="px-6 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition border-none cursor-pointer"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map(course => (
              <CourseCard
                key={course.id}
                course={course}
                onClick={() => navigate(`/course/${course.id}`)}
              />
            ))}
          </div>
        )}
      </main>

      {/* ── FOOTER ── */}
      <footer className="bg-gray-900 text-gray-300 py-10 mt-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
            {[
              { title: 'Courseify', links: ['Press', 'Contact'] },
              { title: 'Instructors', links: ['Teach', 'Resources', 'Benefits'] },
              { title: 'Learning', links: ['Categories', 'Trending', 'Collections'] },
              { title: 'Support', links: ['Help', 'Support', 'FAQ'] },
              { title: 'Legal', links: ['Privacy', 'Terms', 'Cookies'] },
            ].map(col => (
              <div key={col.title}>
                <h3 className="font-bold text-white mb-3 text-sm">{col.title}</h3>
                <ul className="space-y-2">
                  {col.links.map(link => (
                    <li key={link}>
                      <button onClick={() => navigate('/')} className="text-gray-400 hover:text-white text-sm bg-transparent border-none cursor-pointer p-0 transition">
                        {link}
                      </button>
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
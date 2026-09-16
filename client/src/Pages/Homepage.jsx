// src/Pages/HomePage.jsx
// ─── Home Page ──────────────────────────────────────────────────────────────
// Follows the same branding as the course landing page (Shopify.jsx): cream
// background, dark hero, burnt-orange accent, Playfair Display + DM Sans.
// Shows: hero, courses grid (live from CoursesContext), and a services
// showcase that links through to ServicesPage.jsx.
//
// The header below includes a "Services" nav link. The same link needs
// adding to Shopify.jsx's header so it's reachable from the course page too
// — see SHOPIFY_NAV_PATCH.md for the exact snippet (that file is huge, so
// I didn't regenerate the whole thing for a one-line nav addition).
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X, Search, Star, ArrowRight, Megaphone, ShoppingBag, Target, TrendingUp } from 'lucide-react';
import { useCourses } from '../context/CoursesContext';
import { useAuth } from '../context/AuthContext';

function formatNumber(num) {
  if (!num) return '0';
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
  return String(num);
}

// EDIT ME: the two placeholder entries are marked below — swap in your real
// third/fourth service (or remove them) once you confirm what they are.
const SERVICES = [
  {
    icon: Megaphone,
    title: 'Digital Marketing',
    description: 'Facebook, Instagram & Google Ads campaigns built and managed to actually convert — not just get clicks.',
  },
  {
    icon: ShoppingBag,
    title: 'E-Commerce Store Setup',
    description: 'Shopify store setup, product listings, and checkout optimization for brands ready to sell online.',
  },
  {
    icon: Target,
    title: 'Brand Strategy & Positioning',
    description: 'Positioning, messaging, and a content direction that makes your brand memorable in a crowded market.',
    placeholder: true,
  },
  {
    icon: TrendingUp,
    title: 'Paid Ads Management',
    description: 'Full-funnel ad management across platforms, with reporting that shows exactly what your spend is doing.',
    placeholder: true,
  },
];

function CourseCard({ course, onClick }) {
  return (
    <div onClick={onClick} className="bg-white border border-[#ece6dd] rounded-2xl overflow-hidden hover:shadow-lg transition cursor-pointer group">
      <div className="h-36 md:h-44 bg-[#f0ebe3] flex items-center justify-center relative overflow-hidden">
        {course.thumbnail ? (
          <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <span className="text-5xl md:text-6xl">{course.emoji || '📚'}</span>
        )}
        {course.bestseller && (
          <span className="absolute top-3 left-3 bg-[#f9c97a] text-[#7a4a00] font-bold px-2.5 py-1 rounded text-xs">Bestseller</span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-bold text-[#1a1208] text-sm md:text-base mb-2 line-clamp-2 group-hover:text-[#e8540a] transition">{course.title}</h3>
        <p className="text-xs md:text-sm text-[#9e9789] mb-2">{course.instructor || 'Instructor'}</p>
        {course.rating > 0 && (
          <div className="flex items-center gap-1 mb-2">
            <span className="font-bold text-sm text-[#1a1208]">{course.rating}</span>
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={12} className="text-[#f9c97a]" fill={i < Math.round(course.rating) ? 'currentColor' : 'none'} />
              ))}
            </div>
            <span className="text-xs text-[#9e9789]">({formatNumber(course.reviews)})</span>
          </div>
        )}
        <p className="text-base md:text-lg font-bold text-[#1a1208]" style={{ fontFamily: "'Playfair Display', serif" }}>PKR {course.price}</p>
      </div>
    </div>
  );
}

function ServiceCard({ service, onClick }) {
  const Icon = service.icon;
  return (
    <div onClick={onClick} className="bg-white border border-[#ece6dd] rounded-2xl p-6 hover:shadow-lg hover:border-[#ddd5c4] transition cursor-pointer group relative">
      {service.placeholder && (
        <span className="absolute top-3 right-3 text-[9px] font-bold uppercase tracking-wide bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Placeholder</span>
      )}
      <div className="w-12 h-12 rounded-xl bg-[#fdf0e4] flex items-center justify-center mb-4 group-hover:bg-[#e8540a] transition-colors">
        <Icon size={22} className="text-[#e8540a] group-hover:text-white transition-colors" />
      </div>
      <h3 className="font-bold text-[#1a1208] text-base md:text-lg mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>{service.title}</h3>
      <p className="text-sm text-[#6b5e4e] leading-relaxed mb-3">{service.description}</p>
      <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#e8540a] group-hover:gap-2 transition-all">
        Learn more <ArrowRight size={14} />
      </span>
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const { courses } = useCourses();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const featuredCourses = useMemo(
    () => courses.filter((c) => c.status === 'published').slice(0, 8),
    [courses]
  );

  const handleNavigate = (path) => { setMobileMenuOpen(false); navigate(path); };

  return (
    <div className="min-h-screen bg-[#FDFAF6] overflow-x-hidden w-full" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white shadow-sm w-full border-b border-[#ece6dd]">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-3 md:py-4 flex items-center justify-between">
          <button className="lg:hidden p-2 -ml-2 bg-transparent border-none cursor-pointer text-[#1a1208]" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle navigation menu">
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className="absolute left-1/2 transform -translate-x-1/2 lg:relative lg:left-auto lg:transform-none">
            <button onClick={() => handleNavigate('/')} className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-[#1a1208] cursor-pointer hover:opacity-80 transition bg-transparent border-none p-0" style={{ fontFamily: "'Playfair Display', serif" }}>
              Ler<span className="text-[#e8540a]">ni</span>
            </button>
          </div>
          <nav className="hidden lg:flex items-center gap-8 flex-1 ml-12">
            <button onClick={() => handleNavigate('/courses')} className="text-base text-[#3d3020] hover:text-[#e8540a] transition bg-transparent border-none cursor-pointer p-0 font-medium">Courses</button>
            <button onClick={() => handleNavigate('/services')} className="text-base text-[#3d3020] hover:text-[#e8540a] transition bg-transparent border-none cursor-pointer p-0 font-medium">Services</button>
            <button onClick={() => handleNavigate('/instructor')} className="text-base text-[#3d3020] hover:text-[#e8540a] transition bg-transparent border-none cursor-pointer p-0 font-medium">Instructor</button>
          </nav>
          <div className="flex items-center gap-2 md:gap-3">
            <Search className="hidden lg:block text-[#9e9789] cursor-pointer hover:text-[#1a1208] transition" size={22} />
            {!user && (
              <button onClick={() => handleNavigate('/auth/login')} className="px-4 md:px-6 py-2 md:py-2.5 bg-[#e8540a] text-white rounded-lg hover:bg-[#c94708] transition font-semibold border-none cursor-pointer text-sm md:text-base shadow-sm">Log In</button>
            )}
          </div>
        </div>
        {mobileMenuOpen && (
          <>
            <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
            <div className="fixed top-0 left-0 h-full w-64 bg-[#1a1208] z-50 lg:hidden shadow-2xl">
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>Menu</span>
                  <button onClick={() => setMobileMenuOpen(false)} className="p-2 hover:bg-white/10 rounded-lg transition bg-transparent border-none cursor-pointer text-white"><X size={24} /></button>
                </div>
                <button onClick={() => handleNavigate('/courses')} className="block w-full text-left text-white hover:text-[#f0a070] bg-transparent border-none cursor-pointer p-3 rounded-lg hover:bg-white/5 font-medium transition text-base">Courses</button>
                <button onClick={() => handleNavigate('/services')} className="block w-full text-left text-white hover:text-[#f0a070] bg-transparent border-none cursor-pointer p-3 rounded-lg hover:bg-white/5 font-medium transition text-base">Services</button>
                <button onClick={() => handleNavigate('/instructor')} className="block w-full text-left text-white hover:text-[#f0a070] bg-transparent border-none cursor-pointer p-3 rounded-lg hover:bg-white/5 font-medium transition text-base">Instructor</button>
              </div>
            </div>
          </>
        )}
      </header>

      {/* HERO */}
      <section className="w-full bg-[#1a1208] text-white py-14 md:py-20 lg:py-28 overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 lg:px-6 text-center">
          <p className="text-[#f9c97a] font-semibold text-sm md:text-base mb-4">Digital Marketing &amp; E-Commerce, taught by practitioners</p>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-5 leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
            Learn what actually grows a business online
          </h1>
          <p className="text-lg md:text-xl text-[#c8bfaf] mb-8 max-w-2xl mx-auto leading-relaxed">
            Courses and hands-on services in digital marketing and e-commerce — trusted by 60,000+ students.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => handleNavigate('/courses')} className="px-7 py-3.5 bg-[#e8540a] hover:bg-[#c94708] text-white rounded-xl font-bold transition border-none cursor-pointer text-base shadow-lg">
              Browse Courses
            </button>
            <button onClick={() => handleNavigate('/services')} className="px-7 py-3.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition border border-white/20 cursor-pointer text-base backdrop-blur-sm">
              Explore Services
            </button>
          </div>
        </div>
      </section>

      {/* COURSES */}
      <section className="w-full bg-white py-12 md:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="flex items-end justify-between mb-8 flex-wrap gap-3">
            <div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#1a1208] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>Our Courses</h2>
              <p className="text-[#9e9789] text-sm md:text-base">Practical, project-based, taught in Urdu</p>
            </div>
            <button onClick={() => handleNavigate('/courses')} className="text-[#e8540a] hover:text-[#c94708] font-semibold text-sm md:text-base bg-transparent border-none cursor-pointer flex items-center gap-1">
              View all <ArrowRight size={16} />
            </button>
          </div>
          {featuredCourses.length === 0 ? (
            <p className="text-[#9e9789] text-center py-12">Courses are on their way — check back soon.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {featuredCourses.map((c) => (
                <CourseCard key={c._id} course={c} onClick={() => navigate(`/course/${c._id}`)} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* SERVICES */}
      <section className="w-full bg-[#f8f4ed] py-12 md:py-16 lg:py-20 border-t border-[#ece6dd]">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="flex items-end justify-between mb-8 flex-wrap gap-3">
            <div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#1a1208] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>Our Services</h2>
              <p className="text-[#9e9789] text-sm md:text-base">Done-for-you work, for brands who'd rather we handle it</p>
            </div>
            <button onClick={() => handleNavigate('/services')} className="text-[#e8540a] hover:text-[#c94708] font-semibold text-sm md:text-base bg-transparent border-none cursor-pointer flex items-center gap-1">
              View all services <ArrowRight size={16} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {SERVICES.map((s) => (
              <ServiceCard key={s.title} service={s} onClick={() => handleNavigate('/services')} />
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#1a1208] text-[#9e8e7a] py-8 md:py-12 w-full border-t border-[#2d2416]">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 md:gap-8 mb-8 md:mb-12">
            {[
              { title: 'Lerni', links: ['About', 'Press', 'Contact', 'Careers'] },
              { title: 'Community', links: ['Learners', 'Partners', 'Developers', 'Beta Testers'] },
              { title: 'Teaching', links: ['Become Instructor', 'Teaching Center', 'Resources'] },
              { title: 'Services', links: ['Digital Marketing', 'E-Commerce Setup', 'Brand Strategy', 'Paid Ads'] },
              { title: 'Support', links: ['Help Center', 'Get the App', 'FAQ', 'Accessibility'] },
              { title: 'Legal', links: ['Terms', 'Privacy Policy', 'Cookie Settings', 'Sitemap'] },
            ].map((col) => (
              <div key={col.title}>
                <h3 className="font-bold text-[#f9c97a] mb-3 md:mb-4 text-xs md:text-sm uppercase tracking-wide">{col.title}</h3>
                <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm">
                  {col.links.map((link) => (
                    <li key={link}><button onClick={() => handleNavigate(col.title === 'Services' ? '/services' : '/')} className="hover:text-white transition bg-transparent border-none cursor-pointer text-[#9e8e7a] p-0">{link}</button></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center pt-6 md:pt-8 border-t border-[#2d2416]">
            <button onClick={() => handleNavigate('/')} className="text-xl md:text-2xl font-extrabold text-white cursor-pointer hover:opacity-80 transition bg-transparent border-none p-0 mb-4 md:mb-0" style={{ fontFamily: "'Playfair Display', serif" }}>
              Ler<span className="text-[#f9c97a]">ni</span>
            </button>
            <p className="text-xs md:text-sm text-[#6b5e4e]">© 2024 Lerni, Inc. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
// src/Pages/ThankYouPage.jsx
// ─────────────────────────────────────────────────────────────────────────────
// THANK YOU PAGE — shown right after "Confirm Enrollment" on EnrolledPage.jsx,
// for both a guest who just created an account and a returning student who was
// already logged in. Same header/footer/branding as the rest of the site.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, Menu, X, Search } from 'lucide-react';

export default function ThankYouPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const courseTitle = location.state?.courseTitle || '';
  const handleNavigate = (path) => { setMobileMenuOpen(false); navigate(path); };

  return (
    <div className="min-h-screen bg-[#FDFAF6] overflow-x-hidden w-full flex flex-col" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* HEADER — identical to the course landing page */}
      <header className="sticky top-0 z-40 bg-white shadow-sm w-full border-b border-[#ece6dd]">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-3 md:py-4 flex items-center justify-between">
          <button
            className="lg:hidden p-2 -ml-2 bg-transparent border-none cursor-pointer text-[#1a1208]"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className="absolute left-1/2 transform -translate-x-1/2 lg:relative lg:left-auto lg:transform-none">
            <button onClick={() => handleNavigate('/')}
              className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-[#1a1208] cursor-pointer hover:opacity-80 transition bg-transparent border-none p-0"
              style={{ fontFamily: "'Playfair Display', serif" }}>
              Ler<span className="text-[#e8540a]">ni</span>
            </button>
          </div>
          <nav className="hidden lg:flex items-center gap-8 flex-1 ml-12">
            <button onClick={() => handleNavigate('/courses')} className="text-base text-[#3d3020] hover:text-[#e8540a] transition bg-transparent border-none cursor-pointer p-0 font-medium">Categories</button>
            <button onClick={() => handleNavigate('/instructor')} className="text-base text-[#3d3020] hover:text-[#e8540a] transition bg-transparent border-none cursor-pointer p-0 font-medium">Instructor</button>
            <button onClick={() => handleNavigate('/courses')} className="text-base text-[#3d3020] hover:text-[#e8540a] transition bg-transparent border-none cursor-pointer p-0 font-medium">About</button>
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
                <button onClick={() => handleNavigate('/courses')} className="block w-full text-left text-white hover:text-[#f0a070] bg-transparent border-none cursor-pointer p-3 rounded-lg hover:bg-white/5 font-medium transition text-base">Categories</button>
                <button onClick={() => handleNavigate('/instructor')} className="block w-full text-left text-white hover:text-[#f0a070] bg-transparent border-none cursor-pointer p-3 rounded-lg hover:bg-white/5 font-medium transition text-base">Instructor</button>
              </div>
            </div>
          </>
        )}
      </header>

      {/* MAIN */}
      <main className="flex-1 max-w-2xl mx-auto px-4 lg:px-6 py-14 md:py-20 w-full flex flex-col items-center text-center">
        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-[#fdf2ea] flex items-center justify-center mb-6">
          <CheckCircle2 size={40} className="text-[#e8540a]" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-[#1a1208] mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
          Thanks for Enrolling{courseTitle ? ` in ${courseTitle}` : ' in Our Course'}!
        </h1>
        <p className="text-[#6b5e4e] text-sm md:text-base leading-relaxed max-w-md">
          Please wait while our team confirms your payment. Once it's confirmed, you'll receive your
          portal login details so you can start learning.
        </p>

        <div className="mt-8 w-full border border-[#ece6dd] rounded-2xl bg-white p-5 md:p-6 text-left">
          <p className="text-sm font-bold text-[#1a1208] mb-2">What happens next?</p>
          <ul className="space-y-2 text-sm text-[#6b5e4e]">
            <li className="flex items-start gap-2"><span className="text-[#e8540a] font-bold">1.</span> Our team verifies your payment screenshot.</li>
            <li className="flex items-start gap-2"><span className="text-[#e8540a] font-bold">2.</span> You'll get a confirmation message on WhatsApp.</li>
            <li className="flex items-start gap-2"><span className="text-[#e8540a] font-bold">3.</span> Your portal access is activated for this course.</li>
          </ul>
        </div>

        <button
          onClick={() => handleNavigate('/courses')}
          className="mt-8 px-6 py-3 bg-[#e8540a] hover:bg-[#c94708] text-white rounded-xl font-bold transition border-none cursor-pointer"
        >
          Browse More Courses
        </button>
      </main>

      {/* FOOTER — identical to the course landing page */}
      <footer className="bg-[#1a1208] text-[#9e8e7a] py-8 md:py-12 w-full border-t border-[#2d2416]">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 md:gap-8 mb-8 md:mb-12">
            {[
              { title: 'Lerni',     links: ['About', 'Press', 'Contact', 'Careers'] },
              { title: 'Community', links: ['Learners', 'Partners', 'Developers', 'Beta Testers'] },
              { title: 'Teaching',  links: ['Become Instructor', 'Teaching Center', 'Resources'] },
              { title: 'Programs',  links: ['Enterprise', 'Government', 'Lerni Business'] },
              { title: 'Support',   links: ['Help Center', 'Get the App', 'FAQ', 'Accessibility'] },
              { title: 'Legal',     links: ['Terms', 'Privacy Policy', 'Cookie Settings', 'Sitemap'] },
            ].map(col => (
              <div key={col.title}>
                <h3 className="font-bold text-[#f9c97a] mb-3 md:mb-4 text-xs md:text-sm uppercase tracking-wide">{col.title}</h3>
                <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm">
                  {col.links.map(link => (
                    <li key={link}><button onClick={() => handleNavigate('/')} className="hover:text-white transition bg-transparent border-none cursor-pointer text-[#9e8e7a] p-0">{link}</button></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center pt-6 md:pt-8 border-t border-[#2d2416]">
            <button onClick={() => handleNavigate('/')}
              className="text-xl md:text-2xl font-extrabold text-white cursor-pointer hover:opacity-80 transition bg-transparent border-none p-0 mb-4 md:mb-0"
              style={{ fontFamily: "'Playfair Display', serif" }}>
              Ler<span className="text-[#f9c97a]">ni</span>
            </button>
            <p className="text-xs md:text-sm text-[#6b5e4e]">© 2024 Lerni, Inc. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
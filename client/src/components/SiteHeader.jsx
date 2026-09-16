// src/components/SiteHeader.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Shared site header — now the SAME real header used on the course landing
// page (Shopify.jsx) / HomePage.jsx / ServicesPage.jsx: hamburger + nav links
// on the left, centered logo, search icon + Log In button on the right, plus
// the slide-out mobile drawer. Previously this was a stripped-down version
// (logo + two links only); the About / Privacy Policy / Return Policy /
// Contact Us pages render <SiteHeader /> with no props, so swapping this
// file's contents is all that's needed to bring all four pages in line with
// the rest of the site — no changes needed in those page files.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function SiteHeader() {
  const navigate = useNavigate();
  const { API: api } = useAuth();
  const [siteLogoUrl, setSiteLogoUrl] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    api.get('/settings')
      .then((res) => setSiteLogoUrl(res.data?.logoUrl || ''))
      .catch(() => {}); // logo is optional — falls back to the text wordmark
  }, [api]);

  const handleNavigate = (path) => { setMobileMenuOpen(false); navigate(path); };

  return (
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
            className="cursor-pointer hover:opacity-80 transition bg-transparent border-none p-0 flex items-center"
            style={{ fontFamily: "'Playfair Display', serif" }}>
            {siteLogoUrl ? (
              <img src={siteLogoUrl} alt="Logo" className="h-14 md:h-16 lg:h-20 w-auto object-contain" />
            ) : (
              <span className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-[#1a1208]">
                Ler<span className="text-[#e8540a]">ni</span>
              </span>
            )}
          </button>
        </div>
        <nav className="hidden lg:flex items-center gap-8 flex-1 ml-12">
          <button onClick={() => handleNavigate('/')} className="text-base text-[#3d3020] hover:text-[#e8540a] transition bg-transparent border-none cursor-pointer p-0 font-medium">Home</button>
          <button onClick={() => handleNavigate('/courses')} className="text-base text-[#3d3020] hover:text-[#e8540a] transition bg-transparent border-none cursor-pointer p-0 font-medium">Categories</button>
          <button onClick={() => handleNavigate('/services')} className="text-base text-[#3d3020] hover:text-[#e8540a] transition bg-transparent border-none cursor-pointer p-0 font-medium">Services</button>
          <button onClick={() => handleNavigate('/instructor')} className="text-base text-[#3d3020] hover:text-[#e8540a] transition bg-transparent border-none cursor-pointer p-0 font-medium">Instructor</button>
          <button onClick={() => handleNavigate('/about')} className="text-base text-[#3d3020] hover:text-[#e8540a] transition bg-transparent border-none cursor-pointer p-0 font-medium">About</button>
        </nav>
        <div className="flex items-center gap-2 md:gap-3">
          <Search className="hidden lg:block text-[#9e9789] cursor-pointer hover:text-[#1a1208] transition" size={22} />
          <button onClick={() => handleNavigate('/auth/login')} className="px-4 md:px-6 py-2 md:py-2.5 bg-[#e8540a] text-white rounded-lg hover:bg-[#c94708] transition font-semibold border-none cursor-pointer text-sm md:text-base shadow-sm">Log In</button>
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
              <button onClick={() => handleNavigate('/')} className="block w-full text-left text-white hover:text-[#f0a070] bg-transparent border-none cursor-pointer p-3 rounded-lg hover:bg-white/5 font-medium transition text-base">Home</button>
              <button onClick={() => handleNavigate('/courses')} className="block w-full text-left text-white hover:text-[#f0a070] bg-transparent border-none cursor-pointer p-3 rounded-lg hover:bg-white/5 font-medium transition text-base">Categories</button>
              <button onClick={() => handleNavigate('/services')} className="block w-full text-left text-white hover:text-[#f0a070] bg-transparent border-none cursor-pointer p-3 rounded-lg hover:bg-white/5 font-medium transition text-base">Services</button>
              <button onClick={() => handleNavigate('/instructor')} className="block w-full text-left text-white hover:text-[#f0a070] bg-transparent border-none cursor-pointer p-3 rounded-lg hover:bg-white/5 font-medium transition text-base">Instructor</button>
              <button onClick={() => handleNavigate('/about')} className="block w-full text-left text-white hover:text-[#f0a070] bg-transparent border-none cursor-pointer p-3 rounded-lg hover:bg-white/5 font-medium transition text-base">About</button>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
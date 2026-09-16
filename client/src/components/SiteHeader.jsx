// src/components/SiteHeader.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Minimal shared header for the new content pages (About / Privacy Policy /
// Return Policy / Contact Us) — logo (from Super Admin → Settings, falling
// back to the "Lerni" text wordmark) + Home/Courses links. Same colors/font
// as the header already used on HomePage.jsx / ServicesPage.jsx / Shopify.jsx,
// just without their full mega-menu since these are simple content pages.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function SiteHeader() {
  const navigate = useNavigate();
  const { API: api } = useAuth();
  const [siteLogoUrl, setSiteLogoUrl] = useState('');

  useEffect(() => {
    api.get('/settings')
      .then((res) => setSiteLogoUrl(res.data?.logoUrl || ''))
      .catch(() => {});
  }, [api]);

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm w-full border-b border-[#ece6dd]">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 h-16 md:h-20 flex items-center justify-between">
        <button onClick={() => navigate('/')}
          className="cursor-pointer hover:opacity-80 transition bg-transparent border-none p-0 flex items-center"
          style={{ fontFamily: "'Playfair Display', serif" }}>
          {siteLogoUrl ? (
            <img src={siteLogoUrl} alt="Logo" className="h-9 md:h-11 w-auto object-contain" />
          ) : (
            <span className="text-2xl md:text-3xl font-extrabold text-[#1a1208]">Ler<span className="text-[#e8540a]">ni</span></span>
          )}
        </button>
        <nav className="flex items-center gap-6">
          <button onClick={() => navigate('/')} className="text-sm md:text-base text-[#3d3020] hover:text-[#e8540a] transition bg-transparent border-none cursor-pointer p-0 font-medium">Home</button>
          <button onClick={() => navigate('/courses')} className="text-sm md:text-base text-[#3d3020] hover:text-[#e8540a] transition bg-transparent border-none cursor-pointer p-0 font-medium">Courses</button>
        </nav>
      </div>
    </header>
  );
}
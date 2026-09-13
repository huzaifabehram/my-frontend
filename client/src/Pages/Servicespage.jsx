// src/Pages/ServicesPage.jsx
// ─── Services Page ──────────────────────────────────────────────────────────
// Same branding as HomePage.jsx / Shopify.jsx. Reached from the "Services"
// nav link in the header (added here, in HomePage.jsx, and — via the patch
// in SHOPIFY_NAV_PATCH.md — in the course landing page too).
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X, Search, Check, ArrowRight, Megaphone, ShoppingBag, Target, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// EDIT ME: the two placeholder entries need your real scope/features —
// everything else here (icons, layout, "Get a quote" link) will just work
// once you swap the text.
const SERVICES = [
  {
    icon: Megaphone,
    title: 'Digital Marketing',
    description: "End-to-end campaign management across Facebook, Instagram, and Google — built around what actually drives sales, not vanity metrics.",
    features: ['Ad strategy & creative direction', 'Facebook & Instagram Ads management', 'Google Ads (Search & Shopping)', 'Monthly performance reporting'],
  },
  {
    icon: ShoppingBag,
    title: 'E-Commerce Startup',
    description: 'From zero to a live store: Shopify setup, product listings, and a checkout flow built to convert visitors into customers.',
    features: ['Shopify store setup & theme customization', 'Product listing & catalog structure', 'Checkout & payment gateway setup', 'Launch support'],
  },
  {
    icon: Target,
    title: 'Brand Strategy & Positioning',
    description: "Placeholder service — tell me the real scope and I'll fill this in with your actual offering.",
    features: ['Positioning & messaging', 'Visual identity direction', 'Content pillars'],
    placeholder: true,
  },
  {
    icon: TrendingUp,
    title: 'Paid Ads Management',
    description: "Placeholder service — tell me the real scope and I'll fill this in with your actual offering.",
    features: ['Full-funnel ad management', 'Creative testing', 'Weekly optimization'],
    placeholder: true,
  },
];

function ServiceRow({ service }) {
  const Icon = service.icon;
  return (
    <div className="border border-[#ece6dd] rounded-2xl bg-white p-6 md:p-8 flex flex-col md:flex-row gap-6 md:gap-8">
      <div className="flex-shrink-0">
        <div className="w-14 h-14 rounded-2xl bg-[#fdf0e4] flex items-center justify-center">
          <Icon size={26} className="text-[#e8540a]" />
        </div>
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <h3 className="text-xl md:text-2xl font-bold text-[#1a1208]" style={{ fontFamily: "'Playfair Display', serif" }}>{service.title}</h3>
          {service.placeholder && (
            <span className="text-[10px] font-bold uppercase tracking-wide bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Placeholder</span>
          )}
        </div>
        <p className="text-[#6b5e4e] text-sm md:text-base leading-relaxed mb-4">{service.description}</p>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
          {service.features.map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm text-[#3d3020]">
              <Check size={16} className="text-[#e8540a] flex-shrink-0 mt-0.5" />
              {f}
            </li>
          ))}
        </ul>
        <a href="#get-in-touch" className="inline-flex items-center gap-1.5 text-sm font-bold text-[#e8540a] hover:text-[#c94708] transition">
          Get a quote <ArrowRight size={15} />
        </a>
      </div>
    </div>
  );
}

export default function ServicesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Route changes don't auto-scroll to top in React Router — this makes sure
  // clicking "Services" from anywhere lands at the top of this page.
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const handleNavigate = (path) => { setMobileMenuOpen(false); navigate(path); };

  return (
    <div className="min-h-screen bg-[#FDFAF6] overflow-x-hidden w-full" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* HEADER — same as HomePage.jsx, "Services" shown active */}
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
            <button onClick={() => handleNavigate('/services')} className="text-base text-[#e8540a] transition bg-transparent border-none cursor-pointer p-0 font-bold">Services</button>
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
                <button onClick={() => handleNavigate('/services')} className="block w-full text-left text-[#f0a070] bg-transparent border-none cursor-pointer p-3 rounded-lg hover:bg-white/5 font-bold transition text-base">Services</button>
                <button onClick={() => handleNavigate('/instructor')} className="block w-full text-left text-white hover:text-[#f0a070] bg-transparent border-none cursor-pointer p-3 rounded-lg hover:bg-white/5 font-medium transition text-base">Instructor</button>
              </div>
            </div>
          </>
        )}
      </header>

      {/* HERO */}
      <section className="w-full bg-[#1a1208] text-white py-12 md:py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 lg:px-6 text-center">
          <p className="text-[#f9c97a] font-semibold text-sm md:text-base mb-3">Done-for-you</p>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
            Our Services
          </h1>
          <p className="text-base md:text-lg text-[#c8bfaf] max-w-xl mx-auto leading-relaxed">
            For brands that would rather we do the work than teach you how. Same team behind the courses.
          </p>
        </div>
      </section>

      {/* SERVICES LIST */}
      <section className="w-full bg-white py-12 md:py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 lg:px-6 space-y-5 md:space-y-6">
          {SERVICES.map((s) => <ServiceRow key={s.title} service={s} />)}
        </div>
      </section>

      {/* GET IN TOUCH */}
      <section id="get-in-touch" className="w-full bg-[#f8f4ed] py-12 md:py-16 border-t border-[#ece6dd]">
        <div className="max-w-2xl mx-auto px-4 lg:px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-[#1a1208] mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
            Let's talk about your project
          </h2>
          <p className="text-[#6b5e4e] text-sm md:text-base mb-6">
            Tell us a bit about your business and which service you're after — we'll get back to you with next steps and pricing.
          </p>
          {/* EDIT ME: swap this for a real contact form, WhatsApp link, or
              lead-capture endpoint once you've decided how you want service
              inquiries routed to you. */}
          <a
            href="mailto:hello@lerni.example?subject=Services%20inquiry"
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#e8540a] hover:bg-[#c94708] text-white rounded-xl font-bold transition text-base shadow-lg"
          >
            Email us <ArrowRight size={16} />
          </a>
          <p className="text-xs text-[#9e9789] mt-4">Placeholder contact link — replace with your real email, WhatsApp number, or a form.</p>
        </div>
      </section>

      {/* FOOTER — same as HomePage.jsx */}
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
                    <li key={link}><button onClick={() => handleNavigate('/')} className="hover:text-white transition bg-transparent border-none cursor-pointer text-[#9e8e7a] p-0">{link}</button></li>
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
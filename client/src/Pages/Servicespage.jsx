// src/Pages/ServicesPage.jsx
// ─── Services Page ──────────────────────────────────────────────────────────
// Same branding as HomePage.jsx / Shopify.jsx. Reached from the "Services"
// nav link in the header (added here, in HomePage.jsx, and — via the patch
// in SHOPIFY_NAV_PATCH.md — in the course landing page too).
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowRight, Megaphone, ShoppingBag, Target, TrendingUp } from 'lucide-react';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';

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

  // Route changes don't auto-scroll to top in React Router — this makes sure
  // clicking "Services" from anywhere lands at the top of this page.
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const handleNavigate = (path) => navigate(path);

  return (
    <div className="min-h-screen bg-[#FDFAF6] overflow-x-hidden w-full" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* HEADER — NEW: swapped to the same shared header as the rest of the
          site (real Super Admin logo, expandable Courses list) instead of
          this page's own separate copy. */}
      <SiteHeader />

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

      {/* FOOTER — NEW: swapped to the same shared footer as the rest of the
          site instead of this page's own separate copy. */}
      <SiteFooter />
    </div>
  );
}
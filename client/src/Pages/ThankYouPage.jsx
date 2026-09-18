// src/Pages/ThankYouPage.jsx
// ─────────────────────────────────────────────────────────────────────────────
// THANK YOU PAGE — shown right after "Confirm Enrollment" on EnrolledPage.jsx,
// for both a guest who just created an account and a returning student who was
// already logged in. Same header/footer/branding as the rest of the site.
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';

export default function ThankYouPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const courseTitle = location.state?.courseTitle || '';
  const handleNavigate = (path) => navigate(path);

  return (
    <div className="min-h-screen bg-[#FDFAF6] overflow-x-hidden w-full flex flex-col" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* HEADER — NEW: now the same shared header used everywhere else on the
          site (real Super Admin logo, expandable Courses list), instead of
          this page's own separate copy with the text "Lerni" wordmark. */}
      <SiteHeader />

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

      {/* FOOTER — NEW: same shared footer as the rest of the site. */}
      <SiteFooter />
    </div>
  );
}
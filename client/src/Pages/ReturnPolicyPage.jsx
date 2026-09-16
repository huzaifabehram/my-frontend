// src/Pages/ReturnPolicyPage.jsx
// ─────────────────────────────────────────────────────────────────────────────
// New page — reached from the footer's Policies accordion tab. States plainly
// that there are no returns/refunds, since enrollment grants lifetime access
// through the portal (per your note). Starting draft, not legal advice.
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';

const LAST_UPDATED = 'September 2026'; // EDIT ME whenever this page changes

export default function ReturnPolicyPage() {
  return (
    <div className="min-h-screen w-full bg-white flex flex-col">
      <SiteHeader />

      <section className="w-full bg-[#f8f4ed] py-10 md:py-14 border-b border-[#ece6dd]">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold text-[#1a1208] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>Return Policy</h1>
          <p className="text-sm text-[#9e9789]">Last updated: {LAST_UPDATED}</p>
        </div>
      </section>

      <section className="flex-1 w-full bg-white py-10 md:py-14">
        <div className="max-w-3xl mx-auto px-4 text-sm md:text-base text-[#3d3020] leading-relaxed space-y-5">
          <div className="bg-[#fdf0e4] border border-[#f0d5b0] rounded-xl p-5 md:p-6">
            <p className="font-bold text-[#1a1208] mb-1">No returns or refunds on course purchases.</p>
            <p>When you enroll in a course on this Platform, you get lifetime access to that course through your account — not a physical product or a time-limited subscription. Because access is granted in full at enrollment and never expires, we do not offer returns, refunds, or exchanges once a purchase has been confirmed and access has been granted.</p>
          </div>

          <p>We encourage you to review a course's description, curriculum, and any free preview lectures before enrolling, so you know it's the right fit before you buy.</p>

          <p>If you believe you were charged in error, or you're having a technical problem accessing a course you've paid for, please contact us right away using the details on our <a href="/contact-us" className="text-[#e8540a] hover:text-[#c94708] font-semibold">Contact Us</a> page — we're glad to help sort out account or access issues, even though the purchase itself is non-refundable.</p>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
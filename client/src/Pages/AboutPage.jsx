// src/Pages/AboutPage.jsx
// ─────────────────────────────────────────────────────────────────────────────
// New page — reached from the footer's "About" accordion tab. Content below
// is a reasonable starting draft (Motiviam Pvt Ltd, lifetime-access model,
// digital marketing & e-commerce focus) — edit the copy in ABOUT_CONTENT
// below to whatever you actually want said; nothing else needs to change.
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';

// EDIT ME — this is placeholder/starting copy, not verified company facts.
const ABOUT_CONTENT = {
  heading: 'About Us',
  intro:
    "Motiviam Pvt Ltd runs this platform to teach practical, real-world digital marketing and e-commerce skills — the kind you can put to work right away, not just theory.",
  paragraphs: [
    "Every course here is built around hands-on skills: running ad campaigns, setting up and growing an online store, and the day-to-day work of actually doing digital marketing and e-commerce — not just talking about it.",
    "When you enroll in a course, you get lifetime access through this portal — no re-purchasing, no expiring subscriptions. Learn at your own pace, and come back to any course whenever you need a refresher.",
    "We're based in Ghazikot, Mansehra, and we're building this for students and professionals across Pakistan (and beyond) who want to build a real career in digital marketing and e-commerce.",
  ],
};

export default function AboutPage() {
  return (
    <div className="min-h-screen w-full bg-white flex flex-col">
      <SiteHeader />

      <section className="w-full bg-[#1a1208] text-white py-14 md:py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
            {ABOUT_CONTENT.heading}
          </h1>
          <p className="text-base md:text-lg text-[#e8d9c5] leading-relaxed">{ABOUT_CONTENT.intro}</p>
        </div>
      </section>

      <section className="flex-1 w-full bg-white py-12 md:py-16">
        <div className="max-w-3xl mx-auto px-4 space-y-6">
          {ABOUT_CONTENT.paragraphs.map((p, i) => (
            <p key={i} className="text-base md:text-lg text-[#3d3020] leading-relaxed">{p}</p>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
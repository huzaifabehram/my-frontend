// src/Pages/PrivacyPolicyPage.jsx
// ─────────────────────────────────────────────────────────────────────────────
// New page — reached from the footer's Policies accordion tab. Standard
// privacy-policy boilerplate for a course platform (accounts, payments via
// screenshot verification, Cloudinary-hosted media, cookies). This is a
// starting draft, not legal advice — have it reviewed before relying on it.
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';

const LAST_UPDATED = 'September 2026'; // EDIT ME whenever this page changes

function Section({ title, children }) {
  return (
    <div className="mb-8">
      <h2 className="text-xl md:text-2xl font-bold text-[#1a1208] mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>{title}</h2>
      <div className="text-sm md:text-base text-[#3d3020] leading-relaxed space-y-3">{children}</div>
    </div>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen w-full bg-white flex flex-col">
      <SiteHeader />

      <section className="w-full bg-[#f8f4ed] py-10 md:py-14 border-b border-[#ece6dd]">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold text-[#1a1208] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>Privacy Policy</h1>
          <p className="text-sm text-[#9e9789]">Last updated: {LAST_UPDATED}</p>
        </div>
      </section>

      <section className="flex-1 w-full bg-white py-10 md:py-14">
        <div className="max-w-3xl mx-auto px-4">
          <Section title="1. Who we are">
            <p>This Privacy Policy explains how Motiviam Pvt Ltd ("we", "us", "our") collects, uses, and protects your information when you use this website and course platform (the "Platform").</p>
          </Section>

          <Section title="2. Information we collect">
            <p>We collect information you provide directly, including:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Account details — your name, email address, and password when you register.</li>
              <li>Profile information — for instructors, this includes a bio, title, location, and any social/website links you choose to add.</li>
              <li>Payment verification — when you enroll in a paid course, you submit a payment screenshot and your WhatsApp number so we can verify and confirm your payment. We do not collect or store card numbers or bank account details ourselves.</li>
              <li>Content you submit — course reviews, testimonials, and any messages you send us through the Contact Us page or newsletter signup.</li>
              <li>Uploaded media — profile photos, course thumbnails, and other images/videos uploaded by instructors are stored with our media hosting provider (Cloudinary).</li>
            </ul>
          </Section>

          <Section title="3. How we use your information">
            <ul className="list-disc pl-5 space-y-1">
              <li>To create and manage your account and give you access to courses you've enrolled in.</li>
              <li>To verify payments and grant course access.</li>
              <li>To respond to questions submitted through the Contact Us page.</li>
              <li>To send occasional updates to newsletter subscribers, if you've signed up.</li>
              <li>To maintain the security and proper functioning of the Platform.</li>
            </ul>
          </Section>

          <Section title="4. How we share your information">
            <p>We do not sell your personal information. We share information only with service providers that help us run the Platform — for example, our database and media hosting providers — and only as needed to provide the service.</p>
          </Section>

          <Section title="5. Cookies">
            <p>We use cookies and similar technologies to keep you signed in and to understand how the Platform is used, so we can improve it.</p>
          </Section>

          <Section title="6. Data retention">
            <p>We retain your account and course-access information for as long as your account is active, since course access through this Platform is lifetime — see our Return Policy for details.</p>
          </Section>

          <Section title="7. Your choices">
            <p>You can update your profile information at any time from your dashboard. To request deletion of your account or personal data, contact us using the details on our Contact Us page.</p>
          </Section>

          <Section title="8. Changes to this policy">
            <p>We may update this policy from time to time. Continued use of the Platform after a change means you accept the updated policy.</p>
          </Section>

          <Section title="9. Contact us">
            <p>Questions about this policy? Reach us at <a href="mailto:motiviampvtltd@gmail.com" className="text-[#e8540a] hover:text-[#c94708] font-semibold">motiviampvtltd@gmail.com</a> or via our <a href="/contact-us" className="text-[#e8540a] hover:text-[#c94708] font-semibold">Contact Us</a> page.</p>
          </Section>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
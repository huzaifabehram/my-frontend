// src/Pages/ContactUsPage.jsx
// ─────────────────────────────────────────────────────────────────────────────
// New page — reached from the footer's "Contact Us" accordion tab. Shows the
// WhatsApp number + email, and a name/email/message form that POSTs to
// POST /api/contact on the backend — submissions show up in Super Admin →
// Messages → Contact Submissions.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { MessageCircle, Mail } from 'lucide-react';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';
import { useAuth } from '../context/AuthContext';

// NOTE: you gave two different digit counts for this number across your
// message ("03446199711" in the address block vs "0344619971" in the note
// further down) — using the 11-digit one here since that's the standard
// Pakistani mobile format. Double check this is right and fix WHATSAPP_NUMBER
// below if not.
const WHATSAPP_NUMBER = '03446199711';
const WHATSAPP_LINK = 'https://wa.me/923446199711'; // international format, no leading 0
const CONTACT_EMAIL = 'motiviampvtltd@gmail.com';

export default function ContactUsPage() {
  const { API: api } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const [errorMsg, setErrorMsg] = useState('');

  const update = (field, val) => setForm((f) => ({ ...f, [field]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setStatus('error');
      setErrorMsg('Please fill in your name, email, and message.');
      return;
    }
    setStatus('sending');
    setErrorMsg('');
    try {
      await api.post('/contact', form);
      setStatus('sent');
      setForm({ name: '', email: '', message: '' });
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.response?.data?.message || 'Could not send your message. Please try again.');
    }
  };

  return (
    <div className="min-h-screen w-full bg-white flex flex-col">
      <SiteHeader />

      <section className="w-full bg-[#f8f4ed] py-10 md:py-14 border-b border-[#ece6dd]">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold text-[#1a1208] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>Contact Us</h1>
          <p className="text-sm md:text-base text-[#9e9789]">Questions about a course, your account, or a payment? Reach out — we're glad to help.</p>
        </div>
      </section>

      <section className="flex-1 w-full bg-white py-10 md:py-14">
        <div className="max-w-4xl mx-auto px-4 grid md:grid-cols-2 gap-10 md:gap-12">
          {/* Direct contact details */}
          <div className="space-y-5">
            <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 rounded-xl border border-[#ece6dd] hover:border-[#e8540a] hover:shadow-sm transition no-underline">
              <div className="w-10 h-10 rounded-full bg-[#fdf0e4] flex items-center justify-center flex-shrink-0">
                <MessageCircle size={18} className="text-[#e8540a]" />
              </div>
              <div>
                <p className="text-xs text-[#9e9789] font-semibold uppercase tracking-wide">WhatsApp</p>
                <p className="text-[#1a1208] font-bold">{WHATSAPP_NUMBER}</p>
              </div>
            </a>
            <a href={`mailto:${CONTACT_EMAIL}`}
              className="flex items-center gap-3 p-4 rounded-xl border border-[#ece6dd] hover:border-[#e8540a] hover:shadow-sm transition no-underline">
              <div className="w-10 h-10 rounded-full bg-[#fdf0e4] flex items-center justify-center flex-shrink-0">
                <Mail size={18} className="text-[#e8540a]" />
              </div>
              <div>
                <p className="text-xs text-[#9e9789] font-semibold uppercase tracking-wide">Email</p>
                <p className="text-[#1a1208] font-bold break-all">{CONTACT_EMAIL}</p>
              </div>
            </a>
          </div>

          {/* Query form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-[#1a1208] mb-1 block">Name</label>
              <input value={form.name} onChange={(e) => update('name', e.target.value)}
                placeholder="Your full name"
                className="w-full border border-[#ece6dd] rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#e8540a]" />
            </div>
            <div>
              <label className="text-sm font-semibold text-[#1a1208] mb-1 block">Email</label>
              <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)}
                placeholder="you@example.com"
                className="w-full border border-[#ece6dd] rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#e8540a]" />
            </div>
            <div>
              <label className="text-sm font-semibold text-[#1a1208] mb-1 block">Message</label>
              <textarea value={form.message} onChange={(e) => update('message', e.target.value)}
                placeholder="How can we help?" rows={5}
                className="w-full border border-[#ece6dd] rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#e8540a] resize-none" />
            </div>
            <button type="submit" disabled={status === 'sending'}
              className="w-full sm:w-auto px-6 py-3 bg-[#e8540a] hover:bg-[#c94708] disabled:opacity-60 text-white rounded-xl font-bold transition border-none cursor-pointer">
              {status === 'sending' ? 'Sending…' : 'Send Message'}
            </button>
            {status === 'sent' && <p className="text-sm text-emerald-600 font-semibold">✓ Thanks — we've received your message and will get back to you soon.</p>}
            {status === 'error' && <p className="text-sm text-red-600 font-semibold">{errorMsg}</p>}
          </form>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
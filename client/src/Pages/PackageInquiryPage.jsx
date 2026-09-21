// src/Pages/PackageInquiryPage.jsx
// ─────────────────────────────────────────────────────────────────────────────
// New page — reached from the Gold/Premium package cards on the Services
// page. Collects Name, WhatsApp Number, Email, and which package they want,
// and POSTs to POST /api/package-inquiries — submissions show up in Super
// Admin → Messages → Package Inquiries (mirrors the existing Contact Us
// submission pattern). Same header/footer as the course landing page, per
// the branding requirement.
//
// The package cards on ServicesPage.jsx link here as
// /get-package?package=gold or /get-package?package=premium, which
// pre-selects that package in the form below.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';
import { useAuth } from '../context/AuthContext';

const PACKAGE_LABELS = {
  gold:    'Gold Package — Rs. 135,000',
  premium: 'Premium Package — Rs. 250,000',
};

export default function PackageInquiryPage() {
  const { API: api } = useAuth();
  const [searchParams] = useSearchParams();
  const initialPackage = ['gold', 'premium'].includes(searchParams.get('package')) ? searchParams.get('package') : 'gold';

  const [form, setForm] = useState({ name: '', whatsapp: '', email: '', package: initialPackage });
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const [errorMsg, setErrorMsg] = useState('');

  const update = (field, val) => setForm((f) => ({ ...f, [field]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.whatsapp.trim() || !form.email.trim()) {
      setStatus('error');
      setErrorMsg('Please fill in your name, WhatsApp number, and email.');
      return;
    }
    setStatus('sending');
    setErrorMsg('');
    try {
      await api.post('/package-inquiries', form);
      setStatus('sent');
      setForm({ name: '', whatsapp: '', email: '', package: form.package });
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.response?.data?.message || 'Could not send your request. Please try again.');
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#FDFAF6] flex flex-col" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <SiteHeader />

      <section className="w-full bg-[#1a1208] py-10 md:py-14">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>Get Your Package</h1>
          <p className="text-sm md:text-base text-[#c8bfaf]">Tell us a bit about yourself and which package you'd like — our team will reach out on WhatsApp to get you started.</p>
        </div>
      </section>

      <section className="flex-1 w-full py-10 md:py-14">
        <div className="max-w-lg mx-auto px-4">
          {status === 'sent' ? (
            <div className="bg-white border border-[#ece6dd] rounded-2xl p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-[#fdf2ea] flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={28} className="text-[#e8540a]" />
              </div>
              <h2 className="text-xl font-bold text-[#1a1208] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>Request received!</h2>
              <p className="text-sm text-[#6b5e4e] mb-6">Thanks — our team will reach out to you on WhatsApp shortly to get your {form.package === 'gold' ? 'Gold' : 'Premium'} Package started.</p>
              <button onClick={() => setStatus('idle')} className="px-5 py-2.5 bg-[#e8540a] hover:bg-[#c94708] text-white rounded-xl font-bold transition border-none cursor-pointer">
                Submit Another Request
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white border border-[#ece6dd] rounded-2xl p-6 md:p-8 space-y-4">
              <div>
                <label className="text-sm font-semibold text-[#1a1208] mb-1 block">Full Name</label>
                <input value={form.name} onChange={(e) => update('name', e.target.value)}
                  placeholder="Your full name"
                  className="w-full border border-[#ece6dd] rounded-lg px-3.5 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-[#e8540a]" />
              </div>
              <div>
                <label className="text-sm font-semibold text-[#1a1208] mb-1 block">WhatsApp Number</label>
                <input value={form.whatsapp} onChange={(e) => update('whatsapp', e.target.value)}
                  placeholder="03XX-XXXXXXX" inputMode="tel"
                  className="w-full border border-[#ece6dd] rounded-lg px-3.5 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-[#e8540a]" />
              </div>
              <div>
                <label className="text-sm font-semibold text-[#1a1208] mb-1 block">Email Address</label>
                <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)}
                  placeholder="you@example.com"
                  className="w-full border border-[#ece6dd] rounded-lg px-3.5 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-[#e8540a]" />
              </div>
              <div>
                <label className="text-sm font-semibold text-[#1a1208] mb-1 block">Package</label>
                <select value={form.package} onChange={(e) => update('package', e.target.value)}
                  className="w-full border border-[#ece6dd] rounded-lg px-3.5 py-2.5 text-base bg-white focus:outline-none focus:ring-2 focus:ring-[#e8540a]">
                  {Object.entries(PACKAGE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <button type="submit" disabled={status === 'sending'}
                className="w-full px-6 py-3.5 bg-[#e8540a] hover:bg-[#c94708] disabled:opacity-60 text-white rounded-xl font-bold transition border-none cursor-pointer">
                {status === 'sending' ? 'Sending…' : 'Submit Request'}
              </button>
              {status === 'error' && <p className="text-sm text-red-600 font-semibold">{errorMsg}</p>}
            </form>
          )}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
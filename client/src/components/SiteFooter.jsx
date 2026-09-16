// src/components/SiteFooter.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Shared footer — same markup as the one now inlined in Shopify.jsx (course
// landing page): logo from Super Admin → Settings (falls back to the "Lerni"
// text wordmark), Motiviam Pvt Ltd address/phone/email, a 3-tab FAQ-style
// accordion (About / Policies / Contact Us), and a newsletter box outside the
// tabs that posts to the backend.
//
// Used by the new AboutPage / PrivacyPolicyPage / ReturnPolicyPage /
// ContactUsPage so those don't each duplicate ~100 lines of footer JSX.
// HomePage.jsx, ServicesPage.jsx and Shopify.jsx still have their own
// inline footer (Shopify.jsx's was just rebuilt to match this one) — not
// switched over to this shared component in this pass, to avoid touching
// already-working pages. Swap them to <SiteFooter /> whenever convenient;
// the JSX is identical either way.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function SiteFooter() {
  const navigate = useNavigate();
  const { API: api } = useAuth();
  const handleNavigate = (path) => navigate(path);

  const [siteLogoUrl, setSiteLogoUrl] = useState('');
  const [openFooterTab, setOpenFooterTab] = useState(null);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState('idle');

  useEffect(() => {
    api.get('/settings')
      .then((res) => setSiteLogoUrl(res.data?.logoUrl || ''))
      .catch(() => {});
  }, [api]);

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (!newsletterEmail.trim() || newsletterStatus === 'sending') return;
    setNewsletterStatus('sending');
    api.post('/newsletter', { email: newsletterEmail.trim() })
      .then(() => { setNewsletterStatus('sent'); setNewsletterEmail(''); })
      .catch(() => setNewsletterStatus('error'));
  };

  return (
    <footer className="bg-[#1a1208] text-[#9e8e7a] py-8 md:py-12 w-full border-t border-[#2d2416]">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        <div className="grid md:grid-cols-3 gap-8 md:gap-12 mb-8 md:mb-10">
          <div>
            <button onClick={() => handleNavigate('/')}
              className="cursor-pointer hover:opacity-80 transition bg-transparent border-none p-0 block mb-4">
              {siteLogoUrl ? (
                <img src={siteLogoUrl} alt="Logo" className="h-10 md:h-12 w-auto object-contain" />
              ) : (
                <span className="text-xl md:text-2xl font-extrabold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Ler<span className="text-[#f9c97a]">ni</span>
                </span>
              )}
            </button>
            <div className="text-xs md:text-sm space-y-2 leading-relaxed">
              <p>Motiviam Pvt Ltd Building Opposite Attock Petrol Pump Adjacent Baluchistan Marble Ghazikot Mansehra</p>
              <p><a href="tel:03446199711" className="hover:text-white transition">03446199711</a></p>
              <p><a href="mailto:motiviampvtltd@gmail.com" className="hover:text-white transition">motiviampvtltd@gmail.com</a></p>
            </div>
          </div>

          <div>
            {[
              { key: 'about',    label: 'About',      rows: [{ label: 'About Page', path: '/about' }] },
              { key: 'policies', label: 'Policies',    rows: [{ label: '1. Return Policy', path: '/return-policy' }, { label: '2. Privacy Policy', path: '/privacy-policy' }] },
              { key: 'contact',  label: 'Contact Us',  rows: [{ label: 'Contact Us', path: '/contact-us' }] },
            ].map((tab) => {
              const isOpen = openFooterTab === tab.key;
              return (
                <div key={tab.key} className="border-b border-[#2d2416]">
                  <button
                    onClick={() => setOpenFooterTab(isOpen ? null : tab.key)}
                    className="w-full flex items-center justify-between py-3 bg-transparent border-none cursor-pointer text-left"
                  >
                    <span className="font-bold text-[#f9c97a] text-xs md:text-sm uppercase tracking-wide">{tab.label}</span>
                    <ChevronDown size={16} className={`text-[#9e8e7a] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <ul className="pb-3 space-y-2 text-xs md:text-sm">
                      {tab.rows.map((row) => (
                        <li key={row.path}>
                          <button onClick={() => handleNavigate(row.path)} className="hover:text-white transition bg-transparent border-none cursor-pointer text-[#9e8e7a] p-0 text-left">
                            {row.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>

          <div>
            <h3 className="font-bold text-[#f9c97a] mb-3 text-xs md:text-sm uppercase tracking-wide">Newsletter</h3>
            <p className="text-xs md:text-sm mb-3">Get news and updates in your inbox.</p>
            <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
              <input
                type="email"
                required
                value={newsletterEmail}
                onChange={(e) => { setNewsletterEmail(e.target.value); if (newsletterStatus !== 'sending') setNewsletterStatus('idle'); }}
                placeholder="you@example.com"
                className="flex-1 min-w-0 bg-[#241c10] border border-[#2d2416] rounded-lg px-3 py-2 text-xs md:text-sm text-white placeholder-[#6b5e4e] focus:outline-none focus:ring-2 focus:ring-[#e8540a]"
              />
              <button
                type="submit"
                disabled={newsletterStatus === 'sending'}
                className="flex-shrink-0 bg-[#e8540a] hover:bg-[#c94708] disabled:opacity-60 text-white text-xs md:text-sm font-semibold px-4 py-2 rounded-lg transition border-none cursor-pointer"
              >
                {newsletterStatus === 'sending' ? '...' : 'Send'}
              </button>
            </form>
            {newsletterStatus === 'sent' && <p className="text-xs text-emerald-400 mt-2">✓ Subscribed — thanks!</p>}
            {newsletterStatus === 'error' && <p className="text-xs text-red-400 mt-2">Something went wrong — try again.</p>}
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center pt-6 md:pt-8 border-t border-[#2d2416] gap-3">
          <button onClick={() => handleNavigate('/')}
            className="text-xl md:text-2xl font-extrabold text-white cursor-pointer hover:opacity-80 transition bg-transparent border-none p-0"
            style={{ fontFamily: "'Playfair Display', serif" }}>
            {siteLogoUrl ? <img src={siteLogoUrl} alt="Logo" className="h-8 md:h-9 w-auto object-contain" /> : <>Ler<span className="text-[#f9c97a]">ni</span></>}
          </button>
          <p className="text-xs md:text-sm text-[#6b5e4e]">© {new Date().getFullYear()} Motiviam Pvt Ltd. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
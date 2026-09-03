// src/Pages/EnrollmentPage.jsx
// ─────────────────────────────────────────────────────────────────────────────
// ENROLLMENT PAGE — reached from "Enroll Now" on the course landing page
// (Shopify.jsx). Two steps:
//   Step 1: Name, Email, WhatsApp Number
//   Step 2: Payment method selection + confirmation
//
// Branding matches Shopify.jsx exactly (same header, footer, "Lerni" wordmark,
// color palette, and fonts) so the flow feels like one continuous site rather
// than a separate checkout tool.
//
// Auth handling:
//   • If the visitor is already logged in, submitting Step 2 enrolls them
//     immediately (calls enrollCourse) and sends them to /portal.
//   • If not logged in, Step 1 + Step 2 answers are stashed locally, then the
//     visitor is sent through the EXISTING /auth/register flow (unchanged).
//     AuthPages.jsx already finishes enrollment after a successful signup —
//     see the small addition needed there, described in the setup notes.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCourses } from '../context/CoursesContext';
import { enrollCourse } from '../api/courseApi';
import { trackInitiateCheckout, trackPurchase, setPendingCourse } from '../utils/facebookPixel';
import {
  Menu, X, Search, Check, ChevronLeft, ArrowLeft, MessageCircle,
  Smartphone, CreditCard, Landmark, Loader2, ShieldCheck, User, Mail,
} from 'lucide-react';

// Key used to stash Step 1 + Step 2 answers for guests who still need to
// create an account before the enrollment can be finalized. Read back by
// AuthPages.jsx once sign-up/sign-in succeeds.
const INTAKE_STORAGE_KEY = 'lerni_enroll_intake';

const PAYMENT_METHODS = [
  {
    id: 'bank',
    label: 'Bank Transfer',
    icon: Landmark,
    detail: 'Bank: [Your Bank] • Account Title: [Your Name] • Account #: [XXXX-XXXXXXX-X] • IBAN: [PKXX XXXX XXXX XXXX XXXX XXXX]',
  },
  {
    id: 'jazzcash',
    label: 'JazzCash',
    icon: Smartphone,
    detail: 'Send to: [03XX-XXXXXXX] • Account Title: [Your Name]',
  },
  {
    id: 'easypaisa',
    label: 'Easypaisa',
    icon: Smartphone,
    detail: 'Send to: [03XX-XXXXXXX] • Account Title: [Your Name]',
  },
  {
    id: 'card',
    label: 'Credit / Debit Card',
    icon: CreditCard,
    detail: 'Pay securely by card — you will get a confirmation on WhatsApp once it clears.',
  },
];

export default function EnrollmentPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const { courses, getCourse, fetchCourseById } = useCourses();

  const [fullCourse, setFullCourse] = useState(null);
  const [courseLoading, setCourseLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: '', email: '', whatsapp: '' });
  const [errors, setErrors] = useState({});
  const [paymentMethod, setPaymentMethod] = useState('bank');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Prefill from the logged-in account, if any — same fields still editable.
  useEffect(() => {
    if (user) setForm((f) => ({ ...f, name: f.name || user.name || '', email: f.email || user.email || '' }));
  }, [user]);

  // Same load pattern as the course landing page: cached copy first, then
  // refresh from the server so price/title are always current.
  useEffect(() => {
    if (!id) return;
    setFullCourse(null);
    setCourseLoading(true);
    fetchCourseById(id).then((course) => {
      if (course) setFullCourse(course);
      setCourseLoading(false);
    });
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const course = useMemo(() => {
    if (!id) return null;
    return fullCourse || getCourse(id);
  }, [id, fullCourse, courses, getCourse]);

  const handleNavigate = (path) => { setMobileMenuOpen(false); navigate(path); };

  const priceLabel = course ? `PKR ${(course.price * 280).toLocaleString()}` : '';
  const discountPct = course && course.originalPrice > course.price
    ? Math.round((1 - course.price / course.originalPrice) * 100)
    : null;

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((er) => ({ ...er, [name]: '' }));
  }

  function validateStep1() {
    const e = {};
    if (!form.name.trim()) e.name = 'Full name is required.';
    if (!form.email.trim()) e.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'Enter a valid email address.';
    if (!form.whatsapp.trim()) e.whatsapp = 'WhatsApp number is required.';
    else if (!/^[+\d][\d\s-]{7,14}$/.test(form.whatsapp.trim())) e.whatsapp = 'Enter a valid WhatsApp number, e.g. 03XX-XXXXXXX.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  const handleContinue = useCallback(() => {
    if (!validateStep1()) return;
    if (course) trackInitiateCheckout(course);
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [form, course]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleFinalSubmit() {
    if (!course) return;
    setSubmitting(true);
    setSubmitError('');
    const courseId = course._id || course.id;
    const intake = {
      name: form.name.trim(),
      email: form.email.trim(),
      whatsapp: form.whatsapp.trim(),
      paymentMethod,
    };

    try {
      if (user) {
        // Already signed in — enroll right away.
        await enrollCourse(courseId, intake);
        trackPurchase(course);
        navigate('/portal', { replace: true });
      } else {
        // Guest — stash the answers, then reuse the existing sign-up flow.
        // AuthPages.jsx picks this up once the account is created (see the
        // "Wiring it up" notes for the small addition needed there).
        setPendingCourse(course);
        localStorage.setItem(INTAKE_STORAGE_KEY, JSON.stringify(intake));
        navigate(`/auth/register?redirect=${encodeURIComponent('/portal')}&courseId=${courseId}`);
      }
    } catch (err) {
      setSubmitError(err?.response?.data?.message || 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  }

  // ── Loading / not-found states ──────────────────────────────────────────
  if (courseLoading && !course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFAF6]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <p className="text-[#9e9789] text-base md:text-lg">Loading enrollment…</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#FDFAF6] px-4 text-center" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <p className="text-[#1a1208] text-lg md:text-xl font-bold">We couldn't find that course.</p>
        <button onClick={() => navigate('/courses')} className="px-5 py-2.5 bg-[#e8540a] text-white rounded-lg hover:bg-[#c94708] transition font-semibold border-none cursor-pointer">
          Browse courses
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFAF6] overflow-x-hidden w-full" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* HEADER — identical to the course landing page */}
      <header className="sticky top-0 z-40 bg-white shadow-sm w-full border-b border-[#ece6dd]">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-3 md:py-4 flex items-center justify-between">
          <button
            className="lg:hidden p-2 -ml-2 bg-transparent border-none cursor-pointer text-[#1a1208]"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className="absolute left-1/2 transform -translate-x-1/2 lg:relative lg:left-auto lg:transform-none">
            <button onClick={() => handleNavigate('/')}
              className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-[#1a1208] cursor-pointer hover:opacity-80 transition bg-transparent border-none p-0"
              style={{ fontFamily: "'Playfair Display', serif" }}>
              Ler<span className="text-[#e8540a]">ni</span>
            </button>
          </div>
          <nav className="hidden lg:flex items-center gap-8 flex-1 ml-12">
            <button onClick={() => handleNavigate('/courses')} className="text-base text-[#3d3020] hover:text-[#e8540a] transition bg-transparent border-none cursor-pointer p-0 font-medium">Categories</button>
            <button onClick={() => handleNavigate('/instructor')} className="text-base text-[#3d3020] hover:text-[#e8540a] transition bg-transparent border-none cursor-pointer p-0 font-medium">Instructor</button>
            <button onClick={() => handleNavigate('/courses')} className="text-base text-[#3d3020] hover:text-[#e8540a] transition bg-transparent border-none cursor-pointer p-0 font-medium">About</button>
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
                <button onClick={() => handleNavigate('/courses')} className="block w-full text-left text-white hover:text-[#f0a070] bg-transparent border-none cursor-pointer p-3 rounded-lg hover:bg-white/5 font-medium transition text-base">Categories</button>
                <button onClick={() => handleNavigate('/instructor')} className="block w-full text-left text-white hover:text-[#f0a070] bg-transparent border-none cursor-pointer p-3 rounded-lg hover:bg-white/5 font-medium transition text-base">Instructor</button>
              </div>
            </div>
          </>
        )}
      </header>

      {/* MAIN */}
      <main className="max-w-5xl mx-auto px-4 lg:px-6 py-8 md:py-12 w-full">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-[#3d3020] hover:text-[#e8540a] transition bg-transparent border-none cursor-pointer p-0 mb-6 text-sm md:text-base font-medium"
        >
          <ChevronLeft size={18} /> Back to course
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 lg:gap-10 items-start">
          {/* ── FORM COLUMN ── */}
          <div className="border border-[#ece6dd] rounded-2xl bg-white p-5 sm:p-7 md:p-9 w-full">
            {/* Step indicator */}
            <div className="flex items-center gap-3 mb-7 md:mb-9">
              {[1, 2].map((s) => (
                <React.Fragment key={s}>
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                      step >= s ? 'bg-[#e8540a] text-white' : 'bg-[#f0ebe3] text-[#9e9789]'
                    }`}>
                      {step > s ? <Check size={16} /> : s}
                    </div>
                    <span className={`text-sm md:text-base font-semibold ${step >= s ? 'text-[#1a1208]' : 'text-[#9e9789]'}`}>
                      {s === 1 ? 'Your details' : 'Payment'}
                    </span>
                  </div>
                  {s === 1 && <div className={`flex-1 h-0.5 ${step > 1 ? 'bg-[#e8540a]' : 'bg-[#ece6dd]'}`} />}
                </React.Fragment>
              ))}
            </div>

            {step === 1 ? (
              <div className="space-y-5">
                <h1 className="text-xl md:text-2xl font-bold text-[#1a1208]" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Tell us where to reach you
                </h1>
                <p className="text-[#9e9789] text-sm md:text-base -mt-3">
                  We'll send your enrollment confirmation and course access here.
                </p>

                <div>
                  <label className="flex items-center gap-1.5 text-sm font-bold text-[#3d3020] mb-1.5"><User size={15} className="text-[#e8540a]" /> Full Name</label>
                  <input
                    name="name" value={form.name} onChange={handleChange}
                    placeholder="e.g. Ayesha Siddiqui"
                    className={`w-full border rounded-xl px-4 py-3 text-sm md:text-base text-[#1a1208] outline-none transition ${errors.name ? 'border-red-400' : 'border-[#ece6dd] focus:border-[#e8540a]'}`}
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-sm font-bold text-[#3d3020] mb-1.5"><Mail size={15} className="text-[#e8540a]" /> Email Address</label>
                  <input
                    name="email" type="email" value={form.email} onChange={handleChange}
                    placeholder="you@email.com"
                    className={`w-full border rounded-xl px-4 py-3 text-sm md:text-base text-[#1a1208] outline-none transition ${errors.email ? 'border-red-400' : 'border-[#ece6dd] focus:border-[#e8540a]'}`}
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-sm font-bold text-[#3d3020] mb-1.5"><MessageCircle size={15} className="text-[#e8540a]" /> WhatsApp Number</label>
                  <input
                    name="whatsapp" value={form.whatsapp} onChange={handleChange}
                    placeholder="03XX-XXXXXXX"
                    className={`w-full border rounded-xl px-4 py-3 text-sm md:text-base text-[#1a1208] outline-none transition ${errors.whatsapp ? 'border-red-400' : 'border-[#ece6dd] focus:border-[#e8540a]'}`}
                  />
                  {errors.whatsapp && <p className="text-red-500 text-xs mt-1">{errors.whatsapp}</p>}
                  <p className="text-xs text-[#9e9789] mt-1.5">Used only for enrollment and payment confirmation.</p>
                </div>

                <button
                  onClick={handleContinue}
                  className="w-full bg-[#e8540a] hover:bg-[#c94708] text-white font-bold py-3.5 rounded-xl transition text-base border-none cursor-pointer mt-2"
                >
                  Continue to Payment
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                <h1 className="text-xl md:text-2xl font-bold text-[#1a1208]" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Choose how you'd like to pay
                </h1>

                <div className="space-y-3">
                  {PAYMENT_METHODS.map((m) => {
                    const MIcon = m.icon;
                    const selected = paymentMethod === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id)}
                        className={`w-full text-left border rounded-xl p-4 flex items-start gap-3 transition cursor-pointer ${
                          selected ? 'border-[#e8540a] bg-[#fdf2ea]' : 'border-[#ece6dd] bg-white hover:border-[#ddd5c4]'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${selected ? 'bg-[#e8540a] text-white' : 'bg-[#f0ebe3] text-[#9e9789]'}`}>
                          <MIcon size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-[#1a1208] text-sm md:text-base">{m.label}</p>
                          {selected && <p className="text-xs md:text-sm text-[#6b5e4e] mt-1 break-words">{m.detail}</p>}
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-1 flex items-center justify-center ${selected ? 'border-[#e8540a]' : 'border-[#ddd5c4]'}`}>
                          {selected && <div className="w-2.5 h-2.5 rounded-full bg-[#e8540a]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-start gap-2 bg-[#f8f4ed] border border-[#ece6dd] rounded-xl p-3.5">
                  <ShieldCheck size={18} className="text-[#e8540a] flex-shrink-0 mt-0.5" />
                  <p className="text-xs md:text-sm text-[#6b5e4e]">
                    After you complete the transfer, tap "Confirm Enrollment" below — access is
                    granted as soon as your payment is verified, and we'll message you on WhatsApp
                    to confirm.
                  </p>
                </div>

                {submitError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3.5">
                    <p className="text-red-600 text-sm">{submitError}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 bg-white hover:bg-[#f8f4ed] text-[#3d3020] font-bold py-3.5 rounded-xl transition text-base border-2 border-[#ece6dd] cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleFinalSubmit}
                    disabled={submitting}
                    className="flex-[2] bg-[#e8540a] hover:bg-[#c94708] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition text-base border-none cursor-pointer flex items-center justify-center gap-2"
                  >
                    {submitting ? (<><Loader2 size={18} className="animate-spin" /> Processing…</>) : 'Confirm Enrollment'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── ORDER SUMMARY COLUMN ── */}
          <div className="border border-[#ece6dd] rounded-2xl bg-[#f8f4ed] p-5 md:p-6 w-full lg:sticky lg:top-24">
            <p className="text-xs uppercase tracking-wide text-[#9e9789] font-bold mb-3">Order Summary</p>
            <div className="flex gap-3 mb-4">
              <div className="w-20 h-14 rounded-lg overflow-hidden bg-[#2d2416] flex-shrink-0 flex items-center justify-center">
                {course.thumbnail ? (
                  <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl">{course.emoji || '📚'}</span>
                )}
              </div>
              <p className="text-sm md:text-base font-bold text-[#1a1208] leading-snug break-words">{course.title}</p>
            </div>
            <div className="border-t border-[#ece6dd] pt-4 space-y-2">
              <div className="flex justify-between text-sm md:text-base">
                <span className="text-[#6b5e4e]">Price</span>
                <span className="font-bold text-[#1a1208]">{priceLabel}</span>
              </div>
              {discountPct && (
                <div className="flex justify-between text-sm md:text-base">
                  <span className="text-[#6b5e4e]">Discount</span>
                  <span className="font-bold text-[#e8540a]">{discountPct}% OFF</span>
                </div>
              )}
              <div className="flex justify-between text-base md:text-lg pt-2 border-t border-[#ece6dd] mt-2">
                <span className="font-bold text-[#1a1208]">Total</span>
                <span className="font-bold text-[#1a1208]">{priceLabel}</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER — identical to the course landing page */}
      <footer className="bg-[#1a1208] text-[#9e8e7a] py-8 md:py-12 w-full border-t border-[#2d2416]">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 md:gap-8 mb-8 md:mb-12">
            {[
              { title: 'Lerni',     links: ['About', 'Press', 'Contact', 'Careers'] },
              { title: 'Community', links: ['Learners', 'Partners', 'Developers', 'Beta Testers'] },
              { title: 'Teaching',  links: ['Become Instructor', 'Teaching Center', 'Resources'] },
              { title: 'Programs',  links: ['Enterprise', 'Government', 'Lerni Business'] },
              { title: 'Support',   links: ['Help Center', 'Get the App', 'FAQ', 'Accessibility'] },
              { title: 'Legal',     links: ['Terms', 'Privacy Policy', 'Cookie Settings', 'Sitemap'] },
            ].map(col => (
              <div key={col.title}>
                <h3 className="font-bold text-[#f9c97a] mb-3 md:mb-4 text-xs md:text-sm uppercase tracking-wide">{col.title}</h3>
                <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm">
                  {col.links.map(link => (
                    <li key={link}><button onClick={() => handleNavigate('/')} className="hover:text-white transition bg-transparent border-none cursor-pointer text-[#9e8e7a] p-0">{link}</button></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center pt-6 md:pt-8 border-t border-[#2d2416]">
            <button onClick={() => handleNavigate('/')}
              className="text-xl md:text-2xl font-extrabold text-white cursor-pointer hover:opacity-80 transition bg-transparent border-none p-0 mb-4 md:mb-0"
              style={{ fontFamily: "'Playfair Display', serif" }}>
              Ler<span className="text-[#f9c97a]">ni</span>
            </button>
            <p className="text-xs md:text-sm text-[#6b5e4e]">© 2024 Lerni, Inc. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
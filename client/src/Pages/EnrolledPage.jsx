// src/Pages/EnrolledPage.jsx  (v1.3)
// ─────────────────────────────────────────────────────────────────────────────
// ENROLLMENT PAGE — reached from "Enroll Now" on the course landing page
// (Shopify.jsx). Two steps:
//   Step 1: Name, Email, WhatsApp Number, Password (guests only — this
//           becomes their student portal login)
//   Step 2: Payment method selection + screenshot + confirmation
//
// Uses the shared <SiteHeader />/<SiteFooter /> (same ones as About/Privacy/
// Contact pages) so the real Super Admin logo and course-landing-page-style
// footer show here too, instead of the old page-local header/footer + text
// "Lerni" wordmark.
//
// Auth handling:
//   • If the visitor is already logged in, "Confirm Enrollment" enrolls them
//     immediately (calls enrollCourse) and sends them to /thank-you.
//   • If not logged in, "Confirm Enrollment" registers their account right
//     here (using the email/password from Step 1), enrolls them, and sends
//     them to /thank-you — no more detour through a separate register page.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCourses } from '../context/CoursesContext';
import { enrollCourse } from '../api/courseApi';
import { trackInitiateCheckout, trackCompleteRegistration, trackPurchase, setPendingCourse } from '../utils/facebookPixel';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';
import {
  Check, ChevronLeft, MessageCircle,
  Smartphone, Landmark, Loader2, ShieldCheck, User, Mail, Lock, LogIn, ImagePlus,
} from 'lucide-react';

// NEW: Step 1 is now a full sign-up form (name, email, WhatsApp, password) —
// the email + password entered here become the visitor's actual student
// portal login, created inline when they confirm enrollment. This removes
// the old detour through a separate /auth/register page after payment.

// NEW: each method lists one or more full accounts (bank/service name +
// logo, account title, account number) instead of one crammed line of
// "Bank Name • Account Title • Account #" — laid out on separate lines so
// it's actually easy to read and copy from while making a transfer. The
// `key` on each account matches a field from Super Admin → Settings, where
// the real logo for each is uploaded (same Cloudinary flow as the header/
// footer logo) — see the paymentLogos fetch below. If a logo hasn't been
// uploaded yet, AccountLogo falls back to a colored initials badge instead
// of a broken image.
const PAYMENT_METHOD_DATA = [
  {
    id: 'bank',
    label: 'Bank Transfer',
    icon: Landmark,
    accounts: [
      { key: 'ubl',    name: 'United Bank Limited', short: 'UBL', color: '#024fa2', accountTitle: 'MOTIVIAM PRIVATE LIMITED', accountNumber: '397856471' },
      { key: 'allied', name: 'Allied Bank',         short: 'ABL', color: '#00693e', accountTitle: 'MOTIVIAM PRIVATE LIMITED', accountNumber: '0011195294040019' },
    ],
  },
  {
    id: 'jazzcash',
    label: 'JazzCash',
    icon: Smartphone,
    accounts: [
      { key: 'jazzcash', name: 'JazzCash', short: 'JC', color: '#d8232a', accountTitle: 'Huzaifa Behram', accountNumber: '0324-5463513' },
    ],
  },
  {
    id: 'easypaisa',
    label: 'Easypaisa',
    icon: Smartphone,
    accounts: [
      { key: 'easypaisa', name: 'Easypaisa', short: 'EP', color: '#00a651', accountTitle: 'Huzaifa Behram', accountNumber: '0344-6199712' },
    ],
  },
];

// Renders the real uploaded logo (passed in as `logoUrl`, fetched from
// Super Admin → Settings); if it's missing or fails to load, falls back to
// a colored initials badge instead of a broken image icon.
function AccountLogo({ acc, logoUrl }) {
  const [imgErr, setImgErr] = useState(false);
  if (logoUrl && !imgErr) {
    return (
      <img
        src={logoUrl}
        alt={acc.name}
        className="w-9 h-9 rounded-lg object-contain bg-white border border-[#ece6dd] flex-shrink-0 p-1"
        onError={() => setImgErr(true)}
      />
    );
  }
  return (
    <span
      className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-[10px] font-extrabold flex-shrink-0"
      style={{ backgroundColor: acc.color }}
    >
      {acc.short}
    </span>
  );
}

export default function EnrolledPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, API: api, register } = useAuth();
  const { courses, getCourse, fetchCourseById } = useCourses();

  const [fullCourse, setFullCourse] = useState(null);
  const [courseLoading, setCourseLoading] = useState(true);

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: '', email: '', whatsapp: '', password: '' });
  const [errors, setErrors] = useState({});
  const [paymentMethod, setPaymentMethod] = useState('bank');
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState('');
  const [screenshotError, setScreenshotError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const fileInputRef = useRef(null);

  // NEW: real payment-method logos, uploaded from Super Admin → Settings
  // (same Cloudinary flow as the header/footer logo) instead of bundled
  // static image files. Seeded from localStorage so they show instantly on
  // return visits — same caching pattern as the header/footer logo — then
  // refreshed in the background in case they've changed.
  const [paymentLogos, setPaymentLogos] = useState(() => {
    try {
      return {
        ubl:       localStorage.getItem('lerni_payment_logo_ubl')       || '',
        allied:    localStorage.getItem('lerni_payment_logo_allied')    || '',
        jazzcash:  localStorage.getItem('lerni_payment_logo_jazzcash')  || '',
        easypaisa: localStorage.getItem('lerni_payment_logo_easypaisa') || '',
      };
    } catch { return { ubl: '', allied: '', jazzcash: '', easypaisa: '' }; }
  });
  useEffect(() => {
    api.get('/settings')
      .then((res) => {
        const next = {
          ubl:       res.data?.paymentLogoUbl       || '',
          allied:    res.data?.paymentLogoAllied    || '',
          jazzcash:  res.data?.paymentLogoJazzcash  || '',
          easypaisa: res.data?.paymentLogoEasypaisa || '',
        };
        setPaymentLogos(next);
        try {
          localStorage.setItem('lerni_payment_logo_ubl', next.ubl);
          localStorage.setItem('lerni_payment_logo_allied', next.allied);
          localStorage.setItem('lerni_payment_logo_jazzcash', next.jazzcash);
          localStorage.setItem('lerni_payment_logo_easypaisa', next.easypaisa);
        } catch { /* cache is a nice-to-have */ }
      })
      .catch(() => {}); // logos are optional — falls back to colored initials
  }, [api]);

  // Prefill from the logged-in account, if any — same fields still editable.
  useEffect(() => {
    if (user) setForm((f) => ({ ...f, name: f.name || user.name || '', email: f.email || user.email || '' }));
  }, [user]);

  // WORKAROUND for a mobile Safari/Chrome quirk: focusing a text input whose
  // rendered font-size is under 16px makes the browser auto zoom in, and the
  // zoomed-in state can persist after moving to the next step — which is what
  // was making the footer look cut off. All text inputs on this page are set
  // to 16px (below) so the zoom shouldn't trigger in the first place; this
  // effect is a second safety net that nudges the viewport back to 1:1 scale
  // whenever the step changes, in case a browser still zoomed in.
  useEffect(() => {
    const viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) return;
    const original = viewport.getAttribute('content');
    viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1');
    const reset = setTimeout(() => { if (original) viewport.setAttribute('content', original); }, 350);
    return () => clearTimeout(reset);
  }, [step]);

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

  // NEW: course.price is already stored in PKR — the old "* 280" here was
  // treating it as a USD figure and converting it, which is what made the
  // price on this page's order summary come out wrong (same root cause that
  // was already fixed on the course landing page and homepage).
  const priceLabel = course ? `PKR ${Number(course.price || 0).toLocaleString()}` : '';
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
    // Password is only collected (and required) for guests — someone already
    // logged in obviously already has one.
    if (!user) {
      if (!form.password) e.password = 'Password is required.';
      else if (form.password.length < 6) e.password = 'Password must be at least 6 characters.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  const handleContinue = useCallback(() => {
    if (!validateStep1()) return;
    if (course) trackInitiateCheckout(course);
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [form, course]); // eslint-disable-line react-hooks/exhaustive-deps

  // "Already have an account?" — for returning students who don't need to
  // fill this form again. Goes straight to the normal login flow.
  const handleLoginClick = useCallback(() => {
    if (course) setPendingCourse(course);
    const courseId = course ? (course._id || course.id) : '';
    navigate(`/auth/login?redirect=${encodeURIComponent('/thank-you')}${courseId ? `&courseId=${courseId}` : ''}`);
  }, [course, navigate]);

  function handleScreenshotChange(e) {
    const file = e.target.files?.[0];
    setScreenshotError('');
    if (!file) { setScreenshotFile(null); setScreenshotPreview(''); return; }
    if (!file.type.startsWith('image/')) {
      setScreenshotError('Please upload an image file (screenshot).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setScreenshotError('Image is too large — please keep it under 10 MB.');
      return;
    }
    setScreenshotFile(file);
    setScreenshotPreview(URL.createObjectURL(file));
  }

  async function handleFinalSubmit() {
    if (!course) return;
    if (!screenshotFile) { setScreenshotError('Please attach your payment screenshot to continue.'); return; }

    setSubmitting(true);
    setSubmitError('');
    const courseId = course._id || course.id;

    try {
      // Payment screenshots are submitted by guests who don't have an
      // account yet, so this goes through a public upload endpoint (no
      // login token required) rather than the instructor-only image upload.
      const formData = new FormData();
      formData.append('screenshot', screenshotFile);
      formData.append('courseId', courseId);
      const uploadRes = await api.post('/upload/payment-screenshot', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const paymentScreenshotUrl = uploadRes?.data?.url || uploadRes?.data?.secure_url || '';

      const intake = {
        name: form.name.trim(),
        email: form.email.trim(),
        whatsapp: form.whatsapp.trim(),
        paymentMethod,
        paymentScreenshotUrl,
      };

      if (user) {
        // Already signed in — enroll right away.
        await enrollCourse(courseId, intake);
        trackPurchase(course);
        navigate('/thank-you', { replace: true, state: { courseTitle: course.title } });
      } else {
        // NEW: guest — create their student account right here using the
        // email + password from Step 1, instead of bouncing them to a
        // separate /auth/register page after payment. This is what was
        // sending "Confirm Enrollment" to a login/register screen instead
        // of the Thank You page — that detour is gone now.
        await register(form.name.trim(), form.email.trim(), form.password, 'student');
        trackCompleteRegistration();
        await enrollCourse(courseId, intake);
        trackPurchase(course);
        navigate('/thank-you', { replace: true, state: { courseTitle: course.title } });
      }
    } catch (err) {
      const message = err?.response?.data?.message || 'Something went wrong. Please try again.';
      // A duplicate-email registration error is common enough here (visitor
      // already has an account and didn't notice the "Log In" link above)
      // that it's worth a slightly more helpful message than the raw one.
      setSubmitError(
        /already registered|already exists/i.test(message)
          ? 'You already have an account with this email — please log in, then continue your enrollment.'
          : message
      );
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

      {/* HEADER — NEW: now the same shared header used on About/Privacy/
          Contact pages, so the real Super Admin logo shows here instead of
          the "Lerni" text wordmark, and it no longer duplicates the fetch
          logic in every page that needs a header. */}
      <SiteHeader />

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
            {/* Marketing headline — sits above everything else on the page */}
            <h2 className="text-lg md:text-xl font-bold text-[#e8540a] mb-5 md:mb-6 leading-snug" style={{ fontFamily: "'Playfair Display', serif" }}>
              Enroll Now in Our Updated 2026 Shopify &amp; Digital Marketing Course
            </h2>

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
                  <label htmlFor="enroll-name" className="flex items-center gap-1.5 text-sm font-bold text-[#3d3020] mb-1.5"><User size={15} className="text-[#e8540a]" /> Full Name</label>
                  <input
                    id="enroll-name" name="name" value={form.name} onChange={handleChange}
                    placeholder="e.g. Ayesha Siddiqui" autoComplete="name"
                    // text-base (16px) — anything smaller triggers an
                    // automatic zoom-in on focus in mobile Safari/Chrome,
                    // which is what was leaving the page "zoomed" afterward.
                    className={`w-full border rounded-xl px-4 py-3 text-base text-[#1a1208] outline-none transition ${errors.name ? 'border-red-400' : 'border-[#ece6dd] focus:border-[#e8540a]'}`}
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label htmlFor="enroll-email" className="flex items-center gap-1.5 text-sm font-bold text-[#3d3020] mb-1.5"><Mail size={15} className="text-[#e8540a]" /> Email Address</label>
                  <input
                    id="enroll-email" name="email" type="email" value={form.email} onChange={handleChange}
                    placeholder="you@email.com" autoComplete="email"
                    className={`w-full border rounded-xl px-4 py-3 text-base text-[#1a1208] outline-none transition ${errors.email ? 'border-red-400' : 'border-[#ece6dd] focus:border-[#e8540a]'}`}
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label htmlFor="enroll-whatsapp" className="flex items-center gap-1.5 text-sm font-bold text-[#3d3020] mb-1.5"><MessageCircle size={15} className="text-[#e8540a]" /> WhatsApp Number</label>
                  <input
                    id="enroll-whatsapp" name="whatsapp" value={form.whatsapp} onChange={handleChange}
                    placeholder="03XX-XXXXXXX" autoComplete="tel" inputMode="tel"
                    className={`w-full border rounded-xl px-4 py-3 text-base text-[#1a1208] outline-none transition ${errors.whatsapp ? 'border-red-400' : 'border-[#ece6dd] focus:border-[#e8540a]'}`}
                  />
                  {errors.whatsapp && <p className="text-red-500 text-xs mt-1">{errors.whatsapp}</p>}
                  <p className="text-xs text-[#9e9789] mt-1.5">Used only for enrollment and payment confirmation.</p>
                </div>

                {/* NEW: password field now always shows, regardless of login
                    state (previously hidden once `user` was set, which
                    looked like the field "disappeared" the next time the
                    same person visited this page after registering). If the
                    visitor is already logged in, this input is simply
                    ignored on submit — enrollCourse runs directly without
                    calling register() again (see handleFinalSubmit). */}
                <div>
                  <label htmlFor="enroll-password" className="flex items-center gap-1.5 text-sm font-bold text-[#3d3020] mb-1.5"><Lock size={15} className="text-[#e8540a]" /> Create a Password</label>
                  <input
                    id="enroll-password" name="password" type="password" value={form.password} onChange={handleChange}
                    placeholder="Minimum 6 characters" autoComplete="new-password"
                    className={`w-full border rounded-xl px-4 py-3 text-base text-[#1a1208] outline-none transition ${errors.password ? 'border-red-400' : 'border-[#ece6dd] focus:border-[#e8540a]'}`}
                  />
                  {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                  <div className="flex items-start gap-2 bg-[#fdf2ea] border border-[#f5ddc4] rounded-lg px-3 py-2.5 mt-2">
                    <ShieldCheck size={15} className="text-[#e8540a] flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-[#7a4a00]">
                      {user
                        ? "You're already logged in, so this won't be used — enrolling will use your existing account."
                        : <>You'll use this <strong>email and password</strong> to log into your student portal
                            once your enrollment is confirmed — keep it somewhere safe.</>}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleContinue}
                  className="w-full bg-[#e8540a] hover:bg-[#c94708] text-white font-bold py-3.5 rounded-xl transition text-base border-none cursor-pointer mt-2"
                >
                  Continue to Payment
                </button>

                {!user && (
                  <button
                    type="button"
                    onClick={handleLoginClick}
                    className="w-full flex items-center justify-center gap-1.5 text-[#3d3020] hover:text-[#e8540a] font-semibold text-sm bg-transparent border-none cursor-pointer py-1"
                  >
                    <LogIn size={15} /> Already have an account? Log In
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-5">
                <h1 className="text-xl md:text-2xl font-bold text-[#1a1208]" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Choose how you'd like to pay
                </h1>
                <p className="text-[#3d3020] text-sm md:text-base -mt-3 leading-relaxed">
                  Please submit your course fee of <span className="font-bold text-[#1a1208]">{priceLabel}</span> using
                  any option below, then attach a screenshot of your payment. Once we confirm it, you'll get access
                  to our portal for this course.
                </p>

                <div className="space-y-3">
                  {PAYMENT_METHOD_DATA.map((m) => {
                    const MIcon = m.icon;
                    const selected = paymentMethod === m.id;
                    return (
                      <div key={m.id}>
                        <button
                          type="button"
                          onClick={() => setPaymentMethod(m.id)}
                          className={`w-full text-left border rounded-xl p-4 flex items-center gap-3 transition cursor-pointer ${
                            selected ? 'border-[#e8540a] bg-[#fdf2ea] rounded-b-none border-b-0' : 'border-[#ece6dd] bg-white hover:border-[#ddd5c4]'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${selected ? 'bg-[#e8540a] text-white' : 'bg-[#f0ebe3] text-[#9e9789]'}`}>
                            <MIcon size={18} />
                          </div>
                          <p className="font-bold text-[#1a1208] text-sm md:text-base flex-1">{m.label}</p>
                          <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${selected ? 'border-[#e8540a]' : 'border-[#ddd5c4]'}`}>
                            {selected && <div className="w-2.5 h-2.5 rounded-full bg-[#e8540a]" />}
                          </div>
                        </button>

                        {/* Account details — each on its own line (name/logo,
                            account title, account number), instead of the
                            old single crammed line. "Bank Transfer" lists
                            both accounts; JazzCash/Easypaisa list their one. */}
                        {selected && (
                          <div className="border border-t-0 border-[#e8540a] bg-[#fdf2ea] rounded-b-xl px-4 pb-4 pt-1 space-y-3">
                            {m.accounts.map((acc, i) => (
                              <div key={i} className="bg-white border border-[#ece6dd] rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[#f0ebe3]">
                                  <AccountLogo acc={acc} logoUrl={paymentLogos[acc.key]} />
                                  <span className="font-bold text-[#1a1208] text-sm">{acc.name}</span>
                                </div>
                                <div className="space-y-1.5 text-xs md:text-sm">
                                  <p><span className="text-[#9e9789]">Account Title: </span><span className="font-semibold text-[#3d3020]">{acc.accountTitle}</span></p>
                                  {/* NEW: account number made bold and a size
                                      larger — it's the number people actually
                                      need to copy, so it should stand out. */}
                                  <p><span className="text-[#9e9789]">Account Number: </span><span className="font-bold text-[#1a1208] font-mono text-sm md:text-base">{acc.accountNumber}</span></p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Payment screenshot — required before enrollment can be confirmed */}
                <div>
                  <label className="text-sm font-bold text-[#3d3020] mb-1.5 block">
                    Payment Screenshot <span className="text-[#e8540a]">*</span>
                  </label>
                  <input
                    ref={fileInputRef} type="file" accept="image/*"
                    onChange={handleScreenshotChange} className="hidden" id="payment-screenshot"
                  />
                  {screenshotPreview ? (
                    <div className="border border-[#ece6dd] rounded-xl p-3 flex items-center gap-3">
                      <img src={screenshotPreview} alt="Payment screenshot preview" className="w-16 h-16 rounded-lg object-cover flex-shrink-0 border border-[#ece6dd]" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-[#1a1208] truncate">{screenshotFile?.name}</p>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-xs text-[#e8540a] hover:text-[#c94708] font-bold bg-transparent border-none cursor-pointer p-0 mt-1"
                        >
                          Replace image
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label
                      htmlFor="payment-screenshot"
                      className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl py-7 cursor-pointer transition ${
                        screenshotError ? 'border-red-300 bg-red-50' : 'border-[#ddd5c4] hover:border-[#e8540a] bg-[#f8f4ed]'
                      }`}
                    >
                      <ImagePlus size={22} className="text-[#e8540a]" />
                      <span className="text-sm font-semibold text-[#3d3020]">Tap to attach your payment screenshot</span>
                      <span className="text-xs text-[#9e9789]">JPG, PNG, or WebP — up to 10 MB</span>
                    </label>
                  )}
                  {screenshotError && <p className="text-red-500 text-xs mt-1">{screenshotError}</p>}
                </div>

                <div className="flex items-start gap-2 bg-[#f8f4ed] border border-[#ece6dd] rounded-xl p-3.5">
                  <ShieldCheck size={18} className="text-[#e8540a] flex-shrink-0 mt-0.5" />
                  <p className="text-xs md:text-sm text-[#6b5e4e]">
                    After you complete the transfer, attach your screenshot above and tap "Confirm
                    Enrollment" — access is granted as soon as your payment is verified, and we'll
                    message you on WhatsApp to confirm.
                  </p>
                </div>

                {submitError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3.5">
                    <p className="text-red-600 text-sm">{submitError}</p>
                    {/already have an account/i.test(submitError) && (
                      <button
                        type="button"
                        onClick={handleLoginClick}
                        className="mt-2 text-red-700 hover:text-red-800 font-bold text-sm underline bg-transparent border-none cursor-pointer p-0"
                      >
                        Log In
                      </button>
                    )}
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
                    disabled={submitting || !screenshotFile}
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

      {/* FOOTER — NEW: swapped from this page's own 6-column footer to the
          same shared footer used on the course landing page (address/phone/
          email, FAQ accordion, newsletter) with the Super Admin footer logo. */}
      <SiteFooter />
    </div>
  );
}
// src/Pages/AuthPages.jsx
import React, { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCourses } from "../context/CoursesContext";
import { enrollCourse } from "../api/courseApi";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import {
  trackCompleteRegistration,
  trackInitiateCheckout,
  trackPurchase,
  getPendingCourse,
  clearPendingCourse,
} from "../utils/facebookPixel";

export default function AuthPage({ mode = "login" }) {
  const navigate            = useNavigate();
  const [searchParams]      = useSearchParams();          // ← reads ?redirect=
  const { login, register } = useAuth();
  const { courses }         = useCourses();
  const isLogin             = mode === "login";

  const [form, setForm] = useState({
    name: "", email: "", password: "", role: "student",
  });
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const checkoutFiredRef = React.useRef(false);

  // Meta Pixel: InitiateCheckout once when user arrives to register for a course
  React.useEffect(() => {
    if (checkoutFiredRef.current) return;
    const courseId = searchParams.get("courseId");
    if (!courseId) return;
    const pending = getPendingCourse();
    if (pending && String(pending._id || pending.id) === courseId) {
      checkoutFiredRef.current = true;
      trackInitiateCheckout(pending);
    }
  }, [searchParams]);

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError("");
  }

  function getErrorMessage(err) {
    if (!err.response) {
      return "Cannot reach the server right now. Please check your connection and try again.";
    }
    const msg    = err.response?.data?.message;
    const status = err.response?.status;
    if (msg)            return msg;
    if (status === 401) return "Wrong email or password.";
    if (status === 409) return "Email already registered. Please sign in.";
    if (status === 500) return "Server error. Please try again in a moment.";
    return "Something went wrong. Try again.";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.email.trim() || !form.password.trim()) {
      setError("Email and password are required."); return;
    }
    if (!isLogin && !form.name.trim()) {
      setError("Full name is required."); return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters."); return;
    }

    setLoading(true);
    try {
      const user = isLogin
        ? await login(form.email.trim(), form.password)
        : await register(form.name.trim(), form.email.trim(), form.password, form.role);

      // Meta Pixel: registration completed
      if (!isLogin) {
        trackCompleteRegistration();
      }

      // Meta Pixel: complete enrollment funnel → Purchase
      const courseId = searchParams.get("courseId");
      const pending = getPendingCourse();
      if (courseId && pending && String(pending._id || pending.id) === courseId) {
        try {
          // If the visitor went through the Enrollment page first (name /
          // email / WhatsApp + payment method), pick those answers back up
          // here and send them along with the enrollment. NOTE: the normal
          // enrollment flow (EnrolledPage.jsx) now registers guests inline
          // and never routes through this page — this pickup only matters
          // for older links or anyone who lands here directly.
          let intake = null;
          try {
            const raw = localStorage.getItem("lerni_enroll_intake");
            if (raw) intake = JSON.parse(raw);
          } catch { /* ignore malformed/blocked storage */ }

          await enrollCourse(courseId, intake || undefined);
          trackPurchase(pending);
          clearPendingCourse();
          localStorage.removeItem("lerni_enroll_intake");
        } catch (enrollErr) {
          console.warn("[Meta Pixel] Post-auth enrollment failed:", enrollErr?.message);
        }
      }

      // ── REDIRECT LOGIC ────────────────────────────────────────────────
      // If the user came from a course page (e.g. clicked "Enroll"),
      // ?redirect=/portal will be in the URL — send them there.
      // Otherwise fall back to role-based default dashboard.
      const redirectTo =
        searchParams.get("redirect") ||
        (user.role === "instructor" ? "/instructor" : "/portal");

      navigate(redirectTo, { replace: true });

    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  // ── Keep login/register links so the ?redirect param is preserved ────────
  const authBase     = isLogin ? "/auth/register" : "/auth/login";
  const redirectParam = searchParams.get("redirect")
    ? `?redirect=${searchParams.get("redirect")}`
    : "";
  const switchLink = `${authBase}${redirectParam}`;

  // NEW: "Register free" (shown only in login mode) now sends the visitor
  // back into the enrollment flow instead of this page's own register form.
  // If we know which course they were trying to enroll in (courseId is in
  // the URL — EnrolledPage.jsx's "Already have an account? Log In" link
  // passes this), send them straight back to that course's enrollment
  // Step 1. Otherwise (a generic visit to the login page) send them to
  // Courses, since picking a course to enroll in is how sign-up starts now.
  // Register mode itself is left reachable (e.g. for instructor sign-up).
  // NEW: "Register free" (shown only in login mode) now sends the visitor
  // back into the enrollment flow instead of this page's own register form.
  // If we know which course they were trying to enroll in (courseId is in
  // the URL — EnrolledPage.jsx's "Already have an account? Log In" link
  // passes this), send them straight back to that course's enrollment
  // Step 1. Otherwise (a generic visit to the login page, e.g. via the
  // header's "Log In" button with no course in context) fall back to the
  // first course in the catalog — the requirement is that this link always
  // opens an enrollment page, never the Courses listing. Only if the
  // catalog is completely empty does it fall back to Courses at all.
  // Register mode itself is left reachable (e.g. for instructor sign-up).
  const courseIdParam = searchParams.get("courseId");
  const fallbackCourseId = courses && courses.length > 0 ? (courses[0]._id || courses[0].id) : null;
  const targetCourseId = courseIdParam || fallbackCourseId;
  const registerFreeLink = targetCourseId ? `/course/${targetCourseId}/enroll` : "/courses";

  return (
    <div className="min-h-screen bg-[#FDFAF6] flex flex-col" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <SiteHeader />

      <main className="flex-1 w-full flex items-center justify-center px-4 py-10 md:py-14">
        <div className="w-full max-w-md bg-white border border-[#ece6dd] rounded-2xl shadow-sm p-7 md:p-9">

          {/* Heading */}
          <div className="text-center mb-7">
            <h1 className="text-2xl md:text-3xl font-bold text-[#1a1208] mb-1.5" style={{ fontFamily: "'Playfair Display', serif" }}>
              {isLogin ? "Welcome Back" : "Create Your Account"}
            </h1>
            <p className="text-[#9e9789] text-sm md:text-base">
              {isLogin ? "Sign in to continue to your portal." : "Join Lerni and start learning today."}
            </p>

            {/* Show a hint if user was redirected from a course enroll click */}
            {searchParams.get("redirect") && (
              <div className="mt-3 bg-[#fdf2ea] border border-[#f5ddc4] rounded-lg px-3.5 py-2">
                <p className="text-xs text-[#7a4a00] m-0">
                  🔒 {isLogin ? "Sign in" : "Create a free account"} to enroll in this course
                </p>
              </div>
            )}
          </div>

          {/* Error box */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5">
              <p className="text-red-600 text-sm m-0 leading-relaxed whitespace-pre-line">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Name — register only */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-bold text-[#3d3020] mb-1.5">Full Name</label>
                <input name="name" value={form.name} onChange={handleChange}
                  placeholder="e.g. John Doe" autoComplete="name"
                  className="w-full border border-[#ece6dd] rounded-xl px-4 py-3 text-base text-[#1a1208] outline-none focus:border-[#e8540a] transition" />
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-bold text-[#3d3020] mb-1.5">Email Address</label>
              <input name="email" type="email" value={form.email}
                onChange={handleChange} placeholder="you@email.com"
                autoComplete="email"
                className="w-full border border-[#ece6dd] rounded-xl px-4 py-3 text-base text-[#1a1208] outline-none focus:border-[#e8540a] transition" />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-bold text-[#3d3020] mb-1.5">Password</label>
              <input name="password" type="password" value={form.password}
                onChange={handleChange} placeholder="Minimum 6 characters"
                autoComplete={isLogin ? "current-password" : "new-password"}
                className="w-full border border-[#ece6dd] rounded-xl px-4 py-3 text-base text-[#1a1208] outline-none focus:border-[#e8540a] transition" />
            </div>

            {/* Role selector — register only */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-bold text-[#3d3020] mb-1.5">I want to...</label>
                <div className="flex gap-2.5">
                  {[
                    { value: "student",    emoji: "🎓", label: "Learn", sub: "Enroll in courses" },
                    { value: "instructor", emoji: "🏫", label: "Teach", sub: "Create & sell courses" },
                  ].map(r => (
                    <label key={r.value}
                      className={`flex-1 flex flex-col items-center gap-1 rounded-xl py-3.5 px-2.5 cursor-pointer text-center transition border-2 ${
                        form.role === r.value ? 'border-[#e8540a] bg-[#fdf2ea]' : 'border-[#ece6dd] bg-white hover:border-[#ddd5c4]'
                      }`}>
                      <input type="radio" name="role" value={r.value}
                        checked={form.role === r.value} onChange={handleChange}
                        className="hidden" />
                      <span className="text-2xl">{r.emoji}</span>
                      <span className="text-sm font-extrabold text-[#1a1208]">{r.label}</span>
                      <span className="text-[11px] text-[#9e9789]">{r.sub}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading}
              className="bg-[#e8540a] hover:bg-[#c94708] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition text-base border-none cursor-pointer mt-1.5">
              {loading ? "Please wait…" : isLogin ? "Sign In →" : "Create Account →"}
            </button>
          </form>

          {/* Switch login ↔ register (register mode only switches to login;
              login mode's "Register free" is handled separately below since
              it now points into the enrollment flow, not this page's own
              register form — see registerFreeLink above). */}
          <p className="text-center mt-6 text-sm text-[#6b5e4e]">
            {isLogin ? (
              <>Don't have an account?{" "}
                <Link to={registerFreeLink} className="text-[#e8540a] font-bold no-underline hover:text-[#c94708]">
                  Register free
                </Link>
              </>
            ) : (
              <>Already have an account?{" "}
                <Link to={switchLink} className="text-[#e8540a] font-bold no-underline hover:text-[#c94708]">
                  Login here
                </Link>
              </>
            )}
          </p>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
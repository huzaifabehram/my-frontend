// src/Pages/Shopify.jsx
import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";

// ─────────────────────────────────────────────────────────────────────────────
// STAR RATING
// ─────────────────────────────────────────────────────────────────────────────
const StarRating = ({ rating, size = "sm" }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map(s => (
      <svg key={s} className={`${size === "lg" ? "w-5 h-5" : "w-4 h-4"} ${s <= Math.round(rating) ? "text-amber-400" : "text-gray-300"}`} fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
      </svg>
    ))}
  </div>
);

function getYouTubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/watch\?v=|\/shorts\/))([^&?/\s]{11})/);
  return m ? m[1] : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// VIDEO MODAL
// ─────────────────────────────────────────────────────────────────────────────
function VideoModal({ lectures, startIndex = 0, onClose }) {
  const [currentIdx, setCurrentIdx] = useState(startIndex);
  const videoRef  = useRef(null);
  const [playing,  setPlaying]  = useState(false);
  const [progress, setProgress] = useState(0);
  const [muted,    setMuted]    = useState(false);
  const current = lectures[currentIdx];
  const ytId    = getYouTubeId(current?.videoUrl);
  const hasNext = currentIdx < lectures.length - 1;
  const hasPrev = currentIdx > 0;

  useEffect(() => { setPlaying(false); setProgress(0); if (videoRef.current) videoRef.current.load(); }, [currentIdx]);
  useEffect(() => { const h = e => { if (e.key === "Escape") onClose(); }; window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h); }, [onClose]);
  useEffect(() => { document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = ""; }; }, []);

  const goNext = () => { if (hasNext) setCurrentIdx(i => i + 1); };
  const goPrev = () => { if (hasPrev) setCurrentIdx(i => i - 1); };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-gray-900 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-400 mb-0.5">Preview {currentIdx + 1} of {lectures.length}</p>
            <p className="text-sm font-bold text-white truncate">{current?.title}</p>
          </div>
          <button onClick={onClose} className="ml-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors flex-shrink-0">✕</button>
        </div>
        <div className="relative bg-black aspect-video">
          {ytId ? (
            <iframe key={current?._id} src={`https://www.youtube.com/embed/${ytId}?autoplay=1`} className="w-full h-full" allow="autoplay; encrypted-media" allowFullScreen title={current?.title}/>
          ) : current?.videoUrl ? (
            <>
              <video ref={videoRef} key={current?._id} src={current.videoUrl} className="w-full h-full object-contain cursor-pointer"
                onTimeUpdate={() => { if (videoRef.current?.duration) setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100); }}
                onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
                onEnded={() => { setPlaying(false); if (hasNext) setTimeout(goNext, 800); }}
                muted={muted} onClick={() => playing ? videoRef.current.pause() : videoRef.current.play()}/>
              {!playing && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer" onClick={() => videoRef.current?.play()}>
                  <div className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/60 flex items-center justify-center hover:scale-110 transition-transform">
                    <svg className="w-7 h-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  </div>
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20"><div className="h-full bg-amber-400 transition-all" style={{ width: `${progress}%` }}/></div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center"><div className="text-center"><div className="text-5xl mb-3">🎬</div><p className="text-white/60 text-sm">No preview available</p></div></div>
          )}
        </div>
        <div className="flex items-center justify-between px-5 py-3 bg-gray-800">
          <button onClick={goPrev} disabled={!hasPrev} className="text-xs font-bold text-white/70 hover:text-white disabled:opacity-30 transition-colors">← Prev</button>
          <div className="flex gap-1.5 overflow-x-auto max-w-xs">
            {lectures.map((_, i) => (
              <button key={i} onClick={() => setCurrentIdx(i)} className={`w-7 h-7 rounded-full text-xs font-bold flex-shrink-0 transition-all ${i === currentIdx ? "bg-amber-400 text-gray-900" : "bg-white/10 text-white/60 hover:bg-white/20"}`}>{i + 1}</button>
            ))}
          </div>
          <button onClick={goNext} disabled={!hasNext} className="text-xs font-bold text-white/70 hover:text-white disabled:opacity-30 transition-colors">Next →</button>
        </div>
        <div className="max-h-40 overflow-y-auto divide-y divide-white/5">
          {lectures.map((lec, i) => (
            <button key={lec._id || i} onClick={() => setCurrentIdx(i)} className={`w-full flex items-center gap-3 px-5 py-2.5 text-left transition-colors ${i === currentIdx ? "bg-amber-400/10" : "hover:bg-white/5"}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${i === currentIdx ? "bg-amber-400 text-gray-900" : "bg-white/10 text-white/60"}`}>{i === currentIdx ? "▶" : i + 1}</div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs truncate ${i === currentIdx ? "text-amber-300 font-bold" : "text-white/70"}`}>{lec.title}</p>
                {lec.duration && <p className="text-xs text-white/40">{lec.duration}</p>}
              </div>
              {i < currentIdx && <span className="text-xs text-emerald-400">✓</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COURSE THUMBNAIL
// ─────────────────────────────────────────────────────────────────────────────
function CourseThumbnail({ course, freeLectures, onPreview }) {
  return (
    <div className="relative rounded-xl overflow-hidden shadow-2xl cursor-pointer group" onClick={onPreview}>
      {course.thumbnail
        ? <img src={course.thumbnail} alt={course.title} className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-300"/>
        : <div className="w-full aspect-video bg-gradient-to-br from-indigo-800 to-purple-900 flex items-center justify-center"><span className="text-6xl">📚</span></div>}
      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/55 transition-colors flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/70 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform shadow-xl">
            <svg className="w-7 h-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          </div>
          <p className="text-white font-bold text-base">Preview this course</p>
          {freeLectures > 0 && <p className="text-white/70 text-xs mt-1">{freeLectures} free preview{freeLectures !== 1 ? "s" : ""}</p>}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PRICE + ENROLL CARD
// ─────────────────────────────────────────────────────────────────────────────
function PriceEnrollCard({ course, enrolled, enrolling, onEnroll, added, setAdded }) {
  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <span className="text-3xl font-black text-gray-900">${course.discountPrice ?? course.price ?? 0}</span>
        {course.discountPrice && course.price && (<><span className="text-lg text-gray-400 line-through">${course.price}</span><span className="text-sm font-bold text-red-500 bg-red-50 rounded px-2 py-0.5">{Math.round(100 - (course.discountPrice / course.price) * 100)}% off</span></>)}
        {(!course.price || course.price === 0) && <span className="text-sm font-bold text-emerald-600 bg-emerald-50 rounded px-2 py-0.5">FREE</span>}
      </div>
      {course.discountPrice && <p className="text-xs text-red-500 font-semibold -mt-2">⚡ Limited time offer!</p>}
      <button onClick={onEnroll} disabled={enrolling} className={`w-full py-3.5 rounded-xl font-black text-sm transition-all shadow-lg ${enrolled ? "bg-emerald-500 hover:bg-emerald-600 text-white" : enrolling ? "bg-indigo-400 text-white cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200"}`}>
        {enrolled ? "✓ Go to My Course →" : enrolling ? "Enrolling..." : !course.price || course.price === 0 ? "Enroll Free →" : "Enroll Now →"}
      </button>
      {!enrolled && (
        <button onClick={() => setAdded(a => !a)} className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all ${added ? "bg-green-500 text-white" : "bg-amber-400 hover:bg-amber-500 text-gray-900"}`}>
          {added ? "✓ Added to Wishlist" : "♡ Add to Wishlist"}
        </button>
      )}
      <p className="text-center text-xs text-gray-500">30-Day Money-Back Guarantee</p>
      <div className="border-t pt-3 space-y-1.5">
        {["Full lifetime access","Access on mobile & desktop","Certificate of completion","Downloadable resources"].map(item => (
          <div key={item} className="flex items-center gap-2 text-xs text-gray-600">
            <svg className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
            {item}
          </div>
        ))}
      </div>
      <div className="pt-2 border-t flex justify-center gap-2 flex-wrap">
        {["VISA","MC","AMEX","PayPal"].map(c => <span key={c} className="text-xs font-bold bg-gray-100 border border-gray-200 rounded px-2 py-1 text-gray-600">{c}</span>)}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COURSE CARD
// ─────────────────────────────────────────────────────────────────────────────
function CourseCard({ course, onClick }) {
  return (
    <div onClick={onClick} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden group hover:-translate-y-1">
      <div className="relative aspect-video bg-gray-100 overflow-hidden">
        {course.thumbnail ? <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/> : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100"><span className="text-4xl">📚</span></div>}
        {(!course.price || course.price === 0) && <span className="absolute top-2 right-2 text-xs font-bold bg-emerald-500 text-white px-2 py-0.5 rounded">FREE</span>}
      </div>
      <div className="p-4">
        <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 mb-1 group-hover:text-indigo-600 transition-colors">{course.title}</h3>
        <p className="text-xs text-gray-500 mb-2 truncate">{course.instructor?.name || "Instructor"}</p>
        <div className="flex items-center gap-1 mb-2">
          <span className="text-xs font-bold text-amber-500">{course.rating?.toFixed(1) || "New"}</span>
          <StarRating rating={course.rating || 0}/>
          <span className="text-xs text-gray-400">({course.studentsEnrolled || 0})</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {course.discountPrice ? (<><span className="font-black text-gray-900 text-sm">${course.discountPrice}</span><span className="text-xs text-gray-400 line-through">${course.price}</span></>) : course.price > 0 ? <span className="font-black text-gray-900 text-sm">${course.price}</span> : <span className="font-black text-emerald-600 text-sm">Free</span>}
          </div>
          <span className="text-xs text-gray-400">{course.category}</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NAVBAR — always shows Log In + Sign Up when logged out
// ─────────────────────────────────────────────────────────────────────────────
function Navbar({ user }) {
  const navigate = useNavigate();
  return (
    <nav className="bg-gray-900 text-white px-4 sm:px-6 flex items-center justify-between sticky top-0 z-50 shadow-lg" style={{ minHeight: 56 }}>
      {/* Logo */}
      <button onClick={() => navigate("/courses")} className="text-xl font-black text-amber-400 hover:text-amber-300 transition-colors py-3 flex-shrink-0">
        LearnFlow
      </button>

      {/* Search bar hint — desktop only */}
      <div className="hidden md:flex flex-1 mx-6 max-w-sm">
        <div className="w-full flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/10 hover:border-white/20 rounded-lg px-3 py-2 cursor-pointer transition-all" onClick={() => navigate("/courses")}>
          <svg className="w-4 h-4 text-white/40 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <span className="text-sm text-white/35">Search for anything...</span>
        </div>
      </div>

      {/* Right: auth buttons or user menu */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {user ? (
          <>
            <span className="text-sm text-slate-300 hidden sm:block">Hi, {user.name?.split(" ")[0]}</span>
            <button onClick={() => navigate(user.role === "instructor" ? "/instructor" : "/portal")}
              className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-lg transition-colors">
              {user.role === "instructor" ? "Dashboard →" : "My Learning →"}
            </button>
          </>
        ) : (
          <>
            {/* ── LOG IN — outlined button ── */}
            <Link to="/auth/login"
              className="text-sm font-semibold text-slate-200 hover:text-white border border-slate-500 hover:border-slate-300 px-4 py-1.5 rounded-lg transition-all whitespace-nowrap">
              Log In
            </Link>
            {/* ── SIGN UP — filled amber button ── */}
            <Link to="/auth/register"
              className="text-sm font-bold bg-amber-400 hover:bg-amber-300 text-gray-900 px-4 py-1.5 rounded-lg transition-colors whitespace-nowrap">
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BREADCRUMB
// ─────────────────────────────────────────────────────────────────────────────
function Breadcrumb({ items }) {
  return (
    <div className="bg-gray-800 border-b border-gray-700 px-4 sm:px-6 py-2">
      <div className="max-w-7xl mx-auto flex items-center gap-1.5 text-xs text-slate-400 flex-wrap">
        {items.map((item, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-slate-600">›</span>}
            {item.href ? <Link to={item.href} className="hover:text-amber-400 transition-colors">{item.label}</Link> : <span className="text-slate-300 font-medium">{item.label}</span>}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RATING BREAKDOWN BAR
// ─────────────────────────────────────────────────────────────────────────────
function RatingBar({ stars, count, total }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <div className="flex items-center gap-0.5 flex-shrink-0">
        {[1,2,3,4,5].map(s => (
          <svg key={s} className={`w-3 h-3 ${s <= stars ? "text-amber-400" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
          </svg>
        ))}
      </div>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }}/>
      </div>
      <span className="text-gray-400 w-7 text-right tabular-nums">{pct}%</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// REVIEWS SECTION — fetches real reviews from GET /api/reviews/:courseId
// ─────────────────────────────────────────────────────────────────────────────
function ReviewsSection({ courseId, course, user, enrolled }) {
  const [reviews,    setReviews]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [myRating,   setMyRating]   = useState(0);
  const [myComment,  setMyComment]  = useState("");
  const [submitted,  setSubmitted]  = useState(false);
  const [formError,  setFormError]  = useState("");
  const [showAll,    setShowAll]    = useState(false);

  useEffect(() => {
    if (!courseId) return;
    API.get(`/reviews/${courseId}`)
      .then(res => { const d = res.data; setReviews(Array.isArray(d) ? d : d.reviews || []); })
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, [courseId]);

  const avgRating    = reviews.length > 0 ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : (course?.rating || 0);
  const totalReviews = reviews.length;
  const breakdown    = [5,4,3,2,1].map(star => ({ stars: star, count: reviews.filter(r => Math.round(r.rating) === star).length }));

  const handleSubmit = async () => {
    if (!myRating)        { setFormError("Please select a star rating."); return; }
    if (!myComment.trim()) { setFormError("Please write a comment."); return; }
    setSubmitting(true); setFormError("");
    try {
      const res = await API.post(`/reviews/${courseId}`, { rating: myRating, comment: myComment });
      setReviews(prev => [res.data, ...prev]);
      setSubmitted(true);
    } catch (err) {
      setFormError(err.response?.data?.message || "Could not submit review.");
    } finally {
      setSubmitting(false);
    }
  };

  const displayed = showAll ? reviews : reviews.slice(0, 4);

  return (
    <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h2 className="text-2xl font-extrabold text-gray-900 mb-5">Student Reviews</h2>

      {/* Overview */}
      <div className="flex flex-col sm:flex-row gap-6 mb-6 pb-6 border-b border-gray-100">
        <div className="flex flex-col items-center justify-center bg-amber-50 rounded-2xl p-5 min-w-[110px]">
          <span className="text-5xl font-black text-amber-500 leading-none">{avgRating > 0 ? avgRating.toFixed(1) : "—"}</span>
          <div className="mt-2"><StarRating rating={avgRating} size="lg"/></div>
          <span className="text-xs text-gray-400 mt-1">Course Rating</span>
        </div>
        <div className="flex-1 space-y-2 justify-center flex flex-col">
          {breakdown.map(b => <RatingBar key={b.stars} stars={b.stars} count={b.count} total={totalReviews}/>)}
        </div>
      </div>

      {/* Write review form */}
      {user && enrolled && !submitted && (
        <div className="mb-6 pb-6 border-b border-gray-100 bg-indigo-50 rounded-xl p-5">
          <h3 className="font-bold text-gray-800 mb-3">Leave a Review</h3>
          <div className="flex items-center gap-1 mb-3">
            {[1,2,3,4,5].map(s => (
              <button key={s} onClick={() => setMyRating(s)}>
                <svg className={`w-8 h-8 transition-colors ${s <= myRating ? "text-amber-400" : "text-gray-300 hover:text-amber-300"}`} fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
              </button>
            ))}
            {myRating > 0 && <span className="ml-2 text-sm text-gray-500">{["","Poor","Fair","Good","Very Good","Excellent"][myRating]}</span>}
          </div>
          <textarea value={myComment} onChange={e => setMyComment(e.target.value)} rows={3}
            placeholder="Share your experience with this course..."
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none mb-3"/>
          {formError && <p className="text-xs text-red-500 mb-2">{formError}</p>}
          <button onClick={handleSubmit} disabled={submitting}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-6 py-2.5 rounded-xl disabled:opacity-50 transition-colors">
            {submitting ? "Submitting..." : "Submit Review"}
          </button>
        </div>
      )}

      {submitted && (
        <div className="mb-6 pb-6 border-b border-gray-100 bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
          <p className="text-2xl mb-1">🌟</p>
          <p className="font-bold text-emerald-700">Thank you for your review!</p>
        </div>
      )}

      {/* Reviews list */}
      {loading ? (
        <div className="flex justify-center py-8"><div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"/></div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-3xl mb-2">💬</p>
          <p className="text-gray-500 text-sm">No reviews yet. {user && enrolled ? "Be the first to review!" : "Enroll to leave a review."}</p>
        </div>
      ) : (
        <>
          <div className="space-y-5">
            {displayed.map((review, i) => (
              <div key={review._id || i} className="flex gap-4 pb-5 border-b border-gray-50 last:border-0 last:pb-0">
                <div className="flex-shrink-0">
                  {review.student?.avatar
                    ? <img src={review.student.avatar} className="w-10 h-10 rounded-full object-cover" alt={review.student?.name}/>
                    : <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                        {(review.student?.name || "A")[0].toUpperCase()}
                      </div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 text-sm">{review.student?.name || "Anonymous"}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <StarRating rating={review.rating}/>
                    <span className="text-xs text-gray-400">
                      {review.createdAt ? new Date(review.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : ""}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mt-2 leading-relaxed">{review.comment}</p>
                </div>
              </div>
            ))}
          </div>
          {reviews.length > 4 && (
            <button onClick={() => setShowAll(s => !s)} className="mt-5 w-full py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">
              {showAll ? "Show Less ↑" : `Show All ${reviews.length} Reviews ↓`}
            </button>
          )}
        </>
      )}

      {!user && (
        <div className="mt-4 pt-4 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-500"><Link to="/auth/register" className="text-indigo-600 font-bold hover:underline">Enroll in this course</Link> to leave a review</p>
        </div>
      )}
    </section>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// COURSE LISTING PAGE
// ═════════════════════════════════════════════════════════════════════════════
function CoursesListPage({ user }) {
  const navigate   = useNavigate();
  const [courses,  setCourses]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [category, setCategory] = useState("All");

  useEffect(() => {
    API.get("/courses")
      .then(res => { const d = res.data; setCourses(Array.isArray(d) ? d : d.courses || []); })
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }, []);

  const categories = ["All", ...new Set(courses.map(c => c.category).filter(Boolean))];
  const filtered   = courses.filter(c =>
    (category === "All" || c.category === category) &&
    (c.title?.toLowerCase().includes(search.toLowerCase()) ||
     c.category?.toLowerCase().includes(search.toLowerCase()) ||
     c.description?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user}/>
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "All Courses" }]}/>
      <div className="bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 text-white py-14 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 leading-tight">Learn Without Limits</h1>
          <p className="text-slate-300 text-lg mb-8">Browse our courses — no account needed to explore.</p>
          <div className="relative max-w-xl mx-auto">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search for courses, topics..."
              className="w-full px-5 py-4 rounded-xl text-gray-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-400 pr-12"/>
            <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </div>
        </div>
      </div>
      {categories.length > 1 && (
        <div className="bg-white border-b border-gray-100 px-4 sm:px-6 py-3 sticky top-[56px] z-30 shadow-sm">
          <div className="max-w-7xl mx-auto flex gap-2 overflow-x-auto pb-1">
            {categories.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                className={`flex-shrink-0 text-xs font-bold px-4 py-1.5 rounded-full transition-all ${category === cat ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {loading ? (
          <div className="flex items-center justify-center py-24"><div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"/></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">📭</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">No courses found</h2>
            <p className="text-gray-500">{search || category !== "All" ? "Try a different search or category." : "No published courses yet."}</p>
            {(search || category !== "All") && <button onClick={() => { setSearch(""); setCategory("All"); }} className="mt-4 bg-indigo-600 text-white font-bold px-5 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm">Clear Filters</button>}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
              <p className="text-sm text-gray-500"><span className="font-bold text-gray-800">{filtered.length}</span> course{filtered.length !== 1 ? "s" : ""} available</p>
              {!user && <p className="text-sm text-gray-500"><Link to="/auth/register" className="text-indigo-600 font-bold hover:underline">Sign up free</Link> to start learning</p>}
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map(course => <CourseCard key={course._id} course={course} onClick={() => navigate(`/course/${course._id}`)}/>)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// COURSE DETAIL PAGE
// ═════════════════════════════════════════════════════════════════════════════
function CourseDetailPage({ user }) {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [course,       setCourse]       = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [enrolling,    setEnrolling]    = useState(false);
  const [enrolled,     setEnrolled]     = useState(false);
  const [openSections, setOpenSections] = useState([]);
  const [added,        setAdded]        = useState(false);
  const [expanded,     setExpanded]     = useState(false);
  const [modalOpen,    setModalOpen]    = useState(false);
  const [modalStart,   setModalStart]   = useState(0);
  const [previewLecs,  setPreviewLecs]  = useState([]);

  useEffect(() => {
    API.get(`/courses/${id}`)
      .then(res => {
        const c = res.data.course || res.data;
        setCourse(c);
        if (c.sections?.length) setOpenSections([c.sections[0]._id]);
        const free = (c.sections || []).flatMap(s => (s.lectures || []).filter(l => l.free));
        setPreviewLecs(free.length > 0 ? free : (c.sections?.[0]?.lectures?.slice(0, 1) || []));
      })
      .catch(() => setCourse(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (user && id) {
      API.get(`/enrollments/check/${id}`)
        .then(res => setEnrolled(res.data.isEnrolled ?? res.data.enrolled ?? false))
        .catch(() => {});
    }
  }, [user, id]);

  const openPreview = useCallback((startIdx = 0) => { setModalStart(startIdx); setModalOpen(true); }, []);

  const handleEnroll = async () => {
    if (!user) { navigate(`/auth/register?from=/course/${id}`); return; }
    if (enrolled) { navigate("/portal"); return; }
    try {
      setEnrolling(true);
      await API.post(`/enrollments/${id}`);
      setEnrolled(true);
      setTimeout(() => navigate("/portal"), 1200);
    } catch (err) {
      alert(err.response?.data?.message || "Could not enroll. Please try again.");
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center"><div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"/><p className="text-gray-500">Loading course...</p></div>
    </div>
  );

  if (!course) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center"><div className="text-5xl mb-4">😕</div><h2 className="text-xl font-bold text-gray-800 mb-2">Course not found</h2><button onClick={() => navigate("/courses")} className="text-indigo-600 font-semibold hover:underline">← Back to Courses</button></div>
    </div>
  );

  const totalLectures = course.sections?.reduce((a, s) => a + (s.lectures?.length || 0), 0) || 0;
  const freeLectures  = course.sections?.flatMap(s => s.lectures || []).filter(l => l.free).length || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {modalOpen && previewLecs.length > 0 && <VideoModal lectures={previewLecs} startIndex={modalStart} onClose={() => setModalOpen(false)}/>}

      <Navbar user={user}/>
      <Breadcrumb items={[
        { label: "Home", href: "/" },
        { label: "Courses", href: "/courses" },
        { label: course.category || "Course", href: `/courses?cat=${course.category}` },
        { label: course.title?.length > 40 ? course.title.slice(0, 40) + "…" : course.title },
      ]}/>

      {/* Hero */}
      <div className="bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 text-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 lg:py-14">
          <div className="max-w-2xl lg:max-w-[60%]">
            <button onClick={() => navigate("/courses")} className="text-sm text-slate-400 hover:text-white mb-4 flex items-center gap-1 transition-colors">← All Courses</button>
            {course.badge && <span className="text-xs font-bold bg-amber-400 text-amber-900 px-2 py-0.5 rounded mb-3 inline-block">{course.badge}</span>}
            <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight mb-3">{course.title}</h1>
            <p className="text-slate-300 text-base mb-4 leading-relaxed">{course.subtitle || course.description?.slice(0, 160)}</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm mb-4">
              {course.rating > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-amber-400">{course.rating.toFixed(1)}</span>
                  <StarRating rating={course.rating}/>
                  <span className="text-slate-400">({course.totalRatings || 0} ratings)</span>
                </div>
              )}
              {course.studentsEnrolled > 0 && <span className="text-slate-300">{course.studentsEnrolled.toLocaleString()} students enrolled</span>}
              <span className="text-slate-400">Updated {course.updatedAt ? new Date(course.updatedAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "Recently"}</span>
            </div>
            {course.instructor && (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-amber-400 flex items-center justify-center font-bold text-gray-900 flex-shrink-0">{course.instructor.name?.[0] || "I"}</div>
                <span className="text-sm text-slate-300">Created by <span className="text-amber-400 font-semibold">{course.instructor.name}</span>{course.instructor.title && <span className="text-slate-400"> · {course.instructor.title}</span>}</span>
              </div>
            )}
            {course.tags?.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {course.tags.map(tag => <span key={tag} className="text-xs bg-white/10 border border-white/20 rounded-full px-3 py-1 text-slate-300">{tag}</span>)}
              </div>
            )}
          </div>
        </div>
        <div className="hidden lg:block h-8"/>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Left column */}
          <div className="flex-1 min-w-0 space-y-6 py-6 lg:pr-4">

            {/* Mobile card */}
            <div className="lg:hidden space-y-4">
              <CourseThumbnail course={course} freeLectures={freeLectures} onPreview={() => openPreview(0)}/>
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-5">
                <PriceEnrollCard course={course} enrolled={enrolled} enrolling={enrolling} onEnroll={handleEnroll} added={added} setAdded={setAdded}/>
              </div>
            </div>

            {/* What you'll learn */}
            {course.whatYouLearn?.length > 0 && (
              <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h2 className="text-2xl font-extrabold text-gray-900 mb-4">What you'll learn</h2>
                <div className="grid sm:grid-cols-2 gap-2">
                  {course.whatYouLearn.map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                      <p className="text-sm text-gray-700">{item}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Description */}
            <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-2xl font-extrabold text-gray-900 mb-3">Description</h2>
              <div className={`overflow-hidden transition-all duration-500 relative ${expanded ? "max-h-[600px]" : "max-h-32"}`}>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{course.description}</p>
                {!expanded && <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent"/>}
              </div>
              <button onClick={() => setExpanded(e => !e)} className="mt-2 text-sm font-semibold text-purple-600 hover:text-purple-800 transition-colors">
                {expanded ? "Show less ↑" : "Show more ↓"}
              </button>
            </section>

            {/* Requirements */}
            {course.requirements?.length > 0 && (
              <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h2 className="text-xl font-extrabold text-gray-900 mb-3">Requirements</h2>
                <ul className="list-disc list-inside space-y-1.5">
                  {course.requirements.map((r, i) => <li key={i} className="text-sm text-gray-600">{r}</li>)}
                </ul>
              </section>
            )}

            {/* ── CURRICULUM — Udemy-style rows ── */}
            {course.sections?.length > 0 && (
              <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h2 className="text-2xl font-extrabold text-gray-900 mb-1">Course Content</h2>
                <p className="text-sm text-gray-500 mb-4">
                  {course.sections.length} sections • {totalLectures} lectures{freeLectures > 0 && ` • ${freeLectures} free previews`}
                </p>
                <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                  {course.sections.map(section => (
                    <div key={section._id}>
                      <button
                        onClick={() => setOpenSections(p => p.includes(section._id) ? p.filter(x => x !== section._id) : [...p, section._id])}
                        className="w-full flex justify-between items-center px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                      >
                        <div className="flex items-center gap-2">
                          <svg className={`w-4 h-4 text-gray-500 transition-transform ${openSections.includes(section._id) ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                          </svg>
                          <span className="font-semibold text-sm text-gray-800">{section.title}</span>
                        </div>
                        <span className="text-xs text-gray-500">{section.lectures?.length || 0} lectures</span>
                      </button>

                      {openSections.includes(section._id) && (
                        <div className="divide-y divide-gray-50">
                          {section.lectures?.map((lec, li) => {
                            const isPreviewable = lec.free;
                            const lecIdx = previewLecs.findIndex(pl => (pl._id || pl.id) === (lec._id || lec.id));
                            return (
                              <div
                                key={lec._id || li}
                                className={`flex items-center justify-between px-5 py-3 transition-colors ${isPreviewable ? "hover:bg-purple-50 cursor-pointer" : ""}`}
                                onClick={() => isPreviewable && openPreview(lecIdx >= 0 ? lecIdx : 0)}
                              >
                                {/* Left: icon + title + Preview badge */}
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                  {isPreviewable ? (
                                    // Play button circle — like Udemy
                                    <div className="w-6 h-6 rounded-full border border-purple-300 bg-purple-50 flex items-center justify-center flex-shrink-0">
                                      <svg className="w-3 h-3 text-purple-600 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                                    </div>
                                  ) : (
                                    <div className="w-6 h-6 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center flex-shrink-0">
                                      <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                                      </svg>
                                    </div>
                                  )}

                                  {/* Title */}
                                  <span className={`text-sm truncate ${isPreviewable ? "text-gray-800" : "text-gray-700"}`}>
                                    {lec.title}
                                  </span>

                                  {/* "Preview" clickable badge — Udemy blue link style */}
                                  {isPreviewable && (
                                    <span className="flex-shrink-0 text-xs text-purple-600 border border-purple-200 bg-purple-50 hover:bg-purple-100 rounded px-2 py-0.5 font-semibold transition-colors ml-1">
                                      Preview
                                    </span>
                                  )}
                                </div>

                                {/* Right: duration — always shown at end of line */}
                                {lec.duration ? (
                                  <span className="text-xs text-gray-400 flex-shrink-0 ml-4 tabular-nums font-mono">
                                    {lec.duration}
                                  </span>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Instructor */}
            {course.instructor && (
              <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h2 className="text-2xl font-extrabold text-gray-900 mb-5">Your Instructor</h2>
                <div className="flex items-start gap-5">
                  <div className="w-20 h-20 rounded-full bg-purple-600 flex items-center justify-center text-white font-black text-2xl flex-shrink-0">
                    {course.instructor.name?.[0] || "I"}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-purple-700">{course.instructor.name}</h3>
                    {course.instructor.title && <p className="text-sm text-gray-500 mt-0.5">{course.instructor.title}</p>}
                    {course.instructor.bio   && <p className="mt-3 text-sm text-gray-700 leading-relaxed">{course.instructor.bio}</p>}
                  </div>
                </div>
              </section>
            )}

            {/* ── REAL REVIEWS ── */}
            <ReviewsSection courseId={id} course={course} user={user} enrolled={enrolled}/>
          </div>

          {/* Floating sticky card */}
          <div className="hidden lg:block w-80 xl:w-96 flex-shrink-0">
            <div className="sticky" style={{ top: "80px" }}>
              <div className="bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden" style={{ marginTop: "-220px" }}>
                <CourseThumbnail course={course} freeLectures={freeLectures} onPreview={() => openPreview(0)}/>
                <div className="p-5">
                  <PriceEnrollCard course={course} enrolled={enrolled} enrolling={enrolling} onEnroll={handleEnroll} added={added} setAdded={setAdded}/>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile bottom bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t px-4 py-3 flex items-center justify-between z-50 shadow-lg">
        <div>
          <span className="text-xl font-black text-gray-900">${course.discountPrice ?? course.price ?? 0}</span>
          {course.discountPrice && <span className="text-sm text-gray-400 line-through ml-2">${course.price}</span>}
        </div>
        <button onClick={handleEnroll} disabled={enrolling}
          className={`px-6 py-2.5 rounded-lg text-sm font-black transition-all ${enrolled ? "bg-emerald-500 text-white" : enrolling ? "bg-indigo-400 text-white cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700 text-white"}`}>
          {enrolled ? "Go to Course →" : enrolling ? "Enrolling..." : "Enroll Now"}
        </button>
      </div>
    </div>
  );
}

export default function Shopify() {
  const { id }   = useParams();
  const { user } = useAuth();
  if (id) return <CourseDetailPage user={user}/>;
  return <CoursesListPage user={user}/>;
}
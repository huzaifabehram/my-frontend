// src/Pages/Shopify.jsx — Mobile-first Udemy-style landing page
import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";

// ─── Star Rating ──────────────────────────────────────────────────────────────
const StarRating = ({ rating = 0, size = "sm" }) => (
  <div className="flex items-center gap-0.5">
    {[1,2,3,4,5].map(s => (
      <svg key={s} className={`${size==="lg"?"w-5 h-5":size==="xl"?"w-7 h-7":"w-3.5 h-3.5"} ${s<=Math.round(rating)?"text-amber-400":"text-gray-300"}`} fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
      </svg>
    ))}
  </div>
);

// ─── YouTube helpers ──────────────────────────────────────────────────────────
function getYouTubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/watch\?v=|\/shorts\/))([^&?/\s]{11})/);
  return m ? m[1] : null;
}

// ─── Video Modal ──────────────────────────────────────────────────────────────
function VideoModal({ lectures, startIndex=0, onClose }) {
  const [idx, setIdx] = useState(startIndex);
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const current = lectures[idx];
  const ytId = getYouTubeId(current?.videoUrl);

  useEffect(() => { setPlaying(false); setProgress(0); if(videoRef.current) videoRef.current.load(); }, [idx]);
  useEffect(() => {
    const h = e => { if(e.key==="Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  useEffect(() => { document.body.style.overflow="hidden"; return () => { document.body.style.overflow=""; }; }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/90 backdrop-blur-sm" onClick={e => e.target===e.currentTarget&&onClose()}>
      <div className="bg-gray-900 w-full sm:max-w-2xl sm:rounded-2xl overflow-hidden shadow-2xl" style={{maxHeight:"90vh"}}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-400">Preview {idx+1} of {lectures.length}</p>
            <p className="text-sm font-bold text-white truncate">{current?.title}</p>
          </div>
          <button onClick={onClose} className="ml-3 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-lg flex-shrink-0">✕</button>
        </div>

        {/* Video */}
        <div className="relative bg-black" style={{aspectRatio:"16/9"}}>
          {ytId ? (
            <iframe key={current?._id} src={`https://www.youtube.com/embed/${ytId}?autoplay=1`} className="w-full h-full" allow="autoplay; encrypted-media" allowFullScreen title={current?.title}/>
          ) : current?.videoUrl ? (
            <>
              <video ref={videoRef} src={current.videoUrl} className="w-full h-full object-contain cursor-pointer"
                onTimeUpdate={() => { if(videoRef.current?.duration) setProgress((videoRef.current.currentTime/videoRef.current.duration)*100); }}
                onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
                onEnded={() => { setPlaying(false); if(idx<lectures.length-1) setTimeout(()=>setIdx(i=>i+1),800); }}
                onClick={() => playing ? videoRef.current.pause() : videoRef.current.play()}/>
              {!playing && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer" onClick={() => videoRef.current?.play()}>
                  <div className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/60 flex items-center justify-center">
                    <svg className="w-7 h-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  </div>
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20"><div className="h-full bg-amber-400 transition-all" style={{width:`${progress}%`}}/></div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <p className="text-white/50 text-sm">No preview available</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-800">
          <button onClick={() => setIdx(i=>Math.max(i-1,0))} disabled={idx===0} className="text-sm font-bold text-white/70 hover:text-white disabled:opacity-30 px-3 py-1.5 rounded-lg bg-white/10 disabled:bg-transparent">← Prev</button>
          <div className="flex gap-1.5 overflow-x-auto">
            {lectures.map((_,i) => (
              <button key={i} onClick={() => setIdx(i)} className={`w-7 h-7 rounded-full text-xs font-bold flex-shrink-0 ${i===idx?"bg-amber-400 text-gray-900":"bg-white/10 text-white/60"}`}>{i+1}</button>
            ))}
          </div>
          <button onClick={() => setIdx(i=>Math.min(i+1,lectures.length-1))} disabled={idx>=lectures.length-1} className="text-sm font-bold text-white/70 hover:text-white disabled:opacity-30 px-3 py-1.5 rounded-lg bg-white/10 disabled:bg-transparent">Next →</button>
        </div>

        {/* Lecture list */}
        <div className="overflow-y-auto divide-y divide-white/5" style={{maxHeight:160}}>
          {lectures.map((lec,i) => (
            <button key={lec._id||i} onClick={() => setIdx(i)} className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${i===idx?"bg-amber-400/10":"hover:bg-white/5"}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${i===idx?"bg-amber-400 text-gray-900":"bg-white/10 text-white/60"}`}>{i===idx?"▶":i+1}</div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs truncate ${i===idx?"text-amber-300 font-bold":"text-white/70"}`}>{lec.title}</p>
                {lec.duration && <p className="text-xs text-white/40">{lec.duration}</p>}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar({ user }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-gray-900 text-white sticky top-0 z-50 shadow-lg">
      <div className="px-4 sm:px-6 flex items-center justify-between" style={{height:56}}>
        <button onClick={() => navigate("/courses")} className="text-lg font-black text-amber-400 flex-shrink-0">LearnFlow</button>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-2">
          {user ? (
            <>
              <span className="text-sm text-slate-300">Hi, {user.name?.split(" ")[0]}</span>
              <button onClick={() => navigate(user.role==="instructor"?"/instructor":"/portal")}
                className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-lg transition-colors">
                {user.role==="instructor"?"Dashboard":"My Learning"}
              </button>
            </>
          ) : (
            <>
              <Link to="/auth/login" className="text-sm font-semibold text-slate-200 hover:text-white border border-slate-600 hover:border-slate-400 px-3 py-1.5 rounded-lg transition-all">Log In</Link>
              <Link to="/auth/register" className="text-sm font-bold bg-amber-400 hover:bg-amber-300 text-gray-900 px-4 py-1.5 rounded-lg transition-colors">Sign Up</Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button className="sm:hidden p-2 text-white" onClick={() => setMenuOpen(m=>!m)}>
          {menuOpen
            ? <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
            : <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/></svg>
          }
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="sm:hidden bg-gray-800 border-t border-gray-700 px-4 py-3 space-y-2">
          {user ? (
            <button onClick={() => { navigate(user.role==="instructor"?"/instructor":"/portal"); setMenuOpen(false); }}
              className="w-full text-sm bg-indigo-600 text-white font-bold py-2.5 rounded-lg">
              {user.role==="instructor"?"Go to Dashboard":"Go to My Learning"}
            </button>
          ) : (
            <>
              <Link to="/auth/login" onClick={() => setMenuOpen(false)} className="block w-full text-center text-sm font-semibold border border-slate-500 text-slate-200 py-2.5 rounded-lg">Log In</Link>
              <Link to="/auth/register" onClick={() => setMenuOpen(false)} className="block w-full text-center text-sm font-bold bg-amber-400 text-gray-900 py-2.5 rounded-lg">Sign Up Free</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}

// ─── Breadcrumb ───────────────────────────────────────────────────────────────
function Breadcrumb({ items }) {
  return (
    <div className="bg-gray-800 border-b border-gray-700 px-4 sm:px-6 py-2 overflow-x-auto">
      <div className="flex items-center gap-1 text-xs text-slate-400 whitespace-nowrap">
        {items.map((item,i) => (
          <span key={i} className="flex items-center gap-1">
            {i>0 && <span className="text-slate-600">›</span>}
            {item.href
              ? <Link to={item.href} className="hover:text-amber-400 transition-colors">{item.label}</Link>
              : <span className="text-slate-300 font-medium">{item.label}</span>
            }
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Rating Bar ───────────────────────────────────────────────────────────────
function RatingBar({ stars, count, total }) {
  const pct = total>0 ? Math.round((count/total)*100) : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <StarRating rating={stars} size="sm"/>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden min-w-0">
        <div className="h-full bg-amber-400 rounded-full" style={{width:`${pct}%`}}/>
      </div>
      <span className="text-gray-400 w-7 text-right flex-shrink-0">{pct}%</span>
    </div>
  );
}

// ─── Reviews Section ──────────────────────────────────────────────────────────
function ReviewsSection({ courseId, course, user, enrolled }) {
  const [reviews,    setReviews]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [myRating,   setMyRating]   = useState(0);
  const [myComment,  setMyComment]  = useState("");
  const [submitted,  setSubmitted]  = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError,  setFormError]  = useState("");
  const [showAll,    setShowAll]    = useState(false);

  useEffect(() => {
    if(!courseId) return;
    API.get(`/reviews/${courseId}`)
      .then(res => { const d=res.data; setReviews(Array.isArray(d)?d:d.reviews||[]); })
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, [courseId]);

  const avg = reviews.length>0 ? reviews.reduce((a,r)=>a+r.rating,0)/reviews.length : (course?.rating||0);
  const breakdown = [5,4,3,2,1].map(star => ({ stars:star, count:reviews.filter(r=>Math.round(r.rating)===star).length }));
  const displayed = showAll ? reviews : reviews.slice(0,4);

  const handleSubmit = async () => {
    if(!myRating)        { setFormError("Please select a star rating."); return; }
    if(!myComment.trim()) { setFormError("Please write a comment."); return; }
    setSubmitting(true); setFormError("");
    try {
      const res = await API.post(`/reviews/${courseId}`, { rating:myRating, comment:myComment });
      setReviews(prev => [res.data,...prev]);
      setSubmitted(true);
    } catch(err) {
      setFormError(err.response?.data?.message||"Could not submit review.");
    } finally { setSubmitting(false); }
  };

  return (
    <section className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm">
      <h2 className="text-xl font-extrabold text-gray-900 mb-4">Student Reviews</h2>

      {/* Rating overview */}
      <div className="flex flex-col sm:flex-row gap-4 mb-5 pb-5 border-b border-gray-100">
        <div className="flex flex-row sm:flex-col items-center gap-3 sm:gap-1 bg-amber-50 rounded-xl p-4 sm:min-w-[100px] sm:text-center">
          <span className="text-4xl sm:text-5xl font-black text-amber-500 leading-none">{avg>0?avg.toFixed(1):"—"}</span>
          <div><StarRating rating={avg} size="lg"/></div>
          <span className="text-xs text-gray-400 hidden sm:block">Course Rating</span>
        </div>
        <div className="flex-1 space-y-2 justify-center flex flex-col">
          {breakdown.map(b => <RatingBar key={b.stars} stars={b.stars} count={b.count} total={reviews.length}/>)}
        </div>
      </div>

      {/* Write review */}
      {user && enrolled && !submitted && (
        <div className="mb-5 pb-5 border-b border-gray-100 bg-indigo-50 rounded-xl p-4">
          <h3 className="font-bold text-gray-800 mb-3">Leave a Review</h3>
          <div className="flex items-center gap-1 mb-3">
            {[1,2,3,4,5].map(s => (
              <button key={s} onClick={() => setMyRating(s)}>
                <svg className={`w-8 h-8 transition-colors ${s<=myRating?"text-amber-400":"text-gray-300 hover:text-amber-300"}`} fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
              </button>
            ))}
            {myRating>0 && <span className="ml-2 text-sm text-gray-500">{["","Poor","Fair","Good","Very Good","Excellent"][myRating]}</span>}
          </div>
          <textarea value={myComment} onChange={e=>setMyComment(e.target.value)} rows={3} placeholder="Share your experience..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none mb-2"/>
          {formError && <p className="text-xs text-red-500 mb-2">{formError}</p>}
          <button onClick={handleSubmit} disabled={submitting}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl disabled:opacity-50 transition-colors w-full sm:w-auto">
            {submitting?"Submitting...":"Submit Review"}
          </button>
        </div>
      )}
      {submitted && (
        <div className="mb-5 pb-5 border-b border-gray-100 bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
          <p className="text-xl mb-1">🌟</p><p className="font-bold text-emerald-700 text-sm">Thank you for your review!</p>
        </div>
      )}

      {/* Reviews list */}
      {loading ? (
        <div className="flex justify-center py-6"><div className="w-7 h-7 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"/></div>
      ) : reviews.length===0 ? (
        <div className="text-center py-6">
          <p className="text-2xl mb-2">💬</p>
          <p className="text-gray-500 text-sm">{user&&enrolled?"Be the first to review!":"Enroll to leave a review."}</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {displayed.map((review,i) => (
              <div key={review._id||i} className="flex gap-3 pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                <div className="flex-shrink-0">
                  {review.student?.avatar
                    ? <img src={review.student.avatar} className="w-9 h-9 rounded-full object-cover" alt={review.student?.name}/>
                    : <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">{(review.student?.name||"A")[0].toUpperCase()}</div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 text-sm">{review.student?.name||"Anonymous"}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <StarRating rating={review.rating}/>
                    <span className="text-xs text-gray-400">{review.createdAt?new Date(review.createdAt).toLocaleDateString("en-US",{month:"short",year:"numeric"}):""}</span>
                  </div>
                  <p className="text-sm text-gray-700 mt-1.5 leading-relaxed">{review.comment}</p>
                </div>
              </div>
            ))}
          </div>
          {reviews.length>4 && (
            <button onClick={() => setShowAll(s=>!s)} className="mt-4 w-full py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">
              {showAll?`Show Less ↑`:`Show All ${reviews.length} Reviews ↓`}
            </button>
          )}
        </>
      )}
      {!user && (
        <div className="mt-4 pt-4 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-500"><Link to="/auth/register" className="text-indigo-600 font-bold hover:underline">Sign up</Link> to leave a review</p>
        </div>
      )}
    </section>
  );
}

// ─── Course Card ──────────────────────────────────────────────────────────────
function CourseCard({ course, onClick }) {
  return (
    <div onClick={onClick} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden group active:scale-95">
      <div className="relative bg-gray-100 overflow-hidden" style={{aspectRatio:"16/9"}}>
        {course.thumbnail
          ? <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
          : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100"><span className="text-4xl">📚</span></div>
        }
        {(!course.price||course.price===0) && <span className="absolute top-2 right-2 text-xs font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-full">FREE</span>}
        {course.badge && <span className="absolute top-2 left-2 text-xs font-bold bg-amber-400 text-amber-900 px-2 py-0.5 rounded-full">{course.badge}</span>}
      </div>
      <div className="p-3">
        <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 mb-1 group-hover:text-indigo-600 transition-colors">{course.title}</h3>
        <p className="text-xs text-gray-500 mb-1.5 truncate">{course.instructor?.name||"Instructor"}</p>
        <div className="flex items-center gap-1 mb-2">
          <span className="text-xs font-bold text-amber-500">{course.rating?.toFixed(1)||"New"}</span>
          <StarRating rating={course.rating||0}/>
          <span className="text-xs text-gray-400">({course.studentsEnrolled||0})</span>
        </div>
        <div className="flex items-center gap-1.5">
          {course.discountPrice
            ? <><span className="font-black text-gray-900 text-sm">${course.discountPrice}</span><span className="text-xs text-gray-400 line-through">${course.price}</span></>
            : course.price>0 ? <span className="font-black text-gray-900 text-sm">${course.price}</span>
            : <span className="font-black text-emerald-600 text-sm">Free</span>
          }
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// COURSES LISTING PAGE
// ═════════════════════════════════════════════════════════════════════════════
function CoursesListPage({ user }) {
  const navigate = useNavigate();
  const [courses,  setCourses]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [category, setCategory] = useState("All");

  useEffect(() => {
    API.get("/courses")
      .then(res => { const d=res.data; setCourses(Array.isArray(d)?d:d.courses||[]); })
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }, []);

  const categories = ["All",...new Set(courses.map(c=>c.category).filter(Boolean))];
  const filtered = courses.filter(c =>
    (category==="All"||c.category===category) &&
    (!search || c.title?.toLowerCase().includes(search.toLowerCase()) || c.category?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user}/>

      {/* Hero */}
      <div className="bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 text-white py-10 sm:py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl sm:text-5xl font-extrabold mb-3 leading-tight">Learn Without Limits</h1>
          <p className="text-slate-300 text-base sm:text-lg mb-6">Browse our courses — no account needed to explore.</p>
          <div className="relative">
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search courses..."
              className="w-full px-4 py-3.5 rounded-xl text-gray-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-400 pr-10"/>
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </div>
        </div>
      </div>

      {/* Category filter pills */}
      {categories.length>1 && (
        <div className="bg-white border-b border-gray-100 px-4 py-3 sticky top-14 z-30 shadow-sm">
          <div className="flex gap-2 overflow-x-auto pb-0.5 -mx-1 px-1" style={{WebkitOverflowScrolling:"touch",scrollbarWidth:"none"}}>
            {categories.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                className={`flex-shrink-0 text-xs font-bold px-4 py-1.5 rounded-full transition-all ${category===cat?"bg-gray-900 text-white":"bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300"}`}>
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-10">
        {loading ? (
          <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"/></div>
        ) : filtered.length===0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📭</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">No courses found</h2>
            <p className="text-gray-500 text-sm">{search||category!=="All"?"Try a different search.":"No published courses yet."}</p>
            {(search||category!=="All") && <button onClick={()=>{setSearch("");setCategory("All");}} className="mt-4 bg-indigo-600 text-white font-bold px-5 py-2 rounded-lg text-sm">Clear Filters</button>}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <p className="text-sm text-gray-500"><span className="font-bold text-gray-800">{filtered.length}</span> course{filtered.length!==1?"s":""} available</p>
              {!user && <Link to="/auth/register" className="text-sm text-indigo-600 font-bold hover:underline">Sign up free →</Link>}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
              {filtered.map(course => <CourseCard key={course._id} course={course} onClick={() => navigate(`/course/${course._id}`)}/>)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// COURSE DETAIL PAGE — Mobile-first Udemy layout
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
  const [activeTab,    setActiveTab]    = useState("overview");

  useEffect(() => {
    API.get(`/courses/${id}`)
      .then(res => {
        const c = res.data.course||res.data;
        setCourse(c);
        if(c.sections?.length) setOpenSections([c.sections[0]._id]);
        const free = (c.sections||[]).flatMap(s=>(s.lectures||[]).filter(l=>l.free));
        setPreviewLecs(free.length>0 ? free : (c.sections?.[0]?.lectures?.slice(0,1)||[]));
      })
      .catch(() => setCourse(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if(user&&id) {
      API.get(`/enrollments/check/${id}`)
        .then(res => setEnrolled(res.data.isEnrolled??res.data.enrolled??false))
        .catch(() => {});
    }
  }, [user,id]);

  const openPreview = useCallback((idx=0) => { setModalStart(idx); setModalOpen(true); }, []);

  const handleEnroll = async () => {
    if(!user) { navigate(`/auth/register?from=/course/${id}`); return; }
    if(enrolled) { navigate("/portal"); return; }
    try {
      setEnrolling(true);
      await API.post(`/enrollments/${id}`);
      setEnrolled(true);
      setTimeout(() => navigate("/portal"), 1200);
    } catch(err) {
      alert(err.response?.data?.message||"Could not enroll. Please try again.");
    } finally { setEnrolling(false); }
  };

  if(loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center"><div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"/><p className="text-gray-500 text-sm">Loading course...</p></div>
    </div>
  );
  if(!course) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center"><div className="text-5xl mb-4">😕</div><h2 className="text-xl font-bold text-gray-800 mb-2">Course not found</h2><button onClick={() => navigate("/courses")} className="text-indigo-600 font-semibold hover:underline text-sm">← Back to Courses</button></div>
    </div>
  );

  const totalLectures = course.sections?.reduce((a,s)=>a+(s.lectures?.length||0),0)||0;
  const freeLectures  = course.sections?.flatMap(s=>s.lectures||[]).filter(l=>l.free).length||0;

  // Enroll button content
  const EnrollBtn = ({ full=false }) => (
    <button onClick={handleEnroll} disabled={enrolling}
      className={`${full?"w-full":"px-6"} py-3 rounded-xl font-black text-sm transition-all shadow ${enrolled?"bg-emerald-500 hover:bg-emerald-600 text-white":enrolling?"bg-indigo-400 text-white cursor-not-allowed":"bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200"}`}>
      {enrolled?"✓ Go to My Course →":enrolling?"Enrolling...":!course.price||course.price===0?"Enroll Free →":"Enroll Now →"}
    </button>
  );

  const tabs = ["overview","curriculum","reviews","instructor"];

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-0">
      {modalOpen&&previewLecs.length>0 && <VideoModal lectures={previewLecs} startIndex={modalStart} onClose={() => setModalOpen(false)}/>}

      <Navbar user={user}/>

      {/* Breadcrumb */}
      <Breadcrumb items={[
        {label:"Home",href:"/"},
        {label:"Courses",href:"/courses"},
        {label:course.category||"Course"},
        {label:course.title?.length>35?course.title.slice(0,35)+"…":course.title},
      ]}/>

      {/* ── HERO (dark) ─────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
          {/* Mobile: thumbnail first */}
          <div className="lg:hidden mb-5">
            <div className="relative rounded-xl overflow-hidden shadow-xl cursor-pointer group" onClick={() => openPreview(0)}>
              {course.thumbnail
                ? <img src={course.thumbnail} alt={course.title} className="w-full object-cover" style={{aspectRatio:"16/9"}}/>
                : <div className="w-full bg-gradient-to-br from-indigo-800 to-purple-900 flex items-center justify-center" style={{aspectRatio:"16/9"}}><span className="text-5xl">📚</span></div>
              }
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-active:bg-black/50 transition-colors">
                <div className="text-center">
                  <div className="w-14 h-14 rounded-full bg-white/20 border-2 border-white/70 flex items-center justify-center mx-auto mb-2">
                    <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  </div>
                  <p className="text-white font-bold text-sm">Preview this course</p>
                  {freeLectures>0 && <p className="text-white/60 text-xs mt-0.5">{freeLectures} free preview{freeLectures!==1?"s":""}</p>}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:max-w-[60%]">
            {course.badge && <span className="text-xs font-bold bg-amber-400 text-amber-900 px-2 py-0.5 rounded mb-2 inline-block">{course.badge}</span>}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-tight mb-3">{course.title}</h1>
            <p className="text-slate-300 text-sm sm:text-base mb-4 leading-relaxed">{course.subtitle||course.description?.slice(0,160)}</p>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm mb-3">
              {course.rating>0 && (
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-amber-400">{course.rating.toFixed(1)}</span>
                  <StarRating rating={course.rating}/>
                  <span className="text-slate-400 text-xs">({course.totalRatings||0})</span>
                </div>
              )}
              {course.studentsEnrolled>0 && <span className="text-slate-300 text-xs">{course.studentsEnrolled.toLocaleString()} students</span>}
            </div>

            {course.instructor && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center font-bold text-gray-900 text-sm flex-shrink-0">{course.instructor.name?.[0]||"I"}</div>
                <span className="text-sm text-slate-300">by <span className="text-amber-400 font-semibold">{course.instructor.name}</span></span>
              </div>
            )}
          </div>
        </div>
        <div className="hidden lg:block h-6"/>
      </div>

      {/* ── MAIN LAYOUT ────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col lg:flex-row gap-0 lg:gap-8">

          {/* ── LEFT COLUMN ────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0 py-5 lg:py-6 space-y-5">

            {/* Tab navigation */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="flex border-b border-gray-100 overflow-x-auto" style={{WebkitOverflowScrolling:"touch",scrollbarWidth:"none"}}>
                {tabs.map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`flex-shrink-0 px-4 sm:px-5 py-3 text-sm font-semibold capitalize border-b-2 transition-colors ${activeTab===tab?"border-indigo-600 text-indigo-600":"border-transparent text-gray-500 hover:text-gray-800"}`}>
                    {tab==="reviews"?`Reviews`:tab.charAt(0).toUpperCase()+tab.slice(1)}
                  </button>
                ))}
              </div>

              <div className="p-4 sm:p-6">
                {/* OVERVIEW */}
                {activeTab==="overview" && (
                  <div className="space-y-5">
                    {course.whatYouLearn?.length>0 && (
                      <div>
                        <h2 className="text-xl font-extrabold text-gray-900 mb-3">What you'll learn</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {course.whatYouLearn.map((item,i) => (
                            <div key={i} className="flex items-start gap-2">
                              <svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                              <p className="text-sm text-gray-700">{item}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {course.requirements?.length>0 && (
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Requirements</h3>
                        <ul className="list-disc list-inside space-y-1">
                          {course.requirements.map((r,i) => <li key={i} className="text-sm text-gray-600">{r}</li>)}
                        </ul>
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">Description</h3>
                      <div className={`overflow-hidden transition-all duration-500 relative ${expanded?"max-h-[600px]":"max-h-24"}`}>
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{course.description}</p>
                        {!expanded && <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent"/>}
                      </div>
                      <button onClick={() => setExpanded(e=>!e)} className="mt-2 text-sm font-semibold text-purple-600 hover:text-purple-800 transition-colors">
                        {expanded?"Show less ↑":"Show more ↓"}
                      </button>
                    </div>
                  </div>
                )}

                {/* CURRICULUM */}
                {activeTab==="curriculum" && (
                  <div>
                    <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                      <div>
                        <h2 className="text-xl font-extrabold text-gray-900">Course Content</h2>
                        <p className="text-sm text-gray-500">{course.sections?.length||0} sections • {totalLectures} lectures{freeLectures>0&&` • ${freeLectures} free`}</p>
                      </div>
                      {previewLecs.length>0 && (
                        <button onClick={() => openPreview(0)} className="flex items-center gap-1.5 text-xs font-bold text-purple-600 border border-purple-200 bg-purple-50 px-3 py-1.5 rounded-lg hover:bg-purple-100 transition-colors">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                          Watch {previewLecs.length} Free Preview{previewLecs.length!==1?"s":""}
                        </button>
                      )}
                    </div>
                    <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                      {course.sections?.map(section => (
                        <div key={section._id}>
                          <button onClick={() => setOpenSections(p => p.includes(section._id)?p.filter(x=>x!==section._id):[...p,section._id])}
                            className="w-full flex justify-between items-center px-3 sm:px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <svg className={`w-4 h-4 text-gray-500 transition-transform flex-shrink-0 ${openSections.includes(section._id)?"rotate-90":""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                              <span className="font-semibold text-sm text-gray-800 truncate">{section.title}</span>
                            </div>
                            <span className="text-xs text-gray-500 flex-shrink-0 ml-2">{section.lectures?.length||0} lectures</span>
                          </button>
                          {openSections.includes(section._id) && (
                            <div className="divide-y divide-gray-50">
                              {section.lectures?.map((lec,li) => {
                                const isPreview = lec.free;
                                const lecIdx = previewLecs.findIndex(pl=>(pl._id||pl.id)===(lec._id||lec.id));
                                return (
                                  <div key={lec._id||li}
                                    className={`flex items-center justify-between px-3 sm:px-5 py-2.5 transition-colors ${isPreview?"hover:bg-purple-50 cursor-pointer active:bg-purple-100":""}`}
                                    onClick={() => isPreview&&openPreview(lecIdx>=0?lecIdx:0)}>
                                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                      {isPreview
                                        ? <div className="w-6 h-6 rounded-full border border-purple-300 bg-purple-50 flex items-center justify-center flex-shrink-0"><svg className="w-3 h-3 text-purple-600 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div>
                                        : <div className="w-6 h-6 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center flex-shrink-0"><svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg></div>
                                      }
                                      <span className={`text-sm truncate ${isPreview?"text-gray-800":"text-gray-700"}`}>{lec.title}</span>
                                      {isPreview && <span className="flex-shrink-0 text-xs text-purple-600 border border-purple-200 bg-purple-50 rounded px-1.5 py-0.5 font-semibold">Preview</span>}
                                    </div>
                                    {lec.duration && <span className="text-xs text-gray-400 flex-shrink-0 ml-2 tabular-nums">{lec.duration}</span>}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* REVIEWS */}
                {activeTab==="reviews" && (
                  <ReviewsSection courseId={id} course={course} user={user} enrolled={enrolled}/>
                )}

                {/* INSTRUCTOR */}
                {activeTab==="instructor" && course.instructor && (
                  <div>
                    <h2 className="text-xl font-extrabold text-gray-900 mb-4">Your Instructor</h2>
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-full bg-purple-600 flex items-center justify-center text-white font-black text-2xl flex-shrink-0">{course.instructor.name?.[0]||"I"}</div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-purple-700">{course.instructor.name}</h3>
                        {course.instructor.title && <p className="text-sm text-gray-500 mt-0.5">{course.instructor.title}</p>}
                        {course.instructor.bio && <p className="mt-2 text-sm text-gray-700 leading-relaxed">{course.instructor.bio}</p>}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── RIGHT STICKY COLUMN (desktop only) ─────────────────────── */}
          <div className="hidden lg:block w-80 xl:w-96 flex-shrink-0">
            <div className="sticky" style={{top:80}}>
              {/* Card overlaps hero */}
              <div className="bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden" style={{marginTop:"-180px"}}>
                {/* Thumbnail */}
                <div className="relative cursor-pointer group" onClick={() => openPreview(0)}>
                  {course.thumbnail
                    ? <img src={course.thumbnail} alt={course.title} className="w-full object-cover group-hover:scale-105 transition-transform duration-300" style={{aspectRatio:"16/9"}}/>
                    : <div className="w-full bg-gradient-to-br from-indigo-800 to-purple-900 flex items-center justify-center" style={{aspectRatio:"16/9"}}><span className="text-5xl">📚</span></div>
                  }
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 flex items-center justify-center transition-colors">
                    <div className="text-center">
                      <div className="w-14 h-14 rounded-full bg-white/20 border-2 border-white/70 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                        <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                      </div>
                      <p className="text-white font-bold text-sm">Preview</p>
                      {freeLectures>0 && <p className="text-white/60 text-xs">{freeLectures} free previews</p>}
                    </div>
                  </div>
                </div>

                {/* Price + enroll */}
                <div className="p-5 space-y-3">
                  <div className="flex items-end gap-3">
                    <span className="text-3xl font-black text-gray-900">${course.discountPrice??course.price??0}</span>
                    {course.discountPrice&&course.price && (<><span className="text-lg text-gray-400 line-through">${course.price}</span><span className="text-sm font-bold text-red-500 bg-red-50 rounded px-2 py-0.5">{Math.round(100-(course.discountPrice/course.price)*100)}% off</span></>)}
                    {(!course.price||course.price===0) && <span className="text-sm font-bold text-emerald-600 bg-emerald-50 rounded px-2 py-0.5">FREE</span>}
                  </div>
                  {course.discountPrice && <p className="text-xs text-red-500 font-semibold">⚡ Limited time offer!</p>}
                  <EnrollBtn full/>
                  {!enrolled && (
                    <button onClick={() => setAdded(a=>!a)} className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all ${added?"bg-green-500 text-white":"bg-amber-400 hover:bg-amber-500 text-gray-900"}`}>
                      {added?"✓ Added to Wishlist":"♡ Add to Wishlist"}
                    </button>
                  )}
                  <p className="text-center text-xs text-gray-500">30-Day Money-Back Guarantee</p>
                  <div className="border-t pt-3 space-y-1.5">
                    {["Full lifetime access","Certificate of completion","Mobile & desktop access","Downloadable resources"].map(item => (
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
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── MOBILE STICKY BOTTOM BAR ─────────────────────────────────── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-2xl">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex-shrink-0">
            <span className="text-xl font-black text-gray-900">${course.discountPrice??course.price??0}</span>
            {course.discountPrice && <span className="text-xs text-gray-400 line-through ml-1.5">${course.price}</span>}
          </div>
          <EnrollBtn full/>
        </div>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function Shopify() {
  const { id }   = useParams();
  const { user } = useAuth();
  if(id) return <CourseDetailPage user={user}/>;
  return <CoursesListPage user={user}/>;
}
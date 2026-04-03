// client/src/Pages/Portals.jsx
import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// ─────────────────────────────────────────────────────────────────────────────
// API SETUP
// ─────────────────────────────────────────────────────────────────────────────
const BASE_URL = "https://my-course-backend-8u69.onrender.com/api";

function authHeaders() {
  const token = localStorage.getItem("token");
  return { headers: { Authorization: `Bearer ${token}` } };
}

// ─────────────────────────────────────────────────────────────────────────────
// STATIC FALLBACK DATA
// ─────────────────────────────────────────────────────────────────────────────
const FALLBACK_STUDENT = {
  name: "Student", email: "",
  avatar: "https://i.pravatar.cc/150?img=11",
  joinedDate: "2024", bio: "Passionate learner.",
  totalCourses: 0, completedCourses: 0, totalHours: 0,
  certificates: 0, streak: 0, xp: 0, level: 1,
  weeklyGoal: 5, weeklyDone: 0,
};

const ACTIVITY_DATA = [
  { day: "Mon", minutes: 45 }, { day: "Tue", minutes: 90 },
  { day: "Wed", minutes: 30 }, { day: "Thu", minutes: 120 },
  { day: "Fri", minutes: 60 }, { day: "Sat", minutes: 0  },
  { day: "Sun", minutes: 75 },
];

// ─────────────────────────────────────────────────────────────────────────────
// DATA NORMALIZERS
// ─────────────────────────────────────────────────────────────────────────────

// FIX: accepts completedLectureIds array from Progress model
function normalizeCourse(c, index, completedLectureIds = []) {
  const colors = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ec4899"];
  const sections    = c.sections || [];
  const allLectures = sections.flatMap(s => s.lectures || []);
  const totalLectures     = allLectures.length;
  // FIX: use completedLectureIds from Progress model, not lec.completed
  const completedLectures = allLectures.filter(
    l => completedLectureIds.includes(String(l._id))
  ).length;
  const progress = totalLectures > 0
    ? Math.round((completedLectures / totalLectures) * 100) : 0;

  return {
    _id: c._id, id: c._id,
    title:            c.title        || "Untitled Course",
    instructor:       typeof c.instructor === "object"
                        ? c.instructor?.name
                        : c.instructor || "Instructor",
    instructorAvatar: `https://i.pravatar.cc/60?img=${(index + 10) % 70}`,
    thumbnail:        c.thumbnail    || "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=600&q=80",
    progress, totalLectures, completedLectures,
    totalDuration:    `${totalLectures * 15}m`,
    category:         c.category     || "Course",
    rating:           c.rating       || 4.5,
    color:            colors[index % colors.length],
    certificateReady: progress === 100,
    description:      c.description  || "",
    sections,
    // store completed ids per course so Learn tab can use them
    completedLectureIds,
  };
}

function normalizeSections(sections) {
  return (sections || []).map((sec, si) => ({
    id:       sec._id || `sec${si}`,
    title:    sec.title || `Section ${si + 1}`,
    lectures: (sec.lectures || []).map((lec, li) => ({
      id:        lec._id  || `lec${li}`,
      title:     lec.title    || `Lecture ${li + 1}`,
      duration:  lec.duration || "10:00",
      completed: lec.completed || false,
      type:      lec.type     || "video",
      videoUrl:  lec.videoUrl || "https://www.w3schools.com/html/mov_bbb.mp4",
      resources: lec.resources || [],
    })),
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// VIDEO PLAYER
// ─────────────────────────────────────────────────────────────────────────────
const VideoPlayer = ({ lecture, onComplete, onNext, onPrev, hasNext, hasPrev }) => {
  const videoRef     = useRef(null);
  const containerRef = useRef(null);
  const [playing,      setPlaying]      = useState(false);
  const [progress,     setProgress]     = useState(0);
  const [buffered,     setBuffered]     = useState(0);
  const [currentTime,  setCurrentTime]  = useState("0:00");
  const [duration,     setDuration]     = useState("0:00");
  const [muted,        setMuted]        = useState(false);
  const [volume,       setVolume]       = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [fullscreen,   setFullscreen]   = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [completed90,  setCompleted90]  = useState(false);
  const [showRateMenu, setShowRateMenu] = useState(false);
  const timer = useRef(null);

  const fmt = (s) => {
    if (!s || isNaN(s)) return "0:00";
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  };

  const resetControls = () => {
    setShowControls(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { if (playing) setShowControls(false); }, 3000);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    playing ? videoRef.current.pause() : videoRef.current.play();
    setPlaying(p => !p);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const pct = (videoRef.current.currentTime / videoRef.current.duration) * 100 || 0;
    setProgress(pct);
    setCurrentTime(fmt(videoRef.current.currentTime));
    if (videoRef.current.buffered.length > 0)
      setBuffered((videoRef.current.buffered.end(0) / videoRef.current.duration) * 100);
    if (pct > 90 && !completed90) { setCompleted90(true); onComplete && onComplete(); }
  };

  const seek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    if (videoRef.current) videoRef.current.currentTime = pct * videoRef.current.duration;
  };

  const changeVolume = (e) => {
    const v = parseFloat(e.target.value);
    setVolume(v); setMuted(v === 0);
    if (videoRef.current) { videoRef.current.volume = v; videoRef.current.muted = v === 0; }
  };

  const changeRate = (r) => {
    setPlaybackRate(r); setShowRateMenu(false);
    if (videoRef.current) videoRef.current.playbackRate = r;
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) { containerRef.current?.requestFullscreen(); setFullscreen(true); }
    else { document.exitFullscreen(); setFullscreen(false); }
  };

  useEffect(() => {
    setPlaying(false); setProgress(0); setCurrentTime("0:00"); setCompleted90(false);
    if (videoRef.current) { videoRef.current.load(); videoRef.current.playbackRate = playbackRate; }
  }, [lecture?.id, playbackRate]);

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <div ref={containerRef} className="relative bg-black rounded-2xl overflow-hidden select-none"
      onMouseMove={resetControls} onMouseLeave={() => playing && setShowControls(false)}
      onClick={() => setShowRateMenu(false)}>
      <video ref={videoRef} src={lecture?.videoUrl} className="w-full aspect-video cursor-pointer"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => setDuration(fmt(videoRef.current?.duration))}
        onEnded={() => { setPlaying(false); setShowControls(true); }}
        muted={muted} onClick={togglePlay} />

      {!playing && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer" onClick={togglePlay}>
          <div className="w-20 h-20 rounded-full bg-white/15 backdrop-blur border-2 border-white/50 flex items-center justify-center hover:scale-110 hover:bg-white/25 transition-all duration-200">
            <svg className="w-8 h-8 text-white ml-1.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          </div>
        </div>
      )}

      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/60 to-transparent px-5 pb-4 pt-12 transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
        <div className="relative w-full h-1 bg-white/20 rounded-full cursor-pointer mb-4 group/prog hover:h-2 transition-all" onClick={seek}>
          <div className="absolute h-full bg-white/30 rounded-full" style={{ width: `${buffered}%` }} />
          <div className="absolute h-full bg-indigo-500 rounded-full" style={{ width: `${progress}%` }}>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-lg opacity-0 group-hover/prog:opacity-100 transition-opacity" />
          </div>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button onClick={onPrev} disabled={!hasPrev} className="text-white/60 hover:text-white disabled:opacity-30 transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
            </button>
            <button onClick={togglePlay} className="text-white hover:text-indigo-300 transition-colors">
              {playing
                ? <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                : <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>}
            </button>
            <button onClick={onNext} disabled={!hasNext} className="text-white/60 hover:text-white disabled:opacity-30 transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
            </button>
            <div className="flex items-center gap-1.5 group/vol">
              <button onClick={() => { setMuted(m => !m); if (videoRef.current) videoRef.current.muted = !muted; }} className="text-white hover:text-indigo-300 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  {muted || volume === 0
                    ? <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                    : <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>}
                </svg>
              </button>
              <input type="range" min="0" max="1" step="0.05" value={muted ? 0 : volume} onChange={changeVolume}
                className="w-0 group-hover/vol:w-16 transition-all duration-200 accent-indigo-400 cursor-pointer" />
            </div>
            <span className="text-white/80 text-xs font-mono">{currentTime} / {duration}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button onClick={(e) => { e.stopPropagation(); setShowRateMenu(m => !m); }}
                className="text-white/80 hover:text-white text-xs font-bold bg-white/10 hover:bg-white/20 px-2 py-1 rounded transition-colors">
                {playbackRate}x
              </button>
              {showRateMenu && (
                <div className="absolute bottom-8 right-0 bg-gray-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl z-10">
                  {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map(r => (
                    <button key={r} onClick={() => changeRate(r)}
                      className={`block w-full px-4 py-2 text-xs text-left hover:bg-white/10 transition-colors ${playbackRate === r ? "text-indigo-400 font-bold" : "text-white/80"}`}>
                      {r}x
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={toggleFullscreen} className="text-white/80 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {fullscreen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9L4 4m0 0l5 0M4 4l0 5M15 9l5-5m0 0l-5 0m5 0l0 5M9 15l-5 5m0 0l5 0m-5 0l0-5M15 15l5 5m0 0l-5 0m5 0l0-5"/>
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/>}
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD TAB
// ─────────────────────────────────────────────────────────────────────────────
const Dashboard = ({ student, courses, setActiveTab, setActiveCourse, setActiveLecture, announcements }) => {
  const inProgress = courses.filter(c => c.progress > 0 && c.progress < 100);
  const maxMin     = Math.max(...ACTIVITY_DATA.map(d => d.minutes), 1);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 text-white">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, #6366f1 0%, transparent 60%), radial-gradient(circle at 80% 20%, #8b5cf6 0%, transparent 50%)" }} />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img src={student.avatar} alt={student.name} className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-400/50" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-indigo-500 rounded-lg flex items-center justify-center text-xs font-black">Lv{student.level}</div>
            </div>
            <div>
              <p className="text-indigo-300 text-sm">Welcome back 👋</p>
              <h2 className="text-2xl font-black">{student.name}</h2>
              <div className="flex items-center gap-3 mt-1 text-xs text-indigo-300">
                <span>🔥 {student.streak} day streak</span>
                <span>⚡ {student.xp.toLocaleString()} XP</span>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-2xl p-4 min-w-[180px]">
            <p className="text-xs text-indigo-300 mb-2">Weekly Learning Goal</p>
            <div className="flex justify-between text-xs text-white/70 mb-1">
              <span>{student.weeklyDone} of {student.weeklyGoal} days</span>
              <span>{Math.round((student.weeklyDone / student.weeklyGoal) * 100)}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full">
              <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${(student.weeklyDone / student.weeklyGoal) * 100}%` }} />
            </div>
            <p className="text-xs text-indigo-300 mt-2">{student.weeklyGoal - student.weeklyDone} more days to hit goal!</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Enrolled",     value: student.totalCourses,     icon: "📚", bg: "bg-indigo-50",  text: "text-indigo-700",  border: "border-indigo-100"  },
          { label: "Completed",    value: student.completedCourses, icon: "✅", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-100" },
          { label: "Hours",        value: `${student.totalHours}h`, icon: "⏱️", bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-100"   },
          { label: "Certificates", value: student.certificates,     icon: "🏆", bg: "bg-violet-50",  text: "text-violet-700",  border: "border-violet-100"  },
        ].map(s => (
          <div key={s.label} className={`${s.bg} border ${s.border} rounded-2xl p-4`}>
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className={`text-3xl font-black ${s.text}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-black text-gray-900">Continue Learning</h3>
          {courses.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center">
              <p className="text-4xl mb-3">🎯</p>
              <p className="font-bold text-gray-700">No courses enrolled yet.</p>
              <p className="text-sm text-gray-400 mt-1">Browse courses and enroll to get started!</p>
            </div>
          ) : inProgress.length === 0 ? (
            // Show all courses if none are "in progress" yet (progress = 0)
            courses.slice(0, 3).map(course => {
              const allLecs = normalizeSections(course.sections).flatMap(s => s.lectures);
              const nextLec = allLecs[0];
              return (
                <div key={course.id}
                  onClick={() => { setActiveCourse(course); setActiveLecture(nextLec); setActiveTab("Learn"); }}
                  className="bg-white border border-gray-100 rounded-2xl p-4 flex gap-4 hover:shadow-lg hover:border-indigo-200 hover:-translate-y-0.5 transition-all cursor-pointer group">
                  <img src={course.thumbnail} className="w-20 h-20 rounded-xl object-cover flex-shrink-0 group-hover:scale-105 transition-transform" alt={course.title} />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{course.category}</span>
                    <h4 className="font-bold text-gray-900 text-sm mt-1 truncate group-hover:text-indigo-600 transition-colors">{course.title}</h4>
                    <p className="text-xs text-gray-500 mt-0.5">Instructor: <span className="text-gray-700">{course.instructor}</span></p>
                    <p className="text-xs text-indigo-500 mt-1 font-semibold">Click to start →</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-indigo-100 group-hover:bg-indigo-500 flex items-center justify-center flex-shrink-0 self-center transition-colors">
                    <svg className="w-5 h-5 text-indigo-500 group-hover:text-white ml-0.5 transition-colors" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  </div>
                </div>
              );
            })
          ) : inProgress.map(course => {
            const allLecs = normalizeSections(course.sections).flatMap(s => s.lectures);
            const nextLec = allLecs.find(l => !l.completed) || allLecs[0];
            return (
              <div key={course.id}
                onClick={() => { setActiveCourse(course); setActiveLecture(nextLec); setActiveTab("Learn"); }}
                className="bg-white border border-gray-100 rounded-2xl p-4 flex gap-4 hover:shadow-lg hover:border-indigo-200 hover:-translate-y-0.5 transition-all cursor-pointer group">
                <img src={course.thumbnail} className="w-20 h-20 rounded-xl object-cover flex-shrink-0 group-hover:scale-105 transition-transform" alt={course.title} />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{course.category}</span>
                  <h4 className="font-bold text-gray-900 text-sm mt-1 truncate group-hover:text-indigo-600 transition-colors">{course.title}</h4>
                  <p className="text-xs text-gray-500 mt-0.5">Next: <span className="text-gray-700">{nextLec?.title}</span></p>
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>{course.completedLectures}/{course.totalLectures} lectures</span>
                      <span className="font-bold text-indigo-600">{course.progress}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${course.progress}%` }} />
                    </div>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-indigo-100 group-hover:bg-indigo-500 flex items-center justify-center flex-shrink-0 self-center transition-colors">
                  <svg className="w-5 h-5 text-indigo-500 group-hover:text-white ml-0.5 transition-colors" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-4">
            <h3 className="font-bold text-gray-900 text-sm mb-3">This Week's Activity</h3>
            <div className="flex items-end gap-1.5 h-20">
              {ACTIVITY_DATA.map(d => (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-t-md bg-indigo-100 relative" style={{ height: `${(d.minutes / maxMin) * 60}px` }}>
                    <div className="absolute inset-x-0 bottom-0 bg-indigo-500 rounded-t-md" style={{ height: `${(d.minutes / maxMin) * 100}%` }} />
                  </div>
                  <span className="text-xs text-gray-400">{d.day}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              {ACTIVITY_DATA.reduce((a, d) => a + d.minutes, 0)} mins total this week
            </p>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-4">
            <h3 className="font-bold text-gray-900 text-sm mb-3">📢 Announcements</h3>
            {announcements.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">No announcements yet.</p>
            ) : announcements.map((a, i) => (
              <div key={i} className="flex gap-2.5 mb-3 last:mb-0">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs flex-shrink-0">
                  {a.instructor?.charAt(0) || "L"}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-900 truncate">{a.title}</p>
                  <p className="text-xs text-gray-500 truncate">{a.body}</p>
                  <p className="text-xs text-gray-400">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MY COURSES TAB
// ─────────────────────────────────────────────────────────────────────────────
const MyCourses = ({ courses, setActiveTab, setActiveCourse, setActiveLecture }) => {
  const [filter, setFilter] = useState("All");
  const filtered = filter === "All" ? courses
    : filter === "Completed" ? courses.filter(c => c.progress === 100)
    : courses.filter(c => c.progress > 0 && c.progress < 100);

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h3 className="text-xl font-black text-gray-900">My Courses ({courses.length})</h3>
        <div className="flex gap-2">
          {["All", "In Progress", "Completed"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${filter === f ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-16 text-center">
          <p className="text-4xl mb-4">📭</p>
          <h4 className="text-lg font-bold text-gray-700">No courses found</h4>
          <p className="text-sm text-gray-400 mt-1">
            {filter === "All" ? "You haven't enrolled in any courses yet." : `No ${filter.toLowerCase()} courses.`}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map(course => {
            const allLecs = normalizeSections(course.sections).flatMap(s => s.lectures);
            const nextLec = allLecs.find(l => !l.completed) || allLecs[0];
            return (
              <div key={course.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                <div className="relative overflow-hidden">
                  <img src={course.thumbnail} className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-500" alt={course.title} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  {course.progress === 100 && (
                    <div className="absolute top-3 right-3 bg-emerald-500 text-white text-xs font-black px-2 py-1 rounded-full">✓ Done</div>
                  )}
                  <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-full bg-indigo-400 flex items-center justify-center text-white text-xs font-bold border border-white">
                      {course.instructor?.charAt(0)}
                    </div>
                    <span className="text-white text-xs font-medium">{course.instructor}</span>
                  </div>
                </div>
                <div className="p-4">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${course.color}20`, color: course.color }}>
                    {course.category}
                  </span>
                  <h4 className="font-bold text-gray-900 text-sm mt-2 leading-snug line-clamp-2 group-hover:text-indigo-600 transition-colors">{course.title}</h4>
                  <div className="flex items-center gap-1 mt-2">
                    <span className="text-amber-400 text-xs">★</span>
                    <span className="text-xs font-bold text-gray-700">{course.rating}</span>
                    <span className="text-xs text-gray-400">• {course.totalDuration}</span>
                  </div>
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>{course.completedLectures}/{course.totalLectures} lectures</span>
                      <span className="font-bold" style={{ color: course.color }}>{course.progress}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full">
                      <div className="h-full rounded-full transition-all" style={{ width: `${course.progress}%`, backgroundColor: course.color }} />
                    </div>
                  </div>
                  <button
                    onClick={() => { setActiveCourse(course); setActiveLecture(nextLec); setActiveTab("Learn"); }}
                    className="w-full mt-4 py-2.5 rounded-xl text-sm font-bold transition-all text-white"
                    style={{ backgroundColor: course.progress === 100 ? "#10b981" : course.color }}>
                    {course.progress === 0 ? "Start Course →" : course.progress === 100 ? "Review Course" : "Continue Learning →"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// LEARN TAB
// ─────────────────────────────────────────────────────────────────────────────
const Learn = ({ course, activeLecture, setActiveLecture, onMarkComplete }) => {
  const curriculum  = normalizeSections(course?.sections || []);
  const allLectures = curriculum.flatMap(s => s.lectures);

  // FIX: seed completedIds from course.completedLectureIds (from Progress model)
  const [completedIds,    setCompletedIds]    = useState(
    () => (course?.completedLectureIds || []).map(String)
  );
  const [openSections,    setOpenSections]    = useState(curriculum.map(s => s.id));
  const [subTab,          setSubTab]          = useState("Overview");
  const [newQuestion,     setNewQuestion]     = useState("");
  const [qaList,          setQaList]          = useState([]);
  const [noteText,        setNoteText]        = useState("");
  const [notes,           setNotes]           = useState([]);
  const [reviewRating,    setReviewRating]    = useState(0);
  const [reviewText,      setReviewText]      = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [sidebarOpen,     setSidebarOpen]     = useState(true);

  const currentIdx = allLectures.findIndex(l => l.id === activeLecture?.id);
  const hasNext    = currentIdx < allLectures.length - 1;
  const hasPrev    = currentIdx > 0;
  const progress   = allLectures.length > 0
    ? Math.round((completedIds.length / allLectures.length) * 100) : 0;

  // FIX: also calls parent onMarkComplete to save to backend
  const markComplete = useCallback((id) => {
    setCompletedIds(prev => {
      if (prev.includes(String(id))) return prev;
      const updated = [...prev, String(id)];
      onMarkComplete && onMarkComplete(course?.id, id);
      return updated;
    });
  }, [course?.id, onMarkComplete]);

  const goNext = () => {
    if (hasNext) { setActiveLecture(allLectures[currentIdx + 1]); setSubTab("Overview"); }
  };
  const goPrev = () => {
    if (hasPrev) { setActiveLecture(allLectures[currentIdx - 1]); setSubTab("Overview"); }
  };

  const subTabs = ["Overview", "Q&A", "Notes", "Resources", "Review"];

  if (!course || allLectures.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-5xl mb-4">📭</p>
        <h3 className="text-xl font-black text-gray-800 mb-2">No content yet</h3>
        <p className="text-gray-500">This course has no lectures yet. Check back later!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-0">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-0.5"><span>{course?.title}</span></div>
          <h2 className="text-base font-black text-gray-900 truncate">{activeLecture?.title}</h2>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500">
            <span>{completedIds.length}/{allLectures.length} lectures</span>
            <div className="w-24 h-1.5 bg-gray-200 rounded-full">
              <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${progress}%` }} />
            </div>
            <span className="font-bold text-indigo-600">{progress}%</span>
          </div>
          <button onClick={() => setSidebarOpen(o => !o)}
            className="text-xs font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors">
            {sidebarOpen ? "Hide" : "Show"} Content
          </button>
        </div>
      </div>

      <div className={`flex gap-5 flex-1 ${sidebarOpen ? "flex-col xl:flex-row" : ""}`}>
        <div className="flex-1 min-w-0 space-y-4">
          <VideoPlayer lecture={activeLecture} onComplete={() => markComplete(activeLecture?.id)}
            onNext={goNext} onPrev={goPrev} hasNext={hasNext} hasPrev={hasPrev} />

          <div className="flex gap-3">
            <button onClick={goPrev} disabled={!hasPrev}
              className="flex items-center gap-2 text-sm font-bold bg-white border border-gray-200 hover:border-indigo-300 text-gray-700 px-4 py-2.5 rounded-xl disabled:opacity-40 transition-colors">
              ← Previous
            </button>
            <button onClick={() => markComplete(activeLecture?.id)}
              className={`flex-1 text-sm font-bold py-2.5 rounded-xl transition-colors ${completedIds.includes(String(activeLecture?.id)) ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-indigo-600 text-white hover:bg-indigo-700"}`}>
              {completedIds.includes(String(activeLecture?.id)) ? "✓ Completed" : "Mark as Complete"}
            </button>
            <button onClick={goNext} disabled={!hasNext}
              className="flex items-center gap-2 text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl disabled:opacity-40 transition-colors">
              Next →
            </button>
          </div>

          {/* Sub-tabs */}
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            <div className="flex border-b border-gray-100 overflow-x-auto">
              {subTabs.map(t => (
                <button key={t} onClick={() => setSubTab(t)}
                  className={`flex-shrink-0 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${subTab === t ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-900"}`}>
                  {t}
                </button>
              ))}
            </div>
            <div className="p-5">
              {subTab === "Overview" && (
                <div>
                  <h3 className="font-black text-gray-900 text-lg mb-2">{activeLecture?.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">Follow along with the video and refer to the resources tab for additional materials.</p>
                  <div className="mt-4 grid sm:grid-cols-3 gap-3">
                    {[
                      { label: "Duration",  value: activeLecture?.duration,                         icon: "⏱️" },
                      { label: "Type",      value: "Video Lecture",                                  icon: "🎬" },
                      { label: "Resources", value: `${activeLecture?.resources?.length || 0} files`, icon: "📎" },
                    ].map(i => (
                      <div key={i.label} className="bg-gray-50 rounded-xl p-3">
                        <div className="text-xl mb-1">{i.icon}</div>
                        <div className="text-sm font-bold text-gray-900">{i.value}</div>
                        <div className="text-xs text-gray-500">{i.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {subTab === "Q&A" && (
                <div>
                  <h4 className="font-bold text-gray-900 mb-2">Ask a Question</h4>
                  <textarea value={newQuestion} onChange={e => setNewQuestion(e.target.value)}
                    placeholder="What's your question about this lecture?"
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 h-24" />
                  <button onClick={() => {
                    if (newQuestion.trim()) {
                      setQaList(p => [{ id: Date.now().toString(), question: newQuestion, votes: 0, time: "Just now", student: "You", avatar: "https://i.pravatar.cc/40?img=11" }, ...p]);
                      setNewQuestion("");
                    }
                  }} className="mt-2 bg-indigo-600 text-white text-sm font-bold px-5 py-2 rounded-xl hover:bg-indigo-700 transition-colors">
                    Post Question
                  </button>
                  <div className="mt-4 space-y-4">
                    {qaList.length === 0
                      ? <p className="text-sm text-gray-400 text-center py-6">No questions yet. Be the first to ask!</p>
                      : qaList.map(q => (
                        <div key={q.id} className="border border-gray-100 rounded-xl p-4">
                          <div className="flex gap-3">
                            <img src={q.avatar} className="w-8 h-8 rounded-full flex-shrink-0" alt={q.student} />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-gray-900">{q.student}</span>
                                <span className="text-xs text-gray-400">{q.time}</span>
                              </div>
                              <p className="text-sm text-gray-700 mt-1">{q.question}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {subTab === "Notes" && (
                <div>
                  <h4 className="font-bold text-gray-900 mb-3">My Notes — <span className="text-indigo-600">{activeLecture?.title}</span></h4>
                  <textarea value={noteText} onChange={e => setNoteText(e.target.value)}
                    placeholder="Type your notes here..."
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 h-32" />
                  <button onClick={() => {
                    if (noteText.trim()) {
                      setNotes(p => [{ id: Date.now().toString(), lectureId: activeLecture.id, lectureTitle: activeLecture.title, text: noteText, time: "Just now" }, ...p]);
                      setNoteText("");
                    }
                  }} className="mt-2 bg-indigo-600 text-white text-sm font-bold px-5 py-2 rounded-xl hover:bg-indigo-700 transition-colors">
                    Save Note
                  </button>
                  <div className="mt-4 space-y-3">
                    {notes.filter(n => n.lectureId === activeLecture?.id).length === 0
                      ? <p className="text-sm text-gray-400 text-center py-6">No notes yet for this lecture.</p>
                      : notes.filter(n => n.lectureId === activeLecture?.id).map(n => (
                        <div key={n.id} className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                          <div className="flex justify-between items-start">
                            <p className="text-sm text-gray-700 flex-1">{n.text}</p>
                            <button onClick={() => setNotes(p => p.filter(x => x.id !== n.id))} className="ml-3 text-gray-300 hover:text-red-400 transition-colors flex-shrink-0">✕</button>
                          </div>
                          <p className="text-xs text-amber-600 mt-1">{n.time}</p>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {subTab === "Resources" && (
                <div>
                  <h4 className="font-bold text-gray-900 mb-3">Downloadable Resources</h4>
                  {activeLecture?.resources?.length > 0 ? (
                    <div className="space-y-2">
                      {activeLecture.resources.map((r, i) => (
                        <div key={i} className="flex items-center justify-between bg-gray-50 rounded-xl p-3 hover:bg-indigo-50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center">
                              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                            </div>
                            <span className="text-sm font-medium text-gray-700">{r}</span>
                          </div>
                          <button className="text-xs font-bold text-indigo-600 bg-indigo-100 hover:bg-indigo-200 px-3 py-1.5 rounded-lg transition-colors">Download</button>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-sm text-gray-400 text-center py-8">No resources for this lecture.</p>}
                </div>
              )}

              {subTab === "Review" && (
                <div>
                  <h4 className="font-black text-gray-900 mb-1">Rate this Course</h4>
                  {!reviewSubmitted ? (
                    <div>
                      <div className="flex gap-2 mb-4 mt-3">
                        {[1,2,3,4,5].map(s => (
                          <button key={s} onClick={() => setReviewRating(s)}
                            className={`text-3xl transition-transform hover:scale-125 ${s <= reviewRating ? "text-amber-400" : "text-gray-200"}`}>★</button>
                        ))}
                        {reviewRating > 0 && <span className="text-sm text-gray-500 self-center ml-2">{["","Poor","Fair","Good","Very Good","Excellent"][reviewRating]}</span>}
                      </div>
                      <textarea value={reviewText} onChange={e => setReviewText(e.target.value)}
                        placeholder="Tell us what you think about this course..."
                        className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-400 h-28" />
                      <button onClick={() => { if (reviewRating > 0) setReviewSubmitted(true); }} disabled={reviewRating === 0}
                        className="mt-3 bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold px-6 py-2.5 rounded-xl disabled:opacity-50 transition-colors">
                        Submit Review
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-5xl mb-3">🌟</div>
                      <h4 className="font-black text-gray-900 text-xl">Thank you!</h4>
                      <p className="text-sm text-gray-500 mt-1">Your review has been submitted.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {sidebarOpen && (
          <div className="xl:w-72 flex-shrink-0 bg-white border border-gray-100 rounded-2xl overflow-hidden flex flex-col" style={{ maxHeight: "calc(100vh - 200px)" }}>
            <div className="p-4 border-b bg-gray-50 flex-shrink-0">
              <h3 className="font-black text-gray-900 text-sm">Course Content</h3>
              <div className="mt-2">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>{completedIds.length}/{allLectures.length} completed</span>
                  <span className="font-bold text-indigo-600">{progress}%</span>
                </div>
                <div className="h-1.5 bg-gray-200 rounded-full">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${progress}%` }} />
                </div>
              </div>
            </div>
            <div className="overflow-y-auto flex-1 divide-y divide-gray-50">
              {curriculum.map(section => (
                <div key={section.id}>
                  <button
                    onClick={() => setOpenSections(p => p.includes(section.id) ? p.filter(x => x !== section.id) : [...p, section.id])}
                    className="w-full flex justify-between items-center px-4 py-3 bg-gray-50/80 hover:bg-gray-100 transition-colors text-left">
                    <span className="font-bold text-xs text-gray-700 pr-2 leading-snug">{section.title}</span>
                    <svg className={`w-3.5 h-3.5 text-gray-400 flex-shrink-0 transition-transform ${openSections.includes(section.id) ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                    </svg>
                  </button>
                  {openSections.includes(section.id) && section.lectures.map(lec => {
                    const isActive = activeLecture?.id === lec.id;
                    const isDone   = completedIds.includes(String(lec.id));
                    return (
                      <button key={lec.id} onClick={() => { setActiveLecture(lec); setSubTab("Overview"); }}
                        className={`w-full flex items-start gap-2.5 px-4 py-3 text-left hover:bg-indigo-50 transition-colors ${isActive ? "bg-indigo-50 border-l-4 border-l-indigo-500" : ""}`}>
                        <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 transition-colors ${isDone ? "bg-emerald-500" : isActive ? "bg-indigo-500" : "border-2 border-gray-200"}`}>
                          {isDone && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
                          {!isDone && isActive && <svg className="w-2.5 h-2.5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs leading-snug ${isActive ? "text-indigo-700 font-bold" : "text-gray-600"}`}>{lec.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{lec.duration}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// NOTES, CERTIFICATES, PROFILE
// ─────────────────────────────────────────────────────────────────────────────
const AllNotes = () => {
  const [notes, setNotes]   = useState([]);
  const [search, setSearch] = useState("");
  useEffect(() => {
    try { setNotes(JSON.parse(localStorage.getItem("portal_notes") || "[]")); } catch { setNotes([]); }
  }, []);
  const filtered = notes.filter(n =>
    n.text?.toLowerCase().includes(search.toLowerCase()) ||
    n.lectureTitle?.toLowerCase().includes(search.toLowerCase())
  );
  const colors = ["bg-amber-50 border-amber-200", "bg-blue-50 border-blue-200", "bg-violet-50 border-violet-200"];
  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h3 className="text-xl font-black text-gray-900">All Notes</h3>
        <div className="relative">
          <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search notes..."
            className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 w-56" />
        </div>
      </div>
      {filtered.length === 0
        ? <div className="text-center py-16"><div className="text-4xl mb-3">📝</div><p className="text-gray-500">No notes yet.</p></div>
        : <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((note, i) => (
              <div key={note.id} className={`border rounded-2xl p-5 ${colors[i % colors.length]}`}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-xs font-bold text-indigo-600">{note.courseTitle || "Course"}</p>
                    <p className="text-xs text-gray-500">{note.lectureTitle}</p>
                  </div>
                  <button onClick={() => {
                    const updated = notes.filter(n => n.id !== note.id);
                    setNotes(updated);
                    localStorage.setItem("portal_notes", JSON.stringify(updated));
                  }} className="text-gray-300 hover:text-red-400 transition-colors">✕</button>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{note.text}</p>
                <p className="text-xs text-gray-400 mt-3">{note.time}</p>
              </div>
            ))}
          </div>
      }
    </div>
  );
};

const Certificates = ({ courses, student }) => {
  const earned = courses.filter(c => c.certificateReady);
  return (
    <div>
      <h3 className="text-xl font-black text-gray-900 mb-5">My Certificates</h3>
      {earned.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-16 text-center">
          <div className="text-5xl mb-4">🎓</div>
          <h4 className="text-lg font-bold text-gray-700">No certificates yet</h4>
          <p className="text-sm text-gray-400 mt-1">Complete a course to earn your first certificate!</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-6">
          {earned.map(course => (
            <div key={course.id} className="bg-white border-2 border-amber-200 rounded-2xl overflow-hidden shadow-xl">
              <div className="relative bg-gradient-to-br from-slate-900 to-indigo-950 p-8 text-center">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle, #f59e0b 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
                <div className="relative">
                  <div className="w-16 h-16 bg-amber-400/20 border-2 border-amber-400/40 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">🏆</div>
                  <p className="text-amber-400 text-xs font-black uppercase tracking-widest mb-3">Certificate of Completion</p>
                  <p className="text-white/60 text-xs">This certifies that</p>
                  <p className="text-white text-2xl font-black mt-1">{student.name}</p>
                  <p className="text-white/60 text-xs mt-2">has successfully completed</p>
                  <p className="text-amber-300 font-bold text-sm mt-2 leading-snug px-4">{course.title}</p>
                  <div className="flex items-center justify-center gap-3 mt-4">
                    <div className="w-8 h-8 rounded-full bg-indigo-400 flex items-center justify-center text-white font-bold border-2 border-amber-400/40">{course.instructor?.charAt(0)}</div>
                    <div className="text-left"><p className="text-white/40 text-xs">Instructor</p><p className="text-white text-xs font-bold">{course.instructor}</p></div>
                  </div>
                  <div className="mt-4 border-t border-white/10 pt-4"><p className="text-white/30 text-xs">LearnFlow Platform • {new Date().getFullYear()}</p></div>
                </div>
              </div>
              <div className="p-4 flex gap-2">
                <button className="flex-1 bg-indigo-600 text-white text-sm font-bold py-2.5 rounded-xl hover:bg-indigo-700 transition-colors">⬇ Download PDF</button>
                <button className="flex-1 bg-amber-50 text-amber-700 text-sm font-bold py-2.5 rounded-xl hover:bg-amber-100 border border-amber-200 transition-colors">Share 🔗</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const PreferenceToggle = ({ label, defaultChecked }) => {
  const [on, setOn] = useState(defaultChecked);
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-700">{label}</span>
      <button onClick={() => setOn(p => !p)} className={`relative w-11 h-6 rounded-full transition-colors ${on ? "bg-indigo-600" : "bg-gray-300"}`}>
        <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${on ? "translate-x-5" : ""}`} />
      </button>
    </div>
  );
};

const PREFS = [
  { label: "Email notifications for new announcements", checked: true  },
  { label: "Weekly progress report emails",             checked: true  },
  { label: "Autoplay next lecture",                     checked: true  },
  { label: "Show subtitles by default",                 checked: false },
];

const Profile = ({ student }) => {
  const [editing, setEditing] = useState(false);
  const [name, setName]       = useState(student.name);
  const [bio, setBio]         = useState(student.bio);
  const [saved, setSaved]     = useState(false);
  const save = () => { setEditing(false); setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-black text-gray-900">My Profile</h3>
        {saved && <span className="text-sm text-emerald-600 font-bold bg-emerald-50 px-3 py-1 rounded-full">✓ Saved!</span>}
      </div>
      <div className="bg-white border border-gray-100 rounded-2xl p-6">
        <div className="flex items-center gap-5">
          <img src={student.avatar} className="w-20 h-20 rounded-2xl object-cover border-2 border-indigo-100" alt={student.name} />
          <div className="flex-1">
            {editing
              ? <input value={name} onChange={e => setName(e.target.value)} className="w-full text-xl font-black border border-indigo-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 mb-2"/>
              : <h4 className="text-xl font-black text-gray-900">{name}</h4>}
            <p className="text-sm text-gray-500">{student.email}</p>
            <p className="text-xs text-gray-400 mt-0.5">Member since {student.joinedDate}</p>
          </div>
          <button onClick={() => editing ? save() : setEditing(true)}
            className="bg-indigo-600 text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors">
            {editing ? "Save" : "Edit Profile"}
          </button>
        </div>
        <div className="mt-4">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Bio</label>
          {editing
            ? <textarea value={bio} onChange={e => setBio(e.target.value)} className="w-full mt-1 border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 h-20"/>
            : <p className="text-sm text-gray-600 mt-1">{bio}</p>}
        </div>
      </div>
      <div className="bg-white border border-gray-100 rounded-2xl p-6">
        <h4 className="font-black text-gray-900 mb-4">Learning Stats</h4>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Day Streak",        value: `${student.streak} days`, icon: "🔥" },
            { label: "Total Hours",       value: `${student.totalHours}h`, icon: "⏱️" },
            { label: "Courses Enrolled",  value: student.totalCourses,     icon: "📚" },
            { label: "Certificates",      value: student.certificates,     icon: "🏆" },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
              <span className="text-2xl">{s.icon}</span>
              <div><div className="font-black text-gray-900">{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white border border-gray-100 rounded-2xl p-6">
        <h4 className="font-black text-gray-900 mb-4">Preferences</h4>
        <div className="space-y-1">
          {PREFS.map((p, i) => <PreferenceToggle key={i} label={p.label} defaultChecked={p.checked} />)}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SIDEBAR TABS
// ─────────────────────────────────────────────────────────────────────────────
const TABS = [
  { id: "Dashboard",    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg> },
  { id: "My Courses",   icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg> },
  { id: "Learn",        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> },
  { id: "Notes",        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg> },
  { id: "Certificates", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg> },
  { id: "Profile",      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg> },
];

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PORTAL
// ─────────────────────────────────────────────────────────────────────────────
export default function StudentPortal() {
  const navigate = useNavigate();

  const [activeTab,     setActiveTab]     = useState("Dashboard");
  const [activeCourse,  setActiveCourse]  = useState(null);
  const [activeLecture, setActiveLecture] = useState(null);
  const [sidebarOpen,   setSidebarOpen]   = useState(false);
  const [notifications]                   = useState(2);
  const [student,       setStudent]       = useState(FALLBACK_STUDENT);
  const [courses,       setCourses]       = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState("");

  useEffect(() => {
    const link = document.createElement("link");
    link.href  = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap";
    link.rel   = "stylesheet";
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      setError("");
      try {
        const savedUser = JSON.parse(localStorage.getItem("user") || "{}");

        // ── FIX 1: Fetch enrollments + progress in parallel ───────────────
        const [enrollRes, progressRes] = await Promise.all([
          axios.get(`${BASE_URL}/enrollments/my`, authHeaders()),
          axios.get(`${BASE_URL}/progress/my`,    authHeaders()),
        ]);

        // ── FIX 2: Server returns array of enrollment objects with .course ─
        // Shape: [{ _id, student, course: { _id, title, sections, ... }, createdAt }]
        const enrollments = enrollRes.data || [];
        const progressMap = {};
        (progressRes.data || []).forEach(p => {
          progressMap[String(p.courseId)] = p.completedLectures || [];
        });

        // ── FIX 3: Extract course from each enrollment, merge progress ─────
        const normalizedCourses = enrollments
          .map((enrollment, i) => {
            const courseData = enrollment.course;
            if (!courseData) return null;
            const completedLectureIds = progressMap[String(courseData._id)] || [];
            return normalizeCourse(courseData, i, completedLectureIds);
          })
          .filter(Boolean);

        setCourses(normalizedCourses);

        const totalCourses     = normalizedCourses.length;
        const completedCourses = normalizedCourses.filter(c => c.progress === 100).length;
        const certificates     = normalizedCourses.filter(c => c.certificateReady).length;

        setStudent({
          ...FALLBACK_STUDENT,
          name:       savedUser.name   || "Student",
          email:      savedUser.email  || "",
          avatar:     savedUser.avatar || `https://i.pravatar.cc/150?img=11`,
          joinedDate: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
          bio:        savedUser.bio    || "Passionate learner.",
          totalCourses, completedCourses, certificates,
          totalHours:  Math.round(totalCourses * 8.5),
          xp:          totalCourses * 500 + completedCourses * 1000,
          level:       Math.max(1, Math.floor((totalCourses * 500 + completedCourses * 1000) / 1000)),
          streak:      Math.min(7, totalCourses * 2),
          weeklyDone:  Math.min(5, totalCourses),
          weeklyGoal:  5,
        });

        if (normalizedCourses.length > 0) {
          const first    = normalizedCourses[0];
          const sections = normalizeSections(first.sections);
          const lecs     = sections.flatMap(s => s.lectures);
          const nextLec  = lecs.find(l => !first.completedLectureIds.includes(l.id)) || lecs[0];
          setActiveCourse(first);
          if (nextLec) setActiveLecture(nextLec);
        }

        setAnnouncements([{
          instructor: "LearnFlow",
          title:      "Welcome to LearnFlow! 🎉",
          body:       "Start learning today — all your enrolled courses are ready.",
          time:       "Just now",
        }]);

      } catch (err) {
        console.error("Portal load error:", err);
        if (!err.response) {
          setError("Cannot reach server. Make sure your backend is running on port 5000.");
        } else if (err.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/auth");
        } else {
          setError(err.response?.data?.message || "Could not load your dashboard.");
        }
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, [navigate]);

  // ── FIX 4: Save progress to backend when lecture is marked complete ────────
  const handleMarkComplete = useCallback(async (courseId, lectureId) => {
    try {
      await axios.post(
        `${BASE_URL}/progress/mark`,
        { courseId, lectureId },
        authHeaders()
      );
    } catch (err) {
      console.error("Could not save progress:", err);
    }
  }, []);

  const handleSetActiveCourse = (course) => {
    setActiveCourse(course);
    const sections = normalizeSections(course.sections);
    const all      = sections.flatMap(s => s.lectures);
    const nextLec  = all.find(l => !course.completedLectureIds?.includes(l.id)) || all[0];
    setActiveLecture(nextLec);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/auth");
  };

  const renderContent = () => {
    if (loading) return (
      <div className="flex flex-col items-center justify-center py-32">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Loading your dashboard...</p>
      </div>
    );
    if (error) return (
      <div className="flex flex-col items-center justify-center py-24 text-center px-4">
        <p className="text-5xl mb-4">⚠️</p>
        <h3 className="text-xl font-black text-gray-800 mb-2">Could not load dashboard</h3>
        <p className="text-gray-500 max-w-md mb-6">{error}</p>
        <button onClick={() => window.location.reload()}
          className="bg-indigo-600 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors">
          Try Again
        </button>
      </div>
    );
    switch (activeTab) {
      case "Dashboard":    return <Dashboard student={student} courses={courses} announcements={announcements} setActiveTab={setActiveTab} setActiveCourse={handleSetActiveCourse} setActiveLecture={setActiveLecture} />;
      case "My Courses":   return <MyCourses courses={courses} setActiveTab={setActiveTab} setActiveCourse={handleSetActiveCourse} setActiveLecture={setActiveLecture} />;
      case "Learn":        return <Learn course={activeCourse} activeLecture={activeLecture} setActiveLecture={setActiveLecture} onMarkComplete={handleMarkComplete} />;
      case "Notes":        return <AllNotes />;
      case "Certificates": return <Certificates courses={courses} student={student} />;
      case "Profile":      return <Profile student={student} />;
      default:             return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div className="flex h-screen overflow-hidden">
        {/* SIDEBAR */}
        <aside className={`fixed xl:static inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full xl:translate-x-0"}`}>
          <div className="px-5 py-5 border-b border-white/10 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-indigo-500 rounded-xl flex items-center justify-center text-white font-black text-sm">L</div>
              <div><h1 className="font-black text-white text-base leading-none">LearnFlow</h1><p className="text-slate-400 text-xs">Student Portal</p></div>
            </div>
          </div>
          <div className="px-5 py-4 border-b border-white/10 flex-shrink-0">
            <div className="flex items-center gap-3">
              <img src={student.avatar} className="w-10 h-10 rounded-xl object-cover border-2 border-indigo-400/50" alt={student.name} />
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate">{student.name}</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                  <p className="text-xs text-slate-400">Lv.{student.level} • {student.xp.toLocaleString()} XP</p>
                </div>
              </div>
            </div>
          </div>
          <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === tab.id ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/50" : "text-slate-400 hover:text-white hover:bg-white/5"}`}>
                {tab.icon}{tab.id}
              </button>
            ))}
          </nav>
          <div className="px-5 py-4 border-t border-white/10 flex-shrink-0 space-y-2">
            <div className="bg-white/5 rounded-xl p-3 flex items-center gap-3">
              <span className="text-2xl">🔥</span>
              <div><p className="text-xs text-slate-400">Current Streak</p><p className="font-black text-white">{student.streak} days</p></div>
              <div className="ml-auto text-right"><p className="text-xs text-slate-400">Goal</p><p className="text-xs font-bold text-indigo-400">{student.weeklyDone}/{student.weeklyGoal} days</p></div>
            </div>
            <button onClick={handleLogout} className="w-full text-sm font-bold text-slate-400 hover:text-red-400 hover:bg-red-500/10 py-2 rounded-xl transition-colors">🚪 Logout</button>
          </div>
        </aside>

        {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm xl:hidden" onClick={() => setSidebarOpen(false)} />}

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className="bg-white border-b border-gray-100 px-4 sm:px-6 py-3 flex items-center justify-between flex-shrink-0 shadow-sm">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="xl:hidden text-gray-500 hover:text-gray-900 p-1">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/></svg>
              </button>
              <div>
                <h2 className="text-base font-black text-gray-900">{activeTab}</h2>
                <p className="text-xs text-gray-400 hidden sm:block">{activeTab === "Learn" ? activeCourse?.title : `Welcome back, ${student.name}`}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden sm:flex items-center gap-1.5 bg-indigo-50 text-indigo-700 rounded-xl px-3 py-1.5">
                <span className="text-sm">🔥</span>
                <span className="text-sm font-bold">{student.streak} days</span>
              </div>
              <button className="relative p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
                {notifications > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs font-black rounded-full flex items-center justify-center">{notifications}</span>}
              </button>
              <img src={student.avatar} className="w-8 h-8 rounded-xl object-cover border-2 border-indigo-200 cursor-pointer hover:border-indigo-400 transition-colors" alt={student.name}
                onClick={() => { setActiveTab("Profile"); setSidebarOpen(false); }} />
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-4 sm:p-6">{renderContent()}</main>
        </div>
      </div>
    </div>
  );
}
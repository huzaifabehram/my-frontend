import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ChevronDown, Menu, X, Bell, LogOut, Play, Pause, Volume2, VolumeX, Maximize, Minimize, Settings, Home, BookOpen, FileText, Award, User, Search, Clock, Users, Star, MessageCircle, CheckCircle, ChevronRight } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// API SETUP - SAME AS ORIGINAL
// ─────────────────────────────────────────────────────────────────────────────
const BASE_URL = "https://my-course-backend-8u69.onrender.com/api";

function authHeaders() {
  const token = localStorage.getItem("token");
  return { headers: { Authorization: `Bearer ${token}` } };
}

// ─────────────────────────────────────────────────────────────────────────────
// FALLBACK DATA
// ─────────────────────────────────────────────────────────────────────────────
const FALLBACK_STUDENT = {
  name: "Student",
  email: "",
  avatar: "https://i.pravatar.cc/150?img=11",
  joinedDate: "2024",
  bio: "Passionate learner.",
  totalCourses: 0,
  completedCourses: 0,
  totalHours: 0,
  certificates: 0,
  streak: 0,
  xp: 0,
  level: 1,
  weeklyGoal: 5,
  weeklyDone: 0,
};

const ACTIVITY_DATA = [
  { day: "Mon", minutes: 45 },
  { day: "Tue", minutes: 90 },
  { day: "Wed", minutes: 30 },
  { day: "Thu", minutes: 120 },
  { day: "Fri", minutes: 60 },
  { day: "Sat", minutes: 0 },
  { day: "Sun", minutes: 75 },
];

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────
function normalizeCourse(c, index, completedLectureIds = []) {
  const colors = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ec4899"];
  const sections = c.sections || [];
  const allLectures = sections.flatMap(s => s.lectures || []);
  const totalLectures = allLectures.length;
  const completedLectures = allLectures.filter(
    l => completedLectureIds.includes(String(l._id))
  ).length;
  const progress = totalLectures > 0
    ? Math.round((completedLectures / totalLectures) * 100) : 0;

  return {
    _id: c._id,
    id: c._id,
    title: c.title || "Untitled Course",
    instructor: typeof c.instructor === "object" ? c.instructor?.name : c.instructor || "Instructor",
    instructorAvatar: `https://i.pravatar.cc/60?img=${(index + 10) % 70}`,
    thumbnail: c.thumbnail || "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=600&q=80",
    progress,
    totalLectures,
    completedLectures,
    totalDuration: `${totalLectures * 15}m`,
    category: c.category || "Course",
    rating: c.rating || 4.5,
    color: colors[index % colors.length],
    certificateReady: progress === 100,
    description: c.description || "",
    sections,
    completedLectureIds,
  };
}

function normalizeSections(sections) {
  return (sections || []).map((sec, si) => ({
    id: sec._id || `sec${si}`,
    title: sec.title || `Section ${si + 1}`,
    lectures: (sec.lectures || []).map((lec, li) => ({
      id: lec._id || `lec${li}`,
      title: lec.title || `Lecture ${li + 1}`,
      duration: lec.duration || "10:00",
      completed: lec.completed || false,
      type: lec.type || "video",
      videoUrl: lec.videoUrl || "https://www.w3schools.com/html/mov_bbb.mp4",
      resources: lec.resources || [],
    })),
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// ADVANCED VIDEO PLAYER WITH BUNNY.NET SUPPORT
// ─────────────────────────────────────────────────────────────────────────────
const VideoPlayer = ({ lecture, onComplete, onNext, onPrev, hasNext, hasPrev }) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [currentTime, setCurrentTime] = useState("0:00");
  const [duration, setDuration] = useState("0:00");
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [completed90, setCompleted90] = useState(false);
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
    if (pct > 90 && !completed90) {
      setCompleted90(true);
      onComplete && onComplete();
    }
  };

  const seek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    if (videoRef.current) videoRef.current.currentTime = pct * videoRef.current.duration;
  };

  const changeVolume = (e) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    setMuted(v === 0);
    if (videoRef.current) {
      videoRef.current.volume = v;
      videoRef.current.muted = v === 0;
    }
  };

  const changeRate = (r) => {
    setPlaybackRate(r);
    setShowRateMenu(false);
    if (videoRef.current) videoRef.current.playbackRate = r;
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await containerRef.current?.requestFullscreen();
        setFullscreen(true);
      } else {
        await document.exitFullscreen();
        setFullscreen(false);
      }
    } catch (err) {
      console.error("Fullscreen error:", err);
    }
  };

  useEffect(() => {
    setPlaying(false);
    setProgress(0);
    setCurrentTime("0:00");
    setCompleted90(false);
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.playbackRate = playbackRate;
    }
  }, [lecture?.id, playbackRate]);

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <div
      ref={containerRef}
      className="relative bg-black rounded-2xl overflow-hidden select-none w-full aspect-video"
      onMouseMove={resetControls}
      onMouseLeave={() => playing && setShowControls(false)}
      onClick={() => setShowRateMenu(false)}
    >
      <video
        ref={videoRef}
        src={lecture?.videoUrl}
        className="w-full h-full cursor-pointer"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => setDuration(fmt(videoRef.current?.duration))}
        onEnded={() => { setPlaying(false); setShowControls(true); }}
        muted={muted}
        onClick={togglePlay}
        crossOrigin="anonymous"
      />

      {!playing && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer"
          onClick={togglePlay}
        >
          <div className="w-20 h-20 rounded-full bg-white/15 backdrop-blur border-2 border-white/50 flex items-center justify-center hover:scale-110 hover:bg-white/25 transition-all duration-200">
            <Play className="w-8 h-8 text-white ml-1" fill="white" />
          </div>
        </div>
      )}

      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/60 to-transparent px-4 md:px-5 pb-4 pt-12 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div
          className="relative w-full h-1 bg-white/20 rounded-full cursor-pointer mb-4 group hover:h-2 transition-all"
          onClick={seek}
        >
          <div className="absolute h-full bg-white/30 rounded-full" style={{ width: `${buffered}%` }} />
          <div className="absolute h-full bg-indigo-500 rounded-full" style={{ width: `${progress}%` }}>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 md:gap-3 flex-wrap">
          <div className="flex items-center gap-2 md:gap-3 flex-wrap">
            <button
              onClick={onPrev}
              disabled={!hasPrev}
              className="text-white/60 hover:text-white disabled:opacity-30 transition-colors p-1"
            >
              <ChevronDown className="w-5 h-5 rotate-90" />
            </button>

            <button onClick={togglePlay} className="text-white hover:text-indigo-300 transition-colors p-1">
              {playing ? (
                <Pause className="w-6 h-6" fill="white" />
              ) : (
                <Play className="w-6 h-6" fill="white" />
              )}
            </button>

            <button
              onClick={onNext}
              disabled={!hasNext}
              className="text-white/60 hover:text-white disabled:opacity-30 transition-colors p-1"
            >
              <ChevronDown className="w-5 h-5 -rotate-90" />
            </button>

            <div className="flex items-center gap-1.5 group">
              <button
                onClick={() => {
                  setMuted(m => !m);
                  if (videoRef.current) videoRef.current.muted = !muted;
                }}
                className="text-white hover:text-indigo-300 transition-colors p-1"
              >
                {muted || volume === 0 ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={muted ? 0 : volume}
                onChange={changeVolume}
                className="w-0 group-hover:w-12 transition-all duration-200 accent-indigo-400 cursor-pointer"
              />
            </div>

            <span className="text-white/80 text-xs font-mono">{currentTime} / {duration}</span>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowRateMenu(m => !m);
                }}
                className="text-white/80 hover:text-white text-xs font-bold bg-white/10 hover:bg-white/20 px-2 py-1 rounded transition-colors"
              >
                {playbackRate}x
              </button>
              {showRateMenu && (
                <div className="absolute bottom-8 right-0 bg-gray-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl z-10">
                  {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map(r => (
                    <button
                      key={r}
                      onClick={() => changeRate(r)}
                      className={`block w-full px-3 py-2 text-xs text-left hover:bg-white/10 transition-colors ${
                        playbackRate === r ? "text-indigo-400 font-bold" : "text-white/80"
                      }`}
                    >
                      {r}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button onClick={toggleFullscreen} className="text-white/80 hover:text-white transition-colors p-1">
              {fullscreen ? (
                <Minimize className="w-5 h-5" />
              ) : (
                <Maximize className="w-5 h-5" />
              )}
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
const Dashboard = ({ student, courses, setActiveTab, setActiveCourse, setActiveLecture }) => {
  const inProgress = courses.filter(c => c.progress > 0 && c.progress < 100);
  const maxMin = Math.max(...ACTIVITY_DATA.map(d => d.minutes), 1);

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 md:p-8 text-white">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 50%, #6366f1 0%, transparent 60%), radial-gradient(circle at 80% 20%, #8b5cf6 0%, transparent 50%)",
          }}
        />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={student.avatar}
                alt={student.name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-400/50"
              />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-indigo-500 rounded-lg flex items-center justify-center text-xs font-black">
                Lv{student.level}
              </div>
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
          <div className="bg-white/10 backdrop-blur rounded-2xl p-4 min-w-[180px] w-full sm:w-auto">
            <p className="text-xs text-indigo-300 mb-2">Weekly Learning Goal</p>
            <div className="flex justify-between text-xs text-white/70 mb-1">
              <span>{student.weeklyDone} of {student.weeklyGoal} days</span>
              <span>{Math.round((student.weeklyDone / student.weeklyGoal) * 100)}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full">
              <div
                className="h-full bg-indigo-400 rounded-full"
                style={{ width: `${(student.weeklyDone / student.weeklyGoal) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Enrolled", value: student.totalCourses, icon: "📚", bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-100" },
          { label: "Completed", value: student.completedCourses, icon: "✅", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-100" },
          { label: "Hours", value: `${student.totalHours}h`, icon: "⏱️", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-100" },
          { label: "Certificates", value: student.certificates, icon: "🏆", bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-100" },
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
            </div>
          ) : inProgress.length === 0 ? (
            courses.slice(0, 3).map(course => {
              const allLecs = normalizeSections(course.sections).flatMap(s => s.lectures);
              const nextLec = allLecs[0];
              return (
                <div
                  key={course.id}
                  onClick={() => {
                    setActiveCourse(course);
                    setActiveLecture(nextLec);
                    setActiveTab("Learn");
                  }}
                  className="bg-white border border-gray-100 rounded-2xl p-4 flex gap-4 hover:shadow-lg hover:border-indigo-200 transition-all cursor-pointer group"
                >
                  <img
                    src={course.thumbnail}
                    className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                    alt={course.title}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                      {course.category}
                    </span>
                    <h4 className="font-bold text-gray-900 text-sm mt-1 truncate">{course.title}</h4>
                    <p className="text-xs text-gray-500 mt-0.5">Instructor: {course.instructor}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 self-center">
                    <Play className="w-5 h-5 text-indigo-600 ml-0.5" />
                  </div>
                </div>
              );
            })
          ) : (
            inProgress.map(course => {
              const allLecs = normalizeSections(course.sections).flatMap(s => s.lectures);
              const nextLec = allLecs.find(l => !l.completed) || allLecs[0];
              return (
                <div
                  key={course.id}
                  onClick={() => {
                    setActiveCourse(course);
                    setActiveLecture(nextLec);
                    setActiveTab("Learn");
                  }}
                  className="bg-white border border-gray-100 rounded-2xl p-4 flex gap-4 hover:shadow-lg transition-all cursor-pointer group"
                >
                  <img
                    src={course.thumbnail}
                    className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                    alt={course.title}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                      {course.category}
                    </span>
                    <h4 className="font-bold text-gray-900 text-sm mt-1 truncate">{course.title}</h4>
                    <p className="text-xs text-gray-500 mt-0.5">Next: {nextLec?.title}</p>
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>
                          {course.completedLectures}/{course.totalLectures} lectures
                        </span>
                        <span className="font-bold text-indigo-600">{course.progress}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full">
                        <div
                          className="h-full bg-indigo-500 rounded-full"
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-4">
            <h3 className="font-bold text-gray-900 text-sm mb-3">This Week's Activity</h3>
            <div className="flex items-end gap-1.5 h-20">
              {ACTIVITY_DATA.map(d => (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-t-md bg-indigo-100 relative" style={{ height: `${(d.minutes / maxMin) * 60}px` }}>
                    <div
                      className="absolute inset-x-0 bottom-0 bg-indigo-500 rounded-t-md"
                      style={{ height: `${(d.minutes / maxMin) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400">{d.day}</span>
                </div>
              ))}
            </div>
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
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = courses
    .filter(c => {
      const matchesFilter =
        filter === "All"
          ? true
          : filter === "Completed"
          ? c.progress === 100
          : c.progress > 0 && c.progress < 100;
      const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.instructor.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesFilter && matchesSearch;
    });

  return (
    <div>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <h3 className="text-2xl font-black text-gray-900">My Courses ({courses.length})</h3>
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
            />
          </div>
          <div className="flex gap-2">
            {["All", "In Progress", "Completed"].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-xs font-bold px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                  filter === f
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-16 text-center">
          <p className="text-4xl mb-4">📭</p>
          <h4 className="text-lg font-bold text-gray-700">No courses found</h4>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(course => {
            const allLecs = normalizeSections(course.sections).flatMap(s => s.lectures);
            const nextLec = allLecs.find(l => !l.completed) || allLecs[0];
            return (
              <div
                key={course.id}
                className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
                onClick={() => {
                  setActiveCourse(course);
                  setActiveLecture(nextLec);
                  setActiveTab("Learn");
                }}
              >
                <div className="relative overflow-hidden h-40">
                  <img
                    src={course.thumbnail}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    alt={course.title}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  {course.progress === 100 && (
                    <div className="absolute top-3 right-3 bg-emerald-500 text-white text-xs font-black px-2 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Done
                    </div>
                  )}
                  <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-full bg-indigo-400 flex items-center justify-center text-white text-xs font-bold border border-white">
                      {course.instructor?.charAt(0)}
                    </div>
                    <span className="text-white text-xs font-medium">{course.instructor}</span>
                  </div>
                </div>
                <div className="p-4">
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${course.color}20`, color: course.color }}
                  >
                    {course.category}
                  </span>
                  <h4 className="font-bold text-gray-900 text-sm mt-2 line-clamp-2">{course.title}</h4>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-bold text-gray-700">{course.rating}</span>
                    <span className="text-xs text-gray-400">• {course.totalDuration}</span>
                  </div>
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>
                        {course.completedLectures}/{course.totalLectures}
                      </span>
                      <span className="font-bold" style={{ color: course.color }}>
                        {course.progress}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${course.progress}%`, backgroundColor: course.color }}
                      />
                    </div>
                  </div>
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
  const curriculum = normalizeSections(course?.sections || []);
  const allLectures = curriculum.flatMap(s => s.lectures);
  const [completedIds, setCompletedIds] = useState(
    () => (course?.completedLectureIds || []).map(String)
  );
  const [openSections, setOpenSections] = useState(curriculum.map(s => s.id));
  const [subTab, setSubTab] = useState("Overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const currentIdx = allLectures.findIndex(l => l.id === activeLecture?.id);
  const hasNext = currentIdx < allLectures.length - 1;
  const hasPrev = currentIdx > 0;
  const progress = allLectures.length > 0
    ? Math.round((completedIds.length / allLectures.length) * 100) : 0;

  const markComplete = useCallback((id) => {
    setCompletedIds(prev => {
      if (prev.includes(String(id))) return prev;
      const updated = [...prev, String(id)];
      onMarkComplete && onMarkComplete(course?.id, id);
      return updated;
    });
  }, [course?.id, onMarkComplete]);

  const goNext = () => {
    if (hasNext) {
      setActiveLecture(allLectures[currentIdx + 1]);
      setSubTab("Overview");
    }
  };

  const goPrev = () => {
    if (hasPrev) {
      setActiveLecture(allLectures[currentIdx - 1]);
      setSubTab("Overview");
    }
  };

  const subTabs = ["Overview", "Resources"];

  if (!course || allLectures.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-5xl mb-4">📭</p>
        <h3 className="text-xl font-black text-gray-800">No content yet</h3>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-xs text-gray-400">{course?.title}</div>
          <h2 className="text-base md:text-lg font-black text-gray-900 truncate">{activeLecture?.title}</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500">
            <span>{completedIds.length}/{allLectures.length}</span>
            <div className="w-20 h-1.5 bg-gray-200 rounded-full">
              <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${progress}%` }} />
            </div>
            <span className="font-bold text-indigo-600">{progress}%</span>
          </div>
          <button
            onClick={() => setSidebarOpen(o => !o)}
            className="text-xs font-bold bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors"
          >
            {sidebarOpen ? "Hide" : "Show"} Content
          </button>
        </div>
      </div>

      <div className={`flex gap-4 flex-1 overflow-hidden ${sidebarOpen ? "flex-col lg:flex-row" : ""}`}>
        <div className="flex-1 min-w-0 space-y-4 overflow-y-auto">
          <VideoPlayer
            lecture={activeLecture}
            onComplete={() => markComplete(activeLecture?.id)}
            onNext={goNext}
            onPrev={goPrev}
            hasNext={hasNext}
            hasPrev={hasPrev}
          />

          <div className="flex gap-3 flex-wrap">
            <button
              onClick={goPrev}
              disabled={!hasPrev}
              className="flex items-center gap-2 text-sm font-bold bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl disabled:opacity-40 hover:border-indigo-300 transition-colors"
            >
              ← Previous
            </button>
            <button
              onClick={() => markComplete(activeLecture?.id)}
              className={`flex-1 md:flex-none text-sm font-bold py-2.5 px-6 rounded-xl transition-colors ${
                completedIds.includes(String(activeLecture?.id))
                  ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                  : "bg-indigo-600 text-white hover:bg-indigo-700"
              }`}
            >
              {completedIds.includes(String(activeLecture?.id))
                ? "✓ Completed"
                : "Mark Complete"}
            </button>
            <button
              onClick={goNext}
              disabled={!hasNext}
              className="flex items-center gap-2 text-sm font-bold bg-indigo-600 text-white px-4 py-2.5 rounded-xl disabled:opacity-40 hover:bg-indigo-700 transition-colors"
            >
              Next →
            </button>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            <div className="flex border-b border-gray-100 overflow-x-auto">
              {subTabs.map(t => (
                <button
                  key={t}
                  onClick={() => setSubTab(t)}
                  className={`flex-shrink-0 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                    subTab === t
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-900"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="p-5">
              {subTab === "Overview" && (
                <div>
                  <h3 className="font-black text-gray-900 mb-2">{activeLecture?.title}</h3>
                  <p className="text-sm text-gray-600">Watch the video lecture and take notes. Complete the lecture to mark it as done.</p>
                </div>
              )}
              {subTab === "Resources" && (
                <div>
                  <h4 className="font-bold text-gray-900 mb-3">Downloadable Resources</h4>
                  {activeLecture?.resources?.length > 0 ? (
                    <div className="space-y-2">
                      {activeLecture.resources.map((r, i) => (
                        <a
                          key={i}
                          href={r}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between bg-gray-50 rounded-xl p-3 hover:bg-indigo-50 transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-indigo-600" />
                            <span className="text-sm font-medium text-gray-700 truncate">{r.split('/').pop()}</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-600" />
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">No resources available.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {sidebarOpen && (
          <div className="lg:w-72 flex-shrink-0 bg-white border border-gray-100 rounded-2xl overflow-hidden flex flex-col max-h-96 lg:max-h-none">
            <div className="p-4 border-b bg-gray-50 flex-shrink-0">
              <h3 className="font-black text-gray-900 text-sm">Course Content</h3>
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>{completedIds.length}/{allLectures.length}</span>
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
                    onClick={() =>
                      setOpenSections(p =>
                        p.includes(section.id)
                          ? p.filter(x => x !== section.id)
                          : [...p, section.id]
                      )
                    }
                    className="w-full flex justify-between items-center px-4 py-3 bg-gray-50/80 hover:bg-gray-100 transition-colors text-left"
                  >
                    <span className="font-bold text-xs text-gray-700 pr-2 leading-snug">
                      {section.title}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-gray-400 flex-shrink-0 transition-transform ${
                        openSections.includes(section.id) ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {openSections.includes(section.id) &&
                    section.lectures.map(lec => {
                      const isActive = activeLecture?.id === lec.id;
                      const isDone = completedIds.includes(String(lec.id));
                      return (
                        <button
                          key={lec.id}
                          onClick={() => setActiveLecture(lec)}
                          className={`w-full flex items-start gap-2.5 px-4 py-3 text-left hover:bg-indigo-50 transition-colors ${
                            isActive ? "bg-indigo-50 border-l-4 border-l-indigo-500" : ""
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 transition-colors ${
                              isDone
                                ? "bg-emerald-500"
                                : isActive
                                ? "bg-indigo-500"
                                : "border-2 border-gray-200"
                            }`}
                          >
                            {isDone && (
                              <CheckCircle className="w-3 h-3 text-white" />
                            )}
                            {!isDone && isActive && (
                              <Play className="w-2.5 h-2.5 text-white ml-0.5" fill="white" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-xs leading-snug ${
                                isActive
                                  ? "text-indigo-700 font-bold"
                                  : "text-gray-600"
                              }`}
                            >
                              {lec.title}
                            </p>
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
// CERTIFICATES TAB
// ─────────────────────────────────────────────────────────────────────────────
const Certificates = ({ courses, student }) => {
  const earned = courses.filter(c => c.certificateReady);

  return (
    <div>
      <h3 className="text-2xl font-black text-gray-900 mb-5">My Certificates</h3>
      {earned.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-16 text-center">
          <div className="text-5xl mb-4">🎓</div>
          <h4 className="text-lg font-bold text-gray-700">No certificates yet</h4>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-6">
          {earned.map(course => (
            <div key={course.id} className="bg-white border-2 border-amber-200 rounded-2xl overflow-hidden shadow-xl">
              <div className="relative bg-gradient-to-br from-slate-900 to-indigo-950 p-8 text-center">
                <div
                  className="absolute inset-0 opacity-10"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle, #f59e0b 1px, transparent 1px)",
                    backgroundSize: "20px 20px",
                  }}
                />
                <div className="relative">
                  <div className="w-16 h-16 bg-amber-400/20 border-2 border-amber-400/40 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                    🏆
                  </div>
                  <p className="text-amber-400 text-xs font-black uppercase tracking-widest mb-3">
                    Certificate of Completion
                  </p>
                  <p className="text-white/60 text-xs">This certifies that</p>
                  <p className="text-white text-2xl font-black mt-1">{student.name}</p>
                  <p className="text-white/60 text-xs mt-2">has successfully completed</p>
                  <p className="text-amber-300 font-bold text-sm mt-2 leading-snug px-4">
                    {course.title}
                  </p>
                </div>
              </div>
              <div className="p-4 flex gap-2">
                <button className="flex-1 bg-indigo-600 text-white text-sm font-bold py-2.5 rounded-xl hover:bg-indigo-700 transition-colors">
                  Download PDF
                </button>
                <button className="flex-1 bg-amber-50 text-amber-700 text-sm font-bold py-2.5 rounded-xl hover:bg-amber-100 border border-amber-200 transition-colors">
                  Share
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE TAB
// ─────────────────────────────────────────────────────────────────────────────
const Profile = ({ student }) => {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(student.name);
  const [bio, setBio] = useState(student.bio);
  const [saved, setSaved] = useState(false);

  const save = () => {
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-black text-gray-900">My Profile</h3>
        {saved && (
          <span className="text-sm text-emerald-600 font-bold bg-emerald-50 px-3 py-1 rounded-full">
            ✓ Saved!
          </span>
        )}
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-6">
        <div className="flex items-center gap-5 flex-wrap">
          <img
            src={student.avatar}
            className="w-20 h-20 rounded-2xl object-cover border-2 border-indigo-100"
            alt={student.name}
          />
          <div className="flex-1">
            {editing ? (
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full text-xl font-black border border-indigo-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 mb-2"
              />
            ) : (
              <h4 className="text-xl font-black text-gray-900">{name}</h4>
            )}
            <p className="text-sm text-gray-500">{student.email}</p>
            <p className="text-xs text-gray-400 mt-0.5">Member since {student.joinedDate}</p>
          </div>
          <button
            onClick={() => (editing ? save() : setEditing(true))}
            className="bg-indigo-600 text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors whitespace-nowrap"
          >
            {editing ? "Save" : "Edit"}
          </button>
        </div>

        <div className="mt-4">
          <label className="text-xs font-bold text-gray-500 uppercase">Bio</label>
          {editing ? (
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              className="w-full mt-1 border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 h-20"
            />
          ) : (
            <p className="text-sm text-gray-600 mt-1">{bio}</p>
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-6">
        <h4 className="font-black text-gray-900 mb-4">Learning Stats</h4>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Day Streak", value: `${student.streak} days`, icon: "🔥" },
            { label: "Total Hours", value: `${student.totalHours}h`, icon: "⏱️" },
            { label: "Courses", value: student.totalCourses, icon: "📚" },
            { label: "Certificates", value: student.certificates, icon: "🏆" },
          ].map(s => (
            <div
              key={s.label}
              className="flex items-center gap-3 bg-gray-50 rounded-xl p-3"
            >
              <span className="text-2xl">{s.icon}</span>
              <div>
                <div className="font-black text-gray-900">{s.value}</div>
                <div className="text-xs text-gray-500">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PORTAL COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
const TABS = [
  { id: "Dashboard", icon: Home, label: "Dashboard" },
  { id: "My Courses", icon: BookOpen, label: "My Courses" },
  { id: "Learn", icon: Play, label: "Learn" },
  { id: "Certificates", icon: Award, label: "Certificates" },
  { id: "Profile", icon: User, label: "Profile" },
];

export default function Portals() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [activeCourse, setActiveCourse] = useState(null);
  const [activeLecture, setActiveLecture] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [student, setStudent] = useState(FALLBACK_STUDENT);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      setError("");
      try {
        const savedUser = JSON.parse(localStorage.getItem("user") || "{}");

        const [enrollRes, progressRes] = await Promise.all([
          axios.get(`${BASE_URL}/enrollments/my`, authHeaders()),
          axios.get(`${BASE_URL}/progress/my`, authHeaders()),
        ]);

        const enrollments = enrollRes.data || [];
        const progressMap = {};
        (progressRes.data || []).forEach(p => {
          progressMap[String(p.courseId)] = p.completedLectures || [];
        });

        const normalizedCourses = enrollments
          .map((enrollment, i) => {
            const courseData = enrollment.course;
            if (!courseData) return null;
            const completedLectureIds = progressMap[String(courseData._id)] || [];
            return normalizeCourse(courseData, i, completedLectureIds);
          })
          .filter(Boolean);

        setCourses(normalizedCourses);

        const totalCourses = normalizedCourses.length;
        const completedCourses = normalizedCourses.filter(c => c.progress === 100).length;
        const certificates = normalizedCourses.filter(c => c.certificateReady).length;

        setStudent({
          ...FALLBACK_STUDENT,
          name: savedUser.name || "Student",
          email: savedUser.email || "",
          avatar: savedUser.avatar || `https://i.pravatar.cc/150?img=11`,
          joinedDate: new Date().toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          }),
          bio: savedUser.bio || "Passionate learner.",
          totalCourses,
          completedCourses,
          certificates,
          totalHours: Math.round(totalCourses * 8.5),
          xp: totalCourses * 500 + completedCourses * 1000,
          level: Math.max(1, Math.floor((totalCourses * 500 + completedCourses * 1000) / 1000)),
          streak: Math.min(7, totalCourses * 2),
          weeklyDone: Math.min(5, totalCourses),
          weeklyGoal: 5,
        });

        if (normalizedCourses.length > 0) {
          const first = normalizedCourses[0];
          const sections = normalizeSections(first.sections);
          const lecs = sections.flatMap(s => s.lectures);
          const nextLec = lecs.find(l => !first.completedLectureIds.includes(l.id)) || lecs[0];
          setActiveCourse(first);
          if (nextLec) setActiveLecture(nextLec);
        }
      } catch (err) {
        console.error("Portal error:", err);
        if (err.response?.status === 401) {
          navigate("/auth/login");
        } else {
          setError(err.response?.data?.message || "Could not load dashboard");
        }
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, [navigate]);

  const handleMarkComplete = useCallback(
    async (courseId, lectureId) => {
      try {
        await axios.post(
          `${BASE_URL}/progress/mark`,
          { courseId, lectureId },
          authHeaders()
        );
      } catch (err) {
        console.error("Progress save error:", err);
      }
    },
    []
  );

  const handleSetActiveCourse = (course) => {
    setActiveCourse(course);
    const sections = normalizeSections(course.sections);
    const all = sections.flatMap(s => s.lectures);
    const nextLec = all.find(l => !course.completedLectureIds?.includes(l.id)) || all[0];
    setActiveLecture(nextLec);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/auth/login");
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-32">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
          <p className="text-gray-500 font-medium">Loading dashboard...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-24 text-center px-4">
          <p className="text-5xl mb-4">⚠️</p>
          <h3 className="text-xl font-black text-gray-800 mb-2">Error</h3>
          <p className="text-gray-500 max-w-md mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-indigo-600 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case "Dashboard":
        return (
          <Dashboard
            student={student}
            courses={courses}
            setActiveTab={setActiveTab}
            setActiveCourse={handleSetActiveCourse}
            setActiveLecture={setActiveLecture}
          />
        );
      case "My Courses":
        return (
          <MyCourses
            courses={courses}
            setActiveTab={setActiveTab}
            setActiveCourse={handleSetActiveCourse}
            setActiveLecture={setActiveLecture}
          />
        );
      case "Learn":
        return (
          <Learn
            course={activeCourse}
            activeLecture={activeLecture}
            setActiveLecture={setActiveLecture}
            onMarkComplete={handleMarkComplete}
          />
        );
      case "Certificates":
        return <Certificates courses={courses} student={student} />;
      case "Profile":
        return <Profile student={student} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div className="flex h-screen overflow-hidden flex-col md:flex-row">
        {/* Sidebar */}
        <aside
          className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white flex flex-col shadow-2xl transition-transform duration-300 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }`}
        >
          <div className="px-5 py-5 border-b border-white/10 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-indigo-500 rounded-xl flex items-center justify-center text-white font-black">
                L
              </div>
              <div>
                <h1 className="font-black text-white">LearnFlow</h1>
                <p className="text-slate-400 text-xs">Student Portal</p>
              </div>
            </div>
          </div>

          <div className="px-5 py-4 border-b border-white/10 flex-shrink-0">
            <div className="flex items-center gap-3">
              <img
                src={student.avatar}
                className="w-10 h-10 rounded-xl object-cover border-2 border-indigo-400/50"
                alt={student.name}
              />
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate">{student.name}</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                  <p className="text-xs text-slate-400 truncate">
                    Lv.{student.level} • {student.xp.toLocaleString()} XP
                  </p>
                </div>
              </div>
            </div>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    activeTab === tab.id
                      ? "bg-indigo-600 text-white"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="px-5 py-4 border-t border-white/10 flex-shrink-0 space-y-2">
            <div className="bg-white/5 rounded-xl p-3">
              <p className="text-xs text-slate-400">Current Streak</p>
              <div className="flex items-center justify-between">
                <p className="font-black text-white">{student.streak} days 🔥</p>
                <p className="text-xs text-indigo-400">Goal: {student.weeklyDone}/{student.weeklyGoal}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full text-sm font-bold text-slate-400 hover:text-red-400 hover:bg-red-500/10 py-2 rounded-xl transition-colors flex items-center gap-2 justify-center"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </aside>

        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/60 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="bg-white border-b border-gray-100 px-4 md:px-6 py-4 flex items-center justify-between flex-shrink-0 shadow-sm">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden text-gray-500 hover:text-gray-900 p-1"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div>
                <h2 className="text-base md:text-lg font-black text-gray-900">{activeTab}</h2>
                <p className="text-xs text-gray-400 hidden sm:block">
                  {activeTab === "Learn" && activeCourse
                    ? activeCourse.title
                    : `Welcome back, ${student.name}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
              <button className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors">
                <Bell className="w-5 h-5" />
              </button>
              <img
                src={student.avatar}
                className="w-8 h-8 rounded-xl object-cover border-2 border-indigo-200 cursor-pointer"
                alt={student.name}
                onClick={() => {
                  setActiveTab("Profile");
                  setSidebarOpen(false);
                }}
              />
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            {renderContent()}
          </main>
        </div>
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAllCourses } from '../services/api';
import CourseCard from '../components/CourseCard';
import Loader from '../components/Loader';

const CATEGORIES = ['Development', 'Design', 'Business', 'Marketing', 'Data Science', 'Photography'];

const StatItem = ({ value, label }) => (
  <div className="text-center">
    <p className="text-3xl md:text-4xl font-extrabold font-heading text-white">{value}</p>
    <p className="text-gray-400 text-sm mt-1">{label}</p>
  </div>
);

const Home = () => {
  const [featuredCourses, setFeaturedCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const { data } = await getAllCourses();
        setFeaturedCourses(data.slice(0, 8));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/courses?search=${searchQuery}`);
  };

  return (
    <div className="page-enter">
      {/* ── Hero Section ───────────────────────────────────── */}
      <section className="relative overflow-hidden bg-dark-900">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-600/10 via-transparent to-purple-900/10 pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-brand-600/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-brand-600/10 border border-brand-600/30 rounded-full px-4 py-1.5 mb-6">
              <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
              <span className="text-brand-400 text-sm font-medium">Learn from the best instructors</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold font-heading text-white leading-tight mb-6">
              Unlock Your
              <span className="text-gradient block">Full Potential</span>
              with EduFlow
            </h1>

            <p className="text-gray-400 text-lg md:text-xl leading-relaxed mb-10 max-w-2xl">
              Access thousands of expert-led courses in development, design, business and more. Learn at your own pace, anywhere, anytime.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 mb-8">
              <div className="relative flex-1">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="What do you want to learn today?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-dark-700/80 border border-gray-700 text-gray-100 rounded-xl pl-12 pr-4 py-4 text-base focus:outline-none focus:border-brand-500 placeholder-gray-500 transition-all"
                />
              </div>
              <button type="submit" className="btn-primary px-8 py-4 text-base rounded-xl whitespace-nowrap">
                Search Courses
              </button>
            </form>

            <div className="flex flex-wrap gap-2">
              <span className="text-gray-500 text-sm self-center">Popular:</span>
              {['React', 'Python', 'UI/UX', 'Node.js', 'Machine Learning'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => navigate(`/courses?search=${tag}`)}
                  className="text-xs px-3 py-1.5 rounded-full bg-dark-700 border border-gray-700 text-gray-300 hover:border-brand-500 hover:text-brand-400 transition-all"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ──────────────────────────────────────────── */}
      <section className="border-y border-gray-800 bg-dark-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatItem value="50K+" label="Active Students" />
            <StatItem value="1,200+" label="Expert Courses" />
            <StatItem value="300+" label="Top Instructors" />
            <StatItem value="4.8★" label="Average Rating" />
          </div>
        </div>
      </section>

      {/* ── Categories ─────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold font-heading text-white">Browse Categories</h2>
            <p className="text-gray-400 mt-1">Find the right topic for you</p>
          </div>
          <Link to="/courses" className="text-brand-500 hover:text-brand-400 text-sm font-medium transition-colors">
            View all →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {CATEGORIES.map((cat, i) => {
            const icons = ['💻', '🎨', '📊', '📣', '🧠', '📷'];
            return (
              <Link
                key={cat}
                to={`/courses?category=${cat}`}
                className="flex flex-col items-center gap-2 p-4 bg-dark-800 border border-gray-800 rounded-xl hover:border-brand-600/50 hover:bg-dark-700 transition-all group text-center"
              >
                <span className="text-2xl">{icons[i]}</span>
                <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
                  {cat}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── Featured Courses ────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold font-heading text-white">Featured Courses</h2>
            <p className="text-gray-400 mt-1">Hand-picked by our team</p>
          </div>
          <Link to="/courses" className="text-brand-500 hover:text-brand-400 text-sm font-medium transition-colors">
            See all courses →
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader size="lg" text="Loading courses..." />
          </div>
        ) : featuredCourses.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <p className="text-lg">No courses yet. Be the first to create one!</p>
            <Link to="/register" className="btn-primary mt-4 inline-block">Get Started</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featuredCourses.map((course) => (
              <CourseCard key={course._id} course={course} />
            ))}
          </div>
        )}
      </section>

      {/* ── CTA Banner ──────────────────────────────────────── */}
      <section className="bg-gradient-to-r from-brand-700 to-brand-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold font-heading text-white mb-4">
            Ready to start teaching?
          </h2>
          <p className="text-red-100 text-lg mb-8 max-w-xl mx-auto">
            Join thousands of instructors sharing their knowledge and earning on EduFlow.
          </p>
          <Link
            to="/register?role=instructor"
            className="inline-flex items-center gap-2 bg-white text-brand-600 hover:bg-red-50 font-bold py-3 px-8 rounded-xl transition-all shadow-lg"
          >
            Become an Instructor
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;

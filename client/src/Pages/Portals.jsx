import React, { useState, useEffect } from 'react';
import { 
  Play, Pause, SkipForward, SkipBack, Volume2, Maximize, 
  CheckCircle, Circle, Clock, BookOpen, Download, FileText,
  MessageSquare, Star, Award, Search, Menu, X, Home, 
  GraduationCap, User, Settings, LogOut, Bell, ChevronDown,
  ChevronRight, Filter, Grid, List, TrendingUp, Calendar,
  Share2, Bookmark, Eye, ThumbsUp, Edit3, Trash2, Send
} from 'lucide-react';

// Mock Data
const mockUser = {
  name: "Sarah Johnson",
  email: "sarah.j@example.com",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
  enrolledCourses: 12,
  completedCourses: 4,
  certificates: 4,
  totalHours: 145
};

const mockCourses = [
  {
    id: 1,
    title: "Complete Web Development Bootcamp 2024",
    instructor: "Dr. Angela Yu",
    thumbnail: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=450&fit=crop",
    progress: 67,
    totalLessons: 45,
    completedLessons: 30,
    duration: "52h 30m",
    rating: 4.8,
    students: 125000,
    lastAccessed: "2 hours ago",
    category: "Web Development"
  },
  {
    id: 2,
    title: "Advanced React & Redux Masterclass",
    instructor: "Maximilian Schwarzmüller",
    thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=450&fit=crop",
    progress: 34,
    totalLessons: 38,
    completedLessons: 13,
    duration: "45h 15m",
    rating: 4.9,
    students: 98000,
    lastAccessed: "1 day ago",
    category: "Frontend"
  },
  {
    id: 3,
    title: "Node.js, Express & MongoDB - Full Stack",
    instructor: "Jonas Schmedtmann",
    thumbnail: "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800&h=450&fit=crop",
    progress: 89,
    totalLessons: 32,
    completedLessons: 28,
    duration: "38h 45m",
    rating: 4.7,
    students: 87500,
    lastAccessed: "3 days ago",
    category: "Backend"
  }
];

const mockCurrentCourse = {
  id: 1,
  title: "Complete Web Development Bootcamp 2024",
  instructor: "Dr. Angela Yu",
  rating: 4.8,
  students: 125000,
  lastUpdated: "March 2024",
  sections: [
    {
      id: 1,
      title: "Introduction to Web Development",
      lessons: [
        { id: 1, title: "Welcome to the Course", duration: "5:30", completed: true, type: "video" },
        { id: 2, title: "Course Resources", duration: "3:15", completed: true, type: "article" },
        { id: 3, title: "Setup Your Development Environment", duration: "12:45", completed: true, type: "video" }
      ]
    },
    {
      id: 2,
      title: "HTML Fundamentals",
      lessons: [
        { id: 4, title: "HTML Basics", duration: "15:20", completed: true, type: "video" },
        { id: 5, title: "HTML Elements & Tags", duration: "18:30", completed: true, type: "video" },
        { id: 6, title: "Forms and Input Elements", duration: "22:15", completed: false, type: "video", current: true },
        { id: 7, title: "HTML Project: Build a Portfolio", duration: "35:40", completed: false, type: "project" }
      ]
    },
    {
      id: 3,
      title: "CSS Mastery",
      lessons: [
        { id: 8, title: "CSS Selectors", duration: "16:45", completed: false, type: "video" },
        { id: 9, title: "Flexbox Layout", duration: "25:30", completed: false, type: "video" },
        { id: 10, title: "CSS Grid", duration: "28:15", completed: false, type: "video" },
        { id: 11, title: "Responsive Design", duration: "32:20", completed: false, type: "video" }
      ]
    }
  ]
};

const mockNotes = [
  {
    id: 1,
    lesson: "HTML Basics",
    timestamp: "5:23",
    content: "Remember: Semantic HTML improves accessibility and SEO. Use <header>, <nav>, <main>, <article>, <section>, <footer>",
    created: "2 hours ago"
  },
  {
    id: 2,
    lesson: "HTML Elements & Tags",
    timestamp: "12:45",
    content: "Block vs Inline elements: Block takes full width, inline only takes necessary width. Use display property to change behavior.",
    created: "1 day ago"
  }
];

const mockQA = [
  {
    id: 1,
    user: "Michael Chen",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael",
    question: "How do I center a div both horizontally and vertically?",
    lesson: "CSS Flexbox",
    timestamp: "2 hours ago",
    answers: 3,
    upvotes: 12,
    resolved: true
  },
  {
    id: 2,
    user: "Emily Roberts",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emily",
    question: "What's the difference between let, const, and var?",
    lesson: "JavaScript Fundamentals",
    timestamp: "5 hours ago",
    answers: 5,
    upvotes: 24,
    resolved: true
  }
];

function StudentPortal() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [noteText, setNoteText] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Navigation Component
  const Navbar = () => (
    <nav className="navbar">
      <div className="navbar-content">
        <div className="navbar-left">
          <button className="menu-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className="logo">
            <GraduationCap size={32} />
            <span>EduPortal</span>
          </div>
        </div>
        
        <div className="search-bar">
          <Search size={20} />
          <input 
            type="text" 
            placeholder="Search courses, lessons, instructors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="navbar-right">
          <button className="icon-btn">
            <Bell size={20} />
            <span className="badge">3</span>
          </button>
          <div className="user-menu">
            <img src={mockUser.avatar} alt={mockUser.name} />
            <span>{isMobile ? '' : mockUser.name}</span>
            <ChevronDown size={16} />
          </div>
        </div>
      </div>
    </nav>
  );

  // Sidebar Component
  const Sidebar = () => (
    <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
      <div className="sidebar-content">
        <button 
          className={`sidebar-item ${currentView === 'dashboard' ? 'active' : ''}`}
          onClick={() => { setCurrentView('dashboard'); setIsSidebarOpen(false); }}
        >
          <Home size={20} />
          <span>Dashboard</span>
        </button>
        <button 
          className={`sidebar-item ${currentView === 'courses' ? 'active' : ''}`}
          onClick={() => { setCurrentView('courses'); setIsSidebarOpen(false); }}
        >
          <BookOpen size={20} />
          <span>My Courses</span>
        </button>
        <button 
          className={`sidebar-item ${currentView === 'progress' ? 'active' : ''}`}
          onClick={() => { setCurrentView('progress'); setIsSidebarOpen(false); }}
        >
          <TrendingUp size={20} />
          <span>Progress</span>
        </button>
        <button 
          className={`sidebar-item ${currentView === 'certificates' ? 'active' : ''}`}
          onClick={() => { setCurrentView('certificates'); setIsSidebarOpen(false); }}
        >
          <Award size={20} />
          <span>Certificates</span>
        </button>
        <button 
          className={`sidebar-item ${currentView === 'profile' ? 'active' : ''}`}
          onClick={() => { setCurrentView('profile'); setIsSidebarOpen(false); }}
        >
          <User size={20} />
          <span>Profile</span>
        </button>
        <button className="sidebar-item">
          <Settings size={20} />
          <span>Settings</span>
        </button>
        <button className="sidebar-item logout">
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );

  // Dashboard View
  const Dashboard = () => (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Welcome back, {mockUser.name.split(' ')[0]}! 👋</h1>
          <p>Continue your learning journey</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
            <BookOpen size={24} />
          </div>
          <div className="stat-content">
            <h3>{mockUser.enrolledCourses}</h3>
            <p>Enrolled Courses</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'}}>
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <h3>{mockUser.completedCourses}</h3>
            <p>Completed</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'}}>
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <h3>{mockUser.totalHours}h</h3>
            <p>Learning Time</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'}}>
            <Award size={24} />
          </div>
          <div className="stat-content">
            <h3>{mockUser.certificates}</h3>
            <p>Certificates</p>
          </div>
        </div>
      </div>

      <div className="section">
        <h2>Continue Learning</h2>
        <div className="courses-grid">
          {mockCourses.map(course => (
            <div key={course.id} className="course-card" onClick={() => {
              setSelectedCourse(course);
              setCurrentView('course');
            }}>
              <div className="course-thumbnail">
                <img src={course.thumbnail} alt={course.title} />
                <div className="course-overlay">
                  <button className="play-btn">
                    <Play size={24} fill="white" />
                  </button>
                </div>
              </div>
              <div className="course-info">
                <span className="course-category">{course.category}</span>
                <h3>{course.title}</h3>
                <p className="course-instructor">{course.instructor}</p>
                <div className="course-meta">
                  <div className="rating">
                    <Star size={14} fill="#fbbf24" stroke="#fbbf24" />
                    <span>{course.rating}</span>
                  </div>
                  <span>•</span>
                  <span>{course.duration}</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{width: `${course.progress}%`}}></div>
                </div>
                <p className="progress-text">{course.progress}% Complete • {course.lastAccessed}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <h2>Recommended for You</h2>
        <div className="recommended-grid">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="recommended-card">
              <div className="recommended-thumbnail">
                <img src={`https://images.unsplash.com/photo-${1550000000000 + i}?w=400&h=225&fit=crop`} alt="Course" />
              </div>
              <div className="recommended-info">
                <h4>Advanced JavaScript Concepts</h4>
                <p>Master closures, prototypes, and async patterns</p>
                <div className="recommended-meta">
                  <Star size={14} fill="#fbbf24" stroke="#fbbf24" />
                  <span>4.9</span>
                  <span>•</span>
                  <span>32h</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Course Player View
  const CoursePlayer = () => {
    const currentLessonData = currentLesson || mockCurrentCourse.sections[1].lessons[2];
    
    return (
      <div className="course-player">
        <div className="player-main">
          <div className="video-container">
            <div className="video-player">
              <img 
                src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&h=675&fit=crop" 
                alt="Video" 
                className="video-placeholder"
              />
              <div className="video-overlay">
                <button className="video-play-btn" onClick={() => setIsPlaying(!isPlaying)}>
                  {isPlaying ? <Pause size={48} /> : <Play size={48} fill="white" />}
                </button>
              </div>
              <div className="video-controls">
                <div className="progress-timeline">
                  <div className="timeline-fill" style={{width: `${videoProgress}%`}}></div>
                </div>
                <div className="controls-bottom">
                  <div className="controls-left">
                    <button onClick={() => setIsPlaying(!isPlaying)}>
                      {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                    </button>
                    <button><SkipBack size={20} /></button>
                    <button><SkipForward size={20} /></button>
                    <button><Volume2 size={20} /></button>
                    <span className="time-display">5:23 / 22:15</span>
                  </div>
                  <div className="controls-right">
                    <button><Settings size={20} /></button>
                    <button><Maximize size={20} /></button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="player-content">
            <div className="content-header">
              <div>
                <h1>{currentLessonData.title}</h1>
                <div className="content-meta">
                  <span>{mockCurrentCourse.instructor}</span>
                  <span>•</span>
                  <span>Updated {mockCurrentCourse.lastUpdated}</span>
                  <span>•</span>
                  <div className="rating">
                    <Star size={14} fill="#fbbf24" stroke="#fbbf24" />
                    <span>{mockCurrentCourse.rating}</span>
                  </div>
                </div>
              </div>
              <div className="content-actions">
                <button className="action-btn">
                  <Bookmark size={20} />
                  <span>Save</span>
                </button>
                <button className="action-btn">
                  <Share2 size={20} />
                  <span>Share</span>
                </button>
              </div>
            </div>

            <div className="tabs">
              <button 
                className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                Overview
              </button>
              <button 
                className={`tab ${activeTab === 'notes' ? 'active' : ''}`}
                onClick={() => setActiveTab('notes')}
              >
                <Edit3 size={16} />
                Notes ({mockNotes.length})
              </button>
              <button 
                className={`tab ${activeTab === 'qa' ? 'active' : ''}`}
                onClick={() => setActiveTab('qa')}
              >
                <MessageSquare size={16} />
                Q&A ({mockQA.length})
              </button>
              <button 
                className={`tab ${activeTab === 'resources' ? 'active' : ''}`}
                onClick={() => setActiveTab('resources')}
              >
                <Download size={16} />
                Resources
              </button>
            </div>

            <div className="tab-content">
              {activeTab === 'overview' && (
                <div className="overview-tab">
                  <h3>About this lesson</h3>
                  <p>In this comprehensive lesson, you'll learn about HTML forms and input elements. We'll cover different input types, form validation, and best practices for creating user-friendly forms.</p>
                  
                  <h3>What you'll learn</h3>
                  <ul className="learning-points">
                    <li><CheckCircle size={18} /> Understanding form structure and attributes</li>
                    <li><CheckCircle size={18} /> Different input types (text, email, password, etc.)</li>
                    <li><CheckCircle size={18} /> Form validation techniques</li>
                    <li><CheckCircle size={18} /> Accessibility best practices</li>
                    <li><CheckCircle size={18} /> Styling forms with CSS</li>
                  </ul>

                  <h3>Course Description</h3>
                  <p>This complete web development bootcamp will teach you everything you need to become a professional full-stack developer. From HTML and CSS basics to advanced JavaScript frameworks, backend development, and deployment strategies.</p>
                </div>
              )}

              {activeTab === 'notes' && (
                <div className="notes-tab">
                  <div className="note-editor">
                    <textarea 
                      placeholder="Add a note at current timestamp (5:23)..."
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      rows="4"
                    />
                    <button className="btn-primary">
                      <Send size={16} />
                      Save Note
                    </button>
                  </div>

                  <div className="notes-list">
                    {mockNotes.map(note => (
                      <div key={note.id} className="note-card">
                        <div className="note-header">
                          <div>
                            <span className="note-lesson">{note.lesson}</span>
                            <span className="note-timestamp">{note.timestamp}</span>
                          </div>
                          <div className="note-actions">
                            <button><Edit3 size={16} /></button>
                            <button><Trash2 size={16} /></button>
                          </div>
                        </div>
                        <p className="note-content">{note.content}</p>
                        <span className="note-date">{note.created}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'qa' && (
                <div className="qa-tab">
                  <div className="question-form">
                    <h3>Ask a Question</h3>
                    <input 
                      type="text" 
                      placeholder="What's your question?"
                      value={questionText}
                      onChange={(e) => setQuestionText(e.target.value)}
                    />
                    <textarea 
                      placeholder="Provide more details..."
                      rows="4"
                    />
                    <button className="btn-primary">
                      <MessageSquare size={16} />
                      Post Question
                    </button>
                  </div>

                  <div className="qa-list">
                    <h3>Recent Questions</h3>
                    {mockQA.map(qa => (
                      <div key={qa.id} className="qa-card">
                        <div className="qa-header">
                          <img src={qa.avatar} alt={qa.user} />
                          <div>
                            <h4>{qa.user}</h4>
                            <span className="qa-meta">{qa.lesson} • {qa.timestamp}</span>
                          </div>
                          {qa.resolved && <span className="resolved-badge">Resolved</span>}
                        </div>
                        <p className="qa-question">{qa.question}</p>
                        <div className="qa-footer">
                          <button className="qa-action">
                            <ThumbsUp size={16} />
                            <span>{qa.upvotes}</span>
                          </button>
                          <button className="qa-action">
                            <MessageSquare size={16} />
                            <span>{qa.answers} answers</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'resources' && (
                <div className="resources-tab">
                  <div className="resources-list">
                    <div className="resource-item">
                      <FileText size={24} />
                      <div>
                        <h4>HTML Forms Cheat Sheet.pdf</h4>
                        <span>2.5 MB</span>
                      </div>
                      <button className="btn-secondary">
                        <Download size={16} />
                        Download
                      </button>
                    </div>
                    <div className="resource-item">
                      <FileText size={24} />
                      <div>
                        <h4>Form Validation Examples.zip</h4>
                        <span>5.8 MB</span>
                      </div>
                      <button className="btn-secondary">
                        <Download size={16} />
                        Download
                      </button>
                    </div>
                    <div className="resource-item">
                      <FileText size={24} />
                      <div>
                        <h4>Source Code - Project Files.zip</h4>
                        <span>12.3 MB</span>
                      </div>
                      <button className="btn-secondary">
                        <Download size={16} />
                        Download
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="curriculum-sidebar">
          <div className="sidebar-header">
            <h3>Course Content</h3>
            <span>{mockCurrentCourse.sections.reduce((acc, s) => acc + s.lessons.length, 0)} lessons</span>
          </div>

          <div className="curriculum-list">
            {mockCurrentCourse.sections.map(section => (
              <div key={section.id} className="curriculum-section">
                <div className="section-header">
                  <ChevronDown size={18} />
                  <h4>{section.title}</h4>
                  <span>{section.lessons.length} lessons</span>
                </div>
                <div className="section-lessons">
                  {section.lessons.map(lesson => (
                    <div 
                      key={lesson.id} 
                      className={`lesson-item ${lesson.completed ? 'completed' : ''} ${lesson.current ? 'current' : ''}`}
                      onClick={() => setCurrentLesson(lesson)}
                    >
                      <div className="lesson-check">
                        {lesson.completed ? 
                          <CheckCircle size={18} fill="#10b981" stroke="#10b981" /> : 
                          <Circle size={18} />
                        }
                      </div>
                      <div className="lesson-info">
                        <span className="lesson-title">{lesson.title}</span>
                        <div className="lesson-meta">
                          <Play size={12} />
                          <span>{lesson.duration}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // My Courses View
  const MyCoursesView = () => (
    <div className="my-courses">
      <div className="courses-header">
        <h1>My Courses</h1>
        <div className="courses-filters">
          <button className="filter-btn">
            <Filter size={18} />
            Filter
          </button>
          <button className="view-btn active">
            <Grid size={18} />
          </button>
          <button className="view-btn">
            <List size={18} />
          </button>
        </div>
      </div>

      <div className="filter-tags">
        <button className="tag active">All Courses</button>
        <button className="tag">In Progress</button>
        <button className="tag">Completed</button>
        <button className="tag">Wishlist</button>
      </div>

      <div className="courses-grid">
        {mockCourses.map(course => (
          <div key={course.id} className="course-card" onClick={() => {
            setSelectedCourse(course);
            setCurrentView('course');
          }}>
            <div className="course-thumbnail">
              <img src={course.thumbnail} alt={course.title} />
              <div className="course-overlay">
                <button className="play-btn">
                  <Play size={24} fill="white" />
                </button>
              </div>
            </div>
            <div className="course-info">
              <span className="course-category">{course.category}</span>
              <h3>{course.title}</h3>
              <p className="course-instructor">{course.instructor}</p>
              <div className="course-meta">
                <div className="rating">
                  <Star size={14} fill="#fbbf24" stroke="#fbbf24" />
                  <span>{course.rating}</span>
                </div>
                <span>•</span>
                <span>{course.students.toLocaleString()} students</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{width: `${course.progress}%`}}></div>
              </div>
              <p className="progress-text">{course.completedLessons}/{course.totalLessons} lessons • {course.progress}% complete</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Certificates View
  const CertificatesView = () => (
    <div className="certificates">
      <h1>My Certificates</h1>
      <p className="subtitle">Showcase your achievements</p>

      <div className="certificates-grid">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="certificate-card">
            <div className="certificate-badge">
              <Award size={48} />
            </div>
            <h3>Complete Web Development Bootcamp</h3>
            <p>Completed on March 15, 2024</p>
            <p className="certificate-instructor">Instructor: Dr. Angela Yu</p>
            <div className="certificate-actions">
              <button className="btn-primary">
                <Download size={16} />
                Download
              </button>
              <button className="btn-secondary">
                <Share2 size={16} />
                Share
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="student-portal">
      <Navbar />
      <Sidebar />
      <main className={`main-content ${isSidebarOpen ? 'sidebar-open' : ''}`}>
        {currentView === 'dashboard' && <Dashboard />}
        {currentView === 'courses' && <MyCoursesView />}
        {currentView === 'course' && <CoursePlayer />}
        {currentView === 'certificates' && <CertificatesView />}
      </main>

      <style jsx>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .student-portal {
          min-height: 100vh;
          background: linear-gradient(135deg, #f5f7fa 0%, #e8edf2 100%);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif;
          color: #1a202c;
        }

        /* Navbar */
        .navbar {
          background: white;
          border-bottom: 1px solid #e2e8f0;
          position: sticky;
          top: 0;
          z-index: 100;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .navbar-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 2rem;
          max-width: 1920px;
          margin: 0 auto;
        }

        .navbar-left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .menu-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .menu-btn:hover {
          background: #f1f5f9;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 1.5rem;
          font-weight: 700;
          color: #6366f1;
        }

        .search-bar {
          display: flex;
          align-items: center;
          background: #f1f5f9;
          padding: 0.75rem 1.25rem;
          border-radius: 12px;
          gap: 0.75rem;
          flex: 0 1 600px;
          transition: all 0.2s;
        }

        .search-bar:focus-within {
          background: white;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .search-bar input {
          border: none;
          background: none;
          outline: none;
          width: 100%;
          font-size: 0.95rem;
        }

        .navbar-right {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .icon-btn {
          position: relative;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .icon-btn:hover {
          background: #f1f5f9;
        }

        .badge {
          position: absolute;
          top: 4px;
          right: 4px;
          background: #ef4444;
          color: white;
          font-size: 0.7rem;
          padding: 2px 6px;
          border-radius: 10px;
          font-weight: 600;
        }

        .user-menu {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .user-menu:hover {
          background: #f1f5f9;
        }

        .user-menu img {
          width: 36px;
          height: 36px;
          border-radius: 50%;
        }

        /* Sidebar */
        .sidebar {
          position: fixed;
          left: 0;
          top: 73px;
          width: 280px;
          height: calc(100vh - 73px);
          background: white;
          border-right: 1px solid #e2e8f0;
          padding: 1.5rem 0;
          transform: translateX(-100%);
          transition: transform 0.3s;
          z-index: 50;
          overflow-y: auto;
        }

        .sidebar.open {
          transform: translateX(0);
        }

        .sidebar-content {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          padding: 0 1rem;
        }

        .sidebar-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.875rem 1.25rem;
          border-radius: 12px;
          border: none;
          background: none;
          cursor: pointer;
          font-size: 0.95rem;
          transition: all 0.2s;
          text-align: left;
          color: #64748b;
          font-weight: 500;
        }

        .sidebar-item:hover {
          background: #f1f5f9;
          color: #1a202c;
        }

        .sidebar-item.active {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
        }

        .sidebar-item.logout {
          margin-top: auto;
          color: #ef4444;
        }

        /* Main Content */
        .main-content {
          margin-left: 0;
          padding: 2rem;
          transition: margin-left 0.3s;
          min-height: calc(100vh - 73px);
        }

        /* Dashboard */
        .dashboard {
          max-width: 1400px;
          margin: 0 auto;
        }

        .dashboard-header {
          margin-bottom: 2rem;
        }

        .dashboard-header h1 {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .dashboard-header p {
          color: #64748b;
          font-size: 1.1rem;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 3rem;
        }

        .stat-card {
          background: white;
          padding: 1.75rem;
          border-radius: 16px;
          display: flex;
          align-items: center;
          gap: 1.25rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          transition: all 0.3s;
        }

        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
        }

        .stat-icon {
          width: 60px;
          height: 60px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .stat-content h3 {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
        }

        .stat-content p {
          color: #64748b;
          font-size: 0.9rem;
        }

        .section {
          margin-bottom: 3rem;
        }

        .section h2 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
        }

        .courses-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.75rem;
        }

        .course-card {
          background: white;
          border-radius: 16px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .course-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        }

        .course-thumbnail {
          position: relative;
          width: 100%;
          height: 180px;
          overflow: hidden;
        }

        .course-thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s;
        }

        .course-card:hover .course-thumbnail img {
          transform: scale(1.05);
        }

        .course-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s;
        }

        .course-card:hover .course-overlay {
          opacity: 1;
        }

        .play-btn {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: white;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .play-btn:hover {
          transform: scale(1.1);
        }

        .course-info {
          padding: 1.25rem;
        }

        .course-category {
          display: inline-block;
          background: #e0e7ff;
          color: #6366f1;
          padding: 0.375rem 0.875rem;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 600;
          margin-bottom: 0.75rem;
        }

        .course-info h3 {
          font-size: 1.05rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .course-instructor {
          color: #64748b;
          font-size: 0.875rem;
          margin-bottom: 0.75rem;
        }

        .course-meta {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
          font-size: 0.875rem;
          color: #64748b;
        }

        .rating {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-weight: 600;
          color: #1a202c;
        }

        .progress-bar {
          width: 100%;
          height: 6px;
          background: #e2e8f0;
          border-radius: 10px;
          overflow: hidden;
          margin-bottom: 0.5rem;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%);
          transition: width 0.3s;
        }

        .progress-text {
          font-size: 0.8rem;
          color: #64748b;
        }

        /* Course Player */
        .course-player {
          display: flex;
          height: calc(100vh - 73px);
          margin: -2rem;
        }

        .player-main {
          flex: 1;
          overflow-y: auto;
          background: #0f172a;
        }

        .video-container {
          background: black;
          position: relative;
        }

        .video-player {
          position: relative;
          width: 100%;
          aspect-ratio: 16/9;
          max-height: 70vh;
        }

        .video-placeholder {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .video-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.3);
        }

        .video-play-btn {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.95);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .video-play-btn:hover {
          transform: scale(1.1);
          background: white;
        }

        .video-controls {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
          padding: 2rem 1.5rem 1rem;
        }

        .progress-timeline {
          width: 100%;
          height: 4px;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 2px;
          cursor: pointer;
          margin-bottom: 1rem;
        }

        .timeline-fill {
          height: 100%;
          background: #6366f1;
          border-radius: 2px;
        }

        .controls-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .controls-left,
        .controls-right {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .video-controls button {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 6px;
          transition: all 0.2s;
        }

        .video-controls button:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .time-display {
          color: white;
          font-size: 0.9rem;
          margin-left: 0.5rem;
        }

        .player-content {
          background: white;
          padding: 2rem;
        }

        .content-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
          gap: 2rem;
        }

        .content-header h1 {
          font-size: 1.75rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
        }

        .content-meta {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #64748b;
          font-size: 0.9rem;
        }

        .content-actions {
          display: flex;
          gap: 1rem;
        }

        .action-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
          background: white;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }

        .action-btn:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
        }

        .tabs {
          display: flex;
          gap: 2rem;
          border-bottom: 2px solid #e2e8f0;
          margin-bottom: 2rem;
        }

        .tab {
          padding: 1rem 0;
          border: none;
          background: none;
          cursor: pointer;
          font-weight: 600;
          color: #64748b;
          border-bottom: 2px solid transparent;
          margin-bottom: -2px;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .tab:hover {
          color: #1a202c;
        }

        .tab.active {
          color: #6366f1;
          border-bottom-color: #6366f1;
        }

        .tab-content {
          padding-bottom: 2rem;
        }

        .overview-tab h3 {
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 1rem;
          margin-top: 2rem;
        }

        .overview-tab h3:first-child {
          margin-top: 0;
        }

        .overview-tab p {
          color: #475569;
          line-height: 1.7;
          margin-bottom: 1rem;
        }

        .learning-points {
          list-style: none;
          display: grid;
          gap: 0.75rem;
        }

        .learning-points li {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: #475569;
        }

        .note-editor {
          background: #f8fafc;
          padding: 1.5rem;
          border-radius: 12px;
          margin-bottom: 2rem;
        }

        .note-editor textarea {
          width: 100%;
          padding: 1rem;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          resize: vertical;
          font-family: inherit;
          margin-bottom: 1rem;
        }

        .note-editor textarea:focus {
          outline: none;
          border-color: #6366f1;
        }

        .notes-list {
          display: grid;
          gap: 1rem;
        }

        .note-card {
          background: #f8fafc;
          padding: 1.5rem;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }

        .note-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .note-lesson {
          font-weight: 600;
          color: #1a202c;
          margin-right: 0.5rem;
        }

        .note-timestamp {
          color: #6366f1;
          font-weight: 600;
          font-size: 0.875rem;
        }

        .note-actions {
          display: flex;
          gap: 0.5rem;
        }

        .note-actions button {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 6px;
          color: #64748b;
          transition: all 0.2s;
        }

        .note-actions button:hover {
          background: #e2e8f0;
          color: #1a202c;
        }

        .note-content {
          color: #475569;
          line-height: 1.6;
          margin-bottom: 0.5rem;
        }

        .note-date {
          font-size: 0.875rem;
          color: #94a3b8;
        }

        .question-form {
          background: #f8fafc;
          padding: 1.5rem;
          border-radius: 12px;
          margin-bottom: 2rem;
        }

        .question-form h3 {
          font-size: 1.125rem;
          font-weight: 700;
          margin-bottom: 1rem;
        }

        .question-form input,
        .question-form textarea {
          width: 100%;
          padding: 1rem;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-family: inherit;
          margin-bottom: 1rem;
        }

        .question-form input:focus,
        .question-form textarea:focus {
          outline: none;
          border-color: #6366f1;
        }

        .qa-list h3 {
          font-size: 1.125rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
        }

        .qa-card {
          background: white;
          padding: 1.5rem;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          margin-bottom: 1rem;
        }

        .qa-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .qa-header img {
          width: 40px;
          height: 40px;
          border-radius: 50%;
        }

        .qa-header h4 {
          font-weight: 600;
          margin-bottom: 0.25rem;
        }

        .qa-meta {
          font-size: 0.875rem;
          color: #64748b;
        }

        .resolved-badge {
          margin-left: auto;
          background: #d1fae5;
          color: #059669;
          padding: 0.375rem 0.75rem;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .qa-question {
          color: #1a202c;
          line-height: 1.6;
          margin-bottom: 1rem;
        }

        .qa-footer {
          display: flex;
          gap: 1rem;
        }

        .qa-action {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          border: none;
          background: #f1f5f9;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 500;
          color: #64748b;
          transition: all 0.2s;
        }

        .qa-action:hover {
          background: #e2e8f0;
          color: #1a202c;
        }

        .resources-list {
          display: grid;
          gap: 1rem;
        }

        .resource-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.5rem;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          transition: all 0.2s;
        }

        .resource-item:hover {
          border-color: #6366f1;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.1);
        }

        .resource-item h4 {
          font-weight: 600;
          margin-bottom: 0.25rem;
        }

        .resource-item span {
          font-size: 0.875rem;
          color: #64748b;
        }

        .curriculum-sidebar {
          width: 400px;
          background: white;
          border-left: 1px solid #e2e8f0;
          overflow-y: auto;
        }

        .sidebar-header {
          padding: 1.5rem;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .sidebar-header h3 {
          font-size: 1.125rem;
          font-weight: 700;
        }

        .sidebar-header span {
          font-size: 0.875rem;
          color: #64748b;
        }

        .curriculum-list {
          padding: 0.5rem 0;
        }

        .curriculum-section {
          border-bottom: 1px solid #e2e8f0;
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.5rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .section-header:hover {
          background: #f8fafc;
        }

        .section-header h4 {
          flex: 1;
          font-size: 0.95rem;
          font-weight: 600;
        }

        .section-header span {
          font-size: 0.8rem;
          color: #64748b;
        }

        .section-lessons {
          display: grid;
        }

        .lesson-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 1.5rem 1rem 3rem;
          cursor: pointer;
          transition: all 0.2s;
          border-left: 3px solid transparent;
        }

        .lesson-item:hover {
          background: #f8fafc;
        }

        .lesson-item.current {
          background: #eef2ff;
          border-left-color: #6366f1;
        }

        .lesson-item.completed .lesson-title {
          color: #10b981;
        }

        .lesson-info {
          flex: 1;
        }

        .lesson-title {
          font-size: 0.9rem;
          font-weight: 500;
          margin-bottom: 0.25rem;
        }

        .lesson-meta {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.75rem;
          color: #64748b;
        }

        .btn-primary,
        .btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          border-radius: 10px;
          border: none;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(99, 102, 241, 0.3);
        }

        .btn-secondary {
          background: white;
          color: #6366f1;
          border: 1px solid #e2e8f0;
        }

        .btn-secondary:hover {
          background: #f8fafc;
          border-color: #6366f1;
        }

        /* My Courses */
        .my-courses {
          max-width: 1400px;
          margin: 0 auto;
        }

        .courses-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .courses-header h1 {
          font-size: 2rem;
          font-weight: 700;
        }

        .courses-filters {
          display: flex;
          gap: 0.75rem;
        }

        .filter-btn,
        .view-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
        }

        .filter-btn:hover,
        .view-btn:hover {
          background: #f1f5f9;
        }

        .view-btn.active {
          background: #6366f1;
          color: white;
          border-color: #6366f1;
        }

        .filter-tags {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 2rem;
          flex-wrap: wrap;
        }

        .tag {
          padding: 0.625rem 1.25rem;
          border-radius: 20px;
          border: 1px solid #e2e8f0;
          background: white;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }

        .tag:hover {
          background: #f1f5f9;
        }

        .tag.active {
          background: #6366f1;
          color: white;
          border-color: #6366f1;
        }

        /* Certificates */
        .certificates {
          max-width: 1200px;
          margin: 0 auto;
        }

        .certificates h1 {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }

        .subtitle {
          color: #64748b;
          font-size: 1.1rem;
          margin-bottom: 2rem;
        }

        .certificates-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 2rem;
        }

        .certificate-card {
          background: white;
          padding: 2rem;
          border-radius: 16px;
          text-align: center;
          border: 2px solid #e2e8f0;
          transition: all 0.3s;
        }

        .certificate-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
          border-color: #6366f1;
        }

        .certificate-badge {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
          color: white;
        }

        .certificate-card h3 {
          font-size: 1.125rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }

        .certificate-card p {
          color: #64748b;
          font-size: 0.875rem;
          margin-bottom: 0.5rem;
        }

        .certificate-instructor {
          font-weight: 600;
          margin-bottom: 1.5rem !important;
        }

        .certificate-actions {
          display: flex;
          gap: 0.75rem;
          justify-content: center;
        }

        .recommended-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem;
        }

        .recommended-card {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid #e2e8f0;
          transition: all 0.3s;
        }

        .recommended-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
        }

        .recommended-thumbnail {
          width: 100%;
          height: 140px;
          overflow: hidden;
        }

        .recommended-thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .recommended-info {
          padding: 1rem;
        }

        .recommended-info h4 {
          font-size: 0.95rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .recommended-info p {
          font-size: 0.85rem;
          color: #64748b;
          margin-bottom: 0.75rem;
        }

        .recommended-meta {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.8rem;
          color: #64748b;
        }

        /* Responsive */
        @media (max-width: 1200px) {
          .curriculum-sidebar {
            width: 350px;
          }
        }

        @media (max-width: 968px) {
          .course-player {
            flex-direction: column;
          }

          .curriculum-sidebar {
            width: 100%;
            max-height: 400px;
          }

          .player-main {
            height: auto;
          }
        }

        @media (max-width: 768px) {
          .navbar-content {
            padding: 1rem;
          }

          .search-bar {
            display: none;
          }

          .main-content {
            padding: 1rem;
          }

          .sidebar.open {
            width: 100%;
          }

          .courses-grid,
          .stats-grid {
            grid-template-columns: 1fr;
          }

          .dashboard-header h1 {
            font-size: 1.5rem;
          }

          .content-header {
            flex-direction: column;
          }

          .content-actions {
            width: 100%;
          }

          .action-btn {
            flex: 1;
            justify-content: center;
          }

          .tabs {
            overflow-x: auto;
            gap: 1rem;
          }

          .tab {
            white-space: nowrap;
          }

          .courses-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
        }

        @media (max-width: 480px) {
          .logo span {
            display: none;
          }

          .stat-card {
            padding: 1.25rem;
          }

          .stat-icon {
            width: 50px;
            height: 50px;
          }

          .course-card {
            margin-bottom: 1rem;
          }
        }
      `}</style>
    </div>
  );
}

export default StudentPortal;
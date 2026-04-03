import { Link } from 'react-router-dom';

const StarRating = ({ rating }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <svg
        key={star}
        className={`w-3.5 h-3.5 ${star <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-600'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
  </div>
);

const levelColors = {
  Beginner: 'bg-green-900/40 text-green-400',
  Intermediate: 'bg-yellow-900/40 text-yellow-400',
  Advanced: 'bg-red-900/40 text-red-400',
};

const CourseCard = ({ course }) => {
  const totalLectures = course.sections?.reduce(
    (sum, s) => sum + (s.lectures?.length || 0), 0
  ) || 0;

  return (
    <Link to={`/courses/${course._id}`} className="card group block">
      {/* Thumbnail */}
      <div className="relative overflow-hidden aspect-video bg-dark-700">
        <img
          src={course.thumbnail}
          alt={course.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            e.target.src = 'https://placehold.co/800x450/1e293b/94a3b8?text=EduFlow';
          }}
        />
        {/* Level badge */}
        <span className={`absolute top-2 left-2 badge text-xs ${levelColors[course.level] || 'bg-gray-800 text-gray-400'}`}>
          {course.level}
        </span>
        {/* Price badge */}
        <div className="absolute top-2 right-2 bg-dark-900/90 text-white text-sm font-bold px-2.5 py-1 rounded-lg">
          {course.price === 0 ? 'Free' : `$${course.price}`}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Category */}
        <p className="text-xs text-brand-500 font-semibold uppercase tracking-wider mb-1.5">
          {course.category}
        </p>

        {/* Title */}
        <h3 className="font-heading font-semibold text-gray-100 text-base leading-snug mb-2 line-clamp-2 group-hover:text-white transition-colors">
          {course.title}
        </h3>

        {/* Instructor */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 rounded-full bg-brand-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {course.instructor?.name?.charAt(0) || 'I'}
          </div>
          <p className="text-xs text-gray-400 truncate">
            {course.instructor?.name || 'Instructor'}
          </p>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1.5 mb-3">
          <span className="text-yellow-400 text-xs font-bold">
            {course.rating?.toFixed(1) || '4.5'}
          </span>
          <StarRating rating={course.rating || 4.5} />
          <span className="text-gray-500 text-xs">
            ({course.numReviews || 0})
          </span>
        </div>

        {/* Meta */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-800">
          <div className="flex items-center gap-1 text-gray-500 text-xs">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span>{totalLectures} lectures</span>
          </div>
          <div className="flex items-center gap-1 text-gray-500 text-xs">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{course.enrolledStudents?.length || 0} students</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default CourseCard;

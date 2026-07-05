// src/pages/ReviewsPage.jsx  (Dedicated Course Reviews Page)
//
// Reached from Shopify.jsx (Course Landing Page) via:
//   • The clickable hero rating ("4.5 ★★★★★ (1,204 ratings)")
//   • The clickable rating shown below the free-lecture preview video
//   • The "Show All Reviews" button
// Route: /course/:id/reviews  (an in-app page — never a modal, never external)
//
// Layout, in exact order:
//   1. Overall Rating      — large number + large stars + total review count
//   2. Rating Distribution — animated 5→1 star progress bars
//   3. User Reviews        — modern cards (avatar, name, rating, date, text),
//                             paginated with a "Load more" control
//
// Reuses normalizeReview / formatNumber / RatingDistribution exported from
// Shopify.jsx so review parsing and the distribution bars are pixel- and
// logic-identical to the landing page (FIX 7 in Shopify.jsx).
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Star } from 'lucide-react';
import { useCourses } from '../context/CoursesContext';
import { useAuth } from '../context/AuthContext';
import { normalizeReview, formatNumber, RatingDistribution } from '../Pages/Shopify';

const PAGE_SIZE = 10;

// ─────────────────────────────────────────────────────────────────────────────
// REVIEW CARD — modern, Udemy-style
// ─────────────────────────────────────────────────────────────────────────────
function ReviewCard({ review }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition border border-[#ece6dd] p-5 flex flex-col gap-3">
      <div className="flex items-start gap-3 md:gap-4">
        <div
          className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-[#e8540a] text-white flex items-center justify-center font-bold text-lg md:text-xl flex-shrink-0 overflow-hidden"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {review.avatar ? (
            <img src={review.avatar} alt={review.author} className="w-full h-full object-cover" />
          ) : (
            review.author.charAt(0).toUpperCase()
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-[#1a1208] text-base md:text-lg leading-tight truncate">{review.author}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={14}
                  className="text-[#f9c97a]"
                  fill={i < Math.round(review.rating) ? 'currentColor' : 'none'}
                />
              ))}
            </div>
            <span className="text-xs font-semibold text-[#1a1208]">{review.rating.toFixed(1)}</span>
            {review.date && (
              <span className="text-xs md:text-sm text-[#9e9789]">• {review.date}</span>
            )}
          </div>
        </div>
      </div>
      {review.text ? (
        <p className="text-[#3d3020] text-sm md:text-base leading-relaxed">{review.text}</p>
      ) : (
        <p className="text-[#b0a898] text-sm italic">No written feedback provided.</p>
      )}
    </div>
  );
}

export default function ReviewsPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { getCourse, fetchCourseById } = useCourses();
  const { API: api } = useAuth();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchedReviews, setFetchedReviews] = useState([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Load the course itself (for title + rating summary fields)
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    const cached = getCourse(id);
    if (cached) setCourse(cached);
    fetchCourseById(id).then((c) => {
      if (c) setCourse(c);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load reviews directly, same endpoint Shopify.jsx falls back to
  useEffect(() => {
    if (!id) return;
    api.get(`/courses/${id}/reviews`)
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : [];
        setFetchedReviews(list);
      })
      .catch(() => setFetchedReviews([]));
  }, [id, api]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  const reviews = useMemo(() => {
    const safeReviewsList = Array.isArray(course?.reviews_list)
      ? course.reviews_list.filter(r => r && typeof r === 'object')
      : [];
    const safeReviewsArr = Array.isArray(course?.reviews)
      ? course.reviews.filter(r => r && typeof r === 'object')
      : [];

    const rawReviews = [...safeReviewsList, ...safeReviewsArr, ...fetchedReviews];

    return rawReviews
      .map((r, idx) => normalizeReview(r, idx))
      .filter(Boolean)
      .filter((r, idx, arr) => arr.findIndex(x => x.key === r.key) === idx);
  }, [course, fetchedReviews]);

  const overallRating = useMemo(() => {
    if (course?.rating) return Number(course.rating);
    if (!reviews.length) return 0;
    return reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  }, [course, reviews]);

  const totalReviewCount = course?.reviews || reviews.length;

  const distribution = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      const rounded = Math.min(5, Math.max(1, Math.round(r.rating)));
      counts[rounded] += 1;
    });
    const total = reviews.length || 1;
    return [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: counts[star],
      percentage: Math.round((counts[star] / total) * 100),
    }));
  }, [reviews]);

  const visibleReviews = reviews.slice(0, visibleCount);
  const hasMore = visibleCount < reviews.length;

  const handleLoadMore = useCallback(() => {
    setVisibleCount((c) => c + PAGE_SIZE);
  }, []);

  const handleBack = useCallback(() => {
    if (id) navigate(`/course/${id}`);
    else navigate(-1);
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFAF6]">
        <div className="w-12 h-12 border-4 border-[#e8540a] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFAF6] w-full" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white shadow-sm w-full border-b border-[#ece6dd]">
        <div className="max-w-5xl mx-auto px-4 lg:px-6 py-3 md:py-4 flex items-center gap-3">
          <button
            onClick={handleBack}
            aria-label="Back to course"
            className="p-2 rounded-full hover:bg-[#f0ebe3] transition border-none bg-transparent cursor-pointer text-[#1a1208]"
          >
            <ArrowLeft size={22} />
          </button>
          <div className="min-w-0">
            <p className="text-xs md:text-sm text-[#9e9789]">Reviews for</p>
            <h1 className="text-base md:text-lg font-bold text-[#1a1208] truncate" style={{ fontFamily: "'Playfair Display', serif" }}>
              {course?.title || 'Course'}
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 lg:px-6 py-8 md:py-12">

        {/* 1. OVERALL RATING */}
        <section className="mb-8 md:mb-10 flex items-center gap-4 md:gap-6">
          <p className="text-5xl md:text-6xl font-bold text-[#1a1208]" style={{ fontFamily: "'Playfair Display', serif" }}>
            {overallRating ? overallRating.toFixed(1) : '—'}
          </p>
          <div>
            <div className="flex gap-1 mb-1.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={24} className="text-[#f9c97a] md:w-7 md:h-7" fill={i < Math.round(overallRating) ? 'currentColor' : 'none'} />
              ))}
            </div>
            <p className="text-sm md:text-base text-[#9e9789]">
              {totalReviewCount > 0 ? `${formatNumber(totalReviewCount)} course ${totalReviewCount === 1 ? 'rating' : 'ratings'}` : 'No ratings yet'}
            </p>
          </div>
        </section>

        {/* 2. RATING DISTRIBUTION */}
        {reviews.length > 0 && (
          <section className="mb-10 md:mb-12 border border-[#ece6dd] rounded-2xl p-5 md:p-8 bg-white">
            <h2 className="text-lg md:text-xl font-bold text-[#1a1208] mb-4 md:mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
              Rating breakdown
            </h2>
            <RatingDistribution distribution={distribution} />
          </section>
        )}

        {/* 3. USER REVIEWS */}
        <section>
          <h2 className="text-xl md:text-2xl font-bold text-[#1a1208] mb-5 md:mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
            {reviews.length > 0 ? `${formatNumber(reviews.length)} Reviews` : 'Reviews'}
          </h2>

          {reviews.length === 0 ? (
            <div className="border border-dashed border-[#ddd5c4] rounded-2xl p-8 text-center bg-white">
              <p className="text-[#9e9789] text-sm md:text-base">No reviews yet for this course.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                {visibleReviews.map((review) => (
                  <ReviewCard key={review.key} review={review} />
                ))}
              </div>

              {hasMore && (
                <div className="mt-8 flex justify-center">
                  <button
                    onClick={handleLoadMore}
                    className="px-6 md:px-8 py-3 rounded-xl border-2 border-[#e8540a] text-[#e8540a] font-bold text-sm md:text-base bg-white hover:bg-[#fdf2ea] transition cursor-pointer"
                  >
                    Show more reviews
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}
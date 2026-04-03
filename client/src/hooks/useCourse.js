```js
import { useState, useEffect } from "react";
import { fetchCourse, fetchReviews, fetchSimilar } from "../api/courseApi";

export function useCourse(courseId) {
  const [course, setCourse] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!courseId) return;
    setLoading(true);

    Promise.all([
      fetchCourse(courseId),
      fetchReviews(courseId),
      fetchSimilar(courseId),
    ])
      .then(([courseRes, reviewsRes, similarRes]) => {
        setCourse(courseRes.data);
        setReviews(reviewsRes.data);
        setSimilar(similarRes.data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [courseId]);

  return { course, reviews, similar, loading, error };
}
```


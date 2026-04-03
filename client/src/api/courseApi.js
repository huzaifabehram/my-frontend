
import axios from "axios";

const API = axios.create({ baseURL: "http://localhost:5000/api" });

// Attach JWT token automatically
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

export const fetchCourse = (id) => API.get(`/courses/${id}`);
export const fetchReviews = (id) => API.get(`/courses/${id}/reviews`);
export const fetchSimilar = (id) => API.get(`/courses/${id}/similar`);
export const submitReview = (id, data) => API.post(`/courses/${id}/reviews`, data);
export const enrollCourse = (id) => API.post(`/courses/${id}/enroll`);
export const createCheckout = (data) => API.post("/payments/checkout", data);


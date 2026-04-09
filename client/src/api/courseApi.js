// src/api/courseApi.js
import axios from "axios";

// Use your deployed backend URL
const API = axios.create({ baseURL: "https://my-course-backend-8u69.onrender.com/api" });

// Attach JWT token automatically
API.interceptors.request.use((req) => {
const token = localStorage.getItem("token");
if (token) req.headers.Authorization = `Bearer ${token}`;
return req;
});

// Course API calls
export const fetchCourse = (id) => API.get(`/courses/${id}`);
export const fetchReviews = (id) => API.get(`/courses/${id}/reviews`);
export const fetchSimilar = (id) => API.get(`/courses/${id}/similar`);
export const submitReview = (id, data) => API.post(`/courses/${id}/reviews`, data);
export const enrollCourse = (id) => API.post(`/courses/${id}/enroll`);
export const createCheckout = (data) => API.post("/payments/checkout", data);

export default API;
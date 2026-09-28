// src/api/courseApi.js
import axios from "axios";
import { API_BASE_URL } from "../config/apiBase";

const API = axios.create({ baseURL: API_BASE_URL });

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

// FIX: this used to be `(id) => API.post(`/enrollments/${id}`)` — it accepted
// ONLY the course id and silently threw away everything else. The enrollment
// page calls enrollCourse(courseId, { whatsapp, paymentMethod,
// paymentScreenshotUrl, bundleId, … }), so none of that ever reached the
// server: enrollments were saved with no WhatsApp number, no payment method,
// no payment screenshot, and a bundle enrollment could never be charged the
// bundle's price. The second argument is now sent as the request body. Callers
// that pass only an id still work exactly as before (empty body).
export const enrollCourse = (id, data = {}) => API.post(`/enrollments/${id}`, data);

export const createCheckout = (data) => API.post("/payments/checkout", data);

export default API;
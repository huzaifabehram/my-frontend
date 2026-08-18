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
export const enrollCourse = (id) => API.post(`/enrollments/${id}`);
export const createCheckout = (data) => API.post("/payments/checkout", data);

export default API;
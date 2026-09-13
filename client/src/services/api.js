import axios from "axios";
import { API_BASE_URL } from "../config/apiBase";

const API = axios.create({
  baseURL: API_BASE_URL,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ADDED — this was the missing export causing the build to fail
// ("'getAllCourses' is not exported from '../services/api'"). Returns the
// raw axios response (not pre-unwrapped .data), matching how every other
// API call in this codebase is used — the caller reads res.data itself,
// e.g. api.get("/theme/access").then((r) => r.data...) in
// InstructorDashboard.jsx, or api.get(`/courses/${id}/reviews`) in
// Shopify.jsx.
//
// Endpoint assumed to be GET /courses, matching every other course-related
// route seen elsewhere in this codebase (/courses/:id, /courses/:id/reviews,
// /course/:id/enroll). If the file that imports this expects something
// different — a different path, or courses already unwrapped from .data —
// paste that file and I'll match it exactly.
export function getAllCourses(params) {
  return API.get("/courses", { params });
}

export default API;
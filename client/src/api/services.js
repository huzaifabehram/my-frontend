// client/src/api/services.js
// ─── All API call functions used across the app ───────────────────────────────

import api from "./axios";

// ════════════════════════════════════════════════════════════════
// AUTH
// ════════════════════════════════════════════════════════════════

export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  getMe: () => api.get("/auth/me"),
};

// ════════════════════════════════════════════════════════════════
// COURSES
// ════════════════════════════════════════════════════════════════

export const courseAPI = {
  // Public
  getAll: () => api.get("/courses"),
  getById: (id) => api.get(`/courses/${id}`),

  // Instructor only
  getInstructorCourses: () => api.get("/courses/instructor/my-courses"),
  create: (data) => api.post("/courses", data),
  update: (id, data) => api.put(`/courses/${id}`, data),
  delete: (id) => api.delete(`/courses/${id}`),
};

// ════════════════════════════════════════════════════════════════
// ENROLLMENT (Student only)
// ════════════════════════════════════════════════════════════════

export const enrollAPI = {
  enroll: (courseId) => api.post("/enroll", { courseId }),
  getMyCourses: () => api.get("/my-courses"),
};

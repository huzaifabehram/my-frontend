/**
 * Resolves the backend API base URL for axios instances.
 * CRA injects REACT_APP_* variables at build time (Vercel Production must set them too).
 *
 * Accepts either:
 *   REACT_APP_API_URL=https://api.motiviam.com
 *   REACT_APP_API_URL=https://api.motiviam.com/api
 */
const DEFAULT_API_ORIGIN = "https://api.motiviam.com";

export function getApiBaseUrl() {
  const raw = (process.env.REACT_APP_API_URL || DEFAULT_API_ORIGIN).replace(/\/$/, "");
  return raw.endsWith("/api") ? raw : `${raw}/api`;
}

export const API_BASE_URL = getApiBaseUrl();

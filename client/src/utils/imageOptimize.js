// src/utils/imageOptimize.js
// ─────────────────────────────────────────────────────────────────────────────
// Cloudinary can hand back a small, modern-format copy of any image just by
// adding a transformation to its URL. Course thumbnails, testimonial photos and
// gallery images were being downloaded at whatever size they were uploaded
// (often several MB) even when they're shown in a card a few hundred pixels
// wide — the biggest single reason the pages felt heavy on a phone connection.
//
//   f_auto  → WebP/AVIF automatically where the browser supports it
//   q_auto  → sensible quality picked per image
//   w_N     → never wider than N px, and c_limit → never upscaled
//
// Anything that isn't a Cloudinary "image/upload" URL (YouTube thumbnails, other
// hosts, data: URLs, emoji…) is returned untouched.
// ─────────────────────────────────────────────────────────────────────────────
export function optimizeImage(url, width) {
  if (!url || typeof url !== 'string') return url;
  if (!url.includes('res.cloudinary.com')) return url;
  const marker = '/image/upload/';
  const at = url.indexOf(marker);
  if (at === -1) return url;
  const insertAt = at + marker.length;
  const rest = url.slice(insertAt);
  if (rest.startsWith('f_auto') || rest.startsWith('q_auto')) return url; // already optimised
  const transform = `f_auto,q_auto${width ? `,w_${width},c_limit` : ''}`;
  return `${url.slice(0, insertAt)}${transform}/${rest}`;
} 
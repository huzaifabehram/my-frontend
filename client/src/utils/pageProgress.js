// src/utils/pageProgress.js
// ─────────────────────────────────────────────────────────────────────────────
// One shared "something is loading" signal for the whole app, drawn as the thin
// orange line across the very top of the screen (<GlobalProgressBar /> in
// App.jsx). Anything that is waiting on the network calls beginProgress() and
// gets back a function to call when it's done; the line runs for as long as at
// least one thing is still waiting. Route changes, lazy-loaded pages and the
// first load of a course page all use it, so there is a single bar instead of
// several stacked on top of each other.
// ─────────────────────────────────────────────────────────────────────────────
let pending = 0;
const listeners = new Set();
const emit = () => listeners.forEach((l) => l());

export function beginProgress() {
  pending += 1;
  emit();
  let ended = false;
  // Safe to call more than once (React StrictMode / cleanup + timeout both).
  return () => {
    if (ended) return;
    ended = true;
    pending = Math.max(0, pending - 1);
    emit();
  };
}

export function subscribeProgress(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function isProgressActive() {
  return pending > 0;
} 
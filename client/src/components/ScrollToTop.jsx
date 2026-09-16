// src/components/ScrollToTop.jsx
// ─────────────────────────────────────────────────────────────────────────────
// React Router doesn't reset scroll position on navigation by default — if a
// page was scrolled halfway down (e.g. from the footer's About/Privacy/
// Return/Contact links) and the person clicks a link, the next page renders
// starting from that same scroll offset instead of the top. This component
// fixes that sitewide: mount it once inside <BrowserRouter>, above the
// routes, and every path change scrolls the window back to (0, 0).
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
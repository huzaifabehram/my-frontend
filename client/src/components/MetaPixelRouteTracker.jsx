import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { initMetaPixel, trackPageView } from "../utils/facebookPixel";

/**
 * Fires fbq('track', 'PageView') on initial load and every React Router navigation.
 * Mount once inside <BrowserRouter>.
 */
export default function MetaPixelRouteTracker() {
  const location = useLocation();
  const lastPath = useRef("");

  useEffect(() => {
    initMetaPixel();

    const path = `${location.pathname}${location.search}`;
    if (path === lastPath.current) return;
    lastPath.current = path;

    trackPageView();
  }, [location.pathname, location.search]);

  return null;
}

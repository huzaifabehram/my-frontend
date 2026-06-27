import React, { useEffect, useRef, useCallback } from "react";
import {
  resetFreeLectureSession,
  trackFreeLectureStarted,
  processFreeLectureProgress,
} from "../utils/facebookPixel";

/**
 * Wraps a native <video> element with Meta Pixel free-lecture milestone tracking.
 * Fires each percentage event only once per viewing session (rewind-safe).
 *
 * YouTube / Bunny iframe players cannot expose currentTime — use
 * FreeLectureIframeTracker for those (started event only).
 */
export default function FreeLectureVideoTracker({
  course,
  lecture,
  src,
  className = "",
  autoPlay = false,
  muted = false,
  controls = true,
  onRef,
}) {
  const videoRef = useRef(null);
  const startedRef = useRef(false);

  const courseId  = String(course?._id || course?.id || "");
  const lectureId = String(lecture?.id || lecture?._id || "");

  useEffect(() => {
    if (!courseId || !lectureId) return;
    resetFreeLectureSession(courseId, lectureId);
    startedRef.current = false;
  }, [courseId, lectureId, src]);

  const handlePlay = useCallback(() => {
    if (!course || !lecture || startedRef.current) return;
    startedRef.current = true;
    trackFreeLectureStarted(course, lecture);
  }, [course, lecture]);

  const handleTimeUpdate = useCallback(
    (e) => {
      if (!course || !lecture) return;
      processFreeLectureProgress(e.target, course, lecture);
    },
    [course, lecture]
  );

  const setRef = useCallback(
    (el) => {
      videoRef.current = el;
      if (onRef) onRef(el);
    },
    [onRef]
  );

  if (!src) return null;

  return (
    <video
      ref={setRef}
      src={src}
      className={className}
      controls={controls}
      autoPlay={autoPlay}
      muted={muted}
      playsInline
      preload="metadata"
      onPlay={handlePlay}
      onTimeUpdate={handleTimeUpdate}
    />
  );
}

/**
 * For iframe-based players (YouTube, Bunny): fires FreeLectureStarted once
 * when the preview opens. Percentage milestones require native <video>.
 */
export function FreeLectureIframeTracker({ course, lecture, children }) {
  const firedRef = useRef(false);
  const courseId  = String(course?._id || course?.id || "");
  const lectureId = String(lecture?.id || lecture?._id || "");

  useEffect(() => {
    firedRef.current = false;
    if (courseId && lectureId) resetFreeLectureSession(courseId, lectureId);
  }, [courseId, lectureId]);

  useEffect(() => {
    if (!course || !lecture || firedRef.current) return;
    firedRef.current = true;
    trackFreeLectureStarted(course, lecture);
  }, [course, lecture, courseId, lectureId]);

  return children;
}

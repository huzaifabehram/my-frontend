const getYouTubeId = (url) => {
  if (!url) return null;
  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtu\.be\/([^?]+)/,
    /youtube\.com\/embed\/([^?]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

const isDirectVideo = (url) => {
  if (!url) return false;
  return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url);
};

const VideoPlayer = ({ url, title }) => {
  if (!url) {
    return (
      <div className="video-wrapper bg-dark-800 flex items-center justify-center">
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-gray-500">
          <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <p className="text-sm">Select a lecture to start watching</p>
        </div>
      </div>
    );
  }

  const ytId = getYouTubeId(url);

  if (ytId) {
    return (
      <div className="video-wrapper bg-black">
        <iframe
          src={`https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1&autoplay=0`}
          title={title || 'Lecture Video'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  if (isDirectVideo(url)) {
    return (
      <div className="video-wrapper bg-black">
        <video
          className="absolute inset-0 w-full h-full"
          controls
          src={url}
          title={title}
        >
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }

  // Fallback: try as an iframe (Vimeo, etc.)
  return (
    <div className="video-wrapper bg-black">
      <iframe
        src={url}
        title={title || 'Lecture Video'}
        allow="autoplay; fullscreen"
        allowFullScreen
      />
    </div>
  );
};

export default VideoPlayer;

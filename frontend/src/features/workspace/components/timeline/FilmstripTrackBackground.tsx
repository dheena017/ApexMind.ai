import React, { useEffect, useState } from 'react';
import { Film } from 'lucide-react';

export interface FilmstripTrackBackgroundProps {
  imageUrl?: string;
  posterUrl?: string;
  videoUrl?: string;
  count?: number;
}

// Global cache for video snapshots to prevent repeated decoding
const videoThumbnailCache = new Map<string, string>();

function isDirectVideo(url?: string): boolean {
  if (!url) return false;
  const clean = url.split('?')[0].toLowerCase();
  return (
    clean.endsWith('.mp4') ||
    clean.endsWith('.webm') ||
    clean.endsWith('.ogg') ||
    clean.endsWith('.mov') ||
    clean.endsWith('.m4v') ||
    url.includes('.webm') ||
    url.includes('.mp4') ||
    url.includes('commons.wikimedia.org') ||
    url.includes('sample/') ||
    url.includes('/videos/')
  );
}

function useVideoThumbnail(videoUrl?: string, posterUrl?: string): string | undefined {
  const [thumb, setThumb] = useState<string | undefined>(() => {
    if (posterUrl) return posterUrl;
    if (videoUrl && videoThumbnailCache.has(videoUrl)) return videoThumbnailCache.get(videoUrl);
    return undefined;
  });

  useEffect(() => {
    if (posterUrl) {
      setThumb(posterUrl);
      return;
    }
    if (!videoUrl || !isDirectVideo(videoUrl)) return;
    if (videoThumbnailCache.has(videoUrl)) {
      setThumb(videoThumbnailCache.get(videoUrl));
      return;
    }

    let isMounted = true;
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.preload = 'auto';
    video.playsInline = true;

    const capture = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = Math.min(video.videoWidth || 320, 320);
        canvas.height = Math.min(video.videoHeight || 180, 180);
        const ctx = canvas.getContext('2d');
        if (ctx && canvas.width > 0 && canvas.height > 0) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          videoThumbnailCache.set(videoUrl, dataUrl);
          if (isMounted) setThumb(dataUrl);
        }
      } catch {
        // Tainted canvas on cross-origin video without CORS header; fallback handled
      }
    };

    video.onloadeddata = () => {
      try {
        video.currentTime = Math.min(0.2, (video.duration || 1) / 4);
      } catch {
        capture();
      }
    };
    video.onseeked = () => {
      capture();
      video.src = '';
    };
    video.onerror = () => {
      // Ignore silent error
    };

    video.src = videoUrl;
    video.load();

    return () => {
      isMounted = false;
      video.onloadeddata = null;
      video.onseeked = null;
      video.onerror = null;
      video.src = '';
    };
  }, [videoUrl, posterUrl]);

  return thumb;
}

/**
 * Ultra-performant Filmstrip background for video timeline clips.
 * Displays repeating filmstrip frames just like the Image track, showing
 * thumbnails / video frames side-by-side with 35mm sprocket accents.
 */
export const FilmstripTrackBackground: React.FC<FilmstripTrackBackgroundProps> = ({
  imageUrl,
  posterUrl,
  videoUrl,
  count = 8,
}) => {
  // Resolve image source vs direct video URL
  const initialImage = posterUrl || (!isDirectVideo(imageUrl) ? imageUrl : undefined);
  const targetVideoUrl = videoUrl || (isDirectVideo(imageUrl) ? imageUrl : undefined);

  // Extract / cache thumbnail if direct video provided
  const extractedThumb = useVideoThumbnail(targetVideoUrl, initialImage);
  const resolvedFrameSource = extractedThumb || initialImage;

  return (
    <div className="absolute inset-0 flex items-center overflow-hidden pointer-events-none select-none">
      <div className="flex w-full h-full">
        {Array.from({ length: Math.min(count, 12) }).map((_, i) => (
          <div
            key={i}
            className="flex-1 h-full border-r border-black/40 relative overflow-hidden shrink-0 min-w-[50px] bg-black/90"
          >
            {resolvedFrameSource ? (
              <img
                src={resolvedFrameSource}
                alt="video clip frame"
                crossOrigin="anonymous"
                loading="lazy"
                className="w-full h-full object-cover filter brightness-95 saturate-105 pointer-events-none"
              />
            ) : targetVideoUrl ? (
              <video
                src={targetVideoUrl}
                muted
                playsInline
                autoPlay={false}
                preload="metadata"
                className="w-full h-full object-cover filter brightness-95 saturate-105 pointer-events-none"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-950/30 to-black/80">
                <Film className="w-3.5 h-3.5 text-amber-400/40" />
              </div>
            )}

            {/* Clean Frame Edge Highlight & Vignette */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/35 pointer-events-none" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default FilmstripTrackBackground;

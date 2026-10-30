import React, { useEffect, useState } from 'react';
import { Film } from 'lucide-react';

export interface FilmstripTrackBackgroundProps {
  imageUrl?: string;
  posterUrl?: string;
  videoUrl?: string;
  count?: number;
}

// Global cache for multi-frame video snapshots across timeline
const multiFrameCache = new Map<string, string[]>();

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

function useMultiFrameVideoThumbnails(videoUrl?: string, fallbackUrl?: string): string[] {
  const [frames, setFrames] = useState<string[]>(() => {
    if (videoUrl && multiFrameCache.has(videoUrl)) {
      return multiFrameCache.get(videoUrl)!;
    }
    if (fallbackUrl) return [fallbackUrl];
    return [];
  });

  useEffect(() => {
    if (!videoUrl || !isDirectVideo(videoUrl)) {
      if (fallbackUrl) setFrames([fallbackUrl]);
      return;
    }

    if (multiFrameCache.has(videoUrl)) {
      setFrames(multiFrameCache.get(videoUrl)!);
      return;
    }

    let isMounted = true;
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.preload = 'auto';
    video.playsInline = true;

    const seekPoints = [0.05, 0.22, 0.42, 0.62, 0.82, 0.95];
    let currentIndex = 0;
    const captured: string[] = [];

    const captureCurrent = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = Math.min(video.videoWidth || 240, 240);
        canvas.height = Math.min(video.videoHeight || 135, 135);
        const ctx = canvas.getContext('2d');
        if (ctx && canvas.width > 0 && canvas.height > 0) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          captured.push(canvas.toDataURL('image/jpeg', 0.75));
        }
      } catch {
        // Fallback for tainted canvas
      }
    };

    video.onloadedmetadata = () => {
      const dur = video.duration || 1;
      video.currentTime = Math.min(dur * seekPoints[0], dur - 0.05);
    };

    video.onseeked = () => {
      captureCurrent();
      currentIndex++;
      if (currentIndex < seekPoints.length && isMounted) {
        const dur = video.duration || 1;
        video.currentTime = Math.min(dur * seekPoints[currentIndex], dur - 0.05);
      } else {
        if (captured.length > 0) {
          multiFrameCache.set(videoUrl, captured);
          if (isMounted) setFrames(captured);
        } else if (fallbackUrl && isMounted) {
          setFrames([fallbackUrl]);
        }
        video.src = '';
      }
    };

    video.onerror = () => {
      if (fallbackUrl && isMounted) setFrames([fallbackUrl]);
    };

    video.src = videoUrl;
    video.load();

    return () => {
      isMounted = false;
      video.onloadedmetadata = null;
      video.onseeked = null;
      video.onerror = null;
      video.src = '';
    };
  }, [videoUrl, fallbackUrl]);

  return frames;
}

/**
 * High-definition frame-by-frame filmstrip background for timeline video clips.
 * Displays consecutive video frames with professional filmstrip frame dividers.
 */
export const FilmstripTrackBackground: React.FC<FilmstripTrackBackgroundProps> = ({
  imageUrl,
  posterUrl,
  videoUrl,
  count = 10,
}) => {
  const initialImage = posterUrl || (!isDirectVideo(imageUrl) ? imageUrl : undefined);
  const targetVideoUrl = videoUrl || (isDirectVideo(imageUrl) ? imageUrl : undefined);

  const frames = useMultiFrameVideoThumbnails(targetVideoUrl, initialImage);
  const hasFrames = frames.length > 0;
  const singleFallback = initialImage || (hasFrames ? frames[0] : undefined);

  return (
    <div className="absolute inset-0 flex items-center overflow-hidden pointer-events-none select-none">
      <div className="flex w-full h-full">
        {Array.from({ length: Math.min(count, 14) }).map((_, i) => {
          const frameSrc = hasFrames ? frames[i % frames.length] : singleFallback;

          return (
            <div
              key={i}
              className="flex-1 h-full border-r border-black/75 relative overflow-hidden shrink-0 min-w-[42px] bg-black/90"
            >
              {frameSrc ? (
                <img
                  src={frameSrc}
                  alt={`video frame ${i + 1}`}
                  crossOrigin="anonymous"
                  loading="lazy"
                  className="w-full h-full object-cover filter brightness-95 saturate-105 pointer-events-none select-none"
                />
              ) : targetVideoUrl ? (
                <video
                  src={targetVideoUrl}
                  muted
                  playsInline
                  autoPlay={false}
                  preload="metadata"
                  className="w-full h-full object-cover filter brightness-90 saturate-105 pointer-events-none select-none"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-950/40 to-black/90">
                  <Film className="w-3.5 h-3.5 text-amber-400/40" />
                </div>
              )}

              {/* Filmstrip Frame Border & Cinematic Edge Highlight */}
              <div className="absolute inset-0 shadow-[inset_0_0_4px_rgba(0,0,0,0.6)] pointer-events-none" />
              <div className="absolute inset-x-0 top-0 h-0.5 bg-black/30 pointer-events-none" />
              <div className="absolute inset-x-0 bottom-0 h-0.5 bg-black/30 pointer-events-none" />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FilmstripTrackBackground;

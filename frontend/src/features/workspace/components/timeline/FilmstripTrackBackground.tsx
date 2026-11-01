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
const failedUrlCache = new Set<string>();

function isDirectVideo(url?: string): boolean {
  if (!url || typeof url !== 'string') return false;
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

function isCleanImage(url?: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed || failedUrlCache.has(trimmed)) return false;
  if (isDirectVideo(trimmed)) return false;
  return (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('./')
  );
}

function useMultiFrameVideoThumbnails(videoUrl?: string, fallbackUrl?: string): string[] {
  const safeFallback = isCleanImage(fallbackUrl) ? fallbackUrl : undefined;

  const [frames, setFrames] = useState<string[]>(() => {
    if (videoUrl && multiFrameCache.has(videoUrl)) {
      return multiFrameCache.get(videoUrl)!;
    }
    if (safeFallback) return [safeFallback];
    return [];
  });

  useEffect(() => {
    if (!videoUrl || !isDirectVideo(videoUrl)) {
      if (safeFallback) setFrames([safeFallback]);
      return;
    }

    if (multiFrameCache.has(videoUrl)) {
      setFrames(multiFrameCache.get(videoUrl)!);
      return;
    }

    let isMounted = true;
    const video = document.createElement('video');
    video.muted = true;
    video.preload = 'auto';
    video.playsInline = true;

    // Only set crossOrigin if trying to extract canvas data, with error tolerance
    try {
      video.crossOrigin = 'anonymous';
    } catch {
      // Ignored
    }

    const seekPoints = [0.05, 0.22, 0.42, 0.62, 0.82, 0.95];
    let currentIndex = 0;
    const captured: string[] = [];

    const captureCurrent = () => {
      try {
        if (!video.videoWidth || !video.videoHeight) return;
        const canvas = document.createElement('canvas');
        canvas.width = Math.min(video.videoWidth, 240);
        canvas.height = Math.min(video.videoHeight, 135);
        const ctx = canvas.getContext('2d');
        if (ctx && canvas.width > 0 && canvas.height > 0) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
          if (dataUrl && dataUrl.startsWith('data:image/')) {
            captured.push(dataUrl);
          }
        }
      } catch {
        // Fallback for tainted canvas (CORS protected video)
      }
    };

    video.onloadedmetadata = () => {
      const dur = video.duration || 1;
      video.currentTime = Math.min(dur * seekPoints[0], Math.max(0.01, dur - 0.05));
    };

    video.onseeked = () => {
      captureCurrent();
      currentIndex++;
      if (currentIndex < seekPoints.length && isMounted) {
        const dur = video.duration || 1;
        video.currentTime = Math.min(dur * seekPoints[currentIndex], Math.max(0.01, dur - 0.05));
      } else {
        if (captured.length > 0) {
          multiFrameCache.set(videoUrl, captured);
          if (isMounted) setFrames(captured);
        } else if (safeFallback && isMounted) {
          setFrames([safeFallback]);
        }
        video.src = '';
      }
    };

    let triedWithoutCors = false;
    video.onerror = () => {
      if (!triedWithoutCors) {
        triedWithoutCors = true;
        try {
          video.removeAttribute('crossorigin');
          video.src = videoUrl;
          video.load();
          return;
        } catch {
          // Ignore
        }
      }
      if (safeFallback && isMounted) setFrames([safeFallback]);
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
  }, [videoUrl, safeFallback]);

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
  const [failedIndices, setFailedIndices] = useState<Record<number, boolean>>({});

  const cleanPoster = isCleanImage(posterUrl) ? posterUrl : undefined;
  const cleanImage = isCleanImage(imageUrl) ? imageUrl : undefined;
  const initialImage = cleanPoster || cleanImage;
  const targetVideoUrl = videoUrl || (isDirectVideo(imageUrl) ? imageUrl : undefined);

  const frames = useMultiFrameVideoThumbnails(targetVideoUrl, initialImage);
  const hasFrames = frames.length > 0;
  const singleFallback = initialImage || (hasFrames ? frames[0] : undefined);

  return (
    <div className="absolute inset-0 flex items-center overflow-hidden pointer-events-none select-none">
      <div className="flex w-full h-full">
        {Array.from({ length: Math.min(count, 14) }).map((_, i) => {
          const rawFrameSrc = hasFrames ? frames[i % frames.length] : singleFallback;
          const isUsableImage = isCleanImage(rawFrameSrc) && !failedIndices[i];

          return (
            <div
              key={i}
              className="flex-1 h-full border-r border-black/75 relative overflow-hidden shrink-0 min-w-[42px] bg-black/90"
            >
              {isUsableImage ? (
                <img
                  src={rawFrameSrc}
                  alt=""
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    if (rawFrameSrc) failedUrlCache.add(rawFrameSrc);
                    setFailedIndices((prev) => ({ ...prev, [i]: true }));
                  }}
                  className="w-full h-full object-cover filter brightness-95 saturate-105 pointer-events-none select-none"
                />
              ) : targetVideoUrl ? (
                <video
                  src={targetVideoUrl}
                  muted
                  playsInline
                  autoPlay={false}
                  preload="auto"
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

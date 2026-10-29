import React, { useState } from 'react';
import { Film } from 'lucide-react';

export interface FilmstripTrackBackgroundProps {
  imageUrl?: string;
  posterUrl?: string;
  count?: number;
}

/**
 * Ultra-performant Filmstrip background for timeline clips.
 * Uses lightweight image thumbnails and CSS sprocket perforations to avoid
 * spawning 100+ concurrent HTML5 video decoders that crash browser memory and choke the network.
 */
export const FilmstripTrackBackground: React.FC<FilmstripTrackBackgroundProps> = ({
  imageUrl,
  posterUrl,
  count = 6,
}) => {
  const [loadError, setLoadError] = useState(false);

  // Preferred source: poster/thumbnail image (zero video decoders consumed)
  const imageSource = posterUrl || (!isDirectVideo(imageUrl) ? imageUrl : undefined);
  const videoSource = !imageSource && isDirectVideo(imageUrl) ? imageUrl : undefined;

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

  if (loadError || (!imageSource && !videoSource)) {
    return (
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none select-none bg-gradient-to-r from-zinc-900/90 via-[#18181B] to-zinc-900/90 border-r border-black/30">
        <Film className="w-3.5 h-3.5 text-zinc-600/70 shrink-0" />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex items-center overflow-hidden pointer-events-none select-none">
      {/* ── Case 1: Image / Poster Thumbnail (Instant 0-overhead rendering) ── */}
      {imageSource ? (
        <div className="flex w-full h-full">
          {Array.from({ length: Math.min(count, 8) }).map((_, i) => (
            <div
              key={i}
              className="flex-1 h-full border-r border-black/40 relative overflow-hidden shrink-0 min-w-[42px] bg-black/90"
            >
              <img
                src={imageSource}
                alt="clip frame"
                crossOrigin="anonymous"
                loading="lazy"
                onError={() => setLoadError(true)}
                className="w-full h-full object-cover filter brightness-95 saturate-105 pointer-events-none"
              />
              {/* 35mm Film Sprocket Hole Accents (Top & Bottom) */}
              <div className="absolute top-0.5 left-1 w-1.5 h-1 bg-black/70 rounded-xs border border-white/10 pointer-events-none" />
              <div className="absolute bottom-0.5 left-1 w-1.5 h-1 bg-black/70 rounded-xs border border-white/10 pointer-events-none" />
            </div>
          ))}
        </div>
      ) : (
        /* ── Case 2: Direct Video URL (Single Passive Metadata Frame - ZERO autoPlay loops) ── */
        <div className="relative w-full h-full overflow-hidden bg-black/90">
          <video
            src={videoSource}
            muted
            playsInline
            autoPlay={false}
            preload="auto"
            onLoadedMetadata={(e) => {
              try {
                (e.target as HTMLVideoElement).currentTime = 0.05;
              } catch {}
            }}
            onError={() => setLoadError(true)}
            className="w-full h-full object-cover filter brightness-95 saturate-105 pointer-events-none"
          />
          {/* Repeating Sprocket Divider Pattern Overlay */}
          <div
            className="absolute inset-0 pointer-events-none opacity-40"
            style={{
              backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 48px, rgba(0,0,0,0.85) 48px, rgba(0,0,0,0.85) 50px)',
            }}
          />
          <div className="absolute top-0.5 left-1 w-1.5 h-1 bg-black/70 rounded-xs border border-white/10 pointer-events-none" />
          <div className="absolute bottom-0.5 left-1 w-1.5 h-1 bg-black/70 rounded-xs border border-white/10 pointer-events-none" />
        </div>
      )}
    </div>
  );
};

export default FilmstripTrackBackground;

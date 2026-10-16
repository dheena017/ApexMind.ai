import React from 'react';
import { Film } from 'lucide-react';

export interface FilmstripTrackBackgroundProps {
  imageUrl?: string;
  count?: number;
}

/**
 * Filmstrip background showing real video frame thumbnails and 35mm film sprockets
 */
export const FilmstripTrackBackground: React.FC<FilmstripTrackBackgroundProps> = ({
  imageUrl,
  count = 10,
}) => {
  const cleanUrl = (imageUrl || '').split('?')[0].toLowerCase();
  const isVideo = Boolean(
    imageUrl && (
      cleanUrl.endsWith('.mp4') ||
      cleanUrl.endsWith('.webm') ||
      cleanUrl.endsWith('.ogg') ||
      cleanUrl.endsWith('.mov') ||
      cleanUrl.endsWith('.m4v') ||
      imageUrl.includes('.webm') ||
      imageUrl.includes('.mp4') ||
      imageUrl.includes('commons.wikimedia.org') ||
      imageUrl.includes('sample/') ||
      imageUrl.includes('video')
    )
  );

  return (
    <div className="absolute inset-0 flex items-center overflow-hidden pointer-events-none opacity-75 group-hover:opacity-95 transition-opacity select-none">
      {/* Top 35mm Film Sprocket Perforations */}
      <div className="absolute top-0.5 inset-x-0 flex justify-between px-1 z-10">
        {Array.from({ length: 36 }).map((_, i) => (
          <div key={i} className="w-1.5 h-1 bg-black/90 rounded-xs border border-amber-500/40 shadow-xs" />
        ))}
      </div>

      {/* Repeating Film Thumbnails */}
      <div className="flex w-full h-full">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="flex-1 h-full border-r border-amber-500/20 relative overflow-hidden shrink-0 min-w-[55px] bg-black/80"
          >
            {imageUrl ? (
              isVideo ? (
                <video
                  src={imageUrl}
                  muted
                  playsInline
                  autoPlay
                  loop
                  preload="metadata"
                  crossOrigin="anonymous"
                  className="w-full h-full object-cover filter brightness-95 saturate-115 pointer-events-none"
                />
              ) : (
                <img
                  src={imageUrl}
                  alt="film frame"
                  crossOrigin="anonymous"
                  className="w-full h-full object-cover filter brightness-95 saturate-115"
                />
              )
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-950/50 to-black/80">
                <Film className="w-3.5 h-3.5 text-amber-500/50" />
              </div>
            )}
            <span className="absolute bottom-1 right-1 text-[7px] font-mono-studio text-amber-200/90 bg-black/85 px-1 py-0.2 rounded font-semibold border border-amber-500/30">
              00:0{i % 10}
            </span>
          </div>
        ))}
      </div>

      {/* Bottom Film Sprocket Perforations */}
      <div className="absolute bottom-0.5 inset-x-0 flex justify-between px-1 z-10">
        {Array.from({ length: 36 }).map((_, i) => (
          <div key={i} className="w-1.5 h-1 bg-black/90 rounded-xs border border-amber-500/40 shadow-xs" />
        ))}
      </div>
    </div>
  );
};

export default FilmstripTrackBackground;

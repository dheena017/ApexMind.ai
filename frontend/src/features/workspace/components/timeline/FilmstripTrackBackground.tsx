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
  return (
    <div className="absolute inset-0 flex items-center overflow-hidden pointer-events-none opacity-40 select-none">
      {/* Top 35mm Film Sprocket Perforations */}
      <div className="absolute top-0.5 inset-x-0 flex justify-between px-1 z-10">
        {Array.from({ length: 36 }).map((_, i) => (
          <div key={i} className="w-1.5 h-1 bg-black/80 rounded-xs border border-amber-500/30" />
        ))}
      </div>

      {/* Repeating Film Thumbnails */}
      <div className="flex w-full h-full">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="flex-1 h-full border-r border-amber-950/60 relative overflow-hidden shrink-0 min-w-[55px] bg-black/60"
          >
            {imageUrl ? (
              imageUrl.endsWith('.mp4') || imageUrl.endsWith('.webm') || imageUrl.includes('sample/') || imageUrl.includes('video') ? (
                <video
                  src={imageUrl}
                  muted
                  playsInline
                  preload="metadata"
                  className="w-full h-full object-cover filter brightness-85 saturate-110 pointer-events-none"
                />
              ) : (
                <img
                  src={imageUrl}
                  alt="film frame"
                  className="w-full h-full object-cover filter brightness-85 saturate-110"
                />
              )
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-950/50 to-black/80">
                <Film className="w-3.5 h-3.5 text-amber-500/40" />
              </div>
            )}
            <span className="absolute bottom-1 right-1 text-[7px] font-mono-studio text-amber-200/60 bg-black/75 px-0.5 rounded">
              00:0{i % 10}
            </span>
          </div>
        ))}
      </div>

      {/* Bottom Film Sprocket Perforations */}
      <div className="absolute bottom-0.5 inset-x-0 flex justify-between px-1 z-10">
        {Array.from({ length: 36 }).map((_, i) => (
          <div key={i} className="w-1.5 h-1 bg-black/80 rounded-xs border border-amber-500/30" />
        ))}
      </div>
    </div>
  );
};

export default FilmstripTrackBackground;

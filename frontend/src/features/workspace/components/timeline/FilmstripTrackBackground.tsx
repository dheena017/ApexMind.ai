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
    <div className="absolute inset-0 flex items-center overflow-hidden pointer-events-none select-none">
      <div className="flex w-full h-full">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="flex-1 h-full border-r border-black/30 relative overflow-hidden shrink-0 min-w-[50px] bg-black/90"
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
                  className="w-full h-full object-cover filter brightness-100 saturate-110 pointer-events-none"
                />
              ) : (
                <img
                  src={imageUrl}
                  alt="film frame"
                  crossOrigin="anonymous"
                  className="w-full h-full object-cover filter brightness-100 saturate-110"
                />
              )
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-950/40 to-black/80">
                <Film className="w-3.5 h-3.5 text-amber-500/40" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FilmstripTrackBackground;

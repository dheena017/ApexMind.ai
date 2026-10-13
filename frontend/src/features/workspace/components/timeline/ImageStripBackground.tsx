import React from 'react';
import { Image as ImageIcon } from 'lucide-react';

export interface ImageStripBackgroundProps {
  imageUrl?: string;
  count?: number;
}

/**
 * Image photo filmstrip background showing photo thumbnails
 */
export const ImageStripBackground: React.FC<ImageStripBackgroundProps> = ({
  imageUrl,
  count = 8,
}) => {
  return (
    <div className="absolute inset-0 flex items-center overflow-hidden pointer-events-none opacity-45 select-none">
      <div className="flex w-full h-full">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="flex-1 h-full border-r border-rose-950/60 relative overflow-hidden shrink-0 min-w-[65px] bg-black/60"
          >
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="image thumbnail"
                className="w-full h-full object-cover filter brightness-90 saturate-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-rose-950/50 to-black/80">
                <ImageIcon className="w-3.5 h-3.5 text-rose-400/40" />
              </div>
            )}
            <span className="absolute bottom-1 right-1 text-[7px] font-mono-studio text-rose-200/60 bg-black/75 px-0.5 rounded">
              FRAME_{i + 1}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageStripBackground;

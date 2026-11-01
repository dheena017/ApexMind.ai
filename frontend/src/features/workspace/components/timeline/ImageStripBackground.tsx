import React, { useState } from 'react';
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
  const [hasError, setHasError] = useState(false);

  return (
    <div className="absolute inset-0 flex items-center overflow-hidden pointer-events-none select-none">
      <div className="flex w-full h-full">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="flex-1 h-full border-r border-black/40 relative overflow-hidden shrink-0 min-w-[50px] bg-black/90"
          >
            {imageUrl && !hasError ? (
              <img
                src={imageUrl}
                alt=""
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  setHasError(true);
                }}
                className="w-full h-full object-cover filter brightness-100 saturate-110 pointer-events-none select-none"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-rose-950/30 via-zinc-900 to-black">
                <ImageIcon className="w-3.5 h-3.5 text-rose-400/30" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageStripBackground;

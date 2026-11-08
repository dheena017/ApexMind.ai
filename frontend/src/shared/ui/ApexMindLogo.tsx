import React, { useState } from 'react';

interface ApexMindLogoProps {
  /** Size in pixels (or class name dimension) */
  size?: number | string;
  /** Whether to show the text label alongside the icon */
  showText?: boolean;
  /** Style variant: 'vector' (clean scalable SVG mark), '3d' (photorealistic 3D render), or 'full' */
  variant?: 'vector' | '3d' | 'full';
  /** Extra CSS classes for the container */
  className?: string;
  /** Extra CSS classes for the text */
  textClassName?: string;
  /** Optional badge text, defaults to 'AI' */
  badgeText?: string;
  /** Whether to animate pulse glow on hover */
  interactive?: boolean;
}

export const ApexMindLogo: React.FC<ApexMindLogoProps> = ({
  size = 28,
  showText = false,
  variant = '3d',
  className = '',
  textClassName = '',
  badgeText = 'AI',
  interactive = true,
}) => {
  const [imgError, setImgError] = useState(false);
  const pixelSize = typeof size === 'number' ? `${size}px` : size;
  const show3D = variant === '3d' && !imgError;

  return (
    <div
      className={`inline-flex items-center gap-2.5 select-none ${interactive ? 'group cursor-pointer' : ''} ${className}`}
    >
      {/* Icon Graphic */}
      <div
        className="relative shrink-0 flex items-center justify-center rounded-xl overflow-hidden shadow-sm transition-transform duration-200 group-hover:scale-105"
        style={{ width: pixelSize, height: pixelSize }}
      >
        {show3D ? (
          <img
            src="/apexmind-logo.png"
            alt="ApexMind.ai Logo"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover rounded-xl border border-blue-500/30 shadow-md shadow-blue-900/20"
          />
        ) : (
          <svg
            viewBox="0 0 64 64"
            className="w-full h-full drop-shadow-sm"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="comp-apex-1" x1="12" y1="54" x2="32" y2="10" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#1D4ED8" />
                <stop offset="50%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#60A5FA" />
              </linearGradient>
              <linearGradient id="comp-apex-2" x1="52" y1="54" x2="32" y2="10" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#7C3AED" />
                <stop offset="45%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#38BDF8" />
              </linearGradient>
              <filter id="comp-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            <rect width="64" height="64" rx="16" fill="#0A0F1D" stroke="rgba(96, 165, 250, 0.3)" strokeWidth="1.5" />
            <path d="M32 12 L15 48 C14.5 49.2 15.6 50.5 16.9 50.1 L28 46 L32 24 Z" fill="url(#comp-apex-1)" />
            <path d="M32 12 L49 48 C49.5 49.2 48.4 50.5 47.1 50.1 L36 46 L32 24 Z" fill="url(#comp-apex-2)" />
            <path d="M32 14 L36 45 L32 42 L28 45 Z" fill="#38BDF8" fillOpacity="0.3" />

            <g filter="url(#comp-glow)">
              <circle cx="32" cy="14" r="3" fill="#FFFFFF" />
              <circle cx="32" cy="14" r="1.5" fill="#38BDF8" />
              <circle cx="21" cy="38" r="1.8" fill="#93C5FD" />
              <circle cx="43" cy="38" r="1.8" fill="#C4B5FD" />
              <circle cx="32" cy="32" r="2" fill="#E0F2FE" />
            </g>

            <line x1="21" y1="38" x2="32" y2="32" stroke="#93C5FD" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="0.5 2" />
            <line x1="43" y1="38" x2="32" y2="32" stroke="#C4B5FD" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="0.5 2" />
            <line x1="32" y1="32" x2="32" y2="16" stroke="#FFFFFF" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        )}
      </div>

      {/* Brand Text */}
      {(showText || variant === 'full') && (
        <div className={`flex items-center gap-1.5 whitespace-nowrap font-extrabold tracking-tight text-white ${textClassName}`}>
          <span className="bg-gradient-to-r from-white via-zinc-100 to-blue-200 bg-clip-text text-transparent">
            ApexMind
          </span>
          {badgeText && (
            <span className="text-[#60A5FA] text-[10px] uppercase font-mono font-bold px-1.5 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/30">
              {badgeText}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default ApexMindLogo;


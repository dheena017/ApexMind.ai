import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Play, Share2, Check, X } from 'lucide-react';
import { YouTubeLiveVideo, YouTubeLiveShort } from '../types';

export interface YouTubeVideoDetailsModalProps {
  video: YouTubeLiveVideo | YouTubeLiveShort | null;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

/**
 * YouTubeVideoDetailsModal
 * Standalone modal component rendered via React createPortal to root document.body.
 * Provides live video preview, responsive 16:9 iframe embed, direct YouTube watch link,
 * and clipboard sharing.
 */
export const YouTubeVideoDetailsModal: React.FC<YouTubeVideoDetailsModalProps> = ({
  video,
  isOpen,
  onClose,
  title = 'Video Details',
}) => {
  const [copied, setCopied] = useState(false);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock background body scroll while modal is active
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen || !video || typeof document === 'undefined') {
    return null;
  }

  const videoUrl =
    video.videoUrl || `https://www.youtube.com/watch?v=${video.id}`;

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(videoUrl);
      } else {
        const input = document.createElement('textarea');
        input.value = videoUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const publishedText =
    'published' in video && video.published
      ? video.published
      : 'YouTube';

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="youtube-video-details-title"
    >
      <div
        className="bg-[#181818] border border-[#2F2F2F] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-scale-up text-[#E5E5E5] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2A2A2A]">
          <h3
            id="youtube-video-details-title"
            className="text-base sm:text-lg font-bold text-white tracking-tight"
          >
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#9CA3AF] hover:text-white hover:bg-[#282828] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {/* Responsive 16:9 Player Iframe */}
          <div className="aspect-video w-full rounded-2xl overflow-hidden relative bg-black border border-[#2F2F2F] shadow-inner">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0`}
              title={video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full border-0"
            />
          </div>

          {/* Video Metadata */}
          <div className="space-y-1.5">
            <h4 className="text-base sm:text-lg font-bold text-white leading-snug">
              {video.title}
            </h4>
            <p className="text-xs text-[#9CA3AF] font-mono-studio">
              {video.views} · {publishedText}
            </p>
          </div>

          {/* Action Buttons Bar */}
          <div className="pt-3 border-t border-[#2A2A2A] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <a
                href={videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Watch on YouTube</span>
              </a>

              <button
                type="button"
                onClick={handleCopyLink}
                className="px-4 py-2 rounded-full bg-[#272727] hover:bg-[#333333] active:bg-[#3D3D3D] text-white text-xs font-semibold transition-all border border-[#3A3A3A] flex items-center gap-2 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied Link</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5 text-[#9CA3AF]" />
                    <span>Share Video</span>
                  </>
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full bg-[#272727] hover:bg-[#333333] active:bg-[#3D3D3D] text-white text-xs font-semibold transition-all border border-[#3A3A3A] cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default YouTubeVideoDetailsModal;

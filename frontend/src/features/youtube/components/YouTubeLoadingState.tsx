import React from 'react';
import { RefreshCw } from 'lucide-react';

export interface YouTubeLoadingStateProps {
  title?: string;
  description?: string;
  className?: string;
}

export const YouTubeLoadingState: React.FC<YouTubeLoadingStateProps> = ({
  title = 'Fetching live YouTube feed…',
  description = 'Connecting to YouTube servers for live video metrics',
  className = '',
}) => {
  return (
    <div
      className={`py-20 text-center text-[#9CA3AF] space-y-3 rounded-2xl bg-[#141414] border border-[#2F2F2F] shadow-xl animate-fade-in ${className}`}
    >
      <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#3B82F6]" />
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="text-xs text-[#9CA3AF]">{description}</p>
    </div>
  );
};

export default YouTubeLoadingState;

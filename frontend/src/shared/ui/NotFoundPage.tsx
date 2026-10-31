import React from 'react';
import { Sparkles, ArrowLeft, LayoutDashboard, Wand2, Youtube, Compass, Home } from 'lucide-react';
import { Button } from './common';

interface NotFoundPageProps {
  onNavigate: (page: string) => void;
  currentPath?: string;
}

export default function NotFoundPage({ onNavigate, currentPath }: NotFoundPageProps) {
  const pathDisplay = currentPath || (typeof window !== 'undefined' ? window.location.pathname : '/unknown');

  const popularRoutes = [
    { id: 'workspace', label: 'AI Video Studio', icon: <Wand2 className="w-4 h-4 text-blue-400" /> },
    { id: 'videos', label: 'My Videos', icon: <Sparkles className="w-4 h-4 text-[#60A5FA]" /> },
    { id: 'youtube', label: 'YouTube Manager', icon: <Youtube className="w-4 h-4 text-red-400" /> },
  ];

  return (
    <div className="flex-1 w-full min-h-[calc(100vh-4rem)] flex items-center justify-center p-6 bg-[#0A0A0A] text-[#E5E5E5] relative overflow-hidden">
      <div className="max-w-xl w-full text-center space-y-8 relative z-10">
        {/* Glowing Badge & Big 404 */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1E1E1E] border border-[#2F2F2F] text-xs font-semibold text-[#9CA3AF]">
            <Compass className="w-4 h-4 text-[#60A5FA] animate-spin" style={{ animationDuration: '8s' }} />
            <span>Navigation Error</span>
          </div>

          <h1 className="text-7xl sm:text-8xl font-black tracking-tighter text-gradient-brand">
            404
          </h1>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Lost in the Algorithm?
          </h2>

          <p className="text-sm text-[#9CA3AF] max-w-md mx-auto leading-relaxed">
            The route or coordinates you requested cannot be located in the ApexMind video automation studio.
          </p>

          <div className="inline-block mt-2">
            <span className="px-3 py-1 rounded-lg bg-[#121212] border border-[#2F2F2F] font-mono-studio text-xs text-[#60A5FA]">
              {pathDisplay}
            </span>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button
            variant="primary"
            icon={<Wand2 className="w-4 h-4" />}
            onClick={() => onNavigate('workspace')}
          >
            Back to Studio
          </Button>

          <Button
            variant="secondary"
            icon={<Youtube className="w-4 h-4" />}
            onClick={() => onNavigate('youtube')}
          >
            YouTube Manager
          </Button>

          <Button
            variant="outline"
            icon={<Home className="w-4 h-4" />}
            onClick={() => onNavigate('landing')}
          >
            Landing Page
          </Button>
        </div>

        {/* Quick Nav Suggestions */}
        <div className="pt-6 border-t border-[#2F2F2F]/60">
          <span className="text-xs uppercase tracking-wider font-bold text-[#6B7280] block mb-3">
            Quick Navigation Shortcuts
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {popularRoutes.map((route) => (
              <button
                key={route.id}
                onClick={() => onNavigate(route.id)}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-[#121212] border border-[#2F2F2F] hover:border-[#3B82F6]/50 hover:bg-[#1E1E1E] transition-all cursor-pointer text-left group"
              >
                {route.icon}
                <span className="text-xs font-semibold text-[#9CA3AF] group-hover:text-white transition-colors truncate">
                  {route.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

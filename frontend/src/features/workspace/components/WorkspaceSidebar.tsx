import React from 'react';
import {
  Sparkles,
  FileText,
  Film,
  Sliders,
  Youtube,
  HelpCircle,
  Settings,
  LayoutDashboard,
} from 'lucide-react';

interface WorkspaceSidebarProps {
  onNavigate: (page: string) => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export const WorkspaceSidebar: React.FC<WorkspaceSidebarProps> = ({
  onNavigate,
  activeTab = 'studio',
  onTabChange,
}) => {
  return (
    <aside className="w-14 shrink-0 h-full bg-[#121212] border-r border-[#2F2F2F] flex flex-col items-center justify-between py-3.5 z-20 select-none font-sans-studio">
      {/* Top: Studio Brand & Studio Tools */}
      <div className="flex flex-col items-center gap-4 w-full">
        {/* Brand Studio Icon */}
        <button
          onClick={() => onNavigate('dashboard')}
          className="p-2.5 rounded-xl bg-gradient-to-tr from-[#3B82F6] to-[#2563EB] text-white shadow-md shadow-[#3B82F6]/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          title="Return to ApexMind Dashboard"
        >
          <Sparkles className="w-4 h-4" />
        </button>

        <div className="w-8 h-px bg-[#2F2F2F]" />

        {/* Studio Tool Rail */}
        <div className="flex flex-col items-center gap-2 w-full">
          {/* Tool 1: Scripts (AI Script Editor) */}
          <button
            onClick={() => onTabChange?.('scripts')}
            className={`p-2.5 rounded-xl transition-all cursor-pointer relative group flex items-center justify-center ${
              activeTab === 'studio' || activeTab === 'scripts'
                ? 'bg-[#3B82F6]/15 text-[#60A5FA] border border-[#3B82F6]/40 shadow-sm'
                : 'text-[#9CA3AF] hover:text-white hover:bg-[#1E1E1E]'
            }`}
            title="AI Script Editor"
          >
            <FileText className="w-4 h-4" />
            {/* Tooltip */}
            <span className="absolute left-16 px-2 py-1 bg-[#1E1E1E] border border-[#2F2F2F] text-white text-[11px] rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg z-50">
              AI Scriptwriter
            </span>
          </button>

          {/* Tool 2: Video Preview Reel */}
          <button
            onClick={() => onTabChange?.('preview')}
            className="p-2.5 rounded-xl text-[#9CA3AF] hover:text-white hover:bg-[#1E1E1E] transition-all cursor-pointer relative group flex items-center justify-center"
            title="9:16 Shorts Simulator"
          >
            <Film className="w-4 h-4" />
            <span className="absolute left-16 px-2 py-1 bg-[#1E1E1E] border border-[#2F2F2F] text-white text-[11px] rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg z-50">
              Shorts Simulator
            </span>
          </button>

          {/* Tool 3: Studio Controls */}
          <button
            onClick={() => onTabChange?.('controls')}
            className="p-2.5 rounded-xl text-[#9CA3AF] hover:text-white hover:bg-[#1E1E1E] transition-all cursor-pointer relative group flex items-center justify-center"
            title="Voices & Motion Controls"
          >
            <Sliders className="w-4 h-4" />
            <span className="absolute left-16 px-2 py-1 bg-[#1E1E1E] border border-[#2F2F2F] text-white text-[11px] rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg z-50">
              Voices & Themes
            </span>
          </button>

          {/* Tool 4: YouTube Manager */}
          <button
            onClick={() => onNavigate('youtube')}
            className="p-2.5 rounded-xl text-[#9CA3AF] hover:text-red-400 hover:bg-[#1E1E1E] transition-all cursor-pointer relative group flex items-center justify-center"
            title="YouTube Channel"
          >
            <Youtube className="w-4 h-4" />
            <span className="absolute left-16 px-2 py-1 bg-[#1E1E1E] border border-[#2F2F2F] text-white text-[11px] rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg z-50">
              YouTube Channel
            </span>
          </button>
        </div>
      </div>

      {/* Bottom: Help, Settings & Dashboard Exit */}
      <div className="flex flex-col items-center gap-2 w-full">
        {/* Help */}
        <button
          onClick={() => alert('ApexMind Studio Director Guide:\n• Left Pane: AI Script Generation & Hook Timings\n• Center Pane: Vertical 9:16 Phone Simulator & Scrubber\n• Right Pane: 24kHz Gemini Voiceover & YouTube Publishing')}
          className="p-2 rounded-lg text-[#6B7280] hover:text-white hover:bg-[#1E1E1E] transition-all cursor-pointer relative group flex items-center justify-center"
          title="Studio Guide"
        >
          <HelpCircle className="w-4 h-4" />
          <span className="absolute left-16 px-2 py-1 bg-[#1E1E1E] border border-[#2F2F2F] text-white text-[11px] rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg z-50">
            Studio Guide
          </span>
        </button>

        {/* Settings */}
        <button
          onClick={() => onNavigate('settings')}
          className="p-2 rounded-lg text-[#6B7280] hover:text-white hover:bg-[#1E1E1E] transition-all cursor-pointer relative group flex items-center justify-center"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
          <span className="absolute left-16 px-2 py-1 bg-[#1E1E1E] border border-[#2F2F2F] text-white text-[11px] rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg z-50">
            Settings
          </span>
        </button>

        {/* Return to Dashboard */}
        <button
          onClick={() => onNavigate('dashboard')}
          className="p-2 rounded-lg text-[#6B7280] hover:text-[#60A5FA] hover:bg-[#1E1E1E] transition-all cursor-pointer relative group flex items-center justify-center"
          title="Dashboard"
        >
          <LayoutDashboard className="w-4 h-4" />
          <span className="absolute left-16 px-2 py-1 bg-[#1E1E1E] border border-[#2F2F2F] text-white text-[11px] rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg z-50">
            Exit to Dashboard
          </span>
        </button>
      </div>
    </aside>
  );
};

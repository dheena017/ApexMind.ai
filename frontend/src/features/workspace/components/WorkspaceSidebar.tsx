import React from 'react';
import {
  FileText,
  FolderOpen,
  LayoutTemplate,
  Type,
  Shapes,
  Music,
  Image as ImageIcon,
  Film,
} from 'lucide-react';

export type WorkspaceTabType =
  | 'script'
  | 'prompt'
  | 'editor'
  | 'canvas'
  | 'media'
  | 'text'
  | 'elements'
  | 'audio'
  | 'image'
  | 'video';

interface WorkspaceSidebarProps {
  activeTab: WorkspaceTabType;
  onTabChange: (tab: WorkspaceTabType) => void;
}

const SIDEBAR_ITEMS: Array<{
  id: WorkspaceTabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isScriptGroup?: boolean;
}> = [
  { id: 'script', label: 'Script & AI', icon: FileText, isScriptGroup: true },
  { id: 'canvas', label: 'Canvas', icon: LayoutTemplate },
  { id: 'media', label: 'Media Library', icon: FolderOpen },
  { id: 'text', label: 'Text & Titles', icon: Type },
  { id: 'elements', label: 'Elements', icon: Shapes },
  { id: 'audio', label: 'Audio & SFX', icon: Music },
  { id: 'image', label: 'Stock Images', icon: ImageIcon },
  { id: 'video', label: 'Stock Videos', icon: Film },
];

export const WorkspaceSidebar: React.FC<WorkspaceSidebarProps> = ({
  activeTab,
  onTabChange,
}) => {
  return (
    <aside className="hidden sm:flex relative w-10 shrink-0 h-full bg-[#121212] border-r border-[#2F2F2F] shadow-[inset_-1px_0_0_rgba(255,255,255,0.02)] flex-col items-center justify-between py-2 z-20 select-none font-sans-studio">
      <div className="flex w-full flex-col items-center gap-1">
        {SIDEBAR_ITEMS.map((item) => {
          const IconComp = item.icon;
          const isActive = item.isScriptGroup
            ? activeTab === 'script' || activeTab === 'prompt' || activeTab === 'editor'
            : activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              title={item.label}
              className={`group relative flex flex-col h-8 w-8 items-center justify-center rounded-md border transition-all cursor-pointer ${
                isActive
                  ? 'border-[#2F2F2F] bg-[#1A1A1A] text-white'
                  : 'border-transparent text-[#757575] hover:border-[#2F2F2F] hover:bg-[#171717] hover:text-[#E5E5E5]'
              }`}
            >
              <IconComp className="h-3 w-3 shrink-0 transition-transform group-hover:scale-110" />
              <span className="text-[6px] font-semibold mt-0.5 tracking-tight truncate max-w-[30px] leading-none">
                {item.id === 'script' ? 'Script' : item.label.split(' ')[0]}
              </span>

              {/* Flyout Tooltip */}
              <span className="pointer-events-none absolute left-11 top-1/2 z-50 -translate-y-1/2 whitespace-nowrap rounded-md border border-[#2F2F2F] bg-[#1E1E1E] px-2 py-0.5 text-[9px] font-medium text-white opacity-0 shadow-[0_10px_25px_rgba(0,0,0,0.35)] transition-opacity group-hover:opacity-100">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="w-full h-2" aria-hidden="true" />
    </aside>
  );
};

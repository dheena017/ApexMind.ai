import React from 'react';
import {
  Wand2,
  Film,
  Youtube,
  FolderOpen,
  User,
  Settings,
  Bell,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface QuickActionsBarProps {
  onNavigate: (page: string) => void;
}

export const QuickActionsBar: React.FC<QuickActionsBarProps> = ({ onNavigate }) => {
  const actions = [
    {
      id: 'studio',
      title: 'AI Video Studio',
      description: 'Editor, voiceovers & visual timeline',
      icon: Wand2,
      iconColor: 'text-[#60A5FA]',
      bgColor: 'bg-[#3B82F6]/10',
      target: 'workspace',
    },
    {
      id: 'videos',
      title: 'Website Video Library',
      description: 'Browse, manage & export created videos',
      icon: Film,
      iconColor: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      target: 'videos',
    },
    {
      id: 'youtube',
      title: 'YouTube Manager',
      description: 'Shorts, tags, auto-schedules & analytics',
      icon: Youtube,
      iconColor: 'text-red-400',
      bgColor: 'bg-red-500/10',
      target: 'youtube',
    },
    {
      id: 'media',
      title: 'Stock Media Library',
      description: 'Copyright-free audio, loops & visuals',
      icon: FolderOpen,
      iconColor: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      target: 'workspace-media',
    },
    {
      id: 'profile',
      title: 'Creator Profile & Badges',
      description: 'Niche, audience & achievement badges',
      icon: User,
      iconColor: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      target: 'profile',
    },
    {
      id: 'settings',
      title: 'Studio Settings',
      description: 'API keys, voices, telemetry & storage',
      icon: Settings,
      iconColor: 'text-[#9CA3AF]',
      bgColor: 'bg-[#222222]',
      target: 'settings',
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-[#E5E5E5] tracking-tight uppercase tracking-wider text-[11px] text-[#8E8E93]">
          Quick Studio Navigation
        </h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.id}
              type="button"
              onClick={() => onNavigate(act.target)}
              className="group p-3 sm:p-3.5 rounded-xl bg-[#141414] border border-[#242424] hover:border-[#383838] hover:bg-[#181818] transition-all text-left flex flex-col justify-between gap-2.5 cursor-pointer"
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${act.bgColor}`}
              >
                <Icon className={`w-4 h-4 ${act.iconColor}`} />
              </div>

              <div>
                <div className="text-xs font-bold text-white group-hover:text-[#60A5FA] transition-colors flex items-center justify-between">
                  <span>{act.title}</span>
                  <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-[#60A5FA]" />
                </div>
                <div className="text-[10px] text-[#737373] line-clamp-1 mt-0.5">
                  {act.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

import React from 'react';
import { Activity, BadgeCheck, Link2, LockKeyhole, Settings2, UserRound, WalletCards } from 'lucide-react';

const sections = [
  { id: 'profile', label: 'Overview', icon: <UserRound className="h-4 w-4" /> },
  { id: 'profile-details', label: 'Creator details', icon: <BadgeCheck className="h-4 w-4" /> },
  { id: 'profile-preferences', label: 'Preferences', icon: <Settings2 className="h-4 w-4" /> },
  { id: 'profile-channels', label: 'Channels', icon: <Link2 className="h-4 w-4" /> },
  { id: 'profile-activity', label: 'Activity', icon: <Activity className="h-4 w-4" /> },
  { id: 'profile-usage', label: 'Studio activity', icon: <WalletCards className="h-4 w-4" /> },
  { id: 'profile-security', label: 'Security', icon: <LockKeyhole className="h-4 w-4" /> },
];

interface ProfileSectionLayoutProps {
  activePage: string;
  onNavigate: (page: string) => void;
  children: React.ReactNode;
}

export default function ProfileSectionLayout({ activePage, onNavigate, children }: ProfileSectionLayoutProps) {
  return (
    <div className="mx-auto flex h-full w-full max-w-6xl flex-col gap-5 overflow-y-auto p-4 sm:p-6 lg:p-8">
      <nav
        aria-label="Profile sections"
        className="profile-section-scrollbar flex shrink-0 gap-1.5 overflow-x-auto rounded-2xl border border-[#2A2A2A] bg-[#0B0B0B] p-1.5 pb-2"
      >
        {sections.map((section) => {
          const selected = activePage === section.id;
          return (
            <button
              key={section.id}
              type="button"
              aria-current={selected ? 'page' : undefined}
              onClick={() => onNavigate(section.id)}
              className={`group inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/50 motion-reduce:transition-none ${
                selected
                  ? 'border-[#3B82F6]/30 bg-[#172033] text-[#93C5FD] shadow-sm shadow-[#3B82F6]/10'
                  : 'border-transparent text-[#9CA3AF] hover:border-[#303030] hover:bg-[#171717] hover:text-white'
              }`}
            >
              <span className={`flex h-6 w-6 items-center justify-center rounded-lg transition-colors ${
                selected
                  ? 'bg-[#3B82F6]/15 text-[#60A5FA]'
                  : 'text-[#737373] group-hover:text-[#D4D4D4]'
              }`}>
                {section.icon}
              </span>
              <span>{section.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}

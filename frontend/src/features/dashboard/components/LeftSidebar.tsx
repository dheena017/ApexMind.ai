import React from 'react';
import { DashboardHeaderBanner } from '../components/DashboardHeaderBanner';
import { Button } from '@/src/shared/ui/common';
import { Sparkles } from 'lucide-react';

/**
 * Simple left sidebar that spans the full viewport height.
 * It renders any passed children (e.g., navigation) and places the
 * `DashboardHeaderBanner` as a bottom bar.
 */
export default function LeftSidebar({
  onNavigate,
  onRefresh,
  loading,
}: {
  onNavigate: (page: string) => void;
  onRefresh: () => void;
  loading: boolean;
}) {
  return (
    <aside className="flex flex-col h-screen w-64 bg-[#1E1E1E] text-[#E5E5E5] border-r border-[#2F2F2F]">
      {/* Top area – you can add navigation items here */}
      <div className="flex-1 p-4 overflow-y-auto">
        {/* Placeholder for future navigation links */}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onNavigate('home')}
          className="w-full mb-2"
        >
          Home
        </Button>
        {/* Add more nav items as needed */}
      </div>

      {/* Bottom bar – the original header banner moved here */}
      <div className="border-t border-[#2F2F2F] p-2">
        <DashboardHeaderBanner
          onNavigate={onNavigate}
          onRefresh={onRefresh}
          loading={loading}
        />
      </div>
    </aside>
  );
}


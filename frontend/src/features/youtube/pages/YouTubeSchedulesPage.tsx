import React from 'react';
import { Zap, Clock, Calendar, CheckCircle2 } from 'lucide-react';
import { Card, Badge, Button } from '@/src/shared/ui/common';
import { AutomationJob } from '../types';
import { YouTubeLoadingState } from '../components/YouTubeLoadingState';

export interface YouTubeSchedulesPageProps {
  automations: AutomationJob[];
  loading?: boolean;
  onToggleAuto: (id: string) => void;
  onNavigate?: (page: string) => void;
}

export const YouTubeSchedulesPage: React.FC<YouTubeSchedulesPageProps> = ({
  automations,
  loading = false,
  onToggleAuto,
}) => {
  const activeCount = automations.filter((a) => a.active).length;

  return (
    <div className="space-y-6 animate-fade-in font-sans-studio text-[#E5E5E5]">
      {loading ? (
        <YouTubeLoadingState
          title="Fetching YouTube automation & schedule status…"
          description="Synchronizing cron schedules and automated publishing queue"
        />
      ) : (
        <>
          {/* Scheduled Automation Rules */}
          <Card className="bg-[#141414] border-[#2F2F2F] p-6 rounded-2xl shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#262626] mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Automated Daily Upload Schedules</h3>
              <p className="text-xs text-[#9CA3AF] mt-0.5">Recurring pipelines that auto-generate scripts, synthesize studio voices, and publish Shorts</p>
            </div>
          </div>
          <Badge variant="blue">{activeCount} Active Pipelines</Badge>
        </div>

        <div className="space-y-3.5">
          {automations.map((auto) => (
            <div
              key={auto.id}
              className="p-4 rounded-xl bg-[#121212] border border-[#2F2F2F] hover:border-[#3B82F6]/40 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-md bg-[#3B82F6]/15 text-[#60A5FA]">
                    <Zap className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-white text-sm">{auto.theme}</h4>
                  <Badge variant={auto.active ? 'green' : 'gray'}>
                    {auto.active ? 'Running' : 'Paused'}
                  </Badge>
                </div>
                <p className="text-xs text-[#9CA3AF]">
                  Schedule: <strong className="text-white">{auto.schedule}</strong> · Voice: <span className="text-[#60A5FA]">{auto.voice}</span> · Music: {auto.musicTrack}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-[#6B7280] font-mono-studio flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Next: {new Date(auto.nextRun).toLocaleDateString()}
                </span>
                <button
                  type="button"
                  onClick={() => onToggleAuto(auto.id)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                    auto.active
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25'
                      : 'bg-gray-800 border-gray-700 text-[#9CA3AF] hover:text-white'
                  }`}
                >
                  {auto.active ? 'Active' : 'Paused'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Production Automation Policy */}
      <Card className="bg-[#141414] border-[#2F2F2F] p-5 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-[#60A5FA] border border-blue-500/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Zero-Intervention Cron Execution</h4>
            <p className="text-xs text-[#9CA3AF] mt-0.5">
              Automated pipelines dispatch YouTube API upload jobs at specified time zones without requiring manual browser sessions.
            </p>
          </div>
        </div>
      </Card>
        </>
      )}
    </div>
  );
};

export default YouTubeSchedulesPage;

import React from 'react';
import {
  Activity,
  Cpu,
  Database,
  Music,
  Clock,
  CheckCircle2,
  Settings,
} from 'lucide-react';
import { SystemStatusSummary } from '../types';
import { DEFAULT_SCRIPT_MODEL_LABEL } from '@/src/shared/aiModels';

interface SystemHealthWidgetProps {
  systemStatus: SystemStatusSummary;
  onNavigate: (page: string) => void;
}

export const SystemHealthWidget: React.FC<SystemHealthWidgetProps> = ({
  systemStatus,
  onNavigate,
}) => {
  const isGeminiReady = systemStatus.geminiAi === 'ready';

  return (
    <div className="rounded-2xl bg-[#141414] border border-[#262626] p-5 sm:p-6 shadow-xl flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#242424] mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Studio Engine & Telemetry</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Operational
                </span>
              </h3>
              <p className="text-xs text-[#8E8E93]">
                Backend runtime & microservices diagnostics
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('settings')}
            className="text-xs font-semibold text-[#8E8E93] hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
            title="Open studio settings"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Settings</span>
          </button>
        </div>

        {/* Subsystems Telemetry Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Gemini AI Status */}
          <div className="p-3 rounded-xl bg-[#181818] border border-[#242424]">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#A0A0A0]">
                <Cpu className="w-3.5 h-3.5 text-blue-400" />
                <span>Gemini AI</span>
              </div>
              <span
                className={`w-2 h-2 rounded-full ${
                  isGeminiReady ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
            </div>
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>{isGeminiReady ? 'Ready' : 'Unconfigured'}</span>
            </div>
            <div className="text-[10px] text-[#7A7A7A] mt-0.5">
              {isGeminiReady ? `${DEFAULT_SCRIPT_MODEL_LABEL} engine` : 'API key needed'}
            </div>
          </div>

          {/* SQLite DB */}
          <div className="p-3 rounded-xl bg-[#181818] border border-[#242424]">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#A0A0A0]">
                <Database className="w-3.5 h-3.5 text-amber-400" />
                <span>Database</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            </div>
            <div className="text-xs font-bold text-white truncate">apexmind.db</div>
            <div className="text-[10px] text-emerald-400 mt-0.5">Connected</div>
          </div>

          {/* Audio Cache */}
          <div className="p-3 rounded-xl bg-[#181818] border border-[#242424]">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#A0A0A0]">
                <Music className="w-3.5 h-3.5 text-purple-400" />
                <span>TTS Cache</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-purple-400/80" />
            </div>
            <div className="text-xs font-bold text-white truncate">
              {systemStatus.cachedAudioCount} audio files
            </div>
            <div className="text-[10px] text-[#7A7A7A] mt-0.5">Instant play</div>
          </div>

          {/* Uptime */}
          <div className="p-3 rounded-xl bg-[#181818] border border-[#242424]">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#A0A0A0]">
                <Clock className="w-3.5 h-3.5 text-[#60A5FA]" />
                <span>Uptime</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-blue-400" />
            </div>
            <div className="text-xs font-bold text-white truncate">
              {systemStatus.serverUptimeFormatted}
            </div>
            <div className="text-[10px] text-[#7A7A7A] mt-0.5">FastAPI live</div>
          </div>
        </div>
      </div>

      {/* Footer Diagnostic Link */}
      <div className="mt-4 pt-3 border-t border-[#222222] flex items-center justify-between text-xs text-[#7A7A7A]">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>AI pipelines & microservices ready</span>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('notifications')}
          className="text-[#60A5FA] hover:text-white font-medium transition-colors cursor-pointer"
        >
          View Alerts
        </button>
      </div>
    </div>
  );
};

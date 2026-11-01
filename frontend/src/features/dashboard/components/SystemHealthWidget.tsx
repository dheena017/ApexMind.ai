import React, { useState } from 'react';
import {
  Activity,
  Cpu,
  Database,
  Music,
  Clock,
  CheckCircle2,
  Settings,
  Zap,
  Gauge,
  X,
  ExternalLink,
  AlertTriangle,
  Layers,
  Sparkles,
} from 'lucide-react';
import { SystemStatusSummary } from '../types';

interface SystemHealthWidgetProps {
  systemStatus: SystemStatusSummary;
  onNavigate: (page: string) => void;
}

export const SystemHealthWidget: React.FC<SystemHealthWidgetProps> = ({
  systemStatus,
  onNavigate,
}) => {
  const [showLimitsModal, setShowLimitsModal] = useState(false);

  const rateLimits = systemStatus.geminiRateLimits || {
    activeModel: 'gemini-3.8-flash',
    currentRpm: 0,
    limitRpm: 5,
    currentRpd: 16,
    limitRpd: 20,
    currentTpm: 0,
    limitTpm: 250000,
    usagePercentRpm: 0,
    statusLevel: 'healthy' as const,
    secondsToWindowReset: 0,
    effectiveRps: 0.083,
    totalRequests: 16,
    tier: 'Free Tier (AI Studio)',
    models: [
      {
        name: 'Gemini 3.8 Flash',
        category: 'Text & Scripts',
        rpmLimit: 5,
        rpdLimit: 20,
        tpmLimit: '250K',
        rps: '0.083 req/s',
        status: 'Active',
        description: 'Default primary engine for script creation and reasoning (1 req every 12s)',
      },
      {
        name: 'Gemini 3.8 Flash TTS',
        category: 'Voiceover Audio',
        rpmLimit: 3,
        rpdLimit: 10,
        tpmLimit: '10K',
        rps: '0.050 req/s',
        status: 'Active',
        description: 'Expressive speech synthesis engine (1 req every 20s)',
      },
      {
        name: 'Gemini 3.5 Flash Lite',
        category: 'High-Throughput',
        rpmLimit: 15,
        rpdLimit: 500,
        tpmLimit: '250K',
        rps: '0.250 req/s',
        status: 'Standby',
        description: 'Lightweight high-speed model (1 req every 4s)',
      },
      {
        name: 'Antigravity Agent',
        category: 'Autonomous Agents',
        rpmLimit: 60,
        rpdLimit: 100,
        tpmLimit: '100K',
        rps: '1.000 req/s',
        status: 'Standby',
        description: 'Autonomous coding and development agent runtime',
      },
    ],
  };

  const isWarning = rateLimits.usagePercentRpm >= 60 && rateLimits.usagePercentRpm < 80;
  const isCritical = rateLimits.usagePercentRpm >= 80;
  const progressColor = isCritical
    ? 'bg-rose-500'
    : isWarning
    ? 'bg-amber-400'
    : 'bg-emerald-400';

  const badgeColor = isCritical
    ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
    : isWarning
    ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';

  return (
    <>
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
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    Live RPM
                  </span>
                </h3>
                <p className="text-xs text-[#8E8E93]">
                  Gemini AI quotas & runtime system diagnostics
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

          {/* Gemini AI Quota & Live Requests Card */}
          <div className="mb-3 p-3.5 rounded-xl bg-gradient-to-br from-[#1a1a1a] to-[#141414] border border-[#2a2a2a] relative overflow-hidden">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white">
                      {rateLimits.activeModel.replace('gemini-', 'Gemini ').replace('-tts', ' TTS')}
                    </span>
                    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${badgeColor}`}>
                      {rateLimits.tier}
                    </span>
                  </div>
                  <div className="text-[10px] text-[#8E8E93] flex items-center gap-1 mt-0.5">
                    <span>Throughput:</span>
                    <span className="text-white font-medium">{rateLimits.effectiveRps} req/s</span>
                    <span>•</span>
                    <span>Daily:</span>
                    <span className="text-white font-medium">{rateLimits.currentRpd}/{rateLimits.limitRpd} RPD</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowLimitsModal(true)}
                className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 px-2 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Gauge className="w-3 h-3" />
                <span>View Limits</span>
              </button>
            </div>

            {/* Content Requests Per Minute (RPM) Progress Gauge */}
            <div className="mt-2.5 pt-2.5 border-t border-[#262626]">
              <div className="flex items-center justify-between text-xs mb-1">
                <div className="flex items-center gap-1 text-[#A0A0A0] text-[11px] font-medium">
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>Content Requests Per Minute:</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-white text-xs">
                    {rateLimits.currentRpm} / {rateLimits.limitRpm} RPM
                  </span>
                  {rateLimits.secondsToWindowReset > 0 && (
                    <span className="text-[10px] text-amber-400 font-medium">
                      (resets in {rateLimits.secondsToWindowReset}s)
                    </span>
                  )}
                </div>
              </div>

              {/* Live Progress Bar */}
              <div className="w-full h-2 rounded-full bg-[#202020] overflow-hidden p-0.5 border border-[#2a2a2a]">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                  style={{ width: `${Math.min(100, Math.max(8, rateLimits.usagePercentRpm))}%` }}
                />
              </div>

              {isCritical && (
                <div className="flex items-center gap-1 text-[10px] text-rose-400 mt-1.5">
                  <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                  <span>Approaching free-tier rate limit (5 RPM). Wait a few seconds between requests.</span>
                </div>
              )}
            </div>
          </div>

          {/* Subsystems Telemetry Grid */}
          <div className="grid grid-cols-3 gap-2">
            {/* SQLite DB */}
            <div className="p-2.5 rounded-xl bg-[#181818] border border-[#242424]">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1 text-[11px] font-semibold text-[#A0A0A0]">
                  <Database className="w-3 h-3 text-amber-400" />
                  <span>Database</span>
                </div>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </div>
              <div className="text-xs font-bold text-white truncate">apexmind.db</div>
              <div className="text-[10px] text-emerald-400 mt-0.5">Connected</div>
            </div>

            {/* Audio Cache */}
            <div className="p-2.5 rounded-xl bg-[#181818] border border-[#242424]">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1 text-[11px] font-semibold text-[#A0A0A0]">
                  <Music className="w-3 h-3 text-blue-400" />
                  <span>TTS Cache</span>
                </div>
              </div>
              <div className="text-xs font-bold text-white truncate">
                {systemStatus.cachedAudioCount} audio files
              </div>
              <div className="text-[10px] text-[#7A7A7A] mt-0.5">Instant play</div>
            </div>

            {/* Uptime */}
            <div className="p-2.5 rounded-xl bg-[#181818] border border-[#242424]">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1 text-[11px] font-semibold text-[#A0A0A0]">
                  <Clock className="w-3 h-3 text-[#60A5FA]" />
                  <span>Uptime</span>
                </div>
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

      {/* Complete Rate Limits & Model Breakdown Modal */}
      {showLimitsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div
            className="bg-[#141414] border border-[#262626] rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-[#242424] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Gauge className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Gemini AI Rate Limits & RPM Quotas
                  </h3>
                  <p className="text-xs text-[#8E8E93]">
                    Requests per minute (RPM), tokens per minute (TPM), and daily caps by model
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowLimitsModal(false)}
                className="w-8 h-8 rounded-lg bg-[#202020] hover:bg-[#282828] text-[#8E8E93] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto space-y-4">
              {/* Current Status Banner */}
              <div className="p-3.5 rounded-xl bg-[#181818] border border-[#262626] flex items-center justify-between">
                <div>
                  <div className="text-xs text-[#8E8E93]">Active Tier & Status</div>
                  <div className="text-sm font-bold text-white flex items-center gap-2 mt-0.5">
                    <span>{rateLimits.tier}</span>
                    <span className="text-xs font-normal text-emerald-400 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      Operational
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-[#8E8E93]">Live Window Usage</div>
                  <div className="text-sm font-bold text-white mt-0.5">
                    {rateLimits.currentRpm} / {rateLimits.limitRpm} RPM ({rateLimits.effectiveRps} req/s)
                  </div>
                </div>
              </div>

              {/* Models Quota Table */}
              <div className="rounded-xl border border-[#242424] overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#1c1c1c] text-[#8E8E93] uppercase text-[10px] tracking-wider border-b border-[#242424]">
                    <tr>
                      <th className="py-2.5 px-3">Model</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">RPM Limit</th>
                      <th className="py-2.5 px-3">Daily (RPD)</th>
                      <th className="py-2.5 px-3">Throughput</th>
                      <th className="py-2.5 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#202020]">
                    {rateLimits.models.map((m) => (
                      <tr key={m.name} className="hover:bg-[#181818] transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-semibold text-white">{m.name}</div>
                          <div className="text-[10px] text-[#7A7A7A] mt-0.5">{m.description}</div>
                        </td>
                        <td className="py-3 px-3 text-[#A0A0A0]">{m.category}</td>
                        <td className="py-3 px-3 font-semibold text-white">{m.rpmLimit} RPM</td>
                        <td className="py-3 px-3 text-[#A0A0A0]">{m.rpdLimit} RPD</td>
                        <td className="py-3 px-3 text-blue-400 font-mono">{m.rps}</td>
                        <td className="py-3 px-3 text-right">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              m.status === 'Active'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                            }`}
                          >
                            {m.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Explanation Note */}
              <div className="p-3.5 rounded-xl bg-blue-500/5 border border-blue-500/20 text-xs text-[#A0A0A0] space-y-1.5">
                <div className="font-bold text-blue-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>How Content Requests Per Minute (RPM) Work:</span>
                </div>
                <p>
                  • <strong>5 RPM</strong> means Google AI Studio permits up to 5 requests in any rolling 60-second window (approximately 1 request every 12 seconds).
                </p>
                <p>
                  • If you make more than 5 requests in 60 seconds, Gemini returns an HTTP 429 (<code className="text-white">RESOURCE_EXHAUSTED</code>) rate-limit error.
                </p>
                <p>
                  • <strong>Upgrading to Tier 1:</strong> Linking a Google Cloud billing account increases Flash limits from <strong>5 RPM to 1,000+ RPM (~16-33 requests per second)</strong> with no daily caps.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#242424] flex items-center justify-between bg-[#111111]">
              <a
                href="https://aistudio.google.com/rate-limit"
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                <span>View Google AI Studio Rate Limits Dashboard</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              <button
                type="button"
                onClick={() => setShowLimitsModal(false)}
                className="px-4 py-1.5 rounded-lg bg-[#252525] hover:bg-[#303030] text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

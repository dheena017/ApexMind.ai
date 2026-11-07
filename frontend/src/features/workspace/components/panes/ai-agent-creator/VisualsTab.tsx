/**
 * frontend/src/features/workspace/components/panes/ai-agent-creator/VisualsTab.tsx
 *
 * Stage 3 — Visual Production Controls & Scene Preview Approval
 * Supports Media (default), 3D (Blender 5.2 LTS), Hybrid, and Automatic routing paths.
 */

import React, { useState, useEffect } from 'react';
import {
  Film,
  Box,
  Layers,
  Sparkles,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Play,
  ShieldCheck,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { studioApi } from '../../../api/studioApi';
import { toast } from 'sonner';

export type VisualProductionMode = 'media' | 'three_d' | 'hybrid' | 'automatic';

export interface VisualsTabProps {
  scriptId?: string;
  scenes?: any[];
  aspectRatio?: string;
  onVisualsReady?: (visualData: any) => void;
}

export const VisualsTab: React.FC<VisualsTabProps> = ({
  scriptId = 'scr_8f716fa53031',
  scenes = [],
  aspectRatio = '9:16',
  onVisualsReady,
}) => {
  const [selectedMode, setSelectedMode] = useState<VisualProductionMode>('media');
  const [loading, setLoading] = useState(false);
  const [visualScenes, setVisualScenes] = useState<any[]>([]);
  const [masterPreviewUrl, setMasterPreviewUrl] = useState<string | null>(null);
  const [regeneratingSceneId, setRegeneratingSceneId] = useState<string | null>(null);
  const [regenModeOverride, setRegenModeOverride] = useState<Record<string, VisualProductionMode>>({});

  // Load existing visual manifest on mount or scriptId change
  useEffect(() => {
    let mounted = true;
    async function fetchManifest() {
      if (!scriptId) return;
      try {
        const res = await studioApi.getScriptVisuals(scriptId);
        if (mounted && res?.manifest?.scenes) {
          const loaded = Object.entries(res.manifest.scenes).map(([sid, sdata]: [string, any]) => ({
            sceneId: sid,
            ...sdata,
          }));
          setVisualScenes(loaded);
          if (res.manifest.masterPreviewUrl) {
            setMasterPreviewUrl(res.manifest.masterPreviewUrl);
          }
        }
      } catch {
        // No existing visuals yet
      }
    }
    fetchManifest();
    return () => {
      mounted = false;
    };
  }, [scriptId]);

  const handleGenerateVisuals = async () => {
    setLoading(true);
    try {
      const res = await studioApi.generateVisuals({
        scriptId,
        projectMode: selectedMode,
        aspectRatio,
        autoRoute: selectedMode === 'automatic',
      });
      if (res?.scenes) {
        setVisualScenes(res.scenes);
        if (res.masterPreviewUrl) {
          setMasterPreviewUrl(res.masterPreviewUrl);
        }
        if (onVisualsReady) onVisualsReady(res);
        toast.success(`Generated visuals for ${res.scenes.length} scenes (${selectedMode.toUpperCase()})`);
      }
    } catch (err: any) {
      toast.error(`Visual generation failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveScene = async (sceneId: string, approved: boolean) => {
    try {
      const reason = approved ? undefined : prompt('Reason for rejection:') || 'User rejected preview';
      const res = await studioApi.approveSceneVisual(scriptId, sceneId, approved, reason);
      setVisualScenes((prev) =>
        prev.map((s) =>
          s.sceneId === sceneId
            ? { ...s, status: res.status, rejectionReason: res.rejectionReason }
            : s
        )
      );
      if (res.masterPreviewUrl) {
        setMasterPreviewUrl(res.masterPreviewUrl);
        toast.success('All scenes approved! Master video preview assembled.');
      } else {
        toast.info(`Scene ${sceneId} marked as ${res.status.toUpperCase()}`);
      }
    } catch (err: any) {
      toast.error(`Approval failed: ${err.message}`);
    }
  };

  const handleRegenerateScene = async (sceneId: string) => {
    setRegeneratingSceneId(sceneId);
    try {
      const override = regenModeOverride[sceneId];
      const res = await studioApi.regenerateSceneVisuals(scriptId, sceneId, {
        modeOverride: override,
        aspectRatio,
      });
      setVisualScenes((prev) =>
        prev.map((s) => (s.sceneId === sceneId ? { ...s, ...res } : s))
      );
      toast.success(`Regenerated scene ${sceneId} -> v${res.version} (${res.modeUsed})`);
    } catch (err: any) {
      toast.error(`Regeneration failed: ${err.message}`);
    } finally {
      setRegeneratingSceneId(null);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 space-y-4 text-xs text-zinc-300">
      {/* ── Production Mode Selector ── */}
      <div className="bg-[#18181C] p-3 rounded-xl border border-[#24242A] space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-white uppercase tracking-wider text-[11px]">
            Visual Production Mode (Stage 3)
          </span>
          <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-mono">
            Default: Media
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* Media Mode */}
          <button
            type="button"
            onClick={() => setSelectedMode('media')}
            className={`p-2.5 rounded-lg border text-left transition-all ${
              selectedMode === 'media'
                ? 'bg-blue-600/20 border-blue-500 text-white shadow-sm'
                : 'bg-[#202026] border-[#2E2E38] text-zinc-400 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold text-xs">
              <Film className="w-3.5 h-3.5 text-blue-400" />
              <span>Media (Default)</span>
            </div>
            <p className="text-[10px] text-zinc-400 mt-1 line-clamp-2">
              Curated stock B-roll & photos with multi-candidate aesthetic ranking.
            </p>
          </button>

          {/* 3D Mode */}
          <button
            type="button"
            onClick={() => setSelectedMode('three_d')}
            className={`p-2.5 rounded-lg border text-left transition-all ${
              selectedMode === 'three_d'
                ? 'bg-blue-600/20 border-blue-500 text-white shadow-sm'
                : 'bg-[#202026] border-[#2E2E38] text-zinc-400 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold text-xs">
              <Box className="w-3.5 h-3.5 text-purple-400" />
              <span>3D Procedural</span>
            </div>
            <p className="text-[10px] text-zinc-400 mt-1 line-clamp-2">
              Blender 5.2 LTS headless staging with cubic bezier camera motions.
            </p>
          </button>

          {/* Hybrid Mode */}
          <button
            type="button"
            onClick={() => setSelectedMode('hybrid')}
            className={`p-2.5 rounded-lg border text-left transition-all ${
              selectedMode === 'hybrid'
                ? 'bg-blue-600/20 border-blue-500 text-white shadow-sm'
                : 'bg-[#202026] border-[#2E2E38] text-zinc-400 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold text-xs">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>Hybrid Composite</span>
            </div>
            <p className="text-[10px] text-zinc-400 mt-1 line-clamp-2">
              3D characters with transparent alpha composited over stock video plates.
            </p>
          </button>

          {/* Automatic Mode */}
          <button
            type="button"
            onClick={() => setSelectedMode('automatic')}
            className={`p-2.5 rounded-lg border text-left transition-all ${
              selectedMode === 'automatic'
                ? 'bg-blue-600/20 border-blue-500 text-white shadow-sm'
                : 'bg-[#202026] border-[#2E2E38] text-zinc-400 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold text-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Automatic Routing</span>
            </div>
            <p className="text-[10px] text-zinc-400 mt-1 line-clamp-2">
              Intelligent per-scene path selection based on characters & camera dynamics.
            </p>
          </button>
        </div>

        {/* Generate Button */}
        <button
          type="button"
          onClick={handleGenerateVisuals}
          disabled={loading}
          className="w-full mt-2 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Generating Visuals ({selectedMode.toUpperCase()})...</span>
            </>
          ) : (
            <>
              <Film className="w-4 h-4" />
              <span>Generate Visuals for Project</span>
            </>
          )}
        </button>
      </div>

      {/* ── Master Preview Banner ── */}
      {masterPreviewUrl && (
        <div className="bg-[#121215] p-3 rounded-xl border border-emerald-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <p className="font-bold text-white text-xs">Master Visual Preview Ready</p>
              <p className="text-[10px] text-zinc-400">All scenes approved and stitched into master timeline.</p>
            </div>
          </div>
          <a
            href={masterPreviewUrl}
            target="_blank"
            rel="noreferrer"
            className="px-2.5 py-1.5 bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 rounded-md font-semibold text-[11px] hover:bg-emerald-600/30 flex items-center gap-1"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Play Master</span>
          </a>
        </div>
      )}

      {/* ── Scene Visual Cards ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white uppercase text-[11px] tracking-wider">
            Scene Visual Previews ({visualScenes.length})
          </h3>
          <span className="text-[10px] text-zinc-400">Preview Before Final Approval</span>
        </div>

        {visualScenes.length === 0 && !loading && (
          <div className="p-6 text-center border border-dashed border-[#2E2E38] rounded-xl text-zinc-500">
            Click &quot;Generate Visuals for Project&quot; above to create scene previews.
          </div>
        )}

        {visualScenes.map((scene, idx) => {
          const sid = scene.sceneId || `scn_${idx + 1}`;
          const isRegen = regeneratingSceneId === sid;
          const status = scene.status || 'preview_ready';
          const isApproved = status === 'approved';
          const isRejected = status === 'rejected';

          return (
            <div
              key={sid}
              className={`p-3 bg-[#18181C] rounded-xl border transition-all space-y-2.5 ${
                isApproved
                  ? 'border-emerald-500/40 bg-emerald-950/10'
                  : isRejected
                  ? 'border-red-500/40 bg-red-950/10'
                  : 'border-[#24242A]'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-xs">Scene {scene.sceneNumber || idx + 1}</span>
                  <span className="text-[9px] bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded font-mono">
                    v{scene.version || scene.activeVersion || 1}
                  </span>
                  <span className="text-[9px] bg-blue-900/40 text-blue-300 px-1.5 py-0.5 rounded font-mono uppercase">
                    {scene.modeUsed || scene.modeRequested || 'media'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {(scene.duration || 3.5).toFixed(1)}s
                  </span>
                  {isApproved && (
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Approved
                    </span>
                  )}
                  {isRejected && (
                    <span className="text-[10px] text-red-400 font-bold flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> Rejected
                    </span>
                  )}
                </div>
              </div>

              {/* Video Preview or Poster */}
              <div className="relative aspect-[9/16] max-h-56 w-full rounded-lg bg-black/60 overflow-hidden border border-[#2A2A34] flex items-center justify-center">
                {scene.videoUrl ? (
                  <video
                    src={scene.videoUrl}
                    controls
                    playsInline
                    className="w-full h-full object-contain"
                  />
                ) : scene.thumbnailUrl ? (
                  <img
                    src={scene.thumbnailUrl}
                    alt={`Scene ${scene.sceneNumber}`}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-zinc-500 text-center">
                    <Film className="w-6 h-6 mx-auto mb-1 opacity-50" />
                    <span>No Preview Available</span>
                  </div>
                )}
              </div>

              {/* Quality & Diagnostics */}
              <div className="flex items-center justify-between text-[10px] text-zinc-400 bg-[#121215] p-2 rounded-lg">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Quality Score:</span>
                  <span className="font-bold text-white">
                    {Math.round((scene.quality?.overallScore || scene.qualityScore || 0.90) * 100)}%
                  </span>
                </div>
                <span className="text-zinc-500">1080p • 30fps • H.264</span>
              </div>

              {/* Rejection Note */}
              {scene.rejectionReason && (
                <div className="text-[10px] text-red-300 bg-red-950/30 p-2 rounded-lg border border-red-900/40 flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                  <span>{scene.rejectionReason}</span>
                </div>
              )}

              {/* Controls: Approve / Reject / Regenerate */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#24242A]">
                <div className="flex items-center gap-1.5">
                  <select
                    value={regenModeOverride[sid] || scene.modeUsed || 'media'}
                    onChange={(e) =>
                      setRegenModeOverride((prev) => ({
                        ...prev,
                        [sid]: e.target.value as VisualProductionMode,
                      }))
                    }
                    className="bg-[#202026] text-zinc-300 text-[10px] px-2 py-1 rounded border border-[#2E2E38] outline-none"
                  >
                    <option value="media">Mode: Media</option>
                    <option value="three_d">Mode: 3D</option>
                    <option value="hybrid">Mode: Hybrid</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => handleRegenerateScene(sid)}
                    disabled={isRegen}
                    className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-[10px] font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <RotateCcw className={`w-3 h-3 ${isRegen ? 'animate-spin' : ''}`} />
                    <span>Regen</span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleApproveScene(sid, false)}
                    className="px-2 py-1 bg-red-900/20 hover:bg-red-900/40 text-red-300 border border-red-800/40 rounded text-[10px] font-semibold cursor-pointer"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApproveScene(sid, true)}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold cursor-pointer"
                  >
                    Approve
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};


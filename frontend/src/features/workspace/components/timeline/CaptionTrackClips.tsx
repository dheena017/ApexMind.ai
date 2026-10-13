import React from 'react';
import { Check } from 'lucide-react';
import { LaneSubtitle, SelectedClip } from './timelineTypes';

export interface CaptionTrackClipsProps {
  captionLanes: LaneSubtitle[];
  captionMaxLane: number;
  captionTrackHeight: number;
  laneHeight: number;
  laneGap: number;
  totalDuration: number;
  selectedClip?: SelectedClip | null;
  captionsTrackLocked: boolean;
  editingClipIndex: number | null;
  editingText: string;
  setEditingText: (text: string) => void;
  onSelectClip: (index: number, start: number) => void;
  onDoubleClickClip: (index: number, text: string) => void;
  onSaveInlineText: (index: number) => void;
  onCancelInlineEdit: () => void;
  onPointerDownMove: (e: React.PointerEvent<HTMLDivElement>, index: number, start: number, duration: number) => void;
  onPointerDownTrimLeft: (e: React.PointerEvent<HTMLDivElement>, index: number, start: number, duration: number) => void;
  onPointerDownTrimRight: (e: React.PointerEvent<HTMLDivElement>, index: number, start: number, duration: number) => void;
}

export const CaptionTrackClips: React.FC<CaptionTrackClipsProps> = ({
  captionLanes,
  captionMaxLane,
  captionTrackHeight,
  laneHeight,
  laneGap,
  totalDuration,
  selectedClip,
  captionsTrackLocked,
  editingClipIndex,
  editingText,
  setEditingText,
  onSelectClip,
  onDoubleClickClip,
  onSaveInlineText,
  onCancelInlineEdit,
  onPointerDownMove,
  onPointerDownTrimLeft,
  onPointerDownTrimRight,
}) => {
  return (
    <div
      className="border-b border-[#262626] p-1 relative transition-all"
      style={{ height: `${captionTrackHeight}px` }}
    >
      {captionLanes.map((clip) => {
        const index = clip.origIndex;
        const startPct = (clip.start / totalDuration) * 100;
        const widthPct = Math.max(3, ((clip.duration || 3) / totalDuration) * 100);
        const isSelected = selectedClip?.track === 'caption' && selectedClip.index === index;
        const isEditing = editingClipIndex === index;
        // Lane 0 is base row (bottom), higher lanes are positioned ABOVE!
        const topPos = 4 + (captionMaxLane - clip.lane) * (laneHeight + laneGap);

        return (
          <div
            key={index}
            onClick={() => onSelectClip(index, clip.start)}
            onDoubleClick={() => onDoubleClickClip(index, clip.text)}
            onPointerDown={(e) => onPointerDownMove(e, index, clip.start, clip.duration || 3)}
            className={`absolute rounded-md px-2 flex items-center justify-between border select-none group cursor-grab active:cursor-grabbing transition-all overflow-hidden ${
              isSelected
                ? 'timeline-clip-selected-blue bg-[#3B82F6]/75 border-[#60A5FA] text-white z-20 ring-2 ring-[#60A5FA]/90 shadow-xl'
                : 'bg-[#1E293B]/85 hover:bg-[#1E293B] border-blue-500/40 text-blue-100 hover:border-blue-400/70 z-10'
            }`}
            style={{
              left: `${startPct}%`,
              width: `${widthPct}%`,
              top: `${topPos}px`,
              height: `${laneHeight}px`,
            }}
            title={`"${clip.text}" (${clip.lane > 0 ? `Layer ${clip.lane + 1} (Above)` : 'Base Layer'}) - Drag to move or trim`}
          >
            {/* Left Trim Handle */}
            {!captionsTrackLocked && (
              <div
                onPointerDown={(e) => onPointerDownTrimLeft(e, index, clip.start, clip.duration || 3)}
                className="timeline-trim-handle-left bg-blue-400/40 hover:bg-blue-400 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Drag to trim start time"
              >
                <div className="w-0.5 h-3 bg-white rounded-full" />
              </div>
            )}

            {/* Caption Text or Inline Editor */}
            {isEditing ? (
              <div
                className="flex items-center gap-1 w-full pl-2 pr-2 z-30"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="text"
                  value={editingText}
                  autoFocus
                  onChange={(e) => setEditingText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') onSaveInlineText(index);
                    if (e.key === 'Escape') onCancelInlineEdit();
                  }}
                  onBlur={() => onSaveInlineText(index)}
                  className="w-full bg-black/80 border border-blue-400 rounded px-1.5 py-0.5 text-[10px] text-white font-mono-studio outline-none"
                />
                <button
                  type="button"
                  onClick={() => onSaveInlineText(index)}
                  className="p-0.5 text-emerald-400 hover:text-white"
                >
                  <Check className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <>
                <span className="text-[10px] font-mono-studio truncate leading-tight pointer-events-none pl-1">
                  "{clip.text}"
                </span>
                <span className="text-[8px] font-mono-studio text-blue-200/90 shrink-0 ml-1 pointer-events-none pr-1 font-bold">
                  {(clip.duration || 3).toFixed(1)}s
                </span>
              </>
            )}

            {/* Right Trim Handle */}
            {!captionsTrackLocked && (
              <div
                onPointerDown={(e) => onPointerDownTrimRight(e, index, clip.start, clip.duration || 3)}
                className="timeline-trim-handle-right bg-blue-400/40 hover:bg-blue-400 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Drag to trim duration"
              >
                <div className="w-0.5 h-3 bg-white rounded-full" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default CaptionTrackClips;

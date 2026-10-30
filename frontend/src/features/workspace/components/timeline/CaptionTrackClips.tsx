import React, { useState, useCallback } from 'react';
import { Check, Type } from 'lucide-react';
import { LaneSubtitle, SelectedClip } from './timelineTypes';
import { TimelineClipContextMenu } from './TimelineClipContextMenu';

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
  onSelectClip: (index: number) => void;
  onDoubleClickClip: (index: number, text: string) => void;
  onSaveInlineText: (index: number) => void;
  onCancelInlineEdit: () => void;
  onPointerDownMove: (e: React.PointerEvent<HTMLDivElement>, index: number, start: number, duration: number) => void;
  onPointerDownTrimLeft: (e: React.PointerEvent<HTMLDivElement>, index: number, start: number, duration: number) => void;
  onPointerDownTrimRight: (e: React.PointerEvent<HTMLDivElement>, index: number, start: number, duration: number) => void;
  // Context menu actions
  onDeleteCaption?: (index: number) => void;
  onDuplicateCaption?: (index: number) => void;
  onSplitCaption?: (index: number) => void;
  onEditCaption?: (index: number, text: string) => void;
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
  onDeleteCaption,
  onDuplicateCaption,
  onSplitCaption,
  onEditCaption,
}) => {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; index: number } | null>(null);
  const [colorLabels, setColorLabels] = useState<Record<number, string>>({});

  const handleContextMenu = useCallback((e: React.MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    onSelectClip(index);
    setContextMenu({ x: e.clientX, y: e.clientY, index });
  }, [onSelectClip]);

  const handleColorLabel = useCallback((index: number, color: string) => {
    setColorLabels((prev) => ({ ...prev, [index]: color }));
  }, []);

  const handleCopyTimings = useCallback((clip: LaneSubtitle) => {
    const text = `Start: ${(Number(clip.start) || 0).toFixed(2)}s | Duration: ${(Number(clip.duration) || 3).toFixed(2)}s | End: {((Number(clip.start) || 0) + (Number(clip.duration) || 3)).toFixed(2)}s | Text: "${clip.text}"`;
    navigator.clipboard.writeText(text).catch(() => { });
  }, []);

  return (
    <div
      className="box-border border-b border-[#242426] p-1 relative w-full transition-all"
      style={{ height: `${captionTrackHeight}px` }}
    >
      {captionLanes.map((clip) => {
        const index = clip.origIndex;
        const clipDur = typeof clip.duration === 'number' && clip.duration > 0 ? clip.duration : 1.5;
        const startPct = (clip.start / totalDuration) * 100;
        const widthPct = Math.max(0.01, (clipDur / totalDuration) * 100);
        const isAllSelected = selectedClip?.track === 'caption' && Boolean(selectedClip.all);
        const isSingleSelected = selectedClip?.track === 'caption' && !selectedClip.all && selectedClip.index === index;
        const isSelected = isAllSelected || isSingleSelected;
        const isEditing = editingClipIndex === index;
        const clipColor = clip.color || colorLabels[index] || '';
        // Lane 0 is base row (bottom), higher lanes are positioned ABOVE!
        const topPos = 4 + (captionMaxLane - clip.lane) * (laneHeight + laneGap);

        return (
          <div
            key={`${index}-${clip.start.toFixed(2)}`}
            onClick={() => onSelectClip(index)}
            onDoubleClick={() => onDoubleClickClip(index, clip.text)}
            onPointerDown={(e) => onPointerDownMove(e, index, clip.start, clipDur)}
            onContextMenu={(e) => handleContextMenu(e, index)}
            className={`timeline-clip-card absolute rounded-md px-1.5 flex items-center justify-between border select-none group cursor-grab active:cursor-grabbing transition-all overflow-hidden ${isSingleSelected
                ? 'bg-[#0E3538] border-teal-300 text-white z-20'
                : isAllSelected
                ? 'bg-[#0E3538] border-teal-400 text-white z-20'
                : 'bg-[#0A2224] hover:bg-[#0E2E31] border-teal-500/30 text-teal-100 z-10'
              }`}
            style={{
              left: `${startPct}%`,
              width: `${widthPct}%`,
              minWidth: '44px',
              top: `${topPos}px`,
              height: `${laneHeight}px`,
            }}
            title={`"${clip.text}" (${clip.lane > 0 ? `Layer ${clip.lane + 1} (Above)` : 'Base Layer'}) - Drag to move or trim. Right-click for options.`}
          >
            {/* Left Trim Handle */}
            {!captionsTrackLocked && (
              <div
                onPointerDown={(e) => {
                  e.stopPropagation();
                  onPointerDownTrimLeft(e, index, clip.start, clipDur);
                }}
                className="timeline-trim-handle-left bg-teal-400/40 hover:bg-teal-400 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Drag to trim start time"
              >
                <div className="w-0.5 h-3 bg-white rounded-full" />
              </div>
            )}

            {/* Caption Text or Inline Editor */}
            {isEditing ? (
              <div
                className="flex items-center gap-1 w-full pl-1 pr-1 z-30"
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
                  className="w-full bg-black/80 border border-teal-400 rounded px-1.5 py-0.5 text-[10px] text-white font-mono-studio outline-none"
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
              <div className="flex items-center gap-1.5 w-full min-w-0 overflow-hidden px-1.5 select-none">
                <Type className="w-3 h-3 text-teal-300/90 shrink-0 pointer-events-none" />
                <span className="text-[10px] font-bold text-teal-100 truncate tracking-tight flex-1 min-w-0 pointer-events-none">
                  {clip.text}
                </span>
              </div>
            )}

            {/* Right Trim Handle */}
            {!captionsTrackLocked && (
              <div
                onPointerDown={(e) => {
                  e.stopPropagation();
                  onPointerDownTrimRight(e, index, clip.start, clip.duration || 3);
                }}
                className="timeline-trim-handle-right bg-teal-400/40 hover:bg-teal-400 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Drag to trim duration"
              >
                <div className="w-0.5 h-3 bg-white rounded-full" />
              </div>
            )}
          </div>
        );
      })}

      {/* Per-clip Right-click Context Menu (rendered outside clip divs to avoid overflow clipping) */}
      {contextMenu !== null && (() => {
        const clip = captionLanes.find((c) => c.origIndex === contextMenu.index);
        return (
          <TimelineClipContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            trackType="caption"
            isVisible
            isLocked={captionsTrackLocked}
            onClose={() => setContextMenu(null)}
            onDelete={
              !captionsTrackLocked && onDeleteCaption
                ? () => { onDeleteCaption(contextMenu.index); setContextMenu(null); }
                : undefined
            }
            onDuplicate={
              !captionsTrackLocked && onDuplicateCaption
                ? () => { onDuplicateCaption(contextMenu.index); setContextMenu(null); }
                : undefined
            }
            onSplit={
              !captionsTrackLocked && onSplitCaption
                ? () => { onSplitCaption(contextMenu.index); setContextMenu(null); }
                : undefined
            }
            onRename={
              !captionsTrackLocked && onEditCaption && clip
                ? () => { onEditCaption(contextMenu.index, clip.text); setContextMenu(null); }
                : undefined
            }
            onColorLabel={
              !captionsTrackLocked
                ? (color) => { handleColorLabel(contextMenu.index, color); setContextMenu(null); }
                : undefined
            }
            onCopyTimings={
              clip ? () => { handleCopyTimings(clip); setContextMenu(null); } : undefined
            }
          />
        );
      })()}
    </div>
  );
};

export default CaptionTrackClips;

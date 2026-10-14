import React, { useState, useCallback } from 'react';
import { Check } from 'lucide-react';
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
  onSelectClip: (index: number, start: number) => void;
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

  const handleContextMenu = useCallback((e: React.MouseEvent, index: number, start: number) => {
    e.preventDefault();
    e.stopPropagation();
    onSelectClip(index, start);
    setContextMenu({ x: e.clientX, y: e.clientY, index });
  }, [onSelectClip]);

  const handleColorLabel = useCallback((index: number, color: string) => {
    setColorLabels((prev) => ({ ...prev, [index]: color }));
  }, []);

  const handleCopyTimings = useCallback((clip: LaneSubtitle) => {
    const text = `Start: ${clip.start.toFixed(2)}s | Duration: ${(clip.duration || 3).toFixed(2)}s | End: ${(clip.start + (clip.duration || 3)).toFixed(2)}s | Text: "${clip.text}"`;
    navigator.clipboard.writeText(text).catch(() => {});
  }, []);

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
        const clipColor = colorLabels[index] || '';
        // Lane 0 is base row (bottom), higher lanes are positioned ABOVE!
        const topPos = 4 + (captionMaxLane - clip.lane) * (laneHeight + laneGap);

        return (
          <div
            key={index}
            onClick={() => onSelectClip(index, clip.start)}
            onDoubleClick={() => onDoubleClickClip(index, clip.text)}
            onPointerDown={(e) => onPointerDownMove(e, index, clip.start, clip.duration || 3)}
            onContextMenu={(e) => handleContextMenu(e, index, clip.start)}
            className={`absolute rounded-md px-2 flex items-center justify-between border select-none group cursor-grab active:cursor-grabbing transition-all overflow-hidden ${
              isSelected
                ? 'bg-[#1A1A1A] border-[#3A3A3A] text-white z-20 outline outline-1 outline-[#3A3A3A]'
                : 'bg-[#1A1A1A]/80 hover:bg-[#1C1C1C] border-[#2F2F2F] text-[#E5E5E5] hover:border-[#3A3A3A] z-10'
            }`}
            style={{
              left: `${startPct}%`,
              width: `${widthPct}%`,
              top: `${topPos}px`,
              height: `${laneHeight}px`,
              ...(clipColor ? { boxShadow: `inset 0 0 0 2px ${clipColor}40, 0 0 0 1px ${clipColor}` } : {}),
            }}
            title={`"${clip.text}" (${clip.lane > 0 ? `Layer ${clip.lane + 1} (Above)` : 'Base Layer'}) - Drag to move or trim. Right-click for options.`}
          >
            {/* Color Label Strip */}
            {clipColor && (
              <div
                className="absolute top-0 left-0 right-0 h-0.5 z-30 rounded-t-md"
                style={{ background: clipColor }}
              />
            )}

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

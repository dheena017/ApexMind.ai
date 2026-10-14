import React, { useRef, useState, useEffect } from 'react';
import { Type } from 'lucide-react';
import { ScriptSubtitle } from '../../types';
import {
  StudioTimelinePaneProps,
  formatTime,
  computeCaptionLanes,
  SelectedClip,
  DragAction,
  EnabledTracks,
} from './timelineTypes';
import { TimelineToolbar } from './TimelineToolbar';
import { TimelineTrackHeaders } from './TimelineTrackHeaders';
import { TimelineRuler } from './TimelineRuler';
import { VideoTrackClip } from './VideoTrackClip';
import { ImageTrackClip } from './ImageTrackClip';
import { OverlayTrackClip } from './OverlayTrackClip';
import { CaptionTrackClips } from './CaptionTrackClips';
import { AudioTrackClip } from './AudioTrackClip';
import { TimelineClipContextMenu } from './TimelineClipContextMenu';

export const StudioTimelinePane: React.FC<StudioTimelinePaneProps> = ({
  currentTime,
  duration,
  isPlaying,
  onTogglePlay,
  onSeek,
  script,
  onUpdateSubtitles,
  activeBackdrop,
  selectedVoice,
  selectedMusic,
  audioUrl,
  customImageUrl,
  customVideoUrl,
  activeElementOverlay,
  onSelectCompound,
  voices = [],
  musicTracks = [],
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [snapGuideTime, setSnapGuideTime] = useState<number | null>(null);

  // Available tracks corresponding to Left-Panel categories
  const [enabledTracks, setEnabledTracks] = useState<EnabledTracks>({
    video: true,
    image: false,
    overlay: true,
    captions: true,
    title: false,
    voice: true,
    music: true,
    sfx: false,
  });

  const [addTrackMenuOpen, setAddTrackMenuOpen] = useState(false);

  // Visibility, Lock, and Mute state per track
  const [videoTrackVisible, setVideoTrackVisible] = useState(true);
  const [imageTrackVisible, setImageTrackVisible] = useState(true);
  const [overlayTrackVisible, setOverlayTrackVisible] = useState(true);
  const [captionsTrackLocked, setCaptionsTrackLocked] = useState(false);
  const [titleTrackLocked, setTitleTrackLocked] = useState(false);
  const [voiceTrackMuted, setVoiceTrackMuted] = useState(false);
  const [musicTrackMuted, setMusicTrackMuted] = useState(false);
  const [sfxTrackMuted, setSfxTrackMuted] = useState(false);

  // Active clip selection across any compound track
  const [selectedClip, setSelectedClip] = useState<SelectedClip | null>(null);

  // Moveable / trimmable timing states for all tracks
  const [videoStart, setVideoStart] = useState<number>(0);
  const [videoDuration, setVideoDuration] = useState<number>(12.1);

  const [imageStart, setImageStart] = useState<number>(0);
  const [imageDuration, setImageDuration] = useState<number>(8.0);

  const [overlayStart, setOverlayStart] = useState<number>(1.5);
  const [overlayDuration, setOverlayDuration] = useState<number>(6.0);

  const [titleStart, setTitleStart] = useState<number>(0);
  const [titleDuration, setTitleDuration] = useState<number>(3.5);

  const [voiceStart, setVoiceStart] = useState<number>(0);
  const [voiceDuration, setVoiceDuration] = useState<number>(12.1);

  const [musicStart, setMusicStart] = useState<number>(0);
  const [musicDuration, setMusicDuration] = useState<number>(15.0);

  const [sfxStart, setSfxStart] = useState<number>(0.2);
  const [sfxDuration, setSfxDuration] = useState<number>(2.5);

  // Subtitle clips for fluid dragging, trimming, and editing
  const [localClips, setLocalClips] = useState<ScriptSubtitle[]>([]);
  const [editingClipIndex, setEditingClipIndex] = useState<number | null>(null);
  const [editingText, setEditingText] = useState<string>('');

  const [activeDrag, setActiveDrag] = useState<DragAction>(null);
  const [dragTooltip, setDragTooltip] = useState<string | null>(null);

  const tracksContainerRef = useRef<HTMLDivElement>(null);
  const isDraggingPlayhead = useRef<boolean>(false);

  const totalDuration = Math.max(0.1, duration > 0 ? duration : 30);
  const progressPercent = Math.min(100, Math.max(0, (currentTime / totalDuration) * 100));

  // Dynamic Lane Stacking for Captions (prevent text overlapping; overlapping clips sit ABOVE)
  const { lanes: captionLanes, maxLane: captionMaxLane } = computeCaptionLanes(localClips);
  const laneHeight = 32;
  const laneGap = 4;
  const captionTrackHeight = Math.max(40, (captionMaxLane + 1) * (laneHeight + laneGap) + 4);

  // Auto-enable Image track if customImageUrl is chosen
  useEffect(() => {
    if (customImageUrl) {
      setEnabledTracks((prev) => ({ ...prev, image: true }));
      setImageTrackVisible(true);
    }
  }, [customImageUrl]);

  // Auto-enable Overlay track if activeElementOverlay is selected
  useEffect(() => {
    if (activeElementOverlay) {
      setEnabledTracks((prev) => ({ ...prev, overlay: true }));
    }
  }, [activeElementOverlay]);

  // Sync script subtitles into local clips
  useEffect(() => {
    if (script.subtitles && script.subtitles.length > 0) {
      setLocalClips(script.subtitles);
    } else {
      setLocalClips([]);
    }
  }, [script.subtitles]);

  // Sync initial video / voice length to duration
  useEffect(() => {
    if (duration > 0) {
      setVideoDuration(duration);
      setVoiceDuration(duration);
    }
  }, [duration]);

  // ── Broadcast timeline state to VideoPreviewPane via CustomEvent ──────
  // Fired whenever any visibility/mute/trim/enabled state changes so the
  // preview canvas can reflect the current timeline configuration in real time.
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('workspace:timeline-state', {
        detail: {
          // Visibility / enabled
          videoVisible: enabledTracks.video && videoTrackVisible,
          imageVisible: enabledTracks.image && imageTrackVisible,
          overlayVisible: enabledTracks.overlay && overlayTrackVisible,
          captionsVisible: enabledTracks.captions,
          titleVisible: enabledTracks.title,
          // Mute
          voiceMuted: voiceTrackMuted || !enabledTracks.voice,
          musicMuted: musicTrackMuted || !enabledTracks.music,
          // Clip timing (for trim offset playback)
          videoStart,
          videoDuration,
          videoEnabled: enabledTracks.video,
          imageStart,
          imageDuration,
          overlayStart,
          overlayDuration,
          titleStart,
          titleDuration,
          // Track enabled flags
          enabledTracks,
        },
      })
    );
  }, [
    enabledTracks,
    videoTrackVisible,
    imageTrackVisible,
    overlayTrackVisible,
    voiceTrackMuted,
    musicTrackMuted,
    videoStart,
    videoDuration,
    imageStart,
    imageDuration,
    overlayStart,
    overlayDuration,
    titleStart,
    titleDuration,
  ]);


  // Magnetic Snapping Calculation Helper
  const calculateSnap = (
    targetTime: number,
    candidatePoints: number[],
    tolerance: number = 0.25
  ): { value: number; snapped: boolean; snapPoint?: number } => {
    if (!snapEnabled) return { value: targetTime, snapped: false };
    for (const pt of candidatePoints) {
      if (Math.abs(targetTime - pt) <= tolerance) {
        return { value: pt, snapped: true, snapPoint: pt };
      }
    }
    return { value: targetTime, snapped: false };
  };

  // Playhead scrub drag handler
  const handleRulerPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingPlayhead.current = true;
    updateTimeFromPointer(e);
  };

  const updateTimeFromPointer = (e: React.PointerEvent<HTMLDivElement> | PointerEvent) => {
    if (!tracksContainerRef.current) return;
    const rect = tracksContainerRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onSeek(ratio * totalDuration);
  };

  // Select clip and trigger inspector event
  const handleSelectClip = (
    clip: SelectedClip,
    compound?: 'video' | 'text' | 'voice' | 'music' | 'overlay'
  ) => {
    setSelectedClip(clip);
    if (compound) {
      onSelectCompound?.(compound);
      window.dispatchEvent(new CustomEvent('workspace:select-compound', { detail: compound }));
    }
  };

  // Enable track from Left Panel
  const handleEnableTrack = (
    trackKey: keyof EnabledTracks,
    selected: SelectedClip,
    compound: 'video' | 'text' | 'voice' | 'music' | 'overlay'
  ) => {
    setEnabledTracks((p) => ({ ...p, [trackKey]: true }));
    handleSelectClip(selected, compound);
  };

  // Keyboard Shortcuts: Space (Play/Pause), Del (Delete), Ctrl+D (Duplicate), Ctrl+B (Split), Arrows (Nudge)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        editingClipIndex !== null
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        onTogglePlay();
      } else if (e.code === 'Delete' || e.code === 'Backspace') {
        if (selectedClip) {
          e.preventDefault();
          handleDeleteClip();
        }
      } else if ((e.ctrlKey || e.metaKey) && (e.code === 'KeyD' || e.key === 'd')) {
        if (selectedClip) {
          e.preventDefault();
          handleDuplicateClip();
        }
      } else if (((e.ctrlKey || e.metaKey) && (e.code === 'KeyB' || e.key === 'b')) || e.code === 'KeyS') {
        e.preventDefault();
        handleSplitClip();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        onSeek(Math.max(0, currentTime - 0.1));
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        onSeek(Math.min(totalDuration, currentTime + 0.1));
      } else if (e.code === 'Escape') {
        setSelectedClip(null);
        setEditingClipIndex(null);
        setAddTrackMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedClip, currentTime, totalDuration, onTogglePlay, onSeek, captionsTrackLocked, localClips]);

  // Global Pointer Listeners for Playhead & Moveable Track Clips
  useEffect(() => {
    const handleGlobalPointerMove = (e: PointerEvent) => {
      if (isDraggingPlayhead.current) {
        updateTimeFromPointer(e);
        return;
      }

      if (!activeDrag || !tracksContainerRef.current) return;

      const rect = tracksContainerRef.current.getBoundingClientRect();
      const pxPerSec = rect.width / totalDuration;
      const deltaSec = (e.clientX - activeDrag.startX) / pxPerSec;

      // Candidate points for magnetic snapping
      const snapPoints = [
        0,
        currentTime,
        videoStart,
        videoStart + videoDuration,
        imageStart,
        imageStart + imageDuration,
        overlayStart,
        overlayStart + overlayDuration,
        ...localClips.flatMap((c) => [c.start, c.start + (c.duration || 3)]),
      ];

      if (activeDrag.kind === 'subtitle') {
        const { index, mode, origStart, origDuration } = activeDrag;
        setLocalClips((prev) => {
          const updated = [...prev];
          const target = { ...updated[index] };

          if (mode === 'move') {
            const rawStart = origStart + deltaSec;
            const snapRes = calculateSnap(rawStart, snapPoints);
            const nextStart = Math.max(0, Math.min(totalDuration - target.duration, snapRes.value));
            target.start = parseFloat(nextStart.toFixed(2));
            setSnapGuideTime(snapRes.snapped ? snapRes.snapPoint! : null);
            setDragTooltip(
              `▶ Captions [${index + 1}] • Start: ${target.start.toFixed(1)}s • Dur: ${target.duration.toFixed(1)}s${
                snapRes.snapped ? ' 🧲 Snapped' : ''
              }`
            );
          } else if (mode === 'trim-left') {
            const rawStart = origStart + deltaSec;
            const snapRes = calculateSnap(rawStart, snapPoints);
            const nextStart = Math.max(0, Math.min(origStart + origDuration - 0.3, snapRes.value));
            const nextDuration = origDuration - (nextStart - origStart);
            target.start = parseFloat(nextStart.toFixed(2));
            target.duration = parseFloat(Math.max(0.3, nextDuration).toFixed(2));
            setSnapGuideTime(snapRes.snapped ? snapRes.snapPoint! : null);
            setDragTooltip(
              `◀ Trim In: ${target.start.toFixed(1)}s • Dur: ${target.duration.toFixed(1)}s${
                snapRes.snapped ? ' 🧲 Snapped' : ''
              }`
            );
          } else if (mode === 'trim-right') {
            const rawEnd = origStart + origDuration + deltaSec;
            const snapRes = calculateSnap(rawEnd, snapPoints);
            const nextEnd = Math.max(target.start + 0.3, Math.min(totalDuration, snapRes.value));
            target.duration = parseFloat((nextEnd - target.start).toFixed(2));
            setSnapGuideTime(snapRes.snapped ? snapRes.snapPoint! : null);
            setDragTooltip(
              `▶ Trim Out: ${nextEnd.toFixed(1)}s • Dur: ${target.duration.toFixed(1)}s${
                snapRes.snapped ? ' 🧲 Snapped' : ''
              }`
            );
          }

          updated[index] = target;
          return updated;
        });
      } else if (activeDrag.kind === 'video') {
        if (activeDrag.mode === 'move') {
          const rawStart = activeDrag.origStart + deltaSec;
          const snapRes = calculateSnap(rawStart, snapPoints);
          const nextStart = Math.max(0, Math.min(totalDuration - videoDuration, snapRes.value));
          setVideoStart(parseFloat(nextStart.toFixed(2)));
          setSnapGuideTime(snapRes.snapped ? snapRes.snapPoint! : null);
          setDragTooltip(
            `▶ V1 Video • Start: ${nextStart.toFixed(1)}s • Dur: ${videoDuration.toFixed(1)}s${
              snapRes.snapped ? ' 🧲 Snapped' : ''
            }`
          );
        } else if (activeDrag.mode === 'trim-left') {
          const rawStart = activeDrag.origStart + deltaSec;
          const snapRes = calculateSnap(rawStart, snapPoints);
          const nextStart = Math.max(0, Math.min(activeDrag.origStart + activeDrag.origDuration - 0.5, snapRes.value));
          const nextDuration = activeDrag.origDuration - (nextStart - activeDrag.origStart);
          setVideoStart(parseFloat(nextStart.toFixed(2)));
          setVideoDuration(parseFloat(Math.max(0.5, nextDuration).toFixed(2)));
          setSnapGuideTime(snapRes.snapped ? snapRes.snapPoint! : null);
          setDragTooltip(`◀ V1 Trim In: ${nextStart.toFixed(1)}s • Dur: ${nextDuration.toFixed(1)}s`);
        } else if (activeDrag.mode === 'trim-right') {
          const rawEnd = activeDrag.origStart + activeDrag.origDuration + deltaSec;
          const snapRes = calculateSnap(rawEnd, snapPoints);
          const nextEnd = Math.max(videoStart + 0.5, Math.min(totalDuration, snapRes.value));
          const nextDuration = nextEnd - videoStart;
          setVideoDuration(parseFloat(nextDuration.toFixed(2)));
          setSnapGuideTime(snapRes.snapped ? snapRes.snapPoint! : null);
          setDragTooltip(`▶ V1 Trim Out: ${nextEnd.toFixed(1)}s • Dur: ${nextDuration.toFixed(1)}s`);
        }
      } else if (activeDrag.kind === 'image') {
        if (activeDrag.mode === 'move') {
          const rawStart = activeDrag.origStart + deltaSec;
          const snapRes = calculateSnap(rawStart, snapPoints);
          const nextStart = Math.max(0, Math.min(totalDuration - imageDuration, snapRes.value));
          setImageStart(parseFloat(nextStart.toFixed(2)));
          setSnapGuideTime(snapRes.snapped ? snapRes.snapPoint! : null);
          setDragTooltip(`▶ V2 Image • Start: ${nextStart.toFixed(1)}s`);
        } else if (activeDrag.mode === 'trim-left') {
          const rawStart = activeDrag.origStart + deltaSec;
          const nextStart = Math.max(0, Math.min(activeDrag.origStart + activeDrag.origDuration - 0.5, rawStart));
          const nextDuration = activeDrag.origDuration - (nextStart - activeDrag.origStart);
          setImageStart(parseFloat(nextStart.toFixed(2)));
          setImageDuration(parseFloat(Math.max(0.5, nextDuration).toFixed(2)));
        } else if (activeDrag.mode === 'trim-right') {
          const rawEnd = activeDrag.origStart + activeDrag.origDuration + deltaSec;
          const nextEnd = Math.max(imageStart + 0.5, Math.min(totalDuration, rawEnd));
          setImageDuration(parseFloat((nextEnd - imageStart).toFixed(2)));
        }
      } else if (activeDrag.kind === 'overlay') {
        if (activeDrag.mode === 'move') {
          const rawStart = activeDrag.origStart + deltaSec;
          const snapRes = calculateSnap(rawStart, snapPoints);
          const nextStart = Math.max(0, Math.min(totalDuration - overlayDuration, snapRes.value));
          setOverlayStart(parseFloat(nextStart.toFixed(2)));
          setSnapGuideTime(snapRes.snapped ? snapRes.snapPoint! : null);
          setDragTooltip(`▶ O1 Overlay • Start: ${nextStart.toFixed(1)}s`);
        } else if (activeDrag.mode === 'trim-left') {
          const rawStart = activeDrag.origStart + deltaSec;
          const nextStart = Math.max(0, Math.min(activeDrag.origStart + activeDrag.origDuration - 0.5, rawStart));
          const nextDuration = activeDrag.origDuration - (nextStart - activeDrag.origStart);
          setOverlayStart(parseFloat(nextStart.toFixed(2)));
          setOverlayDuration(parseFloat(Math.max(0.5, nextDuration).toFixed(2)));
        } else if (activeDrag.mode === 'trim-right') {
          const rawEnd = activeDrag.origStart + activeDrag.origDuration + deltaSec;
          const nextEnd = Math.max(overlayStart + 0.5, Math.min(totalDuration, rawEnd));
          setOverlayDuration(parseFloat((nextEnd - overlayStart).toFixed(2)));
        }
      } else if (activeDrag.kind === 'title') {
        if (activeDrag.mode === 'move') {
          const rawStart = activeDrag.origStart + deltaSec;
          const nextStart = Math.max(0, Math.min(totalDuration - titleDuration, rawStart));
          setTitleStart(parseFloat(nextStart.toFixed(2)));
        } else if (activeDrag.mode === 'trim-right') {
          const rawEnd = activeDrag.origStart + activeDrag.origDuration + deltaSec;
          const nextEnd = Math.max(titleStart + 0.5, Math.min(totalDuration, rawEnd));
          setTitleDuration(parseFloat((nextEnd - titleStart).toFixed(2)));
        }
      } else if (activeDrag.kind === 'voice') {
        if (activeDrag.mode === 'move') {
          const rawStart = activeDrag.origStart + deltaSec;
          const snapRes = calculateSnap(rawStart, snapPoints);
          const nextStart = Math.max(0, Math.min(totalDuration - 0.5, snapRes.value));
          setVoiceStart(parseFloat(nextStart.toFixed(2)));
          setSnapGuideTime(snapRes.snapped ? snapRes.snapPoint! : null);
          setDragTooltip(`▶ A1 Voice Delay: ${nextStart.toFixed(1)}s`);
        } else if (activeDrag.mode === 'trim-left') {
          const rawStart = activeDrag.origStart + deltaSec;
          const snapRes = calculateSnap(rawStart, snapPoints);
          const nextStart = Math.max(0, Math.min(activeDrag.origStart + activeDrag.origDuration - 0.5, snapRes.value));
          const nextDuration = activeDrag.origDuration - (nextStart - activeDrag.origStart);
          setVoiceStart(parseFloat(nextStart.toFixed(2)));
          setVoiceDuration(parseFloat(Math.max(0.5, nextDuration).toFixed(2)));
          setSnapGuideTime(snapRes.snapped ? snapRes.snapPoint! : null);
          setDragTooltip(`◀ A1 Voice Trim In: ${nextStart.toFixed(1)}s`);
        } else if (activeDrag.mode === 'trim-right') {
          const rawEnd = activeDrag.origStart + activeDrag.origDuration + deltaSec;
          const snapRes = calculateSnap(rawEnd, snapPoints);
          const nextEnd = Math.max(voiceStart + 0.5, Math.min(totalDuration, snapRes.value));
          setVoiceDuration(parseFloat((nextEnd - voiceStart).toFixed(2)));
          setSnapGuideTime(snapRes.snapped ? snapRes.snapPoint! : null);
          setDragTooltip(`▶ A1 Voice Trim Out: ${nextEnd.toFixed(1)}s`);
        }
      } else if (activeDrag.kind === 'music') {
        if (activeDrag.mode === 'move') {
          const rawStart = activeDrag.origStart + deltaSec;
          const snapRes = calculateSnap(rawStart, snapPoints);
          const nextStart = Math.max(0, Math.min(totalDuration - 0.5, snapRes.value));
          setMusicStart(parseFloat(nextStart.toFixed(2)));
          setSnapGuideTime(snapRes.snapped ? snapRes.snapPoint! : null);
          setDragTooltip(`▶ A2 Music Beat Alignment: ${nextStart.toFixed(1)}s`);
        } else if (activeDrag.mode === 'trim-left') {
          const rawStart = activeDrag.origStart + deltaSec;
          const nextStart = Math.max(0, Math.min(activeDrag.origStart + activeDrag.origDuration - 0.5, rawStart));
          const nextDuration = activeDrag.origDuration - (nextStart - activeDrag.origStart);
          setMusicStart(parseFloat(nextStart.toFixed(2)));
          setMusicDuration(parseFloat(Math.max(0.5, nextDuration).toFixed(2)));
        } else if (activeDrag.mode === 'trim-right') {
          const rawEnd = activeDrag.origStart + activeDrag.origDuration + deltaSec;
          const nextEnd = Math.max(musicStart + 0.5, Math.min(totalDuration, rawEnd));
          setMusicDuration(parseFloat((nextEnd - musicStart).toFixed(2)));
        }
      } else if (activeDrag.kind === 'sfx') {
        if (activeDrag.mode === 'move') {
          const rawStart = activeDrag.origStart + deltaSec;
          const nextStart = Math.max(0, Math.min(totalDuration - sfxDuration, rawStart));
          setSfxStart(parseFloat(nextStart.toFixed(2)));
        } else if (activeDrag.mode === 'trim-right') {
          const rawEnd = activeDrag.origStart + activeDrag.origDuration + deltaSec;
          const nextEnd = Math.max(sfxStart + 0.3, Math.min(totalDuration, rawEnd));
          setSfxDuration(parseFloat((nextEnd - sfxStart).toFixed(2)));
        }
      }
    };

    const handleGlobalPointerUp = () => {
      if (isDraggingPlayhead.current) {
        isDraggingPlayhead.current = false;
      }
      if (activeDrag) {
        if (activeDrag.kind === 'subtitle' && onUpdateSubtitles) {
          onUpdateSubtitles(localClips);
        }
        setActiveDrag(null);
        setSnapGuideTime(null);
        setDragTooltip(null);
      }
    };

    window.addEventListener('pointermove', handleGlobalPointerMove);
    window.addEventListener('pointerup', handleGlobalPointerUp);
    return () => {
      window.removeEventListener('pointermove', handleGlobalPointerMove);
      window.removeEventListener('pointerup', handleGlobalPointerUp);
    };
  }, [
    activeDrag,
    totalDuration,
    currentTime,
    videoStart,
    videoDuration,
    imageStart,
    imageDuration,
    overlayStart,
    overlayDuration,
    titleStart,
    titleDuration,
    voiceStart,
    voiceDuration,
    musicStart,
    musicDuration,
    sfxStart,
    sfxDuration,
    localClips,
    snapEnabled,
    onUpdateSubtitles,
  ]);

  // Split selected clip at current playhead time
  const handleSplitClip = () => {
    if (!selectedClip) return;
    if (selectedClip.track === 'caption' && !captionsTrackLocked) {
      const clip = localClips[selectedClip.index];
      if (!clip) return;
      const clipEnd = clip.start + (clip.duration || 3);
      if (currentTime > clip.start + 0.2 && currentTime < clipEnd - 0.2) {
        const leftDuration = parseFloat((currentTime - clip.start).toFixed(2));
        const rightDuration = parseFloat((clipEnd - currentTime).toFixed(2));

        const words = clip.text.split(' ');
        const midWord = Math.ceil(words.length / 2);
        const textLeft = words.slice(0, midWord).join(' ') || clip.text;
        const textRight = words.slice(midWord).join(' ') || '...';

        const updated = [...localClips];
        updated[selectedClip.index] = { ...clip, text: textLeft, duration: leftDuration };
        updated.splice(selectedClip.index + 1, 0, {
          text: textRight,
          start: parseFloat(currentTime.toFixed(2)),
          duration: rightDuration,
        });

        setLocalClips(updated);
        onUpdateSubtitles?.(updated);
        setSelectedClip({ track: 'caption', index: selectedClip.index + 1 });
      }
    } else if (selectedClip.track === 'video') {
      if (currentTime > videoStart + 0.5 && currentTime < videoStart + videoDuration - 0.5) {
        setVideoDuration(parseFloat((currentTime - videoStart).toFixed(2)));
      }
    } else if (selectedClip.track === 'image') {
      if (currentTime > imageStart + 0.5 && currentTime < imageStart + imageDuration - 0.5) {
        setImageDuration(parseFloat((currentTime - imageStart).toFixed(2)));
      }
    } else if (selectedClip.track === 'overlay') {
      if (currentTime > overlayStart + 0.5 && currentTime < overlayStart + overlayDuration - 0.5) {
        setOverlayDuration(parseFloat((currentTime - overlayStart).toFixed(2)));
      }
    } else if (selectedClip.track === 'voice') {
      if (currentTime > voiceStart + 0.5 && currentTime < voiceStart + voiceDuration - 0.5) {
        setVoiceDuration(parseFloat((currentTime - voiceStart).toFixed(2)));
      }
    } else if (selectedClip.track === 'music') {
      if (currentTime > musicStart + 0.5 && currentTime < musicStart + musicDuration - 0.5) {
        setMusicDuration(parseFloat((currentTime - musicStart).toFixed(2)));
      }
    }
  };

  // Duplicate selected clip
  const handleDuplicateClip = () => {
    if (!selectedClip) return;
    if (selectedClip.track === 'caption') {
      if (captionsTrackLocked) return;
      const clip = localClips[selectedClip.index];
      if (!clip) return;
      const newStart = parseFloat((clip.start + (clip.duration || 3) + 0.1).toFixed(2));
      const duplicated: ScriptSubtitle = {
        text: `${clip.text} (Copy)`,
        start: newStart,
        duration: clip.duration || 3,
      };
      const updated = [...localClips, duplicated].sort((a, b) => a.start - b.start);
      setLocalClips(updated);
      onUpdateSubtitles?.(updated);
      setSelectedClip({ track: 'caption', index: updated.indexOf(duplicated) });
    } else if (selectedClip.track === 'video') {
      handleVideoDuplicate();
    } else if (selectedClip.track === 'image') {
      handleImageDuplicate();
    } else if (selectedClip.track === 'overlay') {
      handleOverlayDuplicate();
    }
  };

  // Add new caption at playhead
  const handleAddCaption = () => {
    if (captionsTrackLocked) return;
    const newStart = parseFloat(currentTime.toFixed(2));
    const newClip: ScriptSubtitle = {
      text: 'New Caption Cue',
      start: newStart,
      duration: 2.5,
    };
    const updated = [...localClips, newClip].sort((a, b) => a.start - b.start);
    setLocalClips(updated);
    onUpdateSubtitles?.(updated);
    setSelectedClip({ track: 'caption', index: updated.indexOf(newClip) });
  };

  // Delete selected clip (all tracks supported)
  const handleDeleteClip = () => {
    if (!selectedClip) return;
    if (selectedClip.track === 'caption') {
      if (captionsTrackLocked) return;
      const updated = localClips.filter((_, idx) => idx !== selectedClip.index);
      setLocalClips(updated);
      onUpdateSubtitles?.(updated);
      setSelectedClip(null);
      setEditingClipIndex(null);
    } else if (selectedClip.track === 'video') {
      handleVideoDelete();
    } else if (selectedClip.track === 'image') {
      handleImageDelete();
    } else if (selectedClip.track === 'overlay') {
      handleOverlayDelete();
    } else if (selectedClip.track === 'voice') {
      handleVoiceDelete();
    } else if (selectedClip.track === 'music') {
      handleMusicDelete();
    } else if (selectedClip.track === 'title') {
      handleTitleDelete();
    } else if (selectedClip.track === 'sfx') {
      handleSfxDelete();
    }
  };

  // ── Context menu handlers for non-caption tracks ──────────────────

  // Video track
  const handleVideoDelete = () => {
    setEnabledTracks((p) => ({ ...p, video: false }));
    setSelectedClip(null);
  };
  const handleVideoDuplicate = () => {
    // Offset duplicate slightly for visual distinction
    setVideoStart((s) => Math.min(totalDuration - videoDuration, s + 0.5));
  };
  const handleVideoZoom = () => {
    const ratio = (videoDuration / totalDuration) * 3;
    setZoomLevel(Math.min(3, Math.max(1, 1 / ratio)));
  };

  // Overlay track
  const handleOverlayDelete = () => {
    setEnabledTracks((p) => ({ ...p, overlay: false }));
    setSelectedClip(null);
  };
  const handleOverlayDuplicate = () => {
    setOverlayStart((s) => Math.min(totalDuration - overlayDuration, s + 0.5));
  };
  const handleOverlayZoom = () => {
    const ratio = (overlayDuration / totalDuration) * 3;
    setZoomLevel(Math.min(3, Math.max(1, 1 / ratio)));
  };

  // Voice track
  const handleVoiceDelete = () => {
    setEnabledTracks((p) => ({ ...p, voice: false }));
    setSelectedClip(null);
  };
  const handleVoiceZoom = () => {
    const ratio = (voiceDuration / totalDuration) * 3;
    setZoomLevel(Math.min(3, Math.max(1, 1 / ratio)));
  };

  // Music track
  const handleMusicDelete = () => {
    setEnabledTracks((p) => ({ ...p, music: false }));
    setSelectedClip(null);
  };
  const handleMusicZoom = () => {
    const ratio = (musicDuration / totalDuration) * 3;
    setZoomLevel(Math.min(3, Math.max(1, 1 / ratio)));
  };

  // SFX track
  const handleSfxDelete = () => {
    setEnabledTracks((p) => ({ ...p, sfx: false }));
    setSelectedClip(null);
  };

  // Image track
  const handleImageDelete = () => {
    setEnabledTracks((p) => ({ ...p, image: false }));
    setSelectedClip(null);
  };
  const handleImageDuplicate = () => {
    setImageStart((s) => Math.min(totalDuration - imageDuration, s + 0.5));
  };
  const handleImageZoom = () => {
    const ratio = (imageDuration / totalDuration) * 3;
    setZoomLevel(Math.min(3, Math.max(1, 1 / ratio)));
  };

  // Title track
  const [titleContextMenu, setTitleContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [titleColorLabel, setTitleColorLabel] = useState<string>('');
  const handleTitleDelete = () => {
    setEnabledTracks((p) => ({ ...p, title: false }));
    setSelectedClip(null);
  };
  const handleTitleZoom = () => {
    const ratio = (titleDuration / totalDuration) * 3;
    setZoomLevel(Math.min(3, Math.max(1, 1 / ratio)));
  };

  // Caption context menu actions (index-aware wrappers)
  const handleDeleteCaptionByIndex = (index: number) => {
    if (captionsTrackLocked) return;
    const updated = localClips.filter((_, idx) => idx !== index);
    setLocalClips(updated);
    onUpdateSubtitles?.(updated);
    setSelectedClip(null);
    setEditingClipIndex(null);
  };
  const handleDuplicateCaptionByIndex = (index: number) => {
    if (captionsTrackLocked) return;
    const clip = localClips[index];
    if (!clip) return;
    const newStart = parseFloat((clip.start + (clip.duration || 3) + 0.1).toFixed(2));
    const duplicated: ScriptSubtitle = {
      text: `${clip.text} (Copy)`,
      start: newStart,
      duration: clip.duration || 3,
    };
    const updated = [...localClips, duplicated].sort((a, b) => a.start - b.start);
    setLocalClips(updated);
    onUpdateSubtitles?.(updated);
    setSelectedClip({ track: 'caption', index: updated.indexOf(duplicated) });
  };
  const handleSplitCaptionByIndex = (index: number) => {
    if (captionsTrackLocked) return;
    setSelectedClip({ track: 'caption', index });
    // Re-use existing split logic (it reads selectedClip which we just set)
    setTimeout(handleSplitClip, 0);
  };
  const handleEditCaptionByIndex = (index: number, text: string) => {
    if (captionsTrackLocked) return;
    setEditingClipIndex(index);
    setEditingText(text);
  };

  // Save inline edited subtitle
  const handleSaveInlineText = (index: number) => {
    if (editingText.trim()) {
      const updated = [...localClips];
      updated[index] = { ...updated[index], text: editingText.trim() };
      setLocalClips(updated);
      onUpdateSubtitles?.(updated);
    }
    setEditingClipIndex(null);
  };

  // Media presence flags for pristine empty workspace states
  const hasVideo = Boolean(customVideoUrl || (activeBackdrop && activeBackdrop.id));
  const hasImage = Boolean(customImageUrl || (activeBackdrop && activeBackdrop.imageUrl && activeBackdrop.id));
  const hasOverlay = Boolean(activeElementOverlay);
  const hasVoice = Boolean(audioUrl);
  const hasMusic = Boolean(selectedMusic);
  const hasTitle = Boolean(script.title);

  // Dynamic voice profile resolution from loaded voices
  const activeVoiceObj = voices.find((v) => v.id === selectedVoice || v.name === selectedVoice);
  const voiceLabel = activeVoiceObj
    ? `Voice: ${activeVoiceObj.name} (${activeVoiceObj.gender} • ${activeVoiceObj.style || 'Neural TTS'})`
    : `Voice: ${selectedVoice || 'Neural Voice'} (AI TTS Waves)`;

  // Dynamic soundtrack resolution from loaded music tracks
  const activeMusicObj = musicTracks.find((m) => m.id === selectedMusic);
  const musicLabel = activeMusicObj
    ? `Soundtrack: ${activeMusicObj.title} (${activeMusicObj.genre || 'Score'})`
    : selectedMusic
    ? 'Soundtrack: Selected Mix (Looping Bed)'
    : 'Ambient Motivation (Soundtrack)';
  const musicSubLabel = activeMusicObj?.duration
    ? `${activeMusicObj.duration} • -14 dB Studio Mix`
    : '-14 dB Studio Mix';

  // Total active compounds actually containing clips
  const activeCompoundsCount = [
    hasVideo && enabledTracks.video,
    hasImage && enabledTracks.image,
    hasOverlay && enabledTracks.overlay,
    captionLanes.length > 0 && enabledTracks.captions,
    hasTitle && enabledTracks.title,
    hasVoice && enabledTracks.voice,
    hasMusic && enabledTracks.music,
  ].filter(Boolean).length;

  // Ruler tick markers
  const tickCount = Math.max(6, Math.floor(totalDuration / 2));
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => (i * totalDuration) / tickCount);

  return (
    <div className="w-full bg-[#121212] border border-[#3A3A3A] rounded-2xl overflow-hidden shadow-2xl transition-all font-sans-studio select-none">
      {/* ── Top Header Bar / Timeline Toolbar ──────────────────────── */}
      <TimelineToolbar
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        activeCompoundsCount={activeCompoundsCount}
        selectedClip={selectedClip}
        captionsTrackLocked={captionsTrackLocked}
        onSplitClip={handleSplitClip}
        onDuplicateClip={handleDuplicateClip}
        onAddCaption={handleAddCaption}
        onDeleteClip={handleDeleteClip}
        snapEnabled={snapEnabled}
        onToggleSnap={() => setSnapEnabled(!snapEnabled)}
        addTrackMenuOpen={addTrackMenuOpen}
        onToggleAddTrackMenu={() => setAddTrackMenuOpen(!addTrackMenuOpen)}
        onCloseAddTrackMenu={() => setAddTrackMenuOpen(false)}
        onEnableTrack={handleEnableTrack}
        onSeek={onSeek}
        isPlaying={isPlaying}
        onTogglePlay={onTogglePlay}
        currentTime={currentTime}
        totalDuration={totalDuration}
        dragTooltip={dragTooltip}
        zoomLevel={zoomLevel}
        onZoomIn={() => setZoomLevel(Math.min(3, zoomLevel + 0.5))}
        onZoomOut={() => setZoomLevel(Math.max(1, zoomLevel - 0.5))}
      />

      {/* ── Collapsible Tracks Body ───────────────────────────────── */}
      {!isCollapsed && (
        <div className="flex flex-col bg-[#0D0D0D]">
          <div className="flex">
            {/* ── Track Header Column (Fixed Left) ─────────────────── */}
            <TimelineTrackHeaders
              enabledTracks={enabledTracks}
              selectedClip={selectedClip}
              onSelectClip={handleSelectClip}
              videoTrackVisible={videoTrackVisible}
              onToggleVideoTrackVisible={() => setVideoTrackVisible(!videoTrackVisible)}
              imageTrackVisible={imageTrackVisible}
              onToggleImageTrackVisible={() => setImageTrackVisible(!imageTrackVisible)}
              overlayTrackVisible={overlayTrackVisible}
              onToggleOverlayTrackVisible={() => setOverlayTrackVisible(!overlayTrackVisible)}
              captionsTrackLocked={captionsTrackLocked}
              onToggleCaptionsTrackLocked={() => setCaptionsTrackLocked(!captionsTrackLocked)}
              captionTrackHeight={captionTrackHeight}
              captionMaxLane={captionMaxLane}
              titleTrackLocked={titleTrackLocked}
              onToggleTitleTrackLocked={() => setTitleTrackLocked(!titleTrackLocked)}
              voiceTrackMuted={voiceTrackMuted}
              onToggleVoiceTrackMuted={() => setVoiceTrackMuted(!voiceTrackMuted)}
              musicTrackMuted={musicTrackMuted}
              onToggleMusicTrackMuted={() => setMusicTrackMuted(!musicTrackMuted)}
              sfxTrackMuted={sfxTrackMuted}
              onToggleSfxTrackMuted={() => setSfxTrackMuted(!sfxTrackMuted)}
              onOpenAddTrackMenu={() => setAddTrackMenuOpen(true)}
            />

            {/* ── Timeline Tracks Area (Scrollable / Zoomable) ───── */}
            <div className="flex-1 overflow-x-auto custom-scrollbar relative">
              <div
                ref={tracksContainerRef}
                className="relative min-w-full"
                style={{ width: `${100 * zoomLevel}%` }}
              >
                {/* ── Magnetic Snapping Guideline (Laser Line) ──────── */}
                {snapGuideTime !== null && (
                  <div
                    className="timeline-snap-guide-line"
                    style={{ left: `${(snapGuideTime / totalDuration) * 100}%` }}
                  />
                )}

                {/* ── Time Ruler Strip ─────────────────────────────── */}
                <TimelineRuler
                  ticks={ticks}
                  totalDuration={totalDuration}
                  onRulerPointerDown={handleRulerPointerDown}
                />

                {/* ── Track 1: Video Backdrop Clip Block (Moveable & Trimmable) ───── */}
                {enabledTracks.video && (
                  hasVideo ? (
                    <VideoTrackClip
                      videoStart={videoStart}
                      videoDuration={videoDuration}
                      totalDuration={totalDuration}
                      selectedClip={selectedClip}
                      videoTrackVisible={videoTrackVisible}
                      backdropName={activeBackdrop?.name || 'Video Clip'}
                      mediaUrl={customVideoUrl || activeBackdrop?.imageUrl}
                      onSelect={() => handleSelectClip({ track: 'video' }, 'video')}
                      onPointerDownMove={(e) => {
                        handleSelectClip({ track: 'video' });
                        setActiveDrag({
                          kind: 'video',
                          mode: 'move',
                          startX: e.clientX,
                          origStart: videoStart,
                          origDuration: videoDuration,
                        });
                      }}
                      onPointerDownTrimLeft={(e) => {
                        e.stopPropagation();
                        handleSelectClip({ track: 'video' });
                        setActiveDrag({
                          kind: 'video',
                          mode: 'trim-left',
                          startX: e.clientX,
                          origStart: videoStart,
                          origDuration: videoDuration,
                        });
                      }}
                      onPointerDownTrimRight={(e) => {
                        e.stopPropagation();
                        handleSelectClip({ track: 'video' });
                        setActiveDrag({
                          kind: 'video',
                          mode: 'trim-right',
                          startX: e.clientX,
                          origStart: videoStart,
                          origDuration: videoDuration,
                        });
                      }}
                      onDelete={handleVideoDelete}
                      onDuplicate={handleVideoDuplicate}
                      onSplit={handleSplitClip}
                      onHide={() => setVideoTrackVisible(!videoTrackVisible)}
                      onZoomToClip={handleVideoZoom}
                    />
                  ) : (
                    <div className="h-10 border-b border-[#262626] p-1 relative flex items-center" />
                  )
                )}

                {/* ── Track 2: Image Backdrop Clip Block ────────────────────── */}
                {enabledTracks.image && (
                  hasImage ? (
                    <ImageTrackClip
                      imageStart={imageStart}
                      imageDuration={imageDuration}
                      totalDuration={totalDuration}
                      selectedClip={selectedClip}
                      imageTrackVisible={imageTrackVisible}
                      imageUrl={customImageUrl || activeBackdrop?.imageUrl}
                      imageName={customImageUrl ? 'Custom Image Graphic' : `${activeBackdrop?.name || 'Image'}`}
                      onSelect={() => handleSelectClip({ track: 'image' }, 'video')}
                      onPointerDownMove={(e) => {
                        handleSelectClip({ track: 'image' });
                        setActiveDrag({
                          kind: 'image',
                          mode: 'move',
                          startX: e.clientX,
                          origStart: imageStart,
                          origDuration: imageDuration,
                        });
                      }}
                      onPointerDownTrimLeft={(e) => {
                        e.stopPropagation();
                        handleSelectClip({ track: 'image' });
                        setActiveDrag({
                          kind: 'image',
                          mode: 'trim-left',
                          startX: e.clientX,
                          origStart: imageStart,
                          origDuration: imageDuration,
                        });
                      }}
                      onPointerDownTrimRight={(e) => {
                        e.stopPropagation();
                        handleSelectClip({ track: 'image' });
                        setActiveDrag({
                          kind: 'image',
                          mode: 'trim-right',
                          startX: e.clientX,
                          origStart: imageStart,
                          origDuration: imageDuration,
                        });
                      }}
                      onDelete={handleImageDelete}
                      onDuplicate={handleImageDuplicate}
                      onSplit={handleSplitClip}
                      onHide={() => setImageTrackVisible(!imageTrackVisible)}
                      onZoomToClip={handleImageZoom}
                    />
                  ) : (
                    <div className="h-10 border-b border-[#262626] p-1 relative flex items-center" />
                  )
                )}

                {/* ── Track 3: Overlays / Elements Clip Block ───────────────── */}
                {enabledTracks.overlay && (
                  hasOverlay ? (
                    <OverlayTrackClip
                      overlayStart={overlayStart}
                      overlayDuration={overlayDuration}
                      totalDuration={totalDuration}
                      selectedClip={selectedClip}
                      overlayTrackVisible={overlayTrackVisible}
                      label={activeElementOverlay?.label || activeElementOverlay?.name}
                      onSelect={() => handleSelectClip({ track: 'overlay' }, 'overlay')}
                      onPointerDownMove={(e) => {
                        handleSelectClip({ track: 'overlay' });
                        setActiveDrag({
                          kind: 'overlay',
                          mode: 'move',
                          startX: e.clientX,
                          origStart: overlayStart,
                          origDuration: overlayDuration,
                        });
                      }}
                      onPointerDownTrimLeft={(e) => {
                        e.stopPropagation();
                        handleSelectClip({ track: 'overlay' });
                        setActiveDrag({
                          kind: 'overlay',
                          mode: 'trim-left',
                          startX: e.clientX,
                          origStart: overlayStart,
                          origDuration: overlayDuration,
                        });
                      }}
                      onPointerDownTrimRight={(e) => {
                        e.stopPropagation();
                        handleSelectClip({ track: 'overlay' });
                        setActiveDrag({
                          kind: 'overlay',
                          mode: 'trim-right',
                          startX: e.clientX,
                          origStart: overlayStart,
                          origDuration: overlayDuration,
                        });
                      }}
                      onDelete={handleOverlayDelete}
                      onDuplicate={handleOverlayDuplicate}
                      onSplit={handleSplitClip}
                      onHide={() => setOverlayTrackVisible(!overlayTrackVisible)}
                      onZoomToClip={handleOverlayZoom}
                    />
                  ) : (
                    <div className="h-10 border-b border-[#262626] p-1 relative flex items-center" />
                  )
                )}

                {/* ── Track 4: Subtitle & Kinetic Caption Clips (Moveable, Trimmable, Stacking Lanes) ────── */}
                {enabledTracks.captions && (
                  captionLanes.length > 0 ? (
                    <CaptionTrackClips
                      captionLanes={captionLanes}
                      captionMaxLane={captionMaxLane}
                      captionTrackHeight={captionTrackHeight}
                      laneHeight={laneHeight}
                      laneGap={laneGap}
                      totalDuration={totalDuration}
                      selectedClip={selectedClip}
                      captionsTrackLocked={captionsTrackLocked}
                      editingClipIndex={editingClipIndex}
                      editingText={editingText}
                      setEditingText={setEditingText}
                      onSelectClip={(index, start) => {
                        handleSelectClip({ track: 'caption', index }, 'text');
                        onSeek(start);
                      }}
                      onDoubleClickClip={(index, text) => {
                        if (captionsTrackLocked) return;
                        setEditingClipIndex(index);
                        setEditingText(text);
                      }}
                      onSaveInlineText={handleSaveInlineText}
                      onCancelInlineEdit={() => setEditingClipIndex(null)}
                      onPointerDownMove={(e, index, start, dur) => {
                        if (captionsTrackLocked || editingClipIndex === index) return;
                        handleSelectClip({ track: 'caption', index });
                        setActiveDrag({
                          kind: 'subtitle',
                          index,
                          mode: 'move',
                          startX: e.clientX,
                          origStart: start,
                          origDuration: dur,
                        });
                      }}
                      onPointerDownTrimLeft={(e, index, start, dur) => {
                        e.stopPropagation();
                        handleSelectClip({ track: 'caption', index });
                        setActiveDrag({
                          kind: 'subtitle',
                          index,
                          mode: 'trim-left',
                          startX: e.clientX,
                          origStart: start,
                          origDuration: dur,
                        });
                      }}
                      onPointerDownTrimRight={(e, index, start, dur) => {
                        e.stopPropagation();
                        handleSelectClip({ track: 'caption', index });
                        setActiveDrag({
                          kind: 'subtitle',
                          index,
                          mode: 'trim-right',
                          startX: e.clientX,
                          origStart: start,
                          origDuration: dur,
                        });
                      }}
                      onDeleteCaption={handleDeleteCaptionByIndex}
                      onDuplicateCaption={handleDuplicateCaptionByIndex}
                      onSplitCaption={handleSplitCaptionByIndex}
                      onEditCaption={handleEditCaptionByIndex}
                    />
                  ) : (
                    <div
                      className="relative border-b border-[#262626]"
                      style={{ height: captionTrackHeight }}
                    >
                      <div className="absolute inset-x-0 top-0 h-px bg-[#2D2D2D]" />
                    </div>
                  )
                )}

                {/* ── Track 5: Title / Hook Overlay Clip Block ──────────────── */}
                {enabledTracks.title && (
                  hasTitle ? (
                    <div className="h-10 border-b border-[#262626] p-1 relative flex items-center">
                      <div
                        onClick={() => handleSelectClip({ track: 'title' }, 'text')}
                        onPointerDown={(e) => {
                          handleSelectClip({ track: 'title' });
                          setActiveDrag({
                            kind: 'title',
                            mode: 'move',
                            startX: e.clientX,
                            origStart: titleStart,
                            origDuration: titleDuration,
                          });
                        }}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          handleSelectClip({ track: 'title' });
                          setTitleContextMenu({ x: e.clientX, y: e.clientY });
                        }}
                        className={`h-full rounded-md px-2.5 flex items-center justify-between border cursor-grab active:cursor-grabbing select-none group transition-colors relative overflow-hidden ${
                          selectedClip?.track === 'title'
                            ? 'bg-sky-950/70 border-sky-400 text-sky-100 z-20 ring-2 ring-sky-400/80'
                            : 'bg-sky-950/40 border-sky-500/30 text-sky-200 hover:border-sky-400 z-10'
                        }`}
                        style={{
                          left: `${(titleStart / totalDuration) * 100}%`,
                          width: `${Math.min(100, (titleDuration / totalDuration) * 100)}%`,
                          ...(titleColorLabel ? { boxShadow: `inset 0 0 0 2px ${titleColorLabel}40, 0 0 0 1px ${titleColorLabel}` } : {}),
                        }}
                      >
                        {/* Color Label Strip */}
                        {titleColorLabel && (
                          <div
                            className="absolute top-0 left-0 right-0 h-0.5 z-30 rounded-t-md"
                            style={{ background: titleColorLabel }}
                          />
                        )}
                        <div className="flex items-center gap-1.5 z-10 bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-xs">
                          <Type className="w-3 h-3 text-sky-400 shrink-0" />
                          <span className="text-[10px] font-mono-studio truncate font-medium pointer-events-none">
                            Title: "{script.title || 'Untitled'}"
                          </span>
                        </div>
                        <span className="text-[8px] font-mono-studio text-sky-300 font-bold pr-1 bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-xs">
                          {formatTime(titleDuration)}
                        </span>
                      </div>
                      {/* Title track right-click context menu */}
                      <TimelineClipContextMenu
                        x={titleContextMenu?.x ?? 0}
                        y={titleContextMenu?.y ?? 0}
                        trackType="title"
                        isVisible={titleContextMenu !== null}
                        onClose={() => setTitleContextMenu(null)}
                        onDelete={handleTitleDelete}
                        onSplit={handleSplitClip}
                        onZoomToClip={handleTitleZoom}
                        onColorLabel={(c) => setTitleColorLabel(c)}
                        onCopyTimings={() => {
                          const text = `Start: ${titleStart.toFixed(2)}s | Duration: ${titleDuration.toFixed(2)}s | Title: "${script.title || 'Untitled'}"`;
                          navigator.clipboard.writeText(text).catch(() => {});
                        }}
                      />
                    </div>
                  ) : (
                    <div className="h-10 border-b border-[#262626] p-1 relative flex items-center" />
                  )
                )}

                {/* ── Track 6: Voiceover Audio (With Full-Width Dynamic Audio Waves) ───── */}
                {enabledTracks.voice && (
                  hasVoice ? (
                    <div className="h-10 border-b border-[#262626] p-1 relative flex items-center">
                      <AudioTrackClip
                        type="voice"
                        start={voiceStart}
                        duration={voiceDuration}
                        totalDuration={totalDuration}
                        selectedClip={selectedClip}
                        isMuted={voiceTrackMuted}
                        label={voiceLabel}
                        onSelect={() => handleSelectClip({ track: 'voice' }, 'voice')}
                        onPointerDownMove={(e) => {
                          handleSelectClip({ track: 'voice' });
                          setActiveDrag({
                            kind: 'voice',
                            mode: 'move',
                            startX: e.clientX,
                            origStart: voiceStart,
                            origDuration: voiceDuration,
                          });
                        }}
                        onPointerDownTrimLeft={(e) => {
                          e.stopPropagation();
                          handleSelectClip({ track: 'voice' });
                          setActiveDrag({
                            kind: 'voice',
                            mode: 'trim-left',
                            startX: e.clientX,
                            origStart: voiceStart,
                            origDuration: voiceDuration,
                          });
                        }}
                        onPointerDownTrimRight={(e) => {
                          e.stopPropagation();
                          handleSelectClip({ track: 'voice' });
                          setActiveDrag({
                            kind: 'voice',
                            mode: 'trim-right',
                            startX: e.clientX,
                            origStart: voiceStart,
                            origDuration: voiceDuration,
                          });
                        }}
                        onDelete={handleVoiceDelete}
                        onMute={() => setVoiceTrackMuted(!voiceTrackMuted)}
                        onSplit={handleSplitClip}
                        onZoomToClip={handleVoiceZoom}
                      />
                    </div>
                  ) : (
                    <div className="h-10 border-b border-[#262626] p-1 relative flex items-center" />
                  )
                )}

                {/* ── Track 7: Background Music Soundtrack (With Full-Width Dynamic Music Waves) ───── */}
                {enabledTracks.music && (
                  hasMusic ? (
                    <div className={`h-10 ${enabledTracks.sfx ? 'border-b border-[#262626]' : ''} p-1 relative flex items-center`}>
                      <AudioTrackClip
                        type="music"
                        start={musicStart}
                        duration={musicDuration}
                        totalDuration={totalDuration}
                        selectedClip={selectedClip}
                        isMuted={musicTrackMuted}
                        label={musicLabel}
                        subLabel={musicSubLabel}
                        onSelect={() => handleSelectClip({ track: 'music' }, 'music')}
                        onPointerDownMove={(e) => {
                          handleSelectClip({ track: 'music' });
                          setActiveDrag({
                            kind: 'music',
                            mode: 'move',
                            startX: e.clientX,
                            origStart: musicStart,
                            origDuration: musicDuration,
                          });
                        }}
                        onPointerDownTrimLeft={(e) => {
                          e.stopPropagation();
                          handleSelectClip({ track: 'music' });
                          setActiveDrag({
                            kind: 'music',
                            mode: 'trim-left',
                            startX: e.clientX,
                            origStart: musicStart,
                            origDuration: musicDuration,
                          });
                        }}
                        onPointerDownTrimRight={(e) => {
                          e.stopPropagation();
                          handleSelectClip({ track: 'music' });
                          setActiveDrag({
                            kind: 'music',
                            mode: 'trim-right',
                            startX: e.clientX,
                            origStart: musicStart,
                            origDuration: musicDuration,
                          });
                        }}
                        onDelete={handleMusicDelete}
                        onMute={() => setMusicTrackMuted(!musicTrackMuted)}
                        onSplit={handleSplitClip}
                        onZoomToClip={handleMusicZoom}
                      />
                    </div>
                  ) : (
                    <div className={`h-10 ${enabledTracks.sfx ? 'border-b border-[#262626]' : ''} p-1 relative flex items-center`} />
                  )
                )}

                {/* ── Track 8: Sound FX Track ──────────────────────────────── */}
                {enabledTracks.sfx && (
                  <div className="h-10 p-1 relative flex items-center">
                    <AudioTrackClip
                      type="sfx"
                      start={sfxStart}
                      duration={sfxDuration}
                      totalDuration={totalDuration}
                      selectedClip={selectedClip}
                      isMuted={sfxTrackMuted}
                      label="SFX: Cinematic Transition & Impact Burst"
                      onSelect={() => handleSelectClip({ track: 'sfx' }, 'music')}
                      onPointerDownMove={(e) => {
                        handleSelectClip({ track: 'sfx' });
                        setActiveDrag({
                          kind: 'sfx',
                          mode: 'move',
                          startX: e.clientX,
                          origStart: sfxStart,
                          origDuration: sfxDuration,
                        });
                      }}
                      onPointerDownTrimLeft={(e) => {
                        e.stopPropagation();
                        handleSelectClip({ track: 'sfx' });
                        setActiveDrag({
                          kind: 'sfx',
                          mode: 'trim-left',
                          startX: e.clientX,
                          origStart: sfxStart,
                          origDuration: sfxDuration,
                        });
                      }}
                      onPointerDownTrimRight={(e) => {
                        e.stopPropagation();
                        handleSelectClip({ track: 'sfx' });
                        setActiveDrag({
                          kind: 'sfx',
                          mode: 'trim-right',
                          startX: e.clientX,
                          origStart: sfxStart,
                          origDuration: sfxDuration,
                        });
                      }}
                      onDelete={handleSfxDelete}
                      onMute={() => setSfxTrackMuted(!sfxTrackMuted)}
                      onSplit={handleSplitClip}
                    />
                  </div>
                )}

                {/* ── Draggable Electric Blue Playhead Indicator ────── */}
                <div
                  className="absolute top-0 bottom-0 w-px bg-[#3B82F6] z-30 pointer-events-none"
                  style={{ left: `${progressPercent}%` }}
                >
                  {/* Playhead Handle Badge - Interactive with drag handle */}
                  <div
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      handleRulerPointerDown(e);
                    }}
                    className="absolute top-0 -translate-x-1/2 w-4 h-4 bg-[#3B82F6] hover:bg-[#2563EB] border-2 border-white rounded-full shadow-xl pointer-events-auto cursor-ew-resize hover:scale-125 transition-transform select-none"
                    title="Drag playhead to scrub timeline"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudioTimelinePane;

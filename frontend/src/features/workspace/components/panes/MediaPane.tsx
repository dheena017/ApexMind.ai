import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'motion/react';
import {
  Upload,
  FolderOpen,
  Image as ImageIcon,
  Film,
  Music,
  Trash2,
  Check,
  Plus,
  Sparkles,
  FileVideo,
  FileAudio,
  HardDrive,
  ExternalLink,
  Camera,
} from 'lucide-react';

export interface UploadedMediaItem {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'video' | 'audio';
  size: string;
  createdAt: number;
}

export interface MediaPaneProps {
  onApplyBackdrop: (url: string, isVideo: boolean) => void;
  onApplyAudio?: (url: string) => void;
  onCaptureCanvasSnapshot?: () => Promise<string | null>;
  activeMediaUrl?: string;
}

const CURATED_PROJECT_ASSETS: UploadedMediaItem[] = [
  {
    id: 'asset-1',
    name: 'Misty Alpine Peaks 4K',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=720&q=80',
    type: 'image',
    size: '2.4 MB',
    createdAt: Date.now() - 3600000,
  },
  {
    id: 'asset-2',
    name: 'Cyberpunk Neon Alley',
    url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=720&q=80',
    type: 'image',
    size: '3.1 MB',
    createdAt: Date.now() - 7200000,
  },
  {
    id: 'asset-3',
    name: 'Iron Barbell Grit',
    url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=720&q=80',
    type: 'image',
    size: '1.9 MB',
    createdAt: Date.now() - 10800000,
  },
  {
    id: 'asset-4',
    name: 'Deep Oceanic Waves',
    url: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=720&q=80',
    type: 'image',
    size: '2.8 MB',
    createdAt: Date.now() - 14400000,
  },
  {
    id: 'asset-5',
    name: 'Cinematic Clouds Loop',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    type: 'video',
    size: '8.2 MB',
    createdAt: Date.now() - 18000000,
  },
];

export const MediaPane: React.FC<MediaPaneProps> = ({
  onApplyBackdrop,
  onApplyAudio,
  onCaptureCanvasSnapshot,
  activeMediaUrl,
}) => {
  const [mediaItems, setMediaItems] = useState<UploadedMediaItem[]>(CURATED_PROJECT_ASSETS);
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video' | 'audio'>('all');
  const [appliedId, setAppliedId] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  // Open-Source react-dropzone integration
  const onDrop = (acceptedFiles: File[]) => {
    acceptedFiles.forEach((file) => {
      const isVideo = file.type.startsWith('video');
      const isAudio = file.type.startsWith('audio');
      const type: 'image' | 'video' | 'audio' = isVideo ? 'video' : isAudio ? 'audio' : 'image';

      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        const sizeMb = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
        const newItem: UploadedMediaItem = {
          id: `upload-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: file.name,
          url,
          type,
          size: sizeMb,
          createdAt: Date.now(),
        };
        setMediaItems((prev) => [newItem, ...prev]);
      };
      reader.readAsDataURL(file);
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.svg'],
      'video/*': ['.mp4', '.webm', '.mov'],
      'audio/*': ['.mp3', '.wav', '.ogg'],
    },
  });

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMediaItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleApply = (item: UploadedMediaItem) => {
    setAppliedId(item.id);
    if (item.type === 'audio' && onApplyAudio) {
      onApplyAudio(item.url);
      window.dispatchEvent(new CustomEvent('workspace:select-compound', { detail: 'music' }));
    } else {
      onApplyBackdrop(item.url, item.type === 'video');
      window.dispatchEvent(new CustomEvent('workspace:select-compound', { detail: 'video' }));
    }
  };

  const handleSnapshot = async () => {
    if (!onCaptureCanvasSnapshot) return;
    setIsCapturing(true);
    try {
      const snapUrl = await onCaptureCanvasSnapshot();
      if (snapUrl) {
        const newItem: UploadedMediaItem = {
          id: `snap-${Date.now()}`,
          name: `Canvas Snapshot ${new Date().toLocaleTimeString()}`,
          url: snapUrl,
          type: 'image',
          size: '1.2 MB',
          createdAt: Date.now(),
        };
        setMediaItems((prev) => [newItem, ...prev]);
      }
    } finally {
      setIsCapturing(false);
    }
  };

  const filteredItems = mediaItems.filter((item) => {
    if (filterType === 'all') return true;
    return item.type === filterType;
  });

  return (
    <div className="flex flex-col font-sans-studio text-[#E5E5E5] space-y-4">
      {/* ── Top Header Bar ────────────────────────────────────────────── */}
      <div className="flex w-full items-center justify-between gap-2 rounded-xl border border-[#2F2F2F] bg-[#121212]/90 px-3 py-2.5 shadow-[0_1px_0_rgba(255,255,255,0.02)] backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#3B82F6]/15 text-[#60A5FA] border border-[#3B82F6]/30">
            <FolderOpen className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">Media Hub</h2>
            <p className="text-[10px] text-[#9CA3AF]">react-dropzone • html-to-image engine</p>
          </div>
        </div>

        {onCaptureCanvasSnapshot && (
          <button
            type="button"
            onClick={handleSnapshot}
            disabled={isCapturing}
            className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-[#181818] hover:bg-[#222222] border border-[#2F2F2F] text-[#60A5FA] flex items-center gap-1 cursor-pointer transition-colors"
            title="Export PNG snapshot of canvas"
          >
            <Camera className="w-3 h-3" />
            <span>{isCapturing ? 'Snapping...' : 'Snapshot'}</span>
          </button>
        )}
      </div>

      {/* ── Open-Source react-dropzone Ingestion Zone ─────────────────── */}
      <div
        {...getRootProps()}
        className={`group relative flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-dashed transition-all cursor-pointer hover:scale-[1.01] ${
          isDragActive
            ? 'border-[#3B82F6] bg-[#3B82F6]/15 scale-[1.02]'
            : 'border-[#2F2F2F] hover:border-[#3B82F6]/60 bg-[#141414] hover:bg-[#181818]'
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex items-center justify-center w-11 h-11 rounded-full bg-[#1E1E1E] border border-[#2F2F2F] text-[#60A5FA] mb-2.5 group-hover:scale-110 transition-transform shadow-md">
          <Upload className="w-5 h-5" />
        </div>
        <p className="text-xs font-bold text-white text-center">
          {isDragActive ? 'Drop files here right now...' : 'Click or Drag & Drop Media Here'}
        </p>
        <p className="text-[10px] text-[#71717A] text-center mt-1">
          Supports MP4, WEBM, JPG, PNG, WEBP, MP3, WAV (up to 50MB)
        </p>
      </div>

      {/* ── Filter Tabs ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#141414] border border-[#262626]">
        {(
          [
            { id: 'all', label: 'All Media' },
            { id: 'image', label: 'Images' },
            { id: 'video', label: 'Videos' },
            { id: 'audio', label: 'Audio' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilterType(tab.id)}
            className={`flex-1 py-1.5 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
              filterType === tab.id
                ? 'bg-[#3B82F6] text-white shadow-xs'
                : 'text-[#9CA3AF] hover:text-white hover:bg-[#1E1E1E]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Media Grid ──────────────────────────────────────────────── */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-[11px] font-extrabold text-[#9CA3AF] uppercase tracking-wider px-1">
          <span>Project Assets ({filteredItems.length})</span>
          <span className="text-[10px] lowercase font-normal text-[#71717A]">click to apply to video</span>
        </div>

        {filteredItems.length === 0 ? (
          <div className="p-8 text-center rounded-xl border border-[#262626] bg-[#121212] text-[#71717A] text-xs">
            No media matching filter. Drop files above to upload.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {filteredItems.map((item) => {
              const isCurrent = activeMediaUrl === item.url || appliedId === item.id;
              return (
                <motion.div
                  key={item.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleApply(item)}
                  className={`group relative flex flex-col rounded-xl border overflow-hidden bg-[#141414] transition-all cursor-pointer ${
                    isCurrent
                      ? 'border-[#3B82F6] ring-2 ring-[#3B82F6]/30'
                      : 'border-[#262626] hover:border-[#404040]'
                  }`}
                >
                  {/* Thumbnail / Media Preview */}
                  <div className="relative aspect-[4/3] w-full bg-[#0E0E0E] overflow-hidden">
                    {item.type === 'image' && (
                      <img
                        src={item.url}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    )}
                    {item.type === 'video' && (
                      <div className="relative w-full h-full flex items-center justify-center bg-zinc-900">
                        <video
                          src={item.url}
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <Film className="w-6 h-6 text-[#60A5FA]" />
                        </div>
                      </div>
                    )}
                    {item.type === 'audio' && (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-950/60 to-purple-950/60 p-2 text-[#818CF8]">
                        <Music className="w-7 h-7 mb-1" />
                        <span className="text-[9px] font-mono-studio text-[#C7D2FE]">Audio Track</span>
                      </div>
                    )}

                    {/* Applied Checkmark Badge */}
                    {isCurrent && (
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#3B82F6] text-white flex items-center justify-center shadow-md z-10">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}

                    {/* Type Badge */}
                    <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-xs text-[9px] font-mono-studio text-[#E5E5E5] uppercase">
                      {item.type}
                    </div>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={(e) => handleDelete(item.id, e)}
                      className="absolute top-1.5 left-1.5 p-1 rounded-md bg-black/70 hover:bg-red-600/90 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete asset"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Title and metadata */}
                  <div className="p-2 space-y-0.5">
                    <p className="text-[11px] font-semibold text-white truncate group-hover:text-[#60A5FA] transition-colors">
                      {item.name}
                    </p>
                    <div className="flex items-center justify-between text-[9px] font-mono-studio text-[#71717A]">
                      <span>{item.size}</span>
                      <span className="text-[#3B82F6] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                        Apply →
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

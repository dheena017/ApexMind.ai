import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Upload,
  FolderOpen,
  Image as ImageIcon,
  Film,
  Music,
  Trash2,
  Check,
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
      'audio/*': ['.mp3', '.wav', '.ogg', '.m4a'],
    },
  });

  const handleApply = (item: UploadedMediaItem) => {
    setAppliedId(item.id);
    if (item.type === 'image') {
      onApplyBackdrop(item.url, false);
      window.dispatchEvent(new CustomEvent('workspace:select-compound', { detail: 'video' }));
    } else if (item.type === 'video') {
      onApplyBackdrop(item.url, true);
      window.dispatchEvent(new CustomEvent('workspace:select-compound', { detail: 'video' }));
    } else if (item.type === 'audio' && onApplyAudio) {
      onApplyAudio(item.url);
      window.dispatchEvent(new CustomEvent('workspace:select-compound', { detail: 'music' }));
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMediaItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSnapshot = async () => {
    if (!onCaptureCanvasSnapshot) return;
    setIsCapturing(true);
    try {
      const snapUrl = await onCaptureCanvasSnapshot();
      if (snapUrl) {
        const newItem: UploadedMediaItem = {
          id: `snapshot-${Date.now()}`,
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
    <div className="flex flex-col h-full bg-[#121214] text-white font-sans-studio select-none overflow-hidden rounded-2xl border border-[#26262B]">
      {/* ── Top Header Bar (Matching Right Pane) ── */}
      <div className="relative px-3 py-2 bg-[#17171A] border-b border-[#26262B] flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <FolderOpen className="w-4 h-4 shrink-0 text-[#60A5FA]" />
          <span className="text-xs font-bold text-white truncate">
            Media &amp; Assets
          </span>
          <span className="text-[9px] font-mono-studio px-1.5 py-0.2 rounded bg-white/10 text-white/80 border border-white/15 shrink-0 uppercase font-bold">
            {filteredItems.length} ITEMS
          </span>
        </div>

        {/* Right Action: Snapshot Button */}
        {onCaptureCanvasSnapshot && (
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleSnapshot}
              disabled={isCapturing}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all cursor-pointer border bg-[#222228] hover:bg-[#2C2C34] text-[#D4D4D8] hover:text-white border-[#32323C]"
              title="Export snapshot of canvas"
            >
              <Camera className="w-3 h-3 text-sky-400" />
              <span>{isCapturing ? 'Snapping...' : 'Snapshot'}</span>
            </button>
          </div>
        )}
      </div>

      {/* ── Subtabs Header Bar (Matching Right Pane) ── */}
      <div className="flex items-center gap-6 px-4 pt-2.5 border-b border-[#26262B] text-xs font-semibold overflow-x-auto custom-scrollbar shrink-0">
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
            className={`pb-2.5 capitalize transition-colors cursor-pointer border-b-2 shrink-0 ${
              filterType === tab.id
                ? 'text-white border-white'
                : 'text-[#71717A] border-transparent hover:text-[#D4D4D8]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Main Content Area ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-4">
        {/* Upload Zone */}
        <div
          {...getRootProps()}
          className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed transition-all cursor-pointer ${
            isDragActive
              ? 'border-[#3B82F6] bg-[#3B82F6]/15'
              : 'border-[#2A2A30] hover:border-[#3B82F6]/60 bg-[#1C1C20] hover:bg-[#222228]'
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-[#121214] border border-[#2A2A30] text-[#60A5FA] mb-2 shadow-xs">
            <Upload className="w-4 h-4" />
          </div>
          <p className="text-xs font-bold text-white text-center">
            {isDragActive ? 'Drop files here...' : 'Upload Media or Drag & Drop'}
          </p>
          <p className="text-[10px] text-[#71717A] text-center mt-0.5">
            MP4, WEBM, JPG, PNG, WEBP, MP3 (up to 50MB)
          </p>
        </div>

        {/* Media Grid */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] text-[#71717A] uppercase font-bold tracking-wider block">
            Project Media Assets ({filteredItems.length})
          </label>

          {filteredItems.length === 0 ? (
            <div className="p-8 text-center rounded-xl border border-[#2A2A30] bg-[#1C1C20] text-[#71717A] text-xs">
              No media matching filter. Drop files above to upload.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {filteredItems.map((item) => {
                const isCurrentActive =
                  activeMediaUrl === item.url || appliedId === item.id;

                return (
                  <div
                    key={item.id}
                    onClick={() => handleApply(item)}
                    className={`group relative rounded-xl border overflow-hidden transition-all cursor-pointer aspect-video bg-[#1C1C20] ${
                      isCurrentActive
                        ? 'border-[#3B82F6] ring-2 ring-[#3B82F6]/40 shadow-lg'
                        : 'border-[#2A2A30] hover:border-[#3A3A42]'
                    }`}
                  >
                    {item.type === 'image' ? (
                      <img
                        src={item.url}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : item.type === 'video' ? (
                      <div className="w-full h-full relative bg-black">
                        <video
                          src={item.url}
                          className="w-full h-full object-cover opacity-80"
                          muted
                          playsInline
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <Film className="w-5 h-5 text-white/80" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-2 bg-[#121214] text-[#60A5FA]">
                        <Music className="w-6 h-6 mb-1" />
                        <span className="text-[10px] font-bold text-white text-center truncate w-full px-1">
                          {item.name}
                        </span>
                      </div>
                    )}

                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-1.5 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-white truncate max-w-[80%]">
                        {item.name}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(item.id, e)}
                        className="p-1 rounded bg-black/60 hover:bg-red-500/80 text-white/80 hover:text-white transition-colors"
                        title="Remove"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    {isCurrentActive && (
                      <div className="absolute top-1.5 right-1.5 p-1 rounded-full bg-[#3B82F6] text-white shadow-md">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MediaPane;

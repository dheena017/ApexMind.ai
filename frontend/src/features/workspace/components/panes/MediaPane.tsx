import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import * as htmlToImage from 'html-to-image';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  Upload,
  FolderOpen,
  Image as ImageIcon,
  Film,
  Music,
  Trash2,
  Check,
  Camera,
  ExternalLink,
  Search,
  Plus,
  Play,
  Copy,
  Sparkles,
  ArrowUpDown,
  Download,
  Eye,
  X,
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

const DEFAULT_STARTER_ASSETS: UploadedMediaItem[] = [
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
    name: 'Iron Barbell Chalked Grit',
    url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=720&q=80',
    type: 'image',
    size: '1.9 MB',
    createdAt: Date.now() - 10800000,
  },
  {
    id: 'asset-4',
    name: 'Deep Storm Mist Waves',
    url: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=720&q=80',
    type: 'image',
    size: '2.8 MB',
    createdAt: Date.now() - 14400000,
  },
  {
    id: 'asset-5',
    name: 'Cinematic Clouds Loop Video',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    type: 'video',
    size: '8.2 MB',
    createdAt: Date.now() - 18000000,
  },
];

const LOCAL_STORAGE_MEDIA_KEY = 'apexmind_workspace_user_media';

export const MediaPane: React.FC<MediaPaneProps> = ({
  onApplyBackdrop,
  onApplyAudio,
  onCaptureCanvasSnapshot,
  activeMediaUrl,
}) => {
  const [mediaItems, setMediaItems] = useState<UploadedMediaItem[]>(DEFAULT_STARTER_ASSETS);
  const [activeTab, setActiveTab] = useState<'library' | 'import-url'>('library');
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video' | 'audio'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedId, setAppliedId] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<UploadedMediaItem | null>(null);

  // Custom Import URL state
  const [importUrl, setImportUrl] = useState('');
  const [importName, setImportName] = useState('');
  const [importType, setImportType] = useState<'image' | 'video' | 'audio'>('image');

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_MEDIA_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMediaItems(parsed);
        }
      }
    } catch {}
  }, []);

  const persistItems = (items: UploadedMediaItem[]) => {
    setMediaItems(items);
    try {
      localStorage.setItem(LOCAL_STORAGE_MEDIA_KEY, JSON.stringify(items));
    } catch {}
  };

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

        setMediaItems((prev) => {
          const updated = [newItem, ...prev];
          persistItems(updated);
          return updated;
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
      'video/*': ['.mp4', '.webm'],
      'audio/*': ['.mp3', '.wav', '.ogg'],
    },
  });

  const handleApplyItem = (item: UploadedMediaItem) => {
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
    setTimeout(() => setAppliedId(null), 2000);
  };

  const handleDeleteItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = mediaItems.filter((i) => i.id !== id);
    persistItems(updated);
  };

  const handleClearAll = () => {
    if (window.confirm('Clear all uploaded media items from this project?')) {
      persistItems([]);
    }
  };

  const handleCopyUrl = (url: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleAddFromUrl = () => {
    if (!importUrl.trim()) return;
    const url = importUrl.trim();
    const name = importName.trim() || `Imported ${importType.toUpperCase()}`;

    const newItem: UploadedMediaItem = {
      id: `url-asset-${Date.now()}`,
      name,
      url,
      type: importType,
      size: 'Web Stream',
      createdAt: Date.now(),
    };

    const updated = [newItem, ...mediaItems];
    persistItems(updated);

    if (importType === 'image') onApplyBackdrop(url, false);
    if (importType === 'video') onApplyBackdrop(url, true);
    if (importType === 'audio' && onApplyAudio) onApplyAudio(url);

    setImportUrl('');
    setImportName('');
    setActiveTab('library');
  };

  const handleCaptureSnapshot = async () => {
    try {
      setIsCapturing(true);
      let snapshotUrl: string | null = null;
      if (onCaptureCanvasSnapshot) {
        snapshotUrl = await onCaptureCanvasSnapshot();
      }
      if (!snapshotUrl) {
        const node = document.getElementById('apex-video-canvas-container');
        if (node) {
          snapshotUrl = await htmlToImage.toPng(node, {
            quality: 0.95,
            pixelRatio: 2,
          });
        }
      }
      if (snapshotUrl) {
        const newItem: UploadedMediaItem = {
          id: `snapshot-${Date.now()}`,
          name: `Canvas Frame ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          url: snapshotUrl,
          type: 'image',
          size: 'Snapshot PNG',
          createdAt: Date.now(),
        };
        const updated = [newItem, ...mediaItems];
        persistItems(updated);
        try {
          confetti({
            particleCount: 35,
            spread: 55,
            origin: { y: 0.75 },
          });
        } catch {}
      }
    } catch (err) {
      console.error('Snapshot failed:', err);
    } finally {
      setIsCapturing(false);
    }
  };

  const sortedMedia = [...mediaItems].sort((a, b) => {
    if (sortBy === 'newest') return b.createdAt - a.createdAt;
    if (sortBy === 'oldest') return a.createdAt - b.createdAt;
    return a.name.localeCompare(b.name);
  });

  const filteredMedia = sortedMedia.filter((m) => {
    const matchesType = filterType === 'all' || m.type === filterType;
    const matchesSearch =
      searchQuery.trim() === '' ||
      m.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="flex flex-col h-full bg-[#121214] text-white font-sans-studio select-none overflow-hidden rounded-2xl border border-[#26262B]">
      {/* ── Top Header Bar (Matching Right Pane) ── */}
      <div className="relative px-3 py-2 bg-[#17171A] border-b border-[#26262B] flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <FolderOpen className="w-4 h-4 shrink-0 text-[#60A5FA]" />
          <span className="text-xs font-bold text-white truncate">
            Project Media Library
          </span>
          <span className="text-[9px] font-mono-studio px-1.5 py-0.2 rounded bg-white/10 text-white/80 border border-white/15 shrink-0 uppercase font-bold">
            PERSISTED
          </span>
        </div>

        <div className="flex items-center gap-2">
          {mediaItems.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="text-[10px] text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
            >
              Clear
            </button>
          )}
          <span className="text-[10px] font-mono-studio text-[#A1A1AA]">
            {filteredMedia.length} Assets
          </span>
        </div>
      </div>

      {/* ── Subtabs Header Bar ── */}
      <div className="flex items-center gap-6 px-4 pt-2.5 border-b border-[#26262B] text-xs font-semibold overflow-x-auto custom-scrollbar shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab('library')}
          className={`pb-2.5 capitalize transition-colors cursor-pointer border-b-2 shrink-0 ${
            activeTab === 'library'
              ? 'text-white border-white'
              : 'text-[#71717A] border-transparent hover:text-[#D4D4D8]'
          }`}
        >
          My Assets ({mediaItems.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('import-url')}
          className={`pb-2.5 capitalize transition-colors cursor-pointer border-b-2 shrink-0 flex items-center gap-1.5 ${
            activeTab === 'import-url'
              ? 'text-white border-white'
              : 'text-[#71717A] border-transparent hover:text-[#D4D4D8]'
          }`}
        >
          <ExternalLink className="w-3 h-3 text-[#60A5FA]" />
          Import Web URL
        </button>
      </div>

      {/* ── Media Type Filter & Sort ── */}
      {activeTab === 'library' && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-[#26262B]/60 bg-[#141416] shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'image', label: 'Images' },
                { id: 'video', label: 'Videos' },
                { id: 'audio', label: 'Audio' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setFilterType(t.id)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all shrink-0 cursor-pointer ${
                  filterType === t.id
                    ? 'bg-[#3B82F6] text-white shadow-sm'
                    : 'bg-[#1C1C20] text-[#A1A1AA] hover:text-white hover:bg-[#26262C] border border-[#2A2A30]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {onCaptureCanvasSnapshot && (
              <button
                type="button"
                onClick={handleCaptureSnapshot}
                disabled={isCapturing}
                className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg bg-[#2A2A32] hover:bg-[#34343E] text-[#60A5FA] border border-[#3A3A44] transition-colors shrink-0"
                title="Snapshot current canvas frame to library"
              >
                <Camera className="w-3 h-3" />
                Snapshot
              </button>
            )}

            <button
              type="button"
              onClick={() =>
                setSortBy((prev) => (prev === 'newest' ? 'name' : prev === 'name' ? 'oldest' : 'newest'))
              }
              className="p-1.5 rounded-lg bg-[#2A2A32] hover:bg-[#34343E] text-zinc-300 text-[10px] flex items-center gap-1"
              title="Change sort order"
            >
              <ArrowUpDown className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* ── Main Content Area ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-3">
        {activeTab === 'import-url' ? (
          /* Import from Web URL Form */
          <div className="bg-[#1C1C20] border border-[#2A2A30] rounded-xl p-3.5 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#60A5FA]" />
              <span className="text-xs font-bold text-white">Import Web Asset into Project</span>
            </div>
            <p className="text-[11px] text-[#A1A1AA] leading-relaxed">
              Add any public web asset (image, video, or audio track) to your project media library.
            </p>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-mono-studio text-[#71717A]">Asset Name</label>
              <input
                type="text"
                value={importName}
                onChange={(e) => setImportName(e.target.value)}
                placeholder="e.g. Neon Horizon Background"
                className="bg-[#141417] border border-[#2A2A30] rounded-lg px-3 py-2 text-xs text-white placeholder:text-[#52525B] outline-none focus:border-[#3B82F6]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-mono-studio text-[#71717A]">Media Type</label>
              <div className="grid grid-cols-3 gap-2">
                {(['image', 'video', 'audio'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setImportType(t)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold capitalize border transition-all ${
                      importType === t
                        ? 'bg-[#3B82F6] text-white border-[#3B82F6]'
                        : 'bg-[#141417] text-[#A1A1AA] border-[#2A2A30] hover:text-white'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-mono-studio text-[#71717A]">Direct Web URL</label>
              <input
                type="url"
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
                placeholder="https://..."
                className="bg-[#141417] border border-[#2A2A30] rounded-lg px-3 py-2 text-xs text-white placeholder:text-[#52525B] outline-none focus:border-[#3B82F6]"
              />
            </div>

            <button
              type="button"
              onClick={handleAddFromUrl}
              disabled={!importUrl.trim()}
              className="mt-2 bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 text-white rounded-xl py-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-[#3B82F6]/20"
            >
              <Plus className="w-3.5 h-3.5" />
              Add to Project Media
            </button>
          </div>
        ) : (
          /* Library Grid */
          <>
            {/* Dropzone Upload Zone */}
            <div
              {...getRootProps()}
              className={`p-4 rounded-xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-1.5 ${
                isDragActive
                  ? 'border-[#3B82F6] bg-[#3B82F6]/10'
                  : 'border-[#2A2A30] hover:border-[#3B82F6]/50 bg-[#161619] hover:bg-[#1A1A1E]'
              }`}
            >
              <input {...getInputProps()} />
              <div className="w-8 h-8 rounded-full bg-[#24242A] flex items-center justify-center text-[#60A5FA]">
                <Upload className="w-4 h-4" />
              </div>
              <p className="text-xs font-bold text-white">
                Upload Images, Videos, or Audio
              </p>
              <p className="text-[10px] text-[#A1A1AA]">
                Drag &amp; drop or click to browse files (MP4, PNG, JPG, MP3)
              </p>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search assets in library..."
                className="w-full bg-[#1C1C20] border border-[#2A2A30] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-[#525252] outline-none focus:border-[#3B82F6]/60 transition-colors"
              />
            </div>

            {/* Assets Grid */}
            {filteredMedia.length === 0 ? (
              <div className="bg-[#1C1C20] border border-[#2A2A30] rounded-xl p-6 text-center text-xs text-[#A1A1AA]">
                No media assets found
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                {filteredMedia.map((item) => {
                  const isSelected = activeMediaUrl === item.url || appliedId === item.id;

                  return (
                    <motion.div
                      key={item.id}
                      onClick={() => handleApplyItem(item)}
                      whileHover={{ scale: 1.025, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      className={`group relative rounded-xl border overflow-hidden aspect-[9/13] bg-[#1C1C20] transition-all cursor-pointer flex flex-col justify-end text-left ${
                        isSelected
                          ? 'border-[#3B82F6] ring-2 ring-[#3B82F6]/40 shadow-lg shadow-[#3B82F6]/20'
                          : 'border-[#2A2A30] hover:border-[#3A3A42]'
                      }`}
                    >
                      {/* Media Preview Thumbnail */}
                      {item.type === 'image' && (
                        <img
                          src={item.url}
                          alt={item.name}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      )}
                      {item.type === 'video' && (
                        <video
                          src={item.url}
                          className="absolute inset-0 w-full h-full object-cover"
                          muted
                          loop
                        />
                      )}
                      {item.type === 'audio' && (
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-[#1C1C20] to-black flex items-center justify-center">
                          <Music className="w-10 h-10 text-[#60A5FA]/60" />
                        </div>
                      )}

                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                      {/* Top Action Icons */}
                      <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-10">
                        <span className="px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[8px] font-mono-studio text-white/80 border border-white/10 uppercase">
                          {item.type}
                        </span>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={(e) => handleCopyUrl(item.url, item.id, e)}
                            className="p-1.5 rounded-full bg-black/70 hover:bg-[#3B82F6] text-white transition-colors"
                            title="Copy URL"
                          >
                            {copiedId === item.id ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteItem(item.id, e)}
                            className="p-1.5 rounded-full bg-black/70 hover:bg-rose-600 text-white transition-colors"
                            title="Delete Asset"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Bottom Info */}
                      <div className="relative z-10 p-2.5">
                        <p className="text-[11px] font-bold text-white truncate drop-shadow-md">
                          {item.name}
                        </p>
                        <p className="text-[9px] text-[#A1A1AA]">{item.size}</p>
                      </div>

                      {/* Applied indicator */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 p-1 rounded-full bg-[#3B82F6] text-white shadow-md z-20">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MediaPane;

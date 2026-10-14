import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import * as htmlToImage from 'html-to-image';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  Upload,
  UploadCloud,
  FolderOpen,
  Image as ImageIcon,
  Film,
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
  type: 'image' | 'video';
  size: string;
  createdAt: number;
}

export interface MediaPaneProps {
  onApplyBackdrop: (url: string, isVideo: boolean) => void;
  onApplyAudio?: (url: string) => void;
  onCaptureCanvasSnapshot?: () => Promise<string | null>;
  activeMediaUrl?: string;
}

const LOCAL_STORAGE_MEDIA_KEY = 'apexmind_workspace_user_media_v2';

export const MediaPane: React.FC<MediaPaneProps> = ({
  onApplyBackdrop,
  onApplyAudio,
  onCaptureCanvasSnapshot,
  activeMediaUrl,
}) => {
  const [mediaItems, setMediaItems] = useState<UploadedMediaItem[]>([]);
  const [activeTab, setActiveTab] = useState<'library' | 'import-url'>('library');
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedId, setAppliedId] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<UploadedMediaItem | null>(null);

  // Custom Import URL state
  const [importUrl, setImportUrl] = useState('');
  const [importName, setImportName] = useState('');
  const [importType, setImportType] = useState<'image' | 'video'>('image');

  // Load from localStorage on mount (default is empty, never auto-populate starter items)
  useEffect(() => {
    try {
      // Clear legacy storage that had starter mock assets
      localStorage.removeItem('apexmind_workspace_user_media');
      const stored = localStorage.getItem(LOCAL_STORAGE_MEDIA_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const onlyUserMedia = parsed.filter(
            (item): item is UploadedMediaItem =>
              Boolean(item && (item.type === 'image' || item.type === 'video') && !item.id?.startsWith('asset-'))
          );
          setMediaItems(onlyUserMedia);
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
      const isVideo = file.type.startsWith('video') || Boolean(file.name.match(/\.(mp4|mov|webm|mkv)$/i));
      const isImage = file.type.startsWith('image') || Boolean(file.name.match(/\.(png|jpg|jpeg|webp)$/i));
      if (!isVideo && !isImage) return;

      const type: 'image' | 'video' = isVideo ? 'video' : 'image';
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

        try {
          confetti({
            particleCount: 25,
            spread: 45,
            origin: { y: 0.8 },
          });
        } catch {}
      };
      reader.readAsDataURL(file);
    });
  };

  const { getRootProps, getInputProps, isDragActive, open: openFilePicker } = useDropzone({
    onDrop,
    noClick: false,
    noKeyboard: false,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
      'video/*': ['.mp4', '.mov', '.webm', '.mkv'],
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
    }
    setTimeout(() => setAppliedId(null), 2000);
  };

  const handleDeleteItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = mediaItems.filter((i) => i.id !== id);
    persistItems(updated);
  };

  const handleClearAll = () => {
    if (window.confirm('Clear all uploaded images and videos from this project?')) {
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
      {/* ── Top Header Bar (Matching Studio Shell) ── */}
      <div className="relative h-11 px-3.5 bg-[#17171A] border-b border-[#26262B] flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <FolderOpen className="w-4 h-4 shrink-0 text-blue-400" />
          <span className="text-xs font-bold text-white truncate">
            Project Media Library
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {mediaItems.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="h-7 px-2.5 rounded-md bg-[#222226] hover:bg-rose-500/15 text-[11px] font-medium text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer border border-[#323238] flex items-center gap-1"
            >
              Clear
            </button>
          )}
          <span className="text-[10px] font-mono-studio text-[#A1A1AA] bg-[#222226] px-2 py-0.5 rounded-full border border-[#2F2F36]">
            {filteredMedia.length} Assets
          </span>
        </div>
      </div>

      {/* ── Subtabs Header Bar ── */}
      <div className="flex items-center gap-4 sm:gap-5 px-3.5 pt-2 border-b border-[#26262B] text-xs font-semibold overflow-x-auto custom-scrollbar shrink-0 bg-[#141417]">
        <button
          type="button"
          onClick={() => setActiveTab('library')}
          className={`pb-2 capitalize transition-colors cursor-pointer border-b-2 shrink-0 ${
            activeTab === 'library'
              ? 'text-white border-white'
              : 'text-[#71717A] border-transparent hover:text-[#D4D4D8]'
          }`}
        >
          My Uploads ({mediaItems.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('import-url')}
          className={`pb-2 capitalize transition-colors cursor-pointer border-b-2 shrink-0 flex items-center gap-1.5 ${
            activeTab === 'import-url'
              ? 'text-white border-white'
              : 'text-[#71717A] border-transparent hover:text-[#D4D4D8]'
          }`}
        >
          <ExternalLink className="w-3.5 h-3.5 text-[#60A5FA]" />
          <span>Web Import</span>
        </button>
      </div>

      {/* ── Media Type Filter & Sort ── */}
      {activeTab === 'library' && mediaItems.length > 0 && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-[#26262B]/60 bg-[#141416] shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'image', label: 'Images' },
                { id: 'video', label: 'Videos' },
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
              <span className="text-xs font-bold text-white">Import Web Media</span>
            </div>
            <p className="text-[11px] text-[#A1A1AA] leading-relaxed">
              Add any direct web image or video URL into your project uploads.
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
              <div className="grid grid-cols-2 gap-2">
                {(['image', 'video'] as const).map((t) => (
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
                    {t === 'image' ? 'Image' : 'Video'}
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
              Add to Project Uploads
            </button>
          </div>
        ) : mediaItems.length === 0 ? (
          /* Empty State - Prominent Hero Dropzone */
          <div
            {...getRootProps()}
            className={`flex-1 min-h-[300px] p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-3 my-auto ${
              isDragActive
                ? 'border-[#3B82F6] bg-[#3B82F6]/10 shadow-lg shadow-[#3B82F6]/20'
                : 'border-[#2A2A30] hover:border-[#3B82F6]/60 bg-[#16161A] hover:bg-[#1A1A20]'
            }`}
          >
            <input {...getInputProps()} />
            <div className="w-14 h-14 rounded-2xl bg-[#222228] border border-[#2F2F38] flex items-center justify-center text-[#60A5FA] shadow-inner">
              <UploadCloud className="w-7 h-7" />
            </div>
            <div className="flex flex-col gap-1 max-w-[260px]">
              <p className="text-sm font-bold text-white">Upload Images &amp; Videos</p>
              <p className="text-xs text-[#A1A1AA] leading-relaxed">
                Drag &amp; drop files here, or browse from your device
              </p>
            </div>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap justify-center">
              <span className="px-2 py-0.5 rounded-md bg-[#222228] border border-[#2E2E36] text-[10px] font-mono-studio text-[#94A3B8]">
                MP4 • MOV • WEBM
              </span>
              <span className="px-2 py-0.5 rounded-md bg-[#222228] border border-[#2E2E36] text-[10px] font-mono-studio text-[#94A3B8]">
                PNG • JPG • WEBP
              </span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openFilePicker();
              }}
              className="mt-2 h-8 px-4 rounded-lg bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-semibold shadow-md shadow-[#3B82F6]/25 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Select Files</span>
            </button>
          </div>
        ) : (
          /* Populated Library: Compact dropzone + search + grid */
          <>
            {/* Compact Dropzone */}
            <div
              {...getRootProps()}
              className={`p-3 rounded-xl border-2 border-dashed transition-all cursor-pointer flex items-center justify-center text-center gap-2 ${
                isDragActive
                  ? 'border-[#3B82F6] bg-[#3B82F6]/10'
                  : 'border-[#2A2A30] hover:border-[#3B82F6]/50 bg-[#161619] hover:bg-[#1A1A1E]'
              }`}
            >
              <input {...getInputProps()} />
              <div className="w-6 h-6 rounded-full bg-[#24242A] flex items-center justify-center text-[#60A5FA]">
                <Upload className="w-3 h-3" />
              </div>
              <p className="text-[11px] font-medium text-zinc-300">
                Drag &amp; drop more images or videos here, or <span className="text-[#60A5FA] underline">browse</span>
              </p>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search uploads..."
                className="w-full bg-[#1C1C20] border border-[#2A2A30] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-[#525252] outline-none focus:border-[#3B82F6]/60 transition-colors"
              />
            </div>

            {/* Assets Grid */}
            {filteredMedia.length === 0 ? (
              <div className="bg-[#1C1C20] border border-[#2A2A30] rounded-xl p-6 text-center text-xs text-[#A1A1AA]">
                No matching media uploads found
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
                            title="Copy Media URL"
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

import React, { useState, useEffect } from 'react';
import {
  X,
  Youtube,
  Instagram,
  Facebook,
  Check,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Share2,
  Film,
  Send,
  Loader2,
  Radio,
} from 'lucide-react';
import { socialApi } from '../api/socialApi';
import { SocialAccount, SocialPlatform, PlatformPublishResult } from '../types';
import { getSocialAvatarFallback, handleSocialAvatarError } from '../utils/avatar';

interface OmnichannelPublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  defaultTitle: string;
  defaultCaption?: string;
  coverImageUrl?: string;
}

export const OmnichannelPublishModal: React.FC<OmnichannelPublishModalProps> = ({
  isOpen,
  onClose,
  videoUrl,
  defaultTitle,
  defaultCaption = '',
  coverImageUrl,
}) => {
  const [fleet, setFleet] = useState<SocialAccount[]>([]);
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [activePreviewTab, setActivePreviewTab] = useState<SocialPlatform>('youtube');

  // Form Fields
  const [title, setTitle] = useState(defaultTitle || 'Master the Mind: Stoic Lesson');
  const [caption, setCaption] = useState(defaultCaption || 'The obstacle in the path becomes the path. #Motivation #AI');
  const [publishing, setPublishing] = useState(false);
  const [publishResults, setPublishResults] = useState<PlatformPublishResult[] | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      socialApi.getFleetAccounts().then((accounts) => {
        setFleet(accounts);
        // Default select all connected accounts
        setSelectedAccountIds(accounts.map((a) => a.id));
        if (accounts.length > 0) {
          setActivePreviewTab(accounts[0].platform);
        }
      }).catch((err: Error) => {
        setFleet([]);
        setErrorMsg(err.message || 'Could not load connected social accounts.');
      });
      setTitle(defaultTitle || 'Master the Mind: Stoic Lesson');
      setCaption(defaultCaption || 'The obstacle in the path becomes the path. #Motivation #AI');
      setPublishResults(null);
      setErrorMsg(null);
    }
  }, [isOpen, defaultTitle, defaultCaption]);

  if (!isOpen) return null;

  const toggleAccountSelection = (id: string) => {
    setSelectedAccountIds((prev) =>
      prev.includes(id) ? prev.filter((accId) => accId !== id) : [...prev, id]
    );
  };

  const getPlatformIcon = (platform: SocialPlatform) => {
    switch (platform) {
      case 'youtube':
        return <Youtube className="w-4 h-4 text-red-500 fill-current" />;
      case 'instagram':
        return <Instagram className="w-4 h-4 text-pink-500" />;
      case 'facebook':
        return <Facebook className="w-4 h-4 text-blue-500" />;
      default:
        return <Radio className="w-4 h-4 text-zinc-400" />;
    }
  };

  const handleSyndicatePublish = async () => {
    if (selectedAccountIds.length === 0) {
      setErrorMsg('Please select at least one social destination to publish.');
      return;
    }

    setPublishing(true);
    setErrorMsg(null);

    try {
      const res = await socialApi.syndicatePublish({
        targetAccountIds: selectedAccountIds,
        videoUrl: videoUrl || 'https://cdn.pixabay.com/video/2020/04/18/36423-411516053_tiny.mp4',
        title: title.trim(),
        description: caption.trim(),
        tags: ['Shorts', 'Reels', 'Motivation', 'AI', 'Discipline'],
        privacy: 'public',
      });

      setPublishResults(res.results);
      window.dispatchEvent(new CustomEvent('social:fleet-updated'));
    } catch (err: any) {
      setErrorMsg(err.message || 'Omnichannel syndication failed. Please check network.');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in">
      <div className="relative w-full max-w-3xl rounded-2xl border border-[#27272A] bg-[#121215] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Top Bar */}
        <div className="p-5 border-b border-[#242426] flex items-center justify-between bg-[#151518]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-blue-900/40">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Omnichannel Cross-Publish</span>
                <span className="text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.2 rounded uppercase">
                  Multi-Platform
                </span>
              </h2>
              <p className="text-xs text-[#A1A1AA]">
                Syndicate video simultaneously across YouTube Shorts, Instagram Reels, and Facebook
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#A1A1AA] hover:text-white hover:bg-[#222226] cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Post-Publish Celebration View */}
          {publishResults ? (
            <div className="space-y-5 py-4">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/50">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Omnichannel Syndication Dispatched!</h3>
                <p className="text-xs text-[#A1A1AA] max-w-md mx-auto">
                  Your AI video has been broadcast to all selected destinations with automated AI disclosures and platform-tailored tags.
                </p>
              </div>

              <div className="rounded-xl border border-[#27272A] bg-[#16161A] divide-y divide-[#242428] overflow-hidden">
                {publishResults.map((result) => (
                  <div key={result.accountId} className="p-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-[#202026]">
                        {getPlatformIcon(result.platform)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{result.accountName}</span>
                          <span className="text-[9px] uppercase px-1 rounded bg-zinc-800 text-zinc-400 font-mono">
                            {result.platform}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#A1A1AA]">{result.message}</p>
                      </div>
                    </div>

                    {result.url ? (
                      <a
                        href={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 hover:text-white border border-blue-500/30 text-xs font-semibold transition-colors"
                      >
                        <span>View Post</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <span className="text-xs font-semibold text-emerald-400">Published</span>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white cursor-pointer shadow-md transition-colors"
                >
                  Return to Studio
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Error Notice */}
              {errorMsg && (
                <div className="p-3 rounded-xl border border-red-500/30 bg-red-950/30 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Destination Checklist */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <span>1. Select Destinations ({selectedAccountIds.length} Selected)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedAccountIds.length === fleet.length) setSelectedAccountIds([]);
                      else setSelectedAccountIds(fleet.map((a) => a.id));
                    }}
                    className="text-[11px] text-blue-400 hover:text-blue-300 cursor-pointer"
                  >
                    {selectedAccountIds.length === fleet.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                {fleet.length === 0 ? (
                  <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-950/20 text-amber-200 text-xs">
                    No social accounts connected yet. Connect a YouTube, Instagram, or Facebook account from the Social Accounts page.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {fleet.map((acc) => {
                      const isSelected = selectedAccountIds.includes(acc.id);
                      return (
                        <div
                          key={acc.id}
                          onClick={() => toggleAccountSelection(acc.id)}
                          className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer select-none transition-all ${
                            isSelected
                              ? 'border-blue-500/50 bg-blue-950/20 shadow-xs'
                              : 'border-[#27272A] bg-[#161619] opacity-60 hover:opacity-100 hover:border-[#3F3F46]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="relative">
                              <img
                                src={acc.avatarUrl || getSocialAvatarFallback(acc.name)}
                                alt=""
                                className="w-8 h-8 rounded-full object-cover border border-zinc-700"
                                onError={(event) => handleSocialAvatarError(event, acc.name)}
                              />
                              <div className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-[#121215]">
                                {getPlatformIcon(acc.platform)}
                              </div>
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-white truncate">{acc.name}</p>
                              <p className="text-[10px] text-[#A1A1AA] truncate">{acc.handle}</p>
                            </div>
                          </div>

                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ml-2 transition-colors ${
                              isSelected ? 'bg-blue-600 border-blue-500 text-white' : 'border-zinc-600'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Title & Caption Inputs */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-white uppercase tracking-wider block">
                  2. Customize Post Details
                </label>
                <div className="space-y-1">
                  <span className="text-[11px] font-medium text-[#A1A1AA]">Post Title / Video Hook</span>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter short title..."
                    className="w-full rounded-xl border border-[#27272A] bg-[#18181B] px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-medium text-[#A1A1AA]">Caption, Hashtags & Description</span>
                  <textarea
                    rows={3}
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Write your caption with hashtags..."
                    className="w-full rounded-xl border border-[#27272A] bg-[#18181B] px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none resize-none leading-relaxed"
                  />
                </div>
              </div>

              {/* Live Preview Tabs */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white uppercase tracking-wider block">
                    3. Platform Layout Preview
                  </label>
                  <div className="flex items-center gap-1 bg-[#18181B] p-0.5 rounded-lg border border-[#27272A]">
                    {(['youtube', 'instagram', 'facebook'] as SocialPlatform[]).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setActivePreviewTab(p)}
                        className={`px-2 py-1 text-[10px] font-semibold rounded-md uppercase transition-colors cursor-pointer ${
                          activePreviewTab === p ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preview Card */}
                <div className="rounded-xl border border-[#27272A] bg-[#161619] p-4 flex gap-4 items-start">
                  {/* Video Thumbnail Miniature */}
                  <div className="w-24 h-36 rounded-lg bg-zinc-800 border border-zinc-700 shrink-0 overflow-hidden relative flex items-center justify-center">
                    {coverImageUrl ? (
                      <img src={coverImageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Film className="w-6 h-6 text-zinc-500" />
                    )}
                    <span className="absolute bottom-1 right-1 px-1 py-0.2 bg-black/80 text-[8px] text-white rounded font-mono">
                      0:30
                    </span>
                  </div>

                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-1.5">
                      {getPlatformIcon(activePreviewTab)}
                      <span className="text-xs font-bold text-white capitalize">{activePreviewTab} Format</span>
                    </div>

                    <p className="text-xs font-bold text-white truncate">{title}</p>
                    <p className="text-[11px] text-[#A1A1AA] line-clamp-2 leading-relaxed">{caption}</p>

                    <div className="p-2 rounded-lg bg-[#1E1E24] border border-[#292932] text-[10px] text-zinc-400">
                      <span className="text-blue-400 font-semibold">Compliance Engine:</span> Automatically appending{' '}
                      <span className="font-mono text-zinc-300">
                        {activePreviewTab === 'youtube'
                          ? '#Shorts & 🤖 AI Disclosure'
                          : '#AIGenerated'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer Actions */}
        {!publishResults && (
          <div className="p-4 border-t border-[#242426] bg-[#151518] flex items-center justify-between">
            <span className="text-xs text-[#71717A]">
              Selected {selectedAccountIds.length} of {fleet.length} destinations
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-[#2E2E34] hover:bg-[#202026] text-xs font-medium text-zinc-300 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSyndicatePublish}
                disabled={publishing || selectedAccountIds.length === 0}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-xs font-bold text-white shadow-lg shadow-blue-950/50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
              >
                {publishing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Publishing to selected accounts...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Publish to {selectedAccountIds.length} Destination{selectedAccountIds.length === 1 ? '' : 's'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

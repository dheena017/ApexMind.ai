import React from 'react';
import { Copy, Check, ShieldCheck } from 'lucide-react';
import { Card, Badge, Button } from '@/src/shared/ui/common';
import { YouTubeChannel } from '../types';
import { YouTubeIcon } from '../components/YouTubeIcon';

export interface YouTubeSettingsPageProps {
  channels: YouTubeChannel[];
  copiedId: string | null;
  onCopyId: (id: string) => void;
  onOpenCorrectModal: (ch: YouTubeChannel) => void;
  onDisconnectChannel?: (id: string, name: string) => void;
  onDeleteChannel?: (id: string, name: string) => void;
  onOpenConnectModal: () => void;
}

export const YouTubeSettingsPage: React.FC<YouTubeSettingsPageProps> = ({
  channels,
  copiedId,
  onCopyId,
  onOpenCorrectModal,
  onDisconnectChannel,
  onDeleteChannel,
  onOpenConnectModal,
}) => {
  const activeChannel = channels[0];
  const handleDisconnect = onDisconnectChannel || onDeleteChannel || (() => {});

  return (
    <div className="space-y-6 animate-fade-in font-sans-studio text-[#E5E5E5]">
      {/* Connected Channel Config */}
      <Card className="bg-[#141414] border-[#2F2F2F] p-6 rounded-2xl shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-[#262626] mb-4">
          <div>
            <h3 className="text-base font-bold text-white">Connected Channel Configuration</h3>
            <p className="text-xs text-[#9CA3AF]">Manage handle binding, channel identifier, and verification status</p>
          </div>
          <Badge variant="blue">Live Verified</Badge>
        </div>

        {activeChannel ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl bg-[#121212] border border-[#2F2F2F] space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#9CA3AF] tracking-wide">YouTube Handle</span>
                <p className="text-sm font-bold text-white font-mono-studio">{activeChannel.handle}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#121212] border border-[#2F2F2F] space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#9CA3AF] tracking-wide">Channel ID</span>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-mono-studio text-[#60A5FA] truncate">{activeChannel.id}</p>
                  <button
                    onClick={() => onCopyId(activeChannel.id)}
                    className="text-xs text-[#9CA3AF] hover:text-white transition-colors cursor-pointer"
                    title="Copy Channel ID"
                  >
                    {copiedId === activeChannel.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                size="sm"
                variant="outline"
                icon={<YouTubeIcon />}
                onClick={onOpenConnectModal}
              >
                Switch Channel
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => handleDisconnect(activeChannel.id, activeChannel.name)}
              >
                Disconnect Channel
              </Button>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center text-[#9CA3AF] space-y-3">
            <p className="text-xs">No channel connected currently.</p>
            <Button size="sm" variant="primary" icon={<YouTubeIcon />} onClick={onOpenConnectModal}>
              Connect YouTube Channel
            </Button>
          </div>
        )}
      </Card>

      {/* Publishing Preferences */}
      <Card className="bg-[#141414] border-[#2F2F2F] p-6 rounded-2xl shadow-xl">
        <h3 className="text-base font-bold text-white pb-3 border-b border-[#262626] mb-4">
          Automated Publishing Defaults
        </h3>

        <div className="space-y-4 text-xs text-[#E5E5E5]">
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#121212] border border-[#2F2F2F]">
            <div>
              <h4 className="font-semibold text-white">Default Shorts Visibility</h4>
              <p className="text-[11px] text-[#9CA3AF]">Videos uploaded through automation default to Public</p>
            </div>
            <Badge variant="green">Public</Badge>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-[#121212] border border-[#2F2F2F]">
            <div>
              <h4 className="font-semibold text-white">AI Content Disclosure Tag</h4>
              <p className="text-[11px] text-[#9CA3AF]">Include synthetic voice and AI-generated script label in YouTube description</p>
            </div>
            <Badge variant="blue">Automated</Badge>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-[#121212] border border-[#2F2F2F]">
            <div>
              <h4 className="font-semibold text-white">SEO Hashtag Auto-Generation</h4>
              <p className="text-[11px] text-[#9CA3AF]">Automatically generate high-CTR motivational hashtags based on monologue</p>
            </div>
            <Badge variant="green">Enabled</Badge>
          </div>
        </div>
      </Card>

      {/* YouTube Data API Health */}
      <Card className="bg-[#141414] border-[#2F2F2F] p-6 rounded-2xl shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">YouTube Data API v3 Health</h4>
              <p className="text-xs text-[#9CA3AF]">Live channel stats and quotas verified server-side</p>
            </div>
          </div>
          <Badge variant="green">Operational</Badge>
        </div>
      </Card>
    </div>
  );
};

export default YouTubeSettingsPage;

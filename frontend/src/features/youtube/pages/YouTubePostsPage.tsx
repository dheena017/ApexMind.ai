import React, { useState } from 'react';
import { MessageSquare, ThumbsUp, MessageCircle, Send, Sparkles, Youtube, CheckCircle2 } from 'lucide-react';
import { Card, Badge, Button } from '@/src/shared/ui/common';
import { YouTubeChannel } from '../types';

export interface YouTubePostsPageProps {
  channels: YouTubeChannel[];
}

export const YouTubePostsPage: React.FC<YouTubePostsPageProps> = ({
  channels,
}) => {
  const activeChannel = channels[0];
  const [postText, setPostText] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [publishedSuccess, setPublishedSuccess] = useState(false);

  const [posts, setPosts] = useState([
    {
      id: 'p-1',
      author: activeChannel?.name || 'Emoji Eye Spy',
      handle: activeChannel?.handle || '@EmojiEyeSpy',
      avatarUrl: activeChannel?.avatarUrl,
      content:
        '“You cannot control the storm, but you can control the sail.” — What is one challenge you decided to conquer today instead of complaining about? Drop your answer below. 👇',
      likes: 184,
      comments: 32,
      publishedAt: '2026-10-11T09:00:00Z',
    },
    {
      id: 'p-2',
      author: activeChannel?.name || 'Emoji Eye Spy',
      handle: activeChannel?.handle || '@EmojiEyeSpy',
      avatarUrl: activeChannel?.avatarUrl,
      content:
        'New 9:16 Short dropping tomorrow at 08:00 AM EST on "Silent Discipline & Relentless Consistency". Turn on your notifications so you do not miss the morning momentum burst. ⚡',
      likes: 242,
      comments: 18,
      publishedAt: '2026-10-09T17:30:00Z',
    },
    {
      id: 'p-3',
      author: activeChannel?.name || 'Emoji Eye Spy',
      handle: activeChannel?.handle || '@EmojiEyeSpy',
      avatarUrl: activeChannel?.avatarUrl,
      content:
        'Daily Stoic Reminder: Most things you worry about either will never happen or are outside your sphere of control. Focus solely on what is yours to build.',
      likes: 310,
      comments: 45,
      publishedAt: '2026-10-06T08:15:00Z',
    },
  ]);

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postText.trim()) return;
    setPublishing(true);

    setTimeout(() => {
      setPosts((prev) => [
        {
          id: `p-${Date.now()}`,
          author: activeChannel?.name || 'Emoji Eye Spy',
          handle: activeChannel?.handle || '@EmojiEyeSpy',
          avatarUrl: activeChannel?.avatarUrl,
          content: postText,
          likes: 0,
          comments: 0,
          publishedAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      setPostText('');
      setPublishing(false);
      setPublishedSuccess(true);
      setTimeout(() => setPublishedSuccess(false), 3500);
    }, 600);
  };

  const generateAIQuote = () => {
    const quotes = [
      '“He who has a why to live can bear almost any how.” What is your driving reason this week?',
      '“Do not explain your philosophy. Embody it.” Every action is a vote for who you are becoming.',
      '“First say to yourself what you would be; and then do what you have to do.” — Epictetus',
      'The obstacle in your path is not in the way. It IS the way. Embrace the friction today.',
    ];
    setPostText(quotes[Math.floor(Math.random() * quotes.length)]);
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans-studio text-[#E5E5E5]">
      {/* ── Create Community Post Creator Card ── */}
      <Card className="bg-[#141414] border-[#2F2F2F] p-6 rounded-2xl shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#262626]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#3B82F6]/10 text-[#60A5FA] border border-[#3B82F6]/20">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">YouTube Community Post Publisher</h3>
              <p className="text-xs text-[#9CA3AF]">Publish daily motivational quotes, audience questions, and text updates</p>
            </div>
          </div>

          <Button
            size="sm"
            variant="secondary"
            icon={<Sparkles className="w-3.5 h-3.5 text-[#60A5FA]" />}
            onClick={generateAIQuote}
            className="text-xs hover:border-[#3B82F6]/50"
          >
            Generate AI Quote
          </Button>
        </div>

        <form onSubmit={handlePublish} className="space-y-3">
          <textarea
            value={postText}
            onChange={(e) => setPostText(e.target.value)}
            rows={3}
            placeholder="Share a thought, daily reflection, or announcement with your subscribers..."
            className="w-full bg-[#0A0A0A] border border-[#2F2F2F] rounded-xl p-3.5 text-xs text-white placeholder-[#6B7280] outline-none focus:border-[#3B82F6] transition-colors resize-none leading-relaxed"
          />

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-[#9CA3AF]">
              {publishedSuccess ? (
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Published to YouTube Community!
                </span>
              ) : (
                'Posts directly to connected YouTube channel feed'
              )}
            </span>

            <Button
              type="submit"
              size="sm"
              variant="primary"
              disabled={publishing || !postText.trim()}
              icon={<Send className="w-3.5 h-3.5" />}
              className="text-xs font-bold"
            >
              {publishing ? 'Publishing…' : 'Publish to Community'}
            </Button>
          </div>
        </form>
      </Card>

      {/* ── Community Posts Feed ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold uppercase tracking-wider text-[#9CA3AF]">
            Published Community Posts
          </h4>
          <Badge variant="blue">{posts.length} Posts Active</Badge>
        </div>

        <div className="space-y-4">
          {posts.map((post) => (
            <Card
              key={post.id}
              className="bg-[#141414] border-[#2F2F2F] p-5 rounded-2xl space-y-3.5 hover:border-[#3B82F6]/40 transition-colors shadow-lg"
            >
              {/* Post Author Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {post.avatarUrl ? (
                    <img
                      src={post.avatarUrl}
                      alt={post.author}
                      className="w-9 h-9 rounded-xl border border-[#2F2F2F] object-cover"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center">
                      <Youtube className="w-4 h-4" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h5 className="font-bold text-white text-xs">{post.author}</h5>
                      <span className="text-emerald-400 text-[10px]">✓</span>
                    </div>
                    <p className="text-[11px] text-[#9CA3AF] font-mono-studio">{post.handle}</p>
                  </div>
                </div>

                <span className="text-[10px] text-[#6B7280]">
                  {new Date(post.publishedAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              {/* Post Content */}
              <p className="text-xs text-[#E5E5E5] leading-relaxed whitespace-pre-wrap">
                {post.content}
              </p>

              {/* Engagement Footer */}
              <div className="pt-2 border-t border-[#262626] flex items-center gap-4 text-xs text-[#9CA3AF]">
                <div className="flex items-center gap-1.5 font-mono-studio text-[11px] text-white">
                  <ThumbsUp className="w-3.5 h-3.5 text-[#60A5FA]" />
                  <span>{post.likes} likes</span>
                </div>
                <div className="flex items-center gap-1.5 font-mono-studio text-[11px] text-[#9CA3AF]">
                  <MessageCircle className="w-3.5 h-3.5 text-purple-400" />
                  <span>{post.comments} comments</span>
                </div>
                <span className="ml-auto text-[10px] text-emerald-400 font-semibold">
                  Live on YouTube
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default YouTubePostsPage;

import React, { useEffect, useState, useMemo } from 'react';
import {
  Bell,
  CheckCircle2,
  Info,
  Award,
  AlertTriangle,
  Trash2,
  Check,
  CheckCheck,
  Search,
  ExternalLink,
  Youtube,
  Wand2,
  Filter,
  Sparkles,
  PlusCircle,
  Eye,
  EyeOff,
  RefreshCw,
  Radio,
} from 'lucide-react';
import { Button, Card, Badge } from '@/src/shared/ui/common';
import { notificationsApi } from '../api/notificationsApi';
import { NotificationItem, NotificationCategory } from '../types';
import { formatTimeAgo } from '../utils';

interface NotificationsPageProps {
  onNavigate?: (page: string) => void;
}

export default function NotificationsPage({ onNavigate }: NotificationsPageProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<NotificationCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSimulateMenu, setShowSimulateMenu] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await notificationsApi.getNotifications();
      setNotifications(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const triggerToast = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 3000);
  };

  const handleMarkAllRead = async () => {
    await notificationsApi.markNotificationsRead(activeTab !== 'all' && activeTab !== 'unread' ? activeTab : undefined);
    setNotifications((prev) =>
      prev.map((n) => {
        if (activeTab === 'all' || activeTab === 'unread' || n.category === activeTab) {
          return { ...n, read: true };
        }
        return n;
      })
    );
    triggerToast('Marked all as read');
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to delete notifications?')) return;
    const cat = activeTab !== 'all' && activeTab !== 'unread' ? activeTab : undefined;
    await notificationsApi.clearNotifications(cat);
    if (cat) {
      setNotifications((prev) => prev.filter((n) => n.category !== cat));
    } else {
      setNotifications([]);
    }
    triggerToast('Cleared notifications');
  };

  const handleToggleRead = async (item: NotificationItem) => {
    const nextRead = !item.read;
    await notificationsApi.markNotificationRead(item.id, nextRead);
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, read: nextRead } : n))
    );
  };

  const handleDeleteItem = async (id: string) => {
    await notificationsApi.deleteNotification(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    triggerToast('Notification removed');
  };

  const handleSimulateAlert = async (type: string, category: string, title: string, message: string, actionUrl?: string) => {
    setShowSimulateMenu(false);
    try {
      const created = await notificationsApi.createNotification({
        title,
        message,
        type,
        category,
        action_url: actionUrl,
        priority: type === 'warning' ? 'high' : 'normal',
      });
      if (created) {
        setNotifications((prev) => [created, ...prev]);
        triggerToast(`Added test notification: "${title}"`);
      }
    } catch (err) {
      console.error('Failed to create simulation notification:', err);
    }
  };

  // Counts per tab
  const counts = useMemo(() => {
    return {
      all: notifications.length,
      unread: notifications.filter((n) => !n.read).length,
      youtube: notifications.filter((n) => n.category === 'youtube').length,
      studio: notifications.filter((n) => n.category === 'studio').length,
      achievements: notifications.filter((n) => n.type === 'achievement' || n.category === 'achievements').length,
      system: notifications.filter((n) => n.category === 'system' || !n.category).length,
    };
  }, [notifications]);

  // Filtered notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      // Tab filter
      if (activeTab === 'unread' && item.read) return false;
      if (activeTab === 'youtube' && item.category !== 'youtube') return false;
      if (activeTab === 'studio' && item.category !== 'studio') return false;
      if (activeTab === 'achievements' && item.type !== 'achievement' && item.category !== 'achievements') return false;
      if (activeTab === 'system' && item.category && item.category !== 'system') return false;

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesMsg = item.message.toLowerCase().includes(query);
        const matchesCat = item.category?.toLowerCase().includes(query);
        return matchesTitle || matchesMsg || matchesCat;
      }
      return true;
    });
  }, [notifications, activeTab, searchQuery]);

  const getIcon = (type: string, category?: string) => {
    if (category === 'youtube') {
      return <Youtube className="w-5 h-5 text-red-400" />;
    }
    if (category === 'studio') {
      return <Wand2 className="w-5 h-5 text-[#60A5FA]" />;
    }
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case 'achievement':
        return <Award className="w-5 h-5 text-amber-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-rose-400" />;
      default:
        return <Info className="w-5 h-5 text-[#60A5FA]" />;
    }
  };

  const getCategoryBadge = (category?: string) => {
    switch (category) {
      case 'youtube':
        return <span className="text-[10px] font-semibold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">YouTube</span>;
      case 'studio':
        return <span className="text-[10px] font-semibold text-[#60A5FA] bg-[#3B82F6]/10 border border-[#3B82F6]/20 px-2 py-0.5 rounded-full">AI Studio</span>;
      case 'achievements':
        return <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">Milestone</span>;
      default:
        return <span className="text-[10px] font-semibold text-[#9CA3AF] bg-[#2A2A2A] border border-[#3A3A3A] px-2 py-0.5 rounded-full">System</span>;
    }
  };

  return (
    <div className="w-full space-y-6 max-w-5xl mx-auto font-sans-studio">
      {/* Toast Alert Feedback */}
      {actionSuccess && (
        <div className="fixed top-20 right-6 z-50 bg-[#1E1E1E] text-white border border-[#3B82F6]/40 shadow-xl rounded-xl px-4 py-2.5 flex items-center gap-2.5 text-xs animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-[#60A5FA]" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#2F2F2F]">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-[#3B82F6]/10 border border-[#3B82F6]/20 text-[#60A5FA]">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-extrabold tracking-tight text-white">Notifications & Alerts</h1>
              {counts.unread > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#3B82F6]/20 text-[#60A5FA] border border-[#3B82F6]/30">
                  {counts.unread} unread
                </span>
              )}
            </div>
            <p className="text-xs text-[#9CA3AF] mt-0.5">
              Live updates on automated YouTube uploads, AI audio rendering, milestone records & schedules
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Simulate Alert Dropdown */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              icon={<Sparkles className="w-3.5 h-3.5 text-amber-400" />}
              onClick={() => setShowSimulateMenu(!showSimulateMenu)}
            >
              Test Alert
            </Button>
            {showSimulateMenu && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl bg-[#1E1E1E] border border-[#2F2F2F] shadow-2xl p-1.5 z-50 space-y-1">
                <div className="px-2.5 py-1 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">
                  Generate Simulation Alert
                </div>
                <button
                  onClick={() =>
                    handleSimulateAlert('success', 'youtube', 'Short Published', "'The Discipline Law' was published to YouTube Shorts.", '/youtube')
                  }
                  className="w-full text-left px-2.5 py-1.5 text-xs rounded-lg hover:bg-[#2A2A2A] text-white flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Youtube className="w-3.5 h-3.5 text-red-400" />
                  <span>YouTube Upload Done</span>
                </button>
                <button
                  onClick={() =>
                    handleSimulateAlert('success', 'studio', 'Voice Synthesized', "Gemini ultra voice 'Fenrir' rendered in 3.4s.", '/workspace')
                  }
                  className="w-full text-left px-2.5 py-1.5 text-xs rounded-lg hover:bg-[#2A2A2A] text-white flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Wand2 className="w-3.5 h-3.5 text-[#60A5FA]" />
                  <span>AI Studio Render Done</span>
                </button>
                <button
                  onClick={() =>
                    handleSimulateAlert('achievement', 'achievements', '10,000 Views Milestone', 'Your Stoic Mindset reel crossed 10K views!', '/youtube')
                  }
                  className="w-full text-left px-2.5 py-1.5 text-xs rounded-lg hover:bg-[#2A2A2A] text-white flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span>Milestone Unlocked</span>
                </button>
                <button
                  onClick={() =>
                    handleSimulateAlert('warning', 'system', 'YouTube API Quota', '85% of daily YouTube upload quota consumed today.')
                  }
                  className="w-full text-left px-2.5 py-1.5 text-xs rounded-lg hover:bg-[#2A2A2A] text-white flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  <span>System Quota Alert</span>
                </button>
              </div>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            icon={<CheckCheck className="w-4 h-4 text-emerald-400" />}
            onClick={handleMarkAllRead}
            disabled={notifications.length === 0}
          >
            Mark All Read
          </Button>

          <Button
            variant="danger"
            size="sm"
            icon={<Trash2 className="w-4 h-4" />}
            onClick={handleClearAll}
            disabled={notifications.length === 0}
          >
            Clear All
          </Button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: 'all', label: 'All', count: counts.all },
            { id: 'unread', label: 'Unread', count: counts.unread },
            { id: 'youtube', label: 'YouTube', count: counts.youtube },
            { id: 'studio', label: 'AI Studio', count: counts.studio },
            { id: 'achievements', label: 'Milestones', count: counts.achievements },
            { id: 'system', label: 'System', count: counts.system },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as NotificationCategory)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer border ${
                  isActive
                    ? 'bg-[#1E1E1E] text-white border-[#3B82F6]/50'
                    : 'text-[#9CA3AF] hover:text-[#E5E5E5] hover:bg-[#181818] border-transparent'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isActive
                      ? 'bg-[#3B82F6] text-white font-bold'
                      : 'bg-[#2A2A2A] text-[#9CA3AF]'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search alerts..."
            className="w-full bg-[#141414] border border-[#2F2F2F] focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] text-xs text-white pl-9 pr-8 py-1.5 rounded-xl outline-none placeholder-[#6B7280] transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-white text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      {loading ? (
        <Card className="text-center py-16 space-y-3">
          <div className="w-6 h-6 mx-auto border-2 border-[#3B82F6] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-[#9CA3AF]">Refreshing notifications...</p>
        </Card>
      ) : filteredNotifications.length === 0 ? (
        <Card className="text-center py-16 space-y-4 border border-[#2F2F2F] bg-[#121212]">
          <div className="p-4 w-fit mx-auto rounded-full bg-[#3B82F6]/10 text-[#60A5FA] border border-[#3B82F6]/20">
            <Bell className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">
              {searchQuery
                ? 'No matching notifications'
                : activeTab === 'unread'
                ? 'No unread notifications'
                : 'All Caught Up!'}
            </h3>
            <p className="text-xs text-[#9CA3AF] max-w-sm mx-auto">
              {searchQuery
                ? `No results found for "${searchQuery}". Try clearing search filter.`
                : activeTab !== 'all'
                ? `There are no notifications in the ${activeTab} category right now.`
                : 'You have no system or automation alerts pending. All operations running smooth.'}
            </p>
          </div>
          {searchQuery ? (
            <Button variant="secondary" size="sm" onClick={() => setSearchQuery('')}>
              Clear Search
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              icon={<Sparkles className="w-4 h-4 text-amber-400" />}
              onClick={() => handleSimulateAlert('success', 'youtube', 'Sample Automation Alert', 'Sample automated YouTube upload notification completed.')}
            >
              Trigger Sample Alert
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((n) => (
            <Card
              key={n.id}
              className={`relative overflow-hidden transition-all duration-200 hover:border-[#3B82F6]/40 ${
                !n.read
                  ? 'border-[#3B82F6]/40 bg-[#161616]'
                  : 'border-[#262626] bg-[#121212]/90 opacity-90'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Category Icon */}
                <div className="p-2.5 rounded-xl bg-[#1A1A1A] border border-[#2F2F2F] shrink-0 mt-0.5">
                  {getIcon(n.type, n.category)}
                </div>

                {/* Content Details */}
                <div className="flex-1 space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white text-sm tracking-tight flex items-center gap-2">
                        {n.title}
                        {!n.read && (
                          <span className="w-2 h-2 rounded-full bg-[#3B82F6] ring-2 ring-[#3B82F6]/30 shrink-0" />
                        )}
                      </h4>
                      {getCategoryBadge(n.category)}
                      {n.priority === 'high' && (
                        <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.2 rounded-full uppercase">
                          High
                        </span>
                      )}
                    </div>

                    <span
                      className="text-xs text-[#9CA3AF] font-mono cursor-default"
                      title={n.timestamp}
                    >
                      {formatTimeAgo(n.timestamp)}
                    </span>
                  </div>

                  <p className="text-xs text-[#A1A1AA] leading-relaxed pr-2">
                    {n.message}
                  </p>

                  {/* Bottom Action Row */}
                  <div className="flex items-center justify-between pt-2">
                    <div>
                      {n.action_url && onNavigate && (
                        <button
                          onClick={() => {
                            const cleanRoute = n.action_url?.replace(/^\//, '').split('?')[0];
                            if (cleanRoute) onNavigate(cleanRoute);
                          }}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#60A5FA] hover:text-[#93C5FD] transition-colors cursor-pointer hover:underline"
                        >
                          <span>Open related feature</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleRead(n)}
                        className={`p-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer border ${
                          n.read
                            ? 'text-[#9CA3AF] hover:text-white border-[#2A2A2A] hover:bg-[#202020]'
                            : 'text-[#60A5FA] bg-[#3B82F6]/10 border-[#3B82F6]/20 hover:bg-[#3B82F6]/20'
                        }`}
                        title={n.read ? 'Mark as unread' : 'Mark as read'}
                      >
                        {n.read ? <EyeOff className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                        <span className="hidden sm:inline">
                          {n.read ? 'Unread' : 'Read'}
                        </span>
                      </button>

                      <button
                        onClick={() => handleDeleteItem(n.id)}
                        className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-colors cursor-pointer"
                        title="Delete notification"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

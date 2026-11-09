import React, { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  Award,
  Info,
  AlertTriangle,
  Youtube,
  Wand2,
  Trash2,
  ChevronRight,
} from 'lucide-react';
import { NotificationItem } from '../types';
import { notificationsApi } from '../api/notificationsApi';
import { formatTimeAgo } from '../utils';

interface NotificationDropdownProps {
  unreadCount?: number;
  onNavigate: (page: string) => void;
  className?: string;
  buttonClassName?: string;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  unreadCount: propUnreadCount,
  onNavigate,
  className = '',
  buttonClassName = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(propUnreadCount ?? 0);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelPos, setPanelPos] = useState<{ top: number; right: number }>({ top: 48, right: 12 });

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPanelPos({
      top: rect.bottom + 8,
      right: Math.max(12, window.innerWidth - rect.right),
    });
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) return;
    updatePosition();
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) return;
    const handleScrollOrResize = () => updatePosition();
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);
    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [isOpen, updatePosition]);

  // Sync prop unread count if provided
  useEffect(() => {
    if (propUnreadCount !== undefined) {
      setUnreadCount(propUnreadCount);
    }
  }, [propUnreadCount]);

  // Load preview notifications when dropdown is opened or on initial load
  const loadRecentNotifications = async () => {
    setLoading(true);
    try {
      const res = await notificationsApi.getNotificationsWithMeta({ limit: 6 });
      setNotifications(res.notifications);
      setUnreadCount(res.unreadCount);
    } catch (e) {
      console.error('Failed to load notifications preview:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadRecentNotifications();
    }
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node) &&
        panelRef.current &&
        !panelRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleMarkAllRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationsApi.markNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleItemClick = async (notif: NotificationItem) => {
    if (!notif.read) {
      try {
        await notificationsApi.markNotificationRead(notif.id, true);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch (err) {
        console.error(err);
      }
    }

    if (notif.action_url) {
      setIsOpen(false);
      const cleanRoute = notif.action_url.replace(/^\//, '').split('?')[0];
      onNavigate(cleanRoute || 'workspace');
    }
  };

  const handleDeleteItem = async (e: React.MouseEvent, id: string, wasRead: boolean) => {
    e.stopPropagation();
    try {
      await notificationsApi.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (!wasRead) {
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (type: string, category?: string) => {
    if (category === 'youtube') {
      return <Youtube className="w-4 h-4 text-red-400" />;
    }
    if (category === 'studio') {
      return <Wand2 className="w-4 h-4 text-[#60A5FA]" />;
    }
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'achievement':
        return <Award className="w-4 h-4 text-amber-400" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-rose-400" />;
      default:
        return <Info className="w-4 h-4 text-[#60A5FA]" />;
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
          isOpen ? 'bg-[#2563EB] text-white border border-[#60A5FA]/40 shadow-xs' : 'text-[#9CA3AF] border border-[#242424] hover:text-white hover:bg-[#26262C] hover:border-white/10'
        } ${buttonClassName}`}
        aria-label="Toggle notifications dropdown"
        title="Notifications"
      >
        <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-[#3B82F6] text-[10px] font-bold text-white ring-2 ring-[#121212]">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Floating Popover Panel Portaled to Document Body */}
      {isOpen &&
        createPortal(
          <div
            ref={panelRef}
            style={{
              position: 'fixed',
              top: `${panelPos.top}px`,
              right: `${panelPos.right}px`,
              maxHeight: `calc(100vh - ${panelPos.top + 16}px)`,
            }}
            className="w-80 sm:w-96 rounded-2xl bg-[#141414] border border-[#2F2F2F] shadow-2xl z-[99999] overflow-hidden backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 flex flex-col"
          >
            {/* Header */}
            <div className="p-3.5 px-4 border-b border-[#2F2F2F] flex items-center justify-between bg-[#181818]/95 shrink-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">Notifications</span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#2563EB] text-white border border-[#60A5FA]/40 shadow-xs">
                    {unreadCount} new
                  </span>
                )}
              </div>

              {notifications.some((n) => !n.read) && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[11px] font-medium text-[#9CA3AF] hover:text-[#60A5FA] flex items-center gap-1 transition-colors cursor-pointer"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
            </div>

            {/* List Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-[#222222]">
              {loading && notifications.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#9CA3AF] space-y-2">
                  <div className="w-5 h-5 mx-auto border-2 border-[#3B82F6] border-t-transparent rounded-full animate-spin" />
                  <p>Loading alerts...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <div className="w-10 h-10 mx-auto rounded-full bg-[#1E1E1E] border border-[#2F2F2F] flex items-center justify-center text-[#9CA3AF]">
                    <Bell className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-white">All caught up!</p>
                  <p className="text-[11px] text-[#9CA3AF]">No notifications at this moment.</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleItemClick(n)}
                    className={`group relative p-3.5 px-4 flex items-start gap-3 transition-colors cursor-pointer hover:bg-[#26262C] ${
                      !n.read ? 'bg-[#181818]/60' : 'opacity-85'
                    }`}
                  >
                    {/* Category / Type Icon */}
                    <div className="p-2 rounded-xl bg-[#1F1F1F] border border-[#2F2F2F] shrink-0 mt-0.5">
                      {getIcon(n.type, n.category)}
                    </div>

                    {/* Body Content */}
                    <div className="flex-1 min-w-0 pr-6">
                      <div className="flex items-center gap-1.5">
                        <h4
                          className={`text-xs truncate ${
                            !n.read ? 'font-bold text-white' : 'font-semibold text-[#D1D5DB]'
                          }`}
                        >
                          {n.title}
                        </h4>
                        {!n.read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-[#9CA3AF] line-clamp-2 mt-0.5 leading-relaxed">
                        {n.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] text-[#6B7280]">
                          {formatTimeAgo(n.timestamp)}
                        </span>
                        {n.category && (
                          <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.2 rounded bg-[#262626] text-[#9CA3AF] font-medium border border-[#333333]">
                            {n.category}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quick Delete Action on Hover */}
                    <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      <button
                        onClick={(e) => handleDeleteItem(e, n.id, n.read)}
                        className="p-1 rounded-md text-[#6B7280] hover:text-red-400 hover:bg-[#2A2A2A] transition-colors"
                        title="Delete notification"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-2.5 px-4 bg-[#181818]/95 border-t border-[#2F2F2F] flex items-center justify-between text-xs shrink-0">
              <button
                onClick={() => {
                  setIsOpen(false);
                  onNavigate('notifications');
                }}
                className="w-full py-1.5 text-center text-xs font-semibold text-[#60A5FA] hover:text-[#93C5FD] transition-colors flex items-center justify-center gap-1.5 cursor-pointer rounded-lg hover:bg-[#3B82F6]/10"
              >
                <span>View all notifications</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

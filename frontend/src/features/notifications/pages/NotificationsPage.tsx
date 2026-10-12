import React, { useEffect, useState } from 'react';
import { Bell, CheckCircle2, Info, Award, Trash2, Check } from 'lucide-react';
import { Button, Card, Badge } from '@/src/shared/ui/common';
import { notificationsApi } from '../api/notificationsApi';
import { NotificationItem } from '../types';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

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

  const handleMarkRead = async () => {
    await notificationsApi.markNotificationsRead();
    loadNotifications();
  };

  const handleClearAll = async () => {
    await notificationsApi.clearNotifications();
    setNotifications([]);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case 'achievement':
        return <Award className="w-5 h-5 text-amber-400" />;
      default:
        return <Info className="w-5 h-5 text-[#60A5FA]" />;
    }
  };

  return (
    <div className="flex-1 w-full min-h-screen bg-[#0A0A0A] text-[#E5E5E5] p-6 lg:p-8 space-y-8 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#2F2F2F]">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-[#3B82F6]/10 border border-[#3B82F6]/20 text-[#60A5FA]">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Notifications & Alerts</h1>
            <p className="text-xs text-[#9CA3AF] mt-0.5">Real-time status updates on automated YouTube uploads and Gemini voice renders</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" icon={<Check className="w-4 h-4" />} onClick={handleMarkRead}>
            Mark All Read
          </Button>
          <Button variant="danger" size="sm" icon={<Trash2 className="w-4 h-4" />} onClick={handleClearAll}>
            Clear All
          </Button>
        </div>
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <Card className="text-center py-12 space-y-3">
          <div className="p-3 w-fit mx-auto rounded-full bg-[#3B82F6]/10 text-[#60A5FA]">
            <Bell className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-white">All Caught Up!</h3>
          <p className="text-xs text-[#9CA3AF]">No unread notifications at this time.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <Card
              key={n.id}
              className={`${
                !n.read ? 'border-[#3B82F6]/40 bg-[#1E1E1E]' : ''
              } transition-all`}
            >
              <div className="flex items-start gap-4">
                <div className="p-2.5 rounded-xl bg-[#121212] border border-[#2F2F2F] shrink-0">
                  {getIcon(n.type)}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-white text-sm">{n.title}</h4>
                    <span className="text-xs text-[#9CA3AF] font-mono">{n.timestamp}</span>
                  </div>
                  <p className="text-xs text-[#9CA3AF] leading-relaxed">{n.message}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

import { NotificationItem, NotificationsListResult } from '../types';
import { consoleLogger } from '@/src/shared/utils/logger';
import { apiUrl } from '@/src/shared/utils/api';

export const notificationsApi = {
  // Get notifications with backward compatibility (returns array)
  async getNotifications(params?: { category?: string; unreadOnly?: boolean; limit?: number }): Promise<NotificationItem[]> {
    const query = new URLSearchParams();
    if (params?.category && params.category !== 'all') query.set('category', params.category);
    if (params?.unreadOnly) query.set('unread_only', 'true');
    if (params?.limit) query.set('limit', String(params.limit));

    const path = `/api/notifications${query.toString() ? `?${query.toString()}` : ''}`;
    const start = performance.now();
    const res = await fetch(apiUrl(path));
    const duration = performance.now() - start;
    consoleLogger.api('GET', path, res.status, duration);
    const data = await res.json();
    consoleLogger.info('Notifications', `Loaded ${data.notifications?.length || 0} alert(s)`);
    return data.notifications || [];
  },

  // Get notifications including unreadCount metadata
  async getNotificationsWithMeta(params?: { category?: string; unreadOnly?: boolean; limit?: number }): Promise<NotificationsListResult> {
    const query = new URLSearchParams();
    if (params?.category && params.category !== 'all') query.set('category', params.category);
    if (params?.unreadOnly) query.set('unread_only', 'true');
    if (params?.limit) query.set('limit', String(params.limit));

    const path = `/api/notifications${query.toString() ? `?${query.toString()}` : ''}`;
    const res = await fetch(apiUrl(path));
    const data = await res.json();
    return {
      notifications: data.notifications || [],
      unreadCount: data.unreadCount ?? (data.notifications || []).filter((n: NotificationItem) => !n.read).length,
      totalCount: data.totalCount ?? (data.notifications || []).length,
    };
  },

  // Get unread notification count
  async getUnreadCount(category?: string): Promise<number> {
    try {
      const query = new URLSearchParams({ action: 'unread_count' });
      if (category && category !== 'all') query.set('category', category);
      const res = await fetch(apiUrl(`/api/notifications/manage?${query.toString()}`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unread_count', category: category === 'all' ? undefined : category }),
      });
      if (!res.ok) return 0;
      const data = await res.json();
      return data.unreadCount ?? 0;
    } catch {
      return 0;
    }
  },

  async markNotificationRead(id: string, read: boolean = true): Promise<{ success: boolean; unreadCount?: number }> {
    const start = performance.now();
    const res = await fetch(apiUrl('/api/notifications/manage'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'toggle_read', notification_id: id, read }),
    });
    const duration = performance.now() - start;
    consoleLogger.api('POST', '/api/notifications/manage?action=toggle_read', res.status, duration);
    if (!res.ok) return { success: false };
    return res.json();
  },

  async deleteNotification(id: string): Promise<{ success: boolean; unreadCount?: number }> {
    const start = performance.now();
    const res = await fetch(apiUrl('/api/notifications/manage'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', notification_id: id }),
    });
    const duration = performance.now() - start;
    consoleLogger.api('POST', '/api/notifications/manage?action=delete', res.status, duration);
    consoleLogger.info('Notifications', `Deleted notification ${id}`);
    if (!res.ok) return { success: false };
    return res.json();
  },

  async createNotification(payload: {
    title: string;
    message: string;
    type?: string;
    category?: string;
    action_url?: string;
    priority?: string;
  }): Promise<NotificationItem> {
    const start = performance.now();
    const res = await fetch(apiUrl('/api/notifications'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const duration = performance.now() - start;
    consoleLogger.api('POST', '/api/notifications', res.status, duration);
    const data = await res.json();
    return data.notification;
  },

  async markNotificationsRead(category?: string): Promise<{ success: boolean; affected?: number; count?: number; unreadCount?: number }> {
    const start = performance.now();
    const res = await fetch(apiUrl('/api/notifications/manage'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'mark_all_read', category: category === 'all' ? undefined : category }),
    });
    const duration = performance.now() - start;
    consoleLogger.api('POST', '/api/notifications/manage?action=mark_all_read', res.status, duration);
    consoleLogger.success('Notifications', 'Notifications marked as read');
    if (!res.ok) return { success: false, affected: 0, count: 0, unreadCount: 0 };
    return res.json();
  },

  async clearNotifications(category?: string): Promise<void> {
    const path = category && category !== 'all' ? `/api/notifications?category=${encodeURIComponent(category)}` : '/api/notifications';
    const start = performance.now();
    const res = await fetch(apiUrl(path), { method: 'DELETE' });
    const duration = performance.now() - start;
    consoleLogger.api('DELETE', path, res.status, duration);
    consoleLogger.warn('Notifications', 'Notifications cleared');
  },
};



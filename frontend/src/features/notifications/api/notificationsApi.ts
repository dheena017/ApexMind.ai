import { NotificationItem, NotificationsListResult } from '../types';
import { consoleLogger } from '@/src/shared/utils/logger';

export const notificationsApi = {
  // Get notifications with backward compatibility (returns array)
  async getNotifications(params?: { category?: string; unreadOnly?: boolean; limit?: number }): Promise<NotificationItem[]> {
    const query = new URLSearchParams();
    if (params?.category && params.category !== 'all') query.set('category', params.category);
    if (params?.unreadOnly) query.set('unread_only', 'true');
    if (params?.limit) query.set('limit', String(params.limit));

    const url = `/api/notifications${query.toString() ? `?${query.toString()}` : ''}`;
    const start = performance.now();
    const res = await fetch(url);
    const duration = performance.now() - start;
    consoleLogger.api('GET', url, res.status, duration);
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

    const url = `/api/notifications${query.toString() ? `?${query.toString()}` : ''}`;
    const res = await fetch(url);
    const data = await res.json();
    return {
      notifications: data.notifications || [],
      unreadCount: data.unreadCount ?? (data.notifications || []).filter((n: NotificationItem) => !n.read).length,
      totalCount: data.totalCount ?? (data.notifications || []).length,
    };
  },

  async markNotificationRead(id: string, read: boolean = true): Promise<void> {
    const start = performance.now();
    const res = await fetch(`/api/notifications/${encodeURIComponent(id)}/read`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ read }),
    });
    const duration = performance.now() - start;
    consoleLogger.api('PATCH', `/api/notifications/${id}/read`, res.status, duration);
  },

  async deleteNotification(id: string): Promise<void> {
    const start = performance.now();
    const res = await fetch(`/api/notifications/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    const duration = performance.now() - start;
    consoleLogger.api('DELETE', `/api/notifications/${id}`, res.status, duration);
    consoleLogger.info('Notifications', `Deleted notification ${id}`);
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
    const res = await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const duration = performance.now() - start;
    consoleLogger.api('POST', '/api/notifications', res.status, duration);
    const data = await res.json();
    return data.notification;
  },

  async markNotificationsRead(category?: string): Promise<void> {
    const url = category && category !== 'all' ? `/api/notifications/mark-read?category=${encodeURIComponent(category)}` : '/api/notifications/mark-read';
    const start = performance.now();
    const res = await fetch(url, { method: 'POST' });
    const duration = performance.now() - start;
    consoleLogger.api('POST', url, res.status, duration);
    consoleLogger.success('Notifications', 'Notifications marked as read');
  },

  async clearNotifications(category?: string): Promise<void> {
    const url = category && category !== 'all' ? `/api/notifications?category=${encodeURIComponent(category)}` : '/api/notifications';
    const start = performance.now();
    const res = await fetch(url, { method: 'DELETE' });
    const duration = performance.now() - start;
    consoleLogger.api('DELETE', url, res.status, duration);
    consoleLogger.warn('Notifications', 'Notifications cleared');
  },
};



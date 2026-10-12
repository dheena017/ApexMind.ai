import { NotificationItem } from '../types';
import { consoleLogger } from '@/src/shared/utils/logger';

export const notificationsApi = {
  // Get notifications
  async getNotifications(): Promise<NotificationItem[]> {
    const start = performance.now();
    const res = await fetch('/api/notifications');
    const duration = performance.now() - start;
    consoleLogger.api('GET', '/api/notifications', res.status, duration);
    const data = await res.json();
    consoleLogger.info('Notifications', `Loaded ${data.notifications?.length || 0} alert(s)`);
    return data.notifications;
  },

  async markNotificationsRead(): Promise<void> {
    const start = performance.now();
    const res = await fetch('/api/notifications/mark-read', { method: 'POST' });
    const duration = performance.now() - start;
    consoleLogger.api('POST', '/api/notifications/mark-read', res.status, duration);
    consoleLogger.success('Notifications', 'All notifications marked as read');
  },

  async clearNotifications(): Promise<void> {
    const start = performance.now();
    const res = await fetch('/api/notifications', { method: 'DELETE' });
    const duration = performance.now() - start;
    consoleLogger.api('DELETE', '/api/notifications', res.status, duration);
    consoleLogger.warn('Notifications', 'All notifications cleared');
  },
};


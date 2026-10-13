export type NotificationType = 'success' | 'info' | 'achievement' | 'warning';
export type NotificationCategory = 'all' | 'unread' | 'youtube' | 'studio' | 'achievements' | 'system';
export type NotificationPriority = 'low' | 'normal' | 'high';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: NotificationType;
  category?: 'youtube' | 'studio' | 'achievements' | 'system' | string;
  action_url?: string;
  priority?: NotificationPriority;
}

export interface NotificationsListResult {
  notifications: NotificationItem[];
  unreadCount: number;
  totalCount: number;
}


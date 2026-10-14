import { WorkspaceNotification, WorkspaceNotificationCategory, WorkspaceNotificationType } from '../types';

const STORAGE_KEY = 'apexmind_workspace_notifications_v1';
const MAX_NOTIFICATIONS = 50;

const DEFAULT_WORKSPACE_NOTIFICATIONS: WorkspaceNotification[] = [
  {
    id: 'wn-init-1',
    title: 'AI Script Engine Active',
    message: 'Google Gemini 2.5 Flash neural model loaded and ready for high-retention script generation.',
    category: 'script',
    type: 'ai',
    timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    read: false,
    targetPane: 'editor',
    actionLabel: 'Open Script',
  },
  {
    id: 'wn-init-2',
    title: 'Studio Vocal Profiles Loaded',
    message: '24kHz HD neural vocal engines ready (Fenrir, Kore, Puck, Zephyr, Charon).',
    category: 'voice',
    type: 'success',
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    read: false,
    targetPane: 'audio',
    actionLabel: 'View Voices',
  },
  {
    id: 'wn-init-3',
    title: 'Auto-Save Snapshot Synchronized',
    message: 'Workspace draft, visual backdrops, and active timeline state saved to local storage.',
    category: 'autosave',
    type: 'info',
    timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    read: true,
    targetPane: 'canvas',
    actionLabel: 'Inspect Canvas',
  },
  {
    id: 'wn-init-4',
    title: 'Vertical 9:16 Media Catalog Connected',
    message: 'Curated 1080x1920 cinematic visual backdrops and royalty-free soundtracks available.',
    category: 'media',
    type: 'info',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    read: true,
    targetPane: 'media',
    actionLabel: 'Browse Media',
  },
];

export const getStoredWorkspaceNotifications = (): WorkspaceNotification[] => {
  if (typeof window === 'undefined') return DEFAULT_WORKSPACE_NOTIFICATIONS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_WORKSPACE_NOTIFICATIONS));
      return DEFAULT_WORKSPACE_NOTIFICATIONS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_WORKSPACE_NOTIFICATIONS;
  } catch {
    return DEFAULT_WORKSPACE_NOTIFICATIONS;
  }
};

const persistWorkspaceNotifications = (notifications: WorkspaceNotification[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications.slice(0, MAX_NOTIFICATIONS)));
    window.dispatchEvent(new CustomEvent('workspace:notification-change', {
      detail: {
        notifications,
        unreadCount: notifications.filter((n) => !n.read).length,
      },
    }));
  } catch (e) {
    console.error('Failed to persist workspace notifications', e);
  }
};

export const addWorkspaceNotification = (
  input: {
    title: string;
    message: string;
    category?: WorkspaceNotificationCategory;
    type?: WorkspaceNotificationType;
    targetPane?: string;
    actionLabel?: string;
    progress?: number;
  }
): WorkspaceNotification => {
  const current = getStoredWorkspaceNotifications();
  const newNotif: WorkspaceNotification = {
    id: `wn-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    title: input.title,
    message: input.message,
    category: input.category || 'general',
    type: input.type || 'info',
    timestamp: new Date().toISOString(),
    read: false,
    targetPane: input.targetPane,
    actionLabel: input.actionLabel,
    progress: input.progress,
  };

  const updated = [newNotif, ...current.filter((n) => n.id !== newNotif.id)].slice(0, MAX_NOTIFICATIONS);
  persistWorkspaceNotifications(updated);

  window.dispatchEvent(new CustomEvent('workspace:notification-added', {
    detail: newNotif,
  }));

  return newNotif;
};

export const markWorkspaceNotificationAsRead = (id: string): void => {
  const current = getStoredWorkspaceNotifications();
  const updated = current.map((n) => (n.id === id ? { ...n, read: true } : n));
  persistWorkspaceNotifications(updated);
};

export const markAllWorkspaceNotificationsAsRead = (): void => {
  const current = getStoredWorkspaceNotifications();
  const updated = current.map((n) => ({ ...n, read: true }));
  persistWorkspaceNotifications(updated);
};

export const deleteWorkspaceNotification = (id: string): void => {
  const current = getStoredWorkspaceNotifications();
  const updated = current.filter((n) => n.id !== id);
  persistWorkspaceNotifications(updated);
};

export const clearAllWorkspaceNotifications = (): void => {
  persistWorkspaceNotifications([]);
};

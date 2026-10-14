import { WorkspaceNotification, WorkspaceNotificationCategory, WorkspaceNotificationType } from '../types';

const STORAGE_KEY = 'apexmind_workspace_notifications_v2';
const MAX_NOTIFICATIONS = 60;

const DEFAULT_WORKSPACE_NOTIFICATIONS: WorkspaceNotification[] = [
  {
    id: 'wn-init-1',
    title: 'AI Script Engine Ready',
    message: 'Gemini 2.5 Flash neural model loaded with viral hook retention optimization (94.2% predicted score).',
    category: 'script',
    type: 'ai',
    timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    read: false,
    targetPane: 'editor',
    actionLabel: 'Open Script',
  },
  {
    id: 'wn-init-2',
    title: '24kHz HD Vocal Profiles Active',
    message: 'High-definition vocal engine synchronized with Fenrir (Stoic Leader, 0.95x speed) as default voice.',
    category: 'voice',
    type: 'success',
    timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    read: false,
    targetPane: 'audio',
    actionLabel: 'View Voices',
  },
  {
    id: 'wn-init-3',
    title: 'Vertical 9:16 Backdrop Selected',
    message: 'UHD 1080x1920 video backdrop "Dark Mountain Dawn" loaded with cinematic depth filter.',
    category: 'media',
    type: 'info',
    timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    read: false,
    targetPane: 'canvas',
    actionLabel: 'Canvas View',
  },
  {
    id: 'wn-init-4',
    title: 'Audio Ducking & SFX Synced',
    message: 'Soundtrack auto-ducked to -18dB during voiceover intervals. Swoosh transition cue added at 00:03.',
    category: 'voice',
    type: 'info',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    read: true,
    targetPane: 'audio',
    actionLabel: 'Audio Settings',
  },
  {
    id: 'wn-init-5',
    title: 'Kinetic Subtitles Preset Applied',
    message: 'Bold Impact subtitle cue cards generated with safe margin boundaries for YouTube Shorts and TikTok.',
    category: 'script',
    type: 'success',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    read: true,
    targetPane: 'text',
    actionLabel: 'Text Styling',
  },
  {
    id: 'wn-init-6',
    title: 'Auto-Save Snapshot Synchronized',
    message: 'Workspace project draft #14 saved to browser local store. Quote memory deduplication verified.',
    category: 'autosave',
    type: 'info',
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    read: true,
    targetPane: 'canvas',
    actionLabel: 'Inspect',
  },
  {
    id: 'wn-init-7',
    title: 'Visual Overlay Element Attached',
    message: 'Dynamic audio spectrum visualizer attached to the lower canvas layer.',
    category: 'media',
    type: 'info',
    timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    read: true,
    targetPane: 'elements',
    actionLabel: 'View Elements',
  },
  {
    id: 'wn-init-8',
    title: 'Timeline Duration Clamped: 00:30',
    message: 'Target short duration set to 30.0s with seamless loop repeat enabled.',
    category: 'timeline',
    type: 'info',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    read: true,
    targetPane: 'canvas',
    actionLabel: 'Timeline',
  },
  {
    id: 'wn-init-9',
    title: 'Hardware MP4 Encoder Ready',
    message: '60FPS hardware-accelerated rendering pipeline ready for instant short video export.',
    category: 'export',
    type: 'render',
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    read: true,
    targetPane: 'canvas',
    actionLabel: 'Export Video',
  },
  {
    id: 'wn-init-10',
    title: 'YouTube Creator Channel Linked',
    message: 'Connected channel @ApexMindStudio verified for direct publishing.',
    category: 'export',
    type: 'success',
    timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    read: true,
    targetPane: 'canvas',
    actionLabel: 'Channel Info',
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

export const clearReadWorkspaceNotifications = (): void => {
  const current = getStoredWorkspaceNotifications();
  const unreadOnly = current.filter((n) => !n.read);
  persistWorkspaceNotifications(unreadOnly);
};

export const clearAllWorkspaceNotifications = (): void => {
  persistWorkspaceNotifications([]);
};

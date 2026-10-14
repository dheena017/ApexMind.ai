import { useState, useEffect, useCallback } from 'react';
import { WorkspaceNotification } from '../types';
import {
  getStoredWorkspaceNotifications,
  addWorkspaceNotification,
  markWorkspaceNotificationAsRead,
  markAllWorkspaceNotificationsAsRead,
  deleteWorkspaceNotification,
  clearAllWorkspaceNotifications,
} from '../utils/workspaceNotificationManager';

export function useWorkspaceNotifications() {
  const [notifications, setNotifications] = useState<WorkspaceNotification[]>(() =>
    getStoredWorkspaceNotifications()
  );

  useEffect(() => {
    // Initial sync
    setNotifications(getStoredWorkspaceNotifications());

    const handleSync = () => {
      setNotifications(getStoredWorkspaceNotifications());
    };

    window.addEventListener('workspace:notification-change', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener('workspace:notification-change', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const notify = useCallback(
    (input: Parameters<typeof addWorkspaceNotification>[0]) => {
      return addWorkspaceNotification(input);
    },
    []
  );

  const markRead = useCallback((id: string) => {
    markWorkspaceNotificationAsRead(id);
  }, []);

  const markAllRead = useCallback(() => {
    markAllWorkspaceNotificationsAsRead();
  }, []);

  const removeNotification = useCallback((id: string) => {
    deleteWorkspaceNotification(id);
  }, []);

  const clearAll = useCallback(() => {
    clearAllWorkspaceNotifications();
  }, []);

  return {
    notifications,
    unreadCount,
    notify,
    markRead,
    markAllRead,
    removeNotification,
    clearAll,
  };
}

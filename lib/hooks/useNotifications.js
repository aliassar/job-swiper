'use client';

import { useEffect, useState, useCallback } from 'react';
import { notificationsApi } from '@/lib/api';
import { NOTIFICATION_POLL_INTERVAL } from '@/lib/constants';

/**
 * Custom hook for managing notifications
 * Polls for new notifications and provides methods to interact with them
 * @param {Object} options - Hook options
 * @param {number} options.pollingInterval - Interval for polling (default from constants)
 * @param {boolean} options.enabled - Whether to enable fetching (default: true)
 */
export function useNotifications({ pollingInterval = NOTIFICATION_POLL_INTERVAL, enabled = true } = {}) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!enabled) return;

    try {
      // Use new pagination-based API, get first page with default limit
      const data = await notificationsApi.getNotifications(1, 20);
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
      setError(null);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      // Use new single notification API
      await notificationsApi.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
      if (unreadIds.length > 0) {
        // Use new mark all as read API
        await notificationsApi.markAllAsRead();
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  }, [notifications]);

  // Clear all notifications
  const clearAll = useCallback(async () => {
    try {
      await notificationsApi.clearAll();
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error('Error clearing notifications:', err);
    }
  }, []);

  // Initial fetch - only when enabled
  useEffect(() => {
    if (enabled) {
      fetchNotifications();
    } else {
      setLoading(false);
    }
  }, [enabled, fetchNotifications]);

  // Set up polling - only when enabled
  useEffect(() => {
    if (enabled && pollingInterval > 0) {
      const interval = setInterval(fetchNotifications, pollingInterval);
      return () => clearInterval(interval);
    }
  }, [enabled, pollingInterval, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    clearAll,
  };
}

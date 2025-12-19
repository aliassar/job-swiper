'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { notificationsApi } from '@/lib/api';
import { NOTIFICATION_POLL_INTERVAL } from '@/lib/constants';

/**
 * Custom hook for managing notifications with SSE real-time updates
 * Uses Server-Sent Events for real-time notifications, falls back to polling if SSE fails
 * @param {Object} options - Hook options
 * @param {number} options.pollingInterval - Interval for polling fallback (default from constants)
 * @param {boolean} options.enabled - Whether to enable fetching (default: true)
 */
export function useNotifications({ pollingInterval = NOTIFICATION_POLL_INTERVAL, enabled = true } = {}) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  const eventSourceRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Fetch notifications via API (initial load and fallback)
  const fetchNotifications = useCallback(async () => {
    if (!enabled) return;

    try {
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

  // Connect to SSE stream
  const connectSSE = useCallback(() => {
    if (!enabled || typeof window === 'undefined') return;

    // Get auth token from storage for SSE connection
    const token = typeof localStorage !== 'undefined'
      ? localStorage.getItem('auth_token')
      : null;

    if (!token) {
      console.log('No auth token, falling back to polling');
      return false;
    }

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      // Note: EventSource doesn't support custom headers, so we pass token as query param
      // The server should accept this for SSE connections
      const sseUrl = `${baseUrl}/api/notifications/stream?token=${encodeURIComponent(token)}`;

      eventSourceRef.current = new EventSource(sseUrl);

      eventSourceRef.current.onopen = () => {
        console.log('SSE connected for notifications');
        setIsConnected(true);
        reconnectAttempts.current = 0;
      };

      eventSourceRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'connected') {
            // Initial connection message
            return;
          }

          // New notification received
          if (data.id) {
            setNotifications(prev => {
              // Check if notification already exists
              const exists = prev.some(n => n.id === data.id);
              if (exists) {
                return prev.map(n => n.id === data.id ? { ...n, ...data } : n);
              }
              // Add new notification at the beginning
              return [data, ...prev];
            });

            // Update unread count
            if (!data.isRead) {
              setUnreadCount(prev => prev + 1);
            }
          }
        } catch (err) {
          console.error('Error parsing SSE message:', err);
        }
      };

      eventSourceRef.current.onerror = (error) => {
        console.error('SSE error:', error);
        setIsConnected(false);
        eventSourceRef.current?.close();

        // Attempt reconnection with exponential backoff
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          reconnectAttempts.current++;
          console.log(`SSE reconnecting in ${delay}ms (attempt ${reconnectAttempts.current})`);

          reconnectTimeoutRef.current = setTimeout(() => {
            connectSSE();
          }, delay);
        } else {
          console.log('Max SSE reconnect attempts reached, falling back to polling');
        }
      };

      return true;
    } catch (err) {
      console.error('Failed to create SSE connection:', err);
      return false;
    }
  }, [enabled]);

  // Disconnect SSE
  const disconnectSSE = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsConnected(false);
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
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

  // Initial fetch and SSE connection
  useEffect(() => {
    if (enabled) {
      fetchNotifications();
      connectSSE();
    } else {
      setLoading(false);
      disconnectSSE();
    }

    return () => {
      disconnectSSE();
    };
  }, [enabled, fetchNotifications, connectSSE, disconnectSSE]);

  // Fallback polling when SSE is not connected
  useEffect(() => {
    if (enabled && !isConnected && pollingInterval > 0) {
      const interval = setInterval(fetchNotifications, pollingInterval);
      return () => clearInterval(interval);
    }
  }, [enabled, isConnected, pollingInterval, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    isConnected, // Expose SSE connection status
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    clearAll,
  };
}

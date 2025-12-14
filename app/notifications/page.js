'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, CheckCircleIcon, DocumentCheckIcon, EnvelopeIcon, ExclamationCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

export default function NotificationsPage() {
  const router = useRouter();
  
  // Mock notification data - in real app, this would come from context or API
  // Using component state instead of module-level constant for proper per-user simulation
  const [notifications, setNotifications] = useState([
    {
      id: '1',
      type: 'verification_pending',
      title: 'Verification Pending',
      message: 'Resume and cover letter for Software Engineer at Google is waiting for your verification',
      applicationId: 'app-123',
      jobTitle: 'Software Engineer at Google',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      read: false,
    },
    {
      id: '2',
      type: 'documents_ready',
      title: 'Documents Ready',
      message: 'Resume and cover letter for Frontend Developer at Meta has been finished',
      applicationId: 'app-124',
      jobTitle: 'Frontend Developer at Meta',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      read: false,
    },
    {
      id: '3',
      type: 'form_ready',
      title: 'Form Ready for Verification',
      message: 'The form text or email text is ready for your verification',
      applicationId: 'app-125',
      jobTitle: 'Backend Engineer at Amazon',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      read: true,
    },
    {
      id: '4',
      type: 'status_change',
      title: 'Application Status Changed',
      message: 'Your application for Senior Developer at Apple status changed to Interview',
      applicationId: 'app-126',
      jobTitle: 'Senior Developer at Apple',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      read: true,
    },
    {
      id: '5',
      type: 'follow_up',
      title: 'Follow-up Reminder',
      message: 'It\'s been 2 weeks since you applied to Full Stack Engineer at Netflix. Consider following up?',
      applicationId: 'app-127',
      jobTitle: 'Full Stack Engineer at Netflix',
      timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      read: true,
    },
  ]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'verification_pending':
        return <ExclamationCircleIcon className="h-5 w-5 text-orange-500" />;
      case 'documents_ready':
        return <DocumentCheckIcon className="h-5 w-5 text-green-500" />;
      case 'form_ready':
        return <EnvelopeIcon className="h-5 w-5 text-blue-500" />;
      case 'status_change':
        return <CheckCircleIcon className="h-5 w-5 text-purple-500" />;
      case 'follow_up':
        return <ClockIcon className="h-5 w-5 text-yellow-600" />;
      default:
        return <CheckCircleIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'verification_pending':
        return 'border-l-orange-500 bg-orange-50';
      case 'documents_ready':
        return 'border-l-green-500 bg-green-50';
      case 'form_ready':
        return 'border-l-blue-500 bg-blue-50';
      case 'status_change':
        return 'border-l-purple-500 bg-purple-50';
      case 'follow_up':
        return 'border-l-yellow-500 bg-yellow-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const handleNotificationClick = (notification) => {
    // Mark as read
    setNotifications(prev =>
      prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
    );
    
    // Navigate to application detail page
    if (notification.applicationId) {
      router.push(`/application/${notification.applicationId}`);
    }
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="h-full overflow-y-auto bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span>Back</span>
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">
        {/* Title and actions */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-xs text-gray-600 mt-1">
                  {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                </p>
              )}
            </div>
            {notifications.length > 0 && (
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={clearAll}
                  className="text-xs text-red-600 hover:text-red-700 font-medium"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Notifications list */}
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 text-center mt-20">
            <div className="text-6xl mb-4">🔔</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">No notifications</h2>
            <p className="text-gray-600 text-sm">
              You're all caught up! Notifications will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`relative border-l-4 rounded-lg p-3 cursor-pointer transition-all hover:shadow-md ${
                  getNotificationColor(notification.type)
                } ${notification.read ? 'opacity-60' : ''}`}
              >
                {/* Unread indicator */}
                {!notification.read && (
                  <div className="absolute top-3 right-3 w-2 h-2 bg-blue-600 rounded-full"></div>
                )}

                <div className="flex gap-3">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">
                      {notification.title}
                    </h3>
                    <p className="text-xs text-gray-700 mb-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {formatTimeAgo(notification.timestamp)}
                      </span>
                      {notification.jobTitle && (
                        <>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-600 font-medium">
                            {notification.jobTitle}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

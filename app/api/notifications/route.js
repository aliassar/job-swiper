import { NextResponse } from 'next/server';

/**
 * Local mock API for notifications - Development only
 * 
 * This is a mock implementation that mimics the backend server response format.
 * In production, requests are proxied to the real backend server (job-swipper-server).
 * 
 * Server response format: 
 * { success: true, data: { items: [...], pagination: { page, limit, total, totalPages } } }
 */

// Mock notifications data - in production, this would come from a database
let notifications = [
  {
    id: '1',
    type: 'verification_needed',
    title: 'Verification Needed',
    message: 'Resume and cover letter for Software Engineer at Google is waiting for your verification',
    applicationId: 'app-123',
    jobTitle: 'Software Engineer at Google',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    read: false,
  },
  {
    id: '2',
    type: 'cv_ready',
    title: 'CV Ready',
    message: 'Resume and cover letter for Frontend Developer at Meta has been finished',
    applicationId: 'app-124',
    jobTitle: 'Frontend Developer at Meta',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    read: false,
  },
  {
    id: '3',
    type: 'message_ready',
    title: 'Message Ready for Verification',
    message: 'The application message is ready for your verification',
    applicationId: 'app-125',
    jobTitle: 'Backend Engineer at Amazon',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    read: true,
  },
  {
    id: '4',
    type: 'status_changed',
    title: 'Application Status Changed',
    message: 'Your application for Senior Developer at Apple status changed to Interview',
    applicationId: 'app-126',
    jobTitle: 'Senior Developer at Apple',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    read: true,
  },
  {
    id: '5',
    type: 'follow_up_reminder',
    title: 'Follow-up Reminder',
    message: 'It\'s been 2 weeks since you applied to Full Stack Engineer at Netflix. Consider following up?',
    applicationId: 'app-127',
    jobTitle: 'Full Stack Engineer at Netflix',
    timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    read: true,
  },
  {
    id: '6',
    type: 'generation_failed',
    title: 'Generation Failed',
    message: 'Failed to generate documents for DevOps Engineer at Microsoft. Please try again.',
    applicationId: 'app-128',
    jobTitle: 'DevOps Engineer at Microsoft',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    read: false,
  },
  {
    id: '7',
    type: 'apply_failed',
    title: 'Application Failed',
    message: 'Failed to submit application for Data Scientist at Tesla. Please check and retry.',
    applicationId: 'app-129',
    jobTitle: 'Data Scientist at Tesla',
    timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    read: false,
  },
];

// GET - Get all notifications
export async function GET(request) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    
    // Calculate pagination
    const total = notifications.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const items = notifications.slice(startIndex, endIndex);
    
    // Return server response format
    return NextResponse.json({ 
      success: true,
      data: {
        items,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// POST - Mark notifications as read/unread
export async function POST(request) {
  try {
    const { notificationIds, read } = await request.json();
    
    notifications = notifications.map(notification => {
      if (notificationIds.includes(notification.id)) {
        return { ...notification, read };
      }
      return notification;
    });
    
    return NextResponse.json({ 
      success: true,
      unreadCount: notifications.filter(n => !n.read).length 
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
  }
}

// DELETE - Clear all notifications
export async function DELETE() {
  notifications = [];
  return NextResponse.json({ success: true });
}

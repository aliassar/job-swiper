import { NextResponse } from 'next/server';

// Mock notifications data - in production, this would come from a database
let notifications = [
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
];

// GET - Get all notifications
export async function GET() {
  return NextResponse.json({ 
    notifications,
    unreadCount: notifications.filter(n => !n.read).length 
  });
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

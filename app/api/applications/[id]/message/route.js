import { NextResponse } from 'next/server';
import { jobsStorage } from '../../../jobs/route';

// POST - Handle message verification and sending
export async function POST(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { action, timestamp, message } = body; // action: 'approve', 'rollback', 'send'
    
    if (!action || !['approve', 'rollback', 'send'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve", "rollback", or "send"' },
        { status: 400 }
      );
    }
    
    const application = jobsStorage.applications.get(id);
    
    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }
    
    // Handle different actions
    if (action === 'approve') {
      // User approved the message, start 5-minute countdown
      application.messageSendTime = timestamp || Date.now();
      application.messageStatus = 'scheduled';
      if (message) {
        application.customMessage = message;
      }
    } else if (action === 'rollback') {
      // User cancelled the scheduled send
      application.messageSendTime = null;
      application.messageStatus = 'pending';
    } else if (action === 'send') {
      // Actually send the message (called after 5-minute window)
      // In production, this would send an email or submit via form
      application.messageStatus = 'sent';
      application.messageSentAt = Date.now();
      application.stage = 'Applied'; // Move to Applied stage
      application.messageSendTime = null; // Clear the timer
    }
    
    jobsStorage.applications.set(id, application);
    
    return NextResponse.json({
      success: true,
      application: {
        ...application,
        messageSendTime: application.messageSendTime,
        messageStatus: application.messageStatus,
        messageSentAt: application.messageSentAt,
        stage: application.stage,
      }
    });
  } catch (error) {
    console.error('Error handling message:', error);
    return NextResponse.json(
      { error: 'Failed to process message action' },
      { status: 500 }
    );
  }
}

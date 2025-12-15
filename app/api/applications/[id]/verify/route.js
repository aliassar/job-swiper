import { NextResponse } from 'next/server';
import { jobsStorage } from '../../../jobs/route';

// POST - Verify or reject CV/documents for an application
export async function POST(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { action, timestamp } = body; // action: 'accept', 'reject', 'rollback'
    
    if (!action || !['accept', 'reject', 'rollback'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "accept", "reject", or "rollback"' },
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
    if (action === 'accept') {
      application.cvVerificationStatus = 'accepted';
      application.cvVerificationTime = timestamp || Date.now();
      application.stage = 'Message Verification'; // Progress to next stage
    } else if (action === 'reject') {
      application.cvVerificationStatus = 'rejected';
      application.cvVerificationTime = null;
      // Stay in CV Verification stage for user to upload custom documents
    } else if (action === 'rollback') {
      application.cvVerificationStatus = 'pending';
      application.cvVerificationTime = null;
      application.stage = 'CV Verification'; // Go back to verification
    }
    
    jobsStorage.applications.set(id, application);
    
    return NextResponse.json({
      success: true,
      application: {
        ...application,
        cvVerificationStatus: application.cvVerificationStatus,
        cvVerificationTime: application.cvVerificationTime,
        stage: application.stage,
      }
    });
  } catch (error) {
    console.error('Error verifying application:', error);
    return NextResponse.json(
      { error: 'Failed to verify application' },
      { status: 500 }
    );
  }
}

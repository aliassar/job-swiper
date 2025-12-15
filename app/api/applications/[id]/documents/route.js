import { NextResponse } from 'next/server';
import { jobsStorage } from '../../../jobs/route';

// PUT - Update application with custom document references
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { resumeUrl, coverLetterUrl } = body;
    
    const application = jobsStorage.applications.get(id);
    
    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }
    
    // Update document references
    if (resumeUrl !== undefined) {
      application.customResumeUrl = resumeUrl;
      application.hasCustomResume = true;
    }
    
    if (coverLetterUrl !== undefined) {
      application.customCoverLetterUrl = coverLetterUrl;
      application.hasCustomCoverLetter = true;
    }
    
    // Update timestamp
    application.updatedAt = new Date().toISOString();
    
    jobsStorage.applications.set(id, application);
    
    return NextResponse.json({
      success: true,
      application: {
        ...application,
        customResumeUrl: application.customResumeUrl,
        customCoverLetterUrl: application.customCoverLetterUrl,
        hasCustomResume: application.hasCustomResume,
        hasCustomCoverLetter: application.hasCustomCoverLetter,
      }
    });
  } catch (error) {
    console.error('Error updating documents:', error);
    return NextResponse.json(
      { error: 'Failed to update documents' },
      { status: 500 }
    );
  }
}

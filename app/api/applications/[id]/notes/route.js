import { NextResponse } from 'next/server';
import { jobsStorage } from '../../../jobs/route';

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { notes } = body;
    
    // Find the application
    const application = jobsStorage.applications.get(id);
    
    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }
    
    // Update notes
    const updatedApplication = {
      ...application,
      notes,
      updatedAt: new Date().toISOString(),
    };
    
    jobsStorage.applications.set(id, updatedApplication);
    
    return NextResponse.json({ 
      success: true,
      application: updatedApplication 
    });
  } catch (error) {
    console.error('Error updating application notes:', error);
    return NextResponse.json(
      { error: 'Failed to update notes' },
      { status: 500 }
    );
  }
}

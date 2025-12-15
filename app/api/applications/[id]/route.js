import { NextResponse } from 'next/server';
import { jobsStorage } from '../../jobs/route';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    // Find the application by ID
    const application = jobsStorage.applications.get(id);
    
    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }
    
    // Get the associated job details
    const job = jobsStorage.jobs.find(j => j.id === application.jobId);
    
    if (!job) {
      return NextResponse.json(
        { error: 'Associated job not found' },
        { status: 404 }
      );
    }
    
    // Combine application and job data
    const fullApplication = {
      ...application,
      company: job.company,
      position: job.position,
      location: job.location,
      skills: job.skills,
      description: job.description,
      salary: job.salary,
    };
    
    return NextResponse.json({ application: fullApplication });
  } catch (error) {
    console.error('Error fetching application:', error);
    return NextResponse.json(
      { error: 'Failed to fetch application' },
      { status: 500 }
    );
  }
}

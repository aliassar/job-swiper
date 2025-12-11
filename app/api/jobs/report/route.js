import { NextResponse } from 'next/server';
import { jobsStorage } from '../route';
import { generateId } from '@/lib/utils';

// Add reported jobs storage to jobsStorage
if (!jobsStorage.reportedJobs) {
  jobsStorage.reportedJobs = new Map(); // reportId -> { id, jobId, description, reason, reportedAt, job }
}

export async function POST(request) {
  try {
    const { jobId, description, reason = 'other' } = await request.json();
    
    if (!jobId || !description) {
      return NextResponse.json(
        { error: 'jobId and description are required' }, 
        { status: 400 }
      );
    }

    const job = jobsStorage.jobs.find(j => j.id === parseInt(jobId));
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const now = new Date().toISOString();
    const reportId = generateId('report');
    
    const reportedJob = {
      id: reportId,
      jobId: parseInt(jobId),
      description,
      reason,
      reportedAt: now,
      job: { ...job }, // Store a snapshot of the job
    };

    jobsStorage.reportedJobs.set(reportId, reportedJob);

    // Log action
    jobsStorage.history.push({
      id: generateId('history'),
      jobId: parseInt(jobId),
      action: 'reported',
      timestamp: now,
      metadata: { 
        company: job.company, 
        position: job.position,
        reason,
      },
    });

    return NextResponse.json({ 
      success: true, 
      reportedJob: {
        id: reportId,
        jobId: parseInt(jobId),
        description,
        reason,
        reportedAt: now,
      }
    });
  } catch (error) {
    console.error('Error reporting job:', error);
    return NextResponse.json(
      { error: 'Failed to report job' }, 
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Return all reported jobs
    const reported = Array.from(jobsStorage.reportedJobs.values())
      .sort((a, b) => new Date(b.reportedAt) - new Date(a.reportedAt));
    
    return NextResponse.json({ 
      reportedJobs: reported,
      total: reported.length 
    });
  } catch (error) {
    console.error('Error fetching reported jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reported jobs' }, 
      { status: 500 }
    );
  }
}

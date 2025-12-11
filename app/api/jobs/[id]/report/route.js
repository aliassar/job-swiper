import { NextResponse } from 'next/server';
import { jobsStorage } from '../../route';
import { generateId } from '@/lib/utils';

export async function POST(request, { params }) {
  const jobId = parseInt(params.id);
  
  const job = jobsStorage.jobs.find(j => j.id === jobId);
  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  const now = new Date().toISOString();
  
  // Initialize reportedJobs array if it doesn't exist
  if (!jobsStorage.reportedJobs) {
    jobsStorage.reportedJobs = [];
  }

  // Add to reported jobs (avoid duplicates)
  const alreadyReported = jobsStorage.reportedJobs.some(
    report => report.jobId === jobId
  );

  if (!alreadyReported) {
    jobsStorage.reportedJobs.push({
      id: generateId('report'),
      jobId,
      reportedAt: now,
      job: job,
    });
  }

  // Log action
  jobsStorage.history.push({
    id: generateId('history'),
    jobId,
    action: 'reported',
    timestamp: now,
    metadata: { company: job.company, position: job.position },
  });

  return NextResponse.json({ 
    success: true,
    message: 'Job reported successfully',
  });
}

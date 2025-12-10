import { NextResponse } from 'next/server';
import { jobsStorage } from '../../route';

export async function POST(request, { params }) {
  const jobId = parseInt(params.id);
  
  const job = jobsStorage.jobs.find(j => j.id === jobId);
  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  const now = new Date().toISOString();
  
  // Update job status
  jobsStorage.userJobStatus.set(jobId, {
    status: 'rejected',
    favorite: jobsStorage.userJobStatus.get(jobId)?.favorite || false,
    rejectedAt: now,
    decisionAt: now,
  });

  // Log action
  jobsStorage.history.push({
    id: `history-${Date.now()}`,
    jobId,
    action: 'rejected',
    timestamp: now,
    metadata: { company: job.company, position: job.position },
  });

  return NextResponse.json({ 
    success: true, 
    jobId,
    status: 'rejected',
    decisionAt: now
  });
}

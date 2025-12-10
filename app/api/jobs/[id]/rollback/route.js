import { NextResponse } from 'next/server';
import { jobsStorage } from '../../route';

export async function POST(request, { params }) {
  const jobId = parseInt(params.id);
  
  const job = jobsStorage.jobs.find(j => j.id === jobId);
  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  const existingStatus = jobsStorage.userJobStatus.get(jobId);
  
  // Reset to pending status, but keep favorite status
  jobsStorage.userJobStatus.set(jobId, {
    status: 'pending',
    favorite: existingStatus?.favorite || false,
  });

  // Remove from applications if it was accepted
  if (existingStatus?.status === 'accepted') {
    for (const [appId, app] of jobsStorage.applications.entries()) {
      if (app.jobId === jobId) {
        jobsStorage.applications.delete(appId);
        break;
      }
    }
  }

  // Log rollback action
  jobsStorage.history.push({
    id: `history-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    jobId,
    action: 'rollback',
    timestamp: new Date().toISOString(),
    metadata: { 
      company: job.company, 
      position: job.position,
      previousStatus: existingStatus?.status 
    },
  });

  return NextResponse.json({ 
    success: true, 
    job: { ...job, status: 'pending' }
  });
}

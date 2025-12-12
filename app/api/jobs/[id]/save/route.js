import { NextResponse } from 'next/server';
import { jobsStorage } from '../../route';
import { generateId } from '@/lib/utils';

export async function POST(request, { params }) {
  const jobId = parseInt(params.id);
  const body = await request.json();
  const { saved } = body;
  
  const job = jobsStorage.jobs.find(j => j.id === jobId);
  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  // Get existing status or create new one
  const existingStatus = jobsStorage.userJobStatus.get(jobId) || {
    status: 'pending',
    saved: false,
  };

  // Update saved status
  jobsStorage.userJobStatus.set(jobId, {
    ...existingStatus,
    saved,
    savedAt: saved ? new Date().toISOString() : existingStatus.savedAt,
  });

  // Log action
  jobsStorage.history.push({
    id: generateId('history'),
    jobId,
    action: saved ? 'saved' : 'unsaved',
    timestamp: new Date().toISOString(),
    metadata: { company: job.company, position: job.position },
  });

  return NextResponse.json({ 
    success: true, 
    jobId,
    saved
  });
}

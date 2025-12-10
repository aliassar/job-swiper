import { NextResponse } from 'next/server';
import { jobsStorage } from '../../route';

export async function POST(request, { params }) {
  const jobId = parseInt(params.id);
  const body = await request.json();
  const { favorite } = body;
  
  const job = jobsStorage.jobs.find(j => j.id === jobId);
  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  // Get existing status or create new one
  const existingStatus = jobsStorage.userJobStatus.get(jobId) || {
    status: 'pending',
    favorite: false,
  };

  // Update favorite status
  jobsStorage.userJobStatus.set(jobId, {
    ...existingStatus,
    favorite,
  });

  // Log action
  jobsStorage.history.push({
    id: `history-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    jobId,
    action: favorite ? 'favorited' : 'unfavorited',
    timestamp: new Date().toISOString(),
    metadata: { company: job.company, position: job.position },
  });

  return NextResponse.json({ 
    success: true, 
    jobId,
    favorite
  });
}

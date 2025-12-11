import { NextResponse } from 'next/server';
import { jobsStorage } from '../route';

export async function GET() {
  // Get all skipped jobs
  const skippedJobs = jobsStorage.jobs
    .filter(job => {
      const status = jobsStorage.userJobStatus.get(job.id);
      return status && status.status === 'skipped';
    })
    .map(job => {
      const status = jobsStorage.userJobStatus.get(job.id);
      return {
        ...job,
        skippedAt: status.skippedAt,
      };
    })
    .sort((a, b) => new Date(b.skippedAt) - new Date(a.skippedAt));
  
  return NextResponse.json({ 
    jobs: skippedJobs,
    total: skippedJobs.length 
  });
}

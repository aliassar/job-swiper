import { NextResponse } from 'next/server';
import { jobsStorage } from '../jobs/route';

export async function GET() {
  // Initialize reportedJobs array if it doesn't exist
  if (!jobsStorage.reportedJobs) {
    jobsStorage.reportedJobs = [];
  }

  // Return reported jobs sorted by most recent first
  const sortedReportedJobs = [...jobsStorage.reportedJobs].sort(
    (a, b) => new Date(b.reportedAt) - new Date(a.reportedAt)
  );
  
  return NextResponse.json({ 
    reportedJobs: sortedReportedJobs,
    total: sortedReportedJobs.length 
  });
}

import { NextResponse } from 'next/server';
import { jobsStorage } from '../jobs/route';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const searchQuery = searchParams.get('search')?.toLowerCase() || '';
  
  // Initialize reportedJobs array if it doesn't exist
  if (!jobsStorage.reportedJobs) {
    jobsStorage.reportedJobs = [];
  }

  // Get reported jobs
  let reportedJobs = [...jobsStorage.reportedJobs];
  
  // Apply search filter if query provided
  if (searchQuery) {
    reportedJobs = reportedJobs.filter(report => {
      const job = report.job;
      const searchableText = [
        job.company,
        job.position,
        job.location,
        ...(job.skills || [])
      ].join(' ').toLowerCase();
      
      return searchableText.includes(searchQuery);
    });
  }
  
  // Sort by most recent first
  const sortedReportedJobs = reportedJobs.sort(
    (a, b) => new Date(b.reportedAt) - new Date(a.reportedAt)
  );
  
  return NextResponse.json({ 
    reportedJobs: sortedReportedJobs,
    total: sortedReportedJobs.length 
  });
}

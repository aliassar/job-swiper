import { NextResponse } from 'next/server';
import { jobsStorage } from '../jobs/route';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const searchQuery = searchParams.get('search')?.toLowerCase() || '';
  
  // Feature 24: Pagination support
  const page = parseInt(searchParams.get('page') || '0');
  const limit = parseInt(searchParams.get('limit') || '20');
  
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
  
  const total = sortedReportedJobs.length;
  const start = page * limit;
  const end = start + limit;
  const paginatedReportedJobs = sortedReportedJobs.slice(start, end);
  const hasMore = end < total;
  
  return NextResponse.json({ 
    reportedJobs: paginatedReportedJobs,
    total,
    hasMore,
    page,
    limit
  });
}

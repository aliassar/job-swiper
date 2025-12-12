import { NextResponse } from 'next/server';
import { jobsStorage } from '../route';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const searchQuery = searchParams.get('search')?.toLowerCase() || '';
  
  // Feature 24: Pagination support
  const page = parseInt(searchParams.get('page') || '0');
  const limit = parseInt(searchParams.get('limit') || '20');
  
  // Get all skipped jobs
  let skippedJobs = jobsStorage.jobs
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
    });
  
  // Apply search filter if query provided
  if (searchQuery) {
    skippedJobs = skippedJobs.filter(job => {
      const searchableText = [
        job.company,
        job.position,
        job.location,
        ...(job.skills || [])
      ].join(' ').toLowerCase();
      
      return searchableText.includes(searchQuery);
    });
  }
  
  // Sort by date (newest first)
  skippedJobs = skippedJobs.sort((a, b) => new Date(b.skippedAt) - new Date(a.skippedAt));
  
  const total = skippedJobs.length;
  const start = page * limit;
  const end = start + limit;
  const paginatedJobs = skippedJobs.slice(start, end);
  const hasMore = end < total;
  
  return NextResponse.json({ 
    jobs: paginatedJobs,
    total,
    hasMore,
    page,
    limit
  });
}

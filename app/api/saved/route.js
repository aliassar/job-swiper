import { NextResponse } from 'next/server';
import { jobsStorage } from '../jobs/route';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const searchQuery = searchParams.get('search')?.toLowerCase() || '';
  
  // Feature 24: Pagination support
  const page = parseInt(searchParams.get('page') || '0');
  const limit = parseInt(searchParams.get('limit') || '20');
  
  // Get all savedd jobs
  let saveds = jobsStorage.jobs
    .filter(job => {
      const status = jobsStorage.userJobStatus.get(job.id);
      return status && status.saved === true;
    })
    .map(job => {
      const status = jobsStorage.userJobStatus.get(job.id);
      return {
        ...job,
        saved: true,
        saveddAt: status.saveddAt || new Date().toISOString(),
      };
    });
  
  // Apply search filter if query provided
  if (searchQuery) {
    saveds = saveds.filter(job => {
      const searchableText = [
        job.company,
        job.position,
        job.location,
        ...(job.skills || [])
      ].join(' ').toLowerCase();
      
      return searchableText.includes(searchQuery);
    });
  }
  
  const total = saveds.length;
  const start = page * limit;
  const end = start + limit;
  const paginatedSaveds = saveds.slice(start, end);
  const hasMore = end < total;
  
  return NextResponse.json({ 
    saveds: paginatedSaveds,
    total,
    hasMore,
    page,
    limit
  });
}

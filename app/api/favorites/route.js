import { NextResponse } from 'next/server';
import { jobsStorage } from '../jobs/route';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const searchQuery = searchParams.get('search')?.toLowerCase() || '';
  
  // Get all favorited jobs
  let favorites = jobsStorage.jobs
    .filter(job => {
      const status = jobsStorage.userJobStatus.get(job.id);
      return status && status.favorite === true;
    })
    .map(job => {
      const status = jobsStorage.userJobStatus.get(job.id);
      return {
        ...job,
        favorite: true,
        favoritedAt: status.favoritedAt || new Date().toISOString(),
      };
    });
  
  // Apply search filter if query provided
  if (searchQuery) {
    favorites = favorites.filter(job => {
      const searchableText = [
        job.company,
        job.position,
        job.location,
        ...(job.skills || [])
      ].join(' ').toLowerCase();
      
      return searchableText.includes(searchQuery);
    });
  }
  
  return NextResponse.json({ 
    favorites,
    total: favorites.length 
  });
}

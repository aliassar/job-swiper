import { NextResponse } from 'next/server';
import { jobsStorage } from '../jobs/route';

export async function GET() {
  // Get all favorited jobs
  const favorites = jobsStorage.jobs
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
  
  return NextResponse.json({ 
    favorites,
    total: favorites.length 
  });
}

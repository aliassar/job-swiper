import { NextResponse } from 'next/server';
import { mockJobs } from '@/lib/mockJobs';

// In-memory storage for demo purposes
let jobsData = [...mockJobs];
let acceptedJobs = [];
let rejectedJobs = [];
let favoritedJobs = [];

export async function GET() {
  // Sort jobs by date (newest first)
  const sortedJobs = [...jobsData].sort((a, b) => 
    new Date(b.postedDate) - new Date(a.postedDate)
  );
  
  return NextResponse.json({ jobs: sortedJobs });
}

export async function POST(request) {
  const body = await request.json();
  const { action, jobId, favorite } = body;

  if (action === 'accept') {
    acceptedJobs.push(jobId);
    return NextResponse.json({ success: true, message: 'Job accepted' });
  }

  if (action === 'reject') {
    rejectedJobs.push(jobId);
    return NextResponse.json({ success: true, message: 'Job rejected' });
  }

  if (action === 'favorite') {
    if (favorite) {
      if (!favoritedJobs.includes(jobId)) {
        favoritedJobs.push(jobId);
      }
    } else {
      favoritedJobs = favoritedJobs.filter(id => id !== jobId);
    }
    return NextResponse.json({ success: true, message: 'Favorite toggled' });
  }

  if (action === 'rollback') {
    acceptedJobs = acceptedJobs.filter(id => id !== jobId);
    rejectedJobs = rejectedJobs.filter(id => id !== jobId);
    return NextResponse.json({ success: true, message: 'Decision rolled back' });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

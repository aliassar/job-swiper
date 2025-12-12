import { NextResponse } from 'next/server';

// In-memory storage for server data
// Jobs can be added through the API or imported from external sources
export const jobsStorage = {
  jobs: [], // Initialize with empty array - jobs can be added via API
  userJobStatus: new Map(), // jobId -> { status, favorite, acceptedAt, rejectedAt, skippedAt }
  applications: new Map(), // applicationId -> { id, jobId, stage, appliedAt, updatedAt }
  history: [], // Array of action history
};

// Helper to get job with status
function getJobWithStatus(jobId) {
  const job = jobsStorage.jobs.find(j => j.id === jobId);
  const status = jobsStorage.userJobStatus.get(jobId) || { 
    status: 'pending', 
    favorite: false 
  };
  return { job, status };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const searchQuery = searchParams.get('search')?.toLowerCase() || '';
  
  // Return only pending jobs (not accepted, rejected, or skipped)
  let pendingJobs = jobsStorage.jobs.filter(job => {
    const status = jobsStorage.userJobStatus.get(job.id);
    return !status || status.status === 'pending';
  });
  
  // Apply search filter if query provided
  if (searchQuery) {
    pendingJobs = pendingJobs.filter(job => {
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
  const sortedJobs = pendingJobs.sort((a, b) => 
    new Date(b.postedDate) - new Date(a.postedDate)
  );
  
  return NextResponse.json({ 
    jobs: sortedJobs,
    total: sortedJobs.length 
  });
}

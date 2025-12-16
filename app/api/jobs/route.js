import { NextResponse } from 'next/server';

// Sample seed data for testing
const seedJobs = [
  {
    id: 1,
    company: 'Google',
    position: 'Senior Software Engineer',
    location: 'Mountain View, CA',
    skills: ['JavaScript', 'React', 'Node.js', 'TypeScript'],
    description: 'Join our team to build amazing products that impact billions of users.',
    postedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 2,
    company: 'Microsoft',
    position: 'Full Stack Developer',
    location: 'Seattle, WA',
    skills: ['C#', '.NET', 'Azure', 'React'],
    description: 'Work on cutting-edge cloud technologies and enterprise solutions.',
    postedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 3,
    company: 'Apple',
    position: 'iOS Developer',
    location: 'Cupertino, CA',
    skills: ['Swift', 'iOS', 'UIKit', 'SwiftUI'],
    description: 'Help create the next generation of iOS applications.',
    postedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// In-memory storage for server data
// Jobs can be added through the API or imported from external sources
export const jobsStorage = {
  jobs: [...seedJobs], // Initialize with seed data for testing
  userJobStatus: new Map(), // jobId -> { status, saved, acceptedAt, rejectedAt, skippedAt }
  applications: new Map(), // applicationId -> { id, jobId, stage, appliedAt, updatedAt }
  history: [], // Array of action history
};

// Add a sample application for testing
const sampleAppDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
jobsStorage.applications.set('app-test-1', {
  id: 'app-test-1',
  jobId: 2,
  stage: 'Phone Screen',
  appliedAt: sampleAppDate,
  updatedAt: new Date().toISOString(),
});
jobsStorage.userJobStatus.set(2, {
  status: 'accepted',
  saved: false,
  acceptedAt: sampleAppDate,
  decisionAt: sampleAppDate,
});

// Add sample history
jobsStorage.history.push({
  id: 'history-test-1',
  jobId: 2,
  company: 'Microsoft',
  position: 'Full Stack Developer',
  location: 'Seattle, WA',
  action: 'accepted',
  timestamp: sampleAppDate,
});

// Helper to get job with status
function getJobWithStatus(jobId) {
  const job = jobsStorage.jobs.find(j => j.id === jobId);
  const status = jobsStorage.userJobStatus.get(jobId) || { 
    status: 'pending', 
    saved: false 
  };
  return { job, status };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const searchQuery = searchParams.get('search')?.toLowerCase() || '';
  const location = searchParams.get('location')?.toLowerCase() || '';
  const salaryMin = searchParams.get('salaryMin') ? parseInt(searchParams.get('salaryMin')) : null;
  const salaryMax = searchParams.get('salaryMax') ? parseInt(searchParams.get('salaryMax')) : null;
  const countOnly = searchParams.get('countOnly') === 'true';
  
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
  
  // Apply location filter
  if (location) {
    pendingJobs = pendingJobs.filter(job => {
      return job.location?.toLowerCase().includes(location);
    });
  }
  
  // Apply salary filters (if salary field exists)
  if (salaryMin !== null) {
    pendingJobs = pendingJobs.filter(job => {
      return job.salary ? job.salary >= salaryMin : true;
    });
  }
  
  if (salaryMax !== null) {
    pendingJobs = pendingJobs.filter(job => {
      return job.salary ? job.salary <= salaryMax : true;
    });
  }
  
  // If countOnly is requested, return just the count
  if (countOnly) {
    return NextResponse.json({ 
      count: pendingJobs.length 
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

import { NextResponse } from 'next/server';
import { jobsStorage } from '../jobs/route';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const searchQuery = searchParams.get('search')?.toLowerCase() || '';
  
  // Get all applications (accepted jobs with stage info)
  let applications = Array.from(jobsStorage.applications.values())
    .map(app => {
      const job = jobsStorage.jobs.find(j => j.id === app.jobId);
      if (!job) return null;
      
      return {
        ...app,
        company: job.company,
        position: job.position,
        location: job.location,
        skills: job.skills,
      };
    })
    .filter(Boolean);
  
  // Apply search filter if query provided
  if (searchQuery) {
    applications = applications.filter(app => {
      const searchableText = [
        app.company,
        app.position,
        app.location,
        ...(app.skills || [])
      ].join(' ').toLowerCase();
      
      return searchableText.includes(searchQuery);
    });
  }
  
  // Sort by date (newest first)
  applications = applications.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));
  
  return NextResponse.json({ 
    applications,
    total: applications.length 
  });
}

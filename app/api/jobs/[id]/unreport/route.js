import { NextResponse } from 'next/server';
import { jobsStorage } from '../../route';

export async function POST(request, { params }) {
  const { id } = params;
  
  // Initialize reportedJobs array if it doesn't exist
  if (!jobsStorage.reportedJobs) {
    jobsStorage.reportedJobs = [];
  }
  
  // Find and remove the report
  const reportIndex = jobsStorage.reportedJobs.findIndex(
    report => report.jobId === id
  );
  
  if (reportIndex === -1) {
    return NextResponse.json(
      { error: 'Report not found' },
      { status: 404 }
    );
  }
  
  // Remove the report
  jobsStorage.reportedJobs.splice(reportIndex, 1);
  
  // Log to history
  jobsStorage.history.push({
    action: 'unreport',
    jobId: id,
    timestamp: new Date().toISOString(),
  });
  
  return NextResponse.json({
    success: true,
    message: 'Job unreported successfully',
  });
}

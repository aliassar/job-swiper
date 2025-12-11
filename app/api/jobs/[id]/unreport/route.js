import { NextResponse } from 'next/server';
import { jobsStorage } from '../../route';

export async function POST(request, { params }) {
  const { id } = params;
  const jobId = parseInt(id);
  
  // Initialize reportedJobs array if it doesn't exist
  if (!jobsStorage.reportedJobs) {
    jobsStorage.reportedJobs = [];
  }
  
  // Find and remove the report
  const reportIndex = jobsStorage.reportedJobs.findIndex(
    report => report.jobId === jobId
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
    jobId: jobId,
    timestamp: new Date().toISOString(),
  });
  
  return NextResponse.json({
    success: true,
    message: 'Job unreported successfully',
  });
}

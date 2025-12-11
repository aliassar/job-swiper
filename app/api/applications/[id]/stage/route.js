import { NextResponse } from 'next/server';
import { jobsStorage } from '../../../jobs/route';
import { generateId } from '@/lib/utils';

const VALID_STAGES = [
  'Applied',
  'Phone Screen',
  'Interview',
  'Offer',
  'Rejected',
  'Accepted',
  'Withdrawn',
];

export async function PUT(request, { params }) {
  const applicationId = params.id;
  const body = await request.json();
  const { stage } = body;

  if (!VALID_STAGES.includes(stage)) {
    return NextResponse.json({ 
      error: 'Invalid stage',
      validStages: VALID_STAGES 
    }, { status: 400 });
  }

  const application = jobsStorage.applications.get(applicationId);
  if (!application) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 });
  }

  // Update application stage
  const updatedApplication = {
    ...application,
    stage,
    updatedAt: new Date().toISOString(),
  };
  jobsStorage.applications.set(applicationId, updatedApplication);

  // Log action
  jobsStorage.history.push({
    id: generateId('history'),
    jobId: application.jobId,
    action: 'stage_updated',
    timestamp: new Date().toISOString(),
    metadata: { 
      applicationId,
      newStage: stage,
      previousStage: application.stage,
    },
  });

  return NextResponse.json({ 
    success: true, 
    application: updatedApplication 
  });
}

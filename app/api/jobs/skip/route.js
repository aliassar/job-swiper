import { NextResponse } from 'next/server';

/**
 * POST /api/jobs/skip
 * Mark a job as skipped (user clicked skip button).
 * 
 * @param {Request} request - Contains { jobId, userId }
 * @returns {Response} - { success: true, skippedJob: { id, jobId, userId, skippedAt } }
 */
export async function POST(request) {
  try {
    const { jobId } = await request.json();

    // TODO: Replace with actual database call
    // Example with Prisma:
    // const skippedJob = await prisma.userJob.create({
    //   data: {
    //     userId: userId, // from auth session
    //     jobId: jobId,
    //     action: 'skipped',
    //     skippedAt: new Date(),
    //   }
    // });

    // Mock response
    const skippedJob = {
      id: `skipped_${Date.now()}`,
      jobId,
      userId: 'mock_user_id',
      skippedAt: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, skippedJob });
  } catch (error) {
    console.error('Error skipping job:', error);
    return NextResponse.json(
      { error: 'Failed to skip job' },
      { status: 500 }
    );
  }
}

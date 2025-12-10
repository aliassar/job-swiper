import { NextResponse } from 'next/server';

/**
 * POST /api/jobs/unskip
 * Restore a skipped job back to the queue.
 * 
 * @param {Request} request - Contains { jobId, userId }
 * @returns {Response} - { success: true }
 */
export async function POST(request) {
  try {
    const { jobId } = await request.json();

    // TODO: Replace with actual database call
    // Example with Prisma:
    // await prisma.userJob.deleteMany({
    //   where: {
    //     userId: userId, // from auth session
    //     jobId: jobId,
    //     action: 'skipped',
    //   }
    // });

    // Mock response
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error unskipping job:', error);
    return NextResponse.json(
      { error: 'Failed to unskip job' },
      { status: 500 }
    );
  }
}

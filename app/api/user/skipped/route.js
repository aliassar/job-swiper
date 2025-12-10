import { NextResponse } from 'next/server';

/**
 * GET /api/user/skipped
 * Get all skipped jobs for the user.
 * 
 * @returns {Response} - { skippedJobs: [{ id, job, skippedAt }] }
 */
export async function GET(request) {
  try {
    // TODO: Replace with actual database call
    // Example with Prisma:
    // const skippedJobs = await prisma.userJob.findMany({
    //   where: {
    //     userId: userId, // from auth session
    //     action: 'skipped',
    //   },
    //   include: {
    //     job: true
    //   },
    //   orderBy: {
    //     createdAt: 'desc'
    //   }
    // });

    // Mock response
    const skippedJobs = [];

    return NextResponse.json({ skippedJobs });
  } catch (error) {
    console.error('Error fetching skipped jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch skipped jobs' },
      { status: 500 }
    );
  }
}

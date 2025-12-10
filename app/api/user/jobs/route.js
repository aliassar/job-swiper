import { NextResponse } from 'next/server';

/**
 * GET /api/user/jobs
 * Get all jobs the user has interacted with.
 * 
 * Query Parameters:
 * - status: Filter by status (applied, in_review, interview, offer, hired, rejected_by_company)
 * - type: Filter by interaction type (accepted, rejected, skipped, favorited)
 * 
 * @returns {Response} - { userJobs: [{ id, job, status, action, isFavorite, createdAt, updatedAt, statusHistory }] }
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    // TODO: Replace with actual database call
    // Example with Prisma:
    // const userJobs = await prisma.userJob.findMany({
    //   where: {
    //     userId: userId, // from auth session
    //     ...(status && { status }),
    //     ...(type && { action: type }),
    //   },
    //   include: {
    //     job: true,
    //     statusHistory: {
    //       orderBy: { changedAt: 'desc' }
    //     }
    //   }
    // });

    // Mock response
    const userJobs = [];

    return NextResponse.json({ userJobs });
  } catch (error) {
    console.error('Error fetching user jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user jobs' },
      { status: 500 }
    );
  }
}

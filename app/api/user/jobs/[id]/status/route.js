import { NextResponse } from 'next/server';

/**
 * PATCH /api/user/jobs/:id/status
 * Update the status of a user's job application.
 * 
 * @param {Request} request - Contains { status }
 * @param {Object} params - Contains { id } - the user job ID
 * @returns {Response} - { success: true, userJob: { id, status, updatedAt } }
 */
export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const { status } = await request.json();

    // Validate status
    const validStatuses = ['applied', 'in_review', 'interview', 'offer', 'hired', 'rejected_by_company'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // TODO: Replace with actual database call
    // Example with Prisma:
    // const userJob = await prisma.userJob.update({
    //   where: { id },
    //   data: { status },
    // });
    // 
    // // Create status history entry
    // await prisma.userJobStatusHistory.create({
    //   data: {
    //     userJobId: id,
    //     status,
    //     changedAt: new Date(),
    //   }
    // });

    // Mock response
    const userJob = {
      id,
      status,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, userJob });
  } catch (error) {
    console.error('Error updating job status:', error);
    return NextResponse.json(
      { error: 'Failed to update job status' },
      { status: 500 }
    );
  }
}

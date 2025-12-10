import { NextResponse } from 'next/server';

export async function POST(request) {
  const body = await request.json();
  const { jobId, favorite } = body;

  // In a real app, this would update the database
  return NextResponse.json({ success: true, message: 'Favorite toggled', jobId, favorite });
}

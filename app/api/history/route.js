import { NextResponse } from 'next/server';

export async function GET() {
  // In a real app, this would fetch from database
  // For now, return empty history
  return NextResponse.json({ history: [] });
}

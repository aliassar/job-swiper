import { NextResponse } from 'next/server';
import { jobsStorage } from '../jobs/route';

export async function GET() {
  // Return full action history sorted by timestamp (newest first)
  const history = [...jobsStorage.history]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  return NextResponse.json({ 
    history,
    total: history.length 
  });
}

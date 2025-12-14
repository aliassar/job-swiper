import { NextResponse } from 'next/server';

// POST - Upload file
export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const type = formData.get('type'); // 'resume' or 'coverLetter'
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // In production, this would upload to a storage service (S3, etc.)
    // For now, we'll simulate a delay and return a mock URL
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate upload delay
    
    const mockUrl = `/uploads/${type}/${file.name}`;
    
    return NextResponse.json({
      success: true,
      url: mockUrl,
      name: file.name,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

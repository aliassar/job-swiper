import { NextResponse } from 'next/server';

// In-memory storage for email connections (per user)
// In production, this would be stored in a secure database
const emailConnections = new Map();

// POST - Connect email account
export async function POST(request) {
  try {
    const body = await request.json();
    const { provider, email, password, imapServer, imapPort } = body;
    
    // Validation
    if (!provider || !email || !password) {
      return NextResponse.json(
        { error: 'Provider, email, and password are required' },
        { status: 400 }
      );
    }
    
    if (!email.includes('@')) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }
    
    // Validate IMAP settings for custom provider
    if (provider === 'imap' && (!imapServer || !imapPort)) {
      return NextResponse.json(
        { error: 'IMAP server and port are required for custom IMAP' },
        { status: 400 }
      );
    }
    
    // In production, this would:
    // 1. Validate credentials by attempting IMAP connection
    // 2. Store encrypted credentials in database
    // 3. Set up email monitoring service
    
    // Simulate validation delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // For demo purposes, simulate a failure for invalid credentials
    // (In production, you'd validate against actual IMAP server)
    if (password === 'invalid') {
      return NextResponse.json(
        { error: 'Invalid credentials. Please check your email and password.' },
        { status: 401 }
      );
    }
    
    // Store connection info (in production, encrypt sensitive data)
    const userId = 'default'; // In production, get from session
    const connectionData = {
      provider,
      email,
      imapServer: provider === 'imap' ? imapServer : getDefaultImapServer(provider),
      imapPort: provider === 'imap' ? imapPort : '993',
      connectedAt: new Date().toISOString(),
      status: 'connected',
    };
    
    emailConnections.set(userId, connectionData);
    
    return NextResponse.json({
      success: true,
      message: 'Email connected successfully',
      connection: {
        provider: connectionData.provider,
        email: connectionData.email,
        imapServer: connectionData.imapServer,
        imapPort: connectionData.imapPort,
        connectedAt: connectionData.connectedAt,
      }
    });
  } catch (error) {
    console.error('Error connecting email:', error);
    return NextResponse.json(
      { error: 'Failed to connect email. Please try again.' },
      { status: 500 }
    );
  }
}

// DELETE - Disconnect email account
export async function DELETE(request) {
  try {
    const userId = 'default'; // In production, get from session
    
    if (!emailConnections.has(userId)) {
      return NextResponse.json(
        { error: 'No email connection found' },
        { status: 404 }
      );
    }
    
    emailConnections.delete(userId);
    
    return NextResponse.json({
      success: true,
      message: 'Email disconnected successfully'
    });
  } catch (error) {
    console.error('Error disconnecting email:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect email' },
      { status: 500 }
    );
  }
}

// GET - Get current email connection status
export async function GET(request) {
  try {
    const userId = 'default'; // In production, get from session
    
    const connection = emailConnections.get(userId);
    
    if (!connection) {
      return NextResponse.json({
        connected: false,
        connection: null
      });
    }
    
    return NextResponse.json({
      connected: true,
      connection: {
        provider: connection.provider,
        email: connection.email,
        imapServer: connection.imapServer,
        imapPort: connection.imapPort,
        connectedAt: connection.connectedAt,
        status: connection.status,
      }
    });
  } catch (error) {
    console.error('Error getting email connection:', error);
    return NextResponse.json(
      { error: 'Failed to get email connection status' },
      { status: 500 }
    );
  }
}

// Helper function to get default IMAP server for known providers
function getDefaultImapServer(provider) {
  const servers = {
    gmail: 'imap.gmail.com',
    yahoo: 'imap.mail.yahoo.com',
    outlook: 'outlook.office365.com',
  };
  return servers[provider] || '';
}

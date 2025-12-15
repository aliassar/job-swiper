import { NextResponse } from 'next/server';

// In-memory storage for email connections (per user)
// In production, this would be stored in a secure database
const emailConnections = new Map();

// POST - Connect email account
export async function POST(request) {
  try {
    const body = await request.json();
    const { provider, email, password, imapServer, imapPort } = body;
    
    // Validation - provider
    if (!provider || typeof provider !== 'string') {
      return NextResponse.json(
        { error: 'Valid provider is required' },
        { status: 400 }
      );
    }
    
    // Sanitize provider input
    const sanitizedProvider = provider.trim().toLowerCase();
    const validProviders = ['gmail', 'yahoo', 'outlook', 'imap'];
    
    if (!validProviders.includes(sanitizedProvider)) {
      return NextResponse.json(
        { error: 'Invalid email provider' },
        { status: 400 }
      );
    }
    
    // Validation - email
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }
    
    // Sanitize and validate email
    const sanitizedEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(sanitizedEmail)) {
      return NextResponse.json(
        { error: 'Invalid email address format' },
        { status: 400 }
      );
    }
    
    // Validation - password
    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }
    
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }
    
    // Validate IMAP settings for custom provider
    if (sanitizedProvider === 'imap') {
      if (!imapServer || typeof imapServer !== 'string' || !imapServer.trim()) {
        return NextResponse.json(
          { error: 'IMAP server is required for custom IMAP' },
          { status: 400 }
        );
      }
      
      if (!imapPort) {
        return NextResponse.json(
          { error: 'IMAP port is required for custom IMAP' },
          { status: 400 }
        );
      }
      
      const port = parseInt(imapPort, 10);
      if (isNaN(port) || port < 1 || port > 65535) {
        return NextResponse.json(
          { error: 'Invalid IMAP port number (must be 1-65535)' },
          { status: 400 }
        );
      }
    }
    
    // In production, this would:
    // 1. Validate credentials by attempting IMAP connection
    // 2. Store encrypted credentials in database
    // 3. Set up email monitoring service
    
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
      provider: sanitizedProvider,
      email: sanitizedEmail,
      imapServer: sanitizedProvider === 'imap' ? imapServer.trim() : getDefaultImapServer(sanitizedProvider),
      imapPort: sanitizedProvider === 'imap' ? imapPort : '993',
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
    
    // Check if OAuth token is expired (for OAuth providers)
    let tokenStatus = 'valid';
    if (connection.expiresAt) {
      const now = Date.now();
      if (now >= connection.expiresAt) {
        tokenStatus = 'expired';
        connection.status = 'token_expired';
      } else if (now >= connection.expiresAt - 5 * 60 * 1000) {
        // Token expires in less than 5 minutes
        tokenStatus = 'expiring_soon';
      }
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
        tokenStatus,
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

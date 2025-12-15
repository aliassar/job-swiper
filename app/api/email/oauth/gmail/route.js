import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

// In-memory storage for OAuth state tokens (in production, use Redis or database)
const oauthStates = new Map();

// OAuth configuration for Gmail (Google)
const GMAIL_CONFIG = {
  authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  scope: 'https://www.googleapis.com/auth/gmail.readonly',
  clientId: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  redirectUri: process.env.NEXTAUTH_URL 
    ? `${process.env.NEXTAUTH_URL}/api/email/oauth/gmail/callback`
    : 'http://localhost:3000/api/email/oauth/gmail/callback',
};

/**
 * Initiates Gmail OAuth flow
 * GET /api/email/oauth/gmail
 */
export async function GET(request) {
  try {
    // Generate CSRF protection state token
    const state = randomBytes(32).toString('hex');
    const userId = 'default'; // In production, get from session
    
    // Store state with timestamp for validation
    oauthStates.set(state, {
      userId,
      provider: 'gmail',
      createdAt: Date.now(),
    });
    
    // Clean up old states (older than 10 minutes)
    const now = Date.now();
    for (const [key, value] of oauthStates.entries()) {
      if (now - value.createdAt > 10 * 60 * 1000) {
        oauthStates.delete(key);
      }
    }
    
    // Build OAuth authorization URL
    const authUrl = new URL(GMAIL_CONFIG.authUrl);
    authUrl.searchParams.set('client_id', GMAIL_CONFIG.clientId);
    authUrl.searchParams.set('redirect_uri', GMAIL_CONFIG.redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', GMAIL_CONFIG.scope);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');
    
    // Redirect to Google OAuth consent screen
    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    console.error('Error initiating Gmail OAuth:', error);
    return NextResponse.redirect(
      '/connect-email?error=' + encodeURIComponent('Failed to initiate Gmail connection')
    );
  }
}

// Export state storage for use in callback
export { oauthStates, GMAIL_CONFIG };

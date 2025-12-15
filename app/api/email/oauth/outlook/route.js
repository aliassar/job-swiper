import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

// Mark this route as dynamic
export const dynamic = 'force-dynamic';

// In-memory storage for OAuth state tokens
const oauthStates = new Map();

// OAuth configuration for Outlook/Microsoft
const OUTLOOK_CONFIG = {
  authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
  tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
  scope: 'https://outlook.office.com/IMAP.AccessAsUser.All offline_access',
  clientId: process.env.OUTLOOK_CLIENT_ID || '',
  clientSecret: process.env.OUTLOOK_CLIENT_SECRET || '',
  redirectUri: process.env.NEXTAUTH_URL 
    ? `${process.env.NEXTAUTH_URL}/api/email/oauth/outlook/callback`
    : 'http://localhost:3000/api/email/oauth/outlook/callback',
};

/**
 * Initiates Outlook OAuth flow
 * GET /api/email/oauth/outlook
 */
export async function GET(request) {
  try {
    // Generate CSRF protection state token
    const state = randomBytes(32).toString('hex');
    const userId = 'default'; // In production, get from session
    
    // Store state with timestamp for validation
    oauthStates.set(state, {
      userId,
      provider: 'outlook',
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
    const authUrl = new URL(OUTLOOK_CONFIG.authUrl);
    authUrl.searchParams.set('client_id', OUTLOOK_CONFIG.clientId);
    authUrl.searchParams.set('redirect_uri', OUTLOOK_CONFIG.redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', OUTLOOK_CONFIG.scope);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('response_mode', 'query');
    
    // Redirect to Microsoft OAuth consent screen
    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    console.error('Error initiating Outlook OAuth:', error);
    return NextResponse.redirect(
      '/connect-email?error=' + encodeURIComponent('Failed to initiate Outlook connection')
    );
  }
}

export { oauthStates, OUTLOOK_CONFIG };

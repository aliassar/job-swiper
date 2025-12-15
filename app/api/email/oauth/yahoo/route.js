import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

// Mark this route as dynamic
export const dynamic = 'force-dynamic';

// In-memory storage for OAuth state tokens
const oauthStates = new Map();

// OAuth configuration for Yahoo
const YAHOO_CONFIG = {
  authUrl: 'https://api.login.yahoo.com/oauth2/request_auth',
  tokenUrl: 'https://api.login.yahoo.com/oauth2/get_token',
  scope: 'mail-r',
  clientId: process.env.YAHOO_CLIENT_ID || '',
  clientSecret: process.env.YAHOO_CLIENT_SECRET || '',
  redirectUri: process.env.NEXTAUTH_URL 
    ? `${process.env.NEXTAUTH_URL}/api/email/oauth/yahoo/callback`
    : 'http://localhost:3000/api/email/oauth/yahoo/callback',
};

/**
 * Initiates Yahoo OAuth flow
 * GET /api/email/oauth/yahoo
 */
export async function GET(request) {
  try {
    // Generate CSRF protection state token
    const state = randomBytes(32).toString('hex');
    const userId = 'default'; // In production, get from session
    
    // Store state with timestamp for validation
    oauthStates.set(state, {
      userId,
      provider: 'yahoo',
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
    const authUrl = new URL(YAHOO_CONFIG.authUrl);
    authUrl.searchParams.set('client_id', YAHOO_CONFIG.clientId);
    authUrl.searchParams.set('redirect_uri', YAHOO_CONFIG.redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', YAHOO_CONFIG.scope);
    authUrl.searchParams.set('state', state);
    
    // Redirect to Yahoo OAuth consent screen
    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    console.error('Error initiating Yahoo OAuth:', error);
    return NextResponse.redirect(
      '/connect-email?error=' + encodeURIComponent('Failed to initiate Yahoo connection')
    );
  }
}

export { oauthStates, YAHOO_CONFIG };

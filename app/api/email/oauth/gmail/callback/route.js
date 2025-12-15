import { NextResponse } from 'next/server';

// Mark this route as dynamic (not statically generated)
export const dynamic = 'force-dynamic';

// Import state storage from parent route
// In production, this would be in a shared module or database
let oauthStates, GMAIL_CONFIG;
try {
  const parentModule = await import('../route.js');
  oauthStates = parentModule.oauthStates;
  GMAIL_CONFIG = parentModule.GMAIL_CONFIG;
} catch (error) {
  // Fallback initialization if import fails
  oauthStates = new Map();
  GMAIL_CONFIG = {
    tokenUrl: 'https://oauth2.googleapis.com/token',
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri: process.env.NEXTAUTH_URL 
      ? `${process.env.NEXTAUTH_URL}/api/email/oauth/gmail/callback`
      : 'http://localhost:3000/api/email/oauth/gmail/callback',
  };
}

// In-memory storage for email connections (per user)
const emailConnections = new Map();

/**
 * Handles Gmail OAuth callback
 * GET /api/email/oauth/gmail/callback
 */
export async function GET(request) {
  try {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    
    // Helper function to build absolute redirect URL
    const redirectUrl = (path) => `${origin}${path}`;
    
    // Handle user denial or errors from OAuth provider
    if (error) {
      const errorMessage = error === 'access_denied' 
        ? 'Access denied. Please grant permission to connect your Gmail account.'
        : 'OAuth authentication failed. Please try again.';
      return NextResponse.redirect(
        redirectUrl('/connect-email?error=' + encodeURIComponent(errorMessage))
      );
    }
    
    // Validate required parameters
    if (!code || !state) {
      return NextResponse.redirect(
        redirectUrl('/connect-email?error=' + encodeURIComponent('Invalid OAuth callback parameters'))
      );
    }
    
    // Validate state token (CSRF protection)
    const stateData = oauthStates.get(state);
    if (!stateData) {
      return NextResponse.redirect(
        redirectUrl('/connect-email?error=' + encodeURIComponent('Invalid or expired OAuth state'))
      );
    }
    
    // Delete used state token
    oauthStates.delete(state);
    
    // Validate state timestamp (must be less than 10 minutes old)
    const now = Date.now();
    if (now - stateData.createdAt > 10 * 60 * 1000) {
      return NextResponse.redirect(
        redirectUrl('/connect-email?error=' + encodeURIComponent('OAuth session expired. Please try again.'))
      );
    }
    
    // Exchange authorization code for tokens
    const tokenResponse = await fetch(GMAIL_CONFIG.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: GMAIL_CONFIG.clientId,
        client_secret: GMAIL_CONFIG.clientSecret,
        redirect_uri: GMAIL_CONFIG.redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Token exchange failed:', errorData);
      return NextResponse.redirect(
        redirectUrl('/connect-email?error=' + encodeURIComponent('Failed to obtain access tokens. Please try again.'))
      );
    }
    
    const tokens = await tokenResponse.json();
    
    // Get user's email address from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
      },
    });
    
    if (!userInfoResponse.ok) {
      return NextResponse.redirect(
        redirectUrl('/connect-email?error=' + encodeURIComponent('Failed to retrieve user information'))
      );
    }
    
    const userInfo = await userInfoResponse.json();
    
    // Store connection info (in production, encrypt and store in database)
    const userId = stateData.userId;
    const connectionData = {
      provider: 'gmail',
      email: userInfo.email,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: Date.now() + (tokens.expires_in * 1000),
      connectedAt: new Date().toISOString(),
      status: 'connected',
    };
    
    emailConnections.set(userId, connectionData);
    
    // Redirect to settings page with success message
    return NextResponse.redirect(
      redirectUrl('/connect-email?success=' + encodeURIComponent('Gmail connected successfully!'))
    );
  } catch (error) {
    console.error('Error in Gmail OAuth callback:', error);
    // Get origin from request for error redirect
    const origin = new URL(request.url).origin;
    return NextResponse.redirect(
      `${origin}/connect-email?error=` + encodeURIComponent('An unexpected error occurred. Please try again.')
    );
  }
}

export { emailConnections };

import { NextResponse } from 'next/server';

// Import state storage from parent route
let oauthStates, YAHOO_CONFIG;
try {
  const parentModule = await import('../route.js');
  oauthStates = parentModule.oauthStates;
  YAHOO_CONFIG = parentModule.YAHOO_CONFIG;
} catch (error) {
  oauthStates = new Map();
  YAHOO_CONFIG = {
    tokenUrl: 'https://api.login.yahoo.com/oauth2/get_token',
    clientId: process.env.YAHOO_CLIENT_ID || '',
    clientSecret: process.env.YAHOO_CLIENT_SECRET || '',
    redirectUri: process.env.NEXTAUTH_URL 
      ? `${process.env.NEXTAUTH_URL}/api/email/oauth/yahoo/callback`
      : 'http://localhost:3000/api/email/oauth/yahoo/callback',
  };
}

const emailConnections = new Map();

/**
 * Handles Yahoo OAuth callback
 * GET /api/email/oauth/yahoo/callback
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    
    if (error) {
      const errorMessage = error === 'access_denied' 
        ? 'Access denied. Please grant permission to connect your Yahoo account.'
        : 'OAuth authentication failed. Please try again.';
      return NextResponse.redirect(
        '/connect-email?error=' + encodeURIComponent(errorMessage)
      );
    }
    
    if (!code || !state) {
      return NextResponse.redirect(
        '/connect-email?error=' + encodeURIComponent('Invalid OAuth callback parameters')
      );
    }
    
    // Validate state token
    const stateData = oauthStates.get(state);
    if (!stateData) {
      return NextResponse.redirect(
        '/connect-email?error=' + encodeURIComponent('Invalid or expired OAuth state')
      );
    }
    
    oauthStates.delete(state);
    
    // Validate timestamp
    const now = Date.now();
    if (now - stateData.createdAt > 10 * 60 * 1000) {
      return NextResponse.redirect(
        '/connect-email?error=' + encodeURIComponent('OAuth session expired. Please try again.')
      );
    }
    
    // Exchange authorization code for tokens
    const authHeader = Buffer.from(`${YAHOO_CONFIG.clientId}:${YAHOO_CONFIG.clientSecret}`).toString('base64');
    
    const tokenResponse = await fetch(YAHOO_CONFIG.tokenUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        redirect_uri: YAHOO_CONFIG.redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Token exchange failed:', errorData);
      return NextResponse.redirect(
        '/connect-email?error=' + encodeURIComponent('Failed to obtain access tokens. Please try again.')
      );
    }
    
    const tokens = await tokenResponse.json();
    
    // Get user's email from Yahoo (using ID token or profile endpoint)
    // Yahoo returns user info in the ID token (JWT)
    let email = 'user@yahoo.com'; // Placeholder
    
    if (tokens.id_token) {
      try {
        // Decode JWT to get email (basic decode, no verification for demo)
        const payload = JSON.parse(Buffer.from(tokens.id_token.split('.')[1], 'base64').toString());
        email = payload.email || email;
      } catch (e) {
        console.error('Failed to decode ID token:', e);
      }
    }
    
    // Store connection
    const userId = stateData.userId;
    const connectionData = {
      provider: 'yahoo',
      email,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: Date.now() + (tokens.expires_in * 1000),
      connectedAt: new Date().toISOString(),
      status: 'connected',
    };
    
    emailConnections.set(userId, connectionData);
    
    return NextResponse.redirect(
      '/connect-email?success=' + encodeURIComponent('Yahoo Mail connected successfully!')
    );
  } catch (error) {
    console.error('Error in Yahoo OAuth callback:', error);
    return NextResponse.redirect(
      '/connect-email?error=' + encodeURIComponent('An unexpected error occurred. Please try again.')
    );
  }
}

export { emailConnections };

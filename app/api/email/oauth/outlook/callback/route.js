import { NextResponse } from 'next/server';

// Import state storage from parent route
let oauthStates, OUTLOOK_CONFIG;
try {
  const parentModule = await import('../route.js');
  oauthStates = parentModule.oauthStates;
  OUTLOOK_CONFIG = parentModule.OUTLOOK_CONFIG;
} catch (error) {
  oauthStates = new Map();
  OUTLOOK_CONFIG = {
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    clientId: process.env.OUTLOOK_CLIENT_ID || '',
    clientSecret: process.env.OUTLOOK_CLIENT_SECRET || '',
    redirectUri: process.env.NEXTAUTH_URL 
      ? `${process.env.NEXTAUTH_URL}/api/email/oauth/outlook/callback`
      : 'http://localhost:3000/api/email/oauth/outlook/callback',
  };
}

const emailConnections = new Map();

/**
 * Handles Outlook OAuth callback
 * GET /api/email/oauth/outlook/callback
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    
    if (error) {
      const errorMessage = error === 'access_denied' 
        ? 'Access denied. Please grant permission to connect your Outlook account.'
        : errorDescription || 'OAuth authentication failed. Please try again.';
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
    const tokenResponse = await fetch(OUTLOOK_CONFIG.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: OUTLOOK_CONFIG.clientId,
        client_secret: OUTLOOK_CONFIG.clientSecret,
        redirect_uri: OUTLOOK_CONFIG.redirectUri,
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
    
    // Get user's email from Microsoft Graph
    const userInfoResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
      },
    });
    
    if (!userInfoResponse.ok) {
      return NextResponse.redirect(
        '/connect-email?error=' + encodeURIComponent('Failed to retrieve user information')
      );
    }
    
    const userInfo = await userInfoResponse.json();
    
    // Store connection
    const userId = stateData.userId;
    const connectionData = {
      provider: 'outlook',
      email: userInfo.mail || userInfo.userPrincipalName,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: Date.now() + (tokens.expires_in * 1000),
      connectedAt: new Date().toISOString(),
      status: 'connected',
    };
    
    emailConnections.set(userId, connectionData);
    
    return NextResponse.redirect(
      '/connect-email?success=' + encodeURIComponent('Outlook connected successfully!')
    );
  } catch (error) {
    console.error('Error in Outlook OAuth callback:', error);
    return NextResponse.redirect(
      '/connect-email?error=' + encodeURIComponent('An unexpected error occurred. Please try again.')
    );
  }
}

export { emailConnections };

import { NextResponse } from 'next/server';

// Define public paths that don't require authentication
const PUBLIC_PATHS = [
    '/login',
    '/login/sign-up',
    '/login/forgot-password',
    '/auth/callback',
    '/auth/verify-email',
];

// API routes should be excluded from middleware
const API_PATHS = ['/api/'];

// Static assets and Next.js internals
const STATIC_PATHS = ['/_next/', '/favicon.ico', '/manifest.json', '/sw.js', '/icon-'];

export function middleware(request) {
    const { pathname } = request.nextUrl;

    // Skip middleware for static assets and API routes
    if (STATIC_PATHS.some(path => pathname.startsWith(path))) {
        return NextResponse.next();
    }

    // Skip middleware for API routes
    if (API_PATHS.some(path => pathname.startsWith(path))) {
        return NextResponse.next();
    }

    // Check if the path is public
    const isPublicPath = PUBLIC_PATHS.some(path => pathname.startsWith(path));

    if (isPublicPath) {
        return NextResponse.next();
    }

    // For protected routes, check for auth token in cookies
    // Note: localStorage is not accessible in middleware (Edge runtime)
    // We check for a cookie that should be set by the client
    const authToken = request.cookies.get('auth_token')?.value;

    if (!authToken) {
        // Redirect to login without loading the protected page at all
        const loginUrl = new URL('/login', request.url);
        // Optionally add a redirect parameter to return after login
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Token exists, allow the request to proceed
    // The SessionProvider will further validate the token on the client side
    return NextResponse.next();
}

// Configure which routes the middleware applies to
export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder files
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};

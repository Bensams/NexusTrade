import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const VISITOR_COOKIE = 'nexus_visitor_id';

// Simple UUID v4 generator for Edge runtime (no external dependencies)
function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Extract client IP from request headers (Edge compatible)
function getClientIP(request: NextRequest): string | null {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }
    const realIP = request.headers.get('x-real-ip');
    return realIP || null;
}

// Auth routes that should be checked for banned IPs
const AUTH_ROUTES = ['/login', '/register', '/signup'];

export async function middleware(request: NextRequest) {
    const response = NextResponse.next();
    const { pathname } = request.nextUrl;

    // Check banned IP for auth-related routes FIRST (before any other logic)
    // This is checked before login/signup to prevent ban evasion
    if (AUTH_ROUTES.some(route => pathname.startsWith(route))) {
        const clientIP = getClientIP(request);

        if (clientIP) {
            try {
                // Make internal API call to check if IP is banned
                // This is necessary because Edge middleware cannot use Prisma directly
                const baseUrl = request.nextUrl.origin;
                const banCheckResponse = await fetch(`${baseUrl}/api/check-ban`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ip: clientIP }),
                });

                if (banCheckResponse.ok) {
                    const banData = await banCheckResponse.json();
                    if (banData.banned) {
                        // For pages, redirect to a banned page or return 403
                        return new NextResponse(
                            JSON.stringify({
                                error: 'Access denied',
                                message: banData.message || 'This IP address has been banned.'
                            }),
                            {
                                status: 403,
                                headers: { 'Content-Type': 'application/json' }
                            }
                        );
                    }
                }
            } catch (error) {
                // Fail open - don't block users if check fails
                console.error('Ban check failed in middleware:', error);
            }
        }
    }

    // Skip visitor tracking for API routes, static files, and internal Next.js routes
    if (
        pathname.startsWith('/api/') ||
        pathname.startsWith('/_next/') ||
        pathname.startsWith('/favicon') ||
        pathname.includes('.')
    ) {
        return response;
    }

    // Check for existing visitor ID
    let visitorId = request.cookies.get(VISITOR_COOKIE)?.value;

    if (!visitorId) {
        visitorId = generateUUID();
        // Set cookie to expire in 24 hours (for daily unique tracking)
        response.cookies.set(VISITOR_COOKIE, visitorId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 86400, // 24 hours in seconds
            path: '/',
            sameSite: 'lax',
        });
    }

    // Pass visitor ID to the response via header (for API access if needed)
    response.headers.set('x-visitor-id', visitorId);

    return response;
}

export const config = {
    // Match all paths except static files
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

import { NextResponse } from "next/server";
import { isIPBlacklisted } from "@/lib/banCheck";
import { getClientIP } from "@/lib/auditLog";

/**
 * Internal API endpoint for Edge middleware to check if an IP is banned.
 * This is needed because Edge runtime cannot use Prisma directly.
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        let ip = body.ip;

        // If no IP provided in body, try to extract from headers
        if (!ip) {
            ip = getClientIP(request);
        }

        if (!ip) {
            return NextResponse.json({ banned: false });
        }

        const result = await isIPBlacklisted(ip);

        return NextResponse.json({
            banned: result.banned,
            message: result.message,
            expiresAt: result.expiresAt?.toISOString() || null,
        });
    } catch (error) {
        console.error("Error checking ban status:", error);
        // Fail open - don't block users if check fails
        return NextResponse.json({ banned: false });
    }
}

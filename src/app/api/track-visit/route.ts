import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/db";

const VISITOR_COOKIE = 'nexus_visitor_id';

// POST /api/track-visit - Record a unique visit for the current day
export async function POST(request: Request) {
    try {
        // Get visitor ID from cookie
        const cookieStore = await cookies();
        const visitorId = cookieStore.get(VISITOR_COOKIE)?.value;

        if (!visitorId) {
            // No visitor cookie set (shouldn't happen if middleware is working)
            return NextResponse.json({ tracked: false, reason: "no_visitor_id" });
        }

        // Get today's date (just the date, no time)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get IP and User Agent from request
        const forwarded = request.headers.get("x-forwarded-for");
        const ipAddress = forwarded ? forwarded.split(",")[0].trim() : request.headers.get("x-real-ip");
        const userAgent = request.headers.get("user-agent");

        // Try to create a visit record (upsert to handle duplicates gracefully)
        await prisma.siteVisit.upsert({
            where: {
                visitorId_date: {
                    visitorId,
                    date: today,
                },
            },
            update: {}, // Don't update anything if already exists
            create: {
                visitorId,
                date: today,
                ipAddress: ipAddress || null,
                userAgent: userAgent || null,
            },
        });

        return NextResponse.json({ tracked: true });
    } catch (error) {
        console.error("Error tracking visit:", error);
        // Don't fail the request if tracking fails - silent fail
        return NextResponse.json({ tracked: false, reason: "error" });
    }
}

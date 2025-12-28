/**
 * Public Site Settings API
 * 
 * Provides public access to site settings like social links.
 * No authentication required - for use in footer, contact pages, etc.
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/db";

/**
 * GET /api/site-settings
 * Fetch public site settings (social links, support email)
 */
export async function GET() {
    try {
        // Get or create default settings
        const settings = await prisma.siteSettings.upsert({
            where: { id: "default" },
            update: {},
            create: {
                id: "default",
                discordLink: null,
                twitterLink: null,
                instagramLink: null,
                supportEmail: null,
            },
            select: {
                discordLink: true,
                twitterLink: true,
                instagramLink: true,
                supportEmail: true,
            },
        });

        return NextResponse.json(settings);
    } catch (error) {
        console.error("Error fetching public site settings:", error);
        return NextResponse.json(
            { error: "Failed to fetch site settings" },
            { status: 500 }
        );
    }
}

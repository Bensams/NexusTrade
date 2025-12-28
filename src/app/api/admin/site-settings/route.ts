/**
 * Admin Site Settings API
 * 
 * Manages global website information like social links and support email.
 * Only accessible by ADMIN or SUPER_ADMIN roles.
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireRole } from "@/lib/roleAuth";

/**
 * GET /api/admin/site-settings
 * Fetch all site settings (social links, support email)
 */
export async function GET() {
    try {
        const result = await requireRole("ADMIN");
        if ("error" in result) return result.error;

        // Upsert to ensure settings exist
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
        });

        return NextResponse.json(settings);
    } catch (error) {
        console.error("Error fetching site settings:", error);
        return NextResponse.json(
            { error: "Failed to fetch site settings" },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/admin/site-settings
 * Update site settings (social links, support email)
 */
export async function PATCH(request: Request) {
    try {
        const result = await requireRole("ADMIN");
        if ("error" in result) return result.error;

        const body = await request.json();
        const { discordLink, twitterLink, instagramLink, supportEmail } = body;

        // Validate URLs if provided
        const urlFields = { discordLink, twitterLink, instagramLink };
        for (const [field, value] of Object.entries(urlFields)) {
            if (value !== undefined && value !== null && value !== "") {
                try {
                    new URL(value as string);
                } catch {
                    return NextResponse.json(
                        { error: `Invalid URL for ${field}` },
                        { status: 400 }
                    );
                }
            }
        }

        // Validate email if provided
        if (supportEmail !== undefined && supportEmail !== null && supportEmail !== "") {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(supportEmail)) {
                return NextResponse.json(
                    { error: "Invalid support email format" },
                    { status: 400 }
                );
            }
        }

        // Build update object only with provided fields
        const updateData: {
            discordLink?: string | null;
            twitterLink?: string | null;
            instagramLink?: string | null;
            supportEmail?: string | null;
        } = {};

        if (discordLink !== undefined) updateData.discordLink = discordLink || null;
        if (twitterLink !== undefined) updateData.twitterLink = twitterLink || null;
        if (instagramLink !== undefined) updateData.instagramLink = instagramLink || null;
        if (supportEmail !== undefined) updateData.supportEmail = supportEmail || null;

        const settings = await prisma.siteSettings.upsert({
            where: { id: "default" },
            update: updateData,
            create: {
                id: "default",
                discordLink: discordLink || null,
                twitterLink: twitterLink || null,
                instagramLink: instagramLink || null,
                supportEmail: supportEmail || null,
            },
        });

        return NextResponse.json(settings);
    } catch (error) {
        console.error("Error updating site settings:", error);
        return NextResponse.json(
            { error: "Failed to update site settings" },
            { status: 500 }
        );
    }
}

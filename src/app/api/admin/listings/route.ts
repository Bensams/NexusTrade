import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireRole } from "@/lib/roleAuth";

/**
 * GET /api/admin/listings
 * Fetch all listings with their ban status for moderation
 * Requires MODERATOR+ role
 */
export async function GET() {
    try {
        const result = await requireRole("MODERATOR");
        if ("error" in result) return result.error;

        const listings = await prisma.listing.findMany({
            select: {
                id: true,
                title: true,
                price: true,
                game: true,
                isBanned: true,
                createdAt: true,
                seller: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(listings);
    } catch (error) {
        console.error("Error fetching listings:", error);
        return NextResponse.json(
            { error: "Failed to fetch listings" },
            { status: 500 }
        );
    }
}

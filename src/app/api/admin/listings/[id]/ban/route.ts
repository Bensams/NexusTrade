import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { logActivity } from "@/lib/auditLog";
import { requireRole } from "@/lib/roleAuth";

interface ListingBanBody {
    isBanned: boolean;
}

/**
 * PATCH /api/admin/listings/[id]/ban
 * Toggle the banned status of a listing.
 * Banned listings are hidden from the marketplace.
 */
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const result = await requireRole("MODERATOR");
        if ("error" in result) return result.error;

        const { id: listingId } = await params;

        // Get the listing
        const listing = await prisma.listing.findUnique({
            where: { id: listingId },
            include: {
                seller: {
                    select: { id: true, email: true },
                },
            },
        });

        if (!listing) {
            return NextResponse.json(
                { error: "Listing not found" },
                { status: 404 }
            );
        }

        // Parse request body
        const body: ListingBanBody = await request.json();
        const { isBanned } = body;

        if (typeof isBanned !== "boolean") {
            return NextResponse.json(
                { error: "isBanned must be a boolean" },
                { status: 400 }
            );
        }

        // Update listing ban status
        const updatedListing = await prisma.listing.update({
            where: { id: listingId },
            data: { isBanned },
        });

        // Log the admin action
        logActivity({
            userId: result.user.id,
            actionType: "ADMIN_ACTION",
            resourceId: listingId,
            resourceType: "listing_ban",
            metadata: {
                action: isBanned ? "ban_listing" : "unban_listing",
                listingTitle: listing.title,
                sellerId: listing.seller.id,
                sellerEmail: listing.seller.email,
            },
        });

        return NextResponse.json({
            success: true,
            isBanned: updatedListing.isBanned,
            message: isBanned
                ? `Listing "${listing.title}" has been hidden from the marketplace`
                : `Listing "${listing.title}" is now visible on the marketplace`,
        });
    } catch (error) {
        console.error("Error toggling listing ban:", error);
        return NextResponse.json(
            { error: "Failed to update listing ban status" },
            { status: 500 }
        );
    }
}

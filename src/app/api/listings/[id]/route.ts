import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

// GET single listing
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const listing = await prisma.listing.findUnique({
            where: { id },
            include: {
                seller: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                        createdAt: true,
                        reviewsReceived: {
                            select: {
                                rating: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        orders: true,
                    },
                },
            },
        });

        if (!listing) {
            return NextResponse.json(
                { error: "Listing not found" },
                { status: 404 }
            );
        }

        // Calculate seller's average rating
        const sellerReviews = listing.seller.reviewsReceived;
        const totalReviews = sellerReviews.length;
        const averageRating = totalReviews > 0
            ? sellerReviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / totalReviews
            : 0;

        // Return listing with seller rating info
        const { reviewsReceived, ...sellerData } = listing.seller;
        return NextResponse.json({
            ...listing,
            seller: {
                ...sellerData,
                rating: Math.round(averageRating * 10) / 10,
                totalReviews,
            },
        });
    } catch (error) {
        console.error("Error fetching listing:", error);
        return NextResponse.json(
            { error: "Failed to fetch listing" },
            { status: 500 }
        );
    }
}

// DELETE a listing (already exists, adding GET)
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        const { id } = await params;

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const listing = await prisma.listing.findUnique({
            where: { id },
        });

        if (!listing) {
            return NextResponse.json(
                { error: "Listing not found" },
                { status: 404 }
            );
        }

        if (listing.sellerId !== session.user.id) {
            return NextResponse.json(
                { error: "Forbidden" },
                { status: 403 }
            );
        }

        await prisma.listing.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting listing:", error);
        return NextResponse.json(
            { error: "Failed to delete listing" },
            { status: 500 }
        );
    }
}

// PATCH update a listing
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        const { id } = await params;

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const listing = await prisma.listing.findUnique({
            where: { id },
        });

        if (!listing) {
            return NextResponse.json(
                { error: "Listing not found" },
                { status: 404 }
            );
        }

        if (listing.sellerId !== session.user.id) {
            return NextResponse.json(
                { error: "Forbidden" },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { title, description, price, type, game, imageUrl } = body;

        // Handle price reduction - store original price
        let updateData: Record<string, unknown> = {};

        if (title) updateData.title = title;
        if (description) updateData.description = description;
        if (type) updateData.type = type;
        if (game) updateData.game = game;
        if (imageUrl !== undefined) updateData.imageUrl = imageUrl || null;

        if (price !== undefined) {
            const newPrice = parseFloat(price);
            const currentPrice = listing.price;

            // If price is being reduced
            if (newPrice < currentPrice) {
                // Store the original price if not already set, otherwise keep the highest
                const originalPrice = listing.originalPrice || currentPrice;
                updateData.originalPrice = Math.max(originalPrice, currentPrice);
            }
            updateData.price = newPrice;
        }

        const updated = await prisma.listing.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Error updating listing:", error);
        return NextResponse.json(
            { error: "Failed to update listing" },
            { status: 500 }
        );
    }
}

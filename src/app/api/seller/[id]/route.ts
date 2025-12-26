import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET seller public profile with listings and reviews
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Fetch seller with their listings and reviews received
        const seller = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                image: true,
                isSeller: true,
                createdAt: true,
                // Get seller's active listings
                listings: {
                    orderBy: { createdAt: "desc" },
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        price: true,
                        originalPrice: true,
                        type: true,
                        game: true,
                        imageUrl: true,
                        createdAt: true,
                    },
                },
                // Get reviews received as a seller
                reviewsReceived: {
                    orderBy: { createdAt: "desc" },
                    select: {
                        id: true,
                        rating: true,
                        comment: true,
                        createdAt: true,
                        reviewer: {
                            select: {
                                id: true,
                                name: true,
                                image: true,
                            },
                        },
                        listing: {
                            select: {
                                id: true,
                                title: true,
                            },
                        },
                    },
                },
                // Count completed orders (sales)
                _count: {
                    select: {
                        listings: true,
                    },
                },
            },
        });

        if (!seller) {
            return NextResponse.json(
                { error: "Seller not found" },
                { status: 404 }
            );
        }

        // Calculate average rating
        const reviews = seller.reviewsReceived;
        const totalReviews = reviews.length;
        const averageRating = totalReviews > 0
            ? reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / totalReviews
            : 0;

        // Count total sales (completed orders for seller's listings)
        const totalSales = await prisma.order.count({
            where: {
                listing: {
                    sellerId: id,
                },
                status: "COMPLETED",
            },
        });

        return NextResponse.json({
            ...seller,
            stats: {
                totalListings: seller._count.listings,
                totalReviews,
                averageRating: Math.round(averageRating * 10) / 10,
                totalSales,
            },
        });
    } catch (error) {
        console.error("Error fetching seller profile:", error);
        return NextResponse.json(
            { error: "Failed to fetch seller profile" },
            { status: 500 }
        );
    }
}

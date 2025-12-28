import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET public user profile
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                image: true,
                bio: true,
                isSeller: true,
                role: true,
                createdAt: true,
                _count: {
                    select: {
                        listings: true,
                    },
                },
                listings: {
                    where: { isBanned: false },
                    take: 6,
                    orderBy: { createdAt: "desc" },
                    select: {
                        id: true,
                        title: true,
                        price: true,
                        imageUrl: true,
                        game: true,
                    },
                },
            },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Get purchase count and total spent
        const purchaseStats = await prisma.order.aggregate({
            where: {
                buyerId: id,
                status: "COMPLETED",
            },
            _count: true,
        });

        const totalSpent = await prisma.order.findMany({
            where: {
                buyerId: id,
                status: "COMPLETED",
            },
            include: {
                listing: {
                    select: { price: true },
                },
            },
        });

        const spentAmount = totalSpent.reduce((sum, order) => sum + order.listing.price, 0);

        // Get completed sales count
        const salesCount = await prisma.order.count({
            where: {
                listing: { sellerId: id },
                status: "COMPLETED",
            },
        });

        return NextResponse.json({
            id: user.id,
            name: user.name,
            image: user.image,
            bio: user.bio,
            isSeller: user.isSeller,
            isAdmin: user.role === "ADMIN" || user.role === "SUPER_ADMIN",
            role: user.role,
            createdAt: user.createdAt,
            stats: {
                listings: user._count.listings,
                purchases: purchaseStats._count,
                completedSales: salesCount,
                totalSpent: spentAmount,
            },
            recentListings: user.listings,
        });
    } catch (error) {
        console.error("Error fetching user profile:", error);
        return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
    }
}



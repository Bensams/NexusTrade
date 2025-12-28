import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET search listings and users
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get("query") || "";
        const game = searchParams.get("game");
        const type = searchParams.get("type");
        const searchType = searchParams.get("searchType") || "all"; // "all", "listings", "users"
        const limit = parseInt(searchParams.get("limit") || "20");

        const results: { listings?: unknown[]; users?: unknown[] } = {};

        // Search listings
        if (searchType === "all" || searchType === "listings") {
            const listingWhere: Record<string, unknown> = {
                isBanned: false, // Hide banned listings from search results
            };

            if (query) {
                listingWhere.OR = [
                    { title: { contains: query, mode: "insensitive" } },
                    { description: { contains: query, mode: "insensitive" } },
                    { game: { contains: query, mode: "insensitive" } },
                ];
            }

            if (game) {
                listingWhere.game = game;
            }

            if (type && (type === "ITEM" || type === "SERVICE")) {
                listingWhere.type = type;
            }

            const listings = await prisma.listing.findMany({
                where: listingWhere,
                orderBy: { createdAt: "desc" },
                take: limit,
                include: {
                    seller: {
                        select: {
                            id: true,
                            name: true,
                            image: true,
                        },
                    },
                },
            });

            results.listings = listings;
        }

        // Search users
        if (query && (searchType === "all" || searchType === "users")) {
            const users = await prisma.user.findMany({
                where: {
                    OR: [
                        { name: { contains: query, mode: "insensitive" } },
                        { email: { contains: query, mode: "insensitive" } },
                    ],
                },
                take: Math.min(limit, 10),
                select: {
                    id: true,
                    name: true,
                    image: true,
                    isSeller: true,
                    role: true,
                    _count: {
                        select: {
                            listings: true,
                        },
                    },
                },
            });

            results.users = users.map((user) => ({
                id: user.id,
                name: user.name,
                image: user.image,
                isSeller: user.isSeller,
                isAdmin: user.role === "ADMIN" || user.role === "SUPER_ADMIN",
                listingCount: user._count.listings,
            }));
        }

        // For backwards compatibility, return listings array if searchType is listings
        if (searchType === "listings") {
            return NextResponse.json(results.listings || []);
        }

        return NextResponse.json(results);
    } catch (error) {
        console.error("Error searching:", error);
        return NextResponse.json(
            { error: "Failed to search" },
            { status: 500 }
        );
    }
}



import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET search listings
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get("query") || "";
        const game = searchParams.get("game");
        const type = searchParams.get("type");
        const limit = parseInt(searchParams.get("limit") || "20");

        // Build the where clause for PostgreSQL with Prisma's contains (case-insensitive)
        const where: Record<string, unknown> = {};

        if (query) {
            where.OR = [
                { title: { contains: query, mode: "insensitive" } },
                { description: { contains: query, mode: "insensitive" } },
                { game: { contains: query, mode: "insensitive" } },
            ];
        }

        if (game) {
            where.game = game;
        }

        if (type && (type === "ITEM" || type === "SERVICE")) {
            where.type = type;
        }

        const listings = await prisma.listing.findMany({
            where,
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

        return NextResponse.json(listings);
    } catch (error) {
        console.error("Error searching listings:", error);
        return NextResponse.json(
            { error: "Failed to search listings" },
            { status: 500 }
        );
    }
}

import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET - Public endpoint to list active games (for Create Listing dropdown)
export async function GET() {
    try {
        const games = await prisma.game.findMany({
            where: { isActive: true },
            orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
            select: {
                id: true,
                name: true,
                slug: true,
                imageUrl: true,
            },
        });

        return NextResponse.json(games);
    } catch (error) {
        console.error("Error fetching games:", error);
        return NextResponse.json({ error: "Failed to fetch games" }, { status: 500 });
    }
}

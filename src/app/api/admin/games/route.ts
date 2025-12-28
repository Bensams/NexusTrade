import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireRole } from "@/lib/roleAuth";

// Helper to create URL-friendly slug
function createSlug(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

// GET - List all games (with optional active filter)
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const activeOnly = searchParams.get("active") === "true";

        const games = await prisma.game.findMany({
            where: activeOnly ? { isActive: true } : undefined,
            orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        });

        return NextResponse.json(games);
    } catch (error) {
        console.error("Error fetching games:", error);
        return NextResponse.json({ error: "Failed to fetch games" }, { status: 500 });
    }
}

// POST - Create new game (admin only)
export async function POST(request: Request) {
    try {
        const result = await requireRole("ADMIN");
        if ("error" in result) return result.error;

        const body = await request.json();
        const { name, imageUrl, sortOrder } = body;

        if (!name || typeof name !== "string" || name.trim().length === 0) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        const slug = createSlug(name.trim());

        // Check for duplicate
        const existing = await prisma.game.findFirst({
            where: { OR: [{ name: name.trim() }, { slug }] },
        });

        if (existing) {
            return NextResponse.json({ error: "Game already exists" }, { status: 400 });
        }

        const game = await prisma.game.create({
            data: {
                name: name.trim(),
                slug,
                imageUrl: imageUrl || null,
                sortOrder: sortOrder ?? 0,
                isActive: true,
            },
        });

        return NextResponse.json(game, { status: 201 });
    } catch (error) {
        console.error("Error creating game:", error);
        return NextResponse.json({ error: "Failed to create game" }, { status: 500 });
    }
}

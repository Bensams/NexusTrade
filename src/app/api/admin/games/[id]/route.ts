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

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET - Get single game
export async function GET(request: Request, { params }: RouteParams) {
    try {
        const { id } = await params;

        const game = await prisma.game.findUnique({ where: { id } });

        if (!game) {
            return NextResponse.json({ error: "Game not found" }, { status: 404 });
        }

        return NextResponse.json(game);
    } catch (error) {
        console.error("Error fetching game:", error);
        return NextResponse.json({ error: "Failed to fetch game" }, { status: 500 });
    }
}

// PATCH - Update game
export async function PATCH(request: Request, { params }: RouteParams) {
    try {
        const result = await requireRole("ADMIN");
        if ("error" in result) return result.error;

        const { id } = await params;
        const body = await request.json();
        const { name, imageUrl, sortOrder, isActive } = body;

        const existing = await prisma.game.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json({ error: "Game not found" }, { status: 404 });
        }

        // If name is being changed, update slug and check for duplicates
        let slug = existing.slug;
        if (name && name !== existing.name) {
            slug = createSlug(name.trim());
            const duplicate = await prisma.game.findFirst({
                where: {
                    OR: [{ name: name.trim() }, { slug }],
                    NOT: { id },
                },
            });
            if (duplicate) {
                return NextResponse.json({ error: "Game name already exists" }, { status: 400 });
            }
        }

        const game = await prisma.game.update({
            where: { id },
            data: {
                ...(name && { name: name.trim(), slug }),
                ...(imageUrl !== undefined && { imageUrl }),
                ...(sortOrder !== undefined && { sortOrder }),
                ...(isActive !== undefined && { isActive }),
            },
        });

        return NextResponse.json(game);
    } catch (error) {
        console.error("Error updating game:", error);
        return NextResponse.json({ error: "Failed to update game" }, { status: 500 });
    }
}

// DELETE - Soft delete (set isActive = false)
export async function DELETE(request: Request, { params }: RouteParams) {
    try {
        const result = await requireRole("ADMIN");
        if ("error" in result) return result.error;

        const { id } = await params;

        const game = await prisma.game.update({
            where: { id },
            data: { isActive: false },
        });

        return NextResponse.json(game);
    } catch (error) {
        console.error("Error deleting game:", error);
        return NextResponse.json({ error: "Failed to delete game" }, { status: 500 });
    }
}


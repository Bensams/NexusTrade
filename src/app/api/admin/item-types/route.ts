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

// GET - List all item types (with optional active filter)
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const activeOnly = searchParams.get("active") === "true";

        const itemTypes = await prisma.itemType.findMany({
            where: activeOnly ? { isActive: true } : undefined,
            orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        });

        return NextResponse.json(itemTypes);
    } catch (error) {
        console.error("Error fetching item types:", error);
        return NextResponse.json({ error: "Failed to fetch item types" }, { status: 500 });
    }
}

// POST - Create new item type (admin only)
export async function POST(request: Request) {
    try {
        const result = await requireRole("ADMIN");
        if ("error" in result) return result.error;

        const body = await request.json();
        const { name, sortOrder } = body;

        if (!name || typeof name !== "string" || name.trim().length === 0) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        const slug = createSlug(name.trim());

        // Check for duplicate
        const existing = await prisma.itemType.findFirst({
            where: { OR: [{ name: name.trim() }, { slug }] },
        });

        if (existing) {
            return NextResponse.json({ error: "Item type already exists" }, { status: 400 });
        }

        const itemType = await prisma.itemType.create({
            data: {
                name: name.trim(),
                slug,
                sortOrder: sortOrder ?? 0,
                isActive: true,
            },
        });

        return NextResponse.json(itemType, { status: 201 });
    } catch (error) {
        console.error("Error creating item type:", error);
        return NextResponse.json({ error: "Failed to create item type" }, { status: 500 });
    }
}

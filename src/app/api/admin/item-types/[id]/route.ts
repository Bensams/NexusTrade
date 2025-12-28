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

// GET - Get single item type
export async function GET(request: Request, { params }: RouteParams) {
    try {
        const { id } = await params;

        const itemType = await prisma.itemType.findUnique({ where: { id } });

        if (!itemType) {
            return NextResponse.json({ error: "Item type not found" }, { status: 404 });
        }

        return NextResponse.json(itemType);
    } catch (error) {
        console.error("Error fetching item type:", error);
        return NextResponse.json({ error: "Failed to fetch item type" }, { status: 500 });
    }
}

// PATCH - Update item type
export async function PATCH(request: Request, { params }: RouteParams) {
    try {
        const result = await requireRole("ADMIN");
        if ("error" in result) return result.error;

        const { id } = await params;
        const body = await request.json();
        const { name, sortOrder, isActive } = body;

        const existing = await prisma.itemType.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json({ error: "Item type not found" }, { status: 404 });
        }

        // If name is being changed, update slug and check for duplicates
        let slug = existing.slug;
        if (name && name !== existing.name) {
            slug = createSlug(name.trim());
            const duplicate = await prisma.itemType.findFirst({
                where: {
                    OR: [{ name: name.trim() }, { slug }],
                    NOT: { id },
                },
            });
            if (duplicate) {
                return NextResponse.json({ error: "Item type name already exists" }, { status: 400 });
            }
        }

        const itemType = await prisma.itemType.update({
            where: { id },
            data: {
                ...(name && { name: name.trim(), slug }),
                ...(sortOrder !== undefined && { sortOrder }),
                ...(isActive !== undefined && { isActive }),
            },
        });

        return NextResponse.json(itemType);
    } catch (error) {
        console.error("Error updating item type:", error);
        return NextResponse.json({ error: "Failed to update item type" }, { status: 500 });
    }
}

// DELETE - Soft delete (set isActive = false)
export async function DELETE(request: Request, { params }: RouteParams) {
    try {
        const result = await requireRole("ADMIN");
        if ("error" in result) return result.error;

        const { id } = await params;

        const itemType = await prisma.itemType.update({
            where: { id },
            data: { isActive: false },
        });

        return NextResponse.json(itemType);
    } catch (error) {
        console.error("Error deleting item type:", error);
        return NextResponse.json({ error: "Failed to delete item type" }, { status: 500 });
    }
}


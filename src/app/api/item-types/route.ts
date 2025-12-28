import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET - Public endpoint to list active item types (for Create/Edit Listing dropdown)
export async function GET() {
    try {
        const itemTypes = await prisma.itemType.findMany({
            where: { isActive: true },
            orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
            select: {
                id: true,
                name: true,
                slug: true,
            },
        });

        return NextResponse.json(itemTypes);
    } catch (error) {
        console.error("Error fetching item types:", error);
        return NextResponse.json({ error: "Failed to fetch item types" }, { status: 500 });
    }
}

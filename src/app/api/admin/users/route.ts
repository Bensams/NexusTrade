import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireRole } from "@/lib/roleAuth";

/**
 * GET /api/admin/users
 * Fetch all users with their ban status and counts
 * Requires MODERATOR+ role
 */
export async function GET() {
    try {
        const result = await requireRole("MODERATOR");
        if ("error" in result) return result.error;

        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                role: true,
                isSeller: true,
                isSupportAgent: true,
                bannedUntil: true,
                createdAt: true,
                _count: {
                    select: {
                        listings: true,
                        orders: true,
                    },
                },
            },
            orderBy: [
                { role: "asc" }, // SUPER_ADMIN first (alphabetically)
                { createdAt: "desc" },
            ],
        });

        return NextResponse.json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json(
            { error: "Failed to fetch users" },
            { status: 500 }
        );
    }
}

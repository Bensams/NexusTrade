import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireRole, hasMinimumRole, Role } from "@/lib/roleAuth";

// PATCH - Toggle support agent status for a user
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const result = await requireRole("SUPER_ADMIN");
        if ("error" in result) return result.error;

        const { id: targetUserId } = await params;

        // Get target user
        const targetUser = await prisma.user.findUnique({
            where: { id: targetUserId },
            select: { id: true, role: true, isSupportAgent: true },
        });

        if (!targetUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Only ADMIN/MODERATOR/SUPER_ADMIN can be support agents
        if (!hasMinimumRole(targetUser.role as Role, "MODERATOR")) {
            return NextResponse.json(
                { error: "Only MODERATOR or higher can be support agents" },
                { status: 400 }
            );
        }

        // Toggle the support agent status
        const updatedUser = await prisma.user.update({
            where: { id: targetUserId },
            data: { isSupportAgent: !targetUser.isSupportAgent },
            select: {
                id: true,
                name: true,
                role: true,
                isSupportAgent: true,
            },
        });

        return NextResponse.json({
            message: updatedUser.isSupportAgent
                ? "User assigned as support agent"
                : "User removed from support agents",
            user: updatedUser,
        });
    } catch (error) {
        console.error("Error toggling support agent:", error);
        return NextResponse.json(
            { error: "Failed to update support agent status" },
            { status: 500 }
        );
    }
}

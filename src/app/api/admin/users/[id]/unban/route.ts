import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { removeBlacklistedIdentifiers } from "@/lib/banCheck";
import { logActivity } from "@/lib/auditLog";
import { requireRole } from "@/lib/roleAuth";

/**
 * POST /api/admin/users/[id]/unban
 * Remove a ban from a user and clear their blacklisted identifiers.
 */
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const result = await requireRole("MODERATOR");
        if ("error" in result) return result.error;

        const { id: userId } = await params;

        // Get the user to unban
        const targetUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, bannedUntil: true },
        });

        if (!targetUser) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        // Check if user is actually banned
        const isBanned = targetUser.bannedUntil && targetUser.bannedUntil > new Date();
        if (!isBanned) {
            return NextResponse.json(
                { error: "User is not currently banned" },
                { status: 400 }
            );
        }

        // Remove the ban
        await prisma.user.update({
            where: { id: userId },
            data: { bannedUntil: null },
        });

        // Remove blacklisted identifiers
        await removeBlacklistedIdentifiers(userId);

        // Log the admin action
        logActivity({
            userId: result.user.id,
            actionType: "ADMIN_ACTION",
            resourceId: userId,
            resourceType: "user_unban",
            metadata: {
                action: "unban_user",
                targetUser: targetUser.email,
            },
        });

        return NextResponse.json({
            success: true,
            message: `User ${targetUser.email} has been unbanned`,
        });
    } catch (error) {
        console.error("Error unbanning user:", error);
        return NextResponse.json(
            { error: "Failed to unban user" },
            { status: 500 }
        );
    }
}

/**
 * User Deletion API
 * 
 * Delete a user account with strict role hierarchy rules.
 * Only SUPER_ADMIN can delete admin accounts.
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireRole, canDeleteUser, Role } from "@/lib/roleAuth";

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * DELETE /api/admin/users/[id]/delete
 * Permanently delete a user account
 * 
 * Rules:
 * - Only SUPER_ADMIN can delete ADMIN or SUPER_ADMIN accounts
 * - ADMIN can delete MODERATOR and USER accounts
 * - MODERATOR can delete USER accounts only
 * - Cannot delete yourself
 */
export async function DELETE(request: Request, { params }: RouteParams) {
    try {
        const { id: targetUserId } = await params;
        const result = await requireRole("MODERATOR");
        if ("error" in result) return result.error;

        const { user: actor } = result;

        // Cannot delete yourself
        if (actor.id === targetUserId) {
            return NextResponse.json(
                { error: "Cannot delete your own account" },
                { status: 400 }
            );
        }

        // Get target user
        const targetUser = await prisma.user.findUnique({
            where: { id: targetUserId },
            select: { id: true, email: true, name: true, role: true },
        });

        if (!targetUser) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        const targetRole = targetUser.role as Role;

        // Check if actor can delete this user
        if (!canDeleteUser(actor.role, targetRole)) {
            // Provide specific error message
            if (targetRole === "ADMIN" || targetRole === "SUPER_ADMIN") {
                return NextResponse.json(
                    { error: "Only SUPER_ADMIN can delete admin accounts" },
                    { status: 403 }
                );
            }
            return NextResponse.json(
                { error: "Cannot delete a user with equal or higher rank" },
                { status: 403 }
            );
        }

        // Delete the user (cascades to related data via Prisma schema)
        await prisma.user.delete({
            where: { id: targetUserId },
        });

        return NextResponse.json({
            message: `User ${targetUser.email} has been deleted`,
            deletedUser: {
                id: targetUser.id,
                email: targetUser.email,
                name: targetUser.name,
            },
        });
    } catch (error) {
        console.error("Error deleting user:", error);
        return NextResponse.json(
            { error: "Failed to delete user" },
            { status: 500 }
        );
    }
}

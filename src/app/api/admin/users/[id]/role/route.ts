/**
 * User Role Management API
 * 
 * Endpoints for managing user roles (assign, demote) and deleting users.
 * Follows strict RBAC hierarchy rules.
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import {
    requireRole,
    canManageUser,
    canDeleteUser,
    canAssignRole,
    Role,
    ROLE_HIERARCHY,
} from "@/lib/roleAuth";

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * PATCH /api/admin/users/[id]/role
 * Assign or change a user's role
 * 
 * Rules:
 * - Only SUPER_ADMIN can assign ADMIN role
 * - Can only assign roles lower than your own
 * - Cannot change role of users with equal or higher rank
 */
export async function PATCH(request: Request, { params }: RouteParams) {
    try {
        const { id: targetUserId } = await params;
        const result = await requireRole("ADMIN");
        if ("error" in result) return result.error;

        const { user: actor } = result;
        const body = await request.json();
        const { role: newRole } = body;

        // Validate the role
        if (!newRole || !ROLE_HIERARCHY[newRole as Role]) {
            return NextResponse.json(
                { error: "Invalid role. Must be one of: SUPER_ADMIN, ADMIN, MODERATOR, USER" },
                { status: 400 }
            );
        }

        // Get target user
        const targetUser = await prisma.user.findUnique({
            where: { id: targetUserId },
            select: { id: true, email: true, role: true },
        });

        if (!targetUser) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        const targetRole = targetUser.role as Role;

        // Check if actor can manage this user
        if (!canManageUser(actor.role, targetRole)) {
            return NextResponse.json(
                { error: "Cannot modify role of a user with equal or higher rank" },
                { status: 403 }
            );
        }

        // Check if actor can assign the new role
        if (!canAssignRole(actor.role, newRole as Role)) {
            return NextResponse.json(
                { error: `Cannot assign ${newRole} role. You can only assign roles lower than your own.` },
                { status: 403 }
            );
        }

        // Update the role
        const updatedUser = await prisma.user.update({
            where: { id: targetUserId },
            data: { role: newRole },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
            },
        });

        return NextResponse.json({
            message: `User role updated to ${newRole}`,
            user: updatedUser,
        });
    } catch (error) {
        console.error("Error updating user role:", error);
        return NextResponse.json(
            { error: "Failed to update user role" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/admin/users/[id]/role
 * Demote a user to USER role (safer alternative to deleting)
 * 
 * Rules:
 * - Only SUPER_ADMIN can demote ADMIN
 * - Can only demote users of lower rank
 */
export async function DELETE(request: Request, { params }: RouteParams) {
    try {
        const { id: targetUserId } = await params;
        const result = await requireRole("ADMIN");
        if ("error" in result) return result.error;

        const { user: actor } = result;

        // Get target user
        const targetUser = await prisma.user.findUnique({
            where: { id: targetUserId },
            select: { id: true, email: true, role: true },
        });

        if (!targetUser) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        const targetRole = targetUser.role as Role;

        // Check if user is already a regular user
        if (targetRole === "USER") {
            return NextResponse.json(
                { error: "User already has USER role" },
                { status: 400 }
            );
        }

        // Check if actor can manage this user
        if (!canManageUser(actor.role, targetRole)) {
            return NextResponse.json(
                { error: "Cannot demote a user with equal or higher rank" },
                { status: 403 }
            );
        }

        // Demote to USER
        const updatedUser = await prisma.user.update({
            where: { id: targetUserId },
            data: { role: "USER" },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
            },
        });

        return NextResponse.json({
            message: "User demoted to USER role",
            user: updatedUser,
        });
    } catch (error) {
        console.error("Error demoting user:", error);
        return NextResponse.json(
            { error: "Failed to demote user" },
            { status: 500 }
        );
    }
}

/**
 * Role-Based Access Control (RBAC) Helper
 * 
 * Provides utilities for checking user roles and permissions
 * with a hierarchical role system.
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

// Role type matching Prisma enum
export type Role = "SUPER_ADMIN" | "ADMIN" | "MODERATOR" | "USER";

// Role hierarchy - higher number = more permissions
export const ROLE_HIERARCHY: Record<Role, number> = {
    SUPER_ADMIN: 4,
    ADMIN: 3,
    MODERATOR: 2,
    USER: 1,
};

/**
 * Check if a role has at least the minimum required permission level
 */
export function hasMinimumRole(userRole: Role, minimumRole: Role): boolean {
    return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minimumRole];
}

/**
 * Check if an actor can manage a target user (for role assignment, deletion, etc.)
 * Rules:
 * - SUPER_ADMIN can manage anyone
 * - ADMIN can manage MODERATOR and USER
 * - MODERATOR can manage USER only
 * - Cannot manage users of equal or higher rank
 */
export function canManageUser(actorRole: Role, targetRole: Role): boolean {
    // Can only manage users of lower rank
    return ROLE_HIERARCHY[actorRole] > ROLE_HIERARCHY[targetRole];
}

/**
 * Check if an actor can delete a target user account
 * Stricter than canManageUser - only SUPER_ADMIN can delete admin accounts
 */
export function canDeleteUser(actorRole: Role, targetRole: Role): boolean {
    // Only SUPER_ADMIN can delete ADMIN or SUPER_ADMIN accounts
    if (targetRole === "ADMIN" || targetRole === "SUPER_ADMIN") {
        return actorRole === "SUPER_ADMIN";
    }
    // For MODERATOR and USER, use standard hierarchy
    return canManageUser(actorRole, targetRole);
}

/**
 * Check if an actor can demote a target user
 * Same rules as canManageUser
 */
export function canDemoteUser(actorRole: Role, targetRole: Role): boolean {
    return canManageUser(actorRole, targetRole);
}

/**
 * Check if an actor can assign a specific role to a target
 * Can only assign roles lower than your own
 */
export function canAssignRole(actorRole: Role, roleToAssign: Role): boolean {
    return ROLE_HIERARCHY[actorRole] > ROLE_HIERARCHY[roleToAssign];
}

/**
 * Get the user's role from the database
 */
export async function getUserRole(userId: string): Promise<Role | null> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
    });
    return user?.role as Role | null;
}

/**
 * Check if user is an admin (ADMIN or SUPER_ADMIN)
 * Backward compatibility helper for code migration
 */
export function isAdminRole(role: Role): boolean {
    return role === "ADMIN" || role === "SUPER_ADMIN";
}

/**
 * Check if user has admin access (ADMIN+)
 * Use this for admin-only routes like settings management
 */
export function hasAdminAccess(role: Role): boolean {
    return hasMinimumRole(role, "ADMIN");
}

/**
 * Check if user has moderator access (MODERATOR+)
 * Use this for moderation routes like banning users or reviewing listings
 */
export function hasModeratorAccess(role: Role): boolean {
    return hasMinimumRole(role, "MODERATOR");
}

interface AuthResult {
    user: {
        id: string;
        name: string | null;
        role: Role;
    };
}

interface AuthError {
    error: NextResponse;
}

/**
 * Require a minimum role for an API route
 * Returns the authenticated user or an error response
 * 
 * @param minimumRole - The minimum role required to access the route
 * @returns User object if authorized, or error Response if not
 * 
 * @example
 * const result = await requireRole("ADMIN");
 * if ("error" in result) return result.error;
 * const { user } = result;
 */
export async function requireRole(minimumRole: Role): Promise<AuthResult | AuthError> {
    const session = await auth();

    if (!session?.user?.id) {
        return {
            error: NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            ),
        };
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, name: true, role: true },
    });

    if (!user) {
        return {
            error: NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            ),
        };
    }

    const userRole = user.role as Role;

    if (!hasMinimumRole(userRole, minimumRole)) {
        return {
            error: NextResponse.json(
                { error: `Forbidden: ${minimumRole} access required` },
                { status: 403 }
            ),
        };
    }

    return {
        user: {
            id: user.id,
            name: user.name,
            role: userRole,
        },
    };
}

/**
 * Helper to check auth and get user without role requirement
 * For routes that just need authentication
 */
export async function requireAuth(): Promise<AuthResult | AuthError> {
    return requireRole("USER");
}

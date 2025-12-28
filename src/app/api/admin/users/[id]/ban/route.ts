import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import {
    calculateBanExpiration,
    recordBannedIdentifiers,
    getUserLastKnownIP,
} from "@/lib/banCheck";
import { logActivity } from "@/lib/auditLog";
import { requireRole, canManageUser, Role } from "@/lib/roleAuth";

interface BanRequestBody {
    duration: number | "permanent";
    reason?: string;
}

/**
 * POST /api/admin/users/[id]/ban
 * Ban a user for a specified duration or permanently.
 * Also records their IP and user-agent in the blacklist.
 * Requires MODERATOR+ role
 */
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: userId } = await params;

        // Check moderator+ authorization
        const result = await requireRole("MODERATOR");
        if ("error" in result) return result.error;

        const { user: actor } = result;

        // Get the user to ban
        const targetUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, role: true },
        });

        if (!targetUser) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        const targetRole = targetUser.role as Role;

        // Check if actor can manage this user (based on role hierarchy)
        if (!canManageUser(actor.role, targetRole)) {
            return NextResponse.json(
                { error: "Cannot ban a user with equal or higher rank" },
                { status: 403 }
            );
        }

        // Parse request body
        const body: BanRequestBody = await request.json();
        const { duration, reason } = body;

        if (!duration && duration !== 0) {
            return NextResponse.json(
                { error: "Duration is required (hours or 'permanent')" },
                { status: 400 }
            );
        }

        // Calculate ban expiration
        const bannedUntil = calculateBanExpiration(duration);
        const isPermanent = duration === "permanent";

        // Update user with ban
        await prisma.user.update({
            where: { id: userId },
            data: { bannedUntil },
        });

        // Get user's last known IP from audit logs
        const lastKnownIP = await getUserLastKnownIP(userId);

        // Get the user's last known user-agent from audit logs
        const lastAuditLog = await prisma.auditLog.findFirst({
            where: {
                userId,
                userAgent: { not: null },
            },
            orderBy: { createdAt: "desc" },
            select: { userAgent: true },
        });

        // Record identifiers in blacklist
        await recordBannedIdentifiers({
            userId,
            ip: lastKnownIP,
            userAgent: lastAuditLog?.userAgent,
            reason: reason || `Banned by admin ${actor.id}`,
            expiresAt: isPermanent ? null : bannedUntil,
        });

        // Log the admin action
        logActivity({
            userId: actor.id,
            actionType: "ADMIN_ACTION",
            resourceId: userId,
            resourceType: "user_ban",
            metadata: {
                action: "ban_user",
                targetUser: targetUser.email,
                duration: isPermanent ? "permanent" : `${duration} hours`,
                reason,
                bannedIP: lastKnownIP,
            },
        });

        return NextResponse.json({
            success: true,
            bannedUntil: bannedUntil.toISOString(),
            isPermanent,
            blacklistedIP: lastKnownIP,
        });
    } catch (error) {
        console.error("Error banning user:", error);
        return NextResponse.json(
            { error: "Failed to ban user" },
            { status: 500 }
        );
    }
}

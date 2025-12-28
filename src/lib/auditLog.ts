import prisma from "@/lib/db";
import { ActionType } from "@prisma/client";

interface LogActivityParams {
    userId: string;
    actionType: ActionType;
    resourceId?: string;
    resourceType?: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
}

/**
 * Logs user activity to the audit_logs table.
 * Fire-and-forget: Does not block the main request flow.
 * 
 * @example
 * // Log a user login
 * logActivity({
 *   userId: user.id,
 *   actionType: "USER_LOGIN",
 *   ipAddress: getClientIP(request),
 *   userAgent: request.headers.get("user-agent") || undefined,
 * });
 * 
 * // Log order creation
 * logActivity({
 *   userId: session.user.id,
 *   actionType: "ORDER_CREATED",
 *   resourceId: order.id,
 *   resourceType: "order",
 *   metadata: { listingTitle: listing.title, price: listing.price },
 * });
 */
export function logActivity(params: LogActivityParams): void {
    // Fire-and-forget: don't block the main request
    prisma.auditLog.create({
        data: {
            userId: params.userId,
            actionType: params.actionType,
            resourceId: params.resourceId || null,
            resourceType: params.resourceType || null,
            metadata: params.metadata ? JSON.stringify(params.metadata) : null,
            ipAddress: params.ipAddress || null,
            userAgent: params.userAgent || null,
        },
    }).catch((error) => {
        console.error("Failed to log activity:", error);
    });
}

/**
 * Extracts the client IP address from Next.js request headers.
 * Handles common proxy headers (x-forwarded-for, x-real-ip).
 */
export function getClientIP(request: Request): string | null {
    // Check x-forwarded-for first (most common in production)
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) {
        return forwarded.split(",")[0].trim();
    }

    // Fallback to x-real-ip
    const realIP = request.headers.get("x-real-ip");
    return realIP || null;
}

/**
 * Helper to extract user agent from request
 */
export function getUserAgent(request: Request): string | null {
    return request.headers.get("user-agent");
}

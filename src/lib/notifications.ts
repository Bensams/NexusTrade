import prisma from "@/lib/db";
import { NotificationType } from "@prisma/client";

interface CreateNotificationParams {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    orderId?: string;
    listingId?: string;
    cashInRequestId?: string;
}

/**
 * Creates a notification for a user and returns the created notification.
 * Uses Prisma's built-in RETURNING behavior via the create method.
 */
export async function createNotification({
    userId,
    type,
    title,
    message,
    orderId,
    listingId,
    cashInRequestId,
}: CreateNotificationParams) {
    const notification = await prisma.notification.create({
        data: {
            userId,
            type,
            title,
            message,
            orderId: orderId || null,
            listingId: listingId || null,
            cashInRequestId: cashInRequestId || null
        },
    });

    return notification;
}

/**
 * Create notifications for all admin users
 */
export async function createAdminNotification({
    type,
    title,
    message,
    orderId,
    listingId,
    cashInRequestId,
}: Omit<CreateNotificationParams, "userId">) {
    const admins = await prisma.user.findMany({
        where: { isAdmin: true },
        select: { id: true },
    });

    const notifications = await Promise.all(
        admins.map((admin) =>
            createNotification({
                userId: admin.id,
                type,
                title,
                message,
                orderId,
                listingId,
                cashInRequestId,
            })
        )
    );

    return notifications;
}

/**
 * Mark notifications as read
 */
export async function markNotificationsRead(notificationIds: string[], userId: string) {
    await prisma.notification.updateMany({
        where: {
            id: { in: notificationIds },
            userId, // Ensure user owns these notifications
        },
        data: {
            isRead: true,
        },
    });
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadCount(userId: string) {
    return prisma.notification.count({
        where: {
            userId,
            isRead: false,
        },
    });
}

import prisma from "@/lib/db";

/**
 * Check if an IP address is blacklisted (belongs to a banned user)
 * @param ip - The IP address to check
 * @returns Object with banned status and optional message
 */
export async function isIPBlacklisted(ip: string): Promise<{
    banned: boolean;
    message?: string;
    expiresAt?: Date | null;
}> {
    if (!ip) {
        return { banned: false };
    }

    const blacklistedEntry = await prisma.blacklistedIdentifier.findFirst({
        where: {
            type: "IP",
            value: ip,
            OR: [
                { expiresAt: null }, // Permanent ban
                { expiresAt: { gt: new Date() } }, // Temporary ban still active
            ],
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    if (blacklistedEntry) {
        return {
            banned: true,
            message: "This IP address has been banned due to policy violations.",
            expiresAt: blacklistedEntry.expiresAt,
        };
    }

    return { banned: false };
}

/**
 * Check if a user is currently banned
 * @param userId - The user ID to check
 * @returns Object with banned status and expiry time
 */
export async function isUserBanned(userId: string): Promise<{
    banned: boolean;
    bannedUntil?: Date | null;
    message?: string;
}> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { bannedUntil: true },
    });

    if (!user) {
        return { banned: false };
    }

    // Check if bannedUntil is set and is in the future
    if (user.bannedUntil && user.bannedUntil > new Date()) {
        const isPermanent = user.bannedUntil.getFullYear() >= 9999;
        return {
            banned: true,
            bannedUntil: user.bannedUntil,
            message: isPermanent
                ? "Your account has been permanently banned."
                : `Your account is banned until ${user.bannedUntil.toLocaleString()}.`,
        };
    }

    return { banned: false };
}

/**
 * Check if a user is banned by their email (for login attempts)
 * @param email - The email to check
 * @returns Ban status information
 */
export async function isEmailBanned(email: string): Promise<{
    banned: boolean;
    bannedUntil?: Date | null;
    message?: string;
}> {
    const user = await prisma.user.findUnique({
        where: { email },
        select: { bannedUntil: true },
    });

    if (!user) {
        return { banned: false };
    }

    if (user.bannedUntil && user.bannedUntil > new Date()) {
        const isPermanent = user.bannedUntil.getFullYear() >= 9999;
        return {
            banned: true,
            bannedUntil: user.bannedUntil,
            message: isPermanent
                ? "This account has been permanently banned."
                : `This account is banned until ${user.bannedUntil.toLocaleString()}.`,
        };
    }

    return { banned: false };
}

interface RecordIdentifiersParams {
    userId: string;
    ip?: string | null;
    userAgent?: string | null;
    reason?: string;
    expiresAt?: Date | null;
}

/**
 * Record identifiers (IP, User-Agent) for a banned user
 * This helps prevent ban evasion by tracking the user's identifiers
 */
export async function recordBannedIdentifiers(
    params: RecordIdentifiersParams
): Promise<void> {
    const { userId, ip, userAgent, reason, expiresAt } = params;

    const identifiersToCreate: Array<{
        type: string;
        value: string;
        userId: string;
        reason?: string;
        expiresAt?: Date | null;
    }> = [];

    // Record IP address if available
    if (ip) {
        identifiersToCreate.push({
            type: "IP",
            value: ip,
            userId,
            reason,
            expiresAt,
        });
    }

    // Record User-Agent if available (basic device fingerprint)
    if (userAgent) {
        identifiersToCreate.push({
            type: "USER_AGENT",
            value: userAgent,
            userId,
            reason,
            expiresAt,
        });
    }

    // Create all identifiers
    if (identifiersToCreate.length > 0) {
        await prisma.blacklistedIdentifier.createMany({
            data: identifiersToCreate,
            skipDuplicates: true,
        });
    }
}

/**
 * Remove blacklisted identifiers for a user (when unbanning)
 * @param userId - The user ID to unban
 */
export async function removeBlacklistedIdentifiers(
    userId: string
): Promise<void> {
    await prisma.blacklistedIdentifier.deleteMany({
        where: { userId },
    });
}

/**
 * Get the user's last known IP from audit logs
 * @param userId - The user ID to look up
 * @returns The most recent IP address or null
 */
export async function getUserLastKnownIP(
    userId: string
): Promise<string | null> {
    const lastLog = await prisma.auditLog.findFirst({
        where: {
            userId,
            ipAddress: { not: null },
        },
        orderBy: { createdAt: "desc" },
        select: { ipAddress: true },
    });

    return lastLog?.ipAddress || null;
}

/**
 * Calculate ban expiration date
 * @param durationHours - Number of hours for the ban, or "permanent"
 * @returns Date object for expiration
 */
export function calculateBanExpiration(
    durationHours: number | "permanent"
): Date {
    if (durationHours === "permanent") {
        // Use year 9999 for permanent bans
        return new Date("9999-12-31T23:59:59.999Z");
    }

    const expiresAt = new Date();
    expiresAt.setTime(expiresAt.getTime() + durationHours * 60 * 60 * 1000);
    return expiresAt;
}

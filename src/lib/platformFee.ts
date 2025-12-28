import prisma from "./db";

// ============================================
// PLATFORM FEE CACHING & CALCULATION
// ============================================

interface CachedFee {
    value: number;
    expiry: number;
}

// In-memory cache with 5-minute TTL
let cachedFee: CachedFee | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Get the current transaction fee percentage from settings.
 * Uses in-memory caching to avoid DB queries on every transaction.
 */
export async function getTransactionFeePercent(): Promise<number> {
    // Return cached value if valid
    if (cachedFee && Date.now() < cachedFee.expiry) {
        return cachedFee.value;
    }

    try {
        // Fetch from DB (upsert to ensure row exists)
        const settings = await prisma.systemSettings.upsert({
            where: { id: "default" },
            update: {},
            create: { id: "default", transactionFeePercent: 5.0 },
        });

        const fee = settings.transactionFeePercent;

        // Cache the value
        cachedFee = { value: fee, expiry: Date.now() + CACHE_TTL_MS };
        return fee;
    } catch (error) {
        console.error("Error fetching platform fee:", error);
        // Return default if DB fails
        return 5.0;
    }
}

/**
 * Calculate seller earnings after platform fee deduction.
 * @param price - The listing price
 * @param feePercent - The fee percentage (e.g., 5 for 5%)
 * @returns The amount the seller receives
 */
export function calculateSellerEarnings(price: number, feePercent: number): number {
    if (price <= 0) return 0;
    if (feePercent < 0 || feePercent > 100) {
        throw new Error("Fee percentage must be between 0 and 100");
    }
    return price * (1 - feePercent / 100);
}

/**
 * Calculate the platform fee amount.
 * @param price - The listing price
 * @param feePercent - The fee percentage
 * @returns The fee amount
 */
export function calculatePlatformFee(price: number, feePercent: number): number {
    if (price <= 0) return 0;
    return price * (feePercent / 100);
}

/**
 * Invalidate the cached fee. Call this when admin updates the fee.
 */
export function invalidateFeeCache(): void {
    cachedFee = null;
}

import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { invalidateFeeCache } from "@/lib/platformFee";
import { createNotification } from "@/lib/notifications";
import { requireRole } from "@/lib/roleAuth";

// GET - Fetch current platform settings
export async function GET() {
    try {
        const result = await requireRole("ADMIN");
        if ("error" in result) return result.error;

        // Upsert to ensure settings exist
        const settings = await prisma.systemSettings.upsert({
            where: { id: "default" },
            update: {},
            create: { id: "default", transactionFeePercent: 5.0 },
        });

        return NextResponse.json(settings);
    } catch (error) {
        console.error("Error fetching settings:", error);
        return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
    }
}

// PATCH - Update platform settings
export async function PATCH(request: Request) {
    try {
        const result = await requireRole("ADMIN");
        if ("error" in result) return result.error;

        const body = await request.json();
        const { transactionFeePercent } = body;

        // Validate fee percentage
        if (transactionFeePercent !== undefined) {
            if (typeof transactionFeePercent !== "number") {
                return NextResponse.json({ error: "Fee must be a number" }, { status: 400 });
            }
            if (transactionFeePercent < 0 || transactionFeePercent > 100) {
                return NextResponse.json({ error: "Fee must be between 0 and 100" }, { status: 400 });
            }
        }

        // Get old fee for comparison
        const oldSettings = await prisma.systemSettings.findUnique({
            where: { id: "default" },
        });
        const oldFee = oldSettings?.transactionFeePercent ?? 5.0;

        const settings = await prisma.systemSettings.upsert({
            where: { id: "default" },
            update: { transactionFeePercent },
            create: { id: "default", transactionFeePercent: transactionFeePercent ?? 5.0 },
        });

        // Invalidate cache so new fee takes effect
        invalidateFeeCache();

        // Notify all sellers if fee changed
        if (transactionFeePercent !== oldFee) {
            // Find all users who have completed seller setup (have payoutMethod set)
            // Exclude admin/moderator roles
            const sellers = await prisma.user.findMany({
                where: {
                    payoutMethod: { not: null },
                    role: "USER",
                },
                select: { id: true },
            });

            // Create notifications for all sellers (in batches to avoid overwhelming the DB)
            const notificationPromises = sellers.map((seller) =>
                createNotification({
                    userId: seller.id,
                    type: "FEE_UPDATED",
                    title: "Platform Fee Updated",
                    message: `The platform transaction fee has been changed from ${oldFee}% to ${transactionFeePercent}%. This new rate will apply to all future transactions.`,
                })
            );

            // Execute in parallel but don't block the response
            Promise.all(notificationPromises).catch((error) => {
                console.error("Error sending fee change notifications:", error);
            });
        }

        return NextResponse.json(settings);
    } catch (error) {
        console.error("Error updating settings:", error);
        return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
    }
}

import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { createNotification } from "@/lib/notifications";
import { requireRole } from "@/lib/roleAuth";

// GET all withdrawals for admin
export async function GET() {
    try {
        const result = await requireRole("ADMIN");
        if ("error" in result) return result.error;

        const withdrawals = await prisma.withdrawal.findMany({
            include: {
                user: {
                    select: { id: true, name: true, email: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(withdrawals);
    } catch (error) {
        console.error("Error fetching withdrawals:", error);
        return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }
}

// PATCH process withdrawal
export async function PATCH(request: Request) {
    try {
        const result = await requireRole("ADMIN");
        if ("error" in result) return result.error;

        const { user } = result;

        const body = await request.json();
        const { withdrawalId, action, notes } = body;

        if (!withdrawalId || !action) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        const withdrawal = await prisma.withdrawal.findUnique({
            where: { id: withdrawalId },
        });

        if (!withdrawal) {
            return NextResponse.json({ error: "Withdrawal not found" }, { status: 404 });
        }

        if (withdrawal.status !== "PENDING" && withdrawal.status !== "PROCESSING") {
            return NextResponse.json({ error: "Cannot process this withdrawal" }, { status: 400 });
        }

        if (action === "process") {
            // Mark as processing
            await prisma.withdrawal.update({
                where: { id: withdrawalId },
                data: { status: "PROCESSING" },
            });
        } else if (action === "complete") {
            // Complete the withdrawal and deduct from balance
            await prisma.$transaction([
                prisma.withdrawal.update({
                    where: { id: withdrawalId },
                    data: {
                        status: "COMPLETED",
                        processedAt: new Date(),
                        processedBy: user.name || user.id,
                        notes,
                    },
                }),
                prisma.user.update({
                    where: { id: withdrawal.userId },
                    data: {
                        balance: { decrement: withdrawal.amount },
                    },
                }),
            ]);

            // Notify seller that payout was approved
            await createNotification({
                userId: withdrawal.userId,
                type: "PAYOUT_APPROVED",
                title: "Payout Approved",
                message: `Your payout request of ₱${withdrawal.amount.toLocaleString()} has been approved and sent to your ${withdrawal.payoutMethod.toUpperCase()} account.`,
            });
        } else if (action === "reject") {
            await prisma.withdrawal.update({
                where: { id: withdrawalId },
                data: {
                    status: "REJECTED",
                    processedAt: new Date(),
                    processedBy: user.name || user.id,
                    notes,
                },
            });

            // Notify seller that payout was rejected
            await createNotification({
                userId: withdrawal.userId,
                type: "PAYOUT_REJECTED",
                title: "Payout Rejected",
                message: `Your payout request of ₱${withdrawal.amount.toLocaleString()} was rejected.${notes ? ` Reason: ${notes}` : " Please contact support."}`,
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error processing withdrawal:", error);
        return NextResponse.json({ error: "Failed to process" }, { status: 500 });
    }
}


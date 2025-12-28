import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { createNotification } from "@/lib/notifications";
import { requireRole } from "@/lib/roleAuth";

// GET all cash in requests (for admin)
export async function GET() {
    try {
        const result = await requireRole("ADMIN");
        if ("error" in result) return result.error;

        const requests = await prisma.cashInRequest.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(requests);
    } catch (error) {
        console.error("Error fetching cash in requests:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

// PATCH approve/reject cash in request
export async function PATCH(request: Request) {
    try {
        const result = await requireRole("ADMIN");
        if ("error" in result) return result.error;

        const { id, action } = await request.json();

        if (!id || !["approve", "reject"].includes(action)) {
            return new NextResponse("Invalid request", { status: 400 });
        }

        // Get the request
        const cashInRequest = await prisma.cashInRequest.findUnique({
            where: { id },
        });

        if (!cashInRequest) return new NextResponse("Request not found", { status: 404 });

        if (cashInRequest.status !== "PENDING") {
            return new NextResponse("Request already processed", { status: 400 });
        }

        if (action === "approve") {
            // Transaction: Update status, Add Balance, Create Ledger Entry
            await prisma.$transaction(async (tx) => {
                // 1. Update Request
                await tx.cashInRequest.update({
                    where: { id },
                    data: { status: "APPROVED" },
                });

                // 2. Update User Balance
                await tx.user.update({
                    where: { id: cashInRequest.userId },
                    data: {
                        balance: { increment: cashInRequest.amount }
                    },
                });

                // 3. Create Transaction Record
                await tx.walletTransaction.create({
                    data: {
                        userId: cashInRequest.userId,
                        type: "DEPOSIT",
                        amount: cashInRequest.amount,
                        auditId: id,
                    },
                });

                // 4. Notify User
                await createNotification({
                    userId: cashInRequest.userId,
                    type: "CASHIN_APPROVED",
                    title: "Cash In Approved",
                    message: `Your cash in request for ₱${cashInRequest.amount.toLocaleString()} has been approved.`,
                    cashInRequestId: id,
                });
            });
        } else {
            // Reject
            await prisma.cashInRequest.update({
                where: { id },
                data: { status: "REJECTED" },
            });

            // Notify User
            await createNotification({
                userId: cashInRequest.userId,
                type: "CASHIN_REJECTED",
                title: "Cash In Rejected",
                message: `Your cash in request for ₱${cashInRequest.amount.toLocaleString()} was rejected.`,
                cashInRequestId: id,
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error processing cash in request:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}


import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { createAdminNotification } from "@/lib/notifications";

// GET user's withdrawals and balance
export async function GET() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                balance: true,
                payoutMethod: true,
                payoutNumber: true,
                fullName: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const withdrawals = await prisma.withdrawal.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: "desc" },
            take: 20,
        });

        // Calculate pending withdrawal amount
        const pendingAmount = await prisma.withdrawal.aggregate({
            where: {
                userId: session.user.id,
                status: { in: ["PENDING", "PROCESSING"] },
            },
            _sum: { amount: true },
        });

        return NextResponse.json({
            balance: user.balance,
            availableBalance: user.balance - (pendingAmount._sum.amount || 0),
            pendingWithdrawals: pendingAmount._sum.amount || 0,
            payoutMethod: user.payoutMethod,
            payoutNumber: user.payoutNumber,
            fullName: user.fullName,
            withdrawals,
        });
    } catch (error) {
        console.error("Error fetching wallet:", error);
        return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }
}

// POST request a withdrawal
export async function POST(request: Request) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { amount } = body;

        if (!amount || amount <= 0) {
            return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
        }

        // Get user with payout info
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                balance: true,
                payoutMethod: true,
                payoutNumber: true,
                fullName: true,
                isSeller: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (!user.isSeller || !user.payoutMethod || !user.payoutNumber || !user.fullName) {
            return NextResponse.json({ error: "Complete seller setup first" }, { status: 400 });
        }

        // Calculate available balance (excluding pending withdrawals)
        const pendingAmount = await prisma.withdrawal.aggregate({
            where: {
                userId: session.user.id,
                status: { in: ["PENDING", "PROCESSING"] },
            },
            _sum: { amount: true },
        });

        const availableBalance = user.balance - (pendingAmount._sum.amount || 0);

        if (amount > availableBalance) {
            return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
        }

        // Minimum withdrawal amount
        if (amount < 50) {
            return NextResponse.json({ error: "Minimum withdrawal is ₱50" }, { status: 400 });
        }

        // Create withdrawal request
        const withdrawal = await prisma.withdrawal.create({
            data: {
                amount,
                payoutMethod: user.payoutMethod,
                payoutNumber: user.payoutNumber,
                payoutName: user.fullName,
                userId: session.user.id,
            },
        });

        // Notify admins of new payout request
        await createAdminNotification({
            type: "PAYOUT_REQUEST",
            title: "New Payout Request",
            message: `${user.fullName} has requested a payout of ₱${amount.toLocaleString()} via ${user.payoutMethod?.toUpperCase()}.`,
        });

        return NextResponse.json(withdrawal);
    } catch (error) {
        console.error("Error creating withdrawal:", error);
        return NextResponse.json({ error: "Failed to create" }, { status: 500 });
    }
}

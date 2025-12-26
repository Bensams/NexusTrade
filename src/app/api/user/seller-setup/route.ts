import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

// GET check seller setup status
export async function GET() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                isSeller: true,
                isAdmin: true,
                fullName: true,
                payoutMethod: true,
                payoutNumber: true,
                sellerAgreedAt: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const isComplete = !!(user.fullName && user.payoutMethod && user.payoutNumber && user.sellerAgreedAt);

        return NextResponse.json({
            isComplete,
            isSeller: user.isSeller,
            isAdmin: user.isAdmin,
            fullName: user.fullName,
            payoutMethod: user.payoutMethod,
            payoutNumber: user.payoutNumber,
            agreedAt: user.sellerAgreedAt,
        });
    } catch (error) {
        console.error("Error checking seller status:", error);
        return NextResponse.json({ error: "Failed to check" }, { status: 500 });
    }
}

// POST complete seller setup
export async function POST(request: Request) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { fullName, payoutMethod, payoutNumber, agreed } = body;

        if (!fullName || !payoutMethod || !payoutNumber) {
            return NextResponse.json({ error: "All fields are required" }, { status: 400 });
        }

        if (!agreed) {
            return NextResponse.json({ error: "You must agree to the terms" }, { status: 400 });
        }

        // Validate phone number (basic validation for PH numbers)
        const phoneRegex = /^(09|\+639)\d{9}$/;
        if (!phoneRegex.test(payoutNumber.replace(/\s/g, ""))) {
            return NextResponse.json({ error: "Invalid phone number format" }, { status: 400 });
        }

        if (!["gcash", "maya"].includes(payoutMethod)) {
            return NextResponse.json({ error: "Invalid payout method" }, { status: 400 });
        }

        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: {
                fullName: fullName.trim(),
                payoutMethod,
                payoutNumber: payoutNumber.replace(/\s/g, ""),
                sellerAgreedAt: new Date(),
                isSeller: true,
            },
        });

        return NextResponse.json({
            success: true,
            fullName: updatedUser.fullName,
            payoutMethod: updatedUser.payoutMethod,
        });
    } catch (error) {
        console.error("Error setting up seller:", error);
        return NextResponse.json({ error: "Failed to setup" }, { status: 500 });
    }
}

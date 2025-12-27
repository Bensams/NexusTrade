import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { writeFile } from "fs/promises";
import path from "path";
import { createAdminNotification } from "@/lib/notifications";

export async function POST(request: Request) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await request.formData();
        const amountStr = formData.get("amount") as string;
        const paymentMethod = formData.get("paymentMethod") as string;
        const receipt = formData.get("receipt") as File;

        const amount = parseFloat(amountStr);

        if (!amount || amount <= 0 || !paymentMethod || !receipt) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Save the receipt file
        const bytes = await receipt.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const filename = `cashin_${session.user.id}_${Date.now()}${path.extname(receipt.name)}`;
        const uploadDir = path.join(process.cwd(), "public", "uploads", "receipts");

        // Create directory if it doesn't exist
        const { mkdir } = await import("fs/promises");
        await mkdir(uploadDir, { recursive: true });

        const filepath = path.join(uploadDir, filename);
        await writeFile(filepath, buffer);

        const proofUrl = `/uploads/receipts/${filename}`;

        // Create CashInRequest
        const cashInRequest = await prisma.cashInRequest.create({
            data: {
                userId: session.user.id,
                amount,
                paymentMethod,
                proofUrl,
                status: "PENDING",
            },
        });

        // Notify admins
        await createAdminNotification({
            type: "CASHIN_TO_REVIEW",
            title: "New Cash-In Request",
            message: `User ${session.user.name} requested cash-in of ₱${amount.toFixed(2)}.`,
            cashInRequestId: cashInRequest.id,
        });

        return NextResponse.json({ success: true, request: cashInRequest });
    } catch (error) {
        console.error("Error creating cash-in request:", error);
        return NextResponse.json({ error: "Failed to create request" }, { status: 500 });
    }
}

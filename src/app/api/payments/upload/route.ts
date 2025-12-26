import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { writeFile } from "fs/promises";
import path from "path";
import { createAdminNotification } from "@/lib/notifications";

// POST upload payment receipt
export async function POST(request: Request) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await request.formData();
        const orderId = formData.get("orderId") as string;
        const paymentMethod = formData.get("paymentMethod") as string;
        const receipt = formData.get("receipt") as File;

        if (!orderId || !paymentMethod || !receipt) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Verify order belongs to user and is in correct status
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                listing: {
                    select: { id: true, title: true },
                },
            },
        });

        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        if (order.buyerId !== session.user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        if (order.status !== "PENDING" && order.status !== "AWAITING_PAYMENT") {
            return NextResponse.json({ error: "Order already processed" }, { status: 400 });
        }

        // Save the receipt file
        const bytes = await receipt.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const filename = `receipt_${orderId}_${Date.now()}${path.extname(receipt.name)}`;
        const uploadDir = path.join(process.cwd(), "public", "uploads", "receipts");

        // Create directory if it doesn't exist
        const { mkdir } = await import("fs/promises");
        await mkdir(uploadDir, { recursive: true });

        const filepath = path.join(uploadDir, filename);
        await writeFile(filepath, buffer);

        const receiptUrl = `/uploads/receipts/${filename}`;

        // Update order
        await prisma.order.update({
            where: { id: orderId },
            data: {
                status: "PAYMENT_SUBMITTED",
                paymentMethod,
                paymentReceipt: receiptUrl,
                paidAt: new Date(),
            },
        });

        // Notify admins of new payment to review
        await createAdminNotification({
            type: "PAYMENT_TO_REVIEW",
            title: "New Payment Submitted",
            message: `A payment receipt has been submitted for "${order.listing.title}". Please review.`,
            orderId: order.id,
            listingId: order.listing.id,
        });

        return NextResponse.json({ success: true, receiptUrl });
    } catch (error) {
        console.error("Error uploading receipt:", error);
        return NextResponse.json({ error: "Failed to upload" }, { status: 500 });
    }
}


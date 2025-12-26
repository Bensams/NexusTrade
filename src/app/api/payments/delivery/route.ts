import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { createNotification, createAdminNotification } from "@/lib/notifications";

// POST upload delivery proof
export async function POST(request: Request) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await request.formData();
        const orderId = formData.get("orderId") as string;
        const proof = formData.get("proof") as File;

        if (!orderId || !proof) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Verify order exists and user is the seller
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { listing: true },
        });

        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        if (order.listing.sellerId !== session.user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        if (order.status !== "PAID") {
            return NextResponse.json({ error: "Order not ready for delivery" }, { status: 400 });
        }

        // Save the proof file
        const bytes = await proof.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const filename = `delivery_${orderId}_${Date.now()}${path.extname(proof.name)}`;
        const uploadDir = path.join(process.cwd(), "public", "uploads", "deliveries");

        await mkdir(uploadDir, { recursive: true });

        const filepath = path.join(uploadDir, filename);
        await writeFile(filepath, buffer);

        const proofUrl = `/uploads/deliveries/${filename}`;

        // Update order
        await prisma.order.update({
            where: { id: orderId },
            data: {
                status: "DELIVERY_SUBMITTED",
                deliveryProof: proofUrl,
                deliveredAt: new Date(),
            },
        });

        // Notify buyer that seller has delivered
        await createNotification({
            userId: order.buyerId,
            type: "ORDER_DELIVERED",
            title: "Order Delivered",
            message: `The seller has delivered your order for "${order.listing.title}". Awaiting admin verification.`,
            orderId: order.id,
            listingId: order.listing.id,
        });

        // Notify admins of new delivery to review
        await createAdminNotification({
            type: "DELIVERY_TO_REVIEW",
            title: "Delivery Proof Submitted",
            message: `Delivery proof has been submitted for "${order.listing.title}". Please review.`,
            orderId: order.id,
            listingId: order.listing.id,
        });

        return NextResponse.json({ success: true, proofUrl });
    } catch (error) {
        console.error("Error uploading delivery proof:", error);
        return NextResponse.json({ error: "Failed to upload" }, { status: 500 });
    }
}

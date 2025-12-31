import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { createNotification } from "@/lib/notifications";
import { getTransactionFeePercent, calculateSellerEarnings } from "@/lib/platformFee";

/**
 * POST /api/orders/[id]/confirm
 * Buyer confirms receipt of delivery - triggers payment to seller
 */
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: orderId } = await params;

        // Fetch order with listing and seller info
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                listing: {
                    include: { seller: true },
                },
                buyer: true,
            },
        });

        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        // Only buyer can confirm receipt
        if (order.buyerId !== session.user.id) {
            return NextResponse.json({ error: "Only the buyer can confirm receipt" }, { status: 403 });
        }

        // Order must be in DELIVERY_SUBMITTED status
        if (order.status !== "DELIVERY_SUBMITTED") {
            return NextResponse.json({
                error: "Order is not awaiting confirmation. Current status: " + order.status
            }, { status: 400 });
        }

        const listing = order.listing;
        const feePercent = await getTransactionFeePercent();
        const sellerEarnings = calculateSellerEarnings(listing.price, feePercent);

        // Transaction: Complete order and pay seller
        await prisma.$transaction(async (tx) => {
            // 1. Update order status to COMPLETED
            await tx.order.update({
                where: { id: orderId },
                data: {
                    status: "COMPLETED",
                    completedAt: new Date(),
                },
            });

            // 2. Credit seller's balance
            await tx.user.update({
                where: { id: listing.sellerId },
                data: { balance: { increment: sellerEarnings } },
            });

            // 3. Create wallet transaction for seller
            await tx.walletTransaction.create({
                data: {
                    userId: listing.sellerId,
                    amount: sellerEarnings,
                    type: "SALE",
                    auditId: orderId,
                },
            });
        });

        // Send notifications (outside transaction for performance)

        // Notify seller of successful sale
        await createNotification({
            userId: listing.sellerId,
            type: "SALE_COMPLETED",
            title: "Payment Received! 🎉",
            message: `The buyer confirmed receipt for "${listing.title}". You earned ₱${sellerEarnings.toFixed(2)} (after ${feePercent}% platform fee).`,
            orderId: order.id,
            listingId: listing.id,
        });

        // Notify buyer to leave a review
        await createNotification({
            userId: order.buyerId,
            type: "REVIEW_REMINDER",
            title: "Order Complete! Leave a Review",
            message: `Your order for "${listing.title}" is complete. Please leave a review for the seller to help other buyers!`,
            orderId: order.id,
            listingId: listing.id,
        });

        return NextResponse.json({
            success: true,
            message: "Order confirmed! Seller has been paid.",
            sellerEarnings,
            // Flag to prompt review in UI
            promptReview: true,
            sellerId: listing.sellerId,
            listingId: listing.id,
            orderId: order.id,
        });

    } catch (error) {
        console.error("Error confirming order:", error);
        return NextResponse.json({ error: "Failed to confirm order" }, { status: 500 });
    }
}

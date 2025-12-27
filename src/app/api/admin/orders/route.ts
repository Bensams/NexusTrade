import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { createNotification } from "@/lib/notifications";

// GET all orders for admin
export async function GET() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check if user is admin
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { isAdmin: true },
        });

        if (!user?.isAdmin) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const orders = await prisma.order.findMany({
            include: {
                buyer: {
                    select: { id: true, name: true, email: true, image: true },
                },
                listing: {
                    include: {
                        seller: {
                            select: { id: true, name: true, email: true },
                        },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(orders);
    } catch (error) {
        console.error("Error fetching admin orders:", error);
        return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }
}

// PATCH approve or reject payment
export async function PATCH(request: Request) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check if user is admin
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { isAdmin: true },
        });

        if (!user?.isAdmin) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        const { orderId, action } = body;

        if (!orderId || !action) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                listing: {
                    select: { id: true, title: true, price: true, sellerId: true },
                },
            },
        });

        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        if (action === "approve") {
            // Approve payment (PAYMENT_SUBMITTED -> PAID)
            if (order.status === "PAYMENT_SUBMITTED") {
                await prisma.order.update({
                    where: { id: orderId },
                    data: {
                        status: "PAID",
                        approvedAt: new Date(),
                    },
                });

                // Create or get conversation between seller and buyer for this order
                let conversation = await prisma.conversation.findFirst({
                    where: {
                        orderId: order.id,
                        participants: {
                            every: {
                                userId: { in: [order.buyerId, order.listing.sellerId] }
                            }
                        }
                    },
                });

                if (!conversation) {
                    conversation = await prisma.conversation.create({
                        data: {
                            orderId: order.id,
                            listingId: order.listing.id,
                            participants: {
                                create: [
                                    { userId: order.buyerId },
                                    { userId: order.listing.sellerId },
                                ],
                            },
                        },
                    });

                    // Send an initial system-like message from seller to buyer
                    await prisma.message.create({
                        data: {
                            conversationId: conversation.id,
                            senderId: order.listing.sellerId,
                            content: `Hello! Your payment for "${order.listing.title}" has been confirmed. I'll be delivering your order shortly. Please stay in touch here for updates!`,
                        },
                    });

                    // Update conversation timestamp
                    await prisma.conversation.update({
                        where: { id: conversation.id },
                        data: { updatedAt: new Date() },
                    });
                }

                // Notify buyer that payment was approved
                await createNotification({
                    userId: order.buyerId,
                    type: "PAYMENT_APPROVED",
                    title: "Payment Approved",
                    message: `Your payment for "${order.listing.title}" has been approved. The seller will deliver soon. Check your messages!`,
                    orderId: order.id,
                    listingId: order.listing.id,
                });

                // Notify seller of new order to deliver
                await createNotification({
                    userId: order.listing.sellerId,
                    type: "NEW_ORDER",
                    title: "New Order",
                    message: `Payment received for "${order.listing.title}". Please deliver to the buyer. A conversation has been started for you.`,
                    orderId: order.id,
                    listingId: order.listing.id,
                });
            }
            // Verify delivery (DELIVERY_SUBMITTED -> COMPLETED)
            // Credit seller with 90% of the price (10% platform fee)
            else if (order.status === "DELIVERY_SUBMITTED") {
                const sellerEarnings = order.listing.price * 0.9;

                await prisma.$transaction([
                    prisma.order.update({
                        where: { id: orderId },
                        data: {
                            status: "COMPLETED",
                            completedAt: new Date(),
                        },
                    }),
                    prisma.user.update({
                        where: { id: order.listing.sellerId },
                        data: {
                            balance: { increment: sellerEarnings },
                        },
                    }),
                ]);

                // Notify buyer that order is complete
                await createNotification({
                    userId: order.buyerId,
                    type: "ORDER_COMPLETED",
                    title: "Order Completed",
                    message: `Your order for "${order.listing.title}" has been completed. You can now leave a review!`,
                    orderId: order.id,
                    listingId: order.listing.id,
                });

                // Notify seller that delivery was approved and they got paid
                await createNotification({
                    userId: order.listing.sellerId,
                    type: "DELIVERY_APPROVED",
                    title: "Delivery Approved!",
                    message: `Your delivery for "${order.listing.title}" was approved! ₱${sellerEarnings.toFixed(2)} has been added to your wallet.`,
                    orderId: order.id,
                    listingId: order.listing.id,
                });
            }
        } else if (action === "reject") {
            // Check if this is a delivery rejection (refund buyer and notify seller)
            const isDeliveryRejection = order.status === "DELIVERY_SUBMITTED";

            if (isDeliveryRejection) {
                // Refund buyer and cancel order
                await prisma.$transaction([
                    prisma.order.update({
                        where: { id: orderId },
                        data: { status: "REFUNDED" },
                    }),
                    prisma.user.update({
                        where: { id: order.buyerId },
                        data: { balance: { increment: order.listing.price } },
                    }),
                ]);

                // Notify seller that delivery was rejected
                await createNotification({
                    userId: order.listing.sellerId,
                    type: "DELIVERY_REJECTED",
                    title: "Delivery Rejected",
                    message: `Your delivery for "${order.listing.title}" was rejected. The buyer has been refunded.`,
                    orderId: order.id,
                    listingId: order.listing.id,
                });

                // Notify buyer of refund
                await createNotification({
                    userId: order.buyerId,
                    type: "ORDER_REFUNDED",
                    title: "Order Refunded",
                    message: `Your order for "${order.listing.title}" has been refunded. ₱${order.listing.price.toFixed(2)} has been returned to your wallet.`,
                    orderId: order.id,
                    listingId: order.listing.id,
                });
            } else {
                // Payment rejection
                await prisma.order.update({
                    where: { id: orderId },
                    data: { status: "CANCELLED" },
                });

                // Notify buyer that payment was declined
                await createNotification({
                    userId: order.buyerId,
                    type: "PAYMENT_DECLINED",
                    title: "Payment Declined",
                    message: `Your payment for "${order.listing.title}" was declined. Please contact support.`,
                    orderId: order.id,
                    listingId: order.listing.id,
                });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating order:", error);
        return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }
}


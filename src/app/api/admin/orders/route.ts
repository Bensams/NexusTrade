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

                // Notify buyer that payment was approved
                await createNotification({
                    userId: order.buyerId,
                    type: "PAYMENT_APPROVED",
                    title: "Payment Approved",
                    message: `Your payment for "${order.listing.title}" has been approved. The seller will deliver soon.`,
                    orderId: order.id,
                    listingId: order.listing.id,
                });

                // Notify seller of new order to deliver
                await createNotification({
                    userId: order.listing.sellerId,
                    type: "NEW_ORDER",
                    title: "New Order",
                    message: `Payment received for "${order.listing.title}". Please deliver to the buyer.`,
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
            }
        } else if (action === "reject") {
            await prisma.order.update({
                where: { id: orderId },
                data: {
                    status: "CANCELLED",
                },
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

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating order:", error);
        return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }
}


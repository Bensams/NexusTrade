import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { createNotification, createAdminNotification } from "@/lib/notifications";
import { logActivity, getClientIP, getUserAgent } from "@/lib/auditLog";

// GET user's disputes (as buyer)
export async function GET() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const disputes = await prisma.dispute.findMany({
            where: { openedById: session.user.id },
            include: {
                order: {
                    include: {
                        listing: {
                            select: { id: true, title: true, price: true, images: true },
                        },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(disputes);
    } catch (error) {
        console.error("Error fetching disputes:", error);
        return NextResponse.json({ error: "Failed to fetch disputes" }, { status: 500 });
    }
}

// POST open a new dispute
export async function POST(request: Request) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { orderId, reason, description } = body;

        if (!orderId || !reason || !description) {
            return NextResponse.json({ error: "Order ID, reason, and description are required" }, { status: 400 });
        }

        // Validate reason enum
        const validReasons = ["ITEM_NOT_RECEIVED", "ITEM_NOT_AS_DESCRIBED", "SELLER_UNRESPONSIVE", "FRAUD_SUSPECTED", "OTHER"];
        if (!validReasons.includes(reason)) {
            return NextResponse.json({ error: "Invalid dispute reason" }, { status: 400 });
        }

        // Fetch order with seller info
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                listing: {
                    select: { id: true, title: true, price: true, sellerId: true },
                },
                dispute: true,
            },
        });

        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        // Security: Only the buyer can open a dispute
        if (order.buyerId !== session.user.id) {
            return NextResponse.json({ error: "Only the buyer can open a dispute" }, { status: 403 });
        }

        // Check if dispute already exists
        if (order.dispute) {
            return NextResponse.json({ error: "A dispute already exists for this order" }, { status: 400 });
        }

        // Valid statuses for dispute: PAID, DELIVERY_SUBMITTED, or COMPLETED within 7 days
        const disputeableStatuses = ["PAID", "DELIVERY_SUBMITTED", "COMPLETED"];
        if (!disputeableStatuses.includes(order.status)) {
            return NextResponse.json({
                error: "Cannot dispute an order in this status. Order must be paid, awaiting delivery, or recently completed."
            }, { status: 400 });
        }

        // For completed orders, check if within 7-day window
        if (order.status === "COMPLETED" && order.completedAt) {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            if (order.completedAt < sevenDaysAgo) {
                return NextResponse.json({
                    error: "Dispute window has expired. Orders can only be disputed within 7 days of completion."
                }, { status: 400 });
            }
        }

        // Create dispute and update order status in a transaction
        const dispute = await prisma.$transaction(async (tx) => {
            // Create the dispute
            const newDispute = await tx.dispute.create({
                data: {
                    orderId,
                    openedById: session.user.id,
                    reason,
                    description,
                },
            });

            // Update order status to DISPUTED
            await tx.order.update({
                where: { id: orderId },
                data: { status: "DISPUTED" },
            });

            return newDispute;
        });

        // Notify seller about the dispute
        await createNotification({
            userId: order.listing.sellerId,
            type: "DISPUTE_OPENED",
            title: "Dispute Opened",
            message: `A buyer has opened a dispute for "${order.listing.title}". Reason: ${reason.replace(/_/g, " ")}. An admin will review this case.`,
            orderId: order.id,
            listingId: order.listing.id,
        });

        // Notify admins about the dispute
        await createAdminNotification({
            type: "DISPUTE_OPENED",
            title: "New Dispute to Review",
            message: `A dispute has been opened for order "${order.listing.title}". Reason: ${reason.replace(/_/g, " ")}.`,
            orderId: order.id,
            listingId: order.listing.id,
        });

        // Log the dispute action
        logActivity({
            userId: session.user.id,
            actionType: "DISPUTE_OPENED",
            resourceId: dispute.id,
            resourceType: "dispute",
            metadata: {
                orderId: order.id,
                listingTitle: order.listing.title,
                reason,
            },
            ipAddress: getClientIP(request) || undefined,
            userAgent: getUserAgent(request) || undefined,
        });

        return NextResponse.json(dispute, { status: 201 });
    } catch (error) {
        console.error("Error creating dispute:", error);
        return NextResponse.json({ error: "Failed to create dispute" }, { status: 500 });
    }
}

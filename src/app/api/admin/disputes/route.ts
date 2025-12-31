import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { createNotification } from "@/lib/notifications";
import { requireRole } from "@/lib/roleAuth";
import { getTransactionFeePercent, calculateSellerEarnings } from "@/lib/platformFee";
import { logActivity, getClientIP, getUserAgent } from "@/lib/auditLog";

// GET all disputes for admin with chat history
export async function GET() {
    try {
        const result = await requireRole("ADMIN");
        if ("error" in result) return result.error;

        const disputes = await prisma.dispute.findMany({
            include: {
                order: {
                    include: {
                        listing: {
                            select: {
                                id: true,
                                title: true,
                                price: true,
                                images: true,
                                sellerId: true,
                            },
                        },
                        buyer: {
                            select: { id: true, name: true, email: true, image: true },
                        },
                        // Include conversations with messages for chat history
                        conversations: {
                            include: {
                                messages: {
                                    include: {
                                        sender: {
                                            select: { id: true, name: true, image: true },
                                        },
                                    },
                                    orderBy: { createdAt: "asc" },
                                },
                                participants: {
                                    include: {
                                        user: {
                                            select: { id: true, name: true, image: true },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                openedBy: {
                    select: { id: true, name: true, email: true, image: true },
                },
                resolvedBy: {
                    select: { id: true, name: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        // Also fetch seller info for each dispute
        const disputesWithSeller = await Promise.all(
            disputes.map(async (dispute) => {
                const seller = await prisma.user.findUnique({
                    where: { id: dispute.order.listing.sellerId },
                    select: { id: true, name: true, email: true, image: true },
                });
                return {
                    ...dispute,
                    seller,
                };
            })
        );

        return NextResponse.json(disputesWithSeller);
    } catch (error) {
        console.error("Error fetching disputes:", error);
        return NextResponse.json({ error: "Failed to fetch disputes" }, { status: 500 });
    }
}

// PATCH resolve a dispute
export async function PATCH(request: Request) {
    try {
        const result = await requireRole("ADMIN");
        if ("error" in result) return result.error;
        const { user: adminUser } = result;

        const body = await request.json();
        const { disputeId, action, adminNotes } = body;

        if (!disputeId || !action) {
            return NextResponse.json({ error: "Dispute ID and action are required" }, { status: 400 });
        }

        // Validate action
        const validActions = ["REFUND_BUYER", "RELEASE_TO_SELLER", "NO_ACTION", "UNDER_REVIEW"];
        if (!validActions.includes(action)) {
            return NextResponse.json({ error: "Invalid resolution action" }, { status: 400 });
        }

        const dispute = await prisma.dispute.findUnique({
            where: { id: disputeId },
            include: {
                order: {
                    include: {
                        listing: {
                            select: { id: true, title: true, price: true, sellerId: true },
                        },
                    },
                },
            },
        });

        if (!dispute) {
            return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
        }

        if (dispute.status === "RESOLVED" || dispute.status === "CLOSED") {
            return NextResponse.json({ error: "Dispute has already been resolved" }, { status: 400 });
        }

        const order = dispute.order;
        const listing = order.listing;

        // Handle "UNDER_REVIEW" status update
        if (action === "UNDER_REVIEW") {
            await prisma.dispute.update({
                where: { id: disputeId },
                data: {
                    status: "UNDER_REVIEW",
                    adminNotes: adminNotes || dispute.adminNotes,
                },
            });

            // Notify both parties
            await createNotification({
                userId: order.buyerId,
                type: "DISPUTE_UPDATE",
                title: "Dispute Under Review",
                message: `Your dispute for "${listing.title}" is now being reviewed by an admin.`,
                orderId: order.id,
                listingId: listing.id,
            });

            await createNotification({
                userId: listing.sellerId,
                type: "DISPUTE_UPDATE",
                title: "Dispute Under Review",
                message: `The dispute for "${listing.title}" is now being reviewed by an admin.`,
                orderId: order.id,
                listingId: listing.id,
            });

            return NextResponse.json({ success: true, message: "Dispute marked as under review" });
        }

        // Handle resolution actions
        await prisma.$transaction(async (tx) => {
            if (action === "REFUND_BUYER") {
                // Refund buyer
                await tx.user.update({
                    where: { id: order.buyerId },
                    data: { balance: { increment: listing.price } },
                });

                // Create wallet transaction for refund
                await tx.walletTransaction.create({
                    data: {
                        userId: order.buyerId,
                        amount: listing.price,
                        type: "REFUND",
                        auditId: order.id,
                    },
                });

                // Update order status
                await tx.order.update({
                    where: { id: order.id },
                    data: { status: "REFUNDED" },
                });

            } else if (action === "RELEASE_TO_SELLER") {
                // Credit seller with platform fee deducted
                const feePercent = await getTransactionFeePercent();
                const sellerEarnings = calculateSellerEarnings(listing.price, feePercent);

                await tx.user.update({
                    where: { id: listing.sellerId },
                    data: { balance: { increment: sellerEarnings } },
                });

                // Create wallet transaction for sale
                await tx.walletTransaction.create({
                    data: {
                        userId: listing.sellerId,
                        amount: sellerEarnings,
                        type: "SALE",
                        auditId: order.id,
                    },
                });

                // Update order status
                await tx.order.update({
                    where: { id: order.id },
                    data: {
                        status: "COMPLETED",
                        completedAt: new Date(),
                    },
                });

            } else if (action === "NO_ACTION") {
                // Restore order to previous state (before dispute)
                // Default to DELIVERY_SUBMITTED since that's the most common pre-dispute state
                await tx.order.update({
                    where: { id: order.id },
                    data: { status: "DELIVERY_SUBMITTED" },
                });
            }

            // Update dispute status
            await tx.dispute.update({
                where: { id: disputeId },
                data: {
                    status: "RESOLVED",
                    resolution: action,
                    resolvedById: adminUser.id,
                    resolvedAt: new Date(),
                    adminNotes: adminNotes || dispute.adminNotes,
                },
            });
        });

        // Send notifications based on resolution
        const resolutionMessages = {
            REFUND_BUYER: {
                buyer: `Your dispute for "${listing.title}" has been resolved. A full refund of ₱${listing.price.toFixed(2)} has been credited to your wallet.`,
                seller: `The dispute for "${listing.title}" has been resolved in favor of the buyer. The order has been refunded.`,
            },
            RELEASE_TO_SELLER: {
                buyer: `Your dispute for "${listing.title}" has been resolved in favor of the seller. The order is now marked as completed.`,
                seller: `The dispute for "${listing.title}" has been resolved in your favor. Your earnings have been credited to your wallet.`,
            },
            NO_ACTION: {
                buyer: `Your dispute for "${listing.title}" has been closed with no action taken. Please contact support if you have further concerns.`,
                seller: `The dispute for "${listing.title}" has been closed with no action taken. The order remains in its current state.`,
            },
        };

        const messages = resolutionMessages[action as keyof typeof resolutionMessages];

        await createNotification({
            userId: order.buyerId,
            type: "DISPUTE_RESOLVED",
            title: "Dispute Resolved",
            message: messages.buyer,
            orderId: order.id,
            listingId: listing.id,
        });

        await createNotification({
            userId: listing.sellerId,
            type: "DISPUTE_RESOLVED",
            title: "Dispute Resolved",
            message: messages.seller,
            orderId: order.id,
            listingId: listing.id,
        });

        // Log the resolution action
        logActivity({
            userId: adminUser.id,
            actionType: "DISPUTE_RESOLVED",
            resourceId: dispute.id,
            resourceType: "dispute",
            metadata: {
                orderId: order.id,
                resolution: action,
                listingTitle: listing.title,
            },
            ipAddress: getClientIP(request) || undefined,
            userAgent: getUserAgent(request) || undefined,
        });

        return NextResponse.json({ success: true, message: `Dispute resolved: ${action}` });
    } catch (error) {
        console.error("Error resolving dispute:", error);
        return NextResponse.json({ error: "Failed to resolve dispute" }, { status: 500 });
    }
}

import prisma from "@/lib/db";
import { createNotification } from "@/lib/notifications";

/**
 * Process a purchase transaction between a buyer and a seller.
 * Uses a database transaction to ensure ACID compliance.
 * 
 * ESCROW FLOW:
 * 1. Buyer's balance is deducted (funds held in escrow)
 * 2. Seller is NOT credited until admin approves delivery
 * 3. Notifications sent to buyer, seller, and admins
 * 4. Conversation created for buyer-seller communication
 * 
 * @param buyerId - The ID of the user buying the item
 * @param listingId - The ID of the listing being purchased
 */
export async function buyItem(buyerId: string, listingId: string) {
    const result = await prisma.$transaction(async (tx) => {
        // 1. Fetch listing and seller
        const listing = await tx.listing.findUnique({
            where: { id: listingId },
            include: { seller: true, orders: true },
        });

        if (!listing) {
            throw new Error("Listing not found");
        }

        // Check for existing active orders on this listing
        const existingActiveOrder = listing.orders?.find(
            o => !["CANCELLED", "REFUNDED", "COMPLETED"].includes(o.status)
        );
        if (existingActiveOrder) {
            throw new Error("This item already has an active order");
        }

        // 2. Fetch buyer
        const buyer = await tx.user.findUnique({
            where: { id: buyerId },
        });

        if (!buyer) {
            throw new Error("Buyer not found");
        }

        if (buyer.balance < listing.price) {
            throw new Error("Insufficient balance");
        }

        // 3. Deduct from buyer (ESCROW - funds held until delivery verified)
        await tx.user.update({
            where: { id: buyerId },
            data: { balance: { decrement: listing.price } },
        });

        // NOTE: Seller is NOT credited here. They receive funds only after admin verifies delivery.

        // 4. Create Order with PAID status (awaiting delivery)
        const order = await tx.order.create({
            data: {
                buyerId,
                listingId,
                status: "PAID",
                paymentMethod: "WALLET",
                paidAt: new Date(),
            },
        });

        // 5. Ledger Entry: DEBIT Buyer (escrow hold)
        await tx.walletTransaction.create({
            data: {
                userId: buyerId,
                amount: -listing.price,
                type: "PURCHASE",
                auditId: order.id,
            },
        });

        // 6. Create conversation for buyer-seller communication
        const conversation = await tx.conversation.create({
            data: {
                orderId: order.id,
                listingId: listing.id,
                participants: {
                    create: [
                        { userId: buyerId },
                        { userId: listing.sellerId },
                    ],
                },
            },
        });

        // 7. Send initial message from seller
        await tx.message.create({
            data: {
                conversationId: conversation.id,
                senderId: listing.sellerId,
                content: `Hello! Your payment for "${listing.title}" has been confirmed. I'll be delivering your order shortly. Please stay in touch here for updates!`,
            },
        });

        return { order, listing, conversation };
    });

    // Send notifications outside the transaction
    const { order, listing } = result;

    // Notify buyer that payment was successful
    await createNotification({
        userId: order.buyerId,
        type: "PAYMENT_APPROVED",
        title: "Payment Successful",
        message: `Your payment of ₱${listing.price.toFixed(2)} for "${listing.title}" has been processed. The seller will deliver soon. Check your messages!`,
        orderId: order.id,
        listingId: listing.id,
    });

    // Notify seller of new order to deliver
    await createNotification({
        userId: listing.sellerId,
        type: "NEW_ORDER",
        title: "New Order Received!",
        message: `You have a new order for "${listing.title}" (₱${listing.price.toFixed(2)}). Please deliver to the buyer and upload proof. A conversation has been started.`,
        orderId: order.id,
        listingId: listing.id,
    });

    return result.order;
}

/**
 * Pay for an existing order using wallet balance.
 * 
 * ESCROW FLOW:
 * 1. Buyer's balance is deducted (funds held in escrow)
 * 2. Seller is NOT credited until admin approves delivery
 * 3. Notifications sent to buyer and seller
 * 4. Conversation created if not exists
 */
export async function payOrderWithWallet(userId: string, orderId: string) {
    const result = await prisma.$transaction(async (tx) => {
        // 1. Fetch order with listing and seller
        const order = await tx.order.findUnique({
            where: { id: orderId },
            include: { listing: { include: { seller: true } } },
        });

        if (!order) {
            throw new Error("Order not found");
        }

        if (order.status !== "PENDING" && order.status !== "AWAITING_PAYMENT") {
            throw new Error("Order is not in pending state");
        }

        if (order.buyerId !== userId) {
            throw new Error("Unauthorized");
        }

        const listing = order.listing;

        // 2. Fetch buyer
        const buyer = await tx.user.findUnique({
            where: { id: userId },
        });

        if (!buyer) {
            throw new Error("Buyer not found");
        }

        if (buyer.balance < listing.price) {
            throw new Error("Insufficient balance");
        }

        // 3. Deduct from buyer (ESCROW - funds held until delivery verified)
        await tx.user.update({
            where: { id: userId },
            data: { balance: { decrement: listing.price } },
        });

        // NOTE: Seller is NOT credited here. They receive funds only after admin verifies delivery.

        // 4. Update Order to PAID status
        const updatedOrder = await tx.order.update({
            where: { id: orderId },
            data: {
                status: "PAID",
                paymentMethod: "WALLET",
                paidAt: new Date(),
            },
        });

        // 5. Ledger Entry: DEBIT Buyer (escrow hold)
        await tx.walletTransaction.create({
            data: {
                userId: userId,
                amount: -listing.price,
                type: "PURCHASE",
                auditId: order.id,
            },
        });

        // 6. Create or get conversation for buyer-seller communication
        let conversation = await tx.conversation.findFirst({
            where: {
                orderId: order.id,
            },
        });

        if (!conversation) {
            conversation = await tx.conversation.create({
                data: {
                    orderId: order.id,
                    listingId: listing.id,
                    participants: {
                        create: [
                            { userId },
                            { userId: listing.sellerId },
                        ],
                    },
                },
            });

            // Send initial message from seller
            await tx.message.create({
                data: {
                    conversationId: conversation.id,
                    senderId: listing.sellerId,
                    content: `Hello! Your payment for "${listing.title}" has been confirmed. I'll be delivering your order shortly. Please stay in touch here for updates!`,
                },
            });
        }

        return { order: updatedOrder, listing };
    });

    // Send notifications outside the transaction
    const { order, listing } = result;

    // Notify buyer that payment was successful
    await createNotification({
        userId: order.buyerId,
        type: "PAYMENT_APPROVED",
        title: "Payment Successful",
        message: `Your payment of ₱${listing.price.toFixed(2)} for "${listing.title}" has been processed. The seller will deliver soon. Check your messages!`,
        orderId: order.id,
        listingId: listing.id,
    });

    // Notify seller of new order to deliver
    await createNotification({
        userId: listing.sellerId,
        type: "NEW_ORDER",
        title: "New Order Received!",
        message: `You have a new order for "${listing.title}" (₱${listing.price.toFixed(2)}). Please deliver to the buyer and upload proof. A conversation has been started.`,
        orderId: order.id,
        listingId: listing.id,
    });

    return result.order;
}


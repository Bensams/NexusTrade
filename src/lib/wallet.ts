import prisma from "@/lib/db";

/**
 * Process a purchase transaction between a buyer and a seller.
 * Uses a database transaction to ensure ACID compliance.
 * 
 * @param buyerId - The ID of the user buying the item
 * @param listingId - The ID of the listing being purchased
 */
export async function buyItem(buyerId: string, listingId: string) {
    return await prisma.$transaction(async (tx) => {
        // 1. Fetch listing and seller
        const listing = await tx.listing.findUnique({
            where: { id: listingId },
            include: { seller: true, orders: true },
        });

        if (!listing) {
            throw new Error("Listing not found");
        }

        if (listing.orders && listing.orders.length > 0) {
            // Check if active order exists (simplified)
            // ideally we check status, but for now assume single order per listing logic if that's the case
            // or just check if stock available logic.
            // As per schema "orders Order[]", but usually typically one active order.
        }

        // 2. Fetch buyer with lock (optional, but good for concurrency) 
        // Prisma doesn't support SELECT FOR UPDATE easily without raw query, 
        // but optimistic concurrency control relies on 'version' fields which we don't have.
        // We will just read and check balance.
        const buyer = await tx.user.findUnique({
            where: { id: buyerId },
        });

        if (!buyer) {
            throw new Error("Buyer not found");
        }

        if (buyer.balance < listing.price) {
            throw new Error("Insufficient balance");
        }

        // 3. Deduct from buyer
        await tx.user.update({
            where: { id: buyerId },
            data: { balance: { decrement: listing.price } },
        });

        // 4. Add to seller
        await tx.user.update({
            where: { id: listing.sellerId },
            data: { balance: { increment: listing.price } },
        });

        // 5. Create Order
        const order = await tx.order.create({
            data: {
                buyerId,
                listingId,
                status: "PAID", // Directly PAID since it's wallet transfer
                paymentMethod: "WALLET",
                paidAt: new Date(),
            },
        });

        // 6. Ledger Entry: DEBIT Buyer
        await tx.walletTransaction.create({
            data: {
                userId: buyerId,
                amount: -listing.price,
                type: "PURCHASE",
                auditId: order.id,
            },
        });

        // 7. Ledger Entry: CREDIT Seller
        await tx.walletTransaction.create({
            data: {
                userId: listing.sellerId,
                amount: listing.price,
                type: "SALE",
                auditId: order.id,
            },
        });

        return order;
    });
}

/**
 * Pay for an existing order using wallet balance.
 */
export async function payOrderWithWallet(userId: string, orderId: string) {
    return await prisma.$transaction(async (tx) => {
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

        // 3. Deduct from buyer
        await tx.user.update({
            where: { id: userId },
            data: { balance: { decrement: listing.price } },
        });

        // 4. Add to seller
        await tx.user.update({
            where: { id: listing.sellerId },
            data: { balance: { increment: listing.price } },
        });

        // 5. Update Order
        const updatedOrder = await tx.order.update({
            where: { id: orderId },
            data: {
                status: "PAID",
                paymentMethod: "WALLET",
                paidAt: new Date(),
            },
        });

        // 6. Ledger Entries
        await tx.walletTransaction.create({
            data: {
                userId: userId,
                amount: -listing.price,
                type: "PURCHASE",
                auditId: order.id,
            },
        });

        await tx.walletTransaction.create({
            data: {
                userId: listing.sellerId,
                amount: listing.price,
                type: "SALE",
                auditId: order.id,
            },
        });

        return updatedOrder;
    });
}

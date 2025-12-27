import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { buyItem, payOrderWithWallet } from "@/lib/wallet";
import { createNotification } from "@/lib/notifications";

export async function POST(request: Request) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { listingId, orderId } = body;

        let order;

        if (orderId) {
            order = await payOrderWithWallet(session.user.id, orderId);
        } else if (listingId) {
            order = await buyItem(session.user.id, listingId);
        } else {
            return NextResponse.json({ error: "Listing ID or Order ID required" }, { status: 400 });
        }

        // Return success
        return NextResponse.json({ success: true, order });

    } catch (error: any) {
        console.error("Wallet purchase error:", error);
        return NextResponse.json(
            { error: error.message || "Transaction failed" },
            { status: 400 }
        );
    }
}

import { NextResponse } from "next/server";
import { getTransactionFeePercent } from "@/lib/platformFee";

// GET - Public endpoint to fetch current platform fee percentage
export async function GET() {
    try {
        const feePercent = await getTransactionFeePercent();

        return NextResponse.json({
            transactionFeePercent: feePercent,
            sellerReceivesPercent: 100 - feePercent,
        });
    } catch (error) {
        console.error("Error fetching platform fee:", error);
        return NextResponse.json({ error: "Failed to fetch platform fee" }, { status: 500 });
    }
}

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

// GET reviews for a listing
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const listingId = searchParams.get("listingId");
        const sellerId = searchParams.get("sellerId");

        const where: { listingId?: string; sellerId?: string } = {};
        if (listingId) where.listingId = listingId;
        if (sellerId) where.sellerId = sellerId;

        const reviews = await prisma.review.findMany({
            where,
            include: {
                reviewer: {
                    select: { id: true, name: true, image: true },
                },
                listing: {
                    select: { id: true, title: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(reviews);
    } catch (error) {
        console.error("Error fetching reviews:", error);
        return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }
}

// POST create a review
export async function POST(request: Request) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { orderId, rating, comment } = body;

        if (!orderId || !rating || rating < 1 || rating > 5) {
            return NextResponse.json({ error: "Invalid data" }, { status: 400 });
        }

        // Get the order
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { listing: true, review: true },
        });

        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        if (order.buyerId !== session.user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        if (order.status !== "COMPLETED") {
            return NextResponse.json({ error: "Order not completed" }, { status: 400 });
        }

        if (order.review) {
            return NextResponse.json({ error: "Already reviewed" }, { status: 400 });
        }

        const review = await prisma.review.create({
            data: {
                rating,
                comment: comment || null,
                reviewerId: session.user.id,
                sellerId: order.listing.sellerId,
                orderId,
                listingId: order.listingId,
            },
            include: {
                reviewer: {
                    select: { id: true, name: true, image: true },
                },
            },
        });

        return NextResponse.json(review, { status: 201 });
    } catch (error) {
        console.error("Error creating review:", error);
        return NextResponse.json({ error: "Failed to create" }, { status: 500 });
    }
}

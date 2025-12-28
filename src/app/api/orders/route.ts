import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { logActivity, getClientIP, getUserAgent } from "@/lib/auditLog";

// GET user's orders (as buyer)
export async function GET() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const orders = await prisma.order.findMany({
            where: {
                buyerId: session.user.id,
            },
            include: {
                review: {
                    select: { id: true, rating: true },
                },
                listing: {
                    include: {
                        seller: {
                            select: {
                                id: true,
                                name: true,
                                image: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(orders);
    } catch (error) {
        console.error("Error fetching orders:", error);
        return NextResponse.json(
            { error: "Failed to fetch orders" },
            { status: 500 }
        );
    }
}

// POST create a new order
export async function POST(request: Request) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { listingId } = body;

        if (!listingId) {
            return NextResponse.json(
                { error: "Listing ID required" },
                { status: 400 }
            );
        }

        // Check if listing exists
        const listing = await prisma.listing.findUnique({
            where: { id: listingId },
            include: { seller: true },
        });

        if (!listing) {
            return NextResponse.json(
                { error: "Listing not found" },
                { status: 404 }
            );
        }

        // Can't buy your own listing
        if (listing.sellerId === session.user.id) {
            return NextResponse.json(
                { error: "Cannot buy your own listing" },
                { status: 400 }
            );
        }

        // Check if user already has a pending order for this listing
        const existingOrder = await prisma.order.findFirst({
            where: {
                listingId,
                buyerId: session.user.id,
                status: "PENDING",
            },
        });

        if (existingOrder) {
            return NextResponse.json(
                { error: "You already have a pending order for this listing" },
                { status: 400 }
            );
        }

        // Create the order
        const order = await prisma.order.create({
            data: {
                buyerId: session.user.id,
                listingId,
            },
            include: {
                listing: {
                    include: {
                        seller: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        });

        // Log the order creation activity
        logActivity({
            userId: session.user.id,
            actionType: "ORDER_CREATED",
            resourceId: order.id,
            resourceType: "order",
            metadata: {
                listingId: listing.id,
                listingTitle: listing.title,
                price: listing.price,
                sellerId: listing.sellerId,
            },
            ipAddress: getClientIP(request) || undefined,
            userAgent: getUserAgent(request) || undefined,
        });

        return NextResponse.json(order, { status: 201 });
    } catch (error) {
        console.error("Error creating order:", error);
        return NextResponse.json(
            { error: "Failed to create order" },
            { status: 500 }
        );
    }
}

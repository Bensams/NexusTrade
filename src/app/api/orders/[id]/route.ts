import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

// GET single order details
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        const { id } = await params;

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                listing: {
                    include: {
                        seller: {
                            select: { id: true, name: true },
                        },
                    },
                },
                buyer: {
                    select: { id: true, name: true },
                },
            },
        });

        if (!order) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        // Only buyer or seller can view
        if (order.buyerId !== session.user.id && order.listing.sellerId !== session.user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        return NextResponse.json(order);
    } catch (error) {
        console.error("Error fetching order:", error);
        return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }
}

// PATCH update order status
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        const { id } = await params;

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { status } = body;

        if (!status || !["COMPLETED", "CANCELLED"].includes(status)) {
            return NextResponse.json(
                { error: "Invalid status" },
                { status: 400 }
            );
        }

        // Find the order
        const order = await prisma.order.findUnique({
            where: { id },
            include: { listing: true },
        });

        if (!order) {
            return NextResponse.json(
                { error: "Order not found" },
                { status: 404 }
            );
        }

        // Only seller can complete, buyer or seller can cancel
        const isSeller = order.listing.sellerId === session.user.id;
        const isBuyer = order.buyerId === session.user.id;

        if (status === "COMPLETED" && !isSeller) {
            return NextResponse.json(
                { error: "Only seller can complete orders" },
                { status: 403 }
            );
        }

        if (status === "CANCELLED" && !isSeller && !isBuyer) {
            return NextResponse.json(
                { error: "Forbidden" },
                { status: 403 }
            );
        }

        const updatedOrder = await prisma.order.update({
            where: { id },
            data: { status },
            include: {
                listing: true,
                buyer: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        return NextResponse.json(updatedOrder);
    } catch (error) {
        console.error("Error updating order:", error);
        return NextResponse.json(
            { error: "Failed to update order" },
            { status: 500 }
        );
    }
}

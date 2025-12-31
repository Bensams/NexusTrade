import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { deleteCloudinaryImage } from "@/lib/cloudinary";

// GET current user profile with stats
export async function GET() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                bio: true,
                balance: true,
                isSeller: true,
                role: true,
                createdAt: true,
                _count: {
                    select: {
                        listings: true,
                        orders: true,
                    },
                },
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        // Get seller stats if user is a seller
        let sellerStats = null;
        if (user.isSeller) {
            const completedOrders = await prisma.order.count({
                where: {
                    listing: { sellerId: session.user.id },
                    status: "COMPLETED",
                },
            });

            const totalEarnings = await prisma.order.findMany({
                where: {
                    listing: { sellerId: session.user.id },
                    status: "COMPLETED",
                },
                include: { listing: { select: { price: true } } },
            });

            sellerStats = {
                completedSales: completedOrders,
                totalEarnings: totalEarnings.reduce((sum: number, o: { listing: { price: number } }) => sum + o.listing.price, 0),
            };
        }

        return NextResponse.json({
            ...user,
            sellerStats,
        });
    } catch (error) {
        console.error("Error fetching profile:", error);
        return NextResponse.json(
            { error: "Failed to fetch profile" },
            { status: 500 }
        );
    }
}

// PATCH update user profile
export async function PATCH(request: Request) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { name, bio, image } = body;

        if (!name || name.trim().length === 0) {
            return NextResponse.json(
                { error: "Name is required" },
                { status: 400 }
            );
        }

        // Get current user to check for existing image
        const currentUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { image: true },
        });

        // Delete old image from Cloudinary if it's being replaced
        if (currentUser?.image && image && currentUser.image !== image) {
            // Delete asynchronously (don't block the response)
            deleteCloudinaryImage(currentUser.image).catch(err =>
                console.error("Failed to delete old profile image:", err)
            );
        }

        const user = await prisma.user.update({
            where: { id: session.user.id },
            data: {
                name: name.trim(),
                bio: bio?.trim() || null,
                image: image || null,
            },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                bio: true,
            },
        });

        return NextResponse.json(user);
    } catch (error) {
        console.error("Error updating profile:", error);
        return NextResponse.json(
            { error: "Failed to update profile" },
            { status: 500 }
        );
    }
}

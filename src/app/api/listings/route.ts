import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

// GET all listings
export async function GET() {
    try {
        const listings = await prisma.listing.findMany({
            include: {
                seller: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(listings);
    } catch (error) {
        console.error("Error fetching listings:", error);
        return NextResponse.json(
            { error: "Failed to fetch listings" },
            { status: 500 }
        );
    }
}

// POST create a new listing
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
        const { title, description, price, type, game, imageUrl } = body;

        if (!title || !description || !price || !type || !game) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Update user to be a seller if not already
        await prisma.user.update({
            where: { id: session.user.id },
            data: { isSeller: true },
        });

        // Create the listing
        const listing = await prisma.listing.create({
            data: {
                title,
                description,
                price: parseFloat(price),
                type,
                game,
                imageUrl: imageUrl || null,
                sellerId: session.user.id,
            },
            include: {
                seller: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                    },
                },
            },
        });

        return NextResponse.json(listing, { status: 201 });
    } catch (error) {
        console.error("Error creating listing:", error);
        return NextResponse.json(
            { error: "Failed to create listing" },
            { status: 500 }
        );
    }
}

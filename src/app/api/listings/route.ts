import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { logActivity, getClientIP, getUserAgent } from "@/lib/auditLog";

// GET all listings
export async function GET() {
    try {
        const listings = await prisma.listing.findMany({
            where: {
                isBanned: false, // Hide banned listings from marketplace
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
        const { title, description, price, type: itemCategory, game, images } = body;

        if (!title || !description || !price || !itemCategory || !game) {
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
        // Note: Prisma type field expects ListingType enum (ITEM or SERVICE)
        // The form sends item category names (Accounts, Skins, etc.), so we default to ITEM
        const listing = await prisma.listing.create({
            data: {
                title,
                description,
                price: parseFloat(price),
                type: "ITEM", // Default to ITEM type
                game: `${game} - ${itemCategory}`, // Include category in game field
                images: images || [],
                imageUrl: images?.[0] || null,
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

        // Log the listing creation activity
        logActivity({
            userId: session.user.id,
            actionType: "LISTING_CREATED",
            resourceId: listing.id,
            resourceType: "listing",
            metadata: {
                title: listing.title,
                price: listing.price,
                type: listing.type,
                game: listing.game,
            },
            ipAddress: getClientIP(request) || undefined,
            userAgent: getUserAgent(request) || undefined,
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

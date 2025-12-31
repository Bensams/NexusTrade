import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { logActivity, getClientIP, getUserAgent } from "@/lib/auditLog";

// GET all conversations for current user
export async function GET() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const conversations = await prisma.conversation.findMany({
            where: {
                participants: {
                    some: { userId: session.user.id },
                },
            },
            include: {
                participants: {
                    include: {
                        user: {
                            select: { id: true, name: true, image: true },
                        },
                    },
                },
                messages: {
                    orderBy: { createdAt: "desc" },
                    take: 1,
                },
                listing: {
                    select: {
                        id: true,
                        title: true,
                        price: true,
                        imageUrl: true,
                        game: true,
                        sellerId: true,
                    },
                },
                order: {
                    select: {
                        id: true,
                        status: true,
                        deliveryProof: true,
                        buyerId: true,
                        completedAt: true,
                    },
                },
            },
            orderBy: { updatedAt: "desc" },
        });

        // Format response with other participant info and unread count
        const formatted = conversations.map((conv) => {
            const otherParticipant = conv.participants.find(
                (p) => p.userId !== session.user!.id
            );
            const myParticipant = conv.participants.find(
                (p) => p.userId === session.user!.id
            );

            // Count unread messages (messages after lastReadAt)
            const lastReadAt = myParticipant?.lastReadAt || new Date(0);
            const lastMessage = conv.messages[0];
            const hasUnread = lastMessage &&
                new Date(lastMessage.createdAt) > new Date(lastReadAt) &&
                lastMessage.senderId !== session.user!.id;

            return {
                id: conv.id,
                otherUser: otherParticipant?.user,
                lastMessage: lastMessage || null,
                updatedAt: conv.updatedAt,
                hasUnread: !!hasUnread,
                listing: conv.listing,
                order: conv.order,
            };
        });

        return NextResponse.json(formatted);
    } catch (error) {
        console.error("Error fetching conversations:", error);
        return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }
}

// POST create or get existing conversation
export async function POST(request: Request) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { recipientId, listingId } = body;

        if (!recipientId || recipientId === session.user.id) {
            return NextResponse.json({ error: "Invalid recipient" }, { status: 400 });
        }

        // Check if conversation already exists (with same participants and listing)
        const existing = await prisma.conversation.findFirst({
            where: {
                AND: [
                    { participants: { some: { userId: session.user.id } } },
                    { participants: { some: { userId: recipientId } } },
                    ...(listingId ? [{ listingId }] : [{ listingId: null }]),
                ],
            },
        });

        if (existing) {
            return NextResponse.json({ conversationId: existing.id });
        }

        // Fetch recipient info for audit log (non-sensitive metadata)
        const recipient = await prisma.user.findUnique({
            where: { id: recipientId },
            select: { id: true, name: true },
        });

        // Fetch listing info if provided
        const listing = listingId ? await prisma.listing.findUnique({
            where: { id: listingId },
            select: { id: true, title: true },
        }) : null;

        // Create new conversation with optional listing context
        const conversation = await prisma.conversation.create({
            data: {
                listingId: listingId || null,
                participants: {
                    create: [
                        { userId: session.user.id },
                        { userId: recipientId },
                    ],
                },
            },
        });

        // Log the chat initiation activity (only metadata, no message content)
        logActivity({
            userId: session.user.id,
            actionType: "CHAT_INITIATED",
            resourceId: conversation.id,
            resourceType: "conversation",
            metadata: {
                recipientId: recipient?.id,
                recipientName: recipient?.name,
                listingId: listing?.id,
                listingTitle: listing?.title,
            },
            ipAddress: getClientIP(request) || undefined,
            userAgent: getUserAgent(request) || undefined,
        });

        return NextResponse.json({ conversationId: conversation.id }, { status: 201 });
    } catch (error) {
        console.error("Error creating conversation:", error);
        return NextResponse.json({ error: "Failed to create" }, { status: 500 });
    }
}

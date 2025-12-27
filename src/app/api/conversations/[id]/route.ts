import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { emitNewMessage } from "@/lib/socketServer";

// GET messages for a conversation
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

        // Verify user is participant
        const participant = await prisma.conversationParticipant.findUnique({
            where: {
                userId_conversationId: {
                    userId: session.user.id,
                    conversationId: id,
                },
            },
        });

        if (!participant) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const messages = await prisma.message.findMany({
            where: { conversationId: id },
            include: {
                sender: {
                    select: { id: true, name: true, image: true },
                },
            },
            orderBy: { createdAt: "asc" },
        });

        // Update last read
        await prisma.conversationParticipant.update({
            where: { id: participant.id },
            data: { lastReadAt: new Date() },
        });

        return NextResponse.json(messages);
    } catch (error) {
        console.error("Error fetching messages:", error);
        return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }
}

// POST send a message
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        const { id } = await params;

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { content } = body;

        if (!content || content.trim().length === 0) {
            return NextResponse.json({ error: "Message required" }, { status: 400 });
        }

        // Verify user is participant
        const participant = await prisma.conversationParticipant.findUnique({
            where: {
                userId_conversationId: {
                    userId: session.user.id,
                    conversationId: id,
                },
            },
        });

        if (!participant) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const message = await prisma.message.create({
            data: {
                content: content.trim(),
                senderId: session.user.id,
                conversationId: id,
            },
            include: {
                sender: {
                    select: { id: true, name: true, image: true },
                },
            },
        });

        // Update conversation timestamp
        await prisma.conversation.update({
            where: { id },
            data: { updatedAt: new Date() },
        });

        // Emit message via Socket.io for real-time delivery
        emitNewMessage(id, {
            id: message.id,
            content: message.content,
            createdAt: message.createdAt.toISOString(),
            sender: message.sender,
        });

        // Get other participants to notify them
        const participants = await prisma.conversationParticipant.findMany({
            where: {
                conversationId: id,
                userId: {
                    not: session.user.id
                }
            }
        });

        // Import the new function dynamically or use the import if added to top
        const { emitMessageToUser } = await import("@/lib/socketServer");

        participants.forEach(p => {
            emitMessageToUser(p.userId, {
                id: message.id,
                content: message.content,
                createdAt: message.createdAt.toISOString(),
                sender: message.sender,
            });
        });

        return NextResponse.json(message, { status: 201 });
    } catch (error) {
        console.error("Error sending message:", error);
        return NextResponse.json({ error: "Failed to send" }, { status: 500 });
    }
}

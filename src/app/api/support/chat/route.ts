import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

export async function POST() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 1. Find an Admin user
        // We'll take the first one we find. In a more complex app, you might have a specific "Support" admin or round-robin logic.
        const adminUser = await prisma.user.findFirst({
            where: {
                isAdmin: true,
            },
            select: {
                id: true,
                name: true,
            },
        });

        if (!adminUser) {
            return NextResponse.json({ error: "No admin support agents available" }, { status: 404 });
        }

        if (adminUser.id === session.user.id) {
            return NextResponse.json({ error: "You are the admin" }, { status: 400 });
        }

        // 2. Check for existing conversation
        const existingConversation = await prisma.conversation.findFirst({
            where: {
                AND: [
                    { participants: { some: { userId: session.user.id } } },
                    { participants: { some: { userId: adminUser.id } } },
                    { listingId: null }, // General support chat (not linked to a specific listing)
                    { orderId: null },   // Not linked to a specific order
                ],
            },
            select: {
                id: true,
            },
        });

        if (existingConversation) {
            return NextResponse.json({ conversationId: existingConversation.id });
        }

        // 3. Create new conversation if none exists
        const newConversation = await prisma.conversation.create({
            data: {
                participants: {
                    create: [
                        { userId: session.user.id },
                        { userId: adminUser.id },
                    ],
                },
            },
            select: {
                id: true,
            },
        });

        return NextResponse.json({ conversationId: newConversation.id });

    } catch (error) {
        console.error("Error in support chat creation:", error);
        return NextResponse.json(
            { error: "Failed to start support chat" },
            { status: 500 }
        );
    }
}

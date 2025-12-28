import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

export async function POST() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 1. Find an available support agent (isSupportAgent = true AND ADMIN/MODERATOR/SUPER_ADMIN)
        let supportAgent = await prisma.user.findFirst({
            where: {
                isSupportAgent: true,
                role: { in: ["SUPER_ADMIN", "ADMIN", "MODERATOR"] },
                id: { not: session.user.id }, // Don't connect user to themselves
            },
            select: {
                id: true,
                name: true,
            },
            // Random-ish selection by ordering by different field each time
            orderBy: { createdAt: "asc" },
        });

        // Fallback: If no designated support agent, find any admin as backup
        if (!supportAgent) {
            supportAgent = await prisma.user.findFirst({
                where: {
                    role: { in: ["SUPER_ADMIN", "ADMIN"] },
                    id: { not: session.user.id },
                },
                select: {
                    id: true,
                    name: true,
                },
            });
        }

        if (!supportAgent) {
            return NextResponse.json({ error: "No support agents available" }, { status: 404 });
        }

        // 2. Check for existing conversation with this support agent
        const existingConversation = await prisma.conversation.findFirst({
            where: {
                AND: [
                    { participants: { some: { userId: session.user.id } } },
                    { participants: { some: { userId: supportAgent.id } } },
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
                        { userId: supportAgent.id },
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


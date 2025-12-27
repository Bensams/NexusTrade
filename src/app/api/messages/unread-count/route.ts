import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Efficient raw SQL query to count unread messages
        const result = await prisma.$queryRaw<{ count: number }[]>`
      SELECT COUNT(*)::int
      FROM "Message" m
      JOIN "ConversationParticipant" cp ON m."conversationId" = cp."conversationId"
      WHERE cp."userId" = ${session.user.id}
        AND m."senderId" != ${session.user.id}
        AND m."createdAt" > cp."lastReadAt"
    `;

        const count = result[0]?.count || 0;



        return NextResponse.json({ count });
    } catch (error) {
        console.error("Error fetching unread message count:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

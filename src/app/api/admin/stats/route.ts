import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getOnlineUserCount } from "@/lib/socketServer";
import { requireRole } from "@/lib/roleAuth";

// GET /api/admin/stats - Get admin dashboard statistics
export async function GET() {
    try {
        const result = await requireRole("ADMIN");
        if ("error" in result) return result.error;

        // Get today's date at midnight (UTC)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get start of this week (Sunday)
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());

        // Parallel queries for all stats
        const [
            totalUsers,
            newUsersToday,
            visitsToday,
            visitsThisWeek,
        ] = await Promise.all([
            // Total registered users
            prisma.user.count(),

            // Users registered today
            prisma.user.count({
                where: {
                    createdAt: { gte: today },
                },
            }),

            // Unique visits today
            prisma.siteVisit.count({
                where: {
                    date: today,
                },
            }),

            // Unique visits this week
            prisma.siteVisit.count({
                where: {
                    date: { gte: weekStart },
                },
            }),
        ]);

        // Get online count from Socket.io (may be 0 if not initialized)
        const onlineUsers = getOnlineUserCount();

        return NextResponse.json({
            onlineUsers,
            totalUsers,
            newUsersToday,
            visitsToday,
            visitsThisWeek,
        });
    } catch (error) {
        console.error("Error fetching admin stats:", error);
        return NextResponse.json(
            { error: "Failed to fetch stats" },
            { status: 500 }
        );
    }
}

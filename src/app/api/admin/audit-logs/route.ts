import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { ActionType } from "@prisma/client";
import { requireRole } from "@/lib/roleAuth";

// GET /api/admin/audit-logs - Fetch audit logs with optional filtering
export async function GET(request: Request) {
    try {
        const result = await requireRole("ADMIN");
        if ("error" in result) return result.error;

        // Parse query parameters
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");
        const actionType = searchParams.get("actionType");
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);
        const skip = (page - 1) * limit;

        // Build filter conditions
        const where: {
            userId?: string;
            actionType?: ActionType;
        } = {};

        if (userId) {
            where.userId = userId;
        }

        if (actionType && Object.values(ActionType).includes(actionType as ActionType)) {
            where.actionType = actionType as ActionType;
        }

        // Fetch audit logs
        const [logs, totalCount] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            image: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            prisma.auditLog.count({ where }),
        ]);

        return NextResponse.json({
            logs,
            pagination: {
                page,
                limit,
                totalCount,
                totalPages: Math.ceil(totalCount / limit),
            },
            actionTypes: Object.values(ActionType), // For filter dropdown
        });
    } catch (error) {
        console.error("Error fetching audit logs:", error);
        return NextResponse.json(
            { error: "Failed to fetch audit logs" },
            { status: 500 }
        );
    }
}

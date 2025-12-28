import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db";
import { isIPBlacklisted } from "@/lib/banCheck";
import { getClientIP } from "@/lib/auditLog";

export async function POST(request: Request) {
    try {
        // Check if IP is banned FIRST (before any other logic to save resources)
        const clientIP = getClientIP(request);
        if (clientIP) {
            const banCheck = await isIPBlacklisted(clientIP);
            if (banCheck.banned) {
                return NextResponse.json(
                    { error: banCheck.message || "Registration not allowed" },
                    { status: 403 }
                );
            }
        }

        const body = await request.json();
        const { name, email, password } = body;

        if (!name || !email || !password) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: "User already exists" },
                { status: 400 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
            },
        });

        return NextResponse.json(
            {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Registration error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

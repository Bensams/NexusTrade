import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// POST - Generate signed upload parameters
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

        // The widget sends params wrapped in paramsToSign object
        const paramsToSign = body.paramsToSign || body;

        // Generate signature using Cloudinary SDK
        const signature = cloudinary.utils.api_sign_request(
            paramsToSign,
            process.env.CLOUDINARY_API_SECRET!
        );

        return NextResponse.json({
            signature,
        });
    } catch (error) {
        console.error("Error generating Cloudinary signature:", error);
        return NextResponse.json(
            { error: "Failed to generate upload signature" },
            { status: 500 }
        );
    }
}

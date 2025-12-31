import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    output: "standalone",
    eslint: {
        // Warning: This allows production builds to successfully complete even if
        // your project has ESLint errors. Use only if necessary.
        ignoreDuringBuilds: true, // Set to true to ignore ESLint errors during builds
    },
    typescript: {
        // Warning: This allows production builds to successfully complete even if
        // your project has type errors. Use only if necessary.
        ignoreBuildErrors: true,
    },
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "images.unsplash.com",
            },
            {
                protocol: "https",
                hostname: "lh3.googleusercontent.com",
            },
            {
                protocol: "https",
                hostname: "tr.rbxcdn.com",
            },
            {
                protocol: "https",
                hostname: "res.cloudinary.com",
            },
        ],
    },
};

export default nextConfig;

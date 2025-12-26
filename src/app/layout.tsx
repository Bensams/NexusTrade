import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";

export const metadata: Metadata = {
    title: "NexusTrade - Gaming Marketplace",
    description: "Safe trading for Roblox, Valorant, and more. Buy and sell boosting services and items.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="dark">
            <body className="min-h-screen bg-zinc-950 antialiased">
                <AuthProvider>{children}</AuthProvider>
            </body>
        </html>
    );
}

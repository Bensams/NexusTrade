"use client";

import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";

interface Conversation {
    id: string;
    otherUser: {
        id: string;
        name: string | null;
        image: string | null;
    } | null;
    lastMessage: {
        content: string;
        createdAt: string;
    } | null;
    updatedAt: string;
    hasUnread: boolean;
    listing?: {
        id: string;
        title: string;
        price: number;
        imageUrl: string | null;
        game: string;
    } | null;
    order?: {
        id: string;
        status: string;
    } | null;
}

function MessagesContent() {
    const { data: session, status } = useSession();
    const searchParams = useSearchParams();
    const router = useRouter();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const orderId = searchParams?.get("orderId");

    useEffect(() => {
        if (session) {
            fetchConversations();
        }
    }, [session]);

    // Auto-redirect to conversation if orderId is provided
    useEffect(() => {
        if (orderId && conversations.length > 0) {
            const matchingConversation = conversations.find(
                (conv) => conv.order?.id === orderId
            );
            if (matchingConversation) {
                router.replace(`/messages/${matchingConversation.id}`);
            }
        }
    }, [orderId, conversations, router]);

    const fetchConversations = async () => {
        try {
            const res = await fetch("/api/conversations");
            if (res.ok) {
                const data = await res.json();
                setConversations(data);
            }
        } catch (error) {
            console.error("Error fetching conversations:", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (status === "loading" || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!session) {
        return (
            <div className="min-h-screen">
                <Navbar />
                <div className="pt-32 text-center">
                    <h1 className="text-2xl font-bold text-white mb-4">Sign in required</h1>
                    <Link
                        href="/login"
                        className="px-6 py-3 bg-gradient-to-r from-primary to-accent text-white font-medium rounded-xl"
                    >
                        Sign In
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <Navbar />

            <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-2xl mx-auto">
                    <h1 className="text-3xl font-bold text-white mb-2">Messages</h1>
                    <p className="text-zinc-400 mb-8">Your conversations</p>

                    {conversations.length === 0 ? (
                        <div className="glass rounded-2xl p-12 text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-800 flex items-center justify-center">
                                <svg className="w-8 h-8 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">No messages yet</h3>
                            <p className="text-zinc-400">Start a conversation by messaging a seller</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {conversations.map((conv) => (
                                <Link
                                    key={conv.id}
                                    href={`/messages/${conv.id}`}
                                    className="flex items-center gap-4 p-4 glass rounded-xl hover:bg-white/5 transition-colors"
                                >
                                    {conv.otherUser?.image ? (
                                        <Image
                                            src={conv.otherUser.image}
                                            alt={conv.otherUser.name || "User"}
                                            width={48}
                                            height={48}
                                            className="w-12 h-12 rounded-full"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                                            <span className="text-lg font-bold text-white">
                                                {conv.otherUser?.name?.charAt(0).toUpperCase() || "?"}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <p className={`font-medium ${conv.hasUnread ? "text-white font-bold" : "text-white"}`}>
                                                {conv.otherUser?.name || "Unknown"}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                {conv.hasUnread && (
                                                    <span className="w-2 h-2 rounded-full bg-primary" />
                                                )}
                                                {conv.lastMessage && (
                                                    <span className="text-xs text-zinc-500">
                                                        {new Date(conv.lastMessage.createdAt).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {conv.listing && (
                                            <p className="text-xs text-primary truncate">
                                                {conv.listing.title}
                                            </p>
                                        )}
                                        {conv.lastMessage && (
                                            <p className={`text-sm truncate ${conv.hasUnread ? "text-zinc-200 font-medium" : "text-zinc-400"}`}>
                                                {conv.lastMessage.content}
                                            </p>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function MessagesPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <MessagesContent />
        </Suspense>
    );
}

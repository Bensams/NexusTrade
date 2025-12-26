"use client";

import { useState, useEffect, useRef, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import TransactionCard from "@/components/TransactionCard";

interface Message {
    id: string;
    content: string;
    createdAt: string;
    sender: {
        id: string;
        name: string | null;
        image: string | null;
    };
}

interface ConversationContext {
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

interface Conversation {
    id: string;
    otherUser: {
        id: string;
        name: string | null;
        image: string | null;
    } | null;
    listing?: ConversationContext["listing"];
    order?: ConversationContext["order"];
}

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { data: session, status } = useSession();
    const router = useRouter();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [otherUser, setOtherUser] = useState<Conversation["otherUser"]>(null);
    const [context, setContext] = useState<ConversationContext>({});
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (session) {
            fetchMessages();
            fetchConversationInfo();
        }
    }, [session, id]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const fetchConversationInfo = async () => {
        try {
            const res = await fetch("/api/conversations");
            if (res.ok) {
                const convs = await res.json();
                const conv = convs.find((c: Conversation) => c.id === id);
                if (conv) {
                    setOtherUser(conv.otherUser);
                    setContext({
                        listing: conv.listing,
                        order: conv.order,
                    });
                }
            }
        } catch (error) {
            console.error("Error:", error);
        }
    };

    const fetchMessages = async () => {
        try {
            const res = await fetch(`/api/conversations/${id}`);
            if (res.ok) {
                const data = await res.json();
                setMessages(data);
            } else if (res.status === 403) {
                router.push("/messages");
            }
        } catch (error) {
            console.error("Error fetching messages:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || isSending) return;

        setIsSending(true);
        try {
            const res = await fetch(`/api/conversations/${id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: newMessage }),
            });

            if (res.ok) {
                const message = await res.json();
                setMessages([...messages, message]);
                setNewMessage("");
            }
        } catch (error) {
            console.error("Error sending message:", error);
        } finally {
            setIsSending(false);
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
        router.push("/login");
        return null;
    }

    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />

            <div className="flex-1 flex flex-col pt-16 max-w-3xl mx-auto w-full">
                {/* Transaction Context Card */}
                {context.listing && (
                    <TransactionCard listing={context.listing} order={context.order} />
                )}

                {/* Chat Header */}
                <div className="glass border-b border-white/10 p-4 flex items-center gap-3">
                    <Link href="/messages" className="text-zinc-400 hover:text-white">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </Link>
                    {otherUser?.image ? (
                        <Image
                            src={otherUser.image}
                            alt={otherUser.name || "User"}
                            width={40}
                            height={40}
                            className="w-10 h-10 rounded-full"
                        />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                            <span className="font-bold text-white">
                                {otherUser?.name?.charAt(0).toUpperCase() || "?"}
                            </span>
                        </div>
                    )}
                    <div>
                        <p className="font-medium text-white">{otherUser?.name || "Loading..."}</p>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 ? (
                        <div className="text-center text-zinc-500 py-8">
                            No messages yet. Say hello!
                        </div>
                    ) : (
                        messages.map((msg) => {
                            const isOwn = msg.sender.id === session.user?.id;
                            return (
                                <div
                                    key={msg.id}
                                    className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                                >
                                    <div
                                        className={`max-w-[75%] rounded-2xl px-4 py-2 ${isOwn
                                            ? "bg-gradient-to-r from-primary to-accent text-white"
                                            : "glass text-zinc-200"
                                            }`}
                                    >
                                        <p>{msg.content}</p>
                                        <p className={`text-xs mt-1 ${isOwn ? "text-white/70" : "text-zinc-500"}`}>
                                            {new Date(msg.createdAt).toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <form onSubmit={handleSend} className="p-4 glass border-t border-white/10">
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 px-4 py-3 rounded-xl bg-zinc-900/80 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-primary/50"
                        />
                        <button
                            type="submit"
                            disabled={!newMessage.trim() || isSending}
                            className="px-6 py-3 rounded-xl font-medium text-white bg-gradient-to-r from-primary to-accent hover:opacity-90 disabled:opacity-50"
                        >
                            {isSending ? "..." : "Send"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

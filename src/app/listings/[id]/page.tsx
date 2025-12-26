"use client";

import { useState, useEffect, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import { PageSkeleton } from "@/components/Skeleton";

interface Listing {
    id: string;
    title: string;
    description: string;
    price: number;
    originalPrice: number | null;
    type: "ITEM" | "SERVICE";
    game: string;
    imageUrl: string | null;
    createdAt: string;
    seller: {
        id: string;
        name: string | null;
        image: string | null;
        createdAt: string;
        rating: number;
        totalReviews: number;
    };
    _count: {
        orders: number;
    };
}

const GAME_IMAGES: Record<string, string> = {
    Roblox: "https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=800&h=400&fit=crop",
    Valorant: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=400&fit=crop",
    CS2: "https://images.unsplash.com/photo-1552820728-8b83bb6b2b0a?w=800&h=400&fit=crop",
    Fortnite: "https://images.unsplash.com/photo-1589241062272-c0a000072dfa?w=800&h=400&fit=crop",
    "League of Legends": "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&h=400&fit=crop",
    "Apex Legends": "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&h=400&fit=crop",
};

export default function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { data: session } = useSession();
    const router = useRouter();
    const [listing, setListing] = useState<Listing | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isOrdering, setIsOrdering] = useState(false);
    const [isMessaging, setIsMessaging] = useState(false);
    const [error, setError] = useState("");
    const [orderSuccess, setOrderSuccess] = useState(false);

    useEffect(() => {
        fetchListing();
    }, [id]);

    const fetchListing = async () => {
        try {
            const res = await fetch(`/api/listings/${id}`);
            if (res.ok) {
                const data = await res.json();
                setListing(data);
            } else {
                setError("Listing not found");
            }
        } catch {
            setError("Failed to load listing");
        } finally {
            setIsLoading(false);
        }
    };

    const handleBuyNow = async () => {
        if (!session) {
            router.push("/login");
            return;
        }

        setIsOrdering(true);
        setError("");

        try {
            const res = await fetch("/api/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ listingId: id }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Failed to create order");
                return;
            }

            setOrderSuccess(true);
            setTimeout(() => {
                router.push(`/checkout/${data.id}`);
            }, 1000);
        } catch {
            setError("Something went wrong");
        } finally {
            setIsOrdering(false);
        }
    };

    const handleMessageSeller = async () => {
        if (!session) {
            router.push("/login");
            return;
        }

        if (!listing) return;

        setIsMessaging(true);
        try {
            const res = await fetch("/api/conversations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    recipientId: listing.seller.id,
                    listingId: listing.id
                }),
            });

            if (res.ok) {
                const data = await res.json();
                router.push(`/messages/${data.conversationId}`);
            } else {
                console.error("Failed to create conversation");
            }
        } catch (err) {
            console.error("Error creating conversation:", err);
        } finally {
            setIsMessaging(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen">
                <Navbar />
                <PageSkeleton type="listing-detail" />
            </div>
        );
    }

    if (error && !listing) {
        return (
            <div className="min-h-screen">
                <Navbar />
                <div className="pt-32 text-center">
                    <h1 className="text-2xl font-bold text-white mb-4">{error}</h1>
                    <Link href="/" className="text-primary hover:underline">
                        Back to Home
                    </Link>
                </div>
            </div>
        );
    }

    if (!listing) return null;

    const isOwner = session?.user?.id === listing.seller.id;
    const imageUrl = listing.imageUrl || GAME_IMAGES[listing.game] || GAME_IMAGES.Roblox;

    return (
        <div className="min-h-screen">
            <Navbar />

            <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-6xl mx-auto">
                    {/* Breadcrumb */}
                    <nav className="mb-6 text-sm">
                        <Link href="/" className="text-zinc-400 hover:text-white">
                            Home
                        </Link>
                        <span className="mx-2 text-zinc-600">/</span>
                        <span className="text-zinc-300">{listing.title}</span>
                    </nav>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Image */}
                            <div className="glass rounded-2xl overflow-hidden">
                                <div
                                    className="w-full h-64 sm:h-80 bg-cover bg-center"
                                    style={{ backgroundImage: `url(${imageUrl})` }}
                                />
                            </div>

                            {/* Details */}
                            <div className="glass rounded-2xl p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <span
                                        className={`px-3 py-1 text-sm font-medium rounded-lg ${listing.type === "SERVICE"
                                            ? "bg-primary/20 text-primary"
                                            : "bg-accent/20 text-accent"
                                            }`}
                                    >
                                        {listing.type}
                                    </span>
                                    <span className="px-3 py-1 text-sm font-medium rounded-lg bg-zinc-800 text-zinc-300">
                                        {listing.game}
                                    </span>
                                </div>

                                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                                    {listing.title}
                                </h1>

                                <div className="prose prose-invert max-w-none">
                                    <p className="text-zinc-300 whitespace-pre-wrap">
                                        {listing.description}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Price Card */}
                            <div className="glass rounded-2xl p-6 sticky top-24">
                                <div className="mb-6">
                                    {listing.originalPrice && listing.originalPrice > listing.price && (
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-lg text-zinc-500 line-through">₱{listing.originalPrice.toFixed(2)}</span>
                                            <span className="px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded">SALE</span>
                                        </div>
                                    )}
                                    <div className={`text-3xl font-bold ${listing.originalPrice && listing.originalPrice > listing.price ? "text-green-400" : "gradient-text"}`}>
                                        ₱{listing.price.toFixed(2)}
                                    </div>
                                </div>

                                {orderSuccess ? (
                                    <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-center mb-4">
                                        Order placed! Redirecting...
                                    </div>
                                ) : error ? (
                                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center mb-4">
                                        {error}
                                    </div>
                                ) : null}

                                {isOwner ? (
                                    <div className="text-center text-zinc-400 py-4">
                                        This is your listing
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleBuyNow}
                                        disabled={isOrdering || orderSuccess}
                                        className="w-full py-3 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity disabled:opacity-50 glow-purple"
                                    >
                                        {isOrdering ? "Processing..." : "Buy Now"}
                                    </button>
                                )}

                                <p className="text-xs text-zinc-500 text-center mt-4">
                                    {listing._count.orders} orders placed
                                </p>
                            </div>

                            {/* Seller Card */}
                            <div className="glass rounded-2xl p-6">
                                <h3 className="text-sm font-medium text-zinc-400 mb-4">Seller</h3>
                                <Link href={`/seller/${listing.seller.id}`} className="flex items-center gap-3 mb-4 group">
                                    {listing.seller.image ? (
                                        <Image
                                            src={listing.seller.image}
                                            alt={listing.seller.name || "Seller"}
                                            width={48}
                                            height={48}
                                            className="w-12 h-12 rounded-full"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                                            <span className="text-lg font-bold text-white">
                                                {listing.seller.name?.charAt(0).toUpperCase() || "S"}
                                            </span>
                                        </div>
                                    )}
                                    <div>
                                        <p className="font-medium text-white group-hover:text-primary transition-colors">{listing.seller.name}</p>
                                        <p className="text-sm text-zinc-400">
                                            Member since {new Date(listing.seller.createdAt).toLocaleDateString()}
                                        </p>
                                        {listing.seller.totalReviews > 0 && (
                                            <div className="flex items-center gap-1 mt-1">
                                                <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                </svg>
                                                <span className="text-sm font-medium text-yellow-400">{listing.seller.rating.toFixed(1)}</span>
                                                <span className="text-sm text-zinc-500">({listing.seller.totalReviews} reviews)</span>
                                            </div>
                                        )}
                                    </div>
                                </Link>
                                <div className="space-y-2">
                                    <Link
                                        href={`/seller/${listing.seller.id}`}
                                        className="w-full py-2 px-4 rounded-lg font-medium text-zinc-300 border border-white/10 hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
                                    >
                                        View Profile
                                    </Link>
                                    {!isOwner && (
                                        <button
                                            onClick={handleMessageSeller}
                                            disabled={isMessaging}
                                            className="w-full py-2 px-4 rounded-lg font-medium text-primary border border-primary/30 hover:bg-primary/10 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                            </svg>
                                            {isMessaging ? "Opening..." : "Message Seller"}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

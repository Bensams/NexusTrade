"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import ListingCard from "@/components/ListingCard";
import { PageSkeleton } from "@/components/Skeleton";

interface SellerProfile {
    id: string;
    name: string | null;
    image: string | null;
    isSeller: boolean;
    createdAt: string;
    listings: {
        id: string;
        title: string;
        description: string;
        price: number;
        originalPrice: number | null;
        type: "ITEM" | "SERVICE";
        game: string;
        imageUrl: string | null;
        createdAt: string;
    }[];
    reviewsReceived: {
        id: string;
        rating: number;
        comment: string | null;
        createdAt: string;
        reviewer: {
            id: string;
            name: string | null;
            image: string | null;
        };
        listing: {
            id: string;
            title: string;
        };
    }[];
    stats: {
        totalListings: number;
        totalReviews: number;
        averageRating: number;
        totalSales: number;
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

function StarDisplay({ rating }: { rating: number }) {
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <svg
                    key={star}
                    className={`w-4 h-4 ${star <= rating ? "text-yellow-400" : "text-zinc-600"}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            ))}
        </div>
    );
}

export default function SellerProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [seller, setSeller] = useState<SellerProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState<"listings" | "reviews">("listings");

    useEffect(() => {
        const fetchSeller = async () => {
            try {
                const res = await fetch(`/api/seller/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    setSeller(data);
                } else {
                    setError("Seller not found");
                }
            } catch {
                setError("Failed to load seller profile");
            } finally {
                setIsLoading(false);
            }
        };

        fetchSeller();
    }, [id]);

    if (isLoading) {
        return (
            <div className="min-h-screen">
                <Navbar />
                <PageSkeleton type="profile" />
            </div>
        );
    }

    if (error || !seller) {
        return (
            <div className="min-h-screen">
                <Navbar />
                <div className="pt-32 text-center">
                    <h1 className="text-2xl font-bold text-white mb-4">Seller Not Found</h1>
                    <p className="text-zinc-400 mb-6">The seller you&apos;re looking for doesn&apos;t exist.</p>
                    <Link
                        href="/"
                        className="px-6 py-3 bg-gradient-to-r from-primary to-accent text-white font-medium rounded-xl"
                    >
                        Back to Home
                    </Link>
                </div>
            </div>
        );
    }

    const memberSince = new Date(seller.createdAt).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
    });

    return (
        <div className="min-h-screen">
            <Navbar />

            <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-6xl mx-auto">
                    {/* Seller Header */}
                    <div className="glass rounded-2xl p-6 sm:p-8 mb-8">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                            {/* Avatar */}
                            {seller.image ? (
                                <Image
                                    src={seller.image}
                                    alt={seller.name || "Seller"}
                                    width={120}
                                    height={120}
                                    className="rounded-2xl"
                                />
                            ) : (
                                <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                                    <span className="text-4xl font-bold text-white">
                                        {(seller.name || "S").charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            )}

                            {/* Info */}
                            <div className="flex-1 text-center sm:text-left">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2">
                                    <h1 className="text-2xl sm:text-3xl font-bold text-white">
                                        {seller.name || "Anonymous Seller"}
                                    </h1>
                                    {seller.isSeller && (
                                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-500/20 text-green-400 text-sm font-medium rounded-full">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                            Verified Seller
                                        </span>
                                    )}
                                </div>
                                <p className="text-zinc-400 mb-4">Member since {memberSince}</p>

                                {/* Stats */}
                                <div className="flex flex-wrap justify-center sm:justify-start gap-6">
                                    <div className="text-center sm:text-left">
                                        <div className="text-2xl font-bold text-white">{seller.stats.totalListings}</div>
                                        <div className="text-sm text-zinc-400">Listings</div>
                                    </div>
                                    <div className="text-center sm:text-left">
                                        <div className="text-2xl font-bold text-white">{seller.stats.totalSales}</div>
                                        <div className="text-sm text-zinc-400">Sales</div>
                                    </div>
                                    <div className="text-center sm:text-left">
                                        <div className="flex items-center gap-1">
                                            <span className="text-2xl font-bold text-yellow-400">
                                                {seller.stats.averageRating.toFixed(1)}
                                            </span>
                                            <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                        </div>
                                        <div className="text-sm text-zinc-400">{seller.stats.totalReviews} Reviews</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 mb-6">
                        <button
                            onClick={() => setActiveTab("listings")}
                            className={`px-6 py-3 font-medium rounded-xl transition-colors ${activeTab === "listings"
                                    ? "bg-primary text-white"
                                    : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                                }`}
                        >
                            Active Listings ({seller.listings.length})
                        </button>
                        <button
                            onClick={() => setActiveTab("reviews")}
                            className={`px-6 py-3 font-medium rounded-xl transition-colors ${activeTab === "reviews"
                                    ? "bg-primary text-white"
                                    : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                                }`}
                        >
                            Reviews ({seller.reviewsReceived.length})
                        </button>
                    </div>

                    {/* Content */}
                    {activeTab === "listings" ? (
                        <div>
                            {seller.listings.length === 0 ? (
                                <div className="glass rounded-2xl p-12 text-center">
                                    <p className="text-zinc-400">This seller has no active listings.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {seller.listings.map((listing) => (
                                        <ListingCard
                                            key={listing.id}
                                            id={listing.id}
                                            title={listing.title}
                                            price={listing.price}
                                            originalPrice={listing.originalPrice}
                                            game={listing.game}
                                            gameImage={listing.imageUrl || GAME_IMAGES[listing.game] || GAME_IMAGES.Roblox}
                                            sellerName={seller.name || "Seller"}
                                            type={listing.type}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div>
                            {seller.reviewsReceived.length === 0 ? (
                                <div className="glass rounded-2xl p-12 text-center">
                                    <p className="text-zinc-400">No reviews yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {seller.reviewsReceived.map((review) => (
                                        <div key={review.id} className="glass rounded-xl p-4 sm:p-6">
                                            <div className="flex items-start gap-4">
                                                {/* Reviewer Avatar */}
                                                {review.reviewer.image ? (
                                                    <Image
                                                        src={review.reviewer.image}
                                                        alt={review.reviewer.name || "Reviewer"}
                                                        width={48}
                                                        height={48}
                                                        className="rounded-full"
                                                    />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                                                        <span className="text-sm font-bold text-white">
                                                            {(review.reviewer.name || "U").charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                )}

                                                <div className="flex-1">
                                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                                                        <span className="font-medium text-white">
                                                            {review.reviewer.name || "Anonymous"}
                                                        </span>
                                                        <StarDisplay rating={review.rating} />
                                                        <span className="text-sm text-zinc-500">
                                                            {new Date(review.createdAt).toLocaleDateString()}
                                                        </span>
                                                    </div>

                                                    <Link
                                                        href={`/listings/${review.listing.id}`}
                                                        className="text-sm text-primary hover:underline mb-2 inline-block"
                                                    >
                                                        {review.listing.title}
                                                    </Link>

                                                    {review.comment && (
                                                        <p className="text-zinc-300">{review.comment}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

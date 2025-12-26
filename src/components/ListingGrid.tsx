"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ListingCard from "./ListingCard";

interface Listing {
    id: string;
    title: string;
    price: number;
    type: "ITEM" | "SERVICE";
    game: string;
    imageUrl: string | null;
    seller: {
        id: string;
        name: string | null;
        image: string | null;
    };
}

const GAME_IMAGES: Record<string, string> = {
    Roblox: "https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=400&h=300&fit=crop",
    Valorant: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=300&fit=crop",
    CS2: "https://images.unsplash.com/photo-1552820728-8b83bb6b2b0a?w=400&h=300&fit=crop",
    Fortnite: "https://images.unsplash.com/photo-1589241062272-c0a000072dfa?w=400&h=300&fit=crop",
    "League of Legends": "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400&h=300&fit=crop",
    "Apex Legends": "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=300&fit=crop",
};

export default function ListingGrid() {
    const [listings, setListings] = useState<Listing[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchListings();
    }, []);

    const fetchListings = async () => {
        try {
            const res = await fetch("/api/listings?limit=8");
            if (res.ok) {
                const data = await res.json();
                setListings(data);
            }
        } catch (error) {
            console.error("Error fetching listings:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section className="py-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Section Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                            {listings.length > 0 ? "Latest Listings" : "Featured Listings"}
                        </h2>
                        <p className="text-zinc-400">
                            {listings.length > 0
                                ? `${listings.length} active listing${listings.length !== 1 ? "s" : ""}`
                                : "Discover the hottest items and services"}
                        </p>
                    </div>
                    <Link
                        href="/search"
                        className="hidden sm:block px-4 py-2 text-sm font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/10 transition-colors"
                    >
                        View All
                    </Link>
                </div>

                {/* Loading State */}
                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="glass rounded-xl overflow-hidden animate-pulse">
                                <div className="h-48 bg-zinc-800" />
                                <div className="p-4 space-y-3">
                                    <div className="h-5 bg-zinc-800 rounded w-3/4" />
                                    <div className="flex justify-between">
                                        <div className="h-4 bg-zinc-800 rounded w-1/4" />
                                        <div className="h-4 bg-zinc-800 rounded w-1/4" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : listings.length === 0 ? (
                    <div className="glass rounded-2xl p-12 text-center">
                        <svg className="w-16 h-16 mx-auto text-zinc-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <h3 className="text-xl font-semibold text-white mb-2">No listings yet</h3>
                        <p className="text-zinc-400 mb-6">
                            Be the first to create a listing!
                        </p>
                        <Link
                            href="/seller-setup"
                            className="px-6 py-3 bg-gradient-to-r from-primary to-accent text-white font-medium rounded-xl inline-block"
                        >
                            Start Selling
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {listings.map((listing) => (
                                <ListingCard
                                    key={listing.id}
                                    id={listing.id}
                                    title={listing.title}
                                    price={listing.price}
                                    game={listing.game}
                                    gameImage={listing.imageUrl || GAME_IMAGES[listing.game] || GAME_IMAGES.Roblox}
                                    sellerName={listing.seller.name || "Anonymous"}
                                    type={listing.type}
                                />
                            ))}
                        </div>
                    </>
                )}

                {/* Mobile View All */}
                <div className="mt-8 text-center sm:hidden">
                    <Link
                        href="/search"
                        className="px-6 py-2 text-sm font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/10 transition-colors inline-block"
                    >
                        View All Listings
                    </Link>
                </div>
            </div>
        </section>
    );
}

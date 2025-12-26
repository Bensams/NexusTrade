"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import ListingCard from "@/components/ListingCard";
import { PageSkeleton } from "@/components/Skeleton";

interface Listing {
    id: string;
    title: string;
    price: number;
    originalPrice: number | null;
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

const GAMES = ["All Games", "Roblox", "Valorant", "CS2", "Fortnite", "League of Legends", "Apex Legends"];
const TYPES = ["All Types", "ITEM", "SERVICE"];

function SearchContent() {
    const searchParams = useSearchParams();
    const query = searchParams.get("query") || "";

    const [listings, setListings] = useState<Listing[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchInput, setSearchInput] = useState(query);
    const [selectedGame, setSelectedGame] = useState("All Games");
    const [selectedType, setSelectedType] = useState("All Types");

    useEffect(() => {
        fetchResults();
    }, [query, selectedGame, selectedType]);

    const fetchResults = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (query) params.set("query", query);
            if (selectedGame !== "All Games") params.set("game", selectedGame);
            if (selectedType !== "All Types") params.set("type", selectedType);

            const res = await fetch(`/api/search?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setListings(data);
            }
        } catch (error) {
            console.error("Error fetching search results:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (searchInput) params.set("query", searchInput);
        window.location.href = `/search?${params.toString()}`;
    };

    return (
        <div className="min-h-screen">
            <Navbar />

            <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    {/* Search Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2">
                            {query ? `Search results for "${query}"` : "Browse All Listings"}
                        </h1>
                        <p className="text-zinc-400">
                            {listings.length} listing{listings.length !== 1 ? "s" : ""} found
                        </p>
                    </div>

                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="mb-6">
                        <div className="relative max-w-xl">
                            <input
                                type="text"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder="Search games, items, services..."
                                className="w-full px-4 py-3 pl-12 rounded-xl bg-zinc-900/80 border border-white/10 text-white placeholder-zinc-400 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
                            />
                            <svg
                                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <button
                                type="submit"
                                className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-primary text-white text-sm font-medium rounded-lg hover:opacity-90"
                            >
                                Search
                            </button>
                        </div>
                    </form>

                    {/* Filters */}
                    <div className="flex flex-wrap gap-3 mb-8">
                        {/* Game Filter */}
                        <div className="flex flex-wrap gap-2">
                            {GAMES.map((game) => (
                                <button
                                    key={game}
                                    onClick={() => setSelectedGame(game)}
                                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${selectedGame === game
                                            ? "bg-primary text-white"
                                            : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                                        }`}
                                >
                                    {game}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Type Filter */}
                    <div className="flex gap-2 mb-8">
                        {TYPES.map((type) => (
                            <button
                                key={type}
                                onClick={() => setSelectedType(type)}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${selectedType === type
                                        ? "bg-accent text-white"
                                        : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                                    }`}
                            >
                                {type === "ITEM" ? "Items" : type === "SERVICE" ? "Services" : type}
                            </button>
                        ))}
                    </div>

                    {/* Results */}
                    {isLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {[...Array(8)].map((_, i) => (
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
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <h3 className="text-xl font-semibold text-white mb-2">No listings found</h3>
                            <p className="text-zinc-400 mb-6">
                                Try adjusting your search or filters
                            </p>
                            <Link
                                href="/"
                                className="px-6 py-3 bg-gradient-to-r from-primary to-accent text-white font-medium rounded-xl"
                            >
                                Back to Home
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {listings.map((listing) => (
                                <ListingCard
                                    key={listing.id}
                                    id={listing.id}
                                    title={listing.title}
                                    price={listing.price}
                                    originalPrice={listing.originalPrice}
                                    game={listing.game}
                                    gameImage={listing.imageUrl || GAME_IMAGES[listing.game] || GAME_IMAGES.Roblox}
                                    sellerName={listing.seller.name || "Anonymous"}
                                    type={listing.type}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen">
                <Navbar />
                <PageSkeleton type="listings" />
            </div>
        }>
            <SearchContent />
        </Suspense>
    );
}

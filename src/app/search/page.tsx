"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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

interface User {
    id: string;
    name: string | null;
    image: string | null;
    isSeller: boolean;
    isAdmin: boolean;
    listingCount: number;
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
    const query = searchParams?.get("query") || "";

    const [listings, setListings] = useState<Listing[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchInput, setSearchInput] = useState(query);
    const [selectedGame, setSelectedGame] = useState("All Games");
    const [selectedType, setSelectedType] = useState("All Types");
    const [activeTab, setActiveTab] = useState<"listings" | "users">("listings");

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
            params.set("searchType", "all");

            const res = await fetch(`/api/search?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setListings(data.listings || []);
                setUsers(data.users || []);
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

    const getRoleBadge = (user: User) => {
        if (user.isAdmin) {
            return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-500/20 text-red-400">Admin</span>;
        }
        if (user.isSeller) {
            return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary/20 text-primary">Seller</span>;
        }
        return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-zinc-500/20 text-zinc-400">Buyer</span>;
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
                            {listings.length} listing{listings.length !== 1 ? "s" : ""}
                            {users.length > 0 && `, ${users.length} user${users.length !== 1 ? "s" : ""}`} found
                        </p>
                    </div>

                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="mb-6">
                        <div className="relative max-w-xl">
                            <input
                                type="text"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder="Search games, items, services, users..."
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

                    {/* Tabs */}
                    {query && (
                        <div className="flex gap-2 mb-6">
                            <button
                                onClick={() => setActiveTab("listings")}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === "listings"
                                    ? "bg-primary text-white"
                                    : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                                    }`}
                            >
                                Listings ({listings.length})
                            </button>
                            <button
                                onClick={() => setActiveTab("users")}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === "users"
                                    ? "bg-primary text-white"
                                    : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                                    }`}
                            >
                                Users ({users.length})
                            </button>
                        </div>
                    )}

                    {/* Filters (only for listings) */}
                    {activeTab === "listings" && (
                        <>
                            <div className="flex flex-wrap gap-3 mb-8">
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
                        </>
                    )}

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
                    ) : activeTab === "users" ? (
                        // Users Grid
                        users.length === 0 ? (
                            <div className="glass rounded-2xl p-12 text-center">
                                <h3 className="text-xl font-semibold text-white mb-2">No users found</h3>
                                <p className="text-zinc-400">Try a different search term</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {users.map((user) => (
                                    <Link
                                        key={user.id}
                                        href={`/profile/${user.id}`}
                                        className="glass rounded-xl p-4 hover:border-white/20 transition-colors group"
                                    >
                                        <div className="flex items-center gap-3">
                                            {user.image ? (
                                                <Image
                                                    src={user.image}
                                                    alt={user.name || "User"}
                                                    width={48}
                                                    height={48}
                                                    className="w-12 h-12 rounded-full"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                                                    <span className="text-lg font-bold text-white">
                                                        {user.name?.charAt(0).toUpperCase() || "U"}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-white truncate group-hover:text-primary transition-colors">
                                                    {user.name || "Anonymous"}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    {getRoleBadge(user)}
                                                    {user.listingCount > 0 && (
                                                        <span className="text-xs text-zinc-500">
                                                            {user.listingCount} listing{user.listingCount !== 1 ? "s" : ""}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )
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


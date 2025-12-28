"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";

interface Game {
    id: string;
    name: string;
    slug: string;
}

interface ItemType {
    id: string;
    name: string;
    slug: string;
}

export default function CreateListingPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isCheckingSetup, setIsCheckingSetup] = useState(true);
    const [error, setError] = useState("");

    // Dynamic data from API
    const [games, setGames] = useState<Game[]>([]);
    const [itemTypes, setItemTypes] = useState<ItemType[]>([]);
    const [feePercent, setFeePercent] = useState(5);
    const [isLoadingOptions, setIsLoadingOptions] = useState(true);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        price: "",
        type: "",
        game: "",
        imageUrl: "",
    });

    // Fetch games, item types, and platform fee on mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [gamesRes, typesRes, feeRes] = await Promise.all([
                    fetch("/api/games"),
                    fetch("/api/item-types"),
                    fetch("/api/platform-fee"),
                ]);

                if (gamesRes.ok) {
                    const gamesData = await gamesRes.json();
                    setGames(gamesData);
                    if (gamesData.length > 0) {
                        setFormData(prev => ({ ...prev, game: prev.game || gamesData[0].name }));
                    }
                }

                if (typesRes.ok) {
                    const typesData = await typesRes.json();
                    setItemTypes(typesData);
                    if (typesData.length > 0) {
                        setFormData(prev => ({ ...prev, type: prev.type || typesData[0].name }));
                    }
                }

                if (feeRes.ok) {
                    const feeData = await feeRes.json();
                    setFeePercent(feeData.transactionFeePercent);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setIsLoadingOptions(false);
            }
        };

        fetchData();
    }, []);

    // Check if seller setup is complete
    useEffect(() => {
        const checkSellerSetup = async () => {
            if (!session) return;
            try {
                const res = await fetch("/api/user/seller-setup");
                if (res.ok) {
                    const data = await res.json();
                    if (!data.isComplete) {
                        router.push("/seller-setup");
                        return;
                    }
                }
            } catch (error) {
                console.error("Error checking seller setup:", error);
            } finally {
                setIsCheckingSetup(false);
            }
        };

        if (session) {
            checkSellerSetup();
        } else if (status !== "loading") {
            setIsCheckingSetup(false);
        }
    }, [session, status, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const res = await fetch("/api/listings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Failed to create listing");
                return;
            }

            router.push("/listings/my");
            router.refresh();
        } catch {
            setError("Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    // Calculate earnings after platform fee
    const price = parseFloat(formData.price) || 0;
    const earnings = price * (1 - feePercent / 100);

    if (status === "loading" || isCheckingSetup) {
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
                    <p className="text-zinc-400 mb-6">You need to sign in to create a listing.</p>
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

            {/* Background Effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
            </div>

            <div className="relative pt-24 pb-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-2xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2">Create Listing</h1>
                        <p className="text-zinc-400">List your item or service for sale on NexusTrade</p>
                    </div>

                    {/* Form Card */}
                    <div className="glass rounded-2xl p-6 sm:p-8">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                                    {error}
                                </div>
                            )}

                            {/* Title */}
                            <div>
                                <label htmlFor="title" className="block text-sm font-medium text-zinc-300 mb-2">
                                    Title *
                                </label>
                                <input
                                    id="title"
                                    name="title"
                                    type="text"
                                    value={formData.title}
                                    onChange={handleChange}
                                    placeholder="e.g., Legendary Dragon Pet - Max Level"
                                    required
                                    className="w-full px-4 py-3 rounded-xl bg-zinc-900/80 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-zinc-300 mb-2">
                                    Description *
                                </label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    placeholder="Describe your item or service in detail..."
                                    required
                                    rows={4}
                                    className="w-full px-4 py-3 rounded-xl bg-zinc-900/80 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all resize-none"
                                />
                            </div>

                            {/* Price & Type Row */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="price" className="block text-sm font-medium text-zinc-300 mb-2">
                                        Price (PHP) *
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">₱</span>
                                        <input
                                            id="price"
                                            name="price"
                                            type="number"
                                            step="0.01"
                                            min="1"
                                            value={formData.price}
                                            onChange={handleChange}
                                            placeholder="0.00"
                                            required
                                            className="w-full px-4 py-3 pl-8 rounded-xl bg-zinc-900/80 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                                        />
                                    </div>
                                    {price > 0 && (
                                        <p className="text-xs text-zinc-500 mt-1">
                                            You&apos;ll receive: <span className="text-primary">₱{earnings.toFixed(2)}</span> (after {feePercent}% fee)
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="type" className="block text-sm font-medium text-zinc-300 mb-2">
                                        Type *
                                    </label>
                                    <select
                                        id="type"
                                        name="type"
                                        value={formData.type}
                                        onChange={handleChange}
                                        disabled={isLoadingOptions}
                                        className="w-full px-4 py-3 rounded-xl bg-zinc-900/80 border border-white/10 text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all disabled:opacity-50"
                                    >
                                        {isLoadingOptions ? (
                                            <option>Loading types...</option>
                                        ) : itemTypes.length === 0 ? (
                                            <option>No types available</option>
                                        ) : (
                                            itemTypes.map((type) => (
                                                <option key={type.id} value={type.name}>
                                                    {type.name}
                                                </option>
                                            ))
                                        )}
                                    </select>
                                </div>
                            </div>

                            {/* Game */}
                            <div>
                                <label htmlFor="game" className="block text-sm font-medium text-zinc-300 mb-2">
                                    Game *
                                </label>
                                <select
                                    id="game"
                                    name="game"
                                    value={formData.game}
                                    onChange={handleChange}
                                    disabled={isLoadingOptions}
                                    className="w-full px-4 py-3 rounded-xl bg-zinc-900/80 border border-white/10 text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all disabled:opacity-50"
                                >
                                    {isLoadingOptions ? (
                                        <option>Loading games...</option>
                                    ) : games.length === 0 ? (
                                        <option>No games available</option>
                                    ) : (
                                        games.map((game) => (
                                            <option key={game.id} value={game.name}>
                                                {game.name}
                                            </option>
                                        ))
                                    )}
                                </select>
                            </div>

                            {/* Image URL */}
                            <div>
                                <label htmlFor="imageUrl" className="block text-sm font-medium text-zinc-300 mb-2">
                                    Image URL (optional)
                                </label>
                                <input
                                    id="imageUrl"
                                    name="imageUrl"
                                    type="url"
                                    value={formData.imageUrl}
                                    onChange={handleChange}
                                    placeholder="https://example.com/image.jpg"
                                    className="w-full px-4 py-3 rounded-xl bg-zinc-900/80 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                                />
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed glow-purple"
                            >
                                {isLoading ? "Creating..." : "Create Listing"}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

"use client";

import { useState, useEffect, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import ImageUpload from "@/components/ImageUpload";

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

interface Listing {
    id: string;
    title: string;
    description: string;
    price: number;
    originalPrice: number | null;
    type: string;
    game: string;
    images: string[];
    sellerId: string;
}

export default function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { data: session, status } = useSession();
    const router = useRouter();
    const [listing, setListing] = useState<Listing | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");

    // Dynamic data from API
    const [games, setGames] = useState<Game[]>([]);
    const [itemTypes, setItemTypes] = useState<ItemType[]>([]);
    const [feePercent, setFeePercent] = useState(10);
    const [isLoadingOptions, setIsLoadingOptions] = useState(true);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        price: "",
        type: "",
        game: "",
        images: [] as string[],
    });

    // Fetch games, item types, and platform fee on mount
    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const [gamesRes, typesRes, feeRes] = await Promise.all([
                    fetch("/api/games"),
                    fetch("/api/item-types"),
                    fetch("/api/platform-fee"),
                ]);

                if (gamesRes.ok) {
                    setGames(await gamesRes.json());
                }
                if (typesRes.ok) {
                    setItemTypes(await typesRes.json());
                }
                if (feeRes.ok) {
                    const feeData = await feeRes.json();
                    setFeePercent(feeData.transactionFeePercent);
                }
            } catch (error) {
                console.error("Error fetching options:", error);
            } finally {
                setIsLoadingOptions(false);
            }
        };

        fetchOptions();
    }, []);

    useEffect(() => {
        if (session) {
            fetchListing();
        }
    }, [session, id]);

    const fetchListing = async () => {
        try {
            const res = await fetch(`/api/listings/${id}`);
            if (res.ok) {
                const data = await res.json();
                setListing(data);
                setFormData({
                    title: data.title,
                    description: data.description,
                    price: data.price.toString(),
                    type: data.type,
                    game: data.game,
                    images: data.images || [],
                });

                // Check ownership
                if (data.sellerId !== session?.user?.id) {
                    router.push("/listings/my");
                }
            } else {
                router.push("/listings/my");
            }
        } catch (error) {
            console.error("Error fetching listing:", error);
            router.push("/listings/my");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsSaving(true);

        try {
            const res = await fetch(`/api/listings/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                router.push("/listings/my");
            } else {
                const data = await res.json();
                setError(data.error || "Failed to update listing");
            }
        } catch {
            setError("Something went wrong");
        } finally {
            setIsSaving(false);
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

    if (status === "loading" || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!session || !listing) {
        return null;
    }

    return (
        <div className="min-h-screen">
            <Navbar />

            <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-2xl mx-auto">
                    <div className="mb-8">
                        <Link href="/listings/my" className="text-zinc-400 hover:text-white mb-4 inline-flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Back to My Listings
                        </Link>
                        <h1 className="text-3xl font-bold text-white mb-2">Edit Listing</h1>
                        <p className="text-zinc-400">Update your listing details</p>
                    </div>

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
                                    required
                                    className="w-full px-4 py-3 rounded-xl bg-zinc-900/80 border border-white/10 text-white focus:outline-none focus:border-primary/50"
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
                                    required
                                    rows={4}
                                    className="w-full px-4 py-3 rounded-xl bg-zinc-900/80 border border-white/10 text-white focus:outline-none focus:border-primary/50 resize-none"
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
                                            required
                                            className="w-full px-4 py-3 pl-8 rounded-xl bg-zinc-900/80 border border-white/10 text-white focus:outline-none focus:border-primary/50"
                                        />
                                    </div>
                                    {price > 0 && (
                                        <p className="text-xs text-zinc-500 mt-1">
                                            You&apos;ll receive: <span className="text-primary">₱{earnings.toFixed(2)}</span> (after {feePercent}% fee)
                                        </p>
                                    )}
                                    {listing.originalPrice && price < listing.price && (
                                        <p className="text-xs text-green-400 mt-1">
                                            🏷️ Price reduced from ₱{listing.price.toFixed(2)}
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
                                        className="w-full px-4 py-3 rounded-xl bg-zinc-900/80 border border-white/10 text-white focus:outline-none focus:border-primary/50"
                                    >
                                        {isLoadingOptions ? (
                                            <option>Loading...</option>
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
                                    className="w-full px-4 py-3 rounded-xl bg-zinc-900/80 border border-white/10 text-white focus:outline-none focus:border-primary/50 disabled:opacity-50"
                                >
                                    {isLoadingOptions ? (
                                        <option>Loading...</option>
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

                            {/* Listing Images */}
                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-2">
                                    Listing Images (up to 3)
                                </label>
                                <ImageUpload
                                    mode="multiple"
                                    folder="nexustrade/listings"
                                    existingImages={formData.images}
                                    onUploadComplete={(urls) => setFormData(prev => ({ ...prev, images: urls as string[] }))}
                                    buttonLabel="Upload Listing Images"
                                />
                            </div>

                            {/* Submit Button */}
                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-1 py-3 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-primary to-accent hover:opacity-90 disabled:opacity-50"
                                >
                                    {isSaving ? "Saving..." : "Save Changes"}
                                </button>
                                <Link
                                    href="/listings/my"
                                    className="px-6 py-3 rounded-xl font-medium text-zinc-300 border border-white/10 hover:bg-white/5"
                                >
                                    Cancel
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

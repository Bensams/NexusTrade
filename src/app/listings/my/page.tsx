"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
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
}

export default function MyListingsPage() {
    const { data: session, status } = useSession();
    const [listings, setListings] = useState<Listing[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    useEffect(() => {
        if (session) {
            fetchListings();
        }
    }, [session]);

    const fetchListings = async () => {
        try {
            const res = await fetch("/api/listings/my");
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

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this listing?")) return;

        setDeleteId(id);
        try {
            const res = await fetch(`/api/listings/${id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                setListings(listings.filter((l) => l.id !== id));
            }
        } catch (error) {
            console.error("Error deleting listing:", error);
        } finally {
            setDeleteId(null);
        }
    };

    if (status === "loading" || isLoading) {
        return (
            <div className="min-h-screen">
                <Navbar />
                <PageSkeleton type="listings" />
            </div>
        );
    }

    if (!session) {
        return (
            <div className="min-h-screen">
                <Navbar />
                <div className="pt-32 text-center">
                    <h1 className="text-2xl font-bold text-white mb-4">Sign in required</h1>
                    <p className="text-zinc-400 mb-6">You need to sign in to view your listings.</p>
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
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-2">My Listings</h1>
                            <p className="text-zinc-400">
                                Manage your items and services
                            </p>
                        </div>
                        <Link
                            href="/listings/create"
                            className="inline-flex items-center justify-center px-6 py-3 font-semibold text-white bg-gradient-to-r from-primary to-accent rounded-xl hover:opacity-90 transition-opacity glow-purple"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Create New
                        </Link>
                    </div>

                    {/* Listings */}
                    {listings.length === 0 ? (
                        <div className="glass rounded-2xl p-12 text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-800 flex items-center justify-center">
                                <svg className="w-8 h-8 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">No listings yet</h3>
                            <p className="text-zinc-400 mb-6">Start selling by creating your first listing</p>
                            <Link
                                href="/listings/create"
                                className="inline-flex items-center px-6 py-3 font-medium text-white bg-gradient-to-r from-primary to-accent rounded-xl"
                            >
                                Create Your First Listing
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {listings.map((listing) => (
                                <div
                                    key={listing.id}
                                    className="glass rounded-xl p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4"
                                >
                                    {/* Image */}
                                    <div className="w-full sm:w-24 h-32 sm:h-24 rounded-lg overflow-hidden flex-shrink-0">
                                        <div
                                            className="w-full h-full bg-cover bg-center bg-zinc-800"
                                            style={{
                                                backgroundImage: listing.imageUrl
                                                    ? `url(${listing.imageUrl})`
                                                    : "none",
                                            }}
                                        >
                                            {!listing.imageUrl && (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span
                                                className={`px-2 py-0.5 text-xs font-medium rounded ${listing.type === "SERVICE"
                                                    ? "bg-primary/20 text-primary"
                                                    : "bg-accent/20 text-accent"
                                                    }`}
                                            >
                                                {listing.type}
                                            </span>
                                            <span className="text-xs text-zinc-500">{listing.game}</span>
                                        </div>
                                        <h3 className="text-lg font-semibold text-white truncate">{listing.title}</h3>
                                        <p className="text-zinc-400 text-sm truncate">{listing.description}</p>
                                    </div>

                                    {/* Price & Actions */}
                                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2">
                                        <div className="text-right">
                                            {listing.originalPrice && listing.originalPrice > listing.price && (
                                                <div className="text-sm text-zinc-500 line-through">
                                                    ₱{listing.originalPrice.toFixed(2)}
                                                </div>
                                            )}
                                            <div className={`text-xl font-bold ${listing.originalPrice && listing.originalPrice > listing.price ? "text-green-400" : "gradient-text"}`}>
                                                ₱{listing.price.toFixed(2)}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Link
                                                href={`/listings/edit/${listing.id}`}
                                                className="px-4 py-2 text-sm font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/10 transition-colors"
                                            >
                                                Edit
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(listing.id)}
                                                disabled={deleteId === listing.id}
                                                className="px-4 py-2 text-sm font-medium text-red-400 border border-red-400/30 rounded-lg hover:bg-red-400/10 transition-colors disabled:opacity-50"
                                            >
                                                {deleteId === listing.id ? "..." : "Delete"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

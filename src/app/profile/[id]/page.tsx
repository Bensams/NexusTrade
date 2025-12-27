"use client";

import { useState, useEffect, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { PageSkeleton } from "@/components/Skeleton";

interface PublicProfile {
    id: string;
    name: string | null;
    image: string | null;
    bio: string | null;
    isSeller: boolean;
    isAdmin: boolean;
    createdAt: string;
    stats: {
        listings: number;
        purchases: number;
        completedSales: number;
        totalSpent: number;
    };
    recentListings: {
        id: string;
        title: string;
        price: number;
        imageUrl: string | null;
        game: string;
    }[];
}

export default function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { data: session } = useSession();
    const router = useRouter();
    const [profile, setProfile] = useState<PublicProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchProfile();
    }, [id]);

    const fetchProfile = async () => {
        try {
            const res = await fetch(`/api/users/${id}`);
            if (res.ok) {
                const data = await res.json();
                setProfile(data);
            } else if (res.status === 404) {
                setError("User not found");
            } else {
                setError("Failed to load profile");
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
            setError("Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    const startConversation = async () => {
        if (!session) {
            router.push("/login");
            return;
        }

        try {
            const res = await fetch("/api/conversations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ recipientId: id }),
            });
            if (res.ok) {
                const data = await res.json();
                router.push(`/messages/${data.conversationId}`);
            }
        } catch (error) {
            console.error("Error starting conversation:", error);
        }
    };

    const getRoleBadge = () => {
        if (profile?.isAdmin) {
            return (
                <span className="px-3 py-1 text-sm font-medium rounded-full bg-red-500/20 text-red-400">
                    Admin
                </span>
            );
        }
        if (profile?.isSeller) {
            return (
                <span className="px-3 py-1 text-sm font-medium rounded-full bg-primary/20 text-primary">
                    Seller
                </span>
            );
        }
        return (
            <span className="px-3 py-1 text-sm font-medium rounded-full bg-zinc-500/20 text-zinc-400">
                Buyer
            </span>
        );
    };

    if (isLoading) {
        return (
            <div className="min-h-screen">
                <Navbar />
                <PageSkeleton type="profile" />
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="min-h-screen">
                <Navbar />
                <div className="pt-32 text-center px-4">
                    <h1 className="text-2xl font-bold text-white mb-4">{error || "User not found"}</h1>
                    <Link
                        href="/"
                        className="text-primary hover:text-primary/80"
                    >
                        ← Back to Home
                    </Link>
                </div>
            </div>
        );
    }

    const isOwnProfile = session?.user?.id === profile.id;

    return (
        <div className="min-h-screen">
            <Navbar />

            <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    {/* Profile Header */}
                    <div className="glass rounded-2xl p-6 sm:p-8 mb-6">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                            {/* Avatar */}
                            {profile.image ? (
                                <Image
                                    src={profile.image}
                                    alt={profile.name || "Profile"}
                                    width={96}
                                    height={96}
                                    className="w-24 h-24 rounded-full"
                                />
                            ) : (
                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                                    <span className="text-3xl font-bold text-white">
                                        {profile.name?.charAt(0).toUpperCase() || "U"}
                                    </span>
                                </div>
                            )}

                            {/* Info */}
                            <div className="flex-1 text-center sm:text-left">
                                <div className="flex items-center gap-3 justify-center sm:justify-start mb-2">
                                    <h1 className="text-2xl font-bold text-white">{profile.name || "Anonymous"}</h1>
                                    {getRoleBadge()}
                                </div>
                                {profile.bio && (
                                    <p className="text-zinc-300 max-w-md mb-2">{profile.bio}</p>
                                )}
                                <p className="text-sm text-zinc-500">
                                    Member since {new Date(profile.createdAt).toLocaleDateString()}
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                                {isOwnProfile ? (
                                    <Link
                                        href="/profile"
                                        className="px-4 py-2 text-sm font-medium text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                                    >
                                        Edit Profile
                                    </Link>
                                ) : (
                                    <button
                                        onClick={startConversation}
                                        className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-primary to-accent hover:opacity-90 rounded-lg transition-all"
                                    >
                                        Message
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                        <div className="glass rounded-xl p-4 text-center">
                            <div className="text-2xl font-bold gradient-text">{profile.stats.listings}</div>
                            <div className="text-sm text-zinc-400">Listings</div>
                        </div>
                        <div className="glass rounded-xl p-4 text-center">
                            <div className="text-2xl font-bold gradient-text">{profile.stats.purchases}</div>
                            <div className="text-sm text-zinc-400">Purchases</div>
                        </div>
                        <div className="glass rounded-xl p-4 text-center">
                            <div className="text-2xl font-bold text-green-400">{profile.stats.completedSales}</div>
                            <div className="text-sm text-zinc-400">Sales</div>
                        </div>
                        <div className="glass rounded-xl p-4 text-center">
                            <div className="text-2xl font-bold text-yellow-400">
                                ₱{profile.stats.totalSpent.toLocaleString()}
                            </div>
                            <div className="text-sm text-zinc-400">Spent</div>
                        </div>
                    </div>

                    {/* Recent Listings */}
                    {profile.recentListings.length > 0 && (
                        <div className="glass rounded-2xl p-6">
                            <h2 className="text-lg font-semibold text-white mb-4">
                                {profile.name}&apos;s Listings
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {profile.recentListings.map((listing) => (
                                    <Link
                                        key={listing.id}
                                        href={`/listings/${listing.id}`}
                                        className="group flex items-center gap-3 p-3 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
                                    >
                                        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-700">
                                            {listing.imageUrl ? (
                                                <Image
                                                    src={listing.imageUrl}
                                                    alt={listing.title}
                                                    width={64}
                                                    height={64}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-zinc-500">
                                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-white truncate group-hover:text-primary transition-colors">
                                                {listing.title}
                                            </p>
                                            <p className="text-sm text-primary font-semibold">
                                                ₱{listing.price.toLocaleString()}
                                            </p>
                                            <p className="text-xs text-zinc-500">{listing.game}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

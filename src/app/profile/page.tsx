"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { PageSkeleton } from "@/components/Skeleton";
import ImageUpload from "@/components/ImageUpload";

interface UserProfile {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    bio: string | null;
    balance: number;
    isSeller: boolean;
    createdAt: string;
    _count: {
        listings: number;
        orders: number;
    };
    sellerStats: {
        completedSales: number;
        totalEarnings: number;
    } | null;
}

export default function ProfilePage() {
    const { data: session, status, update } = useSession();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState("");
    const [editBio, setEditBio] = useState("");
    const [editImage, setEditImage] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (session) {
            fetchProfile();
        }
    }, [session]);

    const fetchProfile = async () => {
        try {
            const res = await fetch("/api/user/profile");
            if (res.ok) {
                const data = await res.json();
                setProfile(data);
                setEditName(data.name || "");
                setEditBio(data.bio || "");
                setEditImage(data.image || "");
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!editName.trim()) {
            setError("Name is required");
            return;
        }

        setIsSaving(true);
        setError("");

        try {
            const res = await fetch("/api/user/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: editName, bio: editBio, image: editImage }),
            });

            if (res.ok) {
                const updated = await res.json();
                setProfile((prev) => prev ? { ...prev, name: updated.name, bio: updated.bio, image: updated.image } : null);
                setIsEditing(false);
                // Update session with new name
                await update({ name: updated.name });
            } else {
                const data = await res.json();
                setError(data.error || "Failed to update");
            }
        } catch {
            setError("Something went wrong");
        } finally {
            setIsSaving(false);
        }
    };

    if (status === "loading" || isLoading) {
        return (
            <div className="min-h-screen">
                <Navbar />
                <PageSkeleton type="profile" />
            </div>
        );
    }

    if (!session) {
        return (
            <div className="min-h-screen">
                <Navbar />
                <div className="pt-32 text-center">
                    <h1 className="text-2xl font-bold text-white mb-4">Sign in required</h1>
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

    if (!profile) return null;

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
                                {isEditing ? (
                                    <div className="space-y-3">
                                        {/* Profile Picture Upload */}
                                        <div>
                                            <label className="block text-sm text-zinc-400 mb-2">Profile Picture</label>
                                            <ImageUpload
                                                mode="single"
                                                folder="nexustrade/profiles"
                                                existingImages={editImage ? [editImage] : []}
                                                onUploadComplete={(url) => setEditImage(url as string)}
                                                buttonLabel="Change Profile Picture"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-zinc-400 mb-1">Display Name</label>
                                            <input
                                                type="text"
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-zinc-900 border border-white/10 text-white focus:outline-none focus:border-primary/50"
                                                placeholder="Your name"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-zinc-400 mb-1">Bio</label>
                                            <textarea
                                                value={editBio}
                                                onChange={(e) => setEditBio(e.target.value)}
                                                className="w-full px-4 py-2 rounded-lg bg-zinc-900 border border-white/10 text-white focus:outline-none focus:border-primary/50 resize-none"
                                                placeholder="Tell us about yourself..."
                                                rows={3}
                                                maxLength={200}
                                            />
                                            <p className="text-xs text-zinc-500 mt-1">{editBio.length}/200 characters</p>
                                        </div>
                                        {error && <p className="text-red-400 text-sm">{error}</p>}
                                        <div className="flex gap-2 justify-center sm:justify-start">
                                            <button
                                                onClick={handleSave}
                                                disabled={isSaving}
                                                className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:opacity-90 disabled:opacity-50"
                                            >
                                                {isSaving ? "Saving..." : "Save"}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setIsEditing(false);
                                                    setEditName(profile.name || "");
                                                    setEditBio(profile.bio || "");
                                                    setEditImage(profile.image || "");
                                                    setError("");
                                                }}
                                                className="px-4 py-2 text-sm font-medium text-zinc-300 border border-white/10 rounded-lg hover:bg-white/5"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-3 justify-center sm:justify-start mb-2">
                                            <h1 className="text-2xl font-bold text-white">{profile.name}</h1>
                                            <button
                                                onClick={() => setIsEditing(true)}
                                                className="p-1 text-zinc-400 hover:text-white transition-colors"
                                                title="Edit profile"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                </svg>
                                            </button>
                                        </div>
                                        <p className="text-zinc-400">{profile.email}</p>
                                        {profile.bio && (
                                            <p className="text-zinc-300 mt-2 max-w-md">{profile.bio}</p>
                                        )}
                                        <p className="text-sm text-zinc-500 mt-1">
                                            Member since {new Date(profile.createdAt).toLocaleDateString()}
                                        </p>
                                    </>
                                )}
                            </div>

                            {/* Seller Badge */}
                            {profile.isSeller && (
                                <div className="px-4 py-2 rounded-lg bg-primary/20 text-primary font-medium">
                                    Seller
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                        <div className="glass rounded-xl p-4 text-center">
                            <div className="text-2xl font-bold gradient-text">{profile._count.listings}</div>
                            <div className="text-sm text-zinc-400">Listings</div>
                        </div>
                        <div className="glass rounded-xl p-4 text-center">
                            <div className="text-2xl font-bold gradient-text">{profile._count.orders}</div>
                            <div className="text-sm text-zinc-400">Purchases</div>
                        </div>
                        {profile.sellerStats && (
                            <>
                                <div className="glass rounded-xl p-4 text-center">
                                    <div className="text-2xl font-bold text-green-400">{profile.sellerStats.completedSales}</div>
                                    <div className="text-sm text-zinc-400">Sales</div>
                                </div>
                                <div className="glass rounded-xl p-4 text-center">
                                    <div className="text-2xl font-bold text-green-400">₱{profile.sellerStats.totalEarnings.toFixed(2)}</div>
                                    <div className="text-sm text-zinc-400">Earned</div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Quick Links */}
                    <div className="glass rounded-2xl p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">Quick Links</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Link
                                href="/listings/my"
                                className="flex items-center gap-3 p-4 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
                            >
                                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                </div>
                                <div>
                                    <div className="font-medium text-white">My Listings</div>
                                    <div className="text-sm text-zinc-400">Manage your items</div>
                                </div>
                            </Link>

                            <Link
                                href="/orders"
                                className="flex items-center gap-3 p-4 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
                            >
                                <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                                    <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                    </svg>
                                </div>
                                <div>
                                    <div className="font-medium text-white">My Orders</div>
                                    <div className="text-sm text-zinc-400">Track purchases</div>
                                </div>
                            </Link>

                            <Link
                                href="/listings/create"
                                className="flex items-center gap-3 p-4 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
                            >
                                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                </div>
                                <div>
                                    <div className="font-medium text-white">Create Listing</div>
                                    <div className="text-sm text-zinc-400">Sell items or services</div>
                                </div>
                            </Link>

                            {profile.isSeller && (
                                <Link
                                    href="/orders/seller"
                                    className="flex items-center gap-3 p-4 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                                        <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="font-medium text-white">Seller Dashboard</div>
                                        <div className="text-sm text-zinc-400">Manage sales</div>
                                    </div>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

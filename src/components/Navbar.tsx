"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function Navbar() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isSeller, setIsSeller] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/search?query=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    useEffect(() => {
        const checkUserStatus = async () => {
            if (!session) return;
            try {
                const res = await fetch("/api/user/seller-setup");
                if (res.ok) {
                    const data = await res.json();
                    setIsSeller(data.isComplete);
                    setIsAdmin(data.isAdmin || false);
                }
            } catch (error) {
                console.error("Error checking user status:", error);
            }
        };
        checkUserStatus();
    }, [session]);

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                            <span className="text-white font-bold text-sm">NT</span>
                        </div>
                        <span className="text-xl font-bold gradient-text">NexusTrade</span>
                    </Link>

                    {/* Search Bar - Desktop */}
                    <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-lg mx-8">
                        <div className="relative w-full">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search games, items, services..."
                                className="w-full px-4 py-2 pl-10 rounded-lg bg-zinc-900/80 border border-white/10 text-white placeholder-zinc-400 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                            />
                            <svg
                                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                        </div>
                    </form>

                    {/* Right Side - Auth */}
                    <div className="hidden md:flex items-center gap-4">
                        {status === "loading" ? (
                            <div className="w-8 h-8 rounded-full bg-zinc-800 animate-pulse" />
                        ) : session?.user ? (
                            <div className="flex items-center gap-3">
                                {isSeller ? (
                                    <Link
                                        href="/listings/create"
                                        className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-primary to-accent rounded-lg hover:opacity-90 transition-opacity"
                                    >
                                        Sell Now
                                    </Link>
                                ) : (
                                    <Link
                                        href="/seller-setup"
                                        className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-primary to-accent rounded-lg hover:opacity-90 transition-opacity"
                                    >
                                        Become a Seller
                                    </Link>
                                )}
                                <div className="relative">
                                    <button
                                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                                        className="flex items-center gap-2 p-1 rounded-lg hover:bg-white/5 transition-colors"
                                    >
                                        {session.user.image ? (
                                            <Image
                                                src={session.user.image}
                                                alt={session.user.name || "Profile"}
                                                width={32}
                                                height={32}
                                                className="w-8 h-8 rounded-full"
                                            />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                                                <span className="text-xs font-bold text-white">
                                                    {session.user.name?.charAt(0).toUpperCase() || "U"}
                                                </span>
                                            </div>
                                        )}
                                        <span className="text-sm text-zinc-300">{session.user.name}</span>
                                        <svg
                                            className={`w-4 h-4 text-zinc-400 transition-transform ${isProfileOpen ? "rotate-180" : ""}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    {/* Dropdown Menu */}
                                    {isProfileOpen && (
                                        <div className="absolute right-0 mt-2 w-48 glass rounded-xl border border-white/10 py-2 shadow-lg">
                                            <Link
                                                href="/profile"
                                                className="block px-4 py-2 border-b border-white/10 hover:bg-white/5 transition-colors"
                                                onClick={() => setIsProfileOpen(false)}
                                            >
                                                <p className="text-sm font-medium text-white">{session.user.name}</p>
                                                <p className="text-xs text-zinc-400 truncate">{session.user.email}</p>
                                            </Link>
                                            {isSeller && (
                                                <>
                                                    <Link
                                                        href="/listings/create"
                                                        className="block px-4 py-2 text-sm text-zinc-300 hover:bg-white/5 hover:text-white transition-colors"
                                                        onClick={() => setIsProfileOpen(false)}
                                                    >
                                                        Create Listing
                                                    </Link>
                                                    <Link
                                                        href="/listings/my"
                                                        className="block px-4 py-2 text-sm text-zinc-300 hover:bg-white/5 hover:text-white transition-colors"
                                                        onClick={() => setIsProfileOpen(false)}
                                                    >
                                                        My Listings
                                                    </Link>
                                                </>
                                            )}
                                            {!isSeller && (
                                                <Link
                                                    href="/seller-setup"
                                                    className="block px-4 py-2 text-sm text-primary hover:bg-white/5 hover:text-primary transition-colors"
                                                    onClick={() => setIsProfileOpen(false)}
                                                >
                                                    ✨ Become a Seller
                                                </Link>
                                            )}
                                            <Link
                                                href="/messages"
                                                className="block px-4 py-2 text-sm text-zinc-300 hover:bg-white/5 hover:text-white transition-colors"
                                                onClick={() => setIsProfileOpen(false)}
                                            >
                                                Messages
                                            </Link>
                                            <Link
                                                href="/orders"
                                                className="block px-4 py-2 text-sm text-zinc-300 hover:bg-white/5 hover:text-white transition-colors"
                                                onClick={() => setIsProfileOpen(false)}
                                            >
                                                My Orders
                                            </Link>
                                            {isSeller && (
                                                <>
                                                    <Link
                                                        href="/orders/seller"
                                                        className="block px-4 py-2 text-sm text-zinc-300 hover:bg-white/5 hover:text-white transition-colors"
                                                        onClick={() => setIsProfileOpen(false)}
                                                    >
                                                        Seller Dashboard
                                                    </Link>
                                                    <Link
                                                        href="/wallet"
                                                        className="block px-4 py-2 text-sm text-green-400 hover:bg-white/5 hover:text-green-300 transition-colors"
                                                        onClick={() => setIsProfileOpen(false)}
                                                    >
                                                        💰 Wallet
                                                    </Link>
                                                </>
                                            )}
                                            {isAdmin && (
                                                <Link
                                                    href="/admin"
                                                    className="block px-4 py-2 text-sm text-yellow-400 hover:bg-white/5 hover:text-yellow-300 transition-colors"
                                                    onClick={() => setIsProfileOpen(false)}
                                                >
                                                    Admin Dashboard
                                                </Link>
                                            )}
                                            <button
                                                onClick={() => signOut()}
                                                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/5 transition-colors"
                                            >
                                                Sign Out
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                        ) : (
                            <>
                                <Link
                                    href="/login"
                                    className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white transition-colors"
                                >
                                    Sign In
                                </Link>
                                <Link
                                    href="/register"
                                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-primary to-accent rounded-lg hover:opacity-90 transition-opacity glow-purple"
                                >
                                    Get Started
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="md:hidden p-2 text-zinc-400 hover:text-white"
                    >
                        <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            {isMenuOpen ? (
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            ) : (
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 6h16M4 12h16M4 18h16"
                                />
                            )}
                        </svg>
                    </button>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="md:hidden py-4 border-t border-white/10">
                        <div className="mb-4">
                            <input
                                type="text"
                                placeholder="Search..."
                                className="w-full px-4 py-2 rounded-lg bg-zinc-900/80 border border-white/10 text-white placeholder-zinc-400 focus:outline-none focus:border-primary/50"
                            />
                        </div>
                        {session?.user ? (
                            <div className="space-y-2">
                                <div className="px-4 py-2 border-b border-white/10">
                                    <p className="text-sm font-medium text-white">{session.user.name}</p>
                                    <p className="text-xs text-zinc-400">{session.user.email}</p>
                                </div>
                                <Link
                                    href="/profile"
                                    className="block px-4 py-2 text-sm text-zinc-300"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    Profile
                                </Link>
                                <Link
                                    href="/listings/my"
                                    className="block px-4 py-2 text-sm text-zinc-300"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    My Listings
                                </Link>
                                <button
                                    onClick={() => signOut()}
                                    className="w-full text-left px-4 py-2 text-sm text-red-400"
                                >
                                    Sign Out
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                <Link
                                    href="/login"
                                    className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white transition-colors"
                                >
                                    Sign In
                                </Link>
                                <Link
                                    href="/register"
                                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-primary to-accent rounded-lg text-center"
                                >
                                    Get Started
                                </Link>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </nav>
    );
}

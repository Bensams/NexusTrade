"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { getSocket } from "@/lib/socket";
import { HelpCircle, MessageCircle } from "lucide-react";
import { NotificationBadge } from "./NotificationBadge";

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    orderId?: string | null;
    listingId?: string | null;
    createdAt: string;
}

export default function Navbar() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [isSeller, setIsSeller] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [unreadMessageCount, setUnreadMessageCount] = useState(0); // For chat messages
    const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
    const [expandedNotificationId, setExpandedNotificationId] = useState<string | null>(null);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/search?query=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    const fetchNotifications = useCallback(async () => {
        if (!session) return;
        setIsLoadingNotifications(true);
        try {
            const res = await fetch("/api/notifications?limit=10");
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications || []);
                setUnreadCount(data.unreadCount || 0);
            }
        } catch (error) {
            console.error("Error fetching notifications:", error);
        } finally {
            setIsLoadingNotifications(false);
        }
    }, [session]);

    const fetchUnreadMessages = useCallback(async () => {
        if (!session) return;
        try {
            // Assume API endpoint exists as per instructions
            const res = await fetch("/api/messages/unread-count");
            if (res.ok) {
                const data = await res.json();
                setUnreadMessageCount(data.count || 0);
            }
        } catch (error) {
            console.error("Error fetching unread messages:", error);
        }
    }, [session]);

    // Socket.io connection for real-time notifications
    useEffect(() => {
        if (!session?.user?.id) return;

        const socket = getSocket();
        const userId = session.user.id;

        // Join user-specific room for notifications
        socket.emit("join-user", userId);

        // Listen for new notifications
        const handleNewNotification = (notification: Notification) => {
            setNotifications((prev) => [notification, ...prev]);
            setUnreadCount((prev) => prev + 1);
        };

        // Listen for new messages (assuming socket event exists)
        const handleNewMessage = () => {
            setUnreadMessageCount((prev) => prev + 1);
        };

        socket.on("new-notification", handleNewNotification);
        socket.on("new-message", handleNewMessage);

        return () => {
            socket.emit("leave-user", userId);
            socket.off("new-notification", handleNewNotification);
            socket.off("new-message", handleNewMessage);
        };
    }, [session?.user?.id]);

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
        fetchNotifications();
        fetchUnreadMessages();
    }, [session, fetchNotifications, fetchUnreadMessages]);

    // Poll for new notifications every 30 seconds (fallback)
    useEffect(() => {
        if (!session) return;
        const interval = setInterval(() => {
            fetchNotifications();
        }, 30000); // Poll every 30 seconds as fallback
        return () => clearInterval(interval);
    }, [session, fetchNotifications]);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (
                !target.closest('[data-notification-dropdown]') &&
                !target.closest('[data-notification-button]')
            ) {
                setIsNotificationOpen(false);
            }
            if (
                !target.closest('[data-profile-dropdown]') &&
                !target.closest('[data-profile-button]')
            ) {
                setIsProfileOpen(false);
            }
        };

        if (isNotificationOpen || isProfileOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            return () => document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [isNotificationOpen, isProfileOpen]);

    const markAsRead = async (notificationId: string) => {
        try {
            const res = await fetch("/api/notifications", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ notificationIds: [notificationId] }),
            });
            if (res.ok) {
                setNotifications((prev) =>
                    prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
                );
                setUnreadCount((prev) => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error("Error marking notification as read:", error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const res = await fetch("/api/notifications", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ markAllRead: true }),
            });
            if (res.ok) {
                setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
                setUnreadCount(0);
            }
        } catch (error) {
            console.error("Error marking all notifications as read:", error);
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case "PAYMENT_APPROVED":
            case "ORDER_COMPLETED":
            case "PAYOUT_APPROVED":
                return "✓";
            case "PAYMENT_DECLINED":
            case "PAYOUT_REJECTED":
                return "✕";
            case "NEW_ORDER":
            case "ORDER_DELIVERED":
                return "📦";
            case "PAYMENT_TO_REVIEW":
            case "DELIVERY_TO_REVIEW":
            case "PAYOUT_REQUEST":
                return "🔔";
            default:
                return "•";
        }
    };

    const getNotificationColor = (type: string) => {
        switch (type) {
            case "PAYMENT_APPROVED":
            case "ORDER_COMPLETED":
            case "PAYOUT_APPROVED":
                return "text-green-400";
            case "PAYMENT_DECLINED":
            case "PAYOUT_REJECTED":
                return "text-red-400";
            case "NEW_ORDER":
            case "ORDER_DELIVERED":
                return "text-blue-400";
            case "PAYMENT_TO_REVIEW":
            case "DELIVERY_TO_REVIEW":
            case "PAYOUT_REQUEST":
                return "text-yellow-400";
            default:
                return "text-zinc-400";
        }
    };

    const handleNotificationClick = (notification: Notification) => {
        markAsRead(notification.id);
        setIsNotificationOpen(false);

        // Navigate based on notification type
        // Admin notifications should go to admin dashboard
        const adminNotificationTypes = ["PAYMENT_TO_REVIEW", "DELIVERY_TO_REVIEW", "PAYOUT_REQUEST", "CASHIN_TO_REVIEW"];
        // Seller notifications should go to seller dashboard
        const sellerNotificationTypes = ["NEW_ORDER", "PAYOUT_APPROVED", "PAYOUT_REJECTED"];
        // Buyer notifications that should go to messages (conversation with seller)
        const buyerMessageNotificationTypes = ["PAYMENT_APPROVED"];
        // Wallet notifications - navigate to wallet page
        const walletNotificationTypes = ["DELIVERY_APPROVED", "DELIVERY_REJECTED", "ORDER_REFUNDED", "CASHIN_APPROVED", "CASHIN_REJECTED"];

        if (adminNotificationTypes.includes(notification.type)) {
            router.push(`/admin`);
        } else if (walletNotificationTypes.includes(notification.type)) {
            router.push(`/wallet`);
        } else if (sellerNotificationTypes.includes(notification.type)) {
            router.push(`/orders/seller`);
        } else if (buyerMessageNotificationTypes.includes(notification.type) && notification.orderId) {
            // Navigate to messages with orderId to find the conversation
            router.push(`/messages?orderId=${notification.orderId}`);
        } else if (notification.orderId) {
            router.push(`/orders`);
        } else if (notification.listingId) {
            router.push(`/listings/${notification.listingId}`);
        }
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (seconds < 60) return "just now";
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    };

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
                        <Link
                            href="/support"
                            className="p-2 text-zinc-400 hover:text-white transition-colors"
                            aria-label="Support"
                        >
                            <HelpCircle className="w-6 h-6" />
                        </Link>
                        <Link
                            href="/messages"
                            className="relative p-2 text-zinc-400 hover:text-white transition-colors"
                            aria-label="Messages"
                        >
                            <MessageCircle className="w-6 h-6" />
                            <NotificationBadge count={unreadMessageCount} />
                        </Link>
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

                                {/* Notification Bell */}
                                <div className="relative" data-notification-dropdown>
                                    <button
                                        data-notification-button
                                        onClick={() => {
                                            setIsNotificationOpen(!isNotificationOpen);
                                            setIsProfileOpen(false);
                                            if (!isNotificationOpen) {
                                                fetchNotifications();
                                            }
                                        }}
                                        className="relative p-2 rounded-lg hover:bg-white/5 transition-colors"
                                        aria-label="Notifications"
                                    >
                                        <svg
                                            className="w-6 h-6 text-zinc-300"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                                            />
                                        </svg>
                                        {unreadCount > 0 && (
                                            <span className="absolute top-1 right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                                                {unreadCount > 9 ? "9+" : unreadCount}
                                            </span>
                                        )}
                                    </button>

                                    {/* Notification Dropdown */}
                                    {isNotificationOpen && (
                                        <div className="absolute right-0 mt-2 w-96 glass rounded-xl border border-white/10 shadow-lg z-50 max-h-[600px] flex flex-col">
                                            <div className="p-4 border-b border-white/10 flex items-center justify-between">
                                                <h3 className="text-lg font-semibold text-white">Notifications</h3>
                                                {unreadCount > 0 && (
                                                    <button
                                                        onClick={markAllAsRead}
                                                        className="text-sm text-primary hover:text-primary/80 transition-colors"
                                                    >
                                                        Mark all as read
                                                    </button>
                                                )}
                                            </div>
                                            <div className="overflow-y-auto flex-1">
                                                {isLoadingNotifications ? (
                                                    <div className="p-8 text-center">
                                                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                                                        <p className="text-zinc-400 mt-2">Loading...</p>
                                                    </div>
                                                ) : notifications.length === 0 ? (
                                                    <div className="p-8 text-center">
                                                        <svg
                                                            className="w-12 h-12 text-zinc-600 mx-auto mb-3"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                                                            />
                                                        </svg>
                                                        <p className="text-zinc-400">No notifications</p>
                                                    </div>
                                                ) : (
                                                    <div className="divide-y divide-white/10">
                                                        {notifications.map((notification) => {
                                                            const isExpanded = expandedNotificationId === notification.id;
                                                            const messageLength = notification.message?.length || 0;
                                                            const shouldTruncate = messageLength > 80;

                                                            return (
                                                                <div
                                                                    key={notification.id}
                                                                    className={`w-full text-left p-4 hover:bg-white/5 transition-colors ${!notification.isRead ? "bg-primary/10" : ""
                                                                        }`}
                                                                >
                                                                    <div className="flex items-start gap-3">
                                                                        <div
                                                                            className={`text-xl ${getNotificationColor(
                                                                                notification.type
                                                                            )}`}
                                                                        >
                                                                            {getNotificationIcon(notification.type)}
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="flex items-start justify-between gap-2">
                                                                                <button
                                                                                    onClick={() => handleNotificationClick(notification)}
                                                                                    className={`text-sm font-medium text-left hover:underline ${!notification.isRead
                                                                                        ? "text-white"
                                                                                        : "text-zinc-300"
                                                                                        }`}
                                                                                >
                                                                                    {notification.title}
                                                                                </button>
                                                                                {!notification.isRead && (
                                                                                    <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1" />
                                                                                )}
                                                                            </div>
                                                                            <p className={`text-sm text-zinc-400 mt-1 ${!isExpanded && shouldTruncate ? "line-clamp-2" : ""}`}>
                                                                                {notification.message}
                                                                            </p>
                                                                            {shouldTruncate && (
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        setExpandedNotificationId(isExpanded ? null : notification.id);
                                                                                    }}
                                                                                    className="text-xs text-primary hover:text-primary/80 mt-1 transition-colors"
                                                                                >
                                                                                    {isExpanded ? "See less" : "See more"}
                                                                                </button>
                                                                            )}
                                                                            <p className="text-xs text-zinc-500 mt-2">
                                                                                {formatTimeAgo(notification.createdAt)}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="relative" data-profile-dropdown>
                                    <button
                                        data-profile-button
                                        onClick={() => {
                                            setIsProfileOpen(!isProfileOpen);
                                            setIsNotificationOpen(false);
                                        }}
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
                                                <Link
                                                    href="/orders/seller"
                                                    className="block px-4 py-2 text-sm text-zinc-300 hover:bg-white/5 hover:text-white transition-colors"
                                                    onClick={() => setIsProfileOpen(false)}
                                                >
                                                    Seller Dashboard
                                                </Link>
                                            )}
                                            <Link
                                                href="/wallet"
                                                className="block px-4 py-2 text-sm text-green-400 hover:bg-white/5 hover:text-green-300 transition-colors"
                                                onClick={() => setIsProfileOpen(false)}
                                            >
                                                💰 Wallet
                                            </Link>
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
                                    href="/orders"
                                    className="block px-4 py-2 text-sm text-zinc-300"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    My Orders {unreadCount > 0 && <span className="ml-2 px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">{unreadCount}</span>}
                                </Link>
                                <Link
                                    href="/messages"
                                    className="block px-4 py-2 text-sm text-zinc-300"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    Messages
                                </Link>
                                <Link
                                    href="/listings/my"
                                    className="block px-4 py-2 text-sm text-zinc-300"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    My Listings
                                </Link>
                                <Link
                                    href="/wallet"
                                    className="block px-4 py-2 text-sm text-green-400"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    💰 Wallet
                                </Link>
                                {isAdmin && (
                                    <Link
                                        href="/admin"
                                        className="block px-4 py-2 text-sm text-yellow-400"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        Admin Dashboard
                                    </Link>
                                )}
                                <Link
                                    href="/support"
                                    className="block px-4 py-2 text-sm text-zinc-300 hover:bg-white/5 hover:text-white"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    <div className="flex items-center gap-2">
                                        <HelpCircle className="w-4 h-4" />
                                        <span>Support Center</span>
                                    </div>
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
                                    href="/support"
                                    className="block px-4 py-2 text-sm text-zinc-300 hover:bg-white/5 hover:text-white"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    <div className="flex items-center gap-2">
                                        <HelpCircle className="w-4 h-4" />
                                        <span>Support Center</span>
                                    </div>
                                </Link>
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

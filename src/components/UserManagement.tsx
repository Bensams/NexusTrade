"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

type Role = "SUPER_ADMIN" | "ADMIN" | "MODERATOR" | "USER";

interface User {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    role: Role;
    isSeller: boolean;
    isSupportAgent: boolean;
    bannedUntil: string | null;
    createdAt: string;
    _count: {
        listings: number;
        orders: number;
    };
}

interface Listing {
    id: string;
    title: string;
    price: number;
    game: string;
    isBanned: boolean;
    createdAt: string;
    seller: {
        id: string;
        name: string | null;
        email: string;
    };
}

interface UserManagementProps {
    currentUserRole?: Role;
}

const ROLE_HIERARCHY: Record<Role, number> = {
    SUPER_ADMIN: 4,
    ADMIN: 3,
    MODERATOR: 2,
    USER: 1,
};

const ROLE_BADGES: Record<Role, { label: string; className: string }> = {
    SUPER_ADMIN: { label: "👑 Super Admin", className: "bg-yellow-500/20 text-yellow-400" },
    ADMIN: { label: "🛡️ Admin", className: "bg-purple-500/20 text-purple-400" },
    MODERATOR: { label: "🔧 Moderator", className: "bg-blue-500/20 text-blue-400" },
    USER: { label: "", className: "" },
};

export default function UserManagement({ currentUserRole = "ADMIN" }: UserManagementProps) {
    const [users, setUsers] = useState<User[]>([]);
    const [listings, setListings] = useState<Listing[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [banModalUser, setBanModalUser] = useState<User | null>(null);
    const [roleModalUser, setRoleModalUser] = useState<User | null>(null);
    const [selectedRole, setSelectedRole] = useState<Role>("USER");
    const [banDuration, setBanDuration] = useState<string>("24");
    const [banReason, setBanReason] = useState("");
    const [subTab, setSubTab] = useState<"users" | "listings">("users");
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        fetchUsers();
        fetchListings();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch("/api/admin/users");
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchListings = async () => {
        try {
            const res = await fetch("/api/admin/listings");
            if (res.ok) {
                const data = await res.json();
                setListings(data);
            }
        } catch (error) {
            console.error("Error fetching listings:", error);
        }
    };

    const canManageUser = (targetRole: Role) => {
        return ROLE_HIERARCHY[currentUserRole] > ROLE_HIERARCHY[targetRole];
    };

    const canAssignRole = (roleToAssign: Role) => {
        return ROLE_HIERARCHY[currentUserRole] > ROLE_HIERARCHY[roleToAssign];
    };

    const handleBanUser = async () => {
        if (!banModalUser) return;

        setProcessingId(banModalUser.id);
        try {
            const duration = banDuration === "permanent" ? "permanent" : parseInt(banDuration);
            const res = await fetch(`/api/admin/users/${banModalUser.id}/ban`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ duration, reason: banReason }),
            });

            if (res.ok) {
                const data = await res.json();
                setUsers(users.map(u =>
                    u.id === banModalUser.id
                        ? { ...u, bannedUntil: data.bannedUntil }
                        : u
                ));
                setBanModalUser(null);
                setBanDuration("24");
                setBanReason("");
            } else {
                const error = await res.json();
                alert(error.error || "Failed to ban user");
            }
        } catch (error) {
            console.error("Error banning user:", error);
        } finally {
            setProcessingId(null);
        }
    };

    const handleUnbanUser = async (userId: string) => {
        setProcessingId(userId);
        try {
            const res = await fetch(`/api/admin/users/${userId}/unban`, {
                method: "POST",
            });

            if (res.ok) {
                setUsers(users.map(u =>
                    u.id === userId ? { ...u, bannedUntil: null } : u
                ));
            }
        } catch (error) {
            console.error("Error unbanning user:", error);
        } finally {
            setProcessingId(null);
        }
    };

    const handleChangeRole = async () => {
        if (!roleModalUser) return;

        setProcessingId(roleModalUser.id);
        try {
            const res = await fetch(`/api/admin/users/${roleModalUser.id}/role`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role: selectedRole }),
            });

            if (res.ok) {
                const data = await res.json();
                setUsers(users.map(u =>
                    u.id === roleModalUser.id
                        ? { ...u, role: data.user.role }
                        : u
                ));
                setRoleModalUser(null);
            } else {
                const error = await res.json();
                alert(error.error || "Failed to change role");
            }
        } catch (error) {
            console.error("Error changing role:", error);
        } finally {
            setProcessingId(null);
        }
    };

    const handleToggleSupportAgent = async (user: User) => {
        setProcessingId(user.id);
        try {
            const res = await fetch(`/api/admin/users/${user.id}/support-agent`, {
                method: "PATCH",
            });

            if (res.ok) {
                const data = await res.json();
                setUsers(users.map(u =>
                    u.id === user.id
                        ? { ...u, isSupportAgent: data.user.isSupportAgent }
                        : u
                ));
            } else {
                const error = await res.json();
                alert(error.error || "Failed to toggle support agent");
            }
        } catch (error) {
            console.error("Error toggling support agent:", error);
        } finally {
            setProcessingId(null);
        }
    };

    const handleDeleteUser = async (user: User) => {
        if (!confirm(`Are you sure you want to permanently delete ${user.name || user.email}? This action cannot be undone.`)) {
            return;
        }

        setProcessingId(user.id);
        try {
            const res = await fetch(`/api/admin/users/${user.id}/delete`, {
                method: "DELETE",
            });

            if (res.ok) {
                setUsers(users.filter(u => u.id !== user.id));
            } else {
                const error = await res.json();
                alert(error.error || "Failed to delete user");
            }
        } catch (error) {
            console.error("Error deleting user:", error);
        } finally {
            setProcessingId(null);
        }
    };

    const handleToggleListingBan = async (listingId: string, isBanned: boolean) => {
        setProcessingId(listingId);
        try {
            const res = await fetch(`/api/admin/listings/${listingId}/ban`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isBanned: !isBanned }),
            });

            if (res.ok) {
                setListings(listings.map(l =>
                    l.id === listingId ? { ...l, isBanned: !isBanned } : l
                ));
            }
        } catch (error) {
            console.error("Error toggling listing ban:", error);
        } finally {
            setProcessingId(null);
        }
    };

    const isBanned = (bannedUntil: string | null) => {
        if (!bannedUntil) return false;
        return new Date(bannedUntil) > new Date();
    };

    const isPermanentBan = (bannedUntil: string | null) => {
        if (!bannedUntil) return false;
        return new Date(bannedUntil).getFullYear() >= 9999;
    };

    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredListings = listings.filter(l =>
        l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.seller.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="glass rounded-xl p-12 text-center">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                <p className="text-zinc-400 mt-4">Loading...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Sub-tabs */}
            <div className="flex gap-4 border-b border-zinc-700 pb-4">
                <button
                    onClick={() => setSubTab("users")}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${subTab === "users"
                        ? "bg-primary text-white"
                        : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                        }`}
                >
                    👤 Users ({users.filter(u => isBanned(u.bannedUntil)).length} banned)
                </button>
                <button
                    onClick={() => setSubTab("listings")}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${subTab === "listings"
                        ? "bg-primary text-white"
                        : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                        }`}
                >
                    📦 Listings ({listings.filter(l => l.isBanned).length} hidden)
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <input
                    type="text"
                    placeholder={subTab === "users" ? "Search users by name or email..." : "Search listings by title or seller..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary"
                />
            </div>

            {/* Users List */}
            {subTab === "users" && (
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-white">User Management</h2>
                    {filteredUsers.length === 0 ? (
                        <div className="glass rounded-xl p-12 text-center">
                            <p className="text-zinc-400">No users found</p>
                        </div>
                    ) : (
                        filteredUsers.map((user) => (
                            <div key={user.id} className="glass rounded-xl p-4 sm:p-6">
                                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                                    <div className="flex items-center gap-4 flex-1">
                                        {user.image ? (
                                            <Image
                                                src={user.image}
                                                alt={user.name || "User"}
                                                width={48}
                                                height={48}
                                                className="rounded-full"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-400">
                                                {user.name?.[0] || user.email[0].toUpperCase()}
                                            </div>
                                        )}
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-lg font-semibold text-white">
                                                    {user.name || "No Name"}
                                                </span>
                                                {ROLE_BADGES[user.role].label && (
                                                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${ROLE_BADGES[user.role].className}`}>
                                                        {ROLE_BADGES[user.role].label}
                                                    </span>
                                                )}
                                                {user.isSeller && (
                                                    <span className="px-2 py-0.5 text-xs font-medium bg-green-500/20 text-green-400 rounded">
                                                        💰 Seller
                                                    </span>
                                                )}
                                                {isBanned(user.bannedUntil) && (
                                                    <span className="px-2 py-0.5 text-xs font-medium bg-red-500/20 text-red-400 rounded">
                                                        {isPermanentBan(user.bannedUntil) ? "🔒 Permanently Banned" : "⏳ Temp Banned"}
                                                    </span>
                                                )}
                                                {user.isSupportAgent && (
                                                    <span className="px-2 py-0.5 text-xs font-medium bg-cyan-500/20 text-cyan-400 rounded">
                                                        💬 Support Agent
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-zinc-400">{user.email}</p>
                                            <div className="text-xs text-zinc-500 mt-1">
                                                {user._count.listings} listings • {user._count.orders} orders •
                                                Joined {new Date(user.createdAt).toLocaleDateString()}
                                            </div>
                                            {isBanned(user.bannedUntil) && !isPermanentBan(user.bannedUntil) && (
                                                <p className="text-xs text-red-400 mt-1">
                                                    Banned until: {new Date(user.bannedUntil!).toLocaleString()}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 flex-wrap">
                                        {/* Role Management - Only for Super Admins managing lower roles */}
                                        {currentUserRole === "SUPER_ADMIN" && canManageUser(user.role) && (
                                            <button
                                                onClick={() => {
                                                    setRoleModalUser(user);
                                                    setSelectedRole(user.role);
                                                }}
                                                className="px-4 py-2 text-sm font-medium text-purple-400 border border-purple-400/30 rounded-lg hover:bg-purple-400/10"
                                            >
                                                Change Role
                                            </button>
                                        )}

                                        {/* Support Agent Toggle - Only for Super Admins on ADMIN/MODERATOR users */}
                                        {currentUserRole === "SUPER_ADMIN" && (user.role === "ADMIN" || user.role === "MODERATOR") && (
                                            <button
                                                onClick={() => handleToggleSupportAgent(user)}
                                                disabled={processingId === user.id}
                                                className={`px-4 py-2 text-sm font-medium rounded-lg disabled:opacity-50 ${user.isSupportAgent
                                                        ? "text-cyan-400 border border-cyan-400/30 hover:bg-cyan-400/10"
                                                        : "text-zinc-400 border border-zinc-400/30 hover:bg-zinc-400/10"
                                                    }`}
                                            >
                                                {processingId === user.id
                                                    ? "..."
                                                    : user.isSupportAgent
                                                        ? "💬 Remove Support"
                                                        : "💬 Make Support Agent"
                                                }
                                            </button>
                                        )}

                                        {/* Ban/Unban - Can manage lower roles */}
                                        {canManageUser(user.role) && (
                                            <>
                                                {isBanned(user.bannedUntil) ? (
                                                    <button
                                                        onClick={() => handleUnbanUser(user.id)}
                                                        disabled={processingId === user.id}
                                                        className="px-4 py-2 text-sm font-medium text-green-400 border border-green-400/30 rounded-lg hover:bg-green-400/10 disabled:opacity-50"
                                                    >
                                                        {processingId === user.id ? "..." : "Unban"}
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => setBanModalUser(user)}
                                                        className="px-4 py-2 text-sm font-medium text-red-400 border border-red-400/30 rounded-lg hover:bg-red-400/10"
                                                    >
                                                        Ban User
                                                    </button>
                                                )}
                                            </>
                                        )}

                                        {/* Delete - Only Super Admin for admin accounts */}
                                        {currentUserRole === "SUPER_ADMIN" && canManageUser(user.role) && (
                                            <button
                                                onClick={() => handleDeleteUser(user)}
                                                disabled={processingId === user.id}
                                                className="px-4 py-2 text-sm font-medium text-red-500 border border-red-500/30 rounded-lg hover:bg-red-500/10 disabled:opacity-50"
                                            >
                                                {processingId === user.id ? "..." : "Delete"}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Listings List */}
            {subTab === "listings" && (
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-white">Listing Moderation</h2>
                    {filteredListings.length === 0 ? (
                        <div className="glass rounded-xl p-12 text-center">
                            <p className="text-zinc-400">No listings found</p>
                        </div>
                    ) : (
                        filteredListings.map((listing) => (
                            <div key={listing.id} className={`glass rounded-xl p-4 sm:p-6 ${listing.isBanned ? "opacity-60" : ""}`}>
                                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-lg font-semibold text-white">
                                                {listing.title}
                                            </span>
                                            {listing.isBanned && (
                                                <span className="px-2 py-0.5 text-xs font-medium bg-red-500/20 text-red-400 rounded">
                                                    🚫 Hidden
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xl font-bold gradient-text">₱{listing.price.toFixed(2)}</p>
                                        <p className="text-sm text-zinc-400 mt-1">
                                            {listing.game} • Seller: {listing.seller.name || listing.seller.email}
                                        </p>
                                        <p className="text-xs text-zinc-500 mt-1">
                                            Created {new Date(listing.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>

                                    {/* Actions */}
                                    <button
                                        onClick={() => handleToggleListingBan(listing.id, listing.isBanned)}
                                        disabled={processingId === listing.id}
                                        className={`px-4 py-2 text-sm font-medium rounded-lg disabled:opacity-50 ${listing.isBanned
                                            ? "text-green-400 border border-green-400/30 hover:bg-green-400/10"
                                            : "text-red-400 border border-red-400/30 hover:bg-red-400/10"
                                            }`}
                                    >
                                        {processingId === listing.id ? "..." : listing.isBanned ? "Unhide" : "Hide from Marketplace"}
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Ban Modal */}
            {banModalUser && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                    <div className="glass rounded-xl p-6 max-w-md w-full">
                        <h3 className="text-xl font-bold text-white mb-4">
                            Ban User: {banModalUser.name || banModalUser.email}
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-2">
                                    Ban Duration
                                </label>
                                <select
                                    value={banDuration}
                                    onChange={(e) => setBanDuration(e.target.value)}
                                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                    <option value="1">1 hour</option>
                                    <option value="6">6 hours</option>
                                    <option value="24">24 hours</option>
                                    <option value="72">3 days</option>
                                    <option value="168">1 week</option>
                                    <option value="720">30 days</option>
                                    <option value="permanent">Permanent</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-2">
                                    Reason (optional)
                                </label>
                                <textarea
                                    value={banReason}
                                    onChange={(e) => setBanReason(e.target.value)}
                                    placeholder="Enter reason for the ban..."
                                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                                    rows={3}
                                />
                            </div>

                            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                                <p className="text-sm text-yellow-400">
                                    ⚠️ This will also blacklist the user&apos;s IP address to prevent new account creation.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4 mt-6">
                            <button
                                onClick={() => setBanModalUser(null)}
                                className="flex-1 py-2 px-4 text-sm font-medium text-zinc-300 border border-zinc-600 rounded-lg hover:bg-zinc-700"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleBanUser}
                                disabled={processingId === banModalUser.id}
                                className="flex-1 py-2 px-4 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-500 disabled:opacity-50"
                            >
                                {processingId === banModalUser.id ? "Banning..." : "Confirm Ban"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Role Change Modal */}
            {roleModalUser && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                    <div className="glass rounded-xl p-6 max-w-md w-full">
                        <h3 className="text-xl font-bold text-white mb-4">
                            Change Role: {roleModalUser.name || roleModalUser.email}
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-2">
                                    Current Role
                                </label>
                                <div className={`px-4 py-2 rounded-lg ${ROLE_BADGES[roleModalUser.role].className || "bg-zinc-700 text-zinc-300"}`}>
                                    {ROLE_BADGES[roleModalUser.role].label || "User"}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-2">
                                    New Role
                                </label>
                                <select
                                    value={selectedRole}
                                    onChange={(e) => setSelectedRole(e.target.value as Role)}
                                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                    {canAssignRole("ADMIN") && <option value="ADMIN">🛡️ Admin</option>}
                                    {canAssignRole("MODERATOR") && <option value="MODERATOR">🔧 Moderator</option>}
                                    <option value="USER">👤 User</option>
                                </select>
                            </div>

                            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                <p className="text-sm text-blue-400">
                                    ℹ️ Changing roles affects what actions this user can perform in the admin panel.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4 mt-6">
                            <button
                                onClick={() => setRoleModalUser(null)}
                                className="flex-1 py-2 px-4 text-sm font-medium text-zinc-300 border border-zinc-600 rounded-lg hover:bg-zinc-700"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleChangeRole}
                                disabled={processingId === roleModalUser.id || selectedRole === roleModalUser.role}
                                className="flex-1 py-2 px-4 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-500 disabled:opacity-50"
                            >
                                {processingId === roleModalUser.id ? "Updating..." : "Update Role"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


"use client";

import { useState, useEffect } from "react";

interface Game {
    id: string;
    name: string;
    slug: string;
    imageUrl: string | null;
    isActive: boolean;
    sortOrder: number;
}

interface ItemType {
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
    sortOrder: number;
}

interface SystemSettings {
    transactionFeePercent: number;
}

interface SiteSettings {
    discordLink: string | null;
    twitterLink: string | null;
    instagramLink: string | null;
    supportEmail: string | null;
}

export default function AdminSettings() {
    const [settings, setSettings] = useState<SystemSettings | null>(null);
    const [siteSettings, setSiteSettings] = useState<SiteSettings>({
        discordLink: "",
        twitterLink: "",
        instagramLink: "",
        supportEmail: "",
    });
    const [games, setGames] = useState<Game[]>([]);
    const [itemTypes, setItemTypes] = useState<ItemType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isSavingSite, setIsSavingSite] = useState(false);
    const [newFee, setNewFee] = useState("");
    const [newGameName, setNewGameName] = useState("");
    const [newItemTypeName, setNewItemTypeName] = useState("");
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [settingsRes, siteSettingsRes, gamesRes, itemTypesRes] = await Promise.all([
                fetch("/api/admin/settings"),
                fetch("/api/admin/site-settings"),
                fetch("/api/admin/games"),
                fetch("/api/admin/item-types"),
            ]);

            if (settingsRes.ok) {
                const data = await settingsRes.json();
                setSettings(data);
                setNewFee(data.transactionFeePercent.toString());
            }

            if (siteSettingsRes.ok) {
                const data = await siteSettingsRes.json();
                setSiteSettings({
                    discordLink: data.discordLink || "",
                    twitterLink: data.twitterLink || "",
                    instagramLink: data.instagramLink || "",
                    supportEmail: data.supportEmail || "",
                });
            }

            if (gamesRes.ok) {
                setGames(await gamesRes.json());
            }

            if (itemTypesRes.ok) {
                setItemTypes(await itemTypesRes.json());
            }
        } catch (error) {
            console.error("Error fetching settings:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const showMessage = (type: "success" | "error", text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 3000);
    };

    const handleUpdateFee = async () => {
        const fee = parseFloat(newFee);
        if (isNaN(fee) || fee < 0 || fee > 100) {
            showMessage("error", "Fee must be between 0 and 100");
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch("/api/admin/settings", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ transactionFeePercent: fee }),
            });

            if (res.ok) {
                const data = await res.json();
                setSettings(data);
                showMessage("success", "Platform fee updated!");
            } else {
                showMessage("error", "Failed to update fee");
            }
        } catch {
            showMessage("error", "Error updating fee");
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdateSiteSettings = async () => {
        setIsSavingSite(true);
        try {
            const res = await fetch("/api/admin/site-settings", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(siteSettings),
            });

            if (res.ok) {
                showMessage("success", "Site settings updated!");
            } else {
                const error = await res.json();
                showMessage("error", error.error || "Failed to update site settings");
            }
        } catch {
            showMessage("error", "Error updating site settings");
        } finally {
            setIsSavingSite(false);
        }
    };

    const handleAddGame = async () => {
        if (!newGameName.trim()) return;

        try {
            const res = await fetch("/api/admin/games", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newGameName.trim() }),
            });

            if (res.ok) {
                const game = await res.json();
                setGames([...games, game]);
                setNewGameName("");
                showMessage("success", `Game "${game.name}" added!`);
            } else {
                const error = await res.json();
                showMessage("error", error.error || "Failed to add game");
            }
        } catch {
            showMessage("error", "Error adding game");
        }
    };

    const handleToggleGame = async (id: string, isActive: boolean) => {
        try {
            const res = await fetch(`/api/admin/games/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: !isActive }),
            });

            if (res.ok) {
                setGames(games.map(g => g.id === id ? { ...g, isActive: !isActive } : g));
            }
        } catch (error) {
            console.error("Error toggling game:", error);
        }
    };

    const handleAddItemType = async () => {
        if (!newItemTypeName.trim()) return;

        try {
            const res = await fetch("/api/admin/item-types", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newItemTypeName.trim() }),
            });

            if (res.ok) {
                const itemType = await res.json();
                setItemTypes([...itemTypes, itemType]);
                setNewItemTypeName("");
                showMessage("success", `Item type "${itemType.name}" added!`);
            } else {
                const error = await res.json();
                showMessage("error", error.error || "Failed to add item type");
            }
        } catch {
            showMessage("error", "Error adding item type");
        }
    };

    const handleToggleItemType = async (id: string, isActive: boolean) => {
        try {
            const res = await fetch(`/api/admin/item-types/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: !isActive }),
            });

            if (res.ok) {
                setItemTypes(itemTypes.map(t => t.id === id ? { ...t, isActive: !isActive } : t));
            }
        } catch (error) {
            console.error("Error toggling item type:", error);
        }
    };

    if (isLoading) {
        return (
            <div className="glass rounded-xl p-8 text-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-zinc-400 mt-4">Loading settings...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Message Toast */}
            {message && (
                <div className={`p-4 rounded-lg ${message.type === "success" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                    {message.text}
                </div>
            )}

            {/* Site Settings - Support & Social Links */}
            <div className="glass rounded-xl p-6">
                <h2 className="text-xl font-semibold text-white mb-4">📧 Site Settings</h2>
                <p className="text-zinc-400 text-sm mb-4">
                    Manage support email and social media links displayed on the site.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">
                            Support Email
                        </label>
                        <input
                            type="email"
                            value={siteSettings.supportEmail || ""}
                            onChange={(e) => setSiteSettings({ ...siteSettings, supportEmail: e.target.value })}
                            placeholder="support@example.com"
                            className="w-full px-4 py-2 rounded-lg bg-zinc-900 border border-white/10 text-white placeholder-zinc-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">
                            Discord Link
                        </label>
                        <input
                            type="url"
                            value={siteSettings.discordLink || ""}
                            onChange={(e) => setSiteSettings({ ...siteSettings, discordLink: e.target.value })}
                            placeholder="https://discord.gg/..."
                            className="w-full px-4 py-2 rounded-lg bg-zinc-900 border border-white/10 text-white placeholder-zinc-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">
                            Twitter/X Link
                        </label>
                        <input
                            type="url"
                            value={siteSettings.twitterLink || ""}
                            onChange={(e) => setSiteSettings({ ...siteSettings, twitterLink: e.target.value })}
                            placeholder="https://twitter.com/..."
                            className="w-full px-4 py-2 rounded-lg bg-zinc-900 border border-white/10 text-white placeholder-zinc-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">
                            Instagram Link
                        </label>
                        <input
                            type="url"
                            value={siteSettings.instagramLink || ""}
                            onChange={(e) => setSiteSettings({ ...siteSettings, instagramLink: e.target.value })}
                            placeholder="https://instagram.com/..."
                            className="w-full px-4 py-2 rounded-lg bg-zinc-900 border border-white/10 text-white placeholder-zinc-500"
                        />
                    </div>
                </div>

                <button
                    onClick={handleUpdateSiteSettings}
                    disabled={isSavingSite}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50"
                >
                    {isSavingSite ? "Saving..." : "Save Site Settings"}
                </button>
            </div>

            {/* Platform Fee */}
            <div className="glass rounded-xl p-6">
                <h2 className="text-xl font-semibold text-white mb-4">💰 Platform Fee</h2>
                <p className="text-zinc-400 text-sm mb-4">
                    Set the transaction fee percentage that is deducted from seller earnings.
                </p>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            value={newFee}
                            onChange={(e) => setNewFee(e.target.value)}
                            min="0"
                            max="100"
                            step="0.1"
                            className="w-24 px-4 py-2 rounded-lg bg-zinc-900 border border-white/10 text-white text-center"
                        />
                        <span className="text-zinc-400">%</span>
                    </div>
                    <button
                        onClick={handleUpdateFee}
                        disabled={isSaving}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50"
                    >
                        {isSaving ? "Saving..." : "Update Fee"}
                    </button>
                    {settings && (
                        <span className="text-zinc-500 text-sm">
                            Current: {settings.transactionFeePercent}%
                        </span>
                    )}
                </div>
            </div>

            {/* Games Management */}
            <div className="glass rounded-xl p-6">
                <h2 className="text-xl font-semibold text-white mb-4">🎮 Games</h2>
                <p className="text-zinc-400 text-sm mb-4">
                    Manage supported games. Active games appear in the Create Listing dropdown.
                </p>

                {/* Add Game */}
                <div className="flex items-center gap-2 mb-4">
                    <input
                        type="text"
                        value={newGameName}
                        onChange={(e) => setNewGameName(e.target.value)}
                        placeholder="New game name..."
                        className="flex-1 px-4 py-2 rounded-lg bg-zinc-900 border border-white/10 text-white placeholder-zinc-500"
                        onKeyDown={(e) => e.key === "Enter" && handleAddGame()}
                    />
                    <button
                        onClick={handleAddGame}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500"
                    >
                        Add Game
                    </button>
                </div>

                {/* Games List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {games.map((game) => (
                        <div
                            key={game.id}
                            className={`flex items-center justify-between p-3 rounded-lg border ${game.isActive
                                ? "bg-zinc-800/50 border-white/10"
                                : "bg-zinc-900/50 border-white/5 opacity-50"
                                }`}
                        >
                            <span className={game.isActive ? "text-white" : "text-zinc-500"}>
                                {game.name}
                            </span>
                            <button
                                onClick={() => handleToggleGame(game.id, game.isActive)}
                                className={`px-3 py-1 text-xs rounded ${game.isActive
                                    ? "bg-green-500/20 text-green-400"
                                    : "bg-zinc-700 text-zinc-400"
                                    }`}
                            >
                                {game.isActive ? "Active" : "Inactive"}
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Item Types Management */}
            <div className="glass rounded-xl p-6">
                <h2 className="text-xl font-semibold text-white mb-4">📦 Item Types</h2>
                <p className="text-zinc-400 text-sm mb-4">
                    Manage listing categories/types.
                </p>

                {/* Add Item Type */}
                <div className="flex items-center gap-2 mb-4">
                    <input
                        type="text"
                        value={newItemTypeName}
                        onChange={(e) => setNewItemTypeName(e.target.value)}
                        placeholder="New item type name..."
                        className="flex-1 px-4 py-2 rounded-lg bg-zinc-900 border border-white/10 text-white placeholder-zinc-500"
                        onKeyDown={(e) => e.key === "Enter" && handleAddItemType()}
                    />
                    <button
                        onClick={handleAddItemType}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500"
                    >
                        Add Type
                    </button>
                </div>

                {/* Item Types List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {itemTypes.map((itemType) => (
                        <div
                            key={itemType.id}
                            className={`flex items-center justify-between p-3 rounded-lg border ${itemType.isActive
                                ? "bg-zinc-800/50 border-white/10"
                                : "bg-zinc-900/50 border-white/5 opacity-50"
                                }`}
                        >
                            <span className={itemType.isActive ? "text-white" : "text-zinc-500"}>
                                {itemType.name}
                            </span>
                            <button
                                onClick={() => handleToggleItemType(itemType.id, itemType.isActive)}
                                className={`px-3 py-1 text-xs rounded ${itemType.isActive
                                    ? "bg-green-500/20 text-green-400"
                                    : "bg-zinc-700 text-zinc-400"
                                    }`}
                            >
                                {itemType.isActive ? "Active" : "Inactive"}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}


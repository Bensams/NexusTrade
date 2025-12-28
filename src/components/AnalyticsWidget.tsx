"use client";

import { useState, useEffect, useCallback } from "react";
import { getSocket } from "@/lib/socket";

interface Stats {
    onlineUsers: number;
    totalUsers: number;
    newUsersToday: number;
    visitsToday: number;
    visitsThisWeek: number;
}

export default function AnalyticsWidget() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [onlineCount, setOnlineCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    const fetchStats = useCallback(async () => {
        try {
            const res = await fetch("/api/admin/stats");
            if (res.ok) {
                const data: Stats = await res.json();
                setStats(data);
                setOnlineCount(data.onlineUsers);
            }
        } catch (error) {
            console.error("Error fetching stats:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();

        // Set up Socket.io for real-time online count updates
        const socket = getSocket();

        // Join admin room
        socket.emit("join-admin");

        // Listen for online count updates
        socket.on("online-count", (count: number) => {
            setOnlineCount(count);
        });

        // Cleanup on unmount
        return () => {
            socket.emit("leave-admin");
            socket.off("online-count");
        };
    }, [fetchStats]);

    // Track visit on component mount
    useEffect(() => {
        fetch("/api/track-visit", { method: "POST" }).catch(() => {
            // Silent fail for visit tracking
        });
    }, []);

    if (isLoading) {
        return (
            <div className="glass rounded-xl p-6 mb-8">
                <h2 className="text-xl font-semibold text-white mb-4">📊 Live Analytics</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-zinc-800/50 rounded-lg p-4 animate-pulse">
                            <div className="h-8 bg-zinc-700 rounded mb-2"></div>
                            <div className="h-4 bg-zinc-700 rounded w-20"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="glass rounded-xl p-6 mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">📊 Live Analytics</h2>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                {/* Online Users - Real-time */}
                <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/10 rounded-lg p-4 border border-green-500/20">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-xs text-green-400 font-medium">LIVE</span>
                    </div>
                    <div className="text-3xl font-bold text-green-400">{onlineCount}</div>
                    <div className="text-sm text-zinc-400">Online Now</div>
                </div>

                {/* Total Users */}
                <div className="bg-zinc-800/50 rounded-lg p-4">
                    <div className="text-3xl font-bold text-blue-400">{stats?.totalUsers || 0}</div>
                    <div className="text-sm text-zinc-400">Total Users</div>
                </div>

                {/* New Users Today */}
                <div className="bg-zinc-800/50 rounded-lg p-4">
                    <div className="text-3xl font-bold text-purple-400">
                        +{stats?.newUsersToday || 0}
                    </div>
                    <div className="text-sm text-zinc-400">New Today</div>
                </div>

                {/* Visits Today */}
                <div className="bg-zinc-800/50 rounded-lg p-4">
                    <div className="text-3xl font-bold text-yellow-400">{stats?.visitsToday || 0}</div>
                    <div className="text-sm text-zinc-400">Visits Today</div>
                </div>

                {/* Visits This Week */}
                <div className="bg-zinc-800/50 rounded-lg p-4">
                    <div className="text-3xl font-bold text-orange-400">{stats?.visitsThisWeek || 0}</div>
                    <div className="text-sm text-zinc-400">This Week</div>
                </div>
            </div>
        </div>
    );
}

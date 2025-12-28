"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

interface AuditLog {
    id: string;
    actionType: string;
    resourceId: string | null;
    resourceType: string | null;
    metadata: string | null;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: string;
    user: {
        id: string;
        name: string | null;
        email: string;
        image: string | null;
    };
}

interface AuditLogsResponse {
    logs: AuditLog[];
    pagination: {
        page: number;
        limit: number;
        totalCount: number;
        totalPages: number;
    };
    actionTypes: string[];
}

const ACTION_STYLES: Record<string, string> = {
    USER_LOGIN: "bg-blue-500/20 text-blue-400",
    USER_LOGOUT: "bg-zinc-500/20 text-zinc-400",
    ORDER_CREATED: "bg-green-500/20 text-green-400",
    ORDER_COMPLETED: "bg-emerald-500/20 text-emerald-400",
    LISTING_CREATED: "bg-purple-500/20 text-purple-400",
    LISTING_UPDATED: "bg-indigo-500/20 text-indigo-400",
    LISTING_DELETED: "bg-red-500/20 text-red-400",
    CHAT_INITIATED: "bg-yellow-500/20 text-yellow-400",
    WITHDRAWAL_REQUESTED: "bg-orange-500/20 text-orange-400",
    CASHIN_REQUESTED: "bg-teal-500/20 text-teal-400",
    PAYMENT_SUBMITTED: "bg-cyan-500/20 text-cyan-400",
    ADMIN_ACTION: "bg-pink-500/20 text-pink-400",
};

export default function AuditLogTable() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [actionTypes, setActionTypes] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedActionType, setSelectedActionType] = useState<string>("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    const fetchLogs = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: "25",
            });

            if (selectedActionType) {
                params.set("actionType", selectedActionType);
            }

            const res = await fetch(`/api/admin/audit-logs?${params}`);
            if (res.ok) {
                const data: AuditLogsResponse = await res.json();
                setLogs(data.logs);
                setTotalPages(data.pagination.totalPages);
                setTotalCount(data.pagination.totalCount);
                if (data.actionTypes.length > 0) {
                    setActionTypes(data.actionTypes);
                }
            }
        } catch (error) {
            console.error("Error fetching audit logs:", error);
        } finally {
            setIsLoading(false);
        }
    }, [page, selectedActionType]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const formatActionType = (type: string) => {
        return type.replace(/_/g, " ");
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleString();
    };

    const parseMetadata = (metadataStr: string | null): Record<string, unknown> | null => {
        if (!metadataStr) return null;
        try {
            return JSON.parse(metadataStr);
        } catch {
            return null;
        }
    };

    if (isLoading && logs.length === 0) {
        return (
            <div className="space-y-4">
                <h2 className="text-xl font-semibold text-white mb-4">Activity Logs</h2>
                <div className="glass rounded-xl p-12 text-center">
                    <div className="animate-pulse text-zinc-400">Loading audit logs...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-xl font-semibold text-white">
                    Activity Logs
                    <span className="text-sm text-zinc-400 font-normal ml-2">
                        ({totalCount} total)
                    </span>
                </h2>

                {/* Filters */}
                <div className="flex gap-2">
                    <select
                        value={selectedActionType}
                        onChange={(e) => {
                            setSelectedActionType(e.target.value);
                            setPage(1);
                        }}
                        className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                        <option value="">All Actions</option>
                        {actionTypes.map((type) => (
                            <option key={type} value={type}>
                                {formatActionType(type)}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {logs.length === 0 ? (
                <div className="glass rounded-xl p-12 text-center">
                    <p className="text-zinc-400">No activity logs found</p>
                </div>
            ) : (
                <>
                    {/* Log Cards */}
                    <div className="space-y-3">
                        {logs.map((log) => {
                            const metadata = parseMetadata(log.metadata);
                            return (
                                <div key={log.id} className="glass rounded-xl p-4">
                                    <div className="flex flex-col sm:flex-row gap-4 items-start">
                                        {/* User Avatar */}
                                        <div className="flex items-center gap-3">
                                            {log.user.image ? (
                                                <Image
                                                    src={log.user.image}
                                                    alt={log.user.name || "User"}
                                                    width={40}
                                                    height={40}
                                                    className="rounded-full"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-white text-sm font-medium">
                                                    {log.user.name?.charAt(0) || log.user.email.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </div>

                                        {/* Log Details */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                <span className={`px-2 py-0.5 text-xs font-medium rounded ${ACTION_STYLES[log.actionType] || "bg-zinc-500/20 text-zinc-400"}`}>
                                                    {formatActionType(log.actionType)}
                                                </span>
                                                <span className="text-xs text-zinc-500">
                                                    {formatDate(log.createdAt)}
                                                </span>
                                            </div>
                                            <div className="text-sm text-white">
                                                <span className="font-medium">{log.user.name || log.user.email}</span>
                                                {log.user.name && (
                                                    <span className="text-zinc-500 ml-1">({log.user.email})</span>
                                                )}
                                            </div>

                                            {/* Metadata */}
                                            {metadata && (
                                                <div className="mt-2 text-xs text-zinc-400">
                                                    {Object.entries(metadata).map(([key, value]) => (
                                                        <span key={key} className="mr-3">
                                                            <span className="text-zinc-500">{key}:</span>{" "}
                                                            {typeof value === "object" ? JSON.stringify(value) : String(value)}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Resource Info */}
                                            {log.resourceType && log.resourceId && (
                                                <div className="mt-1 text-xs text-zinc-500">
                                                    {log.resourceType}: <span className="text-zinc-400 font-mono">{log.resourceId.slice(0, 12)}...</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* IP Address */}
                                        {log.ipAddress && (
                                            <div className="text-xs text-zinc-500 font-mono">
                                                {log.ipAddress}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 pt-4">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-3 py-1 text-sm bg-zinc-800 text-zinc-300 rounded hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            <span className="text-sm text-zinc-400">
                                Page {page} of {totalPages}
                            </span>
                            <button
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="px-3 py-1 text-sm bg-zinc-800 text-zinc-300 rounded hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

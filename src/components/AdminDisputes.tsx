"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { MessageSquareWarning, Eye, CheckCircle, XCircle, Clock, User, ChevronDown, ChevronUp } from "lucide-react";

interface Message {
    id: string;
    content: string;
    createdAt: string;
    sender: {
        id: string;
        name: string | null;
        image: string | null;
    };
}

interface Conversation {
    id: string;
    messages: Message[];
    participants: {
        user: {
            id: string;
            name: string | null;
            image: string | null;
        };
    }[];
}

interface Dispute {
    id: string;
    reason: string;
    description: string;
    status: string;
    resolution: string | null;
    adminNotes: string | null;
    createdAt: string;
    resolvedAt: string | null;
    order: {
        id: string;
        status: string;
        buyerId: string;
        buyer: {
            id: string;
            name: string | null;
            email: string;
            image: string | null;
        };
        listing: {
            id: string;
            title: string;
            price: number;
            images: string[];
        };
        conversations: Conversation[];
    };
    openedBy: {
        id: string;
        name: string | null;
        email: string;
        image: string | null;
    };
    seller?: {
        id: string;
        name: string | null;
        email: string;
        image: string | null;
    };
    resolvedBy?: {
        id: string;
        name: string | null;
    } | null;
}

const STATUS_COLORS: Record<string, string> = {
    OPEN: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    UNDER_REVIEW: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    RESOLVED: "bg-green-500/20 text-green-400 border-green-500/30",
    CLOSED: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

const RESOLUTION_LABELS: Record<string, string> = {
    REFUND_BUYER: "Refunded to Buyer",
    RELEASE_TO_SELLER: "Released to Seller",
    PARTIAL_REFUND: "Partial Refund",
    NO_ACTION: "No Action Taken",
};

export default function AdminDisputes() {
    const [disputes, setDisputes] = useState<Dispute[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
    const [filter, setFilter] = useState<string>("all");

    useEffect(() => {
        fetchDisputes();
    }, []);

    const fetchDisputes = async () => {
        try {
            const res = await fetch("/api/admin/disputes");
            if (res.ok) {
                const data = await res.json();
                setDisputes(data);
            }
        } catch (error) {
            console.error("Error fetching disputes:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResolve = async (disputeId: string, action: string) => {
        setProcessingId(disputeId);
        try {
            const res = await fetch("/api/admin/disputes", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    disputeId,
                    action,
                    adminNotes: adminNotes[disputeId] || "",
                }),
            });

            if (res.ok) {
                await fetchDisputes();
            } else {
                const data = await res.json();
                alert(data.error || "Failed to resolve dispute");
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setProcessingId(null);
        }
    };

    const formatReason = (reason: string) => {
        return reason.replace(/_/g, " ").toLowerCase().replace(/^\w/, c => c.toUpperCase());
    };

    const filteredDisputes = disputes.filter(d => {
        if (filter === "all") return true;
        return d.status === filter;
    });

    const pendingCount = disputes.filter(d => d.status === "OPEN" || d.status === "UNDER_REVIEW").length;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <MessageSquareWarning className="w-6 h-6 text-orange-400" />
                    <div>
                        <h2 className="text-xl font-semibold text-white">Dispute Management</h2>
                        <p className="text-sm text-gray-400">
                            {pendingCount > 0 ? `${pendingCount} pending review` : "No pending disputes"}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {["all", "OPEN", "UNDER_REVIEW", "RESOLVED"].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${filter === f
                                    ? "bg-purple-600 text-white"
                                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                                }`}
                        >
                            {f === "all" ? "All" : f.replace("_", " ")}
                        </button>
                    ))}
                </div>
            </div>

            {/* Disputes List */}
            {filteredDisputes.length === 0 ? (
                <div className="glass rounded-xl p-12 text-center">
                    <MessageSquareWarning className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No disputes found</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredDisputes.map((dispute) => (
                        <div key={dispute.id} className="glass rounded-xl overflow-hidden">
                            {/* Dispute Header */}
                            <div
                                className="p-4 cursor-pointer hover:bg-gray-800/30 transition-colors"
                                onClick={() => setExpandedId(expandedId === dispute.id ? null : dispute.id)}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-4 flex-1 min-w-0">
                                        {/* Listing Image */}
                                        {dispute.order.listing.images?.[0] && (
                                            <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                                                <Image
                                                    src={dispute.order.listing.images[0]}
                                                    alt={dispute.order.listing.title}
                                                    width={64}
                                                    height={64}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        )}
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                <span className={`px-2 py-0.5 text-xs font-medium rounded border ${STATUS_COLORS[dispute.status]}`}>
                                                    {dispute.status.replace("_", " ")}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {new Date(dispute.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <h3 className="font-medium text-white truncate">
                                                {dispute.order.listing.title}
                                            </h3>
                                            <p className="text-sm text-gray-400">
                                                Reason: {formatReason(dispute.reason)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-lg font-semibold text-purple-400">
                                            ₱{dispute.order.listing.price.toFixed(2)}
                                        </span>
                                        {expandedId === dispute.id ? (
                                            <ChevronUp className="w-5 h-5 text-gray-400" />
                                        ) : (
                                            <ChevronDown className="w-5 h-5 text-gray-400" />
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Expanded Details */}
                            {expandedId === dispute.id && (
                                <div className="border-t border-gray-700/50 p-4 space-y-4">
                                    {/* Parties */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-gray-800/50 rounded-lg p-3">
                                            <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                                                <User className="w-4 h-4" />
                                                <span>Buyer (Opened Dispute)</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {dispute.openedBy.image && (
                                                    <Image
                                                        src={dispute.openedBy.image}
                                                        alt=""
                                                        width={32}
                                                        height={32}
                                                        className="rounded-full"
                                                    />
                                                )}
                                                <div>
                                                    <p className="text-white font-medium">{dispute.openedBy.name || "Unknown"}</p>
                                                    <p className="text-xs text-gray-500">{dispute.openedBy.email}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-gray-800/50 rounded-lg p-3">
                                            <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                                                <User className="w-4 h-4" />
                                                <span>Seller</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {dispute.seller?.image && (
                                                    <Image
                                                        src={dispute.seller.image}
                                                        alt=""
                                                        width={32}
                                                        height={32}
                                                        className="rounded-full"
                                                    />
                                                )}
                                                <div>
                                                    <p className="text-white font-medium">{dispute.seller?.name || "Unknown"}</p>
                                                    <p className="text-xs text-gray-500">{dispute.seller?.email}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Buyer's Description */}
                                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
                                        <p className="text-sm text-orange-400 font-medium mb-1">Buyer&apos;s Description:</p>
                                        <p className="text-gray-300">{dispute.description}</p>
                                    </div>

                                    {/* Chat History */}
                                    {dispute.order.conversations?.[0]?.messages?.length > 0 && (
                                        <div>
                                            <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                                                <Eye className="w-4 h-4" />
                                                <span>Chat History ({dispute.order.conversations[0].messages.length} messages)</span>
                                            </div>
                                            <div className="bg-gray-800/50 rounded-lg p-3 max-h-60 overflow-y-auto space-y-3">
                                                {dispute.order.conversations[0].messages.map((msg) => (
                                                    <div key={msg.id} className="flex gap-2">
                                                        {msg.sender.image && (
                                                            <Image
                                                                src={msg.sender.image}
                                                                alt=""
                                                                width={24}
                                                                height={24}
                                                                className="rounded-full w-6 h-6"
                                                            />
                                                        )}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-baseline gap-2">
                                                                <span className="text-sm font-medium text-white">
                                                                    {msg.sender.name || "Unknown"}
                                                                </span>
                                                                <span className="text-xs text-gray-500">
                                                                    {new Date(msg.createdAt).toLocaleString()}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-gray-300 break-words">{msg.content}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Resolution (if resolved) */}
                                    {dispute.status === "RESOLVED" && dispute.resolution && (
                                        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                                            <p className="text-sm text-green-400 font-medium mb-1">
                                                Resolution: {RESOLUTION_LABELS[dispute.resolution] || dispute.resolution}
                                            </p>
                                            {dispute.resolvedBy && (
                                                <p className="text-xs text-gray-400">
                                                    Resolved by {dispute.resolvedBy.name} on {new Date(dispute.resolvedAt!).toLocaleString()}
                                                </p>
                                            )}
                                            {dispute.adminNotes && (
                                                <p className="text-gray-300 mt-2 text-sm">{dispute.adminNotes}</p>
                                            )}
                                        </div>
                                    )}

                                    {/* Admin Actions (if open or under review) */}
                                    {(dispute.status === "OPEN" || dispute.status === "UNDER_REVIEW") && (
                                        <div className="space-y-3">
                                            <textarea
                                                placeholder="Admin notes (optional)..."
                                                value={adminNotes[dispute.id] || ""}
                                                onChange={(e) => setAdminNotes({ ...adminNotes, [dispute.id]: e.target.value })}
                                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                rows={2}
                                            />
                                            <div className="flex flex-wrap gap-2">
                                                {dispute.status === "OPEN" && (
                                                    <button
                                                        onClick={() => handleResolve(dispute.id, "UNDER_REVIEW")}
                                                        disabled={processingId === dispute.id}
                                                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-yellow-400 border border-yellow-400/30 rounded-lg hover:bg-yellow-400/10 disabled:opacity-50"
                                                    >
                                                        <Clock className="w-4 h-4" />
                                                        Mark Under Review
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleResolve(dispute.id, "REFUND_BUYER")}
                                                    disabled={processingId === dispute.id}
                                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-400 border border-green-400/30 rounded-lg hover:bg-green-400/10 disabled:opacity-50"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                    Refund Buyer
                                                </button>
                                                <button
                                                    onClick={() => handleResolve(dispute.id, "RELEASE_TO_SELLER")}
                                                    disabled={processingId === dispute.id}
                                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-400 border border-blue-400/30 rounded-lg hover:bg-blue-400/10 disabled:opacity-50"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                    Release to Seller
                                                </button>
                                                <button
                                                    onClick={() => handleResolve(dispute.id, "NO_ACTION")}
                                                    disabled={processingId === dispute.id}
                                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-400 border border-gray-400/30 rounded-lg hover:bg-gray-400/10 disabled:opacity-50"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                    Close (No Action)
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

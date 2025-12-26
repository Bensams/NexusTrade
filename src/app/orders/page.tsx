"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { PageSkeleton } from "@/components/Skeleton";

interface Order {
    id: string;
    status: string;
    createdAt: string;
    review?: {
        id: string;
        rating: number;
        comment?: string;
    };
    listing: {
        id: string;
        title: string;
        price: number;
        type: string;
        game: string;
        seller: {
            id: string;
            name: string | null;
        };
    };
}

const STATUS_STYLES: Record<string, string> = {
    PENDING: "bg-zinc-500/20 text-zinc-400",
    AWAITING_PAYMENT: "bg-blue-500/20 text-blue-400",
    PAYMENT_SUBMITTED: "bg-yellow-500/20 text-yellow-400",
    PAID: "bg-blue-500/20 text-blue-400",
    DELIVERY_SUBMITTED: "bg-purple-500/20 text-purple-400",
    COMPLETED: "bg-green-500/20 text-green-400",
    CANCELLED: "bg-red-500/20 text-red-400",
    REFUNDED: "bg-orange-500/20 text-orange-400",
};

const FILTER_OPTIONS = [
    { value: "all", label: "All" },
    { value: "active", label: "Processing" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
];

function StarRating({
    rating,
    onRate,
    editable = true,
}: {
    rating: number;
    onRate?: (rating: number) => void;
    editable?: boolean;
}) {
    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={() => editable && onRate?.(star)}
                    disabled={!editable}
                    className={`transition-colors ${editable ? "cursor-pointer hover:scale-110" : ""}`}
                >
                    <svg
                        className={`w-5 h-5 ${star <= rating ? "text-yellow-400" : "text-zinc-600"}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                </button>
            ))}
        </div>
    );
}

export default function OrdersPage() {
    const { data: session, status } = useSession();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [cancellingId, setCancellingId] = useState<string | null>(null);
    const [reviewingId, setReviewingId] = useState<string | null>(null);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState("");
    const [submittingReview, setSubmittingReview] = useState(false);

    useEffect(() => {
        if (session) {
            fetchOrders();
        }
    }, [session]);

    const fetchOrders = async () => {
        try {
            const res = await fetch("/api/orders");
            if (res.ok) {
                const data = await res.json();
                setOrders(data);
            }
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = async (id: string) => {
        if (!confirm("Are you sure you want to cancel this order?")) return;

        setCancellingId(id);
        try {
            const res = await fetch(`/api/orders/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "CANCELLED" }),
            });

            if (res.ok) {
                setOrders(
                    orders.map((order) =>
                        order.id === id ? { ...order, status: "CANCELLED" } : order
                    )
                );
            }
        } catch (error) {
            console.error("Error cancelling order:", error);
        } finally {
            setCancellingId(null);
        }
    };

    const handleSubmitReview = async (orderId: string) => {
        setSubmittingReview(true);
        try {
            const res = await fetch("/api/reviews", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    orderId,
                    rating: reviewRating,
                    comment: reviewComment || null,
                }),
            });

            if (res.ok) {
                const review = await res.json();
                setOrders(
                    orders.map((order) =>
                        order.id === orderId ? { ...order, review } : order
                    )
                );
                setReviewingId(null);
                setReviewRating(5);
                setReviewComment("");
            }
        } catch (error) {
            console.error("Error submitting review:", error);
        } finally {
            setSubmittingReview(false);
        }
    };

    if (status === "loading" || isLoading) {
        return (
            <div className="min-h-screen">
                <Navbar />
                <PageSkeleton type="orders" />
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

    return (
        <div className="min-h-screen">
            <Navbar />

            <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-1">My Orders</h1>
                            <p className="text-zinc-400">Track your purchases</p>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            {FILTER_OPTIONS.map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => setFilter(opt.value)}
                                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${filter === opt.value
                                        ? "bg-primary text-white"
                                        : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {(() => {
                        const filteredOrders = orders.filter((order) => {
                            if (filter === "all") return true;
                            if (filter === "active") return !["COMPLETED", "CANCELLED", "REFUNDED"].includes(order.status);
                            if (filter === "completed") return order.status === "COMPLETED";
                            if (filter === "cancelled") return order.status === "CANCELLED" || order.status === "REFUNDED";
                            return true;
                        });

                        if (filteredOrders.length === 0) {
                            return (
                                <div className="glass rounded-2xl p-12 text-center">
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-800 flex items-center justify-center">
                                        <svg className="w-8 h-8 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-semibold text-white mb-2">
                                        {filter === "all" ? "No orders yet" : `No ${filter} orders`}
                                    </h3>
                                    <p className="text-zinc-400 mb-6">
                                        {filter === "all" ? "Browse listings and make your first purchase" : "Try changing the filter"}
                                    </p>
                                    {filter === "all" && (
                                        <Link
                                            href="/"
                                            className="inline-flex items-center px-6 py-3 font-medium text-white bg-gradient-to-r from-primary to-accent rounded-xl"
                                        >
                                            Browse Listings
                                        </Link>
                                    )}
                                </div>
                            );
                        }

                        return (
                            <div className="space-y-4">
                                {filteredOrders.map((order) => (
                                    <div key={order.id} className="glass rounded-xl p-4 sm:p-6">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                    <span className={`px-2 py-1 text-xs font-medium rounded ${STATUS_STYLES[order.status] || STATUS_STYLES.PENDING}`}>
                                                        {order.status.replace(/_/g, " ")}
                                                    </span>
                                                    {order.review && (
                                                        <div className="flex items-center gap-1">
                                                            <StarRating rating={order.review.rating} editable={false} />
                                                        </div>
                                                    )}
                                                    <span className="text-xs text-zinc-500">
                                                        {new Date(order.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <Link
                                                    href={`/listings/${order.listing.id}`}
                                                    className="text-lg font-semibold text-white hover:text-primary transition-colors"
                                                >
                                                    {order.listing.title}
                                                </Link>
                                                <p className="text-sm text-zinc-400">
                                                    {order.listing.game} • Seller: {order.listing.seller.name}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <div className="text-xl font-bold gradient-text">
                                                    ₱{order.listing.price.toFixed(2)}
                                                </div>
                                                {order.status === "PENDING" && (
                                                    <button
                                                        onClick={() => handleCancel(order.id)}
                                                        disabled={cancellingId === order.id}
                                                        className="px-4 py-2 text-sm font-medium text-red-400 border border-red-400/30 rounded-lg hover:bg-red-400/10 transition-colors disabled:opacity-50"
                                                    >
                                                        {cancellingId === order.id ? "..." : "Cancel"}
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Review Section */}
                                        {order.status === "COMPLETED" && (
                                            <div className="mt-4 pt-4 border-t border-white/10">
                                                {order.review ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm text-zinc-400">Your rating:</span>
                                                        <StarRating rating={order.review.rating} editable={false} />
                                                    </div>
                                                ) : reviewingId === order.id ? (
                                                    <div className="space-y-3">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-sm text-zinc-400">Rate:</span>
                                                            <StarRating rating={reviewRating} onRate={setReviewRating} />
                                                        </div>
                                                        <textarea
                                                            value={reviewComment}
                                                            onChange={(e) => setReviewComment(e.target.value)}
                                                            placeholder="Write a review (optional)..."
                                                            className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 text-white text-sm placeholder-zinc-500 resize-none"
                                                            rows={2}
                                                        />
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleSubmitReview(order.id)}
                                                                disabled={submittingReview}
                                                                className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:opacity-90 disabled:opacity-50"
                                                            >
                                                                {submittingReview ? "Submitting..." : "Submit Review"}
                                                            </button>
                                                            <button
                                                                onClick={() => setReviewingId(null)}
                                                                className="px-4 py-2 text-sm font-medium text-zinc-400 border border-white/10 rounded-lg hover:bg-white/5"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setReviewingId(order.id)}
                                                        className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 rounded-lg hover:opacity-90 transition-all shadow-lg shadow-purple-500/25 animate-pulse flex items-center gap-2"
                                                    >
                                                        ⭐ Leave a Review
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        );
                    })()}
                </div>
            </div>
        </div>
    );
}

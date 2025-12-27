"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import { PageSkeleton } from "@/components/Skeleton";

interface AdminOrder {
    id: string;
    status: string;
    paymentMethod: string | null;
    paymentReceipt: string | null;
    deliveryProof: string | null;
    paidAt: string | null;
    createdAt: string;
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
        seller: {
            id: string;
            name: string | null;
            email: string;
        };
    };
}

interface Withdrawal {
    id: string;
    amount: number;
    status: string;
    payoutMethod: string;
    payoutNumber: string;
    payoutName: string;
    createdAt: string;
    user: {
        id: string;
        name: string | null;
        email: string;
    };
}

interface CashInRequest {
    id: string;
    amount: number;
    status: string;
    paymentMethod: string;
    proofUrl: string | null;
    createdAt: string;
    user: {
        id: string;
        name: string | null;
        email: string;
    };
}

const STATUS_STYLES: Record<string, string> = {
    PENDING: "bg-zinc-500/20 text-zinc-400",
    AWAITING_PAYMENT: "bg-blue-500/20 text-blue-400",
    PAYMENT_SUBMITTED: "bg-yellow-500/20 text-yellow-400",
    PAID: "bg-blue-500/20 text-blue-400",
    DELIVERY_SUBMITTED: "bg-purple-500/20 text-purple-400",
    COMPLETED: "bg-emerald-500/20 text-emerald-400",
    CANCELLED: "bg-red-500/20 text-red-400",
    REFUNDED: "bg-orange-500/20 text-orange-400",
    PROCESSING: "bg-blue-500/20 text-blue-400",
    REJECTED: "bg-red-500/20 text-red-400",
};

export default function AdminDashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [orders, setOrders] = useState<AdminOrder[]>([]);
    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
    const [cashInRequests, setCashInRequests] = useState<CashInRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [filter, setFilter] = useState<string>("all");

    useEffect(() => {
        if (session) {
            fetchOrders();
            fetchWithdrawals();
            fetchCashInRequests();
        }
    }, [session]);

    const fetchOrders = async () => {
        try {
            const res = await fetch("/api/admin/orders");
            if (res.ok) {
                const data = await res.json();
                setOrders(data);
            } else if (res.status === 403) {
                router.push("/");
            }
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchWithdrawals = async () => {
        try {
            const res = await fetch("/api/admin/withdrawals");
            if (res.ok) {
                const data = await res.json();
                setWithdrawals(data);
            }
        } catch (error) {
            console.error("Error fetching withdrawals:", error);
        }
    };

    const fetchCashInRequests = async () => {
        try {
            const res = await fetch("/api/admin/cashin");
            if (res.ok) {
                const data = await res.json();
                setCashInRequests(data);
            }
        } catch (error) {
            console.error("Error fetching cash in requests:", error);
        }
    };

    const handleAction = async (orderId: string, action: "approve" | "reject") => {
        setProcessingId(orderId);
        try {
            const res = await fetch("/api/admin/orders", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId, action }),
            });

            if (res.ok) {
                setOrders(
                    orders.map((order) =>
                        order.id === orderId
                            ? { ...order, status: action === "approve" ? "PAID" : "CANCELLED" }
                            : order
                    )
                );
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setProcessingId(null);
        }
    };

    const handleWithdrawalAction = async (withdrawalId: string, action: "process" | "complete" | "reject") => {
        setProcessingId(withdrawalId);
        try {
            const res = await fetch("/api/admin/withdrawals", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ withdrawalId, action }),
            });

            if (res.ok) {
                const newStatus = action === "complete" ? "COMPLETED" : action === "reject" ? "REJECTED" : "PROCESSING";
                setWithdrawals(
                    withdrawals.map((w) =>
                        w.id === withdrawalId ? { ...w, status: newStatus } : w
                    )
                );
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setProcessingId(null);
        }
    };

    const handleCashInAction = async (requestId: string, action: "approve" | "reject") => {
        setProcessingId(requestId);
        try {
            const res = await fetch("/api/admin/cashin", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: requestId, action }),
            });

            if (res.ok) {
                const newStatus = action === "approve" ? "APPROVED" : "REJECTED";
                setCashInRequests(
                    cashInRequests.map((req) =>
                        req.id === requestId ? { ...req, status: newStatus } : req
                    )
                );
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setProcessingId(null);
        }
    };

    const filteredOrders = orders.filter((order) => {
        if (filter === "all") return true;
        if (filter === "payments") return order.status === "PAYMENT_SUBMITTED";
        if (filter === "delivery") return order.status === "DELIVERY_SUBMITTED";
        if (filter === "withdrawals") return false; // Handled separately
        return order.status === filter.toUpperCase();
    });

    const pendingWithdrawals = withdrawals.filter(w => w.status === "PENDING" || w.status === "PROCESSING");

    if (status === "loading" || isLoading) {
        return (
            <div className="min-h-screen">
                <Navbar />
                <PageSkeleton type="admin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <Navbar />

            <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
                            <p className="text-zinc-400">Manage payments, orders, and withdrawals</p>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            {["all", "payments", "delivery", "withdrawals", "cashin", "completed"].map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${filter === f
                                        ? "bg-primary text-white"
                                        : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                                        }`}
                                >
                                    {f === "payments" ? "Payments" : f === "delivery" ? "Delivery" : f === "cashin" ? "Cash In" : f.charAt(0).toUpperCase() + f.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                        <div className="glass rounded-xl p-4 text-center">
                            <div className="text-2xl font-bold text-yellow-400">
                                {orders.filter((o) => o.status === "PAYMENT_SUBMITTED").length}
                            </div>
                            <div className="text-sm text-zinc-400">Pending Review</div>
                        </div>
                        <div className="glass rounded-xl p-4 text-center">
                            <div className="text-2xl font-bold text-green-400">
                                {orders.filter((o) => o.status === "PAID").length}
                            </div>
                            <div className="text-sm text-zinc-400">Approved</div>
                        </div>
                        <div className="glass rounded-xl p-4 text-center">
                            <div className="text-2xl font-bold text-emerald-400">
                                {orders.filter((o) => o.status === "COMPLETED").length}
                            </div>
                            <div className="text-sm text-zinc-400">Completed</div>
                        </div>
                        <div className="glass rounded-xl p-4 text-center">
                            <div className="text-2xl font-bold text-orange-400">
                                {pendingWithdrawals.length}
                            </div>
                            <div className="text-sm text-zinc-400">Pending Payouts</div>
                        </div>
                        <div className="glass rounded-xl p-4 text-center">
                            <div className="text-2xl font-bold text-blue-400">
                                {cashInRequests.filter(r => r.status === "PENDING").length}
                            </div>
                            <div className="text-sm text-zinc-400">Pending Cash In</div>
                        </div>
                    </div>

                    {/* Withdrawals Tab */}
                    {filter === "withdrawals" ? (
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold text-white mb-4">Seller Withdrawal Requests</h2>
                            {withdrawals.length === 0 ? (
                                <div className="glass rounded-xl p-12 text-center">
                                    <p className="text-zinc-400">No withdrawal requests</p>
                                </div>
                            ) : (
                                withdrawals.map((w) => (
                                    <div key={w.id} className="glass rounded-xl p-4 sm:p-6">
                                        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className={`px-2 py-1 text-xs font-medium rounded ${STATUS_STYLES[w.status] || STATUS_STYLES.PENDING}`}>
                                                        {w.status}
                                                    </span>
                                                    <span className="text-xs text-zinc-500">
                                                        {new Date(w.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <div className="text-lg font-semibold text-white mb-1">
                                                    {w.payoutName}
                                                </div>
                                                <div className="text-sm text-zinc-400">
                                                    {w.user.email} • {w.payoutMethod.toUpperCase()} • {w.payoutNumber}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-2xl font-bold text-green-400">
                                                    ₱{w.amount.toFixed(2)}
                                                </div>
                                                {w.status === "PENDING" && (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleWithdrawalAction(w.id, "complete")}
                                                            disabled={processingId === w.id}
                                                            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-500 disabled:opacity-50"
                                                        >
                                                            {processingId === w.id ? "..." : "Mark Paid"}
                                                        </button>
                                                        <button
                                                            onClick={() => handleWithdrawalAction(w.id, "reject")}
                                                            disabled={processingId === w.id}
                                                            className="px-4 py-2 text-sm font-medium text-red-400 border border-red-400/30 rounded-lg hover:bg-red-400/10 disabled:opacity-50"
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                )}
                                                {w.status === "PROCESSING" && (
                                                    <button
                                                        onClick={() => handleWithdrawalAction(w.id, "complete")}
                                                        disabled={processingId === w.id}
                                                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-500 disabled:opacity-50"
                                                    >
                                                        Confirm Paid
                                                    </button>
                                                )}
                                                {w.status === "COMPLETED" && (
                                                    <span className="text-sm text-green-400">✓ Paid</span>
                                                )}
                                                {w.status === "REJECTED" && (
                                                    <span className="text-sm text-red-400">✗ Rejected</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : filter === "cashin" ? (
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold text-white mb-4">Cash In Requests</h2>
                            {cashInRequests.length === 0 ? (
                                <div className="glass rounded-xl p-12 text-center">
                                    <p className="text-zinc-400">No cash in requests</p>
                                </div>
                            ) : (
                                cashInRequests.map((req) => (
                                    <div key={req.id} className="glass rounded-xl p-4 sm:p-6">
                                        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className={`px-2 py-1 text-xs font-medium rounded ${STATUS_STYLES[req.status] || STATUS_STYLES.PENDING}`}>
                                                        {req.status}
                                                    </span>
                                                    <span className="text-xs text-zinc-500">
                                                        {new Date(req.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <div className="text-lg font-semibold text-white mb-1">
                                                    ₱{req.amount.toFixed(2)}
                                                </div>
                                                <div className="text-sm text-zinc-400">
                                                    {req.user.email} • {req.paymentMethod.toUpperCase()}
                                                </div>
                                            </div>

                                            {/* Preview Receipt */}
                                            {req.proofUrl && (
                                                <div className="lg:w-48">
                                                    <button
                                                        onClick={() => setSelectedReceipt(req.proofUrl)}
                                                        className="w-full h-32 rounded-lg overflow-hidden bg-zinc-800 hover:opacity-90 transition-opacity"
                                                    >
                                                        <Image
                                                            src={req.proofUrl}
                                                            alt="Receipt"
                                                            width={200}
                                                            height={150}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </button>
                                                </div>
                                            )}

                                            <div className="flex items-center gap-4">
                                                {req.status === "PENDING" && (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleCashInAction(req.id, "approve")}
                                                            disabled={processingId === req.id}
                                                            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-500 disabled:opacity-50"
                                                        >
                                                            {processingId === req.id ? "..." : "Approve"}
                                                        </button>
                                                        <button
                                                            onClick={() => handleCashInAction(req.id, "reject")}
                                                            disabled={processingId === req.id}
                                                            className="px-4 py-2 text-sm font-medium text-red-400 border border-red-400/30 rounded-lg hover:bg-red-400/10 disabled:opacity-50"
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                )}
                                                {req.status === "APPROVED" && (
                                                    <span className="text-sm text-green-400">✓ Approved</span>
                                                )}
                                                {req.status === "REJECTED" && (
                                                    <span className="text-sm text-red-400">✗ Rejected</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        /* Orders List */
                        <div className="space-y-4">
                            {filteredOrders.length === 0 ? (
                                <div className="glass rounded-xl p-12 text-center">
                                    <p className="text-zinc-400">No orders found</p>
                                </div>
                            ) : (
                                filteredOrders.map((order) => (
                                    <div key={order.id} className="glass rounded-xl p-4 sm:p-6">
                                        <div className="flex flex-col lg:flex-row gap-4">
                                            {/* Order Info */}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className={`px-2 py-1 text-xs font-medium rounded ${STATUS_STYLES[order.status] || STATUS_STYLES.PENDING}`}>
                                                        {order.status.replace("_", " ")}
                                                    </span>
                                                    {order.paymentMethod && (
                                                        <span className="px-2 py-1 text-xs font-medium rounded bg-blue-500/20 text-blue-400">
                                                            {order.paymentMethod.toUpperCase()}
                                                        </span>
                                                    )}
                                                    <span className="text-xs text-zinc-500">
                                                        {new Date(order.createdAt).toLocaleString()}
                                                    </span>
                                                </div>

                                                <p className="text-lg font-semibold text-white mb-1">{order.listing.title}</p>
                                                <p className="text-xl font-bold gradient-text mb-3">₱{order.listing.price.toFixed(2)}</p>

                                                <div className="flex flex-wrap gap-4 text-sm">
                                                    <div>
                                                        <span className="text-zinc-500">Buyer: </span>
                                                        <span className="text-zinc-300">{order.buyer.name} ({order.buyer.email})</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-zinc-500">Seller: </span>
                                                        <span className="text-zinc-300">{order.listing.seller.name}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Receipt Preview */}
                                            {order.paymentReceipt && (
                                                <div className="lg:w-48">
                                                    <button
                                                        onClick={() => setSelectedReceipt(order.paymentReceipt)}
                                                        className="w-full h-32 rounded-lg overflow-hidden bg-zinc-800 hover:opacity-90 transition-opacity"
                                                    >
                                                        <Image
                                                            src={order.paymentReceipt}
                                                            alt="Receipt"
                                                            width={200}
                                                            height={150}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </button>
                                                    <p className="text-xs text-zinc-500 text-center mt-1">Payment Receipt</p>
                                                </div>
                                            )}

                                            {/* Delivery Proof Preview */}
                                            {order.deliveryProof && (
                                                <div className="lg:w-48">
                                                    <button
                                                        onClick={() => setSelectedReceipt(order.deliveryProof)}
                                                        className="w-full h-32 rounded-lg overflow-hidden bg-zinc-800 hover:opacity-90 transition-opacity"
                                                    >
                                                        <Image
                                                            src={order.deliveryProof}
                                                            alt="Delivery Proof"
                                                            width={200}
                                                            height={150}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </button>
                                                    <p className="text-xs text-zinc-500 text-center mt-1">Delivery Proof</p>
                                                </div>
                                            )}

                                            {/* Actions for Payment Approval */}
                                            {order.status === "PAYMENT_SUBMITTED" && (
                                                <div className="flex lg:flex-col gap-2 lg:w-32">
                                                    <button
                                                        onClick={() => handleAction(order.id, "approve")}
                                                        disabled={processingId === order.id}
                                                        className="flex-1 py-2 px-4 text-sm font-medium text-green-400 border border-green-400/30 rounded-lg hover:bg-green-400/10 disabled:opacity-50"
                                                    >
                                                        Approve Payment
                                                    </button>
                                                    <button
                                                        onClick={() => handleAction(order.id, "reject")}
                                                        disabled={processingId === order.id}
                                                        className="flex-1 py-2 px-4 text-sm font-medium text-red-400 border border-red-400/30 rounded-lg hover:bg-red-400/10 disabled:opacity-50"
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            )}

                                            {/* Actions for Delivery Verification */}
                                            {order.status === "DELIVERY_SUBMITTED" && (
                                                <div className="flex lg:flex-col gap-2 lg:w-32">
                                                    <button
                                                        onClick={() => handleAction(order.id, "approve")}
                                                        disabled={processingId === order.id}
                                                        className="flex-1 py-2 px-4 text-sm font-medium text-green-400 border border-green-400/30 rounded-lg hover:bg-green-400/10 disabled:opacity-50"
                                                    >
                                                        Verify Delivery
                                                    </button>
                                                    <button
                                                        onClick={() => handleAction(order.id, "reject")}
                                                        disabled={processingId === order.id}
                                                        className="flex-1 py-2 px-4 text-sm font-medium text-red-400 border border-red-400/30 rounded-lg hover:bg-red-400/10 disabled:opacity-50"
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Receipt Modal */}
            {selectedReceipt && (
                <div
                    className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
                    onClick={() => setSelectedReceipt(null)}
                >
                    <div className="max-w-2xl max-h-[90vh] overflow-auto">
                        <Image
                            src={selectedReceipt}
                            alt="Receipt"
                            width={600}
                            height={800}
                            className="rounded-lg"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

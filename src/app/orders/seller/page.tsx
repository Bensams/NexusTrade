"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import { PageSkeleton } from "@/components/Skeleton";

interface SellerOrder {
    id: string;
    status: string;
    createdAt: string;
    deliveryProof: string | null;
    listing: {
        id: string;
        title: string;
        price: number;
        type: string;
        game: string;
    };
    buyer: {
        id: string;
        name: string | null;
        email: string;
        image: string | null;
    };
}

const STATUS_STYLES: Record<string, string> = {
    PENDING: "bg-zinc-500/20 text-zinc-400",
    AWAITING_PAYMENT: "bg-blue-500/20 text-blue-400",
    PAYMENT_SUBMITTED: "bg-blue-500/20 text-blue-400",
    PAID: "bg-yellow-500/20 text-yellow-400",
    DELIVERY_SUBMITTED: "bg-purple-500/20 text-purple-400",
    COMPLETED: "bg-green-500/20 text-green-400",
    CANCELLED: "bg-red-500/20 text-red-400",
};

type FilterType = "ALL" | "AWAITING_DELIVERY" | "PENDING_VERIFICATION" | "COMPLETED" | "CANCELLED";

const FILTER_TABS: { key: FilterType; label: string }[] = [
    { key: "ALL", label: "All" },
    { key: "AWAITING_DELIVERY", label: "Awaiting Delivery" },
    { key: "PENDING_VERIFICATION", label: "Pending Verification" },
    { key: "COMPLETED", label: "Completed" },
    { key: "CANCELLED", label: "Cancelled" },
];

export default function SellerOrdersPage() {
    const { data: session, status } = useSession();
    const [orders, setOrders] = useState<SellerOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [uploadingId, setUploadingId] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [uploadModalOrder, setUploadModalOrder] = useState<SellerOrder | null>(null);
    const [activeFilter, setActiveFilter] = useState<FilterType>("ALL");

    useEffect(() => {
        if (session) {
            fetchOrders();
        }
    }, [session]);

    const fetchOrders = async () => {
        try {
            const res = await fetch("/api/orders/seller");
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

    // Filter orders based on active filter
    const getFilteredOrders = () => {
        switch (activeFilter) {
            case "AWAITING_DELIVERY":
                return orders.filter((o) => o.status === "PAID");
            case "PENDING_VERIFICATION":
                return orders.filter((o) => o.status === "DELIVERY_SUBMITTED");
            case "COMPLETED":
                return orders.filter((o) => o.status === "COMPLETED");
            case "CANCELLED":
                return orders.filter((o) => o.status === "CANCELLED" || o.status === "REFUNDED");
            default:
                return orders;
        }
    };

    const filteredOrders = getFilteredOrders();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleUploadDelivery = async () => {
        if (!selectedFile || !uploadModalOrder) return;

        setUploadingId(uploadModalOrder.id);
        try {
            const formData = new FormData();
            formData.append("orderId", uploadModalOrder.id);
            formData.append("proof", selectedFile);

            const res = await fetch("/api/payments/delivery", {
                method: "POST",
                body: formData,
            });

            if (res.ok) {
                setOrders(
                    orders.map((order) =>
                        order.id === uploadModalOrder.id
                            ? { ...order, status: "DELIVERY_SUBMITTED" }
                            : order
                    )
                );
                setUploadModalOrder(null);
                setSelectedFile(null);
                setPreviewUrl(null);
            }
        } catch (error) {
            console.error("Error uploading delivery:", error);
        } finally {
            setUploadingId(null);
        }
    };

    // Navigate to existing conversation for this order
    const goToConversation = (orderId: string) => {
        window.location.href = `/messages?orderId=${orderId}`;
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

    const paidOrders = orders.filter((o) => o.status === "PAID");
    const completedOrders = orders.filter((o) => o.status === "COMPLETED");

    return (
        <div className="min-h-screen">
            <Navbar />

            <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-3xl font-bold text-white mb-2">Seller Dashboard</h1>
                    <p className="text-zinc-400 mb-8">Manage incoming orders and deliveries</p>

                    {/* Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                        <div className="glass rounded-xl p-4 text-center">
                            <div className="text-2xl font-bold text-yellow-400">{paidOrders.length}</div>
                            <div className="text-sm text-zinc-400">Awaiting Delivery</div>
                        </div>
                        <div className="glass rounded-xl p-4 text-center">
                            <div className="text-2xl font-bold text-purple-400">
                                {orders.filter((o) => o.status === "DELIVERY_SUBMITTED").length}
                            </div>
                            <div className="text-sm text-zinc-400">Pending Verification</div>
                        </div>
                        <div className="glass rounded-xl p-4 text-center">
                            <div className="text-2xl font-bold text-green-400">{completedOrders.length}</div>
                            <div className="text-sm text-zinc-400">Completed</div>
                        </div>
                        <div className="glass rounded-xl p-4 text-center">
                            <div className="text-2xl font-bold gradient-text">
                                ₱{completedOrders.reduce((sum, o) => sum + o.listing.price, 0).toFixed(2)}
                            </div>
                            <div className="text-sm text-zinc-400">Earned</div>
                        </div>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex flex-wrap gap-2 mb-6">
                        {FILTER_TABS.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveFilter(tab.key)}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeFilter === tab.key
                                    ? "bg-gradient-to-r from-primary to-accent text-white"
                                    : "glass text-zinc-400 hover:text-white hover:bg-white/5"
                                    }`}
                            >
                                {tab.label}
                                {tab.key !== "ALL" && (
                                    <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-white/10">
                                        {tab.key === "AWAITING_DELIVERY" && paidOrders.length}
                                        {tab.key === "PENDING_VERIFICATION" && orders.filter((o) => o.status === "DELIVERY_SUBMITTED").length}
                                        {tab.key === "COMPLETED" && completedOrders.length}
                                        {tab.key === "CANCELLED" && orders.filter((o) => o.status === "CANCELLED" || o.status === "REFUNDED").length}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {filteredOrders.length === 0 ? (
                        <div className="glass rounded-2xl p-12 text-center">
                            <h3 className="text-xl font-semibold text-white mb-2">
                                {activeFilter === "ALL" ? "No orders yet" : `No ${FILTER_TABS.find(t => t.key === activeFilter)?.label.toLowerCase()} orders`}
                            </h3>
                            <p className="text-zinc-400">
                                {activeFilter === "ALL"
                                    ? "Orders will appear here when buyers purchase your listings"
                                    : "Try selecting a different filter"}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredOrders.map((order) => (
                                <div key={order.id} className="glass rounded-xl p-4 sm:p-6">
                                    <div className="flex flex-col lg:flex-row gap-4">
                                        {/* Buyer Info */}
                                        <div className="flex items-center gap-3">
                                            {order.buyer.image ? (
                                                <Image
                                                    src={order.buyer.image}
                                                    alt={order.buyer.name || "Buyer"}
                                                    width={40}
                                                    height={40}
                                                    className="w-10 h-10 rounded-full"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                                                    <span className="text-sm font-bold text-white">
                                                        {order.buyer.name?.charAt(0).toUpperCase() || "B"}
                                                    </span>
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-medium text-white">{order.buyer.name}</p>
                                                <button
                                                    onClick={() => goToConversation(order.id)}
                                                    className="text-xs text-primary hover:underline"
                                                >
                                                    Message Buyer
                                                </button>
                                            </div>
                                        </div>

                                        {/* Order Info */}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`px-2 py-1 text-xs font-medium rounded ${STATUS_STYLES[order.status] || STATUS_STYLES.PENDING}`}>
                                                    {order.status.replace("_", " ")}
                                                </span>
                                                <span className="text-xs text-zinc-500">
                                                    {new Date(order.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <Link
                                                href={`/listings/${order.listing.id}`}
                                                className="text-white hover:text-primary transition-colors"
                                            >
                                                {order.listing.title}
                                            </Link>
                                            <div className="text-lg font-bold gradient-text">
                                                ₱{order.listing.price.toFixed(2)}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2">
                                            {order.status === "PAID" && (
                                                <button
                                                    onClick={() => setUploadModalOrder(order)}
                                                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-primary to-accent rounded-lg hover:opacity-90"
                                                >
                                                    Upload Delivery Proof
                                                </button>
                                            )}
                                            {order.status === "DELIVERY_SUBMITTED" && (
                                                <span className="text-sm text-purple-400">Awaiting admin verification</span>
                                            )}
                                            {order.status === "COMPLETED" && (
                                                <span className="text-sm text-green-400">✓ Completed</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Upload Modal */}
            {uploadModalOrder && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                    <div className="glass rounded-2xl p-6 max-w-md w-full">
                        <h2 className="text-xl font-bold text-white mb-2">Upload Delivery Proof</h2>
                        <p className="text-zinc-400 text-sm mb-4">
                            Upload a screenshot showing proof of delivery/service completion for &quot;{uploadModalOrder.listing.title}&quot;
                        </p>

                        {previewUrl ? (
                            <div className="relative mb-4">
                                <Image
                                    src={previewUrl}
                                    alt="Preview"
                                    width={300}
                                    height={200}
                                    className="w-full max-h-48 object-contain rounded-lg bg-zinc-900"
                                />
                                <button
                                    onClick={() => {
                                        setSelectedFile(null);
                                        setPreviewUrl(null);
                                    }}
                                    className="absolute top-2 right-2 p-1 bg-red-500 rounded-full text-white"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        ) : (
                            <label className="block mb-4">
                                <div className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors">
                                    <svg className="w-10 h-10 mx-auto text-zinc-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <p className="text-zinc-400 text-sm">Click to upload proof</p>
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                            </label>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={handleUploadDelivery}
                                disabled={!selectedFile || uploadingId === uploadModalOrder.id}
                                className="flex-1 py-2 font-medium text-white bg-gradient-to-r from-primary to-accent rounded-lg hover:opacity-90 disabled:opacity-50"
                            >
                                {uploadingId === uploadModalOrder.id ? "Uploading..." : "Submit"}
                            </button>
                            <button
                                onClick={() => {
                                    setUploadModalOrder(null);
                                    setSelectedFile(null);
                                    setPreviewUrl(null);
                                }}
                                className="px-4 py-2 text-zinc-400 hover:text-white"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

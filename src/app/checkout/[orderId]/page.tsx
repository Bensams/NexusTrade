"use client";

import { useState, useEffect, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";

interface Order {
    id: string;
    status: string;
    paymentMethod: string | null;
    listing: {
        id: string;
        title: string;
        price: number;
        game: string;
        seller: { name: string | null };
    };
}

// Replace with your actual QR code images
const PAYMENT_QR = {
    gcash: "/qr/gcash-qr.jpg",
    maya: "/qr/maya-qr.jpg",
};

export default function CheckoutPage({ params }: { params: Promise<{ orderId: string }> }) {
    const { orderId } = use(params);
    const { data: session, status } = useSession();
    const router = useRouter();
    const [order, setOrder] = useState<Order | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedMethod, setSelectedMethod] = useState<"gcash" | "maya" | null>(null);
    const [receiptFile, setReceiptFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        if (session) {
            fetchOrder();
        }
    }, [session, orderId]);

    const fetchOrder = async () => {
        try {
            const res = await fetch(`/api/orders/${orderId}`);
            if (res.ok) {
                const data = await res.json();
                setOrder(data);
                if (data.status === "PAYMENT_SUBMITTED") {
                    setSubmitted(true);
                }
            } else {
                router.push("/orders");
            }
        } catch {
            router.push("/orders");
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setReceiptFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async () => {
        if (!selectedMethod || !receiptFile) return;

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append("orderId", orderId);
            formData.append("paymentMethod", selectedMethod);
            formData.append("receipt", receiptFile);

            const res = await fetch("/api/payments/upload", {
                method: "POST",
                body: formData,
            });

            if (res.ok) {
                setSubmitted(true);
            }
        } catch (error) {
            console.error("Error submitting payment:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (status === "loading" || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!session || !order) {
        return null;
    }

    if (submitted) {
        return (
            <div className="min-h-screen">
                <Navbar />
                <div className="pt-24 pb-12 px-4 max-w-lg mx-auto text-center">
                    <div className="glass rounded-2xl p-8">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">Payment Submitted!</h1>
                        <p className="text-zinc-400 mb-6">
                            We&apos;re verifying your payment. This usually takes a few minutes.
                            You&apos;ll be notified once approved.
                        </p>
                        <Link
                            href="/orders"
                            className="inline-block px-6 py-3 font-medium text-white bg-gradient-to-r from-primary to-accent rounded-xl"
                        >
                            View My Orders
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <Navbar />

            <div className="pt-24 pb-12 px-4 max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold text-white mb-2">Checkout</h1>
                <p className="text-zinc-400 mb-8">Complete your payment</p>

                {/* Order Summary */}
                <div className="glass rounded-xl p-6 mb-6">
                    <h2 className="text-lg font-semibold text-white mb-4">Order Summary</h2>
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-white font-medium">{order.listing.title}</p>
                            <p className="text-sm text-zinc-400">{order.listing.game} • {order.listing.seller.name}</p>
                        </div>
                        <div className="text-2xl font-bold gradient-text">
                            ₱{order.listing.price.toFixed(2)}
                        </div>
                    </div>
                </div>

                {/* Payment Method Selection */}
                {!selectedMethod ? (
                    <div className="glass rounded-xl p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">Select Payment Method</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setSelectedMethod("gcash")}
                                className="p-6 rounded-xl border-2 border-white/10 hover:border-primary/50 transition-colors text-center"
                            >
                                <div className="w-16 h-16 mx-auto mb-3 bg-blue-500 rounded-xl flex items-center justify-center">
                                    <span className="text-2xl font-bold text-white">G</span>
                                </div>
                                <span className="text-white font-medium">GCash</span>
                            </button>
                            <button
                                onClick={() => setSelectedMethod("maya")}
                                className="p-6 rounded-xl border-2 border-white/10 hover:border-primary/50 transition-colors text-center"
                            >
                                <div className="w-16 h-16 mx-auto mb-3 bg-green-500 rounded-xl flex items-center justify-center">
                                    <span className="text-2xl font-bold text-white">M</span>
                                </div>
                                <span className="text-white font-medium">Maya</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* QR Code Display */}
                        <div className="glass rounded-xl p-6 text-center">
                            <h2 className="text-lg font-semibold text-white mb-4">
                                Scan QR Code with {selectedMethod === "gcash" ? "GCash" : "Maya"}
                            </h2>
                            <div className="w-64 h-64 mx-auto bg-white rounded-xl p-4 mb-4">
                                <Image
                                    src={PAYMENT_QR[selectedMethod]}
                                    alt={`${selectedMethod} QR Code`}
                                    width={224}
                                    height={224}
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                        // Fallback if QR image doesn't exist
                                        e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%23f0f0f0' width='100' height='100'/%3E%3Ctext x='50' y='55' text-anchor='middle' font-size='12' fill='%23666'%3EAdd QR%3C/text%3E%3C/svg%3E";
                                    }}
                                />
                            </div>
                            <p className="text-zinc-400 text-sm mb-2">
                                Amount to send: <span className="text-white font-bold">₱{order.listing.price.toFixed(2)}</span>
                            </p>
                            <button
                                onClick={() => setSelectedMethod(null)}
                                className="text-sm text-primary hover:underline"
                            >
                                Change payment method
                            </button>
                        </div>

                        {/* Receipt Upload */}
                        <div className="glass rounded-xl p-6">
                            <h2 className="text-lg font-semibold text-white mb-4">Upload Payment Receipt</h2>
                            <p className="text-zinc-400 text-sm mb-4">
                                After sending the payment, take a screenshot and upload it here.
                            </p>

                            {previewUrl ? (
                                <div className="relative mb-4">
                                    <Image
                                        src={previewUrl}
                                        alt="Receipt preview"
                                        width={300}
                                        height={400}
                                        className="w-full max-h-64 object-contain rounded-lg bg-zinc-900"
                                    />
                                    <button
                                        onClick={() => {
                                            setReceiptFile(null);
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
                                <label className="block">
                                    <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors">
                                        <svg className="w-12 h-12 mx-auto text-zinc-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <p className="text-zinc-400">Click to upload receipt screenshot</p>
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                </label>
                            )}

                            <button
                                onClick={handleSubmit}
                                disabled={!receiptFile || isSubmitting}
                                className="w-full mt-4 py-3 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-primary to-accent hover:opacity-90 disabled:opacity-50"
                            >
                                {isSubmitting ? "Submitting..." : "Submit Payment"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { PageSkeleton } from "@/components/Skeleton";

interface Withdrawal {
    id: string;
    amount: number;
    status: string;
    payoutMethod: string;
    payoutNumber: string;
    createdAt: string;
    processedAt: string | null;
}

const PAYMENT_QRS: Record<string, string> = {
    gcash: "/qr/gcash-qr.jpg",
    maya: "/qr/maya-qr.jpg",
};

interface WalletData {
    balance: number;
    availableBalance: number;
    pendingWithdrawals: number;
    payoutMethod: string | null;
    payoutNumber: string | null;
    fullName: string | null;
    withdrawals: Withdrawal[];
    isSeller: boolean;
}

const STATUS_STYLES: Record<string, string> = {
    PENDING: "bg-yellow-500/20 text-yellow-400",
    PROCESSING: "bg-blue-500/20 text-blue-400",
    COMPLETED: "bg-green-500/20 text-green-400",
    REJECTED: "bg-red-500/20 text-red-400",
};

export default function WalletPage() {
    const { data: session, status } = useSession();
    const [wallet, setWallet] = useState<WalletData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [tab, setTab] = useState<"cashin" | "withdraw">("cashin");

    // Withdraw State
    const [withdrawAmount, setWithdrawAmount] = useState("");

    // Cash In State
    const [cashInAmount, setCashInAmount] = useState("");
    const [cashInMethod, setCashInMethod] = useState<"gcash" | "maya">("gcash");
    const [receiptFile, setReceiptFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        if (session) {
            fetchWallet();
        }
    }, [session]);

    const fetchWallet = async () => {
        try {
            const res = await fetch("/api/user/withdrawals");
            if (res.ok) {
                const data = await res.json();
                setWallet(data);
            }
        } catch (error) {
            console.error("Error fetching wallet:", error);
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

    const handleCashIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!cashInAmount || Number(cashInAmount) < 50) {
            setError("Minimum cash in is ₱50");
            return;
        }

        if (!receiptFile) {
            setError("Please upload a payment receipt");
            return;
        }

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append("amount", cashInAmount);
            formData.append("paymentMethod", cashInMethod);
            formData.append("receipt", receiptFile);

            const res = await fetch("/api/wallet/cashin", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (res.ok) {
                setSuccess("Cash in request submitted! Admin will review it shortly.");
                setCashInAmount("");
                setReceiptFile(null);
                setPreviewUrl(null);
            } else {
                setError(data.error || "Failed to submit request");
            }
        } catch {
            setError("Something went wrong");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleWithdraw = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        const amount = parseFloat(withdrawAmount);
        if (!amount || amount <= 0) {
            setError("Enter a valid amount");
            return;
        }

        if (wallet && amount > wallet.availableBalance) {
            setError("Insufficient balance");
            return;
        }

        if (amount < 50) {
            setError("Minimum withdrawal is ₱50");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch("/api/user/withdrawals", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount }),
            });

            const data = await res.json();

            if (res.ok) {
                setSuccess("Withdrawal request submitted! We'll process it within 24 hours.");
                setWithdrawAmount("");
                fetchWallet();
            } else {
                setError(data.error || "Failed to request withdrawal");
            }
        } catch {
            setError("Something went wrong");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (status === "loading" || isLoading) {
        return (
            <div className="min-h-screen">
                <Navbar />
                <PageSkeleton type="wallet" />
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

    if (!wallet) return null;

    return (
        <div className="min-h-screen">
            <Navbar />

            <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-3xl font-bold text-white mb-2">My Wallet</h1>
                    <p className="text-zinc-400 mb-8">Manage your funds and transactions</p>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column: Balance & Actions */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Balance Card */}
                            <div className="glass rounded-2xl p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <p className="text-zinc-400 text-sm mb-1">Total Balance</p>
                                        <h2 className="text-4xl font-bold text-white">₱{wallet.balance.toFixed(2)}</h2>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-zinc-400 text-sm mb-1">Available</p>
                                        <p className="text-xl font-bold text-green-400">₱{wallet.availableBalance.toFixed(2)}</p>
                                    </div>
                                </div>

                                {/* Tabs */}
                                <div className="flex p-1 bg-white/5 rounded-xl mb-6">
                                    <button
                                        onClick={() => setTab("cashin")}
                                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${tab === "cashin" ? "bg-primary text-white shadow-lg" : "text-zinc-400 hover:text-white"
                                            }`}
                                    >
                                        Cash In
                                    </button>
                                    {wallet.isSeller && (
                                        <button
                                            onClick={() => setTab("withdraw")}
                                            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${tab === "withdraw" ? "bg-primary text-white shadow-lg" : "text-zinc-400 hover:text-white"
                                                }`}
                                        >
                                            Withdraw
                                        </button>
                                    )}
                                </div>

                                {error && (
                                    <div className="p-4 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                        {error}
                                    </div>
                                )}
                                {success && (
                                    <div className="p-4 mb-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
                                        {success}
                                    </div>
                                )}

                                {tab === "cashin" ? (
                                    <form onSubmit={handleCashIn} className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-300 mb-2">Amount to Cash In</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">₱</span>
                                                <input
                                                    type="number"
                                                    value={cashInAmount}
                                                    onChange={(e) => setCashInAmount(e.target.value)}
                                                    placeholder="0.00"
                                                    min="50"
                                                    step="0.01"
                                                    className="w-full px-4 py-3 pl-8 rounded-xl bg-zinc-900 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-primary/50"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-zinc-300 mb-2">Payment Method</label>
                                            <div className="grid grid-cols-2 gap-4">
                                                {(["gcash", "maya"] as const).map((method) => (
                                                    <button
                                                        key={method}
                                                        type="button"
                                                        onClick={() => setCashInMethod(method)}
                                                        className={`p-4 rounded-xl border-2 transition-all ${cashInMethod === method
                                                            ? "border-primary bg-primary/10 text-white"
                                                            : "border-white/10 hover:border-white/30 text-zinc-400"
                                                            }`}
                                                    >
                                                        <span className="capitalize font-bold">{method}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10">
                                            <p className="text-sm text-zinc-400 mb-2">Scan to Pay using {cashInMethod.toUpperCase()}</p>
                                            <div className="w-full max-w-[200px] aspect-square mx-auto bg-white rounded-lg overflow-hidden mb-2">
                                                <img
                                                    src={PAYMENT_QRS[cashInMethod]}
                                                    alt={`${cashInMethod} QR Code`}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <p className="text-xs text-zinc-500">Send exactly ₱{Number(cashInAmount || 0).toFixed(2)}</p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-zinc-300 mb-2">Upload Receipt</label>
                                            {previewUrl ? (
                                                <div className="relative">
                                                    <img src={previewUrl} alt="Receipt" className="w-full h-48 object-cover rounded-xl" />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setReceiptFile(null);
                                                            setPreviewUrl(null);
                                                        }}
                                                        className="absolute top-2 right-2 p-1 bg-red-500 rounded-full text-white"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ) : (
                                                <label className="block cursor-pointer">
                                                    <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
                                                        <p className="text-zinc-400">Click to upload screenshot</p>
                                                    </div>
                                                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                                                </label>
                                            )}
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isSubmitting || !cashInAmount || !receiptFile}
                                            className="w-full py-3 font-semibold text-white bg-gradient-to-r from-primary to-accent rounded-xl hover:opacity-90 disabled:opacity-50"
                                        >
                                            {isSubmitting ? "Submitting..." : "Submit Request"}
                                        </button>
                                    </form>
                                ) : (
                                    <form onSubmit={handleWithdraw} className="space-y-6">
                                        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-200 text-sm">
                                            Withdrawals are typically processed within 24 hours. Minimum amount is ₱50.00.
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                                                Withdraw Amount
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">₱</span>
                                                <input
                                                    type="number"
                                                    value={withdrawAmount}
                                                    onChange={(e) => setWithdrawAmount(e.target.value)}
                                                    placeholder="0.00"
                                                    min="50"
                                                    max={wallet.availableBalance}
                                                    step="0.01"
                                                    className="w-full px-4 py-3 pl-8 rounded-xl bg-zinc-900 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-primary/50"
                                                />
                                            </div>
                                            <p className="text-xs text-zinc-500 mt-1">Available: ₱{wallet.availableBalance.toFixed(2)}</p>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isSubmitting || wallet.availableBalance < 50}
                                            className="w-full py-3 font-semibold text-white bg-gradient-to-r from-primary to-accent rounded-xl hover:opacity-90 disabled:opacity-50"
                                        >
                                            {isSubmitting ? "Submitting..." : "Request Withdrawal"}
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>

                        {/* Right Column: History */}
                        <div className="space-y-6">
                            {wallet.isSeller && (
                                <div className="glass rounded-2xl p-6">
                                    <h3 className="text-lg font-semibold text-white mb-4">Recent Withdrawals</h3>
                                    {wallet.withdrawals.length === 0 ? (
                                        <p className="text-zinc-400 text-sm text-center py-4">No withdrawals yet</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {wallet.withdrawals.map((w) => (
                                                <div key={w.id} className="p-3 rounded-lg bg-zinc-800/50">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${STATUS_STYLES[w.status]}`}>
                                                            {w.status}
                                                        </span>
                                                        <span className="text-white font-bold">₱{w.amount.toFixed(2)}</span>
                                                    </div>
                                                    <p className="text-xs text-zinc-500">
                                                        {new Date(w.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Note: Cash In History could also be added here by fetching separate API or updating WalletData */}
                            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                                <h4 className="font-medium text-blue-400 mb-2">Need Help?</h4>
                                <p className="text-sm text-zinc-400">
                                    If you have issues with cash-ins or withdrawals, please contact support with your transaction ID.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

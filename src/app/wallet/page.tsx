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

interface WalletData {
    balance: number;
    availableBalance: number;
    pendingWithdrawals: number;
    payoutMethod: string | null;
    payoutNumber: string | null;
    fullName: string | null;
    withdrawals: Withdrawal[];
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
    const [withdrawAmount, setWithdrawAmount] = useState("");
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
                <div className="max-w-2xl mx-auto">
                    <h1 className="text-3xl font-bold text-white mb-2">My Wallet</h1>
                    <p className="text-zinc-400 mb-8">Manage your earnings and withdrawals</p>

                    {/* Balance Card */}
                    <div className="glass rounded-2xl p-6 mb-6">
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="text-center">
                                <div className="text-sm text-zinc-400 mb-1">Total Balance</div>
                                <div className="text-2xl font-bold text-white">₱{wallet.balance.toFixed(2)}</div>
                            </div>
                            <div className="text-center">
                                <div className="text-sm text-zinc-400 mb-1">Available</div>
                                <div className="text-2xl font-bold text-green-400">₱{wallet.availableBalance.toFixed(2)}</div>
                            </div>
                            <div className="text-center">
                                <div className="text-sm text-zinc-400 mb-1">Pending</div>
                                <div className="text-2xl font-bold text-yellow-400">₱{wallet.pendingWithdrawals.toFixed(2)}</div>
                            </div>
                        </div>

                        {/* Payout Info */}
                        {wallet.payoutMethod && (
                            <div className="p-3 rounded-lg bg-zinc-800/50 mb-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="text-zinc-400 text-sm">Payout to: </span>
                                        <span className="text-white font-medium">
                                            {wallet.payoutMethod.toUpperCase()} • {wallet.payoutNumber}
                                        </span>
                                    </div>
                                    <Link href="/seller-setup" className="text-sm text-primary hover:underline">
                                        Change
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* Withdraw Form */}
                        <form onSubmit={handleWithdraw} className="space-y-4">
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
                                <p className="text-xs text-zinc-500 mt-1">Minimum: ₱50.00</p>
                            </div>

                            {error && (
                                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                                    {error}
                                </div>
                            )}

                            {success && (
                                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
                                    {success}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isSubmitting || wallet.availableBalance < 50}
                                className="w-full py-3 font-semibold text-white bg-gradient-to-r from-primary to-accent rounded-xl hover:opacity-90 disabled:opacity-50"
                            >
                                {isSubmitting ? "Submitting..." : "Request Withdrawal"}
                            </button>
                        </form>
                    </div>

                    {/* Withdrawal History */}
                    <div className="glass rounded-2xl p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">Withdrawal History</h2>

                        {wallet.withdrawals.length === 0 ? (
                            <p className="text-zinc-400 text-center py-6">No withdrawals yet</p>
                        ) : (
                            <div className="space-y-3">
                                {wallet.withdrawals.map((w) => (
                                    <div key={w.id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`px-2 py-0.5 text-xs font-medium rounded ${STATUS_STYLES[w.status]}`}>
                                                    {w.status === "COMPLETED" ? "PAID" : w.status}
                                                </span>
                                                <span className="text-xs text-zinc-500">
                                                    {new Date(w.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-sm text-zinc-400">
                                                {w.payoutMethod.toUpperCase()} • {w.payoutNumber}
                                            </p>
                                        </div>
                                        <div className="text-lg font-bold text-white">₱{w.amount.toFixed(2)}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

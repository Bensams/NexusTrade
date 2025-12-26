"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function SellerSetupPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [fullName, setFullName] = useState("");
    const [payoutMethod, setPayoutMethod] = useState<"gcash" | "maya" | null>(null);
    const [payoutNumber, setPayoutNumber] = useState("");
    const [agreed, setAgreed] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!fullName.trim()) {
            setError("Please enter your full legal name");
            return;
        }
        if (!payoutMethod) {
            setError("Please select a payout method");
            return;
        }
        if (!payoutNumber.trim()) {
            setError("Please enter your phone number");
            return;
        }
        if (!agreed) {
            setError("You must agree to the platform fee terms");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch("/api/user/seller-setup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fullName,
                    payoutMethod,
                    payoutNumber,
                    agreed,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                router.push("/listings/create");
            } else {
                setError(data.error || "Failed to complete setup");
            }
        } catch {
            setError("Something went wrong");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
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

            <div className="pt-24 pb-12 px-4">
                <div className="max-w-lg mx-auto">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2">Become a Seller</h1>
                        <p className="text-zinc-400">Complete your seller profile to start listing</p>
                    </div>

                    <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 space-y-6">
                        {/* Full Name */}
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                                Full Legal Name <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Juan Dela Cruz"
                                className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-primary/50"
                            />
                            <p className="text-xs text-zinc-500 mt-1">
                                This must match the name on your GCash/Maya account
                            </p>
                        </div>

                        {/* Payout Method */}
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                                Payout Method <span className="text-red-400">*</span>
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setPayoutMethod("gcash")}
                                    className={`p-4 rounded-xl border-2 transition-colors ${payoutMethod === "gcash"
                                            ? "border-blue-500 bg-blue-500/10"
                                            : "border-white/10 hover:border-white/30"
                                        }`}
                                >
                                    <div className="w-10 h-10 mx-auto mb-2 bg-blue-500 rounded-lg flex items-center justify-center">
                                        <span className="text-xl font-bold text-white">G</span>
                                    </div>
                                    <span className="text-white font-medium">GCash</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPayoutMethod("maya")}
                                    className={`p-4 rounded-xl border-2 transition-colors ${payoutMethod === "maya"
                                            ? "border-green-500 bg-green-500/10"
                                            : "border-white/10 hover:border-white/30"
                                        }`}
                                >
                                    <div className="w-10 h-10 mx-auto mb-2 bg-green-500 rounded-lg flex items-center justify-center">
                                        <span className="text-xl font-bold text-white">M</span>
                                    </div>
                                    <span className="text-white font-medium">Maya</span>
                                </button>
                            </div>
                        </div>

                        {/* Phone Number */}
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                                {payoutMethod ? `${payoutMethod === "gcash" ? "GCash" : "Maya"} Number` : "Phone Number"}{" "}
                                <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="tel"
                                value={payoutNumber}
                                onChange={(e) => setPayoutNumber(e.target.value)}
                                placeholder="09171234567"
                                className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-primary/50"
                            />
                        </div>

                        {/* Fee Disclosure */}
                        <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-yellow-400 mb-1">Platform Fee Notice</h3>
                                    <p className="text-sm text-zinc-300">
                                        NexusTrade charges a <strong className="text-yellow-400">10% platform fee</strong> on all transactions.
                                    </p>
                                    <div className="mt-2 p-2 rounded-lg bg-zinc-900/50 text-sm">
                                        <p className="text-zinc-400">Example:</p>
                                        <p className="text-white">
                                            Sell for <span className="text-green-400">₱150.00</span> → You receive{" "}
                                            <span className="text-primary">₱135.00</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Agreement Checkbox */}
                        <label className="flex items-start gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={agreed}
                                onChange={(e) => setAgreed(e.target.checked)}
                                className="w-5 h-5 mt-0.5 rounded border-white/30 bg-zinc-900 text-primary focus:ring-primary/50"
                            />
                            <span className="text-sm text-zinc-300">
                                I understand and agree that NexusTrade will deduct a 10% platform fee from all my sales.
                            </span>
                        </label>

                        {error && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-3 font-semibold text-white bg-gradient-to-r from-primary to-accent rounded-xl hover:opacity-90 disabled:opacity-50"
                        >
                            {isSubmitting ? "Setting up..." : "Complete Setup & Start Selling"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

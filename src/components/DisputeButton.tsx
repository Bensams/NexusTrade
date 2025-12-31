"use client";

import { useState } from "react";
import { AlertTriangle, X, MessageSquareWarning } from "lucide-react";

interface DisputeModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderId: string;
    listingTitle: string;
    onSuccess: () => void;
}

const DISPUTE_REASONS = [
    { value: "ITEM_NOT_RECEIVED", label: "Item not received" },
    { value: "ITEM_NOT_AS_DESCRIBED", label: "Item not as described" },
    { value: "SELLER_UNRESPONSIVE", label: "Seller unresponsive" },
    { value: "FRAUD_SUSPECTED", label: "Fraud suspected" },
    { value: "OTHER", label: "Other" },
];

export function DisputeModal({ isOpen, onClose, orderId, listingTitle, onSuccess }: DisputeModalProps) {
    const [reason, setReason] = useState("");
    const [description, setDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!reason) {
            setError("Please select a reason for your dispute");
            return;
        }

        if (description.trim().length < 20) {
            setError("Please provide a detailed description (at least 20 characters)");
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch("/api/disputes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId, reason, description: description.trim() }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to open dispute");
            }

            onSuccess();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to open dispute");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-xl max-w-lg w-full border border-gray-700 shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-700">
                    <div className="flex items-center gap-2 text-orange-400">
                        <MessageSquareWarning className="w-5 h-5" />
                        <h2 className="text-lg font-semibold">Open Dispute</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {/* Warning Banner */}
                    <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-orange-200">
                            <p className="font-medium">Opening a dispute will freeze the order funds.</p>
                            <p className="text-orange-300/80 mt-1">
                                An admin will review the chat history and evidence to make a fair decision.
                            </p>
                        </div>
                    </div>

                    {/* Order Info */}
                    <div className="bg-gray-800/50 rounded-lg p-3">
                        <p className="text-sm text-gray-400">Disputing order for:</p>
                        <p className="text-white font-medium truncate">{listingTitle}</p>
                    </div>

                    {/* Reason Select */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Reason for dispute
                        </label>
                        <select
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            <option value="">Select a reason...</option>
                            {DISPUTE_REASONS.map((r) => (
                                <option key={r.value} value={r.value}>
                                    {r.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Describe the issue
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Please explain what happened in detail. Include any relevant information that will help the admin resolve this dispute..."
                            rows={4}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            {description.length}/500 characters
                        </p>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 rounded-lg text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? "Opening..." : "Open Dispute"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

interface DisputeButtonProps {
    orderId: string;
    listingTitle: string;
    orderStatus: string;
    completedAt?: Date | null;
    onDisputeOpened?: () => void;
    className?: string;
}

export function DisputeButton({
    orderId,
    listingTitle,
    orderStatus,
    completedAt,
    onDisputeOpened,
    className = ""
}: DisputeButtonProps) {
    const [showModal, setShowModal] = useState(false);

    // Check if dispute can be opened
    const canDispute = () => {
        const disputeableStatuses = ["PAID", "DELIVERY_SUBMITTED", "COMPLETED"];
        if (!disputeableStatuses.includes(orderStatus)) return false;

        // For completed orders, check 7-day window
        if (orderStatus === "COMPLETED" && completedAt) {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            return new Date(completedAt) > sevenDaysAgo;
        }

        return true;
    };

    if (!canDispute()) return null;

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 rounded-lg transition-colors ${className}`}
            >
                <MessageSquareWarning className="w-4 h-4" />
                <span>Report Issue</span>
            </button>

            <DisputeModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                orderId={orderId}
                listingTitle={listingTitle}
                onSuccess={() => {
                    onDisputeOpened?.();
                    window.location.reload();
                }}
            />
        </>
    );
}

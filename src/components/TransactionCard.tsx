"use client";

import Link from "next/link";
import Image from "next/image";

interface TransactionCardProps {
    listing?: {
        id: string;
        title: string;
        price: number;
        imageUrl: string | null;
        game: string;
    } | null;
    order?: {
        id: string;
        status: string;
    } | null;
}

const STATUS_COLORS: Record<string, string> = {
    PENDING: "bg-yellow-500/20 text-yellow-400",
    PAID: "bg-blue-500/20 text-blue-400",
    APPROVED: "bg-purple-500/20 text-purple-400",
    DELIVERED: "bg-cyan-500/20 text-cyan-400",
    COMPLETED: "bg-green-500/20 text-green-400",
    CANCELLED: "bg-red-500/20 text-red-400",
    REFUNDED: "bg-orange-500/20 text-orange-400",
};

const STATUS_LABELS: Record<string, string> = {
    PENDING: "Pending Payment",
    PAID: "Payment Sent",
    APPROVED: "Processing",
    DELIVERED: "Delivered",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
    REFUNDED: "Refunded",
};

export default function TransactionCard({ listing, order }: TransactionCardProps) {
    if (!listing) return null;

    const statusColor = order ? STATUS_COLORS[order.status] || STATUS_COLORS.PENDING : "bg-primary/20 text-primary";
    const statusLabel = order ? STATUS_LABELS[order.status] || order.status : "Inquiry";

    return (
        <div className="glass border-b border-white/10 p-3 sticky top-0 z-10">
            <Link
                href={order ? `/orders` : `/listings/${listing.id}`}
                className="flex items-center gap-3 group"
            >
                {/* Thumbnail */}
                <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-800">
                    {listing.imageUrl ? (
                        <Image
                            src={listing.imageUrl}
                            alt={listing.title}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate group-hover:text-primary transition-colors">
                        {listing.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-sm font-semibold text-primary">
                            ₱{listing.price.toLocaleString()}
                        </span>
                        <span className="text-xs text-zinc-500">{listing.game}</span>
                    </div>
                </div>

                {/* Status Badge */}
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColor}`}>
                    {statusLabel}
                </span>
            </Link>
        </div>
    );
}

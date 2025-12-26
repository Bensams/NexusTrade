"use client";

// Skeleton components for loading states
export function Skeleton({ className = "" }: { className?: string }) {
    return (
        <div
            className={`animate-pulse bg-zinc-800/50 rounded ${className}`}
        />
    );
}

export function ListingCardSkeleton() {
    return (
        <div className="glass rounded-xl overflow-hidden">
            <Skeleton className="h-40 sm:h-48 rounded-none" />
            <div className="p-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Skeleton className="w-6 h-6 rounded-full" />
                        <Skeleton className="h-4 w-20" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                </div>
            </div>
        </div>
    );
}

export function OrderCardSkeleton() {
    return (
        <div className="glass rounded-xl p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <Skeleton className="h-5 w-24 rounded" />
                        <Skeleton className="h-4 w-20" />
                    </div>
                    <Skeleton className="h-6 w-48 mb-1" />
                    <Skeleton className="h-4 w-32" />
                </div>
                <div className="flex items-center gap-4">
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-10 w-20 rounded-lg" />
                </div>
            </div>
        </div>
    );
}

export function ProfileSkeleton() {
    return (
        <div className="max-w-4xl mx-auto">
            <div className="glass rounded-2xl p-6 sm:p-8 mb-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                    <Skeleton className="w-24 h-24 rounded-2xl" />
                    <div className="flex-1 text-center sm:text-left">
                        <Skeleton className="h-8 w-48 mb-2 mx-auto sm:mx-0" />
                        <Skeleton className="h-4 w-32 mb-4 mx-auto sm:mx-0" />
                        <div className="flex gap-6 justify-center sm:justify-start">
                            <Skeleton className="h-12 w-20" />
                            <Skeleton className="h-12 w-20" />
                            <Skeleton className="h-12 w-20" />
                        </div>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                    <ListingCardSkeleton key={i} />
                ))}
            </div>
        </div>
    );
}

export function WalletSkeleton() {
    return (
        <div className="max-w-2xl mx-auto">
            <Skeleton className="h-10 w-40 mb-2" />
            <Skeleton className="h-5 w-64 mb-8" />

            <div className="glass rounded-2xl p-6 mb-6">
                <div className="grid grid-cols-3 gap-4 mb-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="text-center">
                            <Skeleton className="h-4 w-16 mx-auto mb-2" />
                            <Skeleton className="h-8 w-24 mx-auto" />
                        </div>
                    ))}
                </div>
                <Skeleton className="h-12 w-full rounded-lg mb-4" />
                <Skeleton className="h-12 w-full rounded-xl" />
            </div>

            <div className="glass rounded-2xl p-6">
                <Skeleton className="h-6 w-40 mb-4" />
                <div className="space-y-3">
                    {[1, 2].map((i) => (
                        <Skeleton key={i} className="h-16 w-full rounded-lg" />
                    ))}
                </div>
            </div>
        </div>
    );
}

export function AdminSkeleton() {
    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <Skeleton className="h-10 w-48 mb-2" />
                    <Skeleton className="h-5 w-64" />
                </div>
                <div className="flex gap-2">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-10 w-24 rounded-lg" />
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="glass rounded-xl p-4 text-center">
                        <Skeleton className="h-8 w-12 mx-auto mb-2" />
                        <Skeleton className="h-4 w-20 mx-auto" />
                    </div>
                ))}
            </div>

            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <OrderCardSkeleton key={i} />
                ))}
            </div>
        </div>
    );
}

export function MessagesSkeleton() {
    return (
        <div className="max-w-4xl mx-auto flex h-[calc(100vh-8rem)]">
            <div className="w-80 glass rounded-l-2xl border-r border-white/10 p-4">
                <Skeleton className="h-8 w-32 mb-4" />
                <div className="space-y-2">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-lg">
                            <Skeleton className="w-10 h-10 rounded-full" />
                            <div className="flex-1">
                                <Skeleton className="h-4 w-24 mb-1" />
                                <Skeleton className="h-3 w-32" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="flex-1 glass rounded-r-2xl flex flex-col">
                <div className="p-4 border-b border-white/10">
                    <Skeleton className="h-6 w-32" />
                </div>
                <div className="flex-1 p-4">
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : ""}`}>
                                <Skeleton className={`h-12 ${i % 2 === 0 ? "w-40" : "w-48"} rounded-xl`} />
                            </div>
                        ))}
                    </div>
                </div>
                <div className="p-4 border-t border-white/10">
                    <Skeleton className="h-12 w-full rounded-xl" />
                </div>
            </div>
        </div>
    );
}

export function ListingDetailSkeleton() {
    return (
        <div className="max-w-5xl mx-auto">
            <Skeleton className="h-64 sm:h-80 w-full rounded-2xl mb-6" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="glass rounded-2xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Skeleton className="h-6 w-20 rounded" />
                            <Skeleton className="h-6 w-24 rounded" />
                        </div>
                        <Skeleton className="h-10 w-3/4 mb-4" />
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-2/3" />
                    </div>
                    <div className="glass rounded-2xl p-6">
                        <Skeleton className="h-6 w-24 mb-4" />
                        <div className="flex items-center gap-4">
                            <Skeleton className="w-12 h-12 rounded-full" />
                            <div>
                                <Skeleton className="h-5 w-32 mb-1" />
                                <Skeleton className="h-4 w-24" />
                            </div>
                        </div>
                    </div>
                </div>
                <div>
                    <div className="glass rounded-2xl p-6 sticky top-24">
                        <Skeleton className="h-10 w-32 mb-6" />
                        <Skeleton className="h-12 w-full rounded-xl mb-4" />
                        <Skeleton className="h-12 w-full rounded-xl" />
                    </div>
                </div>
            </div>
        </div>
    );
}

export function PageSkeleton({ type = "default" }: { type?: "orders" | "listings" | "profile" | "wallet" | "admin" | "messages" | "listing-detail" | "default" }) {
    return (
        <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
            {type === "orders" && (
                <div className="max-w-4xl mx-auto">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <Skeleton className="h-10 w-40 mb-2" />
                            <Skeleton className="h-5 w-48" />
                        </div>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4].map((i) => (
                                <Skeleton key={i} className="h-10 w-24 rounded-lg" />
                            ))}
                        </div>
                    </div>
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <OrderCardSkeleton key={i} />
                        ))}
                    </div>
                </div>
            )}
            {type === "listings" && (
                <div className="max-w-7xl mx-auto">
                    <Skeleton className="h-10 w-48 mb-8" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <ListingCardSkeleton key={i} />
                        ))}
                    </div>
                </div>
            )}
            {type === "profile" && <ProfileSkeleton />}
            {type === "wallet" && <WalletSkeleton />}
            {type === "admin" && <AdminSkeleton />}
            {type === "messages" && <MessagesSkeleton />}
            {type === "listing-detail" && <ListingDetailSkeleton />}
            {type === "default" && (
                <div className="max-w-4xl mx-auto">
                    <Skeleton className="h-10 w-48 mb-4" />
                    <Skeleton className="h-5 w-64 mb-8" />
                    <div className="glass rounded-2xl p-6">
                        <Skeleton className="h-40 w-full rounded-lg" />
                    </div>
                </div>
            )}
        </div>
    );
}

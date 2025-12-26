import Link from "next/link";

interface ListingCardProps {
    id?: string;
    title: string;
    price: number;
    originalPrice?: number | null;
    game: string;
    gameImage: string;
    sellerName: string;
    type: "ITEM" | "SERVICE";
}

export default function ListingCard({
    id,
    title,
    price,
    originalPrice,
    game,
    gameImage,
    sellerName,
    type,
}: ListingCardProps) {
    const hasDiscount = originalPrice && originalPrice > price;
    const CardContent = (
        <>
            {/* Image Container */}
            <div className="relative h-40 sm:h-48 overflow-hidden">
                <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-110"
                    style={{ backgroundImage: `url(${gameImage})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />

                {/* Type Badge */}
                <div className="absolute top-3 left-3">
                    <span
                        className={`px-2 py-1 text-xs font-medium rounded-md ${type === "SERVICE"
                            ? "bg-primary/80 text-white"
                            : "bg-accent/80 text-white"
                            }`}
                    >
                        {type}
                    </span>
                </div>

                {/* Game Badge */}
                <div className="absolute top-3 right-3 flex gap-2">
                    {hasDiscount && (
                        <span className="px-2 py-1 text-xs font-bold rounded-md bg-red-500 text-white">
                            SALE
                        </span>
                    )}
                    <span className="px-2 py-1 text-xs font-medium rounded-md bg-black/50 text-zinc-300 backdrop-blur-sm">
                        {game}
                    </span>
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                <h3 className="text-white font-semibold text-lg mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                    {title}
                </h3>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                            <span className="text-xs font-bold text-white">
                                {sellerName.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <span className="text-sm text-zinc-400">{sellerName}</span>
                    </div>

                    <div className="text-right">
                        {hasDiscount && (
                            <div className="text-xs text-zinc-500 line-through">
                                ₱{originalPrice.toFixed(2)}
                            </div>
                        )}
                        <div className={`text-lg font-bold ${hasDiscount ? "text-green-400" : "gradient-text"}`}>
                            ₱{price.toFixed(2)}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );

    if (id) {
        return (
            <Link
                href={`/listings/${id}`}
                className="block group glass rounded-xl overflow-hidden glass-hover transition-all duration-300"
            >
                {CardContent}
            </Link>
        );
    }

    return (
        <div className="group glass rounded-xl overflow-hidden glass-hover transition-all duration-300 cursor-pointer">
            {CardContent}
        </div>
    );
}

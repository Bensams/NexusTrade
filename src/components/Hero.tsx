"use client";

import Link from "next/link";

export default function Hero() {

    return (
        <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
            </div>

            <div className="relative max-w-7xl mx-auto text-center">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm text-zinc-300">Trusted by 10,000+ gamers</span>
                </div>

                {/* Main Heading */}
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
                    <span className="text-white">Level Up</span>
                    <br />
                    <span className="gradient-text">Your Game</span>
                </h1>

                {/* Subtext */}
                <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto mb-10">
                    Safe trading for <span className="text-primary font-medium">Roblox</span>,{" "}
                    <span className="text-accent font-medium">Valorant</span>, and more.
                    Buy and sell boosting services and in-game items securely.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link
                        href="/seller-setup"
                        className="w-full sm:w-auto px-8 py-3 text-lg font-semibold text-white bg-gradient-to-r from-primary to-accent rounded-xl hover:opacity-90 transition-opacity glow-purple text-center"
                    >
                        Start Trading
                    </Link>
                    <Link
                        href="/search"
                        className="w-full sm:w-auto px-8 py-3 text-lg font-semibold text-zinc-300 glass rounded-xl glass-hover transition-all text-center"
                    >
                        Browse Listings
                    </Link>
                </div>

                {/* Stats */}
                <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
                    <div className="text-center">
                        <div className="text-2xl sm:text-3xl font-bold gradient-text">50K+</div>
                        <div className="text-sm text-zinc-500">Active Listings</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl sm:text-3xl font-bold gradient-text">100%</div>
                        <div className="text-sm text-zinc-500">Secure Trades</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl sm:text-3xl font-bold gradient-text">24/7</div>
                        <div className="text-sm text-zinc-500">Support</div>
                    </div>
                </div>
            </div>
        </section>
    );
}


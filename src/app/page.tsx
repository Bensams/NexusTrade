import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ListingGrid from "@/components/ListingGrid";

export default function Home() {
    return (
        <main className="min-h-screen">
            <Navbar />
            <Hero />
            <ListingGrid />
        </main>
    );
}

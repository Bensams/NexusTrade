import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Seeding database...");

    // Seed SystemSettings (singleton)
    const settings = await prisma.systemSettings.upsert({
        where: { id: "default" },
        update: {},
        create: {
            id: "default",
            transactionFeePercent: 5.0,
        },
    });
    console.log("✅ SystemSettings created:", settings);

    // Seed Games
    const games = [
        { name: "Roblox", slug: "roblox", sortOrder: 1 },
        { name: "Valorant", slug: "valorant", sortOrder: 2 },
        { name: "CS2", slug: "cs2", sortOrder: 3 },
        { name: "Fortnite", slug: "fortnite", sortOrder: 4 },
        { name: "League of Legends", slug: "league-of-legends", sortOrder: 5 },
        { name: "Apex Legends", slug: "apex-legends", sortOrder: 6 },
        { name: "Genshin Impact", slug: "genshin-impact", sortOrder: 7 },
        { name: "Mobile Legends", slug: "mobile-legends", sortOrder: 8 },
    ];

    for (const game of games) {
        const created = await prisma.game.upsert({
            where: { slug: game.slug },
            update: {},
            create: {
                name: game.name,
                slug: game.slug,
                sortOrder: game.sortOrder,
                isActive: true,
            },
        });
        console.log(`✅ Game: ${created.name}`);
    }

    // Seed Item Types
    const itemTypes = [
        { name: "Accounts", slug: "accounts", sortOrder: 1 },
        { name: "Skins", slug: "skins", sortOrder: 2 },
        { name: "Items", slug: "items", sortOrder: 3 },
        { name: "Currency", slug: "currency", sortOrder: 4 },
        { name: "Boosting", slug: "boosting", sortOrder: 5 },
        { name: "Coaching", slug: "coaching", sortOrder: 6 },
    ];

    for (const itemType of itemTypes) {
        const created = await prisma.itemType.upsert({
            where: { slug: itemType.slug },
            update: {},
            create: {
                name: itemType.name,
                slug: itemType.slug,
                sortOrder: itemType.sortOrder,
                isActive: true,
            },
        });
        console.log(`✅ Item Type: ${created.name}`);
    }

    console.log("🎉 Seeding completed!");
}

main()
    .catch((e) => {
        console.error("❌ Seeding failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

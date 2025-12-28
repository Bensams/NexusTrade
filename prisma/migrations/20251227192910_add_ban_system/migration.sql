-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "isBanned" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bannedUntil" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "BlacklistedIdentifier" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "BlacklistedIdentifier_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BlacklistedIdentifier_type_value_idx" ON "BlacklistedIdentifier"("type", "value");

-- CreateIndex
CREATE INDEX "BlacklistedIdentifier_userId_idx" ON "BlacklistedIdentifier"("userId");

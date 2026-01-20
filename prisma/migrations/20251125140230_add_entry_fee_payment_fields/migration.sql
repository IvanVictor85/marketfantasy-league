/*
  Warnings:

  - You are about to alter the column `prizePool` on the `competitions` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(18,8)`.
  - You are about to alter the column `amountPaid` on the `league_entries` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(18,8)`.
  - You are about to drop the column `adminWallet` on the `leagues` table. All the data in the column will be lost.
  - You are about to drop the column `endDate` on the `leagues` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `leagues` table. All the data in the column will be lost.
  - You are about to drop the column `leagueType` on the `leagues` table. All the data in the column will be lost.
  - You are about to drop the column `maxPlayers` on the `leagues` table. All the data in the column will be lost.
  - You are about to drop the column `participantCount` on the `leagues` table. All the data in the column will be lost.
  - You are about to drop the column `prizeDistribution` on the `leagues` table. All the data in the column will be lost.
  - You are about to drop the column `programId` on the `leagues` table. All the data in the column will be lost.
  - You are about to drop the column `protocolWallet` on the `leagues` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `leagues` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `leagues` table. All the data in the column will be lost.
  - You are about to drop the column `totalPrizePool` on the `leagues` table. All the data in the column will be lost.
  - You are about to drop the column `treasuryPda` on the `leagues` table. All the data in the column will be lost.
  - You are about to alter the column `entryFee` on the `leagues` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(18,8)`.
  - You are about to alter the column `price` on the `price_history` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(18,8)`.
  - You are about to drop the `teams` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[publicKey]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[username]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `league_entries` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "league_entries" DROP CONSTRAINT "league_entries_leagueId_fkey";

-- DropForeignKey
ALTER TABLE "teams" DROP CONSTRAINT "teams_leagueId_fkey";

-- DropIndex
DROP INDEX "league_entries_leagueId_userWallet_key";

-- AlterTable
ALTER TABLE "competitions" ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "name" TEXT,
ADD COLUMN     "seasonId" TEXT,
ADD COLUMN     "startDate" TIMESTAMP(3),
ALTER COLUMN "startTime" DROP NOT NULL,
ALTER COLUMN "endTime" DROP NOT NULL,
ALTER COLUMN "prizePool" SET DEFAULT 0,
ALTER COLUMN "prizePool" SET DATA TYPE DECIMAL(18,8);

-- AlterTable
ALTER TABLE "league_entries" ADD COLUMN     "competitionId" TEXT,
ADD COLUMN     "userId" TEXT NOT NULL,
ALTER COLUMN "leagueId" DROP NOT NULL,
ALTER COLUMN "amountPaid" SET DATA TYPE DECIMAL(18,8);

-- AlterTable
ALTER TABLE "leagues" DROP COLUMN "adminWallet",
DROP COLUMN "endDate",
DROP COLUMN "isActive",
DROP COLUMN "leagueType",
DROP COLUMN "maxPlayers",
DROP COLUMN "participantCount",
DROP COLUMN "prizeDistribution",
DROP COLUMN "programId",
DROP COLUMN "protocolWallet",
DROP COLUMN "startDate",
DROP COLUMN "status",
DROP COLUMN "totalPrizePool",
DROP COLUMN "treasuryPda",
ALTER COLUMN "entryFee" SET DEFAULT 10,
ALTER COLUMN "entryFee" SET DATA TYPE DECIMAL(18,8);

-- AlterTable
ALTER TABLE "price_history" ALTER COLUMN "price" SET DATA TYPE DECIMAL(18,8);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "mainTeam" JSONB,
ADD COLUMN     "publicKey" TEXT,
ADD COLUMN     "username" TEXT,
ALTER COLUMN "email" DROP NOT NULL;

-- DropTable
DROP TABLE "teams";

-- CreateTable
CREATE TABLE "seasons" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "prizePool" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_teams" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "players" JSONB NOT NULL,
    "totalPoints" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "teamName" TEXT,
    "selectedMascotUrl" TEXT,
    "entryFeePaid" BOOLEAN NOT NULL DEFAULT false,
    "paymentTxHash" TEXT,
    "entryFeeAmount" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "season_rankings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "totalSeasonPoints" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "season_rankings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "league_players" (
    "id" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "league_players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competition_tokens" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "marketCapRank" INTEGER,
    "priceStart" DECIMAL(18,8),
    "priceStartDate" TIMESTAMP(3),
    "priceEnd" DECIMAL(18,8),
    "priceEndDate" TIMESTAMP(3),
    "percentChange" DECIMAL(18,8),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "competition_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prize_claims" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "competitionId" TEXT,
    "seasonId" TEXT,
    "amount" DECIMAL(18,8) NOT NULL,
    "position" INTEGER NOT NULL,
    "prizeType" TEXT NOT NULL,
    "claimed" BOOLEAN NOT NULL DEFAULT false,
    "claimedAt" TIMESTAMP(3),
    "txHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prize_claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_nonces" (
    "id" TEXT NOT NULL,
    "nonce" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),
    "walletAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_nonces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teams_legacy" (
    "id" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userWallet" TEXT NOT NULL,
    "teamName" TEXT NOT NULL,
    "tokens" TEXT NOT NULL,
    "totalScore" DOUBLE PRECISION,
    "rank" INTEGER,
    "selectedMascotUrl" TEXT,
    "hasValidEntry" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teams_legacy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_teams_userId_competitionId_key" ON "user_teams"("userId", "competitionId");

-- CreateIndex
CREATE UNIQUE INDEX "season_rankings_userId_seasonId_key" ON "season_rankings"("userId", "seasonId");

-- CreateIndex
CREATE UNIQUE INDEX "league_players_leagueId_tokenId_key" ON "league_players"("leagueId", "tokenId");

-- CreateIndex
CREATE INDEX "competition_tokens_competitionId_idx" ON "competition_tokens"("competitionId");

-- CreateIndex
CREATE UNIQUE INDEX "competition_tokens_competitionId_tokenId_key" ON "competition_tokens"("competitionId", "tokenId");

-- CreateIndex
CREATE INDEX "prize_claims_userId_idx" ON "prize_claims"("userId");

-- CreateIndex
CREATE INDEX "prize_claims_claimed_idx" ON "prize_claims"("claimed");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_nonces_nonce_key" ON "wallet_nonces"("nonce");

-- CreateIndex
CREATE INDEX "wallet_nonces_nonce_idx" ON "wallet_nonces"("nonce");

-- CreateIndex
CREATE INDEX "wallet_nonces_expiresAt_idx" ON "wallet_nonces"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "teams_legacy_userId_leagueId_key" ON "teams_legacy"("userId", "leagueId");

-- CreateIndex
CREATE UNIQUE INDEX "users_publicKey_key" ON "users"("publicKey");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- AddForeignKey
ALTER TABLE "competitions" ADD CONSTRAINT "competitions_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "seasons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_teams" ADD CONSTRAINT "user_teams_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_teams" ADD CONSTRAINT "user_teams_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "competitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "season_rankings" ADD CONSTRAINT "season_rankings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "season_rankings" ADD CONSTRAINT "season_rankings_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "seasons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "league_players" ADD CONSTRAINT "league_players_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "leagues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "league_players" ADD CONSTRAINT "league_players_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "tokens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competition_tokens" ADD CONSTRAINT "competition_tokens_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "competitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "league_entries" ADD CONSTRAINT "league_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prize_claims" ADD CONSTRAINT "prize_claims_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams_legacy" ADD CONSTRAINT "teams_legacy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

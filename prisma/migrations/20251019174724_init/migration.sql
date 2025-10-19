-- CreateTable
CREATE TABLE "leagues" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "leagueType" TEXT NOT NULL DEFAULT 'MAIN',
    "entryFee" DOUBLE PRECISION NOT NULL,
    "maxPlayers" INTEGER,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "treasuryPda" TEXT NOT NULL,
    "programId" TEXT,
    "adminWallet" TEXT NOT NULL,
    "protocolWallet" TEXT NOT NULL,
    "emblemUrl" TEXT,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "badgeUrl" TEXT,
    "bannerUrl" TEXT,
    "prizeDistribution" TEXT NOT NULL DEFAULT '{"first": 50, "second": 30, "third": 20}',
    "totalPrizePool" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "participantCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leagues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "league_entries" (
    "id" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "userWallet" TEXT NOT NULL,
    "transactionHash" TEXT NOT NULL,
    "amountPaid" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "blockHeight" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "league_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teams" (
    "id" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "userWallet" TEXT NOT NULL,
    "teamName" TEXT NOT NULL,
    "tokens" TEXT NOT NULL,
    "totalScore" DOUBLE PRECISION,
    "rank" INTEGER,
    "selectedMascotUrl" TEXT,
    "hasValidEntry" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tokens" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "coingeckoId" TEXT NOT NULL,
    "logoUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competitions" (
    "id" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "winners" TEXT,
    "prizePool" DOUBLE PRECISION NOT NULL,
    "distributed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "competitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_history" (
    "id" TEXT NOT NULL,
    "tokenSymbol" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'coingecko',

    CONSTRAINT "price_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "league_entries_transactionHash_key" ON "league_entries"("transactionHash");

-- CreateIndex
CREATE UNIQUE INDEX "league_entries_leagueId_userWallet_key" ON "league_entries"("leagueId", "userWallet");

-- CreateIndex
CREATE UNIQUE INDEX "teams_leagueId_userWallet_key" ON "teams"("leagueId", "userWallet");

-- CreateIndex
CREATE UNIQUE INDEX "tokens_symbol_key" ON "tokens"("symbol");

-- CreateIndex
CREATE UNIQUE INDEX "tokens_coingeckoId_key" ON "tokens"("coingeckoId");

-- CreateIndex
CREATE INDEX "price_history_tokenSymbol_timestamp_idx" ON "price_history"("tokenSymbol", "timestamp");

-- AddForeignKey
ALTER TABLE "league_entries" ADD CONSTRAINT "league_entries_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "leagues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "leagues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competitions" ADD CONSTRAINT "competitions_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "leagues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

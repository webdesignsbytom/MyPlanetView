-- "Guess where I was" games and the flight log (23 Nov 2026; docs/API.md "Guess where I was",
-- "Flights")

-- CreateEnum
CREATE TYPE "FlightSource" AS ENUM ('BOARDING_PASS', 'MANUAL');

-- CreateTable
CREATE TABLE "guess_game" (
    "id" TEXT NOT NULL,
    "mapId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "photoIds" TEXT[],
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guess_game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guess_play" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "points" INTEGER[],
    "score" INTEGER NOT NULL DEFAULT 0,
    "name" TEXT,
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guess_play_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flight" (
    "id" TEXT NOT NULL,
    "mapId" TEXT NOT NULL,
    "tripId" TEXT,
    "fromAirport" CHAR(3) NOT NULL,
    "toAirport" CHAR(3) NOT NULL,
    "flownOn" DATE NOT NULL,
    "carrier" TEXT,
    "flightNumber" TEXT,
    "distanceKm" INTEGER NOT NULL,
    "source" "FlightSource" NOT NULL DEFAULT 'MANUAL',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "flight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "guess_game_code_key" ON "guess_game"("code");

-- CreateIndex
CREATE INDEX "guess_game_mapId_createdAt_idx" ON "guess_game"("mapId", "createdAt");

-- CreateIndex
CREATE INDEX "guess_game_createdById_idx" ON "guess_game"("createdById");

-- CreateIndex
CREATE INDEX "guess_play_gameId_score_idx" ON "guess_play"("gameId", "score");

-- CreateIndex
CREATE INDEX "guess_play_createdAt_idx" ON "guess_play"("createdAt");

-- CreateIndex
CREATE INDEX "flight_mapId_flownOn_idx" ON "flight"("mapId", "flownOn");

-- CreateIndex
CREATE INDEX "flight_tripId_idx" ON "flight"("tripId");

-- CreateIndex
CREATE INDEX "flight_createdById_idx" ON "flight"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "flight_mapId_flownOn_fromAirport_toAirport_carrier_flightNu_key" ON "flight"("mapId", "flownOn", "fromAirport", "toAirport", "carrier", "flightNumber");

-- AddForeignKey
ALTER TABLE "guess_game" ADD CONSTRAINT "guess_game_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "travel_map"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guess_game" ADD CONSTRAINT "guess_game_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guess_play" ADD CONSTRAINT "guess_play_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "guess_game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flight" ADD CONSTRAINT "flight_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "travel_map"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flight" ADD CONSTRAINT "flight_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trip"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flight" ADD CONSTRAINT "flight_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- A play's score is the sum of its rounds' points, never below nothing
ALTER TABLE "guess_play" ADD CONSTRAINT "guess_play_score" CHECK ("score" >= 0);

-- A flight goes between two different airports, each an IATA code, over a distance
ALTER TABLE "flight" ADD CONSTRAINT "flight_airports" CHECK ("fromAirport" ~ '^[A-Z]{3}$' AND "toAirport" ~ '^[A-Z]{3}$' AND "fromAirport" <> "toAirport" AND "distanceKm" >= 0);

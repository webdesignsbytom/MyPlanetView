-- Photos can be rearranged in their galleries: each photo has a position in its
-- country's gallery on the map (the unplaced photos, with no country, are one gallery)
-- and one in its trip's. Smallest first; positions are 1024 apart, and a moved photo
-- takes the halfway point between its new neighbours (src/utils/photoOrder.js).
-- The country and trip lists are ordered by these instead of the upload date, so the
-- indexes on (…, createdAt) for them become indexes on the positions.
-- Made with `prisma migrate diff`; the backfill is added by hand.

-- DropIndex
DROP INDEX "photo_tripId_createdAt_id_idx";

-- DropIndex
DROP INDEX "photo_mapId_countryCode_createdAt_idx";

-- AlterTable
ALTER TABLE "photo" ADD COLUMN     "countryPosition" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "tripPosition" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Backfill: every gallery keeps the order it had (newest upload first)
UPDATE "photo" AS p
SET "countryPosition" = ranked.rank * 1024
FROM (
  SELECT "id", ROW_NUMBER() OVER (PARTITION BY "mapId", "countryCode" ORDER BY "createdAt" DESC, "id" DESC) AS rank
  FROM "photo"
) AS ranked
WHERE p."id" = ranked."id";

UPDATE "photo" AS p
SET "tripPosition" = ranked.rank * 1024
FROM (
  SELECT "id", ROW_NUMBER() OVER (PARTITION BY "tripId" ORDER BY "createdAt" DESC, "id" DESC) AS rank
  FROM "photo"
  WHERE "tripId" IS NOT NULL
) AS ranked
WHERE p."id" = ranked."id";

-- CreateIndex
CREATE INDEX "photo_tripId_tripPosition_id_idx" ON "photo"("tripId", "tripPosition", "id");

-- CreateIndex
CREATE INDEX "photo_mapId_countryCode_countryPosition_id_idx" ON "photo"("mapId", "countryCode", "countryPosition", "id");

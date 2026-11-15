-- better-auth's rate limiter on the database (auth.js: rateLimit.storage 'database'),
-- and one default map per user enforced by the database.
-- Made with `prisma migrate diff`; the backfill and the CHECK are added by hand.

-- AlterTable
ALTER TABLE "travel_map" ADD COLUMN     "defaultForOwnerId" TEXT;

-- Backfill: each owner's oldest default map keeps the flag; any later duplicate
-- (from the old read-then-create race) becomes an ordinary map
UPDATE "travel_map" AS t
SET "defaultForOwnerId" = t."ownerId"
WHERE t."isDefault"
  AND t."id" = (
    SELECT d."id" FROM "travel_map" AS d
    WHERE d."ownerId" = t."ownerId" AND d."isDefault"
    ORDER BY d."createdAt", d."id"
    LIMIT 1
  );

UPDATE "travel_map" SET "isDefault" = false WHERE "isDefault" AND "defaultForOwnerId" IS NULL;

-- CreateTable
CREATE TABLE "auth_rate_limit" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "lastRequest" BIGINT NOT NULL,

    CONSTRAINT "auth_rate_limit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "auth_rate_limit_key_key" ON "auth_rate_limit"("key");

-- CreateIndex
CREATE INDEX "auth_rate_limit_lastRequest_idx" ON "auth_rate_limit"("lastRequest");

-- CreateIndex
CREATE UNIQUE INDEX "travel_map_defaultForOwnerId_key" ON "travel_map"("defaultForOwnerId");

-- The column is set exactly on the default map, to its owner (Prisma can't express
-- CHECK constraints, and leaves them alone on later diffs)
ALTER TABLE "travel_map" ADD CONSTRAINT "travel_map_default_owner"
  CHECK (
    ("isDefault" AND "defaultForOwnerId" IS NOT NULL AND "defaultForOwnerId" = "ownerId")
    OR (NOT "isDefault" AND "defaultForOwnerId" IS NULL)
  );

-- The UK's four nations (docs/API.md "The UK's nations"): a map can show and keep the UK
-- as England (XE), Scotland (XC), Wales (XW) and Northern Ireland (XI) instead of one
-- country. The nations' country rows are the next migration's: a new enum value can't be
-- used in the transaction that adds it.

-- AlterEnum
ALTER TYPE "PlaceKind" ADD VALUE 'NATION';

-- AlterTable
ALTER TABLE "travel_map" ADD COLUMN     "splitUk" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ukNationVisits" JSONB;

-- AlterTable
ALTER TABLE "trip_stop" ADD COLUMN     "ukNation" CHAR(2);

-- AlterTable
ALTER TABLE "photo" ADD COLUMN     "ukNation" CHAR(2);

-- AlterTable
ALTER TABLE "moment" ADD COLUMN     "ukNation" CHAR(2);

-- A remembered nation is one of the four
ALTER TABLE "trip_stop" ADD CONSTRAINT "trip_stop_uk_nation" CHECK ("ukNation" IS NULL OR "ukNation" IN ('XE', 'XC', 'XW', 'XI'));
ALTER TABLE "photo" ADD CONSTRAINT "photo_uk_nation" CHECK ("ukNation" IS NULL OR "ukNation" IN ('XE', 'XC', 'XW', 'XI'));
ALTER TABLE "moment" ADD CONSTRAINT "moment_uk_nation" CHECK ("ukNation" IS NULL OR "ukNation" IN ('XE', 'XC', 'XW', 'XI'));

-- Three free maps per account, each extra map paid for upgrading one to the plan (19 Nov 2026,
-- docs/API.md "Map limits"): when the owner chose to upgrade a map, for the order of the
-- paid slots (utils/mapSlots.js).

-- AlterTable
ALTER TABLE "travel_map" ADD COLUMN     "upgradedAt" TIMESTAMP(3);

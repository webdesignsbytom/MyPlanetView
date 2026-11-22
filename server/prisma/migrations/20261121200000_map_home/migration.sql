-- A map's home (docs/API.md "Stats"; 21 Nov 2026): where its people live, for the travel
-- stats' distances and the place furthest from home. Null: the birth country of the
-- owner's traveller, else of the first traveller with one (src/utils/travelStats.js homeOf).

-- AlterTable
ALTER TABLE "travel_map" ADD COLUMN     "homeCountryCode" CHAR(2);

-- AddForeignKey
ALTER TABLE "travel_map" ADD CONSTRAINT "travel_map_homeCountryCode_fkey" FOREIGN KEY ("homeCountryCode") REFERENCES "country"("code") ON DELETE SET NULL ON UPDATE CASCADE;

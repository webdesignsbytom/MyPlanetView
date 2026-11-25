-- A metallic finish for the places visited or lived in (25 Nov 2026, the user's wish: "shiny
-- colours like gold and silver"): gold, silver or bronze foil in place of the visited colour
CREATE TYPE "VisitedFinish" AS ENUM ('GOLD', 'SILVER', 'BRONZE');

-- AlterTable
ALTER TABLE "map_design" ADD COLUMN     "visitedFinish" "VisitedFinish";

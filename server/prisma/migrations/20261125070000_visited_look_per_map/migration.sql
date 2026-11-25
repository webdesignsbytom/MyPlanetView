-- How the places visited or lived in show is the map's, in every map style (25 Nov 2026, the
-- user's wish: it showed only in the style whose design set it), not each style's design's

-- AlterTable
ALTER TABLE "travel_map" ADD COLUMN     "visitedColour" TEXT,
ADD COLUMN     "visitedFinish" "VisitedFinish",
ADD COLUMN     "visitedLook" "VisitedLook" NOT NULL DEFAULT 'BADGE';

-- Each map keeps the look one of its designs had: one that shows something, the World map's
-- (animated) first
UPDATE "travel_map" AS m
SET "visitedLook" = d."visitedLook", "visitedColour" = d."visitedColour", "visitedFinish" = d."visitedFinish"
FROM (
  SELECT DISTINCT ON ("mapId") "mapId", "visitedLook", "visitedColour", "visitedFinish"
  FROM "map_design"
  ORDER BY "mapId", ("visitedLook" <> 'BADGE') DESC, ("style" = 'animated') DESC, "style"
) AS d
WHERE d."mapId" = m."id";

-- AlterTable
ALTER TABLE "map_design" DROP CONSTRAINT "map_design_visited_colour";
ALTER TABLE "map_design" DROP COLUMN "visitedColour",
DROP COLUMN "visitedFinish",
DROP COLUMN "visitedLook";

-- The visited colour, opaque (utils/mapDesigns.js parseVisitedLook)
ALTER TABLE "travel_map" ADD CONSTRAINT "travel_map_visited_colour" CHECK (
  "visitedColour" IS NULL OR "visitedColour" ~ '^#[0-9a-f]{6}$'
);

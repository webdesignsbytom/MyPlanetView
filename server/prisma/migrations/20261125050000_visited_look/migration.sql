-- How a map design shows the places visited or lived in (25 Nov 2026, the user's wish): their
-- badge (as always), one colour of the owner's choosing over each one's own, or both
CREATE TYPE "VisitedLook" AS ENUM ('BADGE', 'COLOUR', 'BOTH');

-- AlterTable
ALTER TABLE "map_design" ADD COLUMN     "visitedColour" TEXT,
ADD COLUMN     "visitedLook" "VisitedLook" NOT NULL DEFAULT 'BADGE';

-- The visited colour, opaque (utils/mapDesigns.js)
ALTER TABLE "map_design" ADD CONSTRAINT "map_design_visited_colour" CHECK (
  "visitedColour" IS NULL OR "visitedColour" ~ '^#[0-9a-f]{6}$'
);

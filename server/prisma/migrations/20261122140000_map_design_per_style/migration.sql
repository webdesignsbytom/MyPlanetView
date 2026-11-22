-- A map design per map style (22 Nov 2026, the user's wish: colours chosen on Black and white
-- showed on the World map). Every design made so far was drawn on the World map, so it's its.
ALTER TABLE "map_design" ADD COLUMN "style" TEXT NOT NULL DEFAULT 'animated';
ALTER TABLE "map_design" ALTER COLUMN "style" DROP DEFAULT;
ALTER TABLE "map_design" DROP CONSTRAINT "map_design_pkey",
ADD CONSTRAINT "map_design_pkey" PRIMARY KEY ("mapId", "style");

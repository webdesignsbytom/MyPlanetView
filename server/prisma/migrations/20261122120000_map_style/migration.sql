-- The map style everyone who opens the map sees it in (22 Nov 2026): null is the owner's own
ALTER TABLE "travel_map" ADD COLUMN "style" TEXT;

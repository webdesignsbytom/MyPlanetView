-- A map's own design (docs/API.md "Map designs"; 21 Nov 2026): a picture for the sea and
-- its own colours, shown to everyone who opens the map.

-- CreateTable
CREATE TABLE "map_design" (
    "mapId" TEXT NOT NULL,
    "shown" BOOLEAN NOT NULL DEFAULT true,
    "countryColours" JSONB NOT NULL DEFAULT '{}',
    "namesColour" TEXT,
    "gridColour" TEXT,
    "pictureId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "map_design_pkey" PRIMARY KEY ("mapId")
);

-- CreateIndex
CREATE UNIQUE INDEX "map_design_pictureId_key" ON "map_design"("pictureId");

-- AddForeignKey
ALTER TABLE "map_design" ADD CONSTRAINT "map_design_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "travel_map"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "map_design" ADD CONSTRAINT "map_design_pictureId_fkey" FOREIGN KEY ("pictureId") REFERENCES "media_item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- The colours are "#rrggbb" in lower case (utils/mapDesigns.js), and the country colours an
-- object (place code → colour)
ALTER TABLE "map_design" ADD CONSTRAINT "map_design_colours" CHECK (
  ("namesColour" IS NULL OR "namesColour" ~ '^#[0-9a-f]{6}$')
  AND ("gridColour" IS NULL OR "gridColour" ~ '^#[0-9a-f]{6}$')
  AND jsonb_typeof("countryColours") = 'object'
);

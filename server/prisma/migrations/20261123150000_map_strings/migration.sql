-- CreateTable
CREATE TABLE "map_string" (
    "id" TEXT NOT NULL,
    "mapId" TEXT NOT NULL,
    "fromCode" CHAR(2) NOT NULL,
    "toCode" CHAR(2) NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "map_string_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "map_string_createdById_idx" ON "map_string"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "map_string_mapId_fromCode_toCode_key" ON "map_string"("mapId", "fromCode", "toCode");

-- AddForeignKey
ALTER TABLE "map_string" ADD CONSTRAINT "map_string_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "travel_map"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "map_string" ADD CONSTRAINT "map_string_fromCode_fkey" FOREIGN KEY ("fromCode") REFERENCES "country"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "map_string" ADD CONSTRAINT "map_string_toCode_fkey" FOREIGN KEY ("toCode") REFERENCES "country"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "map_string" ADD CONSTRAINT "map_string_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- One pair of places is one string: kept in code order, never a place to itself
ALTER TABLE "map_string" ADD CONSTRAINT "map_string_order" CHECK ("fromCode" < "toCode");

-- A map design's colour for its strings (23 Nov 2026, the user's wish)
ALTER TABLE "map_design" ADD COLUMN "stringColour" TEXT;

ALTER TABLE "map_design" ADD CONSTRAINT "map_design_string_colour" CHECK (
  "stringColour" IS NULL OR "stringColour" ~ '^#[0-9a-f]{6}$'
);

-- Planned strings (25 Nov 2026, the user's wish): a string's kind, VISITED (every string tied
-- until now) or PLANNED, each kind in its own colour, one pair of places once per kind
CREATE TYPE "StringKind" AS ENUM ('VISITED', 'PLANNED');

-- DropIndex
DROP INDEX "map_string_mapId_fromCode_toCode_key";

-- AlterTable
ALTER TABLE "map_design" ADD COLUMN     "plannedStringColour" TEXT,
ADD COLUMN     "plannedStringTwistColour" TEXT;

-- AlterTable
ALTER TABLE "map_string" ADD COLUMN     "kind" "StringKind" NOT NULL DEFAULT 'VISITED';

-- CreateIndex
CREATE UNIQUE INDEX "map_string_mapId_kind_fromCode_toCode_key" ON "map_string"("mapId", "kind", "fromCode", "toCode");

-- The planned strings' colours, as the visited ones': see-through allowed ("#rrggbbaa"), the
-- twist opaque (utils/mapDesigns.js)
ALTER TABLE "map_design" ADD CONSTRAINT "map_design_planned_string_colour" CHECK (
  "plannedStringColour" IS NULL OR "plannedStringColour" ~ '^#[0-9a-f]{6}([0-9a-f]{2})?$'
);

ALTER TABLE "map_design" ADD CONSTRAINT "map_design_planned_string_twist_colour" CHECK (
  "plannedStringTwistColour" IS NULL OR "plannedStringTwistColour" ~ '^#[0-9a-f]{6}$'
);

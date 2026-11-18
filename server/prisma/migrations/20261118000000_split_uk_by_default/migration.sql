-- New maps show the UK as England, Scotland, Wales and Northern Ireland (18 Nov 2026, the
-- user's wish). Only the default changes: existing maps keep their choice (turning the
-- split on moves a map's UK data, which is the owner's to do in Settings).

-- AlterTable
ALTER TABLE "travel_map" ALTER COLUMN "splitUk" SET DEFAULT true;

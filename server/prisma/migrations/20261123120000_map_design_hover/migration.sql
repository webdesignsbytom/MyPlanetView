-- A map design's colour for the country under the pointer (23 Nov 2026, the user's wish)
ALTER TABLE "map_design" ADD COLUMN "hoverColour" TEXT;

ALTER TABLE "map_design" ADD CONSTRAINT "map_design_hover_colour" CHECK (
  "hoverColour" IS NULL OR "hoverColour" ~ '^#[0-9a-f]{6}$'
);

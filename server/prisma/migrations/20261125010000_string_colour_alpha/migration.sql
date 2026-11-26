-- A map design's string colour may be see-through (25 Nov 2026, the user's wish): "#rrggbb"
-- or "#rrggbbaa", the last two its opacity (utils/mapDesigns.js DESIGN_COLOUR_ALPHA)
ALTER TABLE "map_design" DROP CONSTRAINT "map_design_string_colour";

ALTER TABLE "map_design" ADD CONSTRAINT "map_design_string_colour" CHECK (
  "stringColour" IS NULL OR "stringColour" ~ '^#[0-9a-f]{6}([0-9a-f]{2})?$'
);

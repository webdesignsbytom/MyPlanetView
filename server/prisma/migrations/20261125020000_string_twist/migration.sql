-- A second colour twisted into a map design's strings, as baker's twine (25 Nov 2026, the
-- user's wish): "#rrggbb", or null for strings of one colour
ALTER TABLE "map_design" ADD COLUMN "stringTwistColour" TEXT;

ALTER TABLE "map_design" ADD CONSTRAINT "map_design_string_twist_colour" CHECK (
  "stringTwistColour" IS NULL OR "stringTwistColour" ~ '^#[0-9a-f]{6}$'
);

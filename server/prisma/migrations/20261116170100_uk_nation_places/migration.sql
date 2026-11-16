-- The UK's four nations as places, so a database already loaded gets them without
-- re-running the reference data (the seed and `npm run db:reference` write the same rows:
-- prisma/seed/data/countries.js). Pins from images/src/tools/uk-nations.mjs.
INSERT INTO "country" ("code", "name", "slug", "kind", "continent", "pinX", "pinY") VALUES
  ('XE', 'England', 'england', 'NATION', 'EUROPE', 980.3, 165.7),
  ('XC', 'Scotland', 'scotland', 'NATION', 'EUROPE', 968.2, 140.2),
  ('XW', 'Wales', 'wales', 'NATION', 'EUROPE', 969.4, 168.6),
  ('XI', 'Northern Ireland', 'northern-ireland', 'NATION', 'EUROPE', 956.3, 153.1)
ON CONFLICT ("code") DO NOTHING;

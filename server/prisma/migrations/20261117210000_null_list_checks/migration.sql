-- Two CHECKs read a list's length with cardinality(), which is NULL for a NULL list, and a
-- CHECK lets NULL through (the audit, 17 Nov 2026). Both columns are nullable arrays, so a
-- NULL list now counts as an empty one. The code checks both first; this is the backstop.
-- No data changes: every valid row passes the new forms too.

ALTER TABLE "goal" DROP CONSTRAINT "goal_shape";
ALTER TABLE "goal" ADD CONSTRAINT "goal_shape" CHECK (
  ("kind" IN ('COUNTRY_COUNT', 'LANDMARK_COUNT') AND "target" > 0 AND "region" IS NULL
     AND coalesce(cardinality("countryCodes"), 0) = 0)
  OR ("kind" = 'COUNTRY_LIST' AND "target" IS NULL AND "region" IS NULL
     AND coalesce(cardinality("countryCodes"), 0) > 0)
  OR ("kind" = 'REGION' AND "target" IS NULL AND "region" IS NOT NULL
     AND coalesce(cardinality("countryCodes"), 0) = 0)
);

ALTER TABLE "affiliate_offer" DROP CONSTRAINT "affiliate_offer_has_placement";
ALTER TABLE "affiliate_offer" ADD CONSTRAINT "affiliate_offer_has_placement" CHECK (coalesce(cardinality("placements"), 0) > 0);

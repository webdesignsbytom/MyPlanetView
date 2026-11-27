-- A traveller's nationality, optional (27 Nov 2026, the user's wish: "Passport also needs
-- nationality"): a country (never Antarctica or a pole, checked in code), the passport's
-- Nationality. Countries are never deleted; SET NULL as the birth and favourite countries.
ALTER TABLE "traveller" ADD COLUMN     "nationalityCode" CHAR(2);

ALTER TABLE "traveller" ADD CONSTRAINT "traveller_nationalityCode_fkey" FOREIGN KEY ("nationalityCode") REFERENCES "country"("code") ON DELETE SET NULL ON UPDATE CASCADE;

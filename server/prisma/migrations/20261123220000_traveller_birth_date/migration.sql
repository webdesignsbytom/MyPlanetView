-- AlterTable
ALTER TABLE "traveller" ADD COLUMN     "birthDate" DATE;

-- A traveller's optional date of birth (23 Nov 2026): from 1900 on (not in the future is
-- checked in code, as a CHECK can't read today's date)
ALTER TABLE "traveller" ADD CONSTRAINT "traveller_birth_date" CHECK ("birthDate" IS NULL OR "birthDate" >= DATE '1900-01-01');

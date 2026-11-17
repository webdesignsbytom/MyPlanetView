-- Promo codes that give a paid plan for life (the user's own codes, 17 Nov 2026)

-- AlterTable
ALTER TABLE "promo_code" ADD COLUMN     "freePlan" "Plan";

-- Only a paid plan can be given for life (Prisma can't express this)
ALTER TABLE "promo_code" ADD CONSTRAINT "promo_code_free_plan" CHECK ("freePlan" IS NULL OR "freePlan" IN ('REGULAR', 'PREMIUM'));

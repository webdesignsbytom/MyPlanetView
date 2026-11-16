-- "Print or download" (docs/API.md "Downloads"; docs/FEATURE-PLAN.md "Printing"): a photo
-- printer's offer is a travel offer of kind PRINTS, shown in the PRINT placement (under the
-- download), imported like every other offer. Made with `prisma migrate diff`.

-- AlterEnum
ALTER TYPE "OfferKind" ADD VALUE 'PRINTS';

-- AlterEnum
ALTER TYPE "OfferPlacement" ADD VALUE 'PRINT';

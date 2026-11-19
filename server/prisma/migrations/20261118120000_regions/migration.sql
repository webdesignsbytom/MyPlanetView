-- Regions (18 Nov 2026): places that are part of a country, with their own visit (Bali, the
-- Galapagos, Goa, Hawaii, New Caledonia, Tasmania; utils/regionPlaces.js). New Caledonia's row
-- turns REGION, and the others arrive, with the seed or npm run db:reference.

-- AlterEnum
ALTER TYPE "PlaceKind" ADD VALUE 'REGION';

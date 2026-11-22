-- Imports from other apps (docs/API.md "Importing from Polarsteps"; 21 Nov 2026): the source of an
-- imported trip, photo or moment, unique per map so an import run again adds nothing twice.

-- AlterTable
ALTER TABLE "trip" ADD COLUMN     "importedFrom" TEXT;

-- AlterTable
ALTER TABLE "photo" ADD COLUMN     "importedFrom" TEXT;

-- AlterTable
ALTER TABLE "moment" ADD COLUMN     "importedFrom" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "trip_mapId_importedFrom_key" ON "trip"("mapId", "importedFrom");

-- CreateIndex
CREATE UNIQUE INDEX "photo_mapId_importedFrom_key" ON "photo"("mapId", "importedFrom");

-- CreateIndex
CREATE UNIQUE INDEX "moment_mapId_importedFrom_key" ON "moment"("mapId", "importedFrom");


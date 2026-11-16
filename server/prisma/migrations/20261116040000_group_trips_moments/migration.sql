-- Group trips' "Add to my map" and moments (docs/API.md "Group trips" and "Moments";
-- docs/FEATURE-PLAN.md "Group trips" and "Moments"): a trip shown on other people's maps
-- (trip_map), and life events and notes on a map with their travellers and photos.
-- Made with `prisma migrate diff`; the CHECK at the end is added by hand (Prisma can't
-- express CHECK constraints, and leaves them alone on later diffs).

-- CreateEnum
CREATE TYPE "DatePrecision" AS ENUM ('DAY', 'MONTH', 'YEAR');

-- CreateTable
CREATE TABLE "trip_map" (
    "tripId" TEXT NOT NULL,
    "mapId" TEXT NOT NULL,
    "addedById" TEXT,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trip_map_pkey" PRIMARY KEY ("tripId","mapId")
);

-- CreateTable
CREATE TABLE "moment" (
    "id" TEXT NOT NULL,
    "mapId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "text" TEXT,
    "happenedOn" DATE,
    "datePrecision" "DatePrecision",
    "countryCode" CHAR(2) NOT NULL,
    "landmarkId" TEXT,
    "placeName" TEXT,
    "tripId" TEXT,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "moment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moment_traveller" (
    "momentId" TEXT NOT NULL,
    "travellerId" TEXT NOT NULL,

    CONSTRAINT "moment_traveller_pkey" PRIMARY KEY ("momentId","travellerId")
);

-- CreateTable
CREATE TABLE "moment_photo" (
    "momentId" TEXT NOT NULL,
    "photoId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "moment_photo_pkey" PRIMARY KEY ("momentId","photoId")
);

-- CreateIndex
CREATE INDEX "trip_map_mapId_idx" ON "trip_map"("mapId");

-- CreateIndex
CREATE INDEX "trip_map_addedById_idx" ON "trip_map"("addedById");

-- CreateIndex
CREATE INDEX "moment_mapId_happenedOn_idx" ON "moment"("mapId", "happenedOn");

-- CreateIndex
CREATE INDEX "moment_mapId_countryCode_happenedOn_idx" ON "moment"("mapId", "countryCode", "happenedOn");

-- CreateIndex
CREATE INDEX "moment_tripId_idx" ON "moment"("tripId");

-- CreateIndex
CREATE INDEX "moment_landmarkId_idx" ON "moment"("landmarkId");

-- CreateIndex
CREATE INDEX "moment_createdById_idx" ON "moment"("createdById");

-- CreateIndex
CREATE INDEX "moment_traveller_travellerId_idx" ON "moment_traveller"("travellerId");

-- CreateIndex
CREATE INDEX "moment_photo_photoId_idx" ON "moment_photo"("photoId");

-- AddForeignKey
ALTER TABLE "trip_map" ADD CONSTRAINT "trip_map_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_map" ADD CONSTRAINT "trip_map_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "travel_map"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_map" ADD CONSTRAINT "trip_map_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moment" ADD CONSTRAINT "moment_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "travel_map"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moment" ADD CONSTRAINT "moment_countryCode_fkey" FOREIGN KEY ("countryCode") REFERENCES "country"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moment" ADD CONSTRAINT "moment_landmarkId_fkey" FOREIGN KEY ("landmarkId") REFERENCES "landmark"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moment" ADD CONSTRAINT "moment_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trip"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moment" ADD CONSTRAINT "moment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moment_traveller" ADD CONSTRAINT "moment_traveller_momentId_fkey" FOREIGN KEY ("momentId") REFERENCES "moment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moment_traveller" ADD CONSTRAINT "moment_traveller_travellerId_fkey" FOREIGN KEY ("travellerId") REFERENCES "traveller"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moment_photo" ADD CONSTRAINT "moment_photo_momentId_fkey" FOREIGN KEY ("momentId") REFERENCES "moment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moment_photo" ADD CONSTRAINT "moment_photo_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "photo"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- CHECKs (each mirrors a rule in the code: utils/moments.js parseMomentDate)
-- A dated moment has both its day and how much of it is known; an undated note neither
ALTER TABLE "moment" ADD CONSTRAINT "moment_date_and_precision"
  CHECK (("happenedOn" IS NULL) = ("datePrecision" IS NULL));

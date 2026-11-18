-- Country maps (18 Nov 2026; docs/API.md "Country maps"): a country opened on its own, with
-- its states visited (subdivision_visit) and its pins, each with its visits and their photos.


-- CreateTable
CREATE TABLE "subdivision_visit" (
    "mapId" TEXT NOT NULL,
    "subdivisionCode" VARCHAR(12) NOT NULL,
    "countryCode" CHAR(2) NOT NULL,
    "status" "VisitStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "subdivision_visit_pkey" PRIMARY KEY ("mapId","subdivisionCode")
);

-- CreateTable
CREATE TABLE "map_pin" (
    "id" TEXT NOT NULL,
    "mapId" TEXT NOT NULL,
    "countryCode" CHAR(2) NOT NULL,
    "name" TEXT NOT NULL,
    "notes" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "map_pin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "map_pin_visit" (
    "id" TEXT NOT NULL,
    "pinId" TEXT NOT NULL,
    "visitedOn" DATE,
    "datePrecision" "DatePrecision",
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "map_pin_visit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "map_pin_visit_photo" (
    "visitId" TEXT NOT NULL,
    "photoId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "map_pin_visit_photo_pkey" PRIMARY KEY ("visitId","photoId")
);

-- CreateIndex
CREATE INDEX "subdivision_visit_mapId_countryCode_idx" ON "subdivision_visit"("mapId", "countryCode");

-- CreateIndex
CREATE INDEX "map_pin_mapId_countryCode_idx" ON "map_pin"("mapId", "countryCode");

-- CreateIndex
CREATE INDEX "map_pin_createdById_idx" ON "map_pin"("createdById");

-- CreateIndex
CREATE INDEX "map_pin_visit_pinId_visitedOn_idx" ON "map_pin_visit"("pinId", "visitedOn");

-- CreateIndex
CREATE INDEX "map_pin_visit_photo_photoId_idx" ON "map_pin_visit_photo"("photoId");

-- AddForeignKey
ALTER TABLE "subdivision_visit" ADD CONSTRAINT "subdivision_visit_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "travel_map"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subdivision_visit" ADD CONSTRAINT "subdivision_visit_countryCode_fkey" FOREIGN KEY ("countryCode") REFERENCES "country"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "map_pin" ADD CONSTRAINT "map_pin_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "travel_map"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "map_pin" ADD CONSTRAINT "map_pin_countryCode_fkey" FOREIGN KEY ("countryCode") REFERENCES "country"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "map_pin" ADD CONSTRAINT "map_pin_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "map_pin_visit" ADD CONSTRAINT "map_pin_visit_pinId_fkey" FOREIGN KEY ("pinId") REFERENCES "map_pin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "map_pin_visit_photo" ADD CONSTRAINT "map_pin_visit_photo_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "map_pin_visit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "map_pin_visit_photo" ADD CONSTRAINT "map_pin_visit_photo_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "photo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- A visit's date is both or neither (as a moment's)
ALTER TABLE "map_pin_visit" ADD CONSTRAINT "map_pin_visit_date_and_precision" CHECK (("visitedOn" IS NULL) = ("datePrecision" IS NULL));

-- A pin is somewhere real
ALTER TABLE "map_pin" ADD CONSTRAINT "map_pin_position" CHECK ("latitude" BETWEEN -90 AND 90 AND "longitude" BETWEEN -180 AND 180);

-- CreateEnum
CREATE TYPE "OneShotSource" AS ENUM ('MANUAL', 'FLIGHT');

-- CreateTable
CREATE TABLE "one_shot" (
    "id" TEXT NOT NULL,
    "mapId" TEXT NOT NULL,
    "itemKey" TEXT NOT NULL,
    "seenOn" DATE,
    "datePrecision" "DatePrecision",
    "countryCode" CHAR(2),
    "photoId" TEXT,
    "notes" TEXT,
    "source" "OneShotSource" NOT NULL DEFAULT 'MANUAL',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "one_shot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "one_shot_traveller" (
    "oneShotId" TEXT NOT NULL,
    "travellerId" TEXT NOT NULL,

    CONSTRAINT "one_shot_traveller_pkey" PRIMARY KEY ("oneShotId","travellerId")
);

-- CreateIndex
CREATE INDEX "one_shot_countryCode_idx" ON "one_shot"("countryCode");

-- CreateIndex
CREATE INDEX "one_shot_photoId_idx" ON "one_shot"("photoId");

-- CreateIndex
CREATE INDEX "one_shot_createdById_idx" ON "one_shot"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "one_shot_mapId_itemKey_key" ON "one_shot"("mapId", "itemKey");

-- CreateIndex
CREATE INDEX "one_shot_traveller_travellerId_idx" ON "one_shot_traveller"("travellerId");

-- AddForeignKey
ALTER TABLE "one_shot" ADD CONSTRAINT "one_shot_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "travel_map"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "one_shot" ADD CONSTRAINT "one_shot_countryCode_fkey" FOREIGN KEY ("countryCode") REFERENCES "country"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "one_shot" ADD CONSTRAINT "one_shot_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "photo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "one_shot" ADD CONSTRAINT "one_shot_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "one_shot_traveller" ADD CONSTRAINT "one_shot_traveller_oneShotId_fkey" FOREIGN KEY ("oneShotId") REFERENCES "one_shot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "one_shot_traveller" ADD CONSTRAINT "one_shot_traveller_travellerId_fkey" FOREIGN KEY ("travellerId") REFERENCES "traveller"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Life's One Shots: a date and its precision go together (both or neither), as a moment's
ALTER TABLE "one_shot" ADD CONSTRAINT "one_shot_date_and_precision" CHECK (("seenOn" IS NULL) = ("datePrecision" IS NULL));

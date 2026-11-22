-- Collecting landmarks ("been here" ticks) and "On this day" emails (docs/API.md "Collecting",
-- "Emails"; 21 Nov 2026).

-- AlterTable
ALTER TABLE "profile" ADD COLUMN     "lastOnThisDayAt" TIMESTAMP(3),
ADD COLUMN     "onThisDayEmails" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "landmark_visit" (
    "mapId" TEXT NOT NULL,
    "landmarkId" TEXT NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "landmark_visit_pkey" PRIMARY KEY ("mapId","landmarkId")
);

-- CreateIndex
CREATE INDEX "landmark_visit_landmarkId_idx" ON "landmark_visit"("landmarkId");

-- CreateIndex
CREATE INDEX "landmark_visit_createdById_idx" ON "landmark_visit"("createdById");

-- AddForeignKey
ALTER TABLE "landmark_visit" ADD CONSTRAINT "landmark_visit_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "travel_map"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "landmark_visit" ADD CONSTRAINT "landmark_visit_landmarkId_fkey" FOREIGN KEY ("landmarkId") REFERENCES "landmark"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "landmark_visit" ADD CONSTRAINT "landmark_visit_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;


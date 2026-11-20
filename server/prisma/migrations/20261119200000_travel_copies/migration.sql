-- CreateEnum
CREATE TYPE "TravelCopyStatus" AS ENUM ('PENDING', 'APPROVED', 'DONE', 'DECLINED');

-- AlterTable
ALTER TABLE "trip" ADD COLUMN     "copiedFromId" TEXT;

-- AlterTable
ALTER TABLE "photo" ADD COLUMN     "copiedFromId" TEXT;

-- AlterTable
ALTER TABLE "moment" ADD COLUMN     "copiedFromId" TEXT;

-- CreateTable
CREATE TABLE "travel_copy_request" (
    "id" TEXT NOT NULL,
    "fromMapId" TEXT NOT NULL,
    "toMapId" TEXT NOT NULL,
    "travellerId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "decidedById" TEXT,
    "status" "TravelCopyStatus" NOT NULL DEFAULT 'PENDING',
    "tripIds" TEXT[],
    "momentIds" TEXT[],
    "photoIds" TEXT[],
    "photoCursor" INTEGER NOT NULL DEFAULT 0,
    "copiedPhotos" INTEGER NOT NULL DEFAULT 0,
    "skippedPhotos" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "travel_copy_request_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "travel_copy_request_fromMapId_status_idx" ON "travel_copy_request"("fromMapId", "status");

-- CreateIndex
CREATE INDEX "travel_copy_request_toMapId_createdAt_idx" ON "travel_copy_request"("toMapId", "createdAt");

-- CreateIndex
CREATE INDEX "travel_copy_request_status_idx" ON "travel_copy_request"("status");

-- CreateIndex
CREATE INDEX "travel_copy_request_travellerId_idx" ON "travel_copy_request"("travellerId");

-- CreateIndex
CREATE INDEX "travel_copy_request_requestedById_idx" ON "travel_copy_request"("requestedById");

-- CreateIndex
CREATE INDEX "travel_copy_request_decidedById_idx" ON "travel_copy_request"("decidedById");

-- CreateIndex
CREATE UNIQUE INDEX "trip_mapId_copiedFromId_key" ON "trip"("mapId", "copiedFromId");

-- CreateIndex
CREATE UNIQUE INDEX "photo_mapId_copiedFromId_key" ON "photo"("mapId", "copiedFromId");

-- CreateIndex
CREATE UNIQUE INDEX "moment_mapId_copiedFromId_key" ON "moment"("mapId", "copiedFromId");

-- AddForeignKey
ALTER TABLE "travel_copy_request" ADD CONSTRAINT "travel_copy_request_fromMapId_fkey" FOREIGN KEY ("fromMapId") REFERENCES "travel_map"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "travel_copy_request" ADD CONSTRAINT "travel_copy_request_toMapId_fkey" FOREIGN KEY ("toMapId") REFERENCES "travel_map"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "travel_copy_request" ADD CONSTRAINT "travel_copy_request_travellerId_fkey" FOREIGN KEY ("travellerId") REFERENCES "traveller"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "travel_copy_request" ADD CONSTRAINT "travel_copy_request_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "travel_copy_request" ADD CONSTRAINT "travel_copy_request_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Never from a map onto itself (docs/API.md "Travel copies")
ALTER TABLE "travel_copy_request" ADD CONSTRAINT "travel_copy_maps_differ" CHECK ("fromMapId" <> "toMapId");

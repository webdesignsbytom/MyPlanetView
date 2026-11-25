-- CreateTable
CREATE TABLE "photo_show" (
    "id" TEXT NOT NULL,
    "mapId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "photoIds" TEXT[],
    "seconds" INTEGER NOT NULL DEFAULT 5,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "photo_show_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "photo_show_code_key" ON "photo_show"("code");

-- CreateIndex
CREATE INDEX "photo_show_mapId_createdAt_idx" ON "photo_show"("mapId", "createdAt");

-- CreateIndex
CREATE INDEX "photo_show_createdById_idx" ON "photo_show"("createdById");

-- AddForeignKey
ALTER TABLE "photo_show" ADD CONSTRAINT "photo_show_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "travel_map"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photo_show" ADD CONSTRAINT "photo_show_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- A slideshow's photos: 1 to 500 (a NULL list counts as none), and how long each stays up
ALTER TABLE "photo_show" ADD CONSTRAINT "photo_show_photos" CHECK ("photoIds" IS NOT NULL AND cardinality("photoIds") BETWEEN 1 AND 500);
ALTER TABLE "photo_show" ADD CONSTRAINT "photo_show_seconds" CHECK ("seconds" IN (3, 5, 8));

-- Life's One Shots: several photos a tick (26 Nov 2026, the user's wish: "a photo/multiple
-- photos of you with" it), up to 5 in order, the first on its card. Each tick's one photo
-- moves into the new table first, so nothing is lost.

-- CreateTable
CREATE TABLE "one_shot_photo" (
    "oneShotId" TEXT NOT NULL,
    "photoId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "one_shot_photo_pkey" PRIMARY KEY ("oneShotId","photoId")
);

-- CreateIndex
CREATE INDEX "one_shot_photo_photoId_idx" ON "one_shot_photo"("photoId");

-- AddForeignKey
ALTER TABLE "one_shot_photo" ADD CONSTRAINT "one_shot_photo_oneShotId_fkey" FOREIGN KEY ("oneShotId") REFERENCES "one_shot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "one_shot_photo" ADD CONSTRAINT "one_shot_photo_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "photo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Each tick's photo, kept as its first
INSERT INTO "one_shot_photo" ("oneShotId", "photoId", "position")
SELECT "id", "photoId", 0 FROM "one_shot" WHERE "photoId" IS NOT NULL;

-- DropForeignKey
ALTER TABLE "one_shot" DROP CONSTRAINT "one_shot_photoId_fkey";

-- DropIndex
DROP INDEX "one_shot_photoId_idx";

-- AlterTable
ALTER TABLE "one_shot" DROP COLUMN "photoId";

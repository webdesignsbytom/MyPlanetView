-- Videos move to Cloudflare Stream (the user's decision, 16 Nov 2026; docs/API.md "Videos"),
-- which converts each one so every browser plays it: a video row holds its Stream id, its
-- conversion state and its size, and no longer has files in R2 (no PhotoVariants).
-- Made with `prisma migrate diff`; the CHECK at the end is added by hand. No production
-- data exists, so no video rows need moving.

-- CreateEnum
CREATE TYPE "VideoState" AS ENUM ('PROCESSING', 'READY', 'FAILED');

-- AlterTable
ALTER TABLE "photo" ADD COLUMN     "streamUid" TEXT,
ADD COLUMN     "videoBytes" INTEGER,
ADD COLUMN     "videoState" "VideoState";

-- CreateIndex
CREATE UNIQUE INDEX "photo_streamUid_key" ON "photo"("streamUid");


-- A video has its Stream id, state and size; a photo none of them
ALTER TABLE "photo" ADD CONSTRAINT "photo_video_stream" CHECK (
  ("kind" = 'VIDEO') = ("streamUid" IS NOT NULL)
  AND ("streamUid" IS NULL) = ("videoState" IS NULL)
  AND ("streamUid" IS NULL) = ("videoBytes" IS NULL)
);

-- First Class videos (docs/API.md "Videos"; docs/FEATURE-PLAN.md "Videos (First Class)"): a
-- photo row is a photo or a video; a video has a length and no stored location.
-- Made with `prisma migrate diff`; the CHECKs at the end are added by hand.

-- CreateEnum
CREATE TYPE "PhotoKind" AS ENUM ('PHOTO', 'VIDEO');

-- AlterTable
ALTER TABLE "photo" ADD COLUMN     "durationS" INTEGER,
ADD COLUMN     "kind" "PhotoKind" NOT NULL DEFAULT 'PHOTO';


-- A video has its length in seconds (1–600; the plan's limit is lower) and a photo none
ALTER TABLE "photo" ADD CONSTRAINT "photo_video_duration"
  CHECK (("kind" = 'VIDEO') = ("durationS" IS NOT NULL) AND ("durationS" IS NULL OR "durationS" BETWEEN 1 AND 600));
-- Version 1 stores no position for a video (the uploader chooses its country)
ALTER TABLE "photo" ADD CONSTRAINT "photo_video_no_location"
  CHECK ("kind" <> 'VIDEO' OR ("latitude" IS NULL AND "longitude" IS NULL));

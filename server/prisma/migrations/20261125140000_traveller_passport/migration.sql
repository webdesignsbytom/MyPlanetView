-- AlterTable
ALTER TABLE "traveller" ADD COLUMN     "portraitFocusX" DOUBLE PRECISION,
ADD COLUMN     "portraitFocusY" DOUBLE PRECISION,
ADD COLUMN     "portraitPhotoId" TEXT,
ADD COLUMN     "portraitZoom" DOUBLE PRECISION,
ADD COLUMN     "signature" TEXT;

-- CreateIndex
CREATE INDEX "traveller_portraitPhotoId_idx" ON "traveller"("portraitPhotoId");

-- AddForeignKey
ALTER TABLE "traveller" ADD CONSTRAINT "traveller_portraitPhotoId_fkey" FOREIGN KEY ("portraitPhotoId") REFERENCES "photo"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- A passport photo's crop: its focus 0 to 1 across and down, its zoom 1 to 4, all three with a
-- photo (a photo deleted clears only the photo, so the crop may outlive it)
ALTER TABLE "traveller" ADD CONSTRAINT "traveller_portrait" CHECK (
  ("portraitFocusX" IS NULL OR "portraitFocusX" BETWEEN 0 AND 1)
  AND ("portraitFocusY" IS NULL OR "portraitFocusY" BETWEEN 0 AND 1)
  AND ("portraitZoom" IS NULL OR "portraitZoom" BETWEEN 1 AND 4)
  AND ("portraitPhotoId" IS NULL OR ("portraitFocusX" IS NOT NULL AND "portraitFocusY" IS NOT NULL AND "portraitZoom" IS NOT NULL))
);
-- A signature: an SVG path of at most 20,000 characters
ALTER TABLE "traveller" ADD CONSTRAINT "traveller_signature" CHECK ("signature" IS NULL OR char_length("signature") BETWEEN 1 AND 20000);

-- Indexes for the upload checks (docs/AUDIT.md A9): the per-user cap on unfinished
-- uploads counts media by owner and age, and the orphan clean-up and the contact image
-- rules look contact forms up by image key. Made with `prisma migrate diff`.

-- DropIndex
DROP INDEX "media_item_ownerId_idx";

-- CreateIndex
CREATE INDEX "media_item_ownerId_createdAt_idx" ON "media_item"("ownerId", "createdAt");

-- CreateIndex
CREATE INDEX "contact_form_imageKey_idx" ON "contact_form"("imageKey");

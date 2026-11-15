-- Audit B3 (docs/AUDIT.md): foreign-key indexes for cascades, photo indexes that
-- match the lists' order (newest upload first), and AppEvent indexes for the admin
-- list, retention and user deletion. Made with `prisma migrate diff` from the
-- previous schema; the share_invite_one_target CHECK from init is untouched.

-- DropIndex
DROP INDEX "country_visit_countryCode_idx";

-- DropIndex
DROP INDEX "photo_mapId_takenAt_idx";

-- DropIndex
DROP INDEX "photo_tripId_idx";

-- DropIndex
DROP INDEX "photo_countryCode_idx";

-- DropIndex
DROP INDEX "app_event_domain_action_idx";

-- DropIndex
DROP INDEX "app_event_status_targetId_idx";

-- DropIndex
DROP INDEX "app_event_important_idx";

-- CreateIndex
CREATE INDEX "share_invite_mapId_idx" ON "share_invite"("mapId");

-- CreateIndex
CREATE INDEX "share_invite_tripId_idx" ON "share_invite"("tripId");

-- CreateIndex
CREATE INDEX "share_invite_invitedById_idx" ON "share_invite"("invitedById");

-- CreateIndex
CREATE INDEX "trip_coverPhotoId_idx" ON "trip"("coverPhotoId");

-- CreateIndex
CREATE INDEX "trip_createdById_idx" ON "trip"("createdById");

-- CreateIndex
CREATE INDEX "photo_mapId_createdAt_id_idx" ON "photo"("mapId", "createdAt" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "photo_tripId_createdAt_id_idx" ON "photo"("tripId", "createdAt" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "photo_mapId_countryCode_createdAt_idx" ON "photo"("mapId", "countryCode", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "app_event_createdAt_idx" ON "app_event"("createdAt");

-- CreateIndex
CREATE INDEX "app_event_actorId_idx" ON "app_event"("actorId");

-- CreateIndex
CREATE INDEX "app_event_targetId_idx" ON "app_event"("targetId");


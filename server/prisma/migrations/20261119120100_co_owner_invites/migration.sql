-- A co-owner invite names the traveller they'll be (19 Nov 2026, docs/API.md "Co-owners").

-- AlterTable
ALTER TABLE "share_invite" ADD COLUMN     "travellerId" TEXT;

-- CreateIndex
CREATE INDEX "share_invite_travellerId_idx" ON "share_invite"("travellerId");

-- AddForeignKey
ALTER TABLE "share_invite" ADD CONSTRAINT "share_invite_travellerId_fkey" FOREIGN KEY ("travellerId") REFERENCES "traveller"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- A traveller exactly when the invite is for a co-owner, and co-owners only on maps
ALTER TABLE "share_invite" ADD CONSTRAINT "share_invite_co_owner" CHECK (
  ("role" = 'CO_OWNER') = ("travellerId" IS NOT NULL)
  AND ("role" <> 'CO_OWNER' OR "mapId" IS NOT NULL)
);

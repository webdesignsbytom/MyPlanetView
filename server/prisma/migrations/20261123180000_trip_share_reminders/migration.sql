-- "Welcome home" emails (23 Nov 2026; docs/API.md "Emails"): the day after a trip ends, a
-- reminder to share it, once per trip, unless the account switched them off

-- AlterTable
ALTER TABLE "profile" ADD COLUMN     "tripShareEmails" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "trip" ADD COLUMN     "shareReminderSentAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "trip_endDate_idx" ON "trip"("endDate");

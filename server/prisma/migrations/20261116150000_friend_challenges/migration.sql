-- Friends challenges (docs/API.md "Friends challenges"; docs/FEATURE-PLAN.md "Friends
-- challenges"): a measure counted between two dates among friends who join by a link, each
-- with the map that counts for them. Made with `prisma migrate diff`; the CHECKs at the end
-- are added by hand (Prisma can't express them, and leaves them alone on later diffs).

-- CreateEnum
CREATE TYPE "ChallengeMeasure" AS ENUM ('NEW_COUNTRIES', 'COUNTRIES', 'LANDMARKS', 'THEME_PHOTOS');

-- CreateTable
CREATE TABLE "friend_challenge" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "measure" "ChallengeMeasure" NOT NULL,
    "startsOn" DATE NOT NULL,
    "endsOn" DATE NOT NULL,
    "target" INTEGER,
    "joinCode" TEXT NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "friend_challenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "friend_challenge_entry" (
    "challengeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mapId" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "friend_challenge_entry_pkey" PRIMARY KEY ("challengeId","userId")
);

-- CreateIndex
CREATE UNIQUE INDEX "friend_challenge_joinCode_key" ON "friend_challenge"("joinCode");

-- CreateIndex
CREATE INDEX "friend_challenge_createdById_idx" ON "friend_challenge"("createdById");

-- CreateIndex
CREATE INDEX "friend_challenge_entry_userId_idx" ON "friend_challenge_entry"("userId");

-- CreateIndex
CREATE INDEX "friend_challenge_entry_mapId_idx" ON "friend_challenge_entry"("mapId");

-- AddForeignKey
ALTER TABLE "friend_challenge" ADD CONSTRAINT "friend_challenge_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friend_challenge_entry" ADD CONSTRAINT "friend_challenge_entry_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "friend_challenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friend_challenge_entry" ADD CONSTRAINT "friend_challenge_entry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friend_challenge_entry" ADD CONSTRAINT "friend_challenge_entry_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "travel_map"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- The last day is on or after the first, and a challenge lasts at most two years
-- (utils/challenges.js CHALLENGE_LIMITS.days)
ALTER TABLE "friend_challenge" ADD CONSTRAINT "friend_challenge_dates_in_order" CHECK ("endsOn" - "startsOn" BETWEEN 0 AND 730);

-- "First to 5": a target of 1 to 500, or none
ALTER TABLE "friend_challenge" ADD CONSTRAINT "friend_challenge_target_range" CHECK ("target" IS NULL OR "target" BETWEEN 1 AND 500);

-- A title is never empty and at most 80 characters
ALTER TABLE "friend_challenge" ADD CONSTRAINT "friend_challenge_title_length" CHECK (char_length("title") BETWEEN 1 AND 80);

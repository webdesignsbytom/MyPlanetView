-- CreateTable
CREATE TABLE "vs_group" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "joinCode" TEXT NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vs_group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vs_member" (
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mapId" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vs_member_pkey" PRIMARY KEY ("groupId","userId")
);

-- CreateIndex
CREATE UNIQUE INDEX "vs_group_joinCode_key" ON "vs_group"("joinCode");

-- CreateIndex
CREATE INDEX "vs_group_createdById_idx" ON "vs_group"("createdById");

-- CreateIndex
CREATE INDEX "vs_member_userId_idx" ON "vs_member"("userId");

-- CreateIndex
CREATE INDEX "vs_member_mapId_idx" ON "vs_member"("mapId");

-- AddForeignKey
ALTER TABLE "vs_group" ADD CONSTRAINT "vs_group_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vs_member" ADD CONSTRAINT "vs_member_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "vs_group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vs_member" ADD CONSTRAINT "vs_member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vs_member" ADD CONSTRAINT "vs_member_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "travel_map"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- CreateEnum
CREATE TYPE "PostcardKind" AS ENUM ('COUNTRY', 'LANDMARK', 'PHOTO');

-- CreateTable
CREATE TABLE "postcard" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "kind" "PostcardKind" NOT NULL,
    "countryCode" CHAR(2) NOT NULL,
    "landmarkId" TEXT,
    "pictureId" TEXT,
    "style" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "toName" TEXT,
    "fromName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "postcard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "postcard_code_key" ON "postcard"("code");

-- CreateIndex
CREATE UNIQUE INDEX "postcard_pictureId_key" ON "postcard"("pictureId");

-- CreateIndex
CREATE INDEX "postcard_senderId_createdAt_idx" ON "postcard"("senderId", "createdAt");

-- CreateIndex
CREATE INDEX "postcard_landmarkId_idx" ON "postcard"("landmarkId");

-- CreateIndex
CREATE INDEX "postcard_countryCode_idx" ON "postcard"("countryCode");

-- AddForeignKey
ALTER TABLE "postcard" ADD CONSTRAINT "postcard_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postcard" ADD CONSTRAINT "postcard_countryCode_fkey" FOREIGN KEY ("countryCode") REFERENCES "country"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postcard" ADD CONSTRAINT "postcard_landmarkId_fkey" FOREIGN KEY ("landmarkId") REFERENCES "landmark"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postcard" ADD CONSTRAINT "postcard_pictureId_fkey" FOREIGN KEY ("pictureId") REFERENCES "media_item"("id") ON DELETE SET NULL ON UPDATE CASCADE;



-- A card's message: 1 to 400 characters (utils/postcards.js POSTCARD_LIMITS)
ALTER TABLE "postcard" ADD CONSTRAINT "postcard_message" CHECK (char_length("message") BETWEEN 1 AND 400);

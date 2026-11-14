-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Continent" AS ENUM ('AFRICA', 'ANTARCTICA', 'ASIA', 'EUROPE', 'NORTH_AMERICA', 'OCEANIA', 'SOUTH_AMERICA');

-- CreateEnum
CREATE TYPE "ShareRole" AS ENUM ('VIEWER', 'EDITOR');

-- CreateEnum
CREATE TYPE "LinkAccess" AS ENUM ('RESTRICTED', 'ANYONE_WITH_LINK');

-- CreateEnum
CREATE TYPE "TravelGroupType" AS ENUM ('SOLO', 'COUPLE', 'FAMILY');

-- CreateEnum
CREATE TYPE "VisitStatus" AS ENUM ('VISITED', 'LIVED', 'WANT_TO_GO');

-- CreateEnum
CREATE TYPE "VisitSource" AS ENUM ('MANUAL', 'PHOTO', 'TRIP');

-- CreateEnum
CREATE TYPE "TripStatus" AS ENUM ('PLANNED', 'ACTIVE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "PhotoSize" AS ENUM ('THUMB', 'DISPLAY', 'ORIGINAL');

-- CreateEnum
CREATE TYPE "MatchSource" AS ENUM ('GPS', 'MANUAL');

-- CreateEnum
CREATE TYPE "MediaKind" AS ENUM ('IMAGE', 'VIDEO', 'FILE');

-- CreateEnum
CREATE TYPE "MediaVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "AppEventLevel" AS ENUM ('DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AppEventStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'IGNORED');

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "username" TEXT,
    "homeCountryCode" CHAR(2),
    "mapSettings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "country" (
    "code" CHAR(2) NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "continent" "Continent" NOT NULL,
    "pinX" DOUBLE PRECISION,
    "pinY" DOUBLE PRECISION,

    CONSTRAINT "country_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "landmark" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "countryCode" CHAR(2) NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "matchRadiusM" INTEGER NOT NULL DEFAULT 500,
    "pinX" DOUBLE PRECISION,
    "pinY" DOUBLE PRECISION,

    CONSTRAINT "landmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "travel_map" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "groupType" "TravelGroupType" NOT NULL DEFAULT 'SOLO',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "ownerId" TEXT NOT NULL,
    "linkAccess" "LinkAccess" NOT NULL DEFAULT 'RESTRICTED',
    "shareCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "travel_map_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "traveller" (
    "id" TEXT NOT NULL,
    "mapId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "userId" TEXT,
    "birthCountryCode" CHAR(2),
    "favouriteCountryCode" CHAR(2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "traveller_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "map_member" (
    "mapId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "ShareRole" NOT NULL DEFAULT 'VIEWER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "map_member_pkey" PRIMARY KEY ("mapId","userId")
);

-- CreateTable
CREATE TABLE "share_invite" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "ShareRole" NOT NULL DEFAULT 'VIEWER',
    "mapId" TEXT,
    "tripId" TEXT,
    "invitedById" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "share_invite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "country_visit" (
    "mapId" TEXT NOT NULL,
    "countryCode" CHAR(2) NOT NULL,
    "status" "VisitStatus" NOT NULL DEFAULT 'VISITED',
    "source" "VisitSource" NOT NULL DEFAULT 'MANUAL',
    "firstVisitedOn" DATE,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "country_visit_pkey" PRIMARY KEY ("mapId","countryCode")
);

-- CreateTable
CREATE TABLE "trip" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "TripStatus" NOT NULL DEFAULT 'PLANNED',
    "startDate" DATE,
    "endDate" DATE,
    "mapId" TEXT NOT NULL,
    "createdById" TEXT,
    "coverPhotoId" TEXT,
    "linkAccess" "LinkAccess" NOT NULL DEFAULT 'RESTRICTED',
    "shareCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_member" (
    "tripId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "ShareRole" NOT NULL DEFAULT 'VIEWER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trip_member_pkey" PRIMARY KEY ("tripId","userId")
);

-- CreateTable
CREATE TABLE "trip_traveller" (
    "tripId" TEXT NOT NULL,
    "travellerId" TEXT NOT NULL,

    CONSTRAINT "trip_traveller_pkey" PRIMARY KEY ("tripId","travellerId")
);

-- CreateTable
CREATE TABLE "trip_stop" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "countryCode" CHAR(2) NOT NULL,
    "landmarkId" TEXT,
    "placeName" TEXT,
    "arriveOn" DATE,
    "leaveOn" DATE,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trip_stop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "photo" (
    "id" TEXT NOT NULL,
    "mapId" TEXT NOT NULL,
    "uploaderId" TEXT NOT NULL,
    "tripId" TEXT,
    "countryCode" CHAR(2),
    "caption" TEXT,
    "takenAt" TIMESTAMP(3),
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "photo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "photo_variant" (
    "photoId" TEXT NOT NULL,
    "size" "PhotoSize" NOT NULL,
    "mediaId" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,

    CONSTRAINT "photo_variant_pkey" PRIMARY KEY ("photoId","size")
);

-- CreateTable
CREATE TABLE "photo_landmark" (
    "photoId" TEXT NOT NULL,
    "landmarkId" TEXT NOT NULL,
    "source" "MatchSource" NOT NULL,
    "distanceM" INTEGER,
    "confirmed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "photo_landmark_pkey" PRIMARY KEY ("photoId","landmarkId")
);

-- CreateTable
CREATE TABLE "media_item" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "kind" "MediaKind" NOT NULL,
    "visibility" "MediaVisibility" NOT NULL,
    "contentType" TEXT NOT NULL,
    "bytes" INTEGER,
    "originalFilename" TEXT,
    "ownerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avatar_media_item" (
    "userId" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "alt" TEXT,
    "focalX" DOUBLE PRECISION,
    "focalY" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "avatar_media_item_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "contact_form" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "imageKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_form_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_limit" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "resetAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rate_limit_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "app_event" (
    "id" TEXT NOT NULL,
    "level" "AppEventLevel" NOT NULL DEFAULT 'INFO',
    "status" "AppEventStatus" NOT NULL DEFAULT 'OPEN',
    "important" BOOLEAN NOT NULL DEFAULT false,
    "domain" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "statusCode" INTEGER,
    "path" TEXT,
    "method" TEXT,
    "stack" TEXT,
    "requestId" TEXT,
    "metadata" JSONB,
    "actorId" TEXT,
    "targetId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "profile_userId_key" ON "profile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "profile_username_key" ON "profile"("username");

-- CreateIndex
CREATE UNIQUE INDEX "country_name_key" ON "country"("name");

-- CreateIndex
CREATE UNIQUE INDEX "country_slug_key" ON "country"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "landmark_slug_key" ON "landmark"("slug");

-- CreateIndex
CREATE INDEX "landmark_countryCode_idx" ON "landmark"("countryCode");

-- CreateIndex
CREATE INDEX "landmark_latitude_longitude_idx" ON "landmark"("latitude", "longitude");

-- CreateIndex
CREATE UNIQUE INDEX "travel_map_shareCode_key" ON "travel_map"("shareCode");

-- CreateIndex
CREATE INDEX "travel_map_ownerId_idx" ON "travel_map"("ownerId");

-- CreateIndex
CREATE INDEX "traveller_mapId_position_idx" ON "traveller"("mapId", "position");

-- CreateIndex
CREATE INDEX "traveller_userId_idx" ON "traveller"("userId");

-- CreateIndex
CREATE INDEX "map_member_userId_idx" ON "map_member"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "share_invite_tokenHash_key" ON "share_invite"("tokenHash");

-- CreateIndex
CREATE INDEX "share_invite_email_idx" ON "share_invite"("email");

-- CreateIndex
CREATE INDEX "country_visit_countryCode_idx" ON "country_visit"("countryCode");

-- CreateIndex
CREATE UNIQUE INDEX "trip_shareCode_key" ON "trip"("shareCode");

-- CreateIndex
CREATE INDEX "trip_mapId_startDate_idx" ON "trip"("mapId", "startDate");

-- CreateIndex
CREATE INDEX "trip_member_userId_idx" ON "trip_member"("userId");

-- CreateIndex
CREATE INDEX "trip_traveller_travellerId_idx" ON "trip_traveller"("travellerId");

-- CreateIndex
CREATE INDEX "trip_stop_tripId_position_idx" ON "trip_stop"("tripId", "position");

-- CreateIndex
CREATE INDEX "photo_mapId_takenAt_idx" ON "photo"("mapId", "takenAt");

-- CreateIndex
CREATE INDEX "photo_tripId_idx" ON "photo"("tripId");

-- CreateIndex
CREATE INDEX "photo_countryCode_idx" ON "photo"("countryCode");

-- CreateIndex
CREATE INDEX "photo_uploaderId_idx" ON "photo"("uploaderId");

-- CreateIndex
CREATE UNIQUE INDEX "photo_variant_mediaId_key" ON "photo_variant"("mediaId");

-- CreateIndex
CREATE INDEX "photo_landmark_landmarkId_idx" ON "photo_landmark"("landmarkId");

-- CreateIndex
CREATE UNIQUE INDEX "media_item_key_key" ON "media_item"("key");

-- CreateIndex
CREATE INDEX "media_item_resource_idx" ON "media_item"("resource");

-- CreateIndex
CREATE INDEX "media_item_ownerId_idx" ON "media_item"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "avatar_media_item_mediaId_key" ON "avatar_media_item"("mediaId");

-- CreateIndex
CREATE INDEX "contact_form_createdAt_idx" ON "contact_form"("createdAt");

-- CreateIndex
CREATE INDEX "rate_limit_resetAt_idx" ON "rate_limit"("resetAt");

-- CreateIndex
CREATE INDEX "app_event_level_createdAt_idx" ON "app_event"("level", "createdAt");

-- CreateIndex
CREATE INDEX "app_event_domain_action_idx" ON "app_event"("domain", "action");

-- CreateIndex
CREATE INDEX "app_event_status_targetId_idx" ON "app_event"("status", "targetId");

-- CreateIndex
CREATE INDEX "app_event_important_idx" ON "app_event"("important");

-- CreateIndex
CREATE INDEX "app_event_requestId_idx" ON "app_event"("requestId");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile" ADD CONSTRAINT "profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile" ADD CONSTRAINT "profile_homeCountryCode_fkey" FOREIGN KEY ("homeCountryCode") REFERENCES "country"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "landmark" ADD CONSTRAINT "landmark_countryCode_fkey" FOREIGN KEY ("countryCode") REFERENCES "country"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "travel_map" ADD CONSTRAINT "travel_map_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "traveller" ADD CONSTRAINT "traveller_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "travel_map"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "traveller" ADD CONSTRAINT "traveller_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "traveller" ADD CONSTRAINT "traveller_birthCountryCode_fkey" FOREIGN KEY ("birthCountryCode") REFERENCES "country"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "traveller" ADD CONSTRAINT "traveller_favouriteCountryCode_fkey" FOREIGN KEY ("favouriteCountryCode") REFERENCES "country"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "map_member" ADD CONSTRAINT "map_member_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "travel_map"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "map_member" ADD CONSTRAINT "map_member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "share_invite" ADD CONSTRAINT "share_invite_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "travel_map"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "share_invite" ADD CONSTRAINT "share_invite_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "share_invite" ADD CONSTRAINT "share_invite_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "country_visit" ADD CONSTRAINT "country_visit_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "travel_map"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "country_visit" ADD CONSTRAINT "country_visit_countryCode_fkey" FOREIGN KEY ("countryCode") REFERENCES "country"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip" ADD CONSTRAINT "trip_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "travel_map"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip" ADD CONSTRAINT "trip_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip" ADD CONSTRAINT "trip_coverPhotoId_fkey" FOREIGN KEY ("coverPhotoId") REFERENCES "photo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_member" ADD CONSTRAINT "trip_member_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_member" ADD CONSTRAINT "trip_member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_traveller" ADD CONSTRAINT "trip_traveller_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_traveller" ADD CONSTRAINT "trip_traveller_travellerId_fkey" FOREIGN KEY ("travellerId") REFERENCES "traveller"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_stop" ADD CONSTRAINT "trip_stop_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_stop" ADD CONSTRAINT "trip_stop_countryCode_fkey" FOREIGN KEY ("countryCode") REFERENCES "country"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_stop" ADD CONSTRAINT "trip_stop_landmarkId_fkey" FOREIGN KEY ("landmarkId") REFERENCES "landmark"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photo" ADD CONSTRAINT "photo_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "travel_map"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photo" ADD CONSTRAINT "photo_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photo" ADD CONSTRAINT "photo_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trip"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photo" ADD CONSTRAINT "photo_countryCode_fkey" FOREIGN KEY ("countryCode") REFERENCES "country"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photo_variant" ADD CONSTRAINT "photo_variant_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "photo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photo_variant" ADD CONSTRAINT "photo_variant_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "media_item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photo_landmark" ADD CONSTRAINT "photo_landmark_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "photo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photo_landmark" ADD CONSTRAINT "photo_landmark_landmarkId_fkey" FOREIGN KEY ("landmarkId") REFERENCES "landmark"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_item" ADD CONSTRAINT "media_item_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avatar_media_item" ADD CONSTRAINT "avatar_media_item_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avatar_media_item" ADD CONSTRAINT "avatar_media_item_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "media_item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_event" ADD CONSTRAINT "app_event_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_event" ADD CONSTRAINT "app_event_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- A share invite targets exactly one of a map or a trip (not expressible in schema.prisma)
ALTER TABLE "share_invite" ADD CONSTRAINT "share_invite_one_target" CHECK (("mapId" IS NULL) <> ("tripId" IS NULL));

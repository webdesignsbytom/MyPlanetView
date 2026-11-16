-- The whole schema in one migration (17 Nov 2026: the nineteen before it squashed into
-- this one, the user's wish, for a fresh start). Made with `prisma migrate diff --from-empty
-- --to-schema prisma/schema.prisma --script`; the CHECK constraints at the end are added by
-- hand (Prisma can't express them, and leaves them alone on later diffs). Each mirrors a rule
-- the code already enforces. Reference data (countries, the UK's nations, landmarks) comes
-- from the seed or `npm run db:reference`, never from a migration.

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Continent" AS ENUM ('AFRICA', 'ANTARCTICA', 'ASIA', 'EUROPE', 'NORTH_AMERICA', 'OCEANIA', 'SOUTH_AMERICA');

-- CreateEnum
CREATE TYPE "PlaceKind" AS ENUM ('COUNTRY', 'SPECIAL', 'NATION');

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
CREATE TYPE "PhotoKind" AS ENUM ('PHOTO', 'VIDEO');

-- CreateEnum
CREATE TYPE "VideoState" AS ENUM ('PROCESSING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "PhotoSize" AS ENUM ('THUMB', 'DISPLAY', 'ORIGINAL', 'PRINT');

-- CreateEnum
CREATE TYPE "MatchSource" AS ENUM ('GPS', 'MANUAL');

-- CreateEnum
CREATE TYPE "DatePrecision" AS ENUM ('DAY', 'MONTH', 'YEAR');

-- CreateEnum
CREATE TYPE "MediaKind" AS ENUM ('IMAGE', 'VIDEO', 'FILE');

-- CreateEnum
CREATE TYPE "MediaVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "ChallengeMeasure" AS ENUM ('NEW_COUNTRIES', 'COUNTRIES', 'LANDMARKS', 'THEME_PHOTOS');

-- CreateEnum
CREATE TYPE "GoalKind" AS ENUM ('COUNTRY_COUNT', 'COUNTRY_LIST', 'REGION', 'LANDMARK_COUNT');

-- CreateEnum
CREATE TYPE "OfferKind" AS ENUM ('HOTEL', 'TOUR', 'FLIGHT', 'ESIM', 'INSURANCE', 'LUGGAGE', 'CAR_HIRE', 'OTHER', 'PRINTS');

-- CreateEnum
CREATE TYPE "OfferPlacement" AS ENUM ('GALLERY', 'SLIDESHOW', 'COUNTRY_PAGE', 'TRAVEL_DESK', 'PRINT');

-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('FREE', 'REGULAR', 'PREMIUM');

-- CreateEnum
CREATE TYPE "BillingInterval" AS ENUM ('MONTH', 'YEAR');

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
    "leavingPlan" JSONB,
    "leavingPlanAt" TIMESTAMP(3),
    "promoCodeId" TEXT,
    "promoTrialUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "country" (
    "code" CHAR(2) NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "kind" "PlaceKind" NOT NULL DEFAULT 'COUNTRY',
    "continent" "Continent",
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
    "wikidataId" TEXT NOT NULL,
    "countryCode" CHAR(2) NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "matchRadiusM" INTEGER NOT NULL DEFAULT 500,
    "pinX" DOUBLE PRECISION,
    "pinY" DOUBLE PRECISION,
    "isUnesco" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "landmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "travel_map" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "groupType" "TravelGroupType" NOT NULL DEFAULT 'SOLO',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "ownerId" TEXT NOT NULL,
    "defaultForOwnerId" TEXT,
    "linkAccess" "LinkAccess" NOT NULL DEFAULT 'RESTRICTED',
    "shareCode" TEXT NOT NULL,
    "graceUntil" TIMESTAMP(3),
    "splitUk" BOOLEAN NOT NULL DEFAULT false,
    "ukNationVisits" JSONB,
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
CREATE TABLE "trip_map" (
    "tripId" TEXT NOT NULL,
    "mapId" TEXT NOT NULL,
    "addedById" TEXT,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trip_map_pkey" PRIMARY KEY ("tripId","mapId")
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
    "ukNation" CHAR(2),
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
    "ukNation" CHAR(2),
    "caption" TEXT,
    "takenAt" TIMESTAMP(3),
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "kind" "PhotoKind" NOT NULL DEFAULT 'PHOTO',
    "durationS" INTEGER,
    "streamUid" TEXT,
    "videoState" "VideoState",
    "videoBytes" INTEGER,
    "shotAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "countryPosition" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tripPosition" DOUBLE PRECISION NOT NULL DEFAULT 0,
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
    "confirmedAt" TIMESTAMP(3),
    "mapId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "photo_landmark_pkey" PRIMARY KEY ("photoId","landmarkId")
);

-- CreateTable
CREATE TABLE "moment" (
    "id" TEXT NOT NULL,
    "mapId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "text" TEXT,
    "happenedOn" DATE,
    "datePrecision" "DatePrecision",
    "countryCode" CHAR(2) NOT NULL,
    "ukNation" CHAR(2),
    "landmarkId" TEXT,
    "placeName" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "spotShared" BOOLEAN NOT NULL DEFAULT false,
    "tripId" TEXT,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "moment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moment_traveller" (
    "momentId" TEXT NOT NULL,
    "travellerId" TEXT NOT NULL,

    CONSTRAINT "moment_traveller_pkey" PRIMARY KEY ("momentId","travellerId")
);

-- CreateTable
CREATE TABLE "moment_photo" (
    "momentId" TEXT NOT NULL,
    "photoId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "moment_photo_pkey" PRIMARY KEY ("momentId","photoId")
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
CREATE TABLE "landmark_cover" (
    "mapId" TEXT NOT NULL,
    "landmarkId" TEXT NOT NULL,
    "photoId" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "landmark_cover_pkey" PRIMARY KEY ("mapId","landmarkId")
);

-- CreateTable
CREATE TABLE "photo_theme" (
    "id" TEXT NOT NULL,
    "month" DATE NOT NULL,
    "title" TEXT NOT NULL,
    "blurb" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "photo_theme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "photo_theme_entry" (
    "themeId" TEXT NOT NULL,
    "photoId" TEXT NOT NULL,
    "mapId" TEXT NOT NULL,
    "enteredById" TEXT,
    "enteredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "photo_theme_entry_pkey" PRIMARY KEY ("themeId","photoId")
);

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

-- CreateTable
CREATE TABLE "badge_award" (
    "mapId" TEXT NOT NULL,
    "badgeKey" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "badge_award_pkey" PRIMARY KEY ("mapId","badgeKey")
);

-- CreateTable
CREATE TABLE "goal" (
    "id" TEXT NOT NULL,
    "mapId" TEXT NOT NULL,
    "kind" "GoalKind" NOT NULL,
    "title" TEXT,
    "target" INTEGER,
    "countryCodes" TEXT[],
    "region" TEXT,
    "deadline" DATE,
    "achievedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promo_code" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "maxUses" INTEGER,
    "endsAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promo_code_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "affiliate_offer" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "partner" TEXT NOT NULL,
    "kind" "OfferKind" NOT NULL,
    "title" TEXT NOT NULL,
    "blurb" TEXT,
    "countryCode" CHAR(2),
    "placements" "OfferPlacement"[],
    "url" TEXT NOT NULL,
    "imageKey" TEXT,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "affiliate_offer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offer_click_daily" (
    "offerId" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "placement" "OfferPlacement" NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "offer_click_daily_pkey" PRIMARY KEY ("offerId","day","placement")
);

-- CreateTable
CREATE TABLE "subscription" (
    "userId" TEXT NOT NULL,
    "stripeCustomerId" TEXT NOT NULL,
    "stripeSubscriptionId" TEXT,
    "plan" "Plan" NOT NULL DEFAULT 'FREE',
    "interval" "BillingInterval",
    "status" TEXT,
    "extraMaps" INTEGER NOT NULL DEFAULT 0,
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "plan_grant" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" "Plan" NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "grantedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plan_grant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stripe_event" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stripe_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_limit" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "resetAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rate_limit_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "auth_rate_limit" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "lastRequest" BIGINT NOT NULL,

    CONSTRAINT "auth_rate_limit_pkey" PRIMARY KEY ("id")
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
CREATE INDEX "profile_promoCodeId_idx" ON "profile"("promoCodeId");

-- CreateIndex
CREATE UNIQUE INDEX "country_name_key" ON "country"("name");

-- CreateIndex
CREATE UNIQUE INDEX "country_slug_key" ON "country"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "landmark_slug_key" ON "landmark"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "landmark_wikidataId_key" ON "landmark"("wikidataId");

-- CreateIndex
CREATE INDEX "landmark_countryCode_idx" ON "landmark"("countryCode");

-- CreateIndex
CREATE INDEX "landmark_latitude_longitude_idx" ON "landmark"("latitude", "longitude");

-- CreateIndex
CREATE UNIQUE INDEX "travel_map_defaultForOwnerId_key" ON "travel_map"("defaultForOwnerId");

-- CreateIndex
CREATE UNIQUE INDEX "travel_map_shareCode_key" ON "travel_map"("shareCode");

-- CreateIndex
CREATE INDEX "travel_map_ownerId_idx" ON "travel_map"("ownerId");

-- CreateIndex
CREATE INDEX "traveller_mapId_position_idx" ON "traveller"("mapId", "position");

-- CreateIndex
CREATE INDEX "traveller_userId_idx" ON "traveller"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "traveller_mapId_userId_key" ON "traveller"("mapId", "userId");

-- CreateIndex
CREATE INDEX "map_member_userId_idx" ON "map_member"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "share_invite_tokenHash_key" ON "share_invite"("tokenHash");

-- CreateIndex
CREATE INDEX "share_invite_email_idx" ON "share_invite"("email");

-- CreateIndex
CREATE INDEX "share_invite_mapId_idx" ON "share_invite"("mapId");

-- CreateIndex
CREATE INDEX "share_invite_tripId_idx" ON "share_invite"("tripId");

-- CreateIndex
CREATE INDEX "share_invite_invitedById_idx" ON "share_invite"("invitedById");

-- CreateIndex
CREATE UNIQUE INDEX "trip_shareCode_key" ON "trip"("shareCode");

-- CreateIndex
CREATE INDEX "trip_mapId_startDate_idx" ON "trip"("mapId", "startDate");

-- CreateIndex
CREATE INDEX "trip_coverPhotoId_idx" ON "trip"("coverPhotoId");

-- CreateIndex
CREATE INDEX "trip_createdById_idx" ON "trip"("createdById");

-- CreateIndex
CREATE INDEX "trip_member_userId_idx" ON "trip_member"("userId");

-- CreateIndex
CREATE INDEX "trip_map_mapId_idx" ON "trip_map"("mapId");

-- CreateIndex
CREATE INDEX "trip_map_addedById_idx" ON "trip_map"("addedById");

-- CreateIndex
CREATE INDEX "trip_traveller_travellerId_idx" ON "trip_traveller"("travellerId");

-- CreateIndex
CREATE INDEX "trip_stop_tripId_position_idx" ON "trip_stop"("tripId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "photo_streamUid_key" ON "photo"("streamUid");

-- CreateIndex
CREATE INDEX "photo_mapId_createdAt_id_idx" ON "photo"("mapId", "createdAt" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "photo_tripId_tripPosition_id_idx" ON "photo"("tripId", "tripPosition", "id");

-- CreateIndex
CREATE INDEX "photo_mapId_countryCode_countryPosition_id_idx" ON "photo"("mapId", "countryCode", "countryPosition", "id");

-- CreateIndex
CREATE INDEX "photo_mapId_shotAt_id_idx" ON "photo"("mapId", "shotAt", "id");

-- CreateIndex
CREATE INDEX "photo_uploaderId_idx" ON "photo"("uploaderId");

-- CreateIndex
CREATE UNIQUE INDEX "photo_variant_mediaId_key" ON "photo_variant"("mediaId");

-- CreateIndex
CREATE INDEX "photo_landmark_landmarkId_idx" ON "photo_landmark"("landmarkId");

-- CreateIndex
CREATE INDEX "photo_landmark_mapId_landmarkId_idx" ON "photo_landmark"("mapId", "landmarkId");

-- CreateIndex
CREATE INDEX "moment_mapId_happenedOn_idx" ON "moment"("mapId", "happenedOn");

-- CreateIndex
CREATE INDEX "moment_mapId_countryCode_happenedOn_idx" ON "moment"("mapId", "countryCode", "happenedOn");

-- CreateIndex
CREATE INDEX "moment_tripId_idx" ON "moment"("tripId");

-- CreateIndex
CREATE INDEX "moment_landmarkId_idx" ON "moment"("landmarkId");

-- CreateIndex
CREATE INDEX "moment_createdById_idx" ON "moment"("createdById");

-- CreateIndex
CREATE INDEX "moment_traveller_travellerId_idx" ON "moment_traveller"("travellerId");

-- CreateIndex
CREATE INDEX "moment_photo_photoId_idx" ON "moment_photo"("photoId");

-- CreateIndex
CREATE UNIQUE INDEX "media_item_key_key" ON "media_item"("key");

-- CreateIndex
CREATE INDEX "media_item_resource_idx" ON "media_item"("resource");

-- CreateIndex
CREATE INDEX "media_item_ownerId_createdAt_idx" ON "media_item"("ownerId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "avatar_media_item_mediaId_key" ON "avatar_media_item"("mediaId");

-- CreateIndex
CREATE INDEX "contact_form_createdAt_idx" ON "contact_form"("createdAt");

-- CreateIndex
CREATE INDEX "contact_form_imageKey_idx" ON "contact_form"("imageKey");

-- CreateIndex
CREATE INDEX "landmark_cover_photoId_landmarkId_idx" ON "landmark_cover"("photoId", "landmarkId");

-- CreateIndex
CREATE INDEX "landmark_cover_landmarkId_idx" ON "landmark_cover"("landmarkId");

-- CreateIndex
CREATE UNIQUE INDEX "photo_theme_month_key" ON "photo_theme"("month");

-- CreateIndex
CREATE INDEX "photo_theme_entry_mapId_themeId_enteredAt_photoId_idx" ON "photo_theme_entry"("mapId", "themeId", "enteredAt" DESC, "photoId" DESC);

-- CreateIndex
CREATE INDEX "photo_theme_entry_photoId_idx" ON "photo_theme_entry"("photoId");

-- CreateIndex
CREATE INDEX "photo_theme_entry_enteredById_idx" ON "photo_theme_entry"("enteredById");

-- CreateIndex
CREATE UNIQUE INDEX "friend_challenge_joinCode_key" ON "friend_challenge"("joinCode");

-- CreateIndex
CREATE INDEX "friend_challenge_createdById_idx" ON "friend_challenge"("createdById");

-- CreateIndex
CREATE INDEX "friend_challenge_entry_userId_idx" ON "friend_challenge_entry"("userId");

-- CreateIndex
CREATE INDEX "friend_challenge_entry_mapId_idx" ON "friend_challenge_entry"("mapId");

-- CreateIndex
CREATE INDEX "goal_mapId_createdAt_idx" ON "goal"("mapId", "createdAt");

-- CreateIndex
CREATE INDEX "goal_createdById_idx" ON "goal"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "promo_code_code_key" ON "promo_code"("code");

-- CreateIndex
CREATE INDEX "promo_code_createdById_idx" ON "promo_code"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "affiliate_offer_key_key" ON "affiliate_offer"("key");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_stripeCustomerId_key" ON "subscription"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_stripeSubscriptionId_key" ON "subscription"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "plan_grant_userId_endsAt_idx" ON "plan_grant"("userId", "endsAt");

-- CreateIndex
CREATE INDEX "plan_grant_grantedById_idx" ON "plan_grant"("grantedById");

-- CreateIndex
CREATE INDEX "stripe_event_processedAt_idx" ON "stripe_event"("processedAt");

-- CreateIndex
CREATE INDEX "rate_limit_resetAt_idx" ON "rate_limit"("resetAt");

-- CreateIndex
CREATE UNIQUE INDEX "auth_rate_limit_key_key" ON "auth_rate_limit"("key");

-- CreateIndex
CREATE INDEX "auth_rate_limit_lastRequest_idx" ON "auth_rate_limit"("lastRequest");

-- CreateIndex
CREATE INDEX "app_event_createdAt_idx" ON "app_event"("createdAt");

-- CreateIndex
CREATE INDEX "app_event_level_createdAt_idx" ON "app_event"("level", "createdAt");

-- CreateIndex
CREATE INDEX "app_event_actorId_idx" ON "app_event"("actorId");

-- CreateIndex
CREATE INDEX "app_event_targetId_idx" ON "app_event"("targetId");

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
ALTER TABLE "profile" ADD CONSTRAINT "profile_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES "promo_code"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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
ALTER TABLE "trip_map" ADD CONSTRAINT "trip_map_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_map" ADD CONSTRAINT "trip_map_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "travel_map"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_map" ADD CONSTRAINT "trip_map_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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
ALTER TABLE "photo_landmark" ADD CONSTRAINT "photo_landmark_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "travel_map"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moment" ADD CONSTRAINT "moment_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "travel_map"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moment" ADD CONSTRAINT "moment_countryCode_fkey" FOREIGN KEY ("countryCode") REFERENCES "country"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moment" ADD CONSTRAINT "moment_landmarkId_fkey" FOREIGN KEY ("landmarkId") REFERENCES "landmark"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moment" ADD CONSTRAINT "moment_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trip"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moment" ADD CONSTRAINT "moment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moment_traveller" ADD CONSTRAINT "moment_traveller_momentId_fkey" FOREIGN KEY ("momentId") REFERENCES "moment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moment_traveller" ADD CONSTRAINT "moment_traveller_travellerId_fkey" FOREIGN KEY ("travellerId") REFERENCES "traveller"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moment_photo" ADD CONSTRAINT "moment_photo_momentId_fkey" FOREIGN KEY ("momentId") REFERENCES "moment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moment_photo" ADD CONSTRAINT "moment_photo_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "photo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_item" ADD CONSTRAINT "media_item_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avatar_media_item" ADD CONSTRAINT "avatar_media_item_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avatar_media_item" ADD CONSTRAINT "avatar_media_item_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "media_item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "landmark_cover" ADD CONSTRAINT "landmark_cover_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "travel_map"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "landmark_cover" ADD CONSTRAINT "landmark_cover_landmarkId_fkey" FOREIGN KEY ("landmarkId") REFERENCES "landmark"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "landmark_cover" ADD CONSTRAINT "landmark_cover_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "photo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "landmark_cover" ADD CONSTRAINT "landmark_cover_photoId_landmarkId_fkey" FOREIGN KEY ("photoId", "landmarkId") REFERENCES "photo_landmark"("photoId", "landmarkId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photo_theme_entry" ADD CONSTRAINT "photo_theme_entry_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "photo_theme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photo_theme_entry" ADD CONSTRAINT "photo_theme_entry_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "photo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photo_theme_entry" ADD CONSTRAINT "photo_theme_entry_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "travel_map"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photo_theme_entry" ADD CONSTRAINT "photo_theme_entry_enteredById_fkey" FOREIGN KEY ("enteredById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friend_challenge" ADD CONSTRAINT "friend_challenge_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friend_challenge_entry" ADD CONSTRAINT "friend_challenge_entry_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "friend_challenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friend_challenge_entry" ADD CONSTRAINT "friend_challenge_entry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friend_challenge_entry" ADD CONSTRAINT "friend_challenge_entry_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "travel_map"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "badge_award" ADD CONSTRAINT "badge_award_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "travel_map"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal" ADD CONSTRAINT "goal_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "travel_map"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal" ADD CONSTRAINT "goal_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promo_code" ADD CONSTRAINT "promo_code_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affiliate_offer" ADD CONSTRAINT "affiliate_offer_countryCode_fkey" FOREIGN KEY ("countryCode") REFERENCES "country"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_click_daily" ADD CONSTRAINT "offer_click_daily_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "affiliate_offer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_grant" ADD CONSTRAINT "plan_grant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_grant" ADD CONSTRAINT "plan_grant_grantedById_fkey" FOREIGN KEY ("grantedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_event" ADD CONSTRAINT "app_event_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_event" ADD CONSTRAINT "app_event_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CHECK constraints (29)

-- Sharing
ALTER TABLE "share_invite" ADD CONSTRAINT "share_invite_one_target" CHECK (("mapId" IS NULL) <> ("tripId" IS NULL));

-- One default map per owner
ALTER TABLE "travel_map" ADD CONSTRAINT "travel_map_default_owner"
  CHECK (
    ("isDefault" AND "defaultForOwnerId" IS NOT NULL AND "defaultForOwnerId" = "ownerId")
    OR (NOT "isDefault" AND "defaultForOwnerId" IS NULL)
  );

-- Trips, photos, landmark matches and roles
ALTER TABLE "trip" ADD CONSTRAINT "trip_dates_in_order"
  CHECK ("startDate" IS NULL OR "endDate" IS NULL OR "endDate" >= "startDate");
ALTER TABLE "trip_stop" ADD CONSTRAINT "trip_stop_dates_in_order"
  CHECK ("arriveOn" IS NULL OR "leaveOn" IS NULL OR "leaveOn" >= "arriveOn");
ALTER TABLE "photo" ADD CONSTRAINT "photo_position_valid"
  CHECK (
    ("latitude" IS NULL AND "longitude" IS NULL)
    OR ("latitude" IS NOT NULL AND "longitude" IS NOT NULL
        AND "latitude" BETWEEN -90 AND 90 AND "longitude" BETWEEN -180 AND 180)
  );
ALTER TABLE "photo_landmark" ADD CONSTRAINT "photo_landmark_manual_confirmed"
  CHECK ("source" <> 'MANUAL' OR "confirmed");
ALTER TABLE "user" ADD CONSTRAINT "user_role_known"
  CHECK ("role" IN ('USER', 'ADMIN', 'DEVELOPER'));

-- Plans and billing
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_extra_maps_not_negative"
  CHECK ("extraMaps" >= 0);

-- Moments
ALTER TABLE "moment" ADD CONSTRAINT "moment_date_and_precision"
  CHECK (("happenedOn" IS NULL) = ("datePrecision" IS NULL));

-- Passport, goals and promo codes
ALTER TABLE "photo_landmark" ADD CONSTRAINT "photo_landmark_confirmed_at"
  CHECK ("confirmed" = ("confirmedAt" IS NOT NULL));
ALTER TABLE "goal" ADD CONSTRAINT "goal_shape" CHECK (
  ("kind" IN ('COUNTRY_COUNT', 'LANDMARK_COUNT') AND "target" > 0 AND "region" IS NULL
     AND cardinality("countryCodes") = 0)
  OR ("kind" = 'COUNTRY_LIST' AND "target" IS NULL AND "region" IS NULL
     AND cardinality("countryCodes") > 0)
  OR ("kind" = 'REGION' AND "target" IS NULL AND "region" IS NOT NULL
     AND cardinality("countryCodes") = 0)
);
ALTER TABLE "promo_code" ADD CONSTRAINT "promo_code_format" CHECK ("code" ~ '^[A-Z0-9]{3,24}$');
ALTER TABLE "promo_code" ADD CONSTRAINT "promo_code_max_uses_positive" CHECK ("maxUses" IS NULL OR "maxUses" > 0);

-- Travel offers
ALTER TABLE "affiliate_offer" ADD CONSTRAINT "affiliate_offer_weight_range" CHECK ("weight" BETWEEN 1 AND 100);
ALTER TABLE "affiliate_offer" ADD CONSTRAINT "affiliate_offer_has_placement" CHECK (cardinality("placements") > 0);
ALTER TABLE "affiliate_offer" ADD CONSTRAINT "affiliate_offer_dates_in_order"
  CHECK ("startsAt" IS NULL OR "endsAt" IS NULL OR "endsAt" >= "startsAt");
ALTER TABLE "offer_click_daily" ADD CONSTRAINT "offer_click_daily_count_not_negative" CHECK ("count" >= 0);

-- Videos
ALTER TABLE "photo" ADD CONSTRAINT "photo_video_duration"
  CHECK (("kind" = 'VIDEO') = ("durationS" IS NOT NULL) AND ("durationS" IS NULL OR "durationS" BETWEEN 1 AND 600));
ALTER TABLE "photo" ADD CONSTRAINT "photo_video_no_location"
  CHECK ("kind" <> 'VIDEO' OR ("latitude" IS NULL AND "longitude" IS NULL));

-- Videos on Cloudflare Stream
ALTER TABLE "photo" ADD CONSTRAINT "photo_video_stream" CHECK (
  ("kind" = 'VIDEO') = ("streamUid" IS NOT NULL)
  AND ("streamUid" IS NULL) = ("videoState" IS NULL)
  AND ("streamUid" IS NULL) = ("videoBytes" IS NULL)
);

-- Monthly photo themes
ALTER TABLE "photo_theme" ADD CONSTRAINT "photo_theme_first_of_month" CHECK (EXTRACT(DAY FROM "month") = 1);
ALTER TABLE "photo_theme" ADD CONSTRAINT "photo_theme_title_length" CHECK (char_length("title") BETWEEN 1 AND 60);

-- Friends challenges
ALTER TABLE "friend_challenge" ADD CONSTRAINT "friend_challenge_dates_in_order" CHECK ("endsOn" - "startsOn" BETWEEN 0 AND 730);
ALTER TABLE "friend_challenge" ADD CONSTRAINT "friend_challenge_target_range" CHECK ("target" IS NULL OR "target" BETWEEN 1 AND 500);
ALTER TABLE "friend_challenge" ADD CONSTRAINT "friend_challenge_title_length" CHECK (char_length("title") BETWEEN 1 AND 80);

-- The UK's nations
ALTER TABLE "trip_stop" ADD CONSTRAINT "trip_stop_uk_nation" CHECK ("ukNation" IS NULL OR "ukNation" IN ('XE', 'XC', 'XW', 'XI'));
ALTER TABLE "photo" ADD CONSTRAINT "photo_uk_nation" CHECK ("ukNation" IS NULL OR "ukNation" IN ('XE', 'XC', 'XW', 'XI'));
ALTER TABLE "moment" ADD CONSTRAINT "moment_uk_nation" CHECK ("ukNation" IS NULL OR "ukNation" IN ('XE', 'XC', 'XW', 'XI'));

-- Moments' spots
ALTER TABLE "moment" ADD CONSTRAINT "moment_spot" CHECK (
  ("latitude" IS NULL) = ("longitude" IS NULL)
  AND ("latitude" IS NULL OR ("latitude" BETWEEN -90 AND 90 AND "longitude" BETWEEN -180 AND 180))
  AND ("latitude" IS NOT NULL OR NOT "spotShared")
);

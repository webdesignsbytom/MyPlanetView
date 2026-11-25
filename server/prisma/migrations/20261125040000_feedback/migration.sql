-- Feedback sent from the map (docs/API.md "Feedback"; 25 Nov 2026): reports, their screenshots
-- (a MediaItem in the private bucket) and the admin's status and notes

-- CreateEnum
CREATE TYPE "FeedbackKind" AS ENUM ('PROBLEM', 'IDEA', 'QUESTION', 'OTHER');

-- CreateEnum
CREATE TYPE "FeedbackImpact" AS ENUM ('BLOCKING', 'ANNOYING', 'MINOR');

-- CreateEnum
CREATE TYPE "FeedbackStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'DONE', 'WONT_DO');

-- CreateTable
CREATE TABLE "feedback_report" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "FeedbackKind" NOT NULL,
    "details" TEXT NOT NULL,
    "expected" TEXT,
    "why" TEXT,
    "impact" "FeedbackImpact",
    "page" TEXT,
    "mapId" TEXT,
    "userAgent" TEXT,
    "context" JSONB,
    "screenshotId" TEXT,
    "status" "FeedbackStatus" NOT NULL DEFAULT 'NEW',
    "adminNotes" TEXT,
    "closedAt" TIMESTAMP(3),
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feedback_report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "feedback_report_screenshotId_key" ON "feedback_report"("screenshotId");

-- CreateIndex
CREATE INDEX "feedback_report_status_createdAt_idx" ON "feedback_report"("status", "createdAt");

-- CreateIndex
CREATE INDEX "feedback_report_userId_idx" ON "feedback_report"("userId");

-- CreateIndex
CREATE INDEX "feedback_report_updatedById_idx" ON "feedback_report"("updatedById");

-- AddForeignKey
ALTER TABLE "feedback_report" ADD CONSTRAINT "feedback_report_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback_report" ADD CONSTRAINT "feedback_report_screenshotId_fkey" FOREIGN KEY ("screenshotId") REFERENCES "media_item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback_report" ADD CONSTRAINT "feedback_report_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- A report is closed (done or won't do) exactly while it has its closing date
ALTER TABLE "feedback_report" ADD CONSTRAINT "feedback_report_closed" CHECK (("status" IN ('DONE', 'WONT_DO')) = ("closedAt" IS NOT NULL));

// Feedback reports (docs/API.md "Feedback"): thin queries; the rules are utils/feedback.js.
import { prisma } from '../prisma.js';

const REPORT_SELECT = {
  id: true,
  userId: true,
  kind: true,
  details: true,
  expected: true,
  why: true,
  impact: true,
  page: true,
  mapId: true,
  userAgent: true,
  context: true,
  screenshotId: true,
  status: true,
  adminNotes: true,
  closedAt: true,
  createdAt: true,
  updatedAt: true,
  user: { select: { id: true, name: true, email: true } },
  updatedBy: { select: { id: true, name: true } },
  screenshot: { select: { key: true } },
};

/** A screenshot upload by its key: who made it, when, and for what. */
export const findScreenshotUpload = (key) =>
  prisma.mediaItem.findUnique({
    where: { key },
    select: { id: true, key: true, resource: true, ownerId: true, createdAt: true, usedAsFeedbackScreenshot: { select: { id: true } } },
  });

/**
 * A new report; a screenshot (`screenshot`: `{ mediaId, bytes, contentType }`) marked done on its
 * MediaItem in the same transaction. -> the report
 */
export const createFeedbackInDB = ({ userId, report, screenshot = null }) =>
  prisma.$transaction(async (tx) => {
    if (screenshot) {
      await tx.mediaItem.update({ where: { id: screenshot.mediaId }, data: { bytes: screenshot.bytes, contentType: screenshot.contentType } });
    }
    return tx.feedbackReport.create({
      data: {
        userId,
        kind: report.kind,
        details: report.details,
        expected: report.expected,
        why: report.why,
        impact: report.impact,
        page: report.page,
        mapId: report.mapId,
        userAgent: report.userAgent,
        context: report.context ?? undefined,
        screenshotId: screenshot ? screenshot.mediaId : null,
      },
      select: { id: true, createdAt: true },
    });
  });

/** The admin's list: newest first, after `after` (`{ createdAt, id }`), one more than `take`. */
export const listFeedbackInDB = ({ status, kind, after = null, take }) =>
  prisma.feedbackReport.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(kind ? { kind } : {}),
      ...(after ? { OR: [{ createdAt: { lt: after.createdAt } }, { createdAt: after.createdAt, id: { lt: after.id } }] } : {}),
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: take + 1,
    select: REPORT_SELECT,
  });

/** How many reports have each status: `{ NEW: 3, IN_PROGRESS: 1, … }` (only the ones there are). */
export async function countFeedbackByStatus() {
  const rows = await prisma.feedbackReport.groupBy({ by: ['status'], _count: { _all: true } });
  return Object.fromEntries(rows.map((row) => [row.status, row._count._all]));
}

export const findFeedbackById = (id) => prisma.feedbackReport.findUnique({ where: { id }, select: REPORT_SELECT });

export const updateFeedbackInDB = (id, data) => prisma.feedbackReport.update({ where: { id }, data, select: REPORT_SELECT });

/** Delete a report. -> its screenshot's key (the file to delete after), or null */
export async function deleteFeedbackInDB(id) {
  const deleted = await prisma.feedbackReport.delete({ where: { id }, select: { screenshot: { select: { key: true } } } });
  return deleted.screenshot?.key ?? null;
}

/** The reports a person sent, oldest first, for their "Your data" file. */
export const findFeedbackSentBy = (userId) =>
  prisma.feedbackReport.findMany({
    where: { userId },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    select: {
      id: true,
      kind: true,
      details: true,
      expected: true,
      why: true,
      impact: true,
      page: true,
      status: true,
      screenshotId: true,
      createdAt: true,
    },
  });

import { prisma } from '../prisma.js';

// Travel offers and their click tallies (docs/API.md, "Travel offers")

/** What anyone may see of an offer: never its link (clicks go through /go). */
const PUBLIC_SELECT = {
  id: true,
  partner: true,
  kind: true,
  title: true,
  blurb: true,
  countryCode: true,
  placements: true,
  imageKey: true,
  weight: true,
};

const ADMIN_SELECT = {
  ...PUBLIC_SELECT,
  key: true,
  url: true,
  active: true,
  startsAt: true,
  endsAt: true,
  createdAt: true,
  updatedAt: true,
};

/** The offers showing now, by country then key (a small table, read whole). */
export const findLiveOffers = (now = new Date()) =>
  prisma.affiliateOffer.findMany({
    where: {
      active: true,
      OR: [{ startsAt: null }, { startsAt: { lte: now } }],
      AND: [{ OR: [{ endsAt: null }, { endsAt: { gt: now } }] }],
    },
    select: PUBLIC_SELECT,
    orderBy: [{ countryCode: 'asc' }, { key: 'asc' }],
  });

export const findOfferForClick = (id) =>
  prisma.affiliateOffer.findUnique({
    where: { id },
    select: { id: true, url: true, active: true, startsAt: true, endsAt: true, placements: true },
  });

/** One more click today (UTC) for an offer from a placement: one atomic statement. */
export const countOfferClick = (offerId, placement, now = new Date()) => {
  const day = now.toISOString().slice(0, 10);
  return prisma.$executeRaw`
    INSERT INTO "offer_click_daily" ("offerId", "day", "placement", "count")
    VALUES (${offerId}, ${day}::date, ${placement}::"OfferPlacement", 1)
    ON CONFLICT ("offerId", "day", "placement") DO UPDATE SET "count" = "offer_click_daily"."count" + 1`;
};

/**
 * Every offer for the admin page, with its clicks since `since`: in all, per placement,
 * and per day (oldest first).
 */
export const findOffersWithClicks = async (since) => {
  const [offers, tallies] = await Promise.all([
    prisma.affiliateOffer.findMany({ select: ADMIN_SELECT, orderBy: [{ countryCode: 'asc' }, { key: 'asc' }] }),
    prisma.offerClickDaily.findMany({
      where: { day: { gte: since } },
      select: { offerId: true, day: true, placement: true, count: true },
      orderBy: { day: 'asc' },
    }),
  ]);
  const byOffer = new Map();
  for (const t of tallies) {
    if (!byOffer.has(t.offerId)) byOffer.set(t.offerId, []);
    byOffer.get(t.offerId).push(t);
  }
  return offers.map((offer) => {
    const rows = byOffer.get(offer.id) ?? [];
    const byPlacement = {};
    const byDay = {};
    for (const r of rows) {
      byPlacement[r.placement] = (byPlacement[r.placement] ?? 0) + r.count;
      const day = r.day.toISOString().slice(0, 10);
      byDay[day] = (byDay[day] ?? 0) + r.count;
    }
    return {
      ...offer,
      clicks: {
        total: rows.reduce((sum, r) => sum + r.count, 0),
        byPlacement,
        byDay: Object.entries(byDay).map(([day, count]) => ({ day, count })),
      },
    };
  });
};

export const findOfferById = (id) => prisma.affiliateOffer.findUnique({ where: { id }, select: ADMIN_SELECT });

export const findOfferKeys = async (keys) =>
  new Set((await prisma.affiliateOffer.findMany({ where: { key: { in: keys } }, select: { key: true } })).map((o) => o.key));

export const createOfferInDB = (data) => prisma.affiliateOffer.create({ data, select: ADMIN_SELECT });

export const updateOfferInDB = (id, data) => prisma.affiliateOffer.update({ where: { id }, data, select: ADMIN_SELECT });

export const deleteOfferInDB = (id) => prisma.affiliateOffer.delete({ where: { id } });

/** Create or update offers by key, all or none (one transaction). */
export const upsertOffersInDB = (rows) =>
  prisma.$transaction(
    rows.map(({ key, ...fields }) =>
      prisma.affiliateOffer.upsert({ where: { key }, create: { key, ...fields }, update: fields, select: { id: true } })
    )
  );

// Mock mode only. Travel offers as the server has them (docs/API.md, "Travel offers";
// server/src/utils/offers.js, services/offers.js and controllers/offers.js): the public
// list, how often a gallery shows a card to the caller (adEveryFor), and a card's click:
// one more in the day's tally, then the partner's link with its placeholders filled
// (clickContext, fillOfferUrl). The admin's side is handlers/offerAdmin.js.
import { planOf } from '@/utils/constants/plans';
import { OFFER_PLACEMENTS, cleanOfferText, fillOfferUrl, offerIsLive } from '@/utils/offers/offerRules';
import { getDb, me, session } from './store';
import { effectivePlan, mapPlanId } from './plans';

// The server's EVENT_MESSAGES
export const OFFER_MESSAGES = {
  notFound: `That offer doesn't exist.`,
  ended: `That offer has ended.`,
};
const DESTINATION_MAX = 80;

/**
 * How often an offer card comes in a photo gallery (one every N tiles), or null for none
 * (FEATURE-PLAN.md, "Ads by tier"): a viewer on a paid plan never sees one; anyone else
 * sees the map owner's plan's rate (Economy 12, Business 24, First Class none).
 */
export function adEveryFor({ ownerPlan, viewerPlan }) {
  if (planOf(viewerPlan).rank > 0) return null;
  return planOf(ownerPlan).adEvery ?? null;
}

/** `ads` on GET /maps/:mapId, /trips/:tripId and /shared/:code: the map owner's plan and the caller's (signed out counts as Economy). */
export function adsFor(map) {
  const viewerPlan = session.signedIn ? effectivePlan(me().id).plan : 'FREE';
  return { every: adEveryFor({ ownerPlan: map ? mapPlanId(map) : 'FREE', viewerPlan }) };
}

// What anyone may see of an offer (the server's PUBLIC_SELECT): never its link or key
const PUBLIC_FIELDS = ['id', 'partner', 'kind', 'title', 'blurb', 'countryCode', 'placements', 'imageKey', 'weight'];

// By country, the offers with none last (as Postgres sorts nulls), then key
const byCountryThenKey = (a, b) =>
  (a.countryCode === b.countryCode ? 0 : a.countryCode === null ? 1 : b.countryCode === null ? -1 : a.countryCode < b.countryCode ? -1 : 1) ||
  (a.key < b.key ? -1 : a.key > b.key ? 1 : 0);

/** GET /offers: every offer live now, public fields only. */
export const liveOffersView = (now = new Date()) =>
  (getDb().offers || [])
    .filter((offer) => offerIsLive(offer, now))
    .sort(byCountryThenKey)
    .map((offer) => Object.fromEntries(PUBLIC_FIELDS.map((field) => [field, offer[field] ?? null])));

// As the server's parseDateOnly: a real "YYYY-MM-DD" date, else not ok
const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;
function parseDateOnly(input) {
  if (input === undefined) return { ok: true, value: undefined };
  if (input === null || input === '') return { ok: true, value: null };
  const match = typeof input === 'string' ? DATE_ONLY.exec(input) : null;
  if (!match) return { ok: false };
  const [, y, m, d] = match.map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return { ok: false };
  return { ok: true, value: date };
}

const isCountryCode = (value) => typeof value === 'string' && /^[A-Z]{2}$/.test(value);

/**
 * What a click may fill in (GET /go/:offerId's query): `dest` (a place name, cleaned, at
 * most 80 characters), `country` (a code), `from` and `to` ("YYYY-MM-DD"). Anything that
 * doesn't fit is left out, never refused.
 */
export function clickContext(query = {}) {
  const context = {};
  const dest = typeof query.dest === 'string' ? cleanOfferText(query.dest, DESTINATION_MAX) : '';
  if (dest) context.destination = dest;
  if (isCountryCode(query.country)) context.country = query.country;
  const from = parseDateOnly(query.from);
  const to = parseDateOnly(query.to);
  if (from.ok && from.value) context.checkin = query.from;
  if (to.ok && to.value && (!context.checkin || query.to >= query.from)) context.checkout = query.to;
  return context;
}

/**
 * GET /go/:offerId: an unknown offer, or one that's off or outside its dates, is a 404;
 * otherwise one more in today's (UTC) tally for placement `p` (one of the placements;
 * anything else isn't counted), and the partner's link. (The server also counts at most 60
 * clicks per 15 minutes per IP; the mock has one visitor and counts them all.)
 * -> `{ status: 302, location }` or `{ status: 404, message }`
 */
export function offerClick(offerId, query = {}, now = new Date()) {
  const db = getDb();
  const offer = (db.offers || []).find((o) => o.id === offerId);
  if (!offer) return { status: 404, message: OFFER_MESSAGES.notFound };
  if (!offerIsLive(offer, now)) return { status: 404, message: OFFER_MESSAGES.ended };
  if (OFFER_PLACEMENTS.includes(query.p)) {
    const day = now.toISOString().slice(0, 10);
    db.offerClicks ||= [];
    const row = db.offerClicks.find((r) => r.offerId === offer.id && r.day === day && r.placement === query.p);
    if (row) row.count += 1;
    else db.offerClicks.push({ offerId: offer.id, day, placement: query.p, count: 1 });
  }
  return { status: 302, location: fillOfferUrl(offer.url, clickContext(query)) };
}

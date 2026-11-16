// Mock mode only: the admin's travel offers (docs/API.md, "Travel offers"): the list with
// the last 30 days' clicks, a new offer, changes, deleting one with its tallies, and the
// all-or-nothing import. ADMIN or DEVELOPER (switch roles from the mock badge, or open a
// page with ?mockRole=ADMIN). The rules are the server's (utils/offers/offerRules.js); the
// public list and the clicks are in handlers/offers.js.
import { fail, ok, raw, route } from '../mockAdapter';
import { getDb, me, newId, session } from '../store';
import { COUNTRY_BY_CODE } from '@/utils/map/countries';
import { OFFER_IMPORT_DEFAULTS, OFFER_LIMITS, offersIn, parseOfferInput } from '@/utils/offers/offerRules';

// The server's words (utils/responses/responses.js)
const MESSAGES = {
  notFound: `That offer doesn't exist.`,
  keyTaken: `An offer with that key already exists.`,
  invalid: `Check the offer's details: a key, partner, kind, title, at least one placement and an https link.`,
  importInvalid: `Nothing was imported: fix the offers listed and try again.`,
};
const CLICK_STATS_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

const isAdmin = () => session.signedIn && ['ADMIN', 'DEVELOPER'].includes(me().role);
const forbidden = () => (session.signedIn ? fail(403, 'Admins only.') : fail(401, 'No valid session. Please sign in.'));
// The countries on the map (the server's Country table)
const isKnownCountry = (code) => Boolean(COUNTRY_BY_CODE[code]);

// What the admin routes answer of an offer (the server's ADMIN_SELECT)
const FIELDS = ['id', 'key', 'partner', 'kind', 'title', 'blurb', 'countryCode', 'placements', 'url', 'imageKey', 'weight', 'active', 'startsAt', 'endsAt', 'createdAt', 'updatedAt'];
const offerView = (offer) => Object.fromEntries(FIELDS.map((field) => [field, offer[field] ?? null]));

// Dates are kept as ISO strings, as JSON carries the server's
const stored = (data) =>
  Object.fromEntries(Object.entries(data).map(([field, value]) => [field, value instanceof Date ? value.toISOString() : value]));

// By country (offers with none last, as Postgres sorts nulls), then key
const byCountryThenKey = (a, b) =>
  (a.countryCode === b.countryCode ? 0 : a.countryCode === null ? 1 : b.countryCode === null ? -1 : a.countryCode < b.countryCode ? -1 : 1) ||
  (a.key < b.key ? -1 : a.key > b.key ? 1 : 0);

// The first day counted: 29 days before today (UTC), so 30 days with today
function clicksSince(now = Date.now()) {
  const since = new Date(now - (CLICK_STATS_DAYS - 1) * DAY_MS);
  since.setUTCHours(0, 0, 0, 0);
  return since.toISOString().slice(0, 10);
}

// Clicks since a day: in all, per placement, and per day with any (oldest first)
function clicksFor(offerId, since) {
  const rows = (getDb().offerClicks || []).filter((r) => r.offerId === offerId && r.day >= since);
  const byPlacement = {};
  const byDay = {};
  for (const r of rows) {
    byPlacement[r.placement] = (byPlacement[r.placement] ?? 0) + r.count;
    byDay[r.day] = (byDay[r.day] ?? 0) + r.count;
  }
  return {
    total: rows.reduce((sum, r) => sum + r.count, 0),
    byPlacement,
    byDay: Object.keys(byDay)
      .sort()
      .map((day) => ({ day, count: byDay[day] })),
  };
}

// As the server's importOffers: every offer checked first; if any is wrong nothing is
// written, and each is listed (index from 0, the first wrong field)
function importOffers(payload) {
  const list = offersIn(payload);
  if (!list || !list.length || list.length > OFFER_LIMITS.perImport) {
    return { ok: false, problems: [{ index: null, key: null, field: 'offers' }] };
  }
  const problems = [];
  const rows = [];
  const seen = new Set();
  list.forEach((offer, index) => {
    const parsed = parseOfferInput(offer, { isKnownCountry });
    const key = typeof offer?.key === 'string' ? offer.key : null;
    if (!parsed.ok) return problems.push({ index, key, field: parsed.field });
    if (seen.has(parsed.data.key)) return problems.push({ index, key, field: 'key' });
    seen.add(parsed.data.key);
    return rows.push({ ...OFFER_IMPORT_DEFAULTS, ...stored(parsed.data) });
  });
  if (problems.length) return { ok: false, problems };

  const db = getDb();
  const now = new Date().toISOString();
  let created = 0;
  for (const row of rows) {
    const offer = db.offers.find((o) => o.key === row.key);
    if (offer) {
      Object.assign(offer, row, { updatedAt: now });
    } else {
      db.offers.push({ id: newId(), ...row, createdAt: now, updatedAt: now });
      created += 1;
    }
  }
  return { ok: true, created, updated: rows.length - created, keys: rows.map((r) => r.key) };
}

export function registerOfferAdminRoutes() {
  route('GET', '/api/users/admin/offers', () => {
    if (!isAdmin()) return forbidden();
    const since = clicksSince();
    const offers = [...(getDb().offers || [])].sort(byCountryThenKey).map((offer) => ({ ...offerView(offer), clicks: clicksFor(offer.id, since) }));
    return ok({ offers, clicksSince: since });
  });

  route('POST', '/api/users/admin/offers', ({ body }) => {
    if (!isAdmin()) return forbidden();
    const parsed = parseOfferInput(body, { isKnownCountry });
    if (!parsed.ok) return fail(400, `${MESSAGES.invalid} (${parsed.field})`);
    const db = getDb();
    db.offers = db.offers || [];
    if (db.offers.some((o) => o.key === parsed.data.key)) return fail(409, MESSAGES.keyTaken);
    const now = new Date().toISOString();
    // The database's defaults for what wasn't sent
    const offer = { id: newId(), ...OFFER_IMPORT_DEFAULTS, ...stored(parsed.data), createdAt: now, updatedAt: now };
    db.offers.push(offer);
    return ok({ offer: offerView(offer) }, 201);
  });

  // Any field but the key (sending another key is a 400); `active: false` keeps the tallies
  route('PATCH', '/api/users/admin/offers/:offerId', ({ params, body }) => {
    if (!isAdmin()) return forbidden();
    const offer = (getDb().offers || []).find((o) => o.id === params.offerId);
    if (!offer) return fail(404, MESSAGES.notFound);
    const parsed = parseOfferInput(body, { existing: offer, isKnownCountry });
    if (!parsed.ok) return fail(400, `${MESSAGES.invalid} (${parsed.field})`);
    if (Object.keys(parsed.data).length) Object.assign(offer, stored(parsed.data), { updatedAt: new Date().toISOString() });
    return ok({ offer: offerView(offer) });
  });

  // Deleting an offer deletes its click tallies too
  route('DELETE', '/api/users/admin/offers/:offerId', ({ params }) => {
    if (!isAdmin()) return forbidden();
    const db = getDb();
    const offer = (db.offers || []).find((o) => o.id === params.offerId);
    if (!offer) return fail(404, MESSAGES.notFound);
    db.offers = db.offers.filter((o) => o.id !== offer.id);
    db.offerClicks = (db.offerClicks || []).filter((r) => r.offerId !== offer.id);
    return ok({ message: 'Offer deleted.' });
  });

  route('POST', '/api/users/admin/offers/import', ({ body }) => {
    if (!isAdmin()) return forbidden();
    const result = importOffers(body);
    if (!result.ok) return raw({ status: 'fail', message: MESSAGES.importInvalid, data: { problems: result.problems } }, 400);
    return ok({ created: result.created, updated: result.updated, keys: result.keys });
  });
}

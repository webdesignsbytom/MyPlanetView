// Importing travel offers (docs/API.md, "Travel offers"): the same path for the example
// offers the seed loads, `npm run db:offers -- <file>`, and the admin's import. Every offer
// is checked first; if any is wrong nothing is written, and each problem is listed.
import { OFFER_LIMITS, adEveryFor, parseOfferInput } from '../utils/offers.js';
import { loadMapPlan, loadUserPlan } from './travel/plans.js';
import { findOfferKeys, upsertOffersInDB } from '../domain/offers.js';
import { continentsByCode } from '../controllers/helpers/countries.js';

// Every field an offer has: one left out of an imported offer goes back to its default,
// so the file is the whole truth about each offer it names
const IMPORT_DEFAULTS = Object.freeze({
  blurb: null,
  countryCode: null,
  imageKey: null,
  weight: 1,
  active: true,
  startsAt: null,
  endsAt: null,
});

/** The offers in an import (`{ offers: [...] }` or a bare list), or null. */
export const offersIn = (payload) =>
  Array.isArray(payload) ? payload : Array.isArray(payload?.offers) ? payload.offers : null;

/**
 * -> `{ ok: true, created, updated, keys }`, or `{ ok: false, problems: [{ index, key, field }] }`
 * (`index` counts from 0; `field` is the first wrong field of that offer).
 */
export async function importOffers(payload) {
  const list = offersIn(payload);
  if (!list || !list.length || list.length > OFFER_LIMITS.perImport) {
    return { ok: false, problems: [{ index: null, key: null, field: 'offers' }] };
  }
  const known = await continentsByCode();
  const isKnownCountry = (code) => known.has(code);

  const problems = [];
  const rows = [];
  const seen = new Set();
  list.forEach((offer, index) => {
    const parsed = parseOfferInput(offer, { isKnownCountry });
    const key = typeof offer?.key === 'string' ? offer.key : null;
    if (!parsed.ok) return problems.push({ index, key, field: parsed.field });
    if (seen.has(parsed.data.key)) return problems.push({ index, key, field: 'key' });
    seen.add(parsed.data.key);
    return rows.push({ ...IMPORT_DEFAULTS, ...parsed.data });
  });
  if (problems.length) return { ok: false, problems };

  const existing = await findOfferKeys(rows.map((r) => r.key));
  await upsertOffersInDB(rows);
  return {
    ok: true,
    created: rows.filter((r) => !existing.has(r.key)).length,
    updated: rows.filter((r) => existing.has(r.key)).length,
    keys: rows.map((r) => r.key),
  };
}

/**
 * How often a photo gallery shows an offer card to this viewer on this map (docs/API.md,
 * "Travel offers"): `{ every: 12 | 24 | null }`. `viewerId` is null for a signed-out visitor.
 */
export async function adsFor({ mapId, viewerId = null }) {
  const [mapPlan, viewer] = await Promise.all([loadMapPlan(mapId), viewerId ? loadUserPlan(viewerId) : null]);
  return { every: adEveryFor({ ownerPlan: mapPlan?.plan ?? 'FREE', viewerPlan: viewer?.plan ?? 'FREE' }) };
}

// Travel offers (docs/API.md, "Travel offers"): who sees cards, checking an offer as it's
// imported or edited, and filling its link at the click. Pure.
import { sanitizeText } from './sanitize.js';
import { isCountryCode, parseDateOnly, parseDateTime } from './travelValidation.js';
import { planOf } from './constants/plans.js';

export const OFFER_KINDS = Object.freeze(['HOTEL', 'TOUR', 'FLIGHT', 'ESIM', 'INSURANCE', 'LUGGAGE', 'CAR_HIRE', 'OTHER']);
export const OFFER_PLACEMENTS = Object.freeze(['GALLERY', 'SLIDESHOW', 'COUNTRY_PAGE', 'TRAVEL_DESK']);
export const OFFER_KEY_PATTERN = /^[a-z0-9][a-z0-9-]{1,63}$/;
export const OFFER_LIMITS = Object.freeze({
  partner: 60,
  title: 80,
  blurb: 200,
  url: 2000,
  imageKey: 200,
  weight: { min: 1, max: 100 },
  // One import at a time
  perImport: 500,
  destination: 80,
});
// What a link may ask to be filled at the click
export const URL_PLACEHOLDERS = Object.freeze(['destination', 'country', 'checkin', 'checkout']);
const IMAGE_KEY = /^(?!.*\.\.)[A-Za-z0-9][A-Za-z0-9/_.-]*\.(avif|webp|jpe?g|png)$/;

/**
 * How often an offer card comes in a photo gallery (one every N tiles), or null for none
 * (FEATURE-PLAN.md, "Ads by tier"): a viewer on a paid plan never sees one; anyone else
 * sees the map owner's plan's rate (Economy 12, Business 24, First Class none).
 */
export function adEveryFor({ ownerPlan, viewerPlan }) {
  if (planOf(viewerPlan).rank > 0) return null;
  return planOf(ownerPlan).adEvery ?? null;
}

/** An https link with only known placeholders in it, or null. */
export function checkOfferUrl(value) {
  if (typeof value !== 'string' || !value || value.length > OFFER_LIMITS.url) return null;
  const placeholders = [...value.matchAll(/\{([^{}]*)\}/g)].map((m) => m[1]);
  if (placeholders.some((name) => !URL_PLACEHOLDERS.includes(name))) return null;
  // Parse with the placeholders filled, so a URL with them in the path or query is valid
  let parsed;
  try {
    parsed = new URL(value.replace(/\{[a-z]+\}/g, 'x'));
  } catch {
    return null;
  }
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password) return null;
  return value;
}

const textField = (body, field, { required, max }) => {
  const raw = body[field];
  if (raw === undefined) return { skip: true };
  if (raw === null) return required ? { error: true } : { value: null };
  if (typeof raw !== 'string') return { error: true };
  const value = sanitizeText(raw, { maxLength: max });
  if (required && !value) return { error: true };
  return { value: value || null };
};

/**
 * One offer from an import file or the admin page. A new one (`existing` absent) needs
 * key, partner, kind, title, placements and url; a change may send any of them but the
 * key. `isKnownCountry(code)` says whether a code is on the map.
 * -> `{ ok: true, data }` or `{ ok: false, field }` (the first field that's wrong)
 */
export function parseOfferInput(body, { existing = null, isKnownCountry }) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { ok: false, field: 'offer' };
  const data = {};
  const creating = !existing;

  if (creating) {
    if (typeof body.key !== 'string' || !OFFER_KEY_PATTERN.test(body.key)) return { ok: false, field: 'key' };
    data.key = body.key;
  } else if (body.key !== undefined && body.key !== existing.key) {
    return { ok: false, field: 'key' };
  }

  for (const [field, rules] of [
    ['partner', { required: true, max: OFFER_LIMITS.partner }],
    ['title', { required: true, max: OFFER_LIMITS.title }],
    ['blurb', { required: false, max: OFFER_LIMITS.blurb }],
  ]) {
    const result = textField(body, field, rules);
    if (result.error || (creating && rules.required && result.skip)) return { ok: false, field };
    if (!result.skip) data[field] = result.value;
  }

  if (body.kind !== undefined || creating) {
    if (!OFFER_KINDS.includes(body.kind)) return { ok: false, field: 'kind' };
    data.kind = body.kind;
  }
  if (body.placements !== undefined || creating) {
    const list = body.placements;
    if (!Array.isArray(list) || !list.length || !list.every((p) => OFFER_PLACEMENTS.includes(p))) {
      return { ok: false, field: 'placements' };
    }
    data.placements = [...new Set(list)];
  }
  if (body.url !== undefined || creating) {
    const url = checkOfferUrl(body.url);
    if (!url) return { ok: false, field: 'url' };
    data.url = url;
  }
  if (body.countryCode !== undefined) {
    if (body.countryCode !== null && !(isCountryCode(body.countryCode) && isKnownCountry(body.countryCode))) {
      return { ok: false, field: 'countryCode' };
    }
    data.countryCode = body.countryCode;
  }
  if (body.imageKey !== undefined) {
    const key = body.imageKey;
    if (key !== null && (typeof key !== 'string' || key.length > OFFER_LIMITS.imageKey || !IMAGE_KEY.test(key))) {
      return { ok: false, field: 'imageKey' };
    }
    data.imageKey = key;
  }
  if (body.weight !== undefined) {
    const { min, max } = OFFER_LIMITS.weight;
    if (!Number.isInteger(body.weight) || body.weight < min || body.weight > max) return { ok: false, field: 'weight' };
    data.weight = body.weight;
  }
  if (body.active !== undefined) {
    if (typeof body.active !== 'boolean') return { ok: false, field: 'active' };
    data.active = body.active;
  }
  for (const field of ['startsAt', 'endsAt']) {
    if (body[field] === undefined) continue;
    const date = parseDateTime(body[field]);
    if (!date.ok) return { ok: false, field };
    data[field] = date.value;
  }
  const startsAt = data.startsAt !== undefined ? data.startsAt : existing?.startsAt;
  const endsAt = data.endsAt !== undefined ? data.endsAt : existing?.endsAt;
  if (startsAt && endsAt && new Date(endsAt) < new Date(startsAt)) return { ok: false, field: 'endsAt' };
  return { ok: true, data };
}

/** Is an offer showing now? */
export const offerIsLive = (offer, now = new Date()) =>
  offer.active &&
  (!offer.startsAt || new Date(offer.startsAt) <= now) &&
  (!offer.endsAt || new Date(offer.endsAt) > now);

/**
 * What a click may fill in (GET /go/:offerId's query): `dest` (a place name, cleaned,
 * at most 80 characters), `country` (a code), `from` and `to` ("YYYY-MM-DD").
 * Anything that doesn't fit is left out, never refused: the click still goes through.
 */
export function clickContext(query = {}) {
  const context = {};
  const dest = typeof query.dest === 'string' ? sanitizeText(query.dest, { maxLength: OFFER_LIMITS.destination }) : '';
  if (dest) context.destination = dest;
  if (isCountryCode(query.country)) context.country = query.country;
  const from = parseDateOnly(query.from);
  const to = parseDateOnly(query.to);
  if (from.ok && from.value) context.checkin = query.from;
  if (to.ok && to.value && (!context.checkin || query.to >= query.from)) context.checkout = query.to;
  return context;
}

/** The partner's link with its placeholders filled (URL-encoded; empty when unknown). */
export const fillOfferUrl = (url, context = {}) =>
  url.replace(/\{(destination|country|checkin|checkout)\}/g, (_, name) => encodeURIComponent(context[name] ?? ''));

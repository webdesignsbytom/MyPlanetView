// Travel offers' rules (docs/API.md, "Travel offers"), as the server checks them
// (server/src/utils/offers.js and services/offers.js; change both together): the kinds and
// placements, the key, the link and its placeholders, the picture, one offer as it's
// imported or changed, and whether an offer is showing now. Pure.
// Mock mode's admin handlers check offers with them exactly as the server does; the admin
// page uses them to check its form and to word an import's problems.
import { serverText } from '@/utils/regex/regex';

export const OFFER_KINDS = Object.freeze(['HOTEL', 'TOUR', 'FLIGHT', 'ESIM', 'INSURANCE', 'LUGGAGE', 'CAR_HIRE', 'OTHER']);
export const OFFER_PLACEMENTS = Object.freeze(['GALLERY', 'SLIDESHOW', 'COUNTRY_PAGE', 'TRAVEL_DESK']);
export const OFFER_KEY_PATTERN = /^[a-z0-9][a-z0-9-]{1,63}$/;
export const OFFER_LIMITS = Object.freeze({
  partner: 60,
  title: 80,
  blurb: 200,
  url: 2000,
  imageKey: 200,
  weight: Object.freeze({ min: 1, max: 100 }),
  // One import at a time
  perImport: 500,
});
// What a link may ask to be filled at the click
export const URL_PLACEHOLDERS = Object.freeze(['destination', 'country', 'checkin', 'checkout']);
// A picture in the public bucket: no "..", never SVG
export const OFFER_IMAGE_KEY_PATTERN = /^(?!.*\.\.)[A-Za-z0-9][A-Za-z0-9/_.-]*\.(avif|webp|jpe?g|png)$/;

// Every field an offer has: one left out of an imported offer goes back to its default,
// so the file is the whole truth about each offer it names
export const OFFER_IMPORT_DEFAULTS = Object.freeze({
  blurb: null,
  countryCode: null,
  imageKey: null,
  weight: 1,
  active: true,
  startsAt: null,
  endsAt: null,
});

const isCountryCode = (value) => typeof value === 'string' && /^[A-Z]{2}$/.test(value);

// As the server's sanitizeText: no tags or control characters (tabs and line breaks
// stay), trimmed, cut to `max`; null when nothing is left
export const cleanOfferText = (value, max) => (value == null ? null : serverText(value).slice(0, max) || null);

// As the server's parseDateTime: missing -> undefined (leave it), null or '' -> null
// (clear it), an ISO time -> a Date, anything else -> not ok
function parseDateTime(input) {
  if (input === undefined) return { ok: true, value: undefined };
  if (input === null || input === '') return { ok: true, value: null };
  if (typeof input !== 'string') return { ok: false };
  const date = new Date(input);
  return Number.isNaN(date.getTime()) ? { ok: false } : { ok: true, value: date };
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
  const value = cleanOfferText(raw, max);
  if (required && !value) return { error: true };
  return { value: value || null };
};

/**
 * One offer from an import file or the admin page. A new one (`existing` absent) needs
 * key, partner, kind, title, placements and url; a change may send any of them but the
 * key. `isKnownCountry(code)` says whether a code is on the map.
 * -> `{ ok: true, data }` or `{ ok: false, field }` (the first field that's wrong).
 * Dates come back as Dates, as on the server.
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
    if (key !== null && (typeof key !== 'string' || key.length > OFFER_LIMITS.imageKey || !OFFER_IMAGE_KEY_PATTERN.test(key))) {
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

/** The offers in an import (`{ offers: [...] }` or a bare list), or null. */
export const offersIn = (payload) =>
  Array.isArray(payload) ? payload : Array.isArray(payload?.offers) ? payload.offers : null;

/** The partner's link with its placeholders filled (URL-encoded; empty when unknown). */
export const fillOfferUrl = (url, context = {}) =>
  url.replace(/\{(destination|country|checkin|checkout)\}/g, (_, name) => encodeURIComponent(context[name] ?? ''));

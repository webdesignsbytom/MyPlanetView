// The admin's offer form (docs/API.md, "Travel offers"): its fields as the inputs hold
// them, and the body the server takes, checked first as the server checks it
// (offerRules.js), with a message per field. Also what's wrong with a link, in words.
import { toDateInput } from '@/utils/functions/dates';
import {
  OFFER_IMAGE_KEY_PATTERN,
  OFFER_KEY_PATTERN,
  OFFER_KINDS,
  OFFER_LIMITS,
  OFFER_PLACEMENTS,
  URL_PLACEHOLDERS,
  checkOfferUrl,
  cleanOfferText,
} from './offerRules';

export const PLACEHOLDER_WORDS = URL_PLACEHOLDERS.map((name) => `{${name}}`).join(', ').replace(/, ([^,]+)$/, ' and $1');

/** What's wrong with a partner's link, as the end of a sentence, or null when it's fine. */
export function offerUrlProblem(value) {
  if (typeof value !== 'string' || !value.trim()) return 'the link is missing';
  if (value.length > OFFER_LIMITS.url) return `the link is longer than ${OFFER_LIMITS.url.toLocaleString('en-GB')} characters`;
  const unknown = [...value.matchAll(/\{([^{}]*)\}/g)].map((m) => m[1]).find((name) => !URL_PLACEHOLDERS.includes(name));
  if (unknown !== undefined) return `the link has {${unknown}}, which is never filled in (only ${PLACEHOLDER_WORDS} are)`;
  let parsed;
  try {
    parsed = new URL(value.replace(/\{[a-z]+\}/g, 'x'));
  } catch {
    return 'the link isn’t a whole web address (https://…)';
  }
  if (parsed.protocol !== 'https:') return 'the link must start with https://';
  if (parsed.username || parsed.password) return 'the link mustn’t hold a user name or password';
  return null;
}

const sentence = (words) => `${words.charAt(0).toUpperCase()}${words.slice(1)}.`;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

// A new offer starts on every travel placement; PRINT (under "Print or download") is for
// photo printers, so it's ticked by hand
const NEW_OFFER_PLACEMENTS = OFFER_PLACEMENTS.filter((placement) => placement !== 'PRINT');

export const emptyOfferForm = () => ({
  key: '',
  partner: '',
  kind: 'HOTEL',
  title: '',
  blurb: '',
  countryCode: '',
  placements: [...NEW_OFFER_PLACEMENTS],
  url: '',
  imageKey: '',
  weight: '1',
  active: true,
  firstDay: '',
  lastDay: '',
});

/** A stored offer as the form's fields (for changing it). */
export const offerFormFrom = (offer) => ({
  key: offer.key,
  partner: offer.partner || '',
  kind: offer.kind || 'OTHER',
  title: offer.title || '',
  blurb: offer.blurb || '',
  countryCode: offer.countryCode || '',
  placements: [...(offer.placements || [])],
  url: offer.url || '',
  imageKey: offer.imageKey || '',
  weight: String(offer.weight ?? 1),
  active: offer.active !== false,
  firstDay: toDateInput(offer.startsAt),
  lastDay: toDateInput(offer.endsAt),
});

const wholeNumber = (text) => (/^\d+$/.test(String(text).trim()) ? Number(String(text).trim()) : NaN);

/**
 * The form -> `{ ok: true, body }` for POST (no `existing`) or PATCH (`existing` is the
 * stored offer; its key never changes), or `{ ok: false, errors }` by field.
 * Days are UTC: the first day from its start, the last to its end. A day is only sent on a
 * change when it changed, so an imported offer keeps its exact times.
 */
export function offerBodyFrom(form, { existing = null } = {}) {
  const errors = {};
  const body = {};

  if (!existing) {
    const key = String(form.key).trim().toLowerCase();
    if (OFFER_KEY_PATTERN.test(key)) body.key = key;
    else errors.key = 'A key is 2 to 64 lower-case letters, digits and dashes, starting with a letter or digit.';
  }

  const partner = cleanOfferText(form.partner, OFFER_LIMITS.partner);
  if (partner) body.partner = partner;
  else errors.partner = 'Name the partner.';
  const title = cleanOfferText(form.title, OFFER_LIMITS.title);
  if (title) body.title = title;
  else errors.title = 'Give the card its line, e.g. Hotels in Kyoto.';
  body.blurb = cleanOfferText(form.blurb, OFFER_LIMITS.blurb);

  if (OFFER_KINDS.includes(form.kind)) body.kind = form.kind;
  else errors.kind = 'Choose what it offers.';
  body.countryCode = form.countryCode || null;

  const placements = OFFER_PLACEMENTS.filter((p) => form.placements.includes(p));
  if (placements.length) body.placements = placements;
  else errors.placements = 'Choose at least one place to show it.';

  const url = String(form.url).trim();
  if (checkOfferUrl(url)) body.url = url;
  else errors.url = sentence(offerUrlProblem(url) || 'the link isn’t one we can use');

  const imageKey = String(form.imageKey).trim();
  if (!imageKey) body.imageKey = null;
  else if (imageKey.length <= OFFER_LIMITS.imageKey && OFFER_IMAGE_KEY_PATTERN.test(imageKey)) body.imageKey = imageKey;
  else errors.imageKey = 'A file in the public bucket: letters, digits and / _ . - only, ending .avif, .webp, .jpg, .jpeg or .png.';

  const weight = wholeNumber(form.weight);
  const { min, max } = OFFER_LIMITS.weight;
  if (weight >= min && weight <= max) body.weight = weight;
  else errors.weight = `A whole number from ${min} to ${max}.`;

  body.active = Boolean(form.active);

  const firstDay = String(form.firstDay).trim();
  const lastDay = String(form.lastDay).trim();
  if (firstDay && !DAY.test(firstDay)) errors.firstDay = 'Pick a day, or leave it empty to start now.';
  if (lastDay && !DAY.test(lastDay)) errors.lastDay = 'Pick a day, or leave it empty for no end.';
  else if (firstDay && lastDay && lastDay < firstDay) errors.lastDay = 'The last day can’t be before the first.';
  if (!existing || firstDay !== toDateInput(existing.startsAt)) body.startsAt = firstDay ? `${firstDay}T00:00:00.000Z` : null;
  if (!existing || lastDay !== toDateInput(existing.endsAt)) body.endsAt = lastDay ? `${lastDay}T23:59:59.999Z` : null;

  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, body };
}

/** The offer the form describes, for the card's preview (whatever is typed so far). */
export const previewOfferFrom = (form) => ({
  partner: cleanOfferText(form.partner, OFFER_LIMITS.partner) || 'Partner',
  kind: form.kind,
  title: cleanOfferText(form.title, OFFER_LIMITS.title) || 'The card’s line',
  blurb: cleanOfferText(form.blurb, OFFER_LIMITS.blurb),
  countryCode: form.countryCode || null,
  imageKey: OFFER_IMAGE_KEY_PATTERN.test(String(form.imageKey).trim()) ? String(form.imageKey).trim() : null,
});

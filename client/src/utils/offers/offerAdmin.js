// The admin's travel offers page (docs/API.md, "Travel offers"): the words for kinds,
// placements and states, where an offer stands, the list's filters, and the export file
// (the import file's shape, so offers can be edited offline and imported back).
import { countryName } from '@/utils/map/countries';
import { formatDay } from '@/utils/functions/dates';
import { OFFER_IMPORT_DEFAULTS, OFFER_KINDS, OFFER_PLACEMENTS } from './offerRules';

export const OFFER_KIND_LABELS = Object.freeze({
  HOTEL: 'Hotels',
  TOUR: 'Tours and tickets',
  FLIGHT: 'Flights',
  ESIM: 'eSIMs',
  INSURANCE: 'Insurance',
  LUGGAGE: 'Luggage',
  CAR_HIRE: 'Car hire',
  OTHER: 'Other',
  PRINTS: 'Photo prints',
});

export const OFFER_PLACEMENT_LABELS = Object.freeze({
  GALLERY: 'Photo galleries',
  SLIDESHOW: 'End of a slideshow',
  COUNTRY_PAGE: 'Country pages',
  TRAVEL_DESK: 'Travel Desk',
  PRINT: 'Print or download',
});

export const kindLabel = (kind) => OFFER_KIND_LABELS[kind] ?? kind;
export const placementLabel = (placement) => OFFER_PLACEMENT_LABELS[placement] ?? placement;
export const offerCountryWords = (code) => (code ? countryName(code) : 'Anywhere');

export const OFFER_KIND_OPTIONS = OFFER_KINDS.map((kind) => ({ value: kind, label: OFFER_KIND_LABELS[kind] }));

// Where an offer stands: off, on but not started or already over, or showing now (the
// server's offerIsLive)
export const OFFER_STATES = Object.freeze({
  on: 'On',
  scheduled: 'Scheduled',
  ended: 'Ended',
  off: 'Off',
});

export function offerState(offer, now = Date.now()) {
  if (!offer.active) return { key: 'off', label: OFFER_STATES.off };
  if (offer.startsAt && new Date(offer.startsAt).getTime() > now) return { key: 'scheduled', label: OFFER_STATES.scheduled };
  if (offer.endsAt && new Date(offer.endsAt).getTime() <= now) return { key: 'ended', label: OFFER_STATES.ended };
  return { key: 'on', label: OFFER_STATES.on };
}

/** "Always", "From 1 Jun 2027", "Until 31 Aug 2027" or "1 Jun 2027 – 31 Aug 2027" (UTC days). */
export function offerDatesWords(offer) {
  const from = offer.startsAt ? formatDay(offer.startsAt) : '';
  const to = offer.endsAt ? formatDay(offer.endsAt) : '';
  if (from && to) return `${from} – ${to}`;
  if (from) return `From ${from}`;
  if (to) return `Until ${to}`;
  return 'Always';
}

// Filters: '' is "any"; the country filter's NO_COUNTRY is the general offers
export const NO_COUNTRY = 'none';
export const emptyOfferFilters = () => ({ search: '', kind: '', country: '', state: '' });

export function offerMatches(offer, filters, now = Date.now()) {
  if (filters.kind && offer.kind !== filters.kind) return false;
  if (filters.country === NO_COUNTRY && offer.countryCode) return false;
  if (filters.country && filters.country !== NO_COUNTRY && offer.countryCode !== filters.country) return false;
  if (filters.state && offerState(offer, now).key !== filters.state) return false;
  const words = filters.search.trim().toLowerCase();
  if (!words) return true;
  const text = [offer.title, offer.partner, offer.key, offer.blurb, offerCountryWords(offer.countryCode)].join(' ').toLowerCase();
  return words.split(/\s+/).every((word) => text.includes(word));
}

/** The countries the offers are for, by name, for the country filter. */
export const offerCountryOptions = (offers) =>
  [...new Set(offers.map((o) => o.countryCode).filter(Boolean))]
    .map((code) => ({ value: code, label: countryName(code) }))
    .sort((a, b) => a.label.localeCompare(b.label, 'en-GB'));

// Clicks per placement: every placement the offer shows on, plus any it was clicked
// from before it stopped showing there
export const clicksByPlacement = (offer) =>
  OFFER_PLACEMENTS.filter((p) => offer.placements?.includes(p) || offer.clicks?.byPlacement?.[p]).map((placement) => ({
    placement,
    label: placementLabel(placement),
    count: offer.clicks?.byPlacement?.[placement] ?? 0,
  }));

// Clicks over the last 30 days (GET /users/admin/offers: `byDay` has only days with clicks)
const DAY_MS = 24 * 60 * 60 * 1000;
export const CLICK_DAYS = 30;
export const shortDay = (day) =>
  new Date(`${day}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
export const clicksWord = (n) => `${Number(n || 0).toLocaleString('en-GB')} ${n === 1 ? 'click' : 'clicks'}`;

/** Every day from `since` ("YYYY-MM-DD", UTC) for `days` days, with its clicks (0 when none). */
export function dailyClicks(byDay = [], since, days = CLICK_DAYS) {
  const counts = new Map(byDay.map(({ day, count }) => [day, count]));
  const start = new Date(`${since}T00:00:00Z`).getTime();
  return Array.from({ length: days }, (_, i) => {
    const day = new Date(start + i * DAY_MS).toISOString().slice(0, 10);
    return { day, count: counts.get(day) ?? 0 };
  });
}

// The list's order, as the server sends it: by country (offers for anywhere last), then key
export const sortOffers = (offers) =>
  [...offers].sort(
    (a, b) =>
      (a.countryCode === b.countryCode ? 0 : !a.countryCode ? 1 : !b.countryCode ? -1 : a.countryCode < b.countryCode ? -1 : 1) ||
      (a.key < b.key ? -1 : a.key > b.key ? 1 : 0),
  );

// The export: every field an import takes, in the example file's order, and nothing the
// server makes (id, dates of creation, clicks)
const EXPORT_FIELDS = ['key', 'partner', 'kind', 'title', 'blurb', 'countryCode', 'placements', 'url', 'imageKey', 'weight', 'active', 'startsAt', 'endsAt'];

export function offerExportFile(offers, now = new Date()) {
  return {
    _about: `My Planet View travel offers, exported ${now.toISOString().slice(0, 10)}. Edit them and import the file on the admin page (docs/API.md, "Travel offers"): offers are matched by key, so each one here is updated (or made, if its key is new), and offers not in the file are left alone.`,
    offers: offers.map((offer) =>
      Object.fromEntries(EXPORT_FIELDS.map((field) => [field, offer[field] ?? OFFER_IMPORT_DEFAULTS[field] ?? null])),
    ),
  };
}

export const offerExportFileName = (now = new Date()) => `offers-${now.toISOString().slice(0, 10)}.json`;

/** Hand the browser a JSON file to save. */
export function downloadJson(payload, fileName) {
  const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

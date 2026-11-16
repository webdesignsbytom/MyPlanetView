// What a travel offer's link may carry to the partner (docs/API.md, "Travel offers": GET
// /go/:offerId's dest, country, from and to), and the Travel Desk's shelves. Pure.
//
// On a planned trip the link carries where it goes and when: the place of the trip's first
// stop in the offer's country (its own name, else the country's) and the trip's dates.
// Otherwise a country's offer carries that country. Nothing about the viewer ever goes.
import { countryName } from '../map/countries.js';
import { countryOf } from '../map/ukNations.js';
import { offersForPlacement } from './chooseOffer.js';
import { OFFER_KIND_ORDER } from './offerKinds.js';

const pad = (n) => String(n).padStart(2, '0');

/** Today in the viewer's own calendar, "YYYY-MM-DD". Call it in an effect or a handler, never in a pre-rendered page's render. */
export const todayString = (date = new Date()) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const firstOf = (values) => values.filter(Boolean).sort()[0] || null;
const lastOf = (values) => values.filter(Boolean).sort().at(-1) || null;

/** The soonest trip still planned, with dates from `today` on, in a map's trips list; or null. */
export function nextPlannedTrip(trips, today) {
  return (
    (trips || [])
      .filter((t) => t.status === 'PLANNED' && t.startDate && t.startDate >= today)
      .sort((a, b) => (a.startDate < b.startDate ? -1 : a.startDate > b.startDate ? 1 : 0))[0] || null
  );
}

/** Is a trip (a full trip, or a list's summary) planned, with dates from `today` on? */
export const isUpcomingPlannedTrip = (trip, today) => Boolean(trip && trip.status === 'PLANNED' && trip.startDate && trip.startDate >= today);

/**
 * Where a trip goes, for offers: `{ tripId, from, to, stops: [{ countryCode, destination }] }`,
 * from a whole trip (its stops, in order: each stop's own place name, else its country's)
 * or a group trip's list summary (its countries only). The dates are the trip's, else its
 * stops' first arrival and last departure.
 */
export function tripPlace(trip) {
  const stops = Array.isArray(trip.stops)
    ? [...trip.stops]
        .sort((a, b) => a.position - b.position)
        .filter((s) => s.countryCode)
        .map((s) => ({ countryCode: s.countryCode, destination: s.placeName || countryName(s.countryCode) }))
    : (trip.countryCodes || []).map((code) => ({ countryCode: code, destination: countryName(code) }));
  return {
    tripId: trip.id,
    from: trip.startDate || firstOf((trip.stops || []).map((s) => s.arriveOn)),
    to: trip.endDate || lastOf((trip.stops || []).map((s) => s.leaveOn)),
    stops,
  };
}

/** The countries a trip place goes to, in stop order, each once. */
export const placeCountries = (place) => [...new Set((place?.stops || []).map((s) => s.countryCode))];

/** A country's link context: its name and code (nothing for none). */
// A UK nation (a map that splits the UK) is named as the destination, and sent as the UK:
// partners' links take ISO country codes
export const countryLink = (code) => (code ? { destination: countryName(code), country: countryOf(code) } : {});

/**
 * A link's context on a trip: the first stop in `countryCode` (the trip's first stop when
 * it's null, for an offer with no country), with the trip's dates. A country the trip
 * doesn't go to gets that country alone.
 */
export function tripLink(place, countryCode = null) {
  const stop = countryCode ? place.stops.find((s) => s.countryCode === countryCode) : place.stops[0];
  if (countryCode && !stop) return countryLink(countryCode);
  return { destination: stop?.destination, country: stop?.countryCode && countryOf(stop.countryCode), from: place.from, to: place.to };
}

/**
 * A slot's link context for the offer chosen (chooseOffer's `{ source, countryCode }`):
 * `context` is the slot's `{ plannedTrip, country, aroundCountry }`, `plannedTrip` a
 * tripPlace (or null).
 */
export function linkForChoice(choice, { plannedTrip = null, country = null, aroundCountry = null }) {
  if (!choice) return {};
  if (choice.source === 'trip') return tripLink(plannedTrip, choice.countryCode);
  if (choice.source === 'general') return plannedTrip ? tripLink(plannedTrip) : countryLink(country || aroundCountry);
  if (plannedTrip && placeCountries(plannedTrip).includes(choice.countryCode)) return tripLink(plannedTrip, choice.countryCode);
  return countryLink(choice.countryCode);
}

/**
 * A Travel Desk link: a country's offer carries that country, or the trip's stop there
 * with its dates; a general offer carries the trip's first stop in one of the desk's
 * countries, else the desk's first country. `trip` is a tripPlace (its dates null when
 * they shouldn't be sent: a trip already done).
 */
export function deskLink(offer, { countryCodes, trip = null }) {
  const onTrip = trip ? placeCountries(trip) : [];
  if (offer.countryCode) {
    // The UK's offer for a stop in one of its nations: that stop
    const stopCountry = onTrip.find((code) => countryOf(code) === offer.countryCode);
    return stopCountry ? tripLink(trip, stopCountry) : countryLink(offer.countryCode);
  }
  const shared = (countryCodes || []).find((code) => onTrip.includes(code));
  return shared ? tripLink(trip, shared) : countryLink(countryCodes?.[0]);
}

/** The slot's context for chooseOffer, from the same `{ plannedTrip, country, aroundCountry }`. */
export const choiceContext = (placement, { plannedTrip = null, country = null, aroundCountry = null }) => ({
  placement,
  tripCountry: plannedTrip?.stops[0]?.countryCode || null,
  country,
  aroundCountry,
});

/**
 * The Travel Desk's shelves for some countries: every TRAVEL_DESK offer for one of them,
 * plus the general ones, by kind in OFFER_KIND_ORDER (`[{ kind, offers }]`, empty kinds
 * left out). On each shelf the countries' own offers come first, in the order given, then
 * the general ones; then the heavier first, then by title.
 */
export function deskShelves(offers, countryCodes) {
  // Offers are kept per country: a UK nation's are the UK's
  const codes = (countryCodes || []).map(countryOf);
  const rank = (offer) => (offer.countryCode ? codes.indexOf(offer.countryCode) : codes.length);
  const fitting = offersForPlacement(offers, 'TRAVEL_DESK')
    .filter((offer) => !offer.countryCode || codes.includes(offer.countryCode))
    .sort((a, b) => rank(a) - rank(b) || (b.weight || 1) - (a.weight || 1) || String(a.title).localeCompare(String(b.title)));
  const kinds = [...OFFER_KIND_ORDER, ...new Set(fitting.map((o) => o.kind).filter((kind) => !OFFER_KIND_ORDER.includes(kind)))];
  return kinds
    .map((kind) => ({ kind, offers: fitting.filter((offer) => offer.kind === kind || (kind === 'OTHER' && !offer.kind)) }))
    .filter((shelf) => shelf.offers.length);
}

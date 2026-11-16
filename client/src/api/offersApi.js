// Travel offers (docs/API.md, "Travel offers"): the live list the cards and the Travel
// Desk pick from, and the link a card goes through. Nothing about the viewer is sent: the
// list is the same for everyone, and the click carries only the slot's own context.
import client, { apiHost } from './client';
import { OFFERS_API, OFFER_CLICK_PATH } from '@/utils/constants/apiRoutes';

// Fetched once per session (the server's answer is cached 5 minutes anyway), like the
// landmarks. A failed request is forgotten, so the next use tries again.
let all = null;

/** Every offer live now: `[{ id, partner, kind, title, blurb, countryCode, placements, imageKey, weight }]`. */
export function getOffers() {
  all ||= client
    .get(OFFERS_API, false)
    .then((res) => res.data?.data?.offers ?? [])
    .catch((err) => {
      all = null;
      throw err;
    });
  return all;
}

/**
 * A card's link: `<API>/go/<id>?p=…&dest=…&country=…&from=…&to=…`. The API counts the
 * click for that placement (no person, map or time of day) and sends the browser on to
 * the partner with what it can fill in: the place, a country code, and the dates
 * ("YYYY-MM-DD"). Anything empty is left out.
 */
export function offerClickUrl(offer, { placement, destination, country, from, to } = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of [
    ['p', placement],
    ['dest', destination],
    ['country', country],
    ['from', from],
    ['to', to],
  ]) {
    if (value) params.set(key, value);
  }
  const query = params.toString();
  return `${apiHost}${OFFER_CLICK_PATH}/${encodeURIComponent(offer.id)}${query ? `?${query}` : ''}`;
}

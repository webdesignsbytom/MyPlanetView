// Mock mode only: the public list of travel offers (docs/API.md, "Travel offers"). A card's
// click, GET /go/:offerId, isn't an API call (it's a link the browser follows): mock mode
// catches those clicks in offerClicks.js. The admin's routes are in offerAdmin.js.
import { ok, route } from '../mockAdapter';
import { liveOffersView } from '../offers';

export function registerOfferRoutes() {
  route('GET', '/api/offers', () => ok({ offers: liveOffersView() }));
}

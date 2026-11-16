// Mock mode only. A travel offer's card is a plain link to the API's GET /go/:offerId
// (docs/API.md, "Travel offers"), which the browser follows itself, so in mock mode it
// would reach no server. Clicks on those links (a press, Enter, or the middle button) are
// caught here instead: counted in the mock store exactly as the server counts them
// (offers.js offerClick: the placement checked, the UTC day), then the partner's link,
// with its placeholders filled, opens in a new tab, as the server's redirect would.
// Nothing in the app knows: the cards stay plain links.
import { MOCK_MARKER } from './mockAdapter';
import { saveStore } from './store';
import { offerClick } from './offers';

const GO_PATH = /^\/go\/([^/]+)$/;

// The offer link the event came from: a sponsored link to /go/<id>, on any host
function offerLinkFor(event) {
  const link = event.target?.closest?.('a[href]');
  if (!link || !/\bsponsored\b/.test(link.rel)) return null;
  let url;
  try {
    url = new URL(link.href, window.location.href);
  } catch {
    return null;
  }
  const match = url.pathname.match(GO_PATH);
  return match ? { offerId: decodeURIComponent(match[1]), query: Object.fromEntries(url.searchParams.entries()) } : null;
}

function follow(event) {
  if (event.type === 'auxclick' && event.button !== 1) return;
  const found = offerLinkFor(event);
  if (!found) return;
  event.preventDefault();
  const answer = offerClick(found.offerId, found.query);
  saveStore();
  if (answer.status !== 302) {
    console.info(`[${MOCK_MARKER}] GET /go/${found.offerId}: ${answer.status} ${answer.message}`);
    return;
  }
  console.info(`[${MOCK_MARKER}] Offer click counted (${found.query.p || 'no placement'}), opening ${answer.location}`);
  window.open(answer.location, '_blank', 'noopener,noreferrer');
}

export function installOfferClickInterceptor() {
  document.addEventListener('click', follow, true);
  document.addEventListener('auxclick', follow, true);
}

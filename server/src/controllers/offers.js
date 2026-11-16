// Travel offers (docs/API.md, "Travel offers"): the public list the client picks cards
// from, the click that counts and redirects, and the admin's list, changes and import.
import { DOMAINS, EVENT_MESSAGES, sendDataResponse } from '../utils/responses/responses.js';
import { logEvent } from '../utils/events/logEvent.js';
import { createOfferEvent } from '../event/travelUtils.js';
import { isUuid } from '../utils/travelValidation.js';
import { OFFER_PLACEMENTS, clickContext, fillOfferUrl, offerIsLive, parseOfferInput } from '../utils/offers.js';
import { OFFER_CLICK_COUNT_LIMIT } from '../utils/constants/rateLimitConstants.js';
import { clientIpKey, rateLimitShared } from '../middleware/dbRateLimit.js';
import {
  countOfferClick,
  createOfferInDB,
  deleteOfferInDB,
  findLiveOffers,
  findOfferById,
  findOfferForClick,
  findOfferKeys,
  findOffersWithClicks,
  updateOfferInDB,
} from '../domain/offers.js';
import { importOffers } from '../services/offers.js';
import { continentsByCode } from './helpers/countries.js';
import { badRequest, conflict, handler, notFound } from './helpers/travel.js';

const D = DOMAINS.offers;
const DAY_MS = 24 * 60 * 60 * 1000;
export const CLICK_STATS_DAYS = 30;

// The same for everyone, and changed rarely: browsers and Vercel's CDN keep it 5 minutes
// (one copy per Origin, as for the reference data)
export const OFFERS_CACHE_CONTROL = 'public, max-age=300, s-maxage=300, stale-while-revalidate=3600';

export const listOffersHandler = handler(D, 'List offers', async (req, res) => {
  const offers = await findLiveOffers();
  res.set('Cache-Control', OFFERS_CACHE_CONTROL);
  res.vary('Origin');
  return sendDataResponse(res, 200, { offers });
});

// GET /go/:offerId?p=GALLERY&dest=&country=&from=&to=: one more in today's tally for that
// placement (per IP, at most OFFER_CLICK_COUNT_LIMIT counted; the click still goes
// through), then a 302 to the partner's link with its placeholders filled. Nothing about
// the person is kept.
export const offerClickHandler = handler(D, 'Offer click', async (req, res) => {
  const offer = isUuid(req.params.offerId) ? await findOfferForClick(req.params.offerId) : null;
  if (!offer) return notFound(req, res, D, EVENT_MESSAGES.offerNotFound);
  if (!offerIsLive(offer)) return notFound(req, res, D, EVENT_MESSAGES.offerEnded);

  const placement = (req.query || {}).p;
  if (OFFER_PLACEMENTS.includes(placement)) {
    const allowed = await rateLimitShared({ ...OFFER_CLICK_COUNT_LIMIT, key: `${OFFER_CLICK_COUNT_LIMIT.name}:${clientIpKey(req.ip)}` });
    if (allowed.ok) await countOfferClick(offer.id, placement).catch((err) => console.error('[offers] click not counted:', err.message));
  }
  res.set('Cache-Control', 'no-store');
  // The partner learns nothing from where the click came from
  res.set('Referrer-Policy', 'no-referrer');
  return res.redirect(302, fillOfferUrl(offer.url, clickContext(req.query || {})));
});

// Admin (ADMIN or DEVELOPER)

const knownCountry = async () => {
  const codes = await continentsByCode();
  return (code) => codes.has(code);
};

export const listAdminOffersHandler = handler(D, 'List offers (admin)', async (req, res) => {
  const since = new Date(Date.now() - (CLICK_STATS_DAYS - 1) * DAY_MS);
  since.setUTCHours(0, 0, 0, 0);
  const offers = await findOffersWithClicks(since);
  return sendDataResponse(res, 200, { offers, clicksSince: since.toISOString().slice(0, 10) });
});

export const createOfferHandler = handler(D, 'Create offer', async (req, res) => {
  const parsed = parseOfferInput(req.body, { isKnownCountry: await knownCountry() });
  if (!parsed.ok) return badRequest(req, res, D, `${EVENT_MESSAGES.offerInvalid} (${parsed.field})`);
  if ((await findOfferKeys([parsed.data.key])).size) return conflict(req, res, D, EVENT_MESSAGES.offerKeyTaken);
  const offer = await createOfferInDB(parsed.data);
  logEvent(createOfferEvent({ user: req.user, action: 'Create Success', id: offer.id, detail: `key=${offer.key}`, statusCode: 201 }));
  return sendDataResponse(res, 201, { offer });
});

export const updateOfferHandler = handler(D, 'Update offer', async (req, res) => {
  const existing = isUuid(req.params.offerId) ? await findOfferById(req.params.offerId) : null;
  if (!existing) return notFound(req, res, D, EVENT_MESSAGES.offerNotFound);
  const parsed = parseOfferInput(req.body, { existing, isKnownCountry: await knownCountry() });
  if (!parsed.ok) return badRequest(req, res, D, `${EVENT_MESSAGES.offerInvalid} (${parsed.field})`);
  const offer = Object.keys(parsed.data).length ? await updateOfferInDB(existing.id, parsed.data) : existing;
  logEvent(createOfferEvent({ user: req.user, action: 'Update Success', id: offer.id, detail: Object.keys(parsed.data).join(',') }));
  return sendDataResponse(res, 200, { offer });
});

// Deleting an offer deletes its click tallies too; turning it off (active: false) keeps them
export const deleteOfferHandler = handler(D, 'Delete offer', async (req, res) => {
  const existing = isUuid(req.params.offerId) ? await findOfferById(req.params.offerId) : null;
  if (!existing) return notFound(req, res, D, EVENT_MESSAGES.offerNotFound);
  await deleteOfferInDB(existing.id);
  logEvent(createOfferEvent({ user: req.user, action: 'Delete Success', id: existing.id, detail: `key=${existing.key}` }));
  return sendDataResponse(res, 200, { message: 'Offer deleted.' });
});

// `{ offers: [...] }` (the import file's shape): created or updated by key, all or none
export const importOffersHandler = handler(D, 'Import offers', async (req, res) => {
  const result = await importOffers(req.body);
  if (!result.ok) {
    return res.status(400).json({ status: 'fail', message: EVENT_MESSAGES.offersImportInvalid, data: { problems: result.problems } });
  }
  logEvent(createOfferEvent({ user: req.user, action: 'Import Success', detail: `created=${result.created} updated=${result.updated}` }));
  return sendDataResponse(res, 200, { created: result.created, updated: result.updated, keys: result.keys });
});

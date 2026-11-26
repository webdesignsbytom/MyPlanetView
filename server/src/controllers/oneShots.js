// Life's One Shots (24 Nov 2026, the user's wish and name; docs/API.md "Life's One Shots"):
// the map's ticks of the catalogue (utils/constants/oneShots.js): wildlife seen, nature's
// wonders, journeys and feats. Everyone who can see the map sees them (share links too);
// the owner and editors tick, change and take them off, and see what the flight log suggests.
import { DOMAINS, EVENT_MESSAGES, sendDataResponse } from '../utils/responses/responses.js';
import { logEvent } from '../utils/events/logEvent.js';
import { createMapEvent } from '../event/travelUtils.js';
import { canEdit, canView } from '../utils/access.js';
import { isSubsetOf } from '../utils/travelValidation.js';
import { placeOnMap } from '../utils/ukNations.js';
import { isOneShotKey } from '../utils/constants/oneShots.js';
import { parseOneShotInput } from '../utils/oneShots.js';
import { findTravellerIds } from '../domain/maps.js';
import { countMapPhotosForOneShot, deleteOneShotInDB, saveOneShotInDB } from '../domain/oneShots.js';
import { mapOneShots, oneShotViews } from '../services/travel/oneShots.js';
import { isKnownCountry } from './helpers/countries.js';
import { badRequest, denyUnless, handler, loadMap, notFound } from './helpers/travel.js';

const D = DOMAINS.maps;

// GET /maps/:mapId/one-shots -> { oneShots, suggestions }
export const getOneShotsHandler = handler(D, 'Get one shots', async (req, res) => {
  const { map, role } = await loadMap(req, req.params.mapId);
  if (denyUnless(req, res, D, role, canView, EVENT_MESSAGES.mapNotFound)) return undefined;
  return sendDataResponse(res, 200, await mapOneShots(map.id, { editor: canEdit(role) }));
});

// The map (editors only) and a real item, or the answer already sent
async function loadForChange(req, res) {
  const { map, role } = await loadMap(req, req.params.mapId);
  if (denyUnless(req, res, D, role, canEdit, EVENT_MESSAGES.mapNotFound)) return null;
  if (!isOneShotKey(req.params.itemKey)) {
    notFound(req, res, D, EVENT_MESSAGES.oneShotNotFound);
    return null;
  }
  return map;
}

// PUT /maps/:mapId/one-shots/:itemKey { seenOn?, datePrecision?, countryCode?, photoIds?,
// notes?, travellerIds?, source? } -> { oneShot, created, countryCode }. Ticks it, or
// changes its tick; a country given is marked visited too (as a "been here" landmark's).
// `photoIds`: up to 5 of the map's own photos (never videos), the first on its card.
export const saveOneShotHandler = handler(D, 'Tick one shot', async (req, res) => {
  const map = await loadForChange(req, res);
  if (!map) return undefined;
  const parsed = parseOneShotInput(req.params.itemKey, req.body || {});
  if (!parsed.ok) return badRequest(req, res, D, EVENT_MESSAGES.oneShotInvalid);
  const { travellerIds, photoIds, ...data } = parsed.value;

  let place = null;
  if (data.countryCode) {
    if (!(await isKnownCountry(data.countryCode))) return badRequest(req, res, D, EVENT_MESSAGES.countryNotFound);
    // As the map places it: a region is its country's, a UK nation the UK's on a map that doesn't split it
    place = placeOnMap(data.countryCode, Boolean(map.splitUk));
    data.countryCode = place;
  }
  if (photoIds?.length && (await countMapPhotosForOneShot(map.id, photoIds)) !== photoIds.length) {
    return badRequest(req, res, D, EVENT_MESSAGES.oneShotPhotoInvalid);
  }
  if (travellerIds && !isSubsetOf(travellerIds, await findTravellerIds(map.id))) {
    return badRequest(req, res, D, EVENT_MESSAGES.travellersNotOnMap);
  }

  const { oneShot, created } = await saveOneShotInDB({ mapId: map.id, itemKey: req.params.itemKey, data, travellerIds, photoIds, userId: req.user.id, place });
  logEvent(
    createMapEvent({ user: req.user, action: created ? 'One Shot Ticked' : 'One Shot Changed', id: map.id, detail: `item=${req.params.itemKey}`, statusCode: created ? 201 : 200 }),
  );
  const [view] = await oneShotViews([oneShot], { editor: true });
  return sendDataResponse(res, created ? 201 : 200, { oneShot: view, created, countryCode: place });
});

// DELETE /maps/:mapId/one-shots/:itemKey -> { itemKey, ticked: false } (the country stays visited)
export const deleteOneShotHandler = handler(D, 'Untick one shot', async (req, res) => {
  const map = await loadForChange(req, res);
  if (!map) return undefined;
  await deleteOneShotInDB(map.id, req.params.itemKey);
  logEvent(createMapEvent({ user: req.user, action: 'One Shot Unticked', id: map.id, detail: `item=${req.params.itemKey}`, statusCode: 200 }));
  return sendDataResponse(res, 200, { itemKey: req.params.itemKey, ticked: false });
});

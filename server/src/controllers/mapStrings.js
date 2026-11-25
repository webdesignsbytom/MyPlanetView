// Strings between places (docs/API.md "Strings"; 23 Nov 2026, the user's wish): red thread
// tied pin to pin on a map, like a corkboard. The owner, co-owners and editors tie and untie
// them (a verified email, as every change to content); everyone who can see the map sees
// them (its reply's `strings`, share links too), unless they've switched them off.
import { DOMAINS, EVENT_MESSAGES, sendDataResponse } from '../utils/responses/responses.js';
import { logEvent } from '../utils/events/logEvent.js';
import { createMapEvent } from '../event/travelUtils.js';
import { canEdit } from '../utils/access.js';
import { isUuid } from '../utils/travelValidation.js';
import { autoStringPairs, parseStringInput, parseStringKind, stringView } from '../utils/mapStrings.js';
import {
  addMapStringInDB,
  addMapStringsInDB,
  deleteAllMapStringsInDB,
  deleteMapStringInDB,
  findAutoStringInputs,
  findMapStrings,
} from '../domain/mapStrings.js';
import { isKnownCountry } from './helpers/countries.js';
import { badRequest, conflict, denyUnless, handler, loadMap, notFound } from './helpers/travel.js';

const D = DOMAINS.maps;

async function editableMap(req, res) {
  const { map, role } = await loadMap(req, req.params.mapId);
  return denyUnless(req, res, D, role, canEdit, EVENT_MESSAGES.mapNotFound) ? null : map;
}

const strings = async (mapId) => (await findMapStrings(mapId)).map(stringView);

// POST /maps/:mapId/strings { from, to, kind? } -> 201 { string }, or 200 when it was already
// tied; `kind` VISITED (the default) or PLANNED (25 Nov 2026)
export const addMapStringHandler = handler(D, 'Tie string', async (req, res) => {
  const map = await editableMap(req, res);
  if (!map) return undefined;
  const kind = parseStringKind(req.body?.kind);
  if (!kind) return badRequest(req, res, D, EVENT_MESSAGES.stringKindInvalid);
  const parsed = parseStringInput(req.body, { splitUk: Boolean(map.splitUk) });
  if (!parsed.ok) return badRequest(req, res, D, EVENT_MESSAGES[parsed.message]);
  const known = await Promise.all(parsed.pair.map((code) => isKnownCountry(code)));
  if (known.includes(false)) return badRequest(req, res, D, EVENT_MESSAGES.stringInvalid);
  const result = await addMapStringInDB({ mapId: map.id, kind, pair: parsed.pair, userId: req.user.id });
  if (result.full) return conflict(req, res, D, EVENT_MESSAGES.stringsFull);
  if (result.created) logEvent(createMapEvent({ user: req.user, action: 'String Tied', id: map.id, detail: `${kind}:${parsed.pair.join('-')}`, statusCode: 201 }));
  return sendDataResponse(res, result.created ? 201 : 200, { string: stringView(result.string) });
});

// DELETE /maps/:mapId/strings/:stringId -> { removed: id }
export const deleteMapStringHandler = handler(D, 'Untie string', async (req, res) => {
  const map = await editableMap(req, res);
  if (!map) return undefined;
  const { stringId } = req.params;
  if (!isUuid(stringId) || !(await deleteMapStringInDB(map.id, stringId))) return notFound(req, res, D, EVENT_MESSAGES.stringNotFound);
  return sendDataResponse(res, 200, { removed: stringId });
});

// POST /maps/:mapId/strings/auto { kind? } -> { strings, added, full }: the trips' routes and
// first visits, or for PLANNED the planned trips' routes and the places wanted
export const addAutoStringsHandler = handler(D, 'Tie strings automatically', async (req, res) => {
  const map = await editableMap(req, res);
  if (!map) return undefined;
  const kind = parseStringKind(req.body?.kind);
  if (!kind) return badRequest(req, res, D, EVENT_MESSAGES.stringKindInvalid);
  const pairs = autoStringPairs({ ...(await findAutoStringInputs(map.id)), splitUk: Boolean(map.splitUk), kind });
  const { added, full } = pairs.length ? await addMapStringsInDB({ mapId: map.id, kind, pairs, userId: req.user.id }) : { added: 0, full: false };
  if (added) logEvent(createMapEvent({ user: req.user, action: 'Strings Tied', id: map.id, detail: `${kind}:auto=${added}`, statusCode: 200 }));
  return sendDataResponse(res, 200, { strings: await strings(map.id), added, full });
});

// DELETE /maps/:mapId/strings?kind= -> { removed: count }: every string of the kind (VISITED
// when none is given)
export const deleteAllMapStringsHandler = handler(D, 'Untie every string', async (req, res) => {
  const map = await editableMap(req, res);
  if (!map) return undefined;
  const kind = parseStringKind(req.query?.kind);
  if (!kind) return badRequest(req, res, D, EVENT_MESSAGES.stringKindInvalid);
  const removed = await deleteAllMapStringsInDB(map.id, kind);
  if (removed) logEvent(createMapEvent({ user: req.user, action: 'Strings Untied', id: map.id, detail: `${kind}:all=${removed}`, statusCode: 200 }));
  return sendDataResponse(res, 200, { removed });
});

export { strings as mapStringsView };

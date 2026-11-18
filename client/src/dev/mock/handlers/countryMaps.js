// Mock mode only: country maps (docs/API.md "Country maps"): one country's states visited
// and its pins, each with its visits. The owner and editors change them; viewers read them,
// never a hidden pin. The share link's routes are in handlers/sharing.js.
import { fail, ok, route } from '../mockAdapter';
import { getDb } from '../store';
import { atLeast, mapRole } from '../views';
import {
  MESSAGES as M,
  addVisit,
  clearSubdivision,
  countryMapOf,
  createPin,
  deletePin,
  deleteVisit,
  pinDetail,
  pinList,
  setSubdivision,
  subdivisionStatuses,
  updatePin,
  updateVisit,
} from '../countryMaps';

const findMap = (id) => getDb().maps.find((m) => m.id === id) || null;

// No role at all is a 404 (nothing to probe); a role that isn't enough is a 403
const denyUnlessEditor = (role, notFound) => {
  if (!atLeast(role, 'VIEWER')) return fail(404, notFound);
  if (!atLeast(role, 'EDITOR')) return fail(403, 'You do not have permission to do that.');
  return null;
};
const answer = (result, body) => (result.error ? fail(result.status, result.error) : ok(body ?? result));

/** A pin and the caller's role on its map, or a refusal for a change. */
function pinForChange(pinId) {
  const pin = (getDb().pins || []).find((p) => p.id === pinId);
  const role = pin ? mapRole(findMap(pin.mapId)) : null;
  if (!pin || !atLeast(role, 'VIEWER') || (pin.hidden && !atLeast(role, 'EDITOR'))) return { refused: fail(404, M.pinNotFound) };
  if (!atLeast(role, 'EDITOR')) return { refused: fail(403, 'You do not have permission to do that.') };
  return { pin, role };
}

export function registerCountryMapRoutes() {
  route('GET', '/api/maps/:mapId/subdivisions', ({ params, query }) => {
    const map = findMap(params.mapId);
    if (!atLeast(mapRole(map), 'VIEWER')) return fail(404, M.mapNotFound);
    const country = countryMapOf(query.country, map.splitUk);
    if (!country) return fail(400, M.countryMapNotFound);
    return ok({ subdivisions: subdivisionStatuses(map.id, country) });
  });

  route('PUT', '/api/maps/:mapId/subdivisions/:code', ({ params, body }) => {
    const map = findMap(params.mapId);
    const denied = denyUnlessEditor(mapRole(map), M.mapNotFound);
    return denied ?? answer(setSubdivision(map, params.code, body.status));
  });

  route('DELETE', '/api/maps/:mapId/subdivisions/:code', ({ params }) => {
    const map = findMap(params.mapId);
    const denied = denyUnlessEditor(mapRole(map), M.mapNotFound);
    return denied ?? answer(clearSubdivision(map, params.code));
  });

  route('GET', '/api/maps/:mapId/pins', ({ params, query }) => {
    const map = findMap(params.mapId);
    const role = mapRole(map);
    if (!atLeast(role, 'VIEWER')) return fail(404, M.mapNotFound);
    const country = countryMapOf(query.country, map.splitUk);
    if (!country) return fail(400, M.countryMapNotFound);
    return ok({ pins: pinList(map.id, country, role) });
  });

  route('POST', '/api/maps/:mapId/pins', async ({ params, body }) => {
    const map = findMap(params.mapId);
    const denied = denyUnlessEditor(mapRole(map), M.mapNotFound);
    if (denied) return denied;
    const result = await createPin(map, body);
    return result.error ? fail(result.status, result.error) : ok(result, 201);
  });

  route('GET', '/api/pins/:pinId', ({ params }) => {
    const pin = (getDb().pins || []).find((p) => p.id === params.pinId);
    const view = pin ? pinDetail(pin.id, mapRole(findMap(pin.mapId))) : null;
    return view ? ok({ pin: view }) : fail(404, M.pinNotFound);
  });

  route('PATCH', '/api/pins/:pinId', async ({ params, body }) => {
    const { pin, role, refused } = pinForChange(params.pinId);
    if (refused) return refused;
    const result = await updatePin(pin, body);
    return answer(result, { pin: pinDetail(pin.id, role) });
  });

  route('DELETE', '/api/pins/:pinId', ({ params }) => {
    const { pin, refused } = pinForChange(params.pinId);
    if (refused) return refused;
    deletePin(pin);
    return ok({ message: 'Pin deleted.' });
  });

  route('POST', '/api/pins/:pinId/visits', ({ params, body }) => {
    const { pin, role, refused } = pinForChange(params.pinId);
    if (refused) return refused;
    const result = addVisit(pin, body);
    return result.error ? fail(result.status, result.error) : ok({ pin: pinDetail(pin.id, role) }, 201);
  });

  route('PATCH', '/api/pins/:pinId/visits/:visitId', ({ params, body }) => {
    const { pin, role, refused } = pinForChange(params.pinId);
    if (refused) return refused;
    const visit = (getDb().pinVisits || []).find((v) => v.id === params.visitId && v.pinId === pin.id);
    if (!visit) return fail(404, M.pinVisitNotFound);
    return answer(updateVisit(pin, visit, body), { pin: pinDetail(pin.id, role) });
  });

  route('DELETE', '/api/pins/:pinId/visits/:visitId', ({ params }) => {
    const { pin, role, refused } = pinForChange(params.pinId);
    if (refused) return refused;
    const visit = (getDb().pinVisits || []).find((v) => v.id === params.visitId && v.pinId === pin.id);
    if (!visit) return fail(404, M.pinVisitNotFound);
    deleteVisit(visit);
    return ok({ pin: pinDetail(pin.id, role) });
  });
}

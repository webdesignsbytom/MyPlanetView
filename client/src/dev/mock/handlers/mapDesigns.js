// Mock mode only: a map's own designs, one per map style (docs/API.md "Map designs"), as the
// server's controllers/mapDesigns.js: the owner and co-owners change them (a stranger gets a
// 404, anyone else a 403); the picture upload needs a verified email (mockAdapter.js
// NEEDS_VERIFIED_EMAIL).
import { deny, fail, ok, route } from '../mockAdapter';
import { getDb, me, newId, session } from '../store';
import { mapRole } from '../views';
import { mockUpload, presignMockUpload } from '../uploads';
import { DESIGN_MESSAGES as M, checkDesignPicture, designStyleOf, designView, designsOf, newDesign, parseDesignChange } from '../mapDesigns';

const NOT_FOUND = 'This map could not be found.';
const findMap = (id) => getDb().maps.find((m) => m.id === id) || null;

// The map, if the caller may change its design; else the reply
function designable(mapId) {
  const map = findMap(mapId);
  const denied = deny(mapRole(map), 'CO_OWNER', NOT_FOUND);
  return denied ? { denied } : { map };
}

export function registerMapDesignRoutes() {
  route('PATCH', '/api/maps/:mapId/design', ({ params, body }) => {
    const { map, denied } = designable(params.mapId);
    if (denied) return denied;
    const style = designStyleOf(body?.style);
    if (!style) return fail(400, M.invalidMapStyle);
    const parsed = parseDesignChange(body);
    if (parsed.error) return fail(400, M[parsed.error]);
    const designs = designsOf(map);
    designs[style] = { ...newDesign(), ...designs[style], ...parsed.change };
    return ok({ design: designView(map, style) });
  });

  route('POST', '/api/maps/:mapId/design/picture/presign', ({ params, body }) => {
    const { map, denied } = designable(params.mapId);
    if (denied) return denied;
    const { contentType, bytes } = body || {};
    const problem = checkDesignPicture({ contentType, bytes });
    if (problem) return fail(problem === 'designPictureTooLarge' ? 413 : 400, M[problem]);
    const ext = { 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/png': 'png' }[contentType];
    const key = `myplanetview/designs/${map.id}/sea-${newId()}.${ext}`;
    const url = presignMockUpload(key, { resource: 'mapDesign', contentType, bytes, ownerId: me().id });
    return ok({ key, upload: { url, method: 'PUT', headers: { 'Content-Type': contentType }, bytes, expiresIn: 600 } });
  });

  route('PUT', '/api/maps/:mapId/design/picture', ({ params, body }) => {
    const { map, denied } = designable(params.mapId);
    if (denied) return denied;
    const style = designStyleOf(body?.style);
    if (!style) return fail(400, M.invalidMapStyle);
    const key = body?.key;
    const signed = typeof key === 'string' && key.startsWith(`myplanetview/designs/${map.id}/sea-`) ? mockUpload(key) : null;
    // Only what this person presigned and the mock bucket took
    if (!signed || signed.resource !== 'mapDesign' || signed.ownerId !== me().id || !session.blobs.has(key)) {
      return fail(400, M.designPictureInvalid);
    }
    const designs = designsOf(map);
    const old = designs[style]?.pictureKey;
    designs[style] = { ...newDesign(), ...designs[style], pictureKey: key, shown: true };
    // The picture it replaced is deleted
    if (old && old !== key) session.blobs.delete(old);
    return ok({ design: designView(map, style) });
  });

  route('DELETE', '/api/maps/:mapId/design/picture', ({ params, query }) => {
    const { map, denied } = designable(params.mapId);
    if (denied) return denied;
    const style = designStyleOf(query?.style);
    if (!style) return fail(400, M.invalidMapStyle);
    const designs = designsOf(map);
    if (designs[style]?.pictureKey) {
      session.blobs.delete(designs[style].pictureKey);
      designs[style] = { ...designs[style], pictureKey: null };
    }
    return ok({ design: designView(map, style) });
  });
}

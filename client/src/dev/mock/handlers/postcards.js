// Mock mode only: postcards (docs/API.md "Postcards"; 26 Nov 2026), as the server's
// controllers/postcards.js: the signed-in person sends them from a place (a country's card on
// every plan, a landmark's or one from their own photo on a paid one), lists theirs, gives one a
// new link or deletes it; anyone with the code sees the card. The store keeps `db.postcards`
// ({ id, code, senderId, kind, countryCode, landmarkId, pictureKey, style, message, toName,
// fromName, createdAt }). Unlike the server, nothing is rate limited, and an own photo is the
// session's blob, so after a reload its card shows the place's own picture instead.
import { fail, ok, route } from '../mockAdapter';
import { formatShareCode, getDb, me, newId, newShareCode, normaliseShareCode, session } from '../store';
import { mockUpload, presignMockUpload } from '../uploads';
import { effectivePlan } from '../plans';
import { LANDMARK_ROWS } from '../views';
import { COUNTRY_BY_CODE } from '@/utils/map/countries';
import {
  POSTCARDS_PER_PERSON,
  POSTCARD_MESSAGES as M,
  canSendPostcardKind,
  checkPostcardPicture,
  isFreePhotoGroup,
  landmarkFitsPlace,
  parsePostcardInput,
  shownKind,
} from '@/utils/postcards/postcardRules';
import { POSTCARD_PHOTOS } from '@/utils/postcards/postcardPhotos';

const signedOut = () => fail(401, 'No valid session. Please sign in.');
const cards = () => (getDb().postcards ||= []);
const folderOf = (userId) => `myplanetview/postcards/${userId}/card-`;
const paidCards = () => canSendPostcardKind(effectivePlan(me().id).plan, 'PHOTO');
const landmarkView = (id) => {
  const l = id ? LANDMARK_ROWS.find((row) => row.id === id) : null;
  return l ? { id: l.id, name: l.name, slug: l.slug, wikidataId: l.wikidataId, countryCode: l.countryCode } : null;
};

/** The card as its link shows it (the server's postcardView). */
export function postcardView(card) {
  const landmark = landmarkView(card.landmarkId);
  const pictureUrl = card.pictureKey ? session.blobs.get(card.pictureKey) || null : null;
  return {
    code: formatShareCode(card.code),
    kind: shownKind({ kind: card.kind, landmark, hasPicture: Boolean(pictureUrl) }),
    countryCode: card.countryCode,
    landmark,
    pictureUrl,
    style: card.style,
    message: card.message,
    toName: card.toName,
    fromName: card.fromName,
    sentAt: card.createdAt,
  };
}
const listItem = (card) => ({ id: card.id, ...postcardView(card) });

/** A card in its sender's "Your data" file (the server's postcardExportItem): its own photo's session link. */
export const postcardExportItem = (card) => ({
  code: formatShareCode(card.code),
  kind: card.kind,
  place: card.countryCode,
  landmark: landmarkView(card.landmarkId)?.name ?? null,
  style: card.style,
  message: card.message,
  toName: card.toName,
  fromName: card.fromName,
  photoUrl: card.pictureKey ? session.blobs.get(card.pictureKey) || null : null,
  sentAt: card.createdAt,
});
const newestFirst = (a, b) => (a.createdAt === b.createdAt ? (a.id < b.id ? 1 : -1) : a.createdAt < b.createdAt ? 1 : -1);
// The caller's own card; any other is a 404
const ownCard = (id) => cards().find((c) => c.id === id && c.senderId === me().id) || null;

export function registerPostcardRoutes() {
  route('GET', '/api/postcards', () => {
    if (!session.signedIn) return signedOut();
    const mine = cards().filter((c) => c.senderId === me().id).sort(newestFirst);
    return ok({ postcards: mine.map(listItem), paidCards: paidCards() });
  });

  route('POST', '/api/postcards/picture/presign', ({ body }) => {
    if (!session.signedIn) return signedOut();
    if (!paidCards()) return fail(403, M.postcardNeedsPlan);
    const { contentType, bytes } = body || {};
    const problem = checkPostcardPicture({ contentType, bytes });
    if (problem) return fail(problem === 'postcardPictureTooLarge' ? 413 : 400, M[problem]);
    const ext = { 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/png': 'png' }[contentType];
    const key = `${folderOf(me().id)}${newId()}.${ext}`;
    const url = presignMockUpload(key, { resource: 'postcard', contentType, bytes, ownerId: me().id });
    return ok({ key, upload: { url, method: 'PUT', headers: { 'Content-Type': contentType }, bytes, expiresIn: 600 } });
  });

  route('POST', '/api/postcards', ({ body }) => {
    if (!session.signedIn) return signedOut();
    const parsed = parsePostcardInput(body);
    if (!parsed.ok) return fail(400, M[parsed.error]);
    const { pictureKey, ...card } = parsed.value;
    if (!COUNTRY_BY_CODE[card.countryCode]) return fail(400, M.countryNotFound);
    if (card.kind !== 'COUNTRY' && !paidCards()) return fail(403, M.postcardNeedsPlan);
    if (card.landmarkId) {
      const landmark = landmarkView(card.landmarkId);
      if (!landmark || !landmarkFitsPlace(landmark.countryCode, card.countryCode)) return fail(400, M.postcardLandmarkInvalid);
      // A country's card carries a city's or the wilderness's photo, never a landmark's
      if (card.kind === 'COUNTRY' && !isFreePhotoGroup(POSTCARD_PHOTOS[landmark.slug])) {
        if (POSTCARD_PHOTOS[landmark.slug] !== 'l') return fail(400, M.postcardLandmarkInvalid);
        if (!paidCards()) return fail(403, M.postcardNeedsPlan);
      }
    }
    if (card.kind === 'PHOTO') {
      const signed = pictureKey.startsWith(folderOf(me().id)) ? mockUpload(pictureKey) : null;
      const used = cards().some((c) => c.pictureKey === pictureKey);
      // Only what this person presigned and the mock bucket took, and only once
      if (!signed || signed.resource !== 'postcard' || signed.ownerId !== me().id || !session.blobs.has(pictureKey) || used) {
        return fail(400, M.postcardPictureInvalid);
      }
    }
    if (cards().filter((c) => c.senderId === me().id).length >= POSTCARDS_PER_PERSON) return fail(409, M.postcardTooMany);
    const row = { id: newId(), code: newShareCode(), senderId: me().id, ...card, pictureKey: pictureKey || null, createdAt: new Date().toISOString() };
    cards().push(row);
    return ok({ postcard: listItem(row) }, 201);
  });

  route('POST', '/api/postcards/:postcardId/reset-link', ({ params }) => {
    if (!session.signedIn) return signedOut();
    const card = ownCard(params.postcardId);
    if (!card) return fail(404, M.postcardNotFound);
    card.code = newShareCode();
    return ok({ postcard: listItem(card) });
  });

  route('DELETE', '/api/postcards/:postcardId', ({ params }) => {
    if (!session.signedIn) return signedOut();
    const card = ownCard(params.postcardId);
    if (!card) return fail(404, M.postcardNotFound);
    getDb().postcards = cards().filter((c) => c.id !== card.id);
    return ok({ deleted: true });
  });

  route('GET', '/api/postcard/:code', ({ params }) => {
    const code = normaliseShareCode(params.code);
    const card = code ? cards().find((c) => c.code === code) : null;
    return card ? ok({ postcard: postcardView(card) }) : fail(404, M.postcardNotFound);
  });
}

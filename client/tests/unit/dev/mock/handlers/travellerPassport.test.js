// Mock mode's traveller passport page (dev/mock/passport.js passportTravellerView and the PATCH
// in handlers/passport.js; 25 Nov 2026): the server's rules over the store.
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { HOME_MAP, SAM_MAP, db, freshStore, get, patch, registerAllRoutes, setVerified } from '../mockApi';
import { EVENT_MESSAGES } from '../../../../../../server/src/utils/responses/responses.js';

beforeAll(() => registerAllRoutes());
beforeEach(() => freshStore());

const route = (id = 'trav-test', map = HOME_MAP) => `/api/maps/${map}/travellers/${id}/passport`;
const curly = (text) => text.replace(/'/g, '’');
const charlie = async () => (await get(`/api/maps/${HOME_MAP}/passport`)).data.passport.travellers.find((t) => t.id === 'trav-test');

describe('a traveller’s passport page in the mock', () => {
  it('has the details the map knows, the date of birth for editors, home and who may change it', async () => {
    const { passport } = (await get(`/api/maps/${HOME_MAP}/passport`)).data;
    expect(passport.map).toMatchObject({ homeCountryCode: 'GB', canEdit: true });
    expect(await charlie()).toMatchObject({
      name: 'Charlie',
      birthCountryCode: 'GB',
      birthDate: '1990-01-14',
      issuedOn: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      travellingSince: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      photo: null,
      signature: null,
    });
    // A viewer (the test user on Sam's map) gets no dates of birth and can't change anything
    const sams = (await get(`/api/maps/${SAM_MAP}/passport`)).data.passport;
    expect(sams.map.canEdit).toBe(false);
    expect(sams.travellers[0]).not.toHaveProperty('birthDate');
  });

  it('takes one of the map’s photos, cropped, and a drawn signature', async () => {
    const photo = await patch(route(), { photo: { photoId: 'photo-colosseum', focusX: 0.25, focusY: 0.4, zoom: 2 } });
    expect(photo.status).toBe(200);
    expect(photo.data.traveller.photo).toMatchObject({ source: 'MAP', photoId: 'photo-colosseum', focusX: 0.25, focusY: 0.4, zoom: 2 });
    const signed = await patch(route(), { signature: 'M10 50 L40 30' });
    expect(signed.data.traveller.signature).toBe('M10 50L40 30');
    expect(await charlie()).toMatchObject({ photo: { source: 'MAP' }, signature: 'M10 50L40 30' });
  });

  it('refuses what the server refuses, in its words', async () => {
    const hidden = await patch(route(), { photo: { photoId: 'photo-hidden' } });
    expect(hidden.status).toBe(400);
    expect(hidden.body.message).toBe(curly(EVENT_MESSAGES.passportPhotoInvalid));
    expect((await patch(route(), { photo: { photoId: 'photo-colosseum', zoom: 9 } })).status).toBe(400);
    const badSignature = await patch(route(), { signature: 'M1 1' });
    expect(badSignature.body.message).toBe(curly(EVENT_MESSAGES.signatureInvalid));
    expect((await patch(route(), {})).status).toBe(400);
    expect((await patch(route('nobody'), { signature: null })).status).toBe(404);
    expect([403, 404]).toContain((await patch(route('trav-sam', SAM_MAP), { signature: null })).status);
    setVerified(false);
    expect((await patch(route(), { signature: null })).status).toBe(403);
  });

  it('shows a linked account’s picture until a photo is chosen, and takes both off with null', async () => {
    db().users[0].image = '/avatars/charlie.webp';
    expect((await charlie()).photo).toMatchObject({ source: 'ACCOUNT', url: '/avatars/charlie.webp' });
    await patch(route(), { photo: { photoId: 'photo-dam' }, signature: 'M1 1L9 9' });
    expect((await charlie()).photo.source).toBe('MAP');
    await patch(route(), { photo: null, signature: null });
    expect(await charlie()).toMatchObject({ photo: { source: 'ACCOUNT' }, signature: null });
  });
});

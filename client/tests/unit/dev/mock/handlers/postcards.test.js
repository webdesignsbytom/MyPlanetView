// Mock mode's postcards (dev/mock/handlers/postcards.js; docs/API.md "Postcards"): as the server's
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { POSTCARD_MESSAGES as M } from '@/utils/postcards/postcardRules';
import { receiveMockUpload } from '@/dev/mock/uploads';
import { USER, db, del, freshStore, get, post, registerAllRoutes, setVerified, signOut, stubObjectUrls } from '../mockApi';

beforeAll(() => registerAllRoutes());
beforeEach(() => {
  freshStore();
  stubObjectUrls();
});

const CARD = { kind: 'COUNTRY', countryCode: 'FR', style: 'airmail', message: 'Bonjour!', toName: 'Gran', fromName: 'Charlie' };
const economy = () => {
  db().subscriptions = db().subscriptions.filter((s) => s.userId !== USER);
};
async function pictureKey(bytes = 4) {
  const signed = await post('/api/postcards/picture/presign', { contentType: 'image/jpeg', bytes });
  await receiveMockUpload(signed.data.upload.url, new Blob(['a'.repeat(bytes)]), 'image/jpeg');
  return signed.data.key;
}

describe('the seeded postcards', () => {
  it('lists the test user’s two, newest first, and their plan’s paid cards', async () => {
    const res = await get('/api/postcards');
    expect(res.status).toBe(200);
    expect(res.data.paidCards).toBe(true);
    expect(res.data.postcards.map((c) => c.id)).toEqual(['postcard-rome', 'postcard-france']);
    expect(res.data.postcards[0]).toMatchObject({
      code: 'PST2-CRD8-RMEC',
      kind: 'LANDMARK',
      countryCode: 'IT',
      landmark: { id: 'lm-colosseum', name: 'Colosseum', slug: 'colosseum', countryCode: 'IT' },
      style: 'airmail',
      toName: 'Sam',
    });
  });

  it('opens one by its code for anyone, never with the sender', async () => {
    signOut();
    const res = await get('/api/postcard/pst2crd8frnc');
    expect(res.status).toBe(200);
    expect(res.data.postcard).toMatchObject({ code: 'PST2-CRD8-FRNC', kind: 'COUNTRY', countryCode: 'FR', toName: 'Gran', fromName: 'Charlie', pictureUrl: null });
    expect(res.data.postcard.id).toBeUndefined();
    expect(JSON.stringify(res.data.postcard)).not.toContain(USER);
    expect((await get('/api/postcard/ABCD-EFGH-JKMN')).status).toBe(404);
    expect((await get('/api/postcard/nope')).body.message).toBe(M.postcardNotFound);
    expect((await get('/api/postcards')).status).toBe(401);
  });
});

describe('sending one', () => {
  it('sends a country’s card on any plan', async () => {
    economy();
    const res = await post('/api/postcards', CARD);
    expect(res.status).toBe(201);
    expect(res.data.postcard).toMatchObject({ kind: 'COUNTRY', countryCode: 'FR', style: 'airmail', message: 'Bonjour!', toName: 'Gran' });
    expect(res.data.postcard.code).toMatch(/^[2-9A-Z]{4}-[2-9A-Z]{4}-[2-9A-Z]{4}$/);
    expect(db().postcards).toHaveLength(3);
  });

  it('keeps a landmark’s card and a photo card for paid plans, as the server does', async () => {
    const landmark = { ...CARD, kind: 'LANDMARK', landmarkId: 'lm-eiffel-tower' };
    expect((await post('/api/postcards', landmark)).status).toBe(201);
    // Only one of the place's
    expect((await post('/api/postcards', { ...landmark, landmarkId: 'lm-colosseum' })).body.message).toBe(M.postcardLandmarkInvalid);
    economy();
    const refused = await post('/api/postcards', landmark);
    expect(refused.status).toBe(403);
    expect(refused.body.message).toBe(M.postcardNeedsPlan);
    expect((await post('/api/postcards/picture/presign', { contentType: 'image/jpeg', bytes: 4 })).status).toBe(403);
    expect((await get('/api/postcards')).data.paidCards).toBe(false);
  });

  it('carries the sender’s own photo, presigned and put in the mock bucket, once', async () => {
    const key = await pictureKey();
    expect(key).toMatch(new RegExp(`^myplanetview/postcards/${USER}/card-`));
    const res = await post('/api/postcards', { ...CARD, kind: 'PHOTO', pictureKey: key });
    expect(res.status).toBe(201);
    expect(res.data.postcard.kind).toBe('PHOTO');
    expect(res.data.postcard.pictureUrl).toMatch(/^blob:/);
    // Never twice, and never one that wasn't uploaded
    expect((await post('/api/postcards', { ...CARD, kind: 'PHOTO', pictureKey: key })).body.message).toBe(M.postcardPictureInvalid);
    expect((await post('/api/postcards', { ...CARD, kind: 'PHOTO', pictureKey: `myplanetview/postcards/${USER}/card-x.jpg` })).status).toBe(400);
    expect((await post('/api/postcards/picture/presign', { contentType: 'image/gif', bytes: 4 })).body.message).toBe(M.postcardPictureType);
    expect((await post('/api/postcards/picture/presign', { contentType: 'image/png', bytes: 9 * 1024 * 1024 })).status).toBe(413);
  });

  it('refuses what the server refuses, and needs a verified email address', async () => {
    expect((await post('/api/postcards', { ...CARD, message: '' })).body.message).toBe(M.postcardMessageRequired);
    expect((await post('/api/postcards', { ...CARD, countryCode: 'ZZ' })).body.message).toBe(M.countryNotFound);
    expect((await post('/api/postcards', { ...CARD, style: 'neon' })).body.message).toBe(M.postcardStyleInvalid);
    setVerified(false);
    expect((await post('/api/postcards', CARD)).status).toBe(403);
    signOut();
    expect((await post('/api/postcards', CARD)).status).toBe(401);
  });
});

describe('changing one', () => {
  it('gives the sender’s own card a new link, so the old one finds nothing', async () => {
    const res = await post('/api/postcards/postcard-france/reset-link');
    expect(res.status).toBe(200);
    expect(res.data.postcard.code).not.toBe('PST2-CRD8-FRNC');
    expect((await get('/api/postcard/PST2-CRD8-FRNC')).status).toBe(404);
    expect((await get(`/api/postcard/${res.data.postcard.code}`)).status).toBe(200);
  });

  it('deletes it, and someone else’s is a 404', async () => {
    expect((await del('/api/postcards/postcard-rome')).status).toBe(200);
    expect(db().postcards.map((c) => c.id)).toEqual(['postcard-france']);
    expect((await get('/api/postcard/PST2-CRD8-RMEC')).status).toBe(404);
    expect((await del('/api/postcards/postcard-rome')).status).toBe(404);
    db().postcards[0].senderId = 'mock-sam';
    expect((await post('/api/postcards/postcard-france/reset-link')).status).toBe(404);
  });
});

describe('"Your data"', () => {
  it('lists the cards sent, everything on them, newest first', async () => {
    const res = await get('/api/users/export');
    expect(res.data.postcards.map((c) => c.code)).toEqual(['PST2-CRD8-RMEC', 'PST2-CRD8-FRNC']);
    expect(res.data.postcards[0]).toEqual({
      code: 'PST2-CRD8-RMEC',
      kind: 'LANDMARK',
      place: 'IT',
      landmark: 'Colosseum',
      style: 'airmail',
      message: 'Ciao! The Colosseum is even bigger than in the films.',
      toName: 'Sam',
      fromName: 'Charlie & Alex',
      photoUrl: null,
      sentAt: expect.any(String),
    });
  });
});

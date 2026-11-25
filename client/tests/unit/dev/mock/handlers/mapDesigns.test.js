import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { DESIGN_MESSAGES } from '@/dev/mock/mapDesigns';
import { receiveMockUpload } from '@/dev/mock/uploads';
import { session } from '@/dev/mock/store';
import { HOME_MAP, MORGANS_MAP, SAM_MAP, TOM_MAP, USER, db, del, freshStore, get, patch, post, put, registerAllRoutes, setVerified, stubObjectUrls } from '../mockApi';

beforeAll(() => registerAllRoutes());
beforeEach(() => {
  freshStore();
  stubObjectUrls();
});

const design = (body, mapId = HOME_MAP) => patch(`/api/maps/${mapId}/design`, body);
async function uploadPicture(style = 'animated') {
  const signed = await post(`/api/maps/${HOME_MAP}/design/picture/presign`, { contentType: 'image/webp', bytes: 4 });
  await receiveMockUpload(signed.data.upload.url, new Blob(['abcd']), 'image/webp');
  return put(`/api/maps/${HOME_MAP}/design/picture`, { key: signed.data.key, style });
}

describe('a map’s design, one per style', () => {
  it('saves colours for one style, leaving the others alone', async () => {
    const { data } = await design({ style: 'mono', countries: { FR: '#AA0000', IT: null }, names: '#112233' });
    expect(data.design).toEqual({ style: 'mono', shown: true, countries: { FR: '#aa0000' }, names: '#112233', grid: null, hover: null, string: null, stringTwist: null, plannedString: null, plannedStringTwist: null, visitedLook: 'BADGE', visited: null, picture: null });
    const map = (await get(`/api/maps/${HOME_MAP}`)).data.map;
    expect(Object.keys(map.designs)).toEqual(['mono']);
    await design({ style: 'animated', grid: '#000000' });
    expect((await get(`/api/maps/${HOME_MAP}`)).data.map.designs.mono.countries).toEqual({ FR: '#aa0000' });
  });

  it('switches a design off and on, keeping its colours', async () => {
    await design({ style: 'starry', countries: { ES: '#00ff00' } });
    expect((await design({ style: 'starry', shown: false })).data.design).toMatchObject({ shown: false, countries: { ES: '#00ff00' } });
  });

  it('refuses a style, a colour or a place that isn’t one', async () => {
    expect((await design({ style: 'jupiter', names: '#000000' })).message).toBe(DESIGN_MESSAGES.invalidMapStyle);
    expect((await design({ names: '#000000' })).status).toBe(400);
    expect((await design({ style: 'mono', names: 'red' })).status).toBe(400);
    expect((await design({ style: 'mono', countries: { XN: '#000000' } })).status).toBe(400);
    expect((await design({ style: 'mono', countries: { fr: '#000000' } })).status).toBe(400);
    expect((await design({ style: 'mono' })).status).toBe(400);
  });

  it('is the owner’s and co-owners’, a 403 for anyone else on the map and 404 for strangers, verified or not', async () => {
    setVerified(false);
    expect((await design({ style: 'mono', names: '#000000' })).status).toBe(200);
    expect((await design({ style: 'mono', names: '#000000' }, SAM_MAP)).status).toBe(403);
    expect((await design({ style: 'mono', names: '#000000' }, TOM_MAP)).status).toBe(404);
    db().mapMembers.find((m) => m.mapId === MORGANS_MAP && m.userId === USER).role = 'CO_OWNER';
    expect((await design({ style: 'mono', names: '#000000' }, MORGANS_MAP)).status).toBe(200);
  });
});

describe('a design’s picture', () => {
  it('uploads and saves a picture for a style, replacing the old one', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const first = await uploadPicture('animated');
    expect(first.data.design.picture.url).toMatch(/^blob:/);
    const oldKey = db().maps.find((m) => m.id === HOME_MAP).designs.animated.pictureKey;
    await uploadPicture('animated');
    expect(session.blobs.has(oldKey)).toBe(false);
    expect((await del(`/api/maps/${HOME_MAP}/design/picture?style=animated`)).data.design.picture).toBeNull();
    expect((await del(`/api/maps/${HOME_MAP}/design/picture?style=jupiter`)).status).toBe(400);
  });

  it('presigns only a JPEG, PNG or WebP of up to 8 MB', async () => {
    const presign = (body) => post(`/api/maps/${HOME_MAP}/design/picture/presign`, body);
    const ok = await presign({ contentType: 'image/png', bytes: 10 });
    expect(ok.data.key).toMatch(new RegExp(`^myplanetview/designs/${HOME_MAP}/sea-.+\\.png$`));
    expect((await presign({ contentType: 'image/gif', bytes: 10 })).message).toBe(DESIGN_MESSAGES.designPictureType);
    expect((await presign({ contentType: 'image/png', bytes: 0 })).status).toBe(400);
    expect((await presign({ contentType: 'image/png', bytes: 9 * 1024 * 1024 })).status).toBe(413);
  });

  it('saves only a picture this person presigned and sent', async () => {
    const signed = await post(`/api/maps/${HOME_MAP}/design/picture/presign`, { contentType: 'image/webp', bytes: 4 });
    expect((await put(`/api/maps/${HOME_MAP}/design/picture`, { key: signed.data.key, style: 'animated' })).message).toBe(DESIGN_MESSAGES.designPictureInvalid);
    expect((await put(`/api/maps/${HOME_MAP}/design/picture`, { key: 'myplanetview/designs/other/sea-x.png', style: 'animated' })).status).toBe(400);
    expect((await put(`/api/maps/${HOME_MAP}/design/picture`, { key: signed.data.key, style: 'nope' })).status).toBe(400);
  });

  it('needs a verified email to upload, unlike the colours', async () => {
    setVerified(false);
    expect((await post(`/api/maps/${HOME_MAP}/design/picture/presign`, { contentType: 'image/webp', bytes: 4 })).status).toBe(403);
    expect((await put(`/api/maps/${HOME_MAP}/design/picture`, { key: 'x', style: 'animated' })).status).toBe(403);
    expect((await del(`/api/maps/${HOME_MAP}/design/picture?style=animated`)).status).toBe(200);
  });
});

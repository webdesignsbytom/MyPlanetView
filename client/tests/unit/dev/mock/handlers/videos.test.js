import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { answerTus } from '@/dev/mock/stream';
import { setMockPlan } from '@/dev/mock/plans';
import { FRAN_MAP, HOME_MAP, SAM_MAP, USER, box, db, freshStore, get, polyfillBlobReads, post, registerAllRoutes, signOut, stubObjectUrls, videoBlob } from '../mockApi';

vi.mock('@/dev/mock/videoThumbnail', () => ({ makeMockThumbnails: vi.fn(async () => null) }));
polyfillBlobReads();

beforeAll(() => registerAllRoutes());
beforeEach(() => {
  freshStore();
  stubObjectUrls();
  setMockPlan(USER, 'PREMIUM', 1);
});

const file = (location = false) => videoBlob(box('ftyp', 'isom'), box('moov', location ? new Uint8Array([0xa9, 0x78, 0x79, 0x7a]) : box('mvhd', new Uint8Array(8))));
const start = (body = {}) => post(`/api/maps/${HOME_MAP}/videos/upload`, { bytes: file().size, contentType: 'video/mp4', durationS: 12, ...body });
const send = (url, blob) => answerTus('PATCH', url, { 'content-type': 'application/offset+octet-stream', 'upload-offset': '0' }, blob);

describe('starting a video upload', () => {
  it('gives a Stream upload address and a ticket on First Class', async () => {
    const { status, data } = await start({ countryCode: 'fr' });
    expect(status).toBe(200);
    expect(data.uploadUrl).toMatch(/^https:\/\/mock-stream\.myplanetview\.local\/tus\/[0-9a-f]{32}$/);
    expect(data.ticket).toMatch(/^mock-ticket-/);
    expect(Date.parse(data.expiresAt) - Date.now()).toBeGreaterThan(5 * 3600000);
  });

  it('is First Class only, and an editor’s', async () => {
    setMockPlan(USER, 'REGULAR', 1);
    expect((await start()).message).toBe('Videos are part of First Class. Upgrade this map’s owner to add them.');
    expect((await post(`/api/maps/${SAM_MAP}/videos/upload`, { bytes: 10, contentType: 'video/mp4', durationS: 5 })).status).toBe(403);
    expect((await post('/api/maps/map-tom/videos/upload', { bytes: 10, contentType: 'video/mp4', durationS: 5 })).status).toBe(404);
    expect((await post(`/api/maps/${FRAN_MAP}/videos/upload`, { bytes: 10, contentType: 'video/mp4', durationS: 5 })).status).toBe(403);
  });

  it('refuses a file too big or long, of the wrong type, or for no such country', async () => {
    expect((await start({ bytes: 501 * 1024 * 1024 })).status).toBe(413);
    expect((await start({ durationS: 181 })).message).toBe('A video can be up to 3 minutes long.');
    expect((await start({ contentType: 'video/webm' })).status).toBe(400);
    expect((await start({ bytes: 0 })).status).toBe(400);
    expect((await start({ countryCode: 'ZZ' })).status).toBe(400);
  });

  it('holds 20 videos a country', async () => {
    db().photos.push(...Array.from({ length: 20 }, (_, i) => ({ id: `v${i}`, mapId: HOME_MAP, countryCode: 'FR', kind: 'VIDEO' })));
    expect((await start({ countryCode: 'FR' })).status).toBe(409);
  });
});

describe('saving a video', () => {
  it('saves it PROCESSING, hidden from viewers until it’s READY', { timeout: 20000 }, async () => {
    const { data } = await start();
    expect((await send(data.uploadUrl, file())).status).toBe(204);
    const saved = await post(`/api/maps/${HOME_MAP}/videos`, { ticket: data.ticket, countryCode: 'FR', caption: ' Sunset ' });
    expect(saved.status).toBe(201);
    expect(saved.data.photo).toMatchObject({ kind: 'VIDEO', videoState: 'PROCESSING', countryCode: 'FR', caption: 'Sunset', durationS: 12, thumbUrl: null });
    const video = db().photos.find((p) => p.id === data.photoId);
    expect(video).toMatchObject({ latitude: null, longitude: null, image: { kind: 'stream' } });

    db().maps.find((m) => m.id === HOME_MAP).linkAccess = 'ANYONE_WITH_LINK';
    signOut();
    const viewerSees = async () => (await get('/api/shared/K7QXM2PA9RTW/photos', { limit: 60 })).data.photos.some((p) => p.id === data.photoId);
    expect(await viewerSees()).toBe(false);
    video.readyAt = new Date(Date.now() - 1).toISOString();
    expect(await viewerSees()).toBe(true);
  });

  it('refuses a video that never arrived, or whose upload was refused for holding a location', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { data } = await start({ bytes: file(true).size });
    expect((await post(`/api/maps/${HOME_MAP}/videos`, { ticket: data.ticket })).message).toBe('The video hasn’t finished uploading yet.');
    expect((await send(data.uploadUrl, file(true))).status).toBe(403);
    expect((await post(`/api/maps/${HOME_MAP}/videos`, { ticket: data.ticket })).status).toBe(400);
  });

  it('takes only a ticket made here, by this person, for this map, once', async () => {
    const { data } = await start();
    await send(data.uploadUrl, file());
    expect((await post(`/api/maps/${HOME_MAP}/videos`, { ticket: 'made-up' })).status).toBe(400);
    expect((await post(`/api/maps/${SAM_MAP}/videos`, { ticket: data.ticket })).status).toBe(400);
    expect((await post(`/api/maps/${HOME_MAP}/videos`, { ticket: data.ticket, countryCode: 'ZZ' })).status).toBe(400);
    expect((await post(`/api/maps/${HOME_MAP}/videos`, { ticket: data.ticket })).status).toBe(201);
    expect((await post(`/api/maps/${HOME_MAP}/videos`, { ticket: data.ticket })).status).toBe(400);
  });

  it('is refused by the photo upload', async () => {
    expect((await post(`/api/maps/${HOME_MAP}/photos/presign`, { kind: 'VIDEO', files: [] })).message).toBe('Videos upload through POST /maps/:mapId/videos/upload.');
  });
});

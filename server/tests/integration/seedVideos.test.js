// The seed's sample videos (prisma/seed/videos.js): the First Class account's clips, uploaded
// to (the fake) Cloudflare Stream and saved as videos. The real clips aren't in git, so this
// builds small MP4s in a temp folder: one good, one still holding a location, one too long,
// and one missing.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { cleanUp, defaultMapOf, givePlan, prisma, signUp } from './helpers.js';
import { seedDemoVideos } from '../../prisma/seed/videos.js';

const box = (type, ...parts) => {
  const body = Buffer.concat(parts);
  const header = Buffer.alloc(8);
  header.writeUInt32BE(8 + body.length, 0);
  header.write(type, 4, 'latin1');
  return Buffer.concat([header, body]);
};
const u32 = (n) => {
  const b = Buffer.alloc(4);
  b.writeUInt32BE(n);
  return b;
};
const mp4 = (seconds, ...extra) =>
  Buffer.concat([
    box('ftyp', Buffer.from('isom', 'latin1'), u32(0)),
    box('moov', box('mvhd', u32(0), u32(0), u32(0), u32(1000), u32(seconds * 1000), Buffer.alloc(80)), box('trak', box('tkhd', Buffer.alloc(76), u32(1280 * 65536), u32(720 * 65536))), ...extra),
    box('mdat', Buffer.alloc(64)),
  ]);

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'seed-videos-'));
const clip = (slug, countryCode, file) => {
  fs.mkdirSync(path.join(dir, slug));
  if (file) fs.writeFileSync(path.join(dir, slug, 'video.mp4'), file);
  return { slug, title: slug, caption: `Clip ${slug}`, countryCode, takenAt: '2019-09-24T19:25:40.000Z' };
};
const manifest = [
  clip('good', 'IT', mp4(42)),
  clip('with-location', 'IE', mp4(20, box('udta', box('\u00a9xyz', Buffer.from('+53.3498-006.2603/', 'latin1'))))),
  clip('too-long', 'EG', mp4(200)),
  clip('missing', 'MA', null),
];
fs.writeFileSync(path.join(dir, 'videos.json'), JSON.stringify(manifest));

afterAll(async () => {
  await cleanUp();
  fs.rmSync(dir, { recursive: true, force: true });
});

describe('the seed’s sample videos', () => {
  let owner;
  let map;

  beforeAll(async () => {
    owner = await signUp('SeedVideoOwner');
    await givePlan(owner.user.id, { plan: 'PREMIUM' });
    map = await defaultMapOf(owner.agent);
    expect(await seedDemoVideos({ dir, ownerEmail: owner.email })).toEqual({ videos: 1 });
  });

  it('uploads each good clip to Stream and saves it as a video, converting', async () => {
    const videos = await prisma.photo.findMany({ where: { mapId: map.id } });
    expect(videos).toHaveLength(1);
    expect(videos[0]).toMatchObject({ kind: 'VIDEO', durationS: 42, countryCode: 'IT', latitude: null, width: 1280, height: 720, videoState: 'PROCESSING' });
    expect(globalThis.__fakeStream.get(videos[0].streamUid)).toMatchObject({ meta: { photoId: videos[0].id, seed: 'good' } });
  });

  it('skips clips with a location, too long or missing', async () => {
    expect(await prisma.photo.count({ where: { mapId: map.id, countryCode: { in: ['IE', 'EG', 'MA'] } } })).toBe(0);
  });
});

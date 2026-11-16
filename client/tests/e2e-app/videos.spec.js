import { test, expect, openMap, openTool } from './fixtures.js';
import { hasLocationMarker, readVideoInfo, stripVideoLocation, VIDEO_CHECK_FAILED } from '../../src/utils/photos/videoFile.js';

// First Class videos (docs/API.md, "Videos"). The seeded test user is on Business, so
// their map refuses videos until the mock badge makes them First Class. Fran's First Class
// map ("Fran's views from orbit", src/dev/mock/seedFirstClass.js) is shared with them and
// holds four videos (the NASA clips of seed-videos/, whose files aren't in git, so they
// show the "can't play" fallback unless downloaded).

const FRAN_MAP = "Fran's views from orbit";
const LOCATION_CHECK_FAILED = VIDEO_CHECK_FAILED;

// ── MP4s built byte by byte (as server/tests/integration/seedVideos.test.js does) ─────

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
const movieBox = (seconds, ...extra) =>
  box('moov', box('mvhd', u32(0), u32(0), u32(0), u32(1000), u32(seconds * 1000), Buffer.alloc(80)), box('trak', box('tkhd', Buffer.alloc(76), u32(1280 * 65536), u32(720 * 65536))), ...extra);
const mp4 = (seconds, ...extra) => Buffer.concat([box('ftyp', Buffer.from('isom', 'latin1'), u32(0)), movieBox(seconds, ...extra), box('mdat', Buffer.alloc(64))]);
// Where a phone writes its position: the user-data ©xyz atom, and QuickTime's location key
const xyz = () => box('udta', box('©xyz', Buffer.from('+41.8902+012.4922/', 'latin1')));
const keyEntry = (name) => Buffer.concat([u32(8 + name.length), Buffer.from('mdta', 'latin1'), Buffer.from(name, 'latin1')]);
const keyedItem = (index, text) => {
  const item = box('item', box('data', u32(1), u32(0), Buffer.from(text, 'utf8')));
  item.writeUInt32BE(index, 4);
  return item;
};
const appleMeta = () =>
  box(
    'meta',
    box('hdlr', Buffer.alloc(24)),
    box('keys', u32(0), u32(2), keyEntry('com.apple.quicktime.make'), keyEntry('com.apple.quicktime.location.ISO6709')),
    box('ilst', keyedItem(1, 'Apple'), keyedItem(2, '+41.8902+012.4922+021.000/')),
  );
const asFile = (buffer, name = 'clip.mp4', type = 'video/mp4') => new File([buffer], name, { type });
const videoUpload = (name, buffer) => ({ name, mimeType: 'video/mp4', buffer });

/** A real, playable 2-second MP4, recorded by the browser from a canvas (MediaRecorder). */
async function recordMp4(page, name = 'recorded.mp4') {
  const base64 = await page.evaluate(async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 240;
    const ctx = canvas.getContext('2d');
    const recorder = new MediaRecorder(canvas.captureStream(30), { mimeType: 'video/mp4;codecs=avc1' });
    const chunks = [];
    recorder.ondataavailable = (e) => chunks.push(e.data);
    let frame = 0;
    const draw = () => {
      ctx.fillStyle = `hsl(${(frame += 9) % 360} 70% 50%)`;
      ctx.fillRect(0, 0, 320, 240);
    };
    draw();
    const timer = setInterval(draw, 33);
    recorder.start();
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const stopped = new Promise((resolve) => (recorder.onstop = resolve));
    recorder.stop();
    await stopped;
    clearInterval(timer);
    const bytes = new Uint8Array(await new Blob(chunks).arrayBuffer());
    let text = '';
    for (const b of bytes) text += String.fromCharCode(b);
    return btoa(text);
  });
  return videoUpload(name, Buffer.from(base64, 'base64'));
}

// ── The mock badge and the uploader ──────────────────────────────────────────

/** A mock badge dropdown: choosing reloads the page. */
async function chooseInBadge(page, name, label) {
  const badge = page.getByRole('complementary', { name: 'Mock mode' });
  await badge.getByRole('button', { name: 'Mock mode' }).click();
  await badge.getByRole('combobox', { name }).selectOption({ label });
  await page.waitForLoadState();
  await expect(badge.getByRole('combobox', { name })).toHaveCount(0);
}

const fileInput = (panel) => panel.getByLabel(/choose photos/i);
const countryChoice = (panel) => panel.getByRole('combobox', { name: 'Country for photos with no location' });

async function openUploader(page, country) {
  const panel = await openTool(page, 'Add photos', 'Add photos');
  if (country) await countryChoice(panel).selectOption({ label: country });
  return panel;
}

async function openCountry(page, name) {
  const list = await openTool(page, 'Country list', 'Countries');
  await list.getByRole('searchbox', { name: 'Search countries' }).fill(name.toLowerCase());
  await list.getByRole('button', { name, exact: true }).click();
  const panel = page.getByRole('dialog', { name });
  await expect(panel).toBeVisible();
  return panel;
}

test.describe('Videos', () => {
  test('a Business map takes no videos, and says so', async ({ page }) => {
    await openMap(page);
    const panel = await openUploader(page, 'Italy');
    await expect(panel.getByText('Videos are part of First Class.')).toBeVisible();
    await expect(panel.getByText(/videos of Italy on this map/)).toHaveCount(0);
    await fileInput(panel).setInputFiles(videoUpload('rome.mp4', mp4(42)));
    const item = panel.getByRole('listitem').filter({ hasText: 'rome.mp4' });
    await expect(item).toContainText('Not added');
    await expect(item).toContainText('Videos are part of First Class.');
  });

  test('on First Class a video’s location is taken out, it uploads, shows its length and opens', async ({ page }) => {
    await openMap(page);
    await chooseInBadge(page, 'Plan', 'First Class');
    await expect(page.getByRole('application', { name: /: world map$/ })).toBeVisible();
    const panel = await openUploader(page, 'Italy');
    await expect(panel.getByText('0 of 20 videos of Italy on this map.')).toBeVisible();
    // A file holding a location both ways a phone writes it. The mock bucket refuses (403)
    // a video file still holding either, so "Added" means the browser took them out.
    const original = mp4(42, xyz(), appleMeta());
    await fileInput(panel).setInputFiles(videoUpload('colosseum.mp4', original));
    const item = panel.getByRole('listitem').filter({ hasText: 'colosseum.mp4' });
    await expect(item).toContainText('Added');
    await expect(item).toContainText('Videos keep no location, so it went in Italy.');
    await expect(panel.getByText('1 of 20 videos of Italy on this map.')).toBeVisible();
    // Photos have their own cap: Italy's photos are as they were
    await expect(panel.getByText('4 of 1,000 photos of Italy on this map.')).toBeVisible();
    await panel.getByRole('button', { name: 'Close Add photos' }).click();

    // A tile with a play mark and its length; a screen reader hears "Video, 42 seconds"
    const italy = await openCountry(page, 'Italy');
    const tile = italy.getByRole('button', { name: 'Open Video, 42 seconds' });
    await expect(tile).toBeVisible();
    await expect(tile).toContainText('0:42');
    await tile.click();

    // Not a real film, so this browser can't play it: it says so and offers the file. The
    // file it offers is the cleaned one: the same size, with neither marker left.
    const viewer = page.getByRole('dialog', { name: 'Video' });
    await expect(viewer.getByText('This browser can’t play this video.')).toBeVisible();
    const download = viewer.getByRole('link', { name: 'Download to watch' });
    await expect(download).toHaveAttribute('href', /^blob:/);
    const uploaded = await download.evaluate(async (a) => Array.from(new Uint8Array(await (await fetch(a.href)).arrayBuffer())));
    expect(uploaded.length).toBe(original.length);
    expect(hasLocationMarker(Uint8Array.from(uploaded))).toBe(false);
    expect(hasLocationMarker(original)).toBe(true);
    // Its length, and no landmark tools: stamps come from photos
    await expect(viewer.getByText('0:42', { exact: true })).toBeVisible();
    await expect(viewer.getByRole('heading', { name: 'Landmarks' })).toHaveCount(0);
    await expect(viewer.getByRole('combobox', { name: 'Add a landmark' })).toHaveCount(0);
  });

  test('a playable video plays in the viewer, and plays through in the slideshow before it moves on', async ({ page }) => {
    await openMap(page);
    await chooseInBadge(page, 'Plan', 'First Class');
    await expect(page.getByRole('application', { name: /: world map$/ })).toBeVisible();
    const clip = await recordMp4(page, 'iceland.mp4');
    const panel = await openUploader(page, 'Iceland');
    await fileInput(panel).setInputFiles(clip);
    await expect(panel.getByRole('listitem').filter({ hasText: 'iceland.mp4' })).toContainText('Added');
    await panel.getByRole('button', { name: 'Close Add photos' }).click();

    const iceland = await openCountry(page, 'Iceland');
    await iceland.getByRole('button', { name: /^Open Video, 3 seconds/ }).click();
    const viewer = page.getByRole('dialog', { name: /^Video/ });
    const player = viewer.locator('video');
    await expect(player).toBeVisible();
    await expect.poll(() => player.evaluate((v) => v.videoWidth)).toBe(320);
    await expect(viewer.getByText('This browser can’t play this video.')).toHaveCount(0);
    await viewer.getByRole('button', { name: 'Close' }).click();

    // The country's slideshow, at 8 seconds a photo: the video starts muted, can be
    // unmuted, and when it ends (2 s) the show moves on without waiting for the timer
    await iceland.getByRole('button', { name: 'Slideshow of Iceland' }).click();
    const show = page.getByRole('dialog', { name: 'Slideshow: Iceland' });
    await show.getByRole('button', { name: '8 seconds a photo' }).click();
    const stage = show.locator('[data-slide-id]');
    await expect(stage).toHaveAttribute('data-slide-kind', 'photo');
    const slideVideo = stage.locator('video');
    await expect(slideVideo).toBeVisible();
    await expect.poll(() => slideVideo.evaluate((v) => v.muted)).toBe(true);
    await show.getByRole('button', { name: 'Turn the sound on' }).click();
    await expect(show.getByRole('button', { name: 'Turn the sound off' })).toBeVisible();
    await expect(show.getByText('The end')).toBeVisible({ timeout: 6000 });
  });

  test('a video over 3 minutes, or one that can’t be checked, is refused before anything uploads', async ({ page }) => {
    await openMap(page);
    await chooseInBadge(page, 'Plan', 'First Class');
    await expect(page.getByRole('application', { name: /: world map$/ })).toBeVisible();
    const panel = await openUploader(page, 'Spain');
    await fileInput(panel).setInputFiles([
      videoUpload('long.mp4', mp4(200)),
      videoUpload('broken.mp4', Buffer.concat([box('ftyp', Buffer.alloc(8)), box('mdat', Buffer.alloc(32))])),
    ]);
    const long = panel.getByRole('listitem').filter({ hasText: 'long.mp4' });
    await expect(long).toContainText('Not added');
    await expect(long).toContainText('This video is over 3 minutes long, the longest a video can be.');
    const broken = panel.getByRole('listitem').filter({ hasText: 'broken.mp4' });
    await expect(broken).toContainText(LOCATION_CHECK_FAILED);
    await expect(panel.getByText('0 of 20 videos of Spain on this map.')).toBeVisible();
  });

  test('the First Class map shared with you lists its videos, and plays or offers them', { tag: '@phone' }, async ({ page }) => {
    await openMap(page, '/maps/map-fran');
    await expect(page.getByRole('application', { name: `${FRAN_MAP}: world map` })).toBeVisible();
    const italy = await openCountry(page, 'Italy');
    const tile = italy.getByRole('button', { name: 'Open Video, 34 seconds: Northern Italy, Croatia and the Black Sea at night from the space station' });
    await expect(tile).toContainText('0:34');
    await tile.click();
    const viewer = page.getByRole('dialog', { name: 'Northern Italy, Croatia and the Black Sea at night from the space station' });
    // The clip plays once it has been downloaded into seed-videos/ (not in git); until then
    // the player fails and the fallback offers the same file
    const player = viewer.locator('video');
    const fallback = viewer.getByText('This browser can’t play this video.');
    // (evaluateAll doesn't wait for a player the fallback has just replaced)
    const playing = () => player.evaluateAll((videos) => videos.some((v) => v.videoWidth > 0));
    await expect.poll(async () => (await fallback.count()) > 0 || (await playing())).toBe(true);
    const file = /\/seed-videos\/over-western-europe-at-night\/video\.mp4$/;
    if (await fallback.count()) await expect(viewer.getByRole('link', { name: 'Download to watch' })).toHaveAttribute('href', file);
    else await expect(player).toHaveAttribute('src', file);
    // A viewer can't change it
    await expect(viewer.getByRole('button', { name: 'Edit' })).toHaveCount(0);
  });
});

// ── The cleaner itself, in Node (no browser): src/utils/photos/videoFile.js ────────────

test.describe('Video files', () => {
  test('the location is overwritten in place, wherever the movie box is', async () => {
    for (const [name, buffer] of [
      ['movie box first', mp4(20, xyz(), appleMeta())],
      ['movie box last', Buffer.concat([box('ftyp', Buffer.alloc(8)), box('mdat', Buffer.alloc(40)), movieBox(20, xyz(), appleMeta())])],
    ]) {
      const cleaned = Buffer.from(await (await stripVideoLocation(asFile(buffer))).arrayBuffer());
      expect(cleaned.length, name).toBe(buffer.length);
      expect(hasLocationMarker(cleaned), name).toBe(false);
      // The coordinates are gone; the camera's make is kept
      expect(cleaned.includes(Buffer.from('+41.8902')), name).toBe(false);
      expect(cleaned.includes(Buffer.from('Apple')), name).toBe(true);
      // Nothing outside the metadata changed (mdat, mvhd)
      expect(await readVideoInfo(asFile(cleaned))).toMatchObject({ durationS: 20, width: 1280, height: 720 });
    }
  });

  test('a file it can’t check is refused: no movie box, a broken box, or a location it can’t reach', async () => {
    const noMovie = Buffer.concat([box('ftyp', Buffer.alloc(8)), box('mdat', Buffer.alloc(16))]);
    const broken = mp4(10);
    broken.writeUInt32BE(9999, 0);
    // A location key in a timed metadata track's description: the values are in mdat
    const timed = mp4(10, box('trak', box('mdia', box('minf', box('stbl', Buffer.from('com.apple.quicktime.location.ISO6709', 'latin1'))))));
    for (const buffer of [noMovie, broken, timed]) {
      await expect(stripVideoLocation(asFile(buffer))).rejects.toThrow(VIDEO_CHECK_FAILED);
    }
  });

  test('its length is rounded up to whole seconds, and an upright phone video is upright', async () => {
    const upright = Buffer.concat([
      box('ftyp', Buffer.alloc(8)),
      box(
        'moov',
        box('mvhd', u32(0), u32(0), u32(0), u32(600), u32(600 * 61 + 30), Buffer.alloc(80)),
        // A quarter turn: a = 0, b = 1, c = -1, d = 0 (16.16), w = 1 (2.30)
        box('trak', box('tkhd', Buffer.alloc(40), Buffer.from([0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0xff, 0xff, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0x40, 0, 0, 0]), u32(1920 * 65536), u32(1080 * 65536))),
      ),
    ]);
    expect(await readVideoInfo(asFile(upright, 'phone.mov', 'video/quicktime'))).toMatchObject({ durationS: 62, width: 1080, height: 1920 });
  });
});

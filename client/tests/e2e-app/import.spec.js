import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { test, expect, goInApp, makeJpeg, openMap, openTool } from './fixtures.js';

// Importing from Polarsteps (docs/API.md "Importing from Polarsteps"; 21 Nov 2026, the user's
// wish). A download shaped as Polarsteps' is (every trip a folder with trip.json, every step a
// folder ending in its id with photos/ and videos/), zipped here, chosen on /import, read in
// the browser, then brought to the test user's map: trips, photos and step stories. Run again,
// nothing comes twice.

/** A zip of `[{ name, data }]`: JSON deflated, the rest stored (as zip tools do with photos). */
function zip(files) {
  const parts = [];
  const central = [];
  let offset = 0;
  for (const { name, data } of files) {
    const nameBytes = Buffer.from(name, 'utf8');
    const deflate = name.endsWith('.json');
    const body = deflate ? zlib.deflateRawSync(data) : data;
    const crc = zlib.crc32(data);
    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50, 0);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(0x0800, 6);
    header.writeUInt16LE(deflate ? 8 : 0, 8);
    header.writeUInt32LE(crc, 14);
    header.writeUInt32LE(body.length, 18);
    header.writeUInt32LE(data.length, 22);
    header.writeUInt16LE(nameBytes.length, 26);
    parts.push(header, nameBytes, body);
    const entry = Buffer.alloc(46);
    entry.writeUInt32LE(0x02014b50, 0);
    entry.writeUInt16LE(20, 4);
    entry.writeUInt16LE(20, 6);
    entry.writeUInt16LE(0x0800, 8);
    entry.writeUInt16LE(deflate ? 8 : 0, 10);
    entry.writeUInt32LE(crc, 16);
    entry.writeUInt32LE(body.length, 20);
    entry.writeUInt32LE(data.length, 24);
    entry.writeUInt16LE(nameBytes.length, 28);
    entry.writeUInt32LE(offset, 42);
    central.push(entry, nameBytes);
    offset += 30 + nameBytes.length + body.length;
  }
  const directory = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(directory.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...parts, directory, end]);
}

const seconds = (iso) => Date.parse(iso) / 1000;
const step = (id, name, countryCode, when, description, location = {}) => ({
  id,
  name,
  display_name: name,
  slug: name.toLowerCase(),
  description,
  start_time: seconds(when),
  end_time: null,
  timezone_id: 'Europe/London',
  location: { name, detail: countryCode, country_code: countryCode, lat: 64.14, lon: -21.94, ...location },
});

async function polarstepsZip(page) {
  const photo = (await makeJpeg(page, { name: 'a.jpg' })).buffer;
  const iceland = {
    id: 111,
    name: 'Iceland 2019',
    slug: 'iceland-2019',
    start_date: seconds('2019-06-01T09:00:00Z'),
    end_date: seconds('2019-06-05T18:00:00Z'),
    timezone_id: 'Atlantic/Reykjavik',
    all_steps: [
      step(9001, 'Reykjavik', 'IS', '2019-06-01T12:00:00Z', 'First night in the land of fire and ice.'),
      step(9002, 'Vik', 'IS', '2019-06-03T12:00:00Z', null, { lat: 63.42, lon: -19.0 }),
    ],
  };
  const scotland = {
    id: 222,
    name: 'Highlands',
    slug: 'highlands',
    start_date: seconds('2021-08-10T09:00:00Z'),
    end_date: seconds('2021-08-14T18:00:00Z'),
    timezone_id: 'Europe/London',
    all_steps: [step(9101, 'Edinburgh', 'GB', '2021-08-10T12:00:00Z', 'Fringe festival, every street a stage.', { lat: 55.95, lon: -3.19 })],
  };
  const json = (value) => Buffer.from(JSON.stringify(value));
  const files = [
    { name: 'user_data/user/user.json', data: json({ first_name: 'Charlie' }) },
    { name: 'user_data/trip/iceland-2019_111/trip.json', data: json(iceland) },
    { name: 'user_data/trip/iceland-2019_111/locations.json', data: json({ locations: [] }) },
    { name: 'user_data/trip/iceland-2019_111/reykjavik_9001/photos/0001.jpg', data: photo },
    { name: 'user_data/trip/iceland-2019_111/vik_9002/photos/0002.jpg', data: photo },
    { name: 'user_data/trip/iceland-2019_111/vik_9002/videos/0003.mp4', data: Buffer.from('not really a video') },
    { name: 'user_data/trip/highlands_222/trip.json', data: json(scotland) },
    { name: 'user_data/trip/highlands_222/edinburgh_9101/photos/0004.jpg', data: photo },
  ];
  return { files, download: { name: 'user_data.zip', mimeType: 'application/zip', buffer: zip(files) } };
}

test('a Polarsteps download’s trips, photos and stories come to the map, once', async ({ page }) => {
  await page.goto('/import');
  await expect(page.getByRole('heading', { level: 1, name: 'Bring your travels from Polarsteps' })).toBeVisible();
  const { download } = await polarstepsZip(page);
  await page.locator('[data-import-zip]').setInputFiles(download);

  // What's in it, oldest first, all chosen
  const choose = page.getByRole('region', { name: 'What to bring' });
  await expect(choose.locator('[data-import-trip]')).toHaveCount(2);
  await expect(choose.locator('[data-import-trip="Iceland 2019"]')).toContainText('1 country · 2 photos · 1 story');
  await expect(choose.getByText('1 video can’t come')).toBeVisible();
  await expect(choose.getByRole('combobox', { name: 'Bring them to' })).toHaveValue('map-home');
  await choose.getByRole('button', { name: 'Bring 2 trips to the map' }).click();

  const progress = page.locator('[data-import-stage]');
  await expect(progress).toHaveAttribute('data-import-stage', 'done', { timeout: 60_000 });
  await expect(progress).toContainText('Trips: 2 trips of 2');
  await expect(progress).toContainText('Photos: 3 photos of 3');
  await expect(progress).toContainText('Stories: 2 of 2');

  // On the map: the trips, Iceland visited
  await page.getByRole('link', { name: 'Open the map' }).click();
  await expect(page.getByRole('application', { name: /: world map$/ })).toBeVisible();
  const trips = await openTool(page, 'Trips', 'Trips');
  await expect(trips.getByText('Iceland 2019')).toBeVisible();
  await expect(trips.getByText('Highlands')).toBeVisible();

  // Again (in the same visit: mock mode's uploads last only as long as the page): nothing new
  await goInApp(page, '/import');
  await page.locator('[data-import-zip]').setInputFiles(download);
  await page.getByRole('region', { name: 'What to bring' }).getByRole('button', { name: 'Bring 2 trips to the map' }).click();
  await expect(progress).toHaveAttribute('data-import-stage', 'done', { timeout: 60_000 });
  await expect(progress).toContainText('2 were there already');
  await expect(progress).toContainText('Photos: 0 photos of 3, 3 there already');
});

test('something that isn’t a Polarsteps download says so', async ({ page }) => {
  await page.goto('/import');
  await page.locator('[data-import-zip]').setInputFiles({ name: 'holiday.zip', mimeType: 'application/zip', buffer: zip([{ name: 'notes.txt', data: Buffer.from('hello') }]) });
  await expect(page.getByText('No Polarsteps trips were found in that.')).toBeVisible();
  await page.locator('[data-import-zip]').setInputFiles({ name: 'broken.zip', mimeType: 'application/zip', buffer: Buffer.from('not a zip at all') });
  await expect(page.getByText('That file isn’t a zip, or it’s damaged.')).toBeVisible();
});

test('the unzipped folder works as the zip does', async ({ page }, testInfo) => {
  await page.goto('/import');
  const { files } = await polarstepsZip(page);
  const folder = testInfo.outputPath('polarsteps');
  for (const file of files) {
    const target = path.join(folder, ...file.name.split('/'));
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, file.data);
  }
  await page.locator('[data-import-folder]').setInputFiles(folder);
  const choose = page.getByRole('region', { name: 'What to bring' });
  await expect(choose.locator('[data-import-trip="Highlands"]')).toContainText('1 country · 1 photo · 1 story');
  await expect(choose.locator('[data-import-trip="Iceland 2019"]')).toContainText('2 photos');
});

test('Settings links a map to the import', async ({ page }) => {
  await openMap(page);
  const settings = await openTool(page, 'Map settings', 'Settings');
  await settings.getByRole('tab', { name: 'This map' }).click();
  const link = settings.getByRole('link', { name: 'Bring trips from Polarsteps' });
  // The same size as the buttons around it (24 Nov 2026, the user's report: it was bigger)
  const height = async (control) => (await control.boundingBox()).height;
  const download = settings.getByRole('button', { name: 'Download or print photos' });
  const bring = settings.getByRole('button', { name: 'Choose travels to bring' });
  expect(Math.abs((await height(link)) - (await height(download)))).toBeLessThan(1);
  expect(Math.abs((await height(link)) - (await height(bring)))).toBeLessThan(1);
  await link.click();
  await expect(page).toHaveURL(/\/import\?map=map-home$/);
});

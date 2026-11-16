import fs from 'node:fs';
import { test, expect } from './fixtures.js';

// The admin's travel offers page (docs/API.md, "Travel offers") against mock mode, signed
// in as the mock admin. The seed has the server's 29 example offers
// (server/prisma/seed/data/offers.example.json) and a few clicks: Hotels in Spain 3 from
// galleries and 1 from the Travel Desk, Hotels in Japan 2 from galleries and 1 from a
// slideshow. "Summer sale: 20% off stays in Spain" is off.

const IMPORT_REFUSED = 'Nothing was imported: fix the offers listed and try again.';

/** The page, signed in as an admin (mock mode's ?mockRole), once the list has loaded. */
async function openOffers(page) {
  await page.goto('/admin/offers?mockRole=ADMIN');
  await expect(page.getByRole('heading', { level: 1, name: 'Travel Offers' })).toBeVisible();
  await expect(offerList(page).getByRole('article').first()).toBeVisible();
}

const offerList = (page) => page.getByRole('region', { name: 'List of offers' });
const offerRow = (page, title) => page.getByRole('article', { name: title, exact: true });
const offerCount = (page, text) => expect(offerList(page).getByText(text, { exact: true })).toBeVisible();
const fileInput = (page) => page.getByLabel('Choose an import file (.json)');
const jsonFile = (payload, name = 'offers.json') => ({
  name,
  mimeType: 'application/json',
  buffer: Buffer.from(typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2)),
});

test.describe('Travel offers (admin)', () => {
  test('the list shows the example offers with their clicks, and filters them', { tag: '@phone' }, async ({ page }) => {
    await openOffers(page);
    await offerCount(page, '29 offers');
    await expect(offerList(page).getByRole('article')).toHaveCount(29);

    const spain = offerRow(page, 'Hotels in Spain');
    await expect(spain).toContainText('Example Stays · Hotels');
    await expect(spain).toContainText('example-stays-es');
    await expect(spain.getByText('On', { exact: true })).toBeVisible();
    await expect(spain.locator('dl').first()).toContainText(/Country\s*Spain/);
    await expect(spain.locator('dl').first()).toContainText(/Weight\s*3/);
    // 4 clicks: per place, and per day as bars (most on one day: all 4 came yesterday)
    await expect(spain).toContainText(/Clicks, 30 days\s*4/);
    await expect(spain.locator('dl').nth(1)).toHaveText(/Photo galleries\s*3\s*End of a slideshow\s*0\s*Country pages\s*0\s*Travel Desk\s*1/);
    await expect(spain.getByRole('img', { name: /^Clicks per day, .+ to .+: most on .+, 4 clicks\.$/ })).toBeVisible();
    await spain.getByText('Clicks by day').click();
    await expect(spain.getByRole('listitem')).toHaveText([/: 4 clicks$/]);

    const japan = offerRow(page, 'Hotels in Japan');
    await expect(japan).toContainText(/Clicks, 30 days\s*3/);
    await expect(japan.locator('dl').nth(1)).toHaveText(/Photo galleries\s*2\s*End of a slideshow\s*1/);

    // A general offer: no country, no picture (its kind is drawn), no clicks
    const flights = offerRow(page, 'Cheap flights, anywhere');
    await expect(flights.locator('dl').first()).toContainText(/Country\s*Anywhere/);
    await expect(flights).toContainText('No clicks in the last 30 days.');
    await expect(offerRow(page, 'Summer sale: 20% off stays in Spain').getByText('Off', { exact: true })).toBeVisible();

    // Filters
    const filters = page.getByRole('search', { name: 'Filter offers' });
    await filters.getByRole('combobox', { name: 'Kind' }).selectOption({ label: 'Tours and tickets' });
    await offerCount(page, 'Showing 10 of 29 offers');
    await filters.getByRole('combobox', { name: 'Kind' }).selectOption({ label: 'Every kind' });
    await filters.getByRole('combobox', { name: 'Country' }).selectOption({ label: 'Anywhere (general offers)' });
    await offerCount(page, 'Showing 5 of 29 offers');
    await filters.getByRole('combobox', { name: 'Country' }).selectOption({ label: 'Every country' });
    await filters.getByRole('combobox', { name: 'State' }).selectOption({ label: 'Off' });
    await offerCount(page, 'Showing 1 of 29 offers');
    await expect(offerRow(page, 'Summer sale: 20% off stays in Spain')).toBeVisible();
    await filters.getByRole('combobox', { name: 'State' }).selectOption({ label: 'Any' });
    await filters.getByRole('searchbox', { name: 'Search offers' }).fill('iceland');
    await offerCount(page, 'Showing 2 of 29 offers');
  });

  test('an admin makes an offer, changes it, turns it off and deletes it', async ({ page }) => {
    await openOffers(page);

    await page.getByRole('button', { name: 'New offer', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'New offer' });
    await dialog.getByRole('textbox', { name: 'Key', exact: true }).fill('test-stays-lisbon');
    await dialog.getByRole('textbox', { name: 'Partner', exact: true }).fill('Test Stays');
    await dialog.getByRole('textbox', { name: 'Title', exact: true }).fill('Hotels in Lisbon');
    await dialog.getByRole('combobox', { name: 'Country' }).selectOption({ label: 'Portugal' });
    await dialog.getByRole('checkbox', { name: /^End of a slideshow/ }).uncheck();
    await dialog.getByRole('checkbox', { name: /^Country pages/ }).uncheck();
    await dialog.getByRole('button', { name: 'Use Portugal’s poster' }).click();
    await expect(dialog.getByRole('textbox', { name: 'Picture (optional)' })).toHaveValue('visitCountryPosters/pt-800.avif');
    await dialog.getByRole('spinbutton', { name: 'Weight (1 to 100)' }).fill('4');

    // Only https links
    const link = dialog.getByRole('textbox', { name: 'Partner’s link' });
    await link.fill('http://www.example.com/lisbon?q={destination}');
    await dialog.getByRole('button', { name: 'Make offer' }).click();
    await expect(dialog.getByText('The link must start with https://.')).toBeVisible();
    await link.fill('https://www.example.com/lisbon?q={destination}&from={checkin}');

    // The card's sketch, and where a click would go
    const preview = dialog.getByRole('complementary', { name: 'Preview' });
    await expect(preview).toContainText('Test Stays');
    await expect(preview).toContainText('Hotels in Lisbon');
    await expect(preview).toContainText('Ad');
    await expect(preview).toContainText('https://www.example.com/lisbon?q=Portugal&from=2027-04-02');

    await dialog.getByRole('button', { name: 'Make offer' }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByText('Hotels in Lisbon is made (test-stays-lisbon).')).toBeVisible();
    await offerCount(page, '30 offers');
    const row = offerRow(page, 'Hotels in Lisbon');
    await expect(row.getByText('On', { exact: true })).toBeVisible();
    await expect(row.locator('dl').first()).toHaveText(
      /Country\s*Portugal\s*Shows on\s*Photo galleries, Travel Desk\s*Weight\s*4\s*Dates\s*Always/,
    );
    await expect(row).toContainText('No clicks in the last 30 days.');

    // A key that's taken
    await page.getByRole('button', { name: 'New offer', exact: true }).click();
    await dialog.getByRole('textbox', { name: 'Key', exact: true }).fill('example-stays-es');
    await dialog.getByRole('textbox', { name: 'Partner', exact: true }).fill('Someone');
    await dialog.getByRole('textbox', { name: 'Title', exact: true }).fill('Again');
    await dialog.getByRole('textbox', { name: 'Partner’s link' }).fill('https://www.example.com/');
    await dialog.getByRole('button', { name: 'Make offer' }).click();
    await expect(dialog.getByText('An offer with that key already exists.')).toBeVisible();
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog).toBeHidden();

    // Changed: its key can't be
    await row.getByRole('button', { name: 'Change Hotels in Lisbon' }).click();
    const change = page.getByRole('dialog', { name: 'Change Hotels in Lisbon' });
    await expect(change.getByRole('textbox', { name: 'Key', exact: true })).toHaveCount(0);
    await expect(change).toContainText('Key: test-stays-lisbon.');
    await change.getByRole('textbox', { name: 'Title', exact: true }).fill('Stays in Lisbon');
    await change.getByRole('spinbutton', { name: 'Weight (1 to 100)' }).fill('6');
    await change.getByLabel('Last day (optional)').fill('2030-12-31');
    await change.getByRole('button', { name: 'Save changes' }).click();
    await expect(change).toBeHidden();
    const changed = offerRow(page, 'Stays in Lisbon');
    await expect(changed.locator('dl').first()).toContainText(/Weight\s*6\s*Dates\s*Until 31 Dec 2030/);

    // Off: no card shows it; its counts stay
    await changed.getByRole('button', { name: 'Turn off Stays in Lisbon' }).click();
    await expect(page.getByText('Stays in Lisbon is off: it’s on no card and not on the Travel Desk. Its click counts are kept.')).toBeVisible();
    await expect(changed.getByText('Off', { exact: true })).toBeVisible();
    await expect(changed.getByRole('button', { name: 'Turn on Stays in Lisbon' })).toBeVisible();

    // Deleted, after saying its counts go too
    await changed.getByRole('button', { name: 'Delete Stays in Lisbon' }).click();
    const confirm = page.getByRole('dialog', { name: 'Delete Stays in Lisbon?' });
    await expect(confirm).toContainText('This deletes the offer and its click counts');
    await confirm.getByRole('button', { name: 'Delete offer and counts' }).click();
    await expect(confirm).toBeHidden();
    await expect(changed).toHaveCount(0);
    await offerCount(page, '29 offers');
  });

  test('an import with a bad offer changes nothing; fixed, it makes them, and again it updates them', async ({ page }) => {
    await openOffers(page);
    const card = page.getByRole('region', { name: 'Import and export' });

    // Not JSON at all
    await fileInput(page).setInputFiles(jsonFile('{ "offers": [ { "key": "x", } ] }'));
    await expect(card.getByRole('alert')).toContainText('offers.json isn’t a JSON file we can read.');

    const walking = {
      key: 'test-import-walks',
      partner: 'Test Walks',
      kind: 'TOUR',
      title: 'Walking tours in Lisbon',
      countryCode: 'PT',
      placements: ['GALLERY', 'COUNTRY_PAGE'],
      url: 'https://www.example.com/walks?q={destination}',
      weight: 5,
    };
    const data = {
      key: 'test-import-data',
      partner: 'Test Data',
      kind: 'ESIM',
      title: 'Data abroad',
      placements: ['TRAVEL_DESK'],
      url: 'http://www.example.com/data',
    };

    // Offer 2's link isn't https: nothing is imported
    await fileInput(page).setInputFiles(jsonFile({ offers: [walking, data] }));
    await expect(card.getByText('offers.json holds 2 offers: 2 new, 0 to update.')).toBeVisible();
    await card.getByRole('button', { name: 'Import 2 offers' }).click();
    await expect(card.getByRole('alert')).toContainText(IMPORT_REFUSED);
    await expect(card.getByRole('list', { name: 'Problems in the file' }).getByRole('listitem')).toHaveText([
      'Offer 2 (test-import-data): the link must start with https://',
    ]);
    await offerCount(page, '29 offers');
    await expect(offerRow(page, 'Walking tours in Lisbon')).toHaveCount(0);

    // Fixed: both are made
    data.url = 'https://www.example.com/data?country={country}';
    await fileInput(page).setInputFiles(jsonFile({ offers: [walking, data] }));
    await expect(card.getByText('offers.json holds 2 offers: 2 new, 0 to update.')).toBeVisible();
    await card.getByRole('button', { name: 'Import 2 offers' }).click();
    await expect(card.getByText('Imported: 2 offers made.')).toBeVisible();
    await offerCount(page, '31 offers');
    await expect(offerRow(page, 'Walking tours in Lisbon').locator('dl').first()).toContainText(/Country\s*Portugal[\s\S]*Weight\s*5/);
    await expect(offerRow(page, 'Data abroad')).toContainText('Test Data · eSIMs');
    await expect(offerRow(page, 'Data abroad').locator('dl').first()).toContainText(/Country\s*Anywhere/);

    // Again, changed: matched by key, so updated. The weight left out goes back to 1
    const { weight: _weight, ...walkingAgain } = { ...walking, title: 'Walking tours in Lisbon and Porto' };
    await fileInput(page).setInputFiles(jsonFile({ offers: [walkingAgain, data] }, 'offers-again.json'));
    await expect(card.getByText('offers-again.json holds 2 offers: 0 new, 2 to update.')).toBeVisible();
    await expect(card).toContainText(/To update\s*test-import-walks, test-import-data/);
    await card.getByRole('button', { name: 'Import 2 offers' }).click();
    await expect(card.getByText('Imported: 2 offers updated.')).toBeVisible();
    await offerCount(page, '31 offers');
    await expect(offerRow(page, 'Walking tours in Lisbon')).toHaveCount(0);
    await expect(offerRow(page, 'Walking tours in Lisbon and Porto').locator('dl').first()).toContainText(/Weight\s*1/);
  });

  test('export downloads the offers as an import file, which imports back', async ({ page }) => {
    await openOffers(page);
    const card = page.getByRole('region', { name: 'Import and export' });

    const downloading = page.waitForEvent('download');
    await card.getByRole('button', { name: 'Download the offers (.json)' }).click();
    const download = await downloading;
    expect(download.suggestedFilename()).toMatch(/^offers-\d{4}-\d{2}-\d{2}\.json$/);
    const text = fs.readFileSync(await download.path(), 'utf8');
    const file = JSON.parse(text);
    expect(file.offers).toHaveLength(29);
    // Every field an import takes, and nothing the server makes (ids, dates, clicks)
    expect(file.offers.find((o) => o.key === 'example-stays-summer-sale')).toEqual({
      key: 'example-stays-summer-sale',
      partner: 'Example Stays',
      kind: 'HOTEL',
      title: 'Summer sale: 20% off stays in Spain',
      blurb: 'An ended promotion, kept switched off.',
      countryCode: 'ES',
      placements: ['GALLERY', 'TRAVEL_DESK'],
      url: 'https://www.example.com/stays/summer-sale?ref=myplanetview-example',
      imageKey: 'visitCountryPosters/es-800.avif',
      weight: 1,
      active: false,
      startsAt: null,
      endsAt: null,
    });

    // Imported back as it is: every offer updated, none made
    await fileInput(page).setInputFiles({ name: download.suggestedFilename(), mimeType: 'application/json', buffer: Buffer.from(text) });
    await expect(card.getByText(/holds 29 offers: 0 new, 29 to update\.$/)).toBeVisible();
    await card.getByRole('button', { name: 'Import 29 offers' }).click();
    await expect(card.getByText('Imported: 29 offers updated.')).toBeVisible();
    await offerCount(page, '29 offers');
    await expect(offerRow(page, 'Summer sale: 20% off stays in Spain').getByText('Off', { exact: true })).toBeVisible();
  });

  test('someone who isn’t an admin can’t open the page', async ({ page }) => {
    await page.goto('/admin/offers');
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', { name: 'Travel Offers' })).toHaveCount(0);
  });
});

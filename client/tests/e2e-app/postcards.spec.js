import fs from 'node:fs';
import { test, expect, MOCK_STORE_KEY, makeJpeg, openMap, openTool, signOut } from './fixtures.js';

// Postcards (26 Nov 2026, the user's wish: "while you're on a trip you can send a post card. With
// a message, selection of images, and a selection of styles. Or upload your own photo. Cool stamps
// and address area. You send them with a share link. They are not part of the map. And people can
// download them so they keep them forever"; docs/API.md "Postcards"). From a place's ticket, an
// editor sends a card by a link of its own; a country's card is free, a landmark's or one from your
// own photo on a paid plan (the seeded test user pays for Business). Whoever opens the link sees
// the card, turns it over and downloads both sides. The seed has two: France's (PST2-CRD8-FRNC, to
// Gran) and the Colosseum's (PST2-CRD8-RMEC, to Sam).

const CODE_LINK = /\/postcard\/[2-9A-Z]{4}-[2-9A-Z]{4}-[2-9A-Z]{4}$/;
// The drawing's code holds the little 3D models' list: on the dev server that's about 1,800 small
// modules the first time, so a card can take a while to draw (a built site has them in one file)
const DRAWN = { timeout: 45_000 };

/** Press one of the maker's radio cards (the radio itself is hidden: its card is what's seen). */
async function choose(maker, attribute, value) {
  await maker.locator(`[data-postcard-${attribute}="${value}"]`).click();
  await expect(maker.locator(`[data-postcard-${attribute}="${value}"] input`)).toBeChecked();
}

/** The card's page has opened, and its card is drawn. */
async function cardOpened(page, title) {
  await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
  await expect(page.locator('[data-postcard-view]')).toHaveAttribute('data-postcard-drawn', 'true', DRAWN);
}

/** A PNG's width and height, from its header. */
const pngSize = (buffer) => ({ signature: buffer.subarray(1, 4).toString('ascii'), width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) });

/** Open a place's ticket from the country list, then its "Send a postcard". -> the maker dialog */
async function openMaker(page, country) {
  await openMap(page);
  const list = await openTool(page, 'Country list', 'Countries');
  await list.getByRole('searchbox', { name: 'Search countries' }).fill(country.toLowerCase());
  await list.getByRole('button', { name: country, exact: true }).click();
  const ticket = page.getByRole('dialog', { name: country });
  await ticket.getByRole('button', { name: 'Send a postcard' }).click();
  const maker = page.getByRole('dialog', { name: `Send a postcard from ${country}` });
  await expect(maker).toBeVisible();
  return maker;
}

/** Send the maker's card with its message and who it's to. -> the card's link */
async function sendIt(page, maker, { message, to }) {
  await maker.getByRole('textbox', { name: 'Your message' }).fill(message);
  if (to) await maker.getByRole('textbox', { name: 'To' }).fill(to);
  await maker.getByRole('button', { name: 'Send the postcard' }).click();
  await expect(maker.getByRole('status').first()).toContainText('Your postcard is ready');
  const link = await maker.locator('[data-postcard-link]').inputValue();
  expect(link).toMatch(CODE_LINK);
  return link;
}

test.describe('Postcards', () => {
  test('an editor sends a country’s card from its ticket, and whoever has the link turns it over and keeps it', { tag: '@phone' }, async ({ page }) => {
    const maker = await openMaker(page, 'France');
    // The country's own card to start with, and a preview of it, drawn
    await expect(maker.locator('[data-postcard-kind="COUNTRY"] input')).toBeChecked();
    await expect(maker.locator('[data-postcard-drawn="true"]')).toBeVisible(DRAWN);
    await choose(maker, 'style', 'airmail');
    // Writing turns the preview over to its back
    await maker.getByRole('textbox', { name: 'Your message' }).fill('Bonjour!');
    await expect(maker.locator('[data-postcard-view]')).toHaveAttribute('data-postcard-side', 'back');
    await expect(maker.getByText('8 of 400 characters')).toBeVisible();
    await maker.getByRole('button', { name: 'Turn it over to see the front' }).click();
    await expect(maker.locator('[data-postcard-view]')).toHaveAttribute('data-postcard-side', 'front');

    const link = await sendIt(page, maker, { message: 'Bonjour from Paris!\nThe croissants are as good as you said.', to: 'Gran' });
    await expect(maker.getByRole('link', { name: 'Open your postcard to Gran (opens in a new tab)' })).toHaveAttribute('target', '_blank');
    await expect(maker.getByText('It isn’t part of your map.', { exact: false })).toBeVisible();
    await maker.getByRole('button', { name: 'Done' }).click();
    await expect(maker).toBeHidden();

    // Someone with the link, not signed in
    await signOut(page);
    await page.goto(new URL(link).pathname);
    await cardOpened(page, 'A postcard from France');
    await expect(page.getByText(/^To Gran · from Charlie · /)).toBeVisible();
    const view = page.locator('[data-postcard-view]');
    await expect(page.getByRole('img', { name: /Greetings from France/ })).toBeVisible();
    await page.getByRole('button', { name: 'Turn it over to see the back' }).click();
    await expect(view).toHaveAttribute('data-postcard-side', 'back');
    await expect(page.getByRole('img', { name: /The message: “Bonjour from Paris!/ })).toBeVisible();

    // Both sides download as the pictures they are: 1200 × 800 PNGs
    for (const side of ['front', 'back']) {
      const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('link', { name: `Download the ${side}` }).click()]);
      expect(download.suggestedFilename()).toBe(`a-postcard-from-france-${side}.png`);
      expect(pngSize(fs.readFileSync(await download.path()))).toEqual({ signature: 'PNG', width: 1200, height: 800 });
    }
    await expect(page.getByRole('link', { name: 'Make your own travel map, free' })).toBeVisible();
  });

  test('on a paid plan, a landmark’s card and one from your own photo', async ({ page }) => {
    let maker = await openMaker(page, 'France');
    await choose(maker, 'kind', 'LANDMARK');
    await maker.getByRole('combobox', { name: 'Which landmark?' }).selectOption({ label: 'Eiffel Tower' });
    let link = await sendIt(page, maker, { message: 'We went up to the very top.', to: 'Sam' });
    await page.goto(new URL(link).pathname);
    await cardOpened(page, 'A postcard from Eiffel Tower');

    // One of the place's photos on the map
    maker = await openMaker(page, 'France');
    await choose(maker, 'kind', 'PHOTO');
    await maker.locator('[data-postcard-photo="photo-eiffel"]').click();
    await expect(maker.locator('[data-postcard-own-photo]')).toBeVisible();
    await expect(maker.locator('[data-postcard-photo="photo-eiffel"]')).toHaveAttribute('aria-pressed', 'true');
    link = await sendIt(page, maker, { message: 'Our photo from the river.' });
    await maker.getByRole('button', { name: 'Send another' }).click();

    // ...or one from the device
    await choose(maker, 'kind', 'PHOTO');
    await maker.locator('[data-postcard-file]').setInputFiles(await makeJpeg(page, { name: 'holiday.jpg' }));
    await expect(maker.locator('[data-postcard-own-photo]')).toBeVisible();
    await sendIt(page, maker, { message: 'One from my phone.' });

    // The card shows the photo (this session still has the upload)
    await page.goto(new URL(link).pathname);
    await cardOpened(page, 'A postcard from France');
  });

  test('on Economy, a landmark’s card and your own photo’s are locked, and say which plans have them', async ({ page }) => {
    // The store is saved once mock mode has started on a page
    await openMap(page);
    await page.evaluate((key) => {
      const db = JSON.parse(localStorage.getItem(key));
      db.subscriptions = db.subscriptions.filter((s) => s.userId !== 'mock-user');
      localStorage.setItem(key, JSON.stringify(db));
    }, MOCK_STORE_KEY);
    const maker = await openMaker(page, 'France');
    await expect(maker.locator('[data-postcard-kind="LANDMARK"] input')).toBeDisabled();
    await expect(maker.locator('[data-postcard-kind="PHOTO"] input')).toBeDisabled();
    await expect(maker.getByText('Postcards of landmarks and of your own photos come with Business and First Class.')).toBeVisible();
    await expect(maker.getByRole('link', { name: 'See the plans' })).toBeVisible();
    // A country's card is still free
    await sendIt(page, maker, { message: 'Free postcards for everyone.' });
  });

  test('the account page lists the cards sent, gives one a new link and deletes one, each asked first', async ({ page }) => {
    await page.goto('/account');
    await expect(page.getByRole('heading', { name: 'Postcards you sent' })).toBeVisible();
    const rome = page.locator('[data-postcard-row="postcard-rome"]');
    const france = page.locator('[data-postcard-row="postcard-france"]');
    // Newest first
    await expect(page.locator('[data-postcard-row]').first()).toHaveAttribute('data-postcard-row', 'postcard-rome');
    await expect(rome).toContainText('A postcard from Colosseum');
    await expect(rome).toContainText('To Sam');
    await expect(france.getByRole('textbox', { name: 'Link to your postcard to Gran' })).toHaveValue(/\/postcard\/PST2-CRD8-FRNC$/);

    await france.getByRole('button', { name: 'New link for your postcard to Gran' }).click();
    await france.getByRole('button', { name: 'Make a new link' }).click();
    await expect(france.getByRole('status')).toHaveText('A new link is ready. The old one no longer works.');
    await expect(france.getByRole('textbox', { name: 'Link to your postcard to Gran' })).not.toHaveValue(/PST2-CRD8-FRNC$/);

    await rome.getByRole('button', { name: 'Delete your postcard to Sam' }).click();
    await expect(rome.getByText('Anyone who downloaded it keeps their copy.', { exact: false })).toBeVisible();
    await rome.getByRole('button', { name: 'Delete it' }).click();
    await expect(rome).toHaveCount(0);

    // Both old links find nothing now
    for (const code of ['PST2-CRD8-FRNC', 'PST2-CRD8-RMEC']) {
      await page.goto(`/postcard/${code}`);
      await expect(page.getByRole('alert')).toHaveText('This postcard isn’t there any more. Ask whoever sent it for a new link.');
    }
  });

  test('a seeded card opens for anyone, no sign-in, with nothing of the map', { tag: '@phone' }, async ({ page }) => {
    await signOut(page);
    await page.goto('/postcard/pst2crd8frnc');
    await cardOpened(page, 'A postcard from France');
    await expect(page.getByText("Charlie & Alex's travels")).toHaveCount(0);
    await page.getByRole('button', { name: 'Turn it over to see the back' }).click();
    await expect(page.getByRole('img', { name: /The message: “Bonjour Gran!/ })).toBeVisible();
  });
});

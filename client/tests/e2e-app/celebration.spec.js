import { test, expect, openMap, openTool } from './fixtures.js';

// The celebration (24 Nov 2026, the user's wish): stars, the landmark's little 3D model and its
// passport stamp when a landmark is stamped for the first time (a tick, or a photo's landmark
// confirmed), and the same for a country marked visited from its ticket or the country list,
// with its outline and entry stamp. Every other test starts with it off (fixtures.js `celebrations`).
test.use({ celebrations: true });

// The celebration named `name` (a country's ticket is a dialog of the same name)
const celebrationOf = (page, name) => page.getByRole('dialog', { name, exact: true }).and(page.locator('[data-celebration]'));

/**
 * The stamp, tilted as the passport tilts it (up to 10°), whole inside the ticket's words, which
 * scroll and cut off what's past their edge: a 7.5rem stamp's top corner rose past it (24 Nov
 * 2026, the user's report: Mongolia's, tilted 8°)
 */
async function expectStampWhole(party) {
  const [stamp, body] = [await party.locator('[data-celebration-stamp] > *').boundingBox(), await party.locator('[data-celebration-body]').boundingBox()];
  expect(stamp.y).toBeGreaterThanOrEqual(body.y);
  expect(stamp.x).toBeGreaterThanOrEqual(body.x);
  expect(stamp.x + stamp.width).toBeLessThanOrEqual(body.x + body.width);
}

// The passport's "Page 3 of 11: Peru"
const passportPageStatus = (page) => page.getByRole('status').filter({ hasText: /^Page \d+ of \d+: / });

async function openCountry(page, name) {
  const list = await openTool(page, 'Country list', 'Countries');
  await list.getByRole('button', { name, exact: true }).click();
  return page.getByRole('dialog', { name });
}

test('ticking a landmark for the first time celebrates it with its model and its stamp', { tag: '@phone' }, async ({ page }) => {
  await openMap(page);
  const ticket = await openCountry(page, 'Peru');
  await ticket.getByRole('button', { name: /^Show all \d+ landmarks$/ }).click();
  const machuPicchu = ticket.getByRole('checkbox', { name: 'Been to Machu Picchu' });
  await machuPicchu.check();

  const party = celebrationOf(page, 'Machu Picchu');
  await expect(party).toBeVisible();
  // Peru wasn't on the map: the tick marked it
  await expect(party).toHaveAccessibleDescription('Stamped in your passport. Peru is on your map now, with its own page.');
  await expect(party.getByText('Been here!')).toBeVisible();
  await expect(party.locator('[data-celebration-model="machu-picchu"]')).toBeVisible();
  // The stamp as the passport has it: "Been here" in its frame
  await expect(party.locator('[data-celebration-stamp] [data-stamp-been-here]')).toBeAttached();
  await expect(party.locator('[data-celebration-progress]')).toHaveText('Been to 1 of 13 landmarks in Peru.');

  // Carry on: Peru's own celebration straight after (24 Nov 2026, the user's wish), dated today
  await party.getByRole('button', { name: 'Carry on' }).click();
  await expect(party).toBeHidden();
  const peru = celebrationOf(page, 'You visited Peru!');
  await expect(peru).toBeVisible();
  await expect(peru).toHaveAccessibleDescription('Peru now has its own page in your passport, with its entry stamp.');
  await expect(peru.locator('[data-celebration-stamp]')).toContainText(/\d{1,2} [A-Z]{3} \d{4}/);
  // Then back on the ticket, focus where it was, the tick kept
  await peru.getByRole('button', { name: 'Carry on' }).click();
  await expect(page.locator('[data-celebration]')).toHaveCount(0);
  await expect(machuPicchu).toBeFocused();
  await expect(machuPicchu).toBeChecked();

  // The next one, with no model yet: its photo from Wikimedia Commons, and on to the passport
  await ticket.getByRole('checkbox', { name: 'Been to Chankillo' }).check();
  const second = celebrationOf(page, 'Chankillo');
  await expect(second).toHaveAccessibleDescription('Stamped in your passport.');
  await expect(second.locator('[data-celebration-model]')).toHaveCount(0);
  await expect(second.locator('[data-celebration-progress]')).toHaveText('Been to 2 of 13 landmarks in Peru.');
  await expect(second.getByRole('checkbox')).toHaveCount(0);
  await second.getByRole('link', { name: 'Open passport' }).click();
  await expect(page).toHaveURL(/\/maps\/map-home\/passport$/);
  // Opened at the page its stamp is on: Peru's
  await expect(passportPageStatus(page)).toHaveText(/^Page \d+ of \d+: Peru$/);
});

test('a landmark confirmed on a photo is celebrated with that photo in its stamp', async ({ page }) => {
  await openMap(page);
  const spain = await openCountry(page, 'Spain');
  await spain.getByRole('button', { name: 'Open Granada' }).click();
  const viewer = page.getByRole('dialog', { name: 'Granada' });
  await viewer.getByRole('button', { name: "That's right: Alhambra" }).click();

  const party = celebrationOf(page, 'Alhambra');
  await expect(party).toBeVisible();
  await expect(party).toHaveAccessibleDescription('Stamped in your passport.');
  await expect(party.locator('[data-celebration-model="alhambra"]')).toBeVisible();
  // The photo in the stamp's frame, dated the day it was taken
  await expect(party.locator('[data-celebration-stamp] image')).toHaveCount(1);
  await expect(party.locator('[data-celebration-stamp]')).toContainText('5 AUG 2018');
  await page.keyboard.press('Escape');
  await expect(party).toBeHidden();
  // The viewer's still there, the match confirmed
  await expect(viewer.getByRole('button', { name: 'Remove Alhambra' })).toBeVisible();
});

// The day as the site writes it in a date field (YYYY-MM-DD, the browser's own time zone)
const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// 24 Nov 2026, the user's wishes: "You visited Egypt!", the words naming it, its outline above
// its models, "Open passport", no box, and the day it's marked as its first visit
test('marking a country visited from its ticket celebrates its page in the passport, dated today', async ({ page }) => {
  await openMap(page);
  const ticket = await openCountry(page, 'Egypt');
  const status = ticket.getByRole('combobox', { name: 'Been there?' });
  await status.selectOption('Visited');

  const party = celebrationOf(page, 'You visited Egypt!');
  await expect(party).toBeVisible();
  await expect(party).toHaveAccessibleDescription('Egypt now has its own page in your passport, with its entry stamp.');
  await expect(party.locator('[data-celebration-stamp]')).toContainText('ADMITTED');
  await expect(party.locator('[data-celebration-stamp]')).toContainText(/\d{1,2} [A-Z]{3} \d{4}/);
  await expect(party.locator('[data-celebration-outline="EG"]')).toBeVisible();
  await expect(party.locator('[data-celebration-poster]')).toHaveCount(0);
  await expect(party.locator('[data-celebration-model]')).toHaveCount(3);
  await expect(party.getByRole('link', { name: 'Open passport' })).toBeVisible();
  await expect(party.getByRole('checkbox')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(party).toBeHidden();
  // The ticket's "First went" has the day it was marked
  await expect(ticket.getByLabel('First went')).toHaveValue(todayIso());

  // Lived there, from visited: nothing covers the ticket as it closes
  await status.selectOption('Lived there');
  await expect(status).toHaveValue('LIVED');
  await ticket.getByRole('button', { name: /^Close/ }).first().click();
  await expect(page.locator('[data-celebration]')).toHaveCount(0);
});

test('a tilted entry stamp sits whole on the ticket, its corner not cut off', { tag: '@phone' }, async ({ page }) => {
  await openMap(page);
  const ticket = await openCountry(page, 'Mongolia');
  await ticket.getByRole('combobox', { name: 'Been there?' }).selectOption('Visited');
  const party = celebrationOf(page, 'You visited Mongolia!');
  await expect(party.locator('[data-celebration-stamp]')).toContainText('MONGOLIA');
  await expectStampWhole(party);
});

// 24 Nov 2026, the user's wish: "Open passport" goes to the new country's page, the cover first
// (its opening), then straight there, the pages between skipped
test('“Open passport” opens the book from its cover straight to the new country’s page', async ({ page }) => {
  await openMap(page);
  const ticket = await openCountry(page, 'Kenya');
  await ticket.getByRole('combobox', { name: 'Been there?' }).selectOption('Visited');
  const party = celebrationOf(page, 'You visited Kenya!');
  await party.getByRole('link', { name: 'Open passport' }).click();
  await expect(page).toHaveURL(/\/maps\/map-home\/passport$/);
  const status = passportPageStatus(page);
  await expect(status).toHaveText(/^Page 1 of \d+: Cover$/);
  await expect(status).toHaveText(/^Page \d+ of \d+: Kenya$/);
  await expect(page.getByRole('heading', { level: 2, name: 'Kenya' })).toBeVisible();
  // It stays there: one turn, from the cover
  await page.waitForTimeout(1000);
  await expect(status).toHaveText(/^Page \d+ of \d+: Kenya$/);
});

// 24 Nov 2026, the user's wish: the country list gives a country its passport page too
test('marking a country visited from the country list celebrates it too, and dates it today', { tag: '@phone' }, async ({ page }) => {
  await openMap(page);
  const list = await openTool(page, 'Country list', 'Countries');
  await list.getByRole('button', { name: 'Status for Chile: Not yet' }).click();
  const chile = list.getByRole('combobox', { name: 'Status for Chile' });
  await expect.poll(() => chile.evaluate((el) => el.contains(document.activeElement))).toBe(true);
  await chile.selectOption('Visited');

  const party = celebrationOf(page, 'You visited Chile!');
  await expect(party).toBeVisible();
  await expect(party).toHaveAccessibleDescription('Chile now has its own page in your passport, with its entry stamp.');
  await expect(party.locator('[data-celebration-outline="CL"]')).toBeVisible();
  // Chile's stamp is tilted 9° the other way
  await expectStampWhole(party);
  await party.getByRole('button', { name: 'Carry on' }).click();
  await expect(party).toBeHidden();
  // Back on the list, the new status shown
  await list.getByRole('heading', { name: 'Countries' }).click();
  await expect(list.getByRole('button', { name: 'Status for Chile: Visited' })).toBeVisible();

  // Its ticket has the day it was marked
  await list.getByRole('button', { name: 'Chile', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Chile' }).getByLabel('First went')).toHaveValue(todayIso());
});

test('Settings turns the celebrations off and back on; the screen has no box of its own', async ({ page }) => {
  await openMap(page);
  const settings = await openTool(page, 'Map settings', 'Settings');
  const celebrations = settings.getByRole('switch', { name: 'Celebrations for new stamps and countries' });
  await expect(celebrations).toBeChecked();
  await settings.getByText('Celebrations for new stamps and countries', { exact: true }).click();
  await expect(celebrations).not.toBeChecked();
  await settings.getByRole('button', { name: 'Close Settings' }).click();

  // A tick stamps quietly
  const ticket = await openCountry(page, 'Peru');
  await ticket.getByRole('checkbox', { name: 'Been to Caral' }).check();
  await expect(ticket.locator('[data-landmark-progress]')).toHaveAttribute('data-landmark-progress', '1');
  await expect(page.locator('[data-celebration]')).toHaveCount(0);
  await ticket.getByRole('button', { name: /^Close/ }).first().click();

  const again = await openTool(page, 'Map settings', 'Settings');
  await again.getByText('Celebrations for new stamps and countries', { exact: true }).click();
  await expect(again.getByRole('switch', { name: 'Celebrations for new stamps and countries' })).toBeChecked();
});

// With the animations running (the suite turns motion down): the stamp waits at 2.4× its size
// before it comes down, and the ticket gave it a sideways scrollbar as it opened (24 Nov 2026,
// the user's report). The ticket only scrolls up and down.
test.describe('with motion', () => {
  test.use({ contextOptions: { reducedMotion: 'no-preference' } });

  test('the ticket opens with no sideways scrollbar while its stamp comes down', { tag: '@phone' }, async ({ page }) => {
    await openMap(page);
    const ticket = await openCountry(page, 'Peru');
    await ticket.getByRole('button', { name: /^Show all \d+ landmarks$/ }).click();
    await ticket.getByRole('checkbox', { name: 'Been to Machu Picchu' }).check();

    const party = celebrationOf(page, 'Machu Picchu');
    const body = party.locator('[data-celebration-body]');
    await expect(body).toBeVisible();
    // A sideways scrollbar takes height from the box: offsetHeight past clientHeight
    const sideways = () => body.evaluate((el) => ({ overflowX: getComputedStyle(el).overflowX, scrollbar: el.offsetHeight - el.clientHeight }));
    // While the stamp waits, big and see-through, and once it has come down
    expect(await sideways()).toEqual({ overflowX: 'hidden', scrollbar: 0 });
    await expect(party.locator('[data-celebration-stamp]')).toHaveCSS('opacity', '1');
    expect(await sideways()).toEqual({ overflowX: 'hidden', scrollbar: 0 });
    // Nothing to scroll to either way: the body can't be moved sideways
    await body.evaluate((el) => {
      el.scrollLeft = 200;
    });
    expect(await body.evaluate((el) => el.scrollLeft)).toBe(0);
  });
});

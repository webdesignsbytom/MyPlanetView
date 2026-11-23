import { test, expect, openMap, openTool } from './fixtures.js';

// The celebration (24 Nov 2026, the user's wish): stars, the landmark's little 3D model and its
// passport stamp when a landmark is stamped for the first time (a tick, or a photo's landmark
// confirmed), and the same for a country marked visited from its ticket, with its poster and
// entry stamp. Every other test starts with it off (fixtures.js `celebrations`).
test.use({ celebrations: true });

// The celebration named `name` (a country's ticket is a dialog of the same name)
const celebrationOf = (page, name) => page.getByRole('dialog', { name, exact: true }).and(page.locator('[data-celebration]'));

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

  // Carry on: back on the ticket, focus where it was, the tick kept
  await party.getByRole('button', { name: 'Carry on' }).click();
  await expect(party).toBeHidden();
  await expect(machuPicchu).toBeFocused();
  await expect(machuPicchu).toBeChecked();

  // The next one, with no model yet: its photo from Wikimedia Commons, and on to the passport
  await ticket.getByRole('checkbox', { name: 'Been to Caral' }).check();
  const second = celebrationOf(page, 'Caral');
  await expect(second).toHaveAccessibleDescription('Stamped in your passport.');
  await expect(second.locator('[data-celebration-model]')).toHaveCount(0);
  await expect(second.locator('[data-celebration-progress]')).toHaveText('Been to 2 of 13 landmarks in Peru.');
  await second.getByRole('link', { name: 'Open the passport' }).click();
  await expect(page).toHaveURL(/\/maps\/map-home\/passport$/);
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

test('marking a country visited from its ticket celebrates its page in the passport; the list never does', async ({ page }) => {
  await openMap(page);
  const ticket = await openCountry(page, 'Egypt');
  const status = ticket.getByRole('combobox', { name: 'Been there?' });
  await status.selectOption('Visited');

  const party = celebrationOf(page, 'Egypt');
  await expect(party).toBeVisible();
  await expect(party.getByText('Visited!')).toBeVisible();
  await expect(party).toHaveAccessibleDescription(
    'It has its own page in your passport now, with its entry stamp. Add the day you first went on its ticket, and the stamp is dated.',
  );
  await expect(party.locator('[data-celebration-stamp]')).toContainText('ADMITTED');
  await expect(party.locator('[data-celebration-poster]')).toBeVisible();
  await expect(party.locator('[data-celebration-model]')).toHaveCount(3);
  await page.keyboard.press('Escape');
  await expect(party).toBeHidden();

  // Lived there, from visited: no first visit, so nothing covers the ticket as it closes
  await status.selectOption('Lived there');
  await expect(status).toHaveValue('LIVED');
  await ticket.getByRole('button', { name: /^Close/ }).first().click();
  await expect(page.locator('[data-celebration]')).toHaveCount(0);

  // The country list marks many at once: no celebration there
  const list = await openTool(page, 'Country list', 'Countries');
  await list.getByRole('button', { name: 'Status for Chile: Not yet' }).click();
  const chile = list.getByRole('combobox', { name: 'Status for Chile' });
  await expect.poll(() => chile.evaluate((el) => el.contains(document.activeElement))).toBe(true);
  await chile.selectOption('Visited');
  // Leaving it turns it back into a button showing the new status
  await list.getByRole('heading', { name: 'Countries' }).click();
  await expect(list.getByRole('button', { name: 'Status for Chile: Visited' })).toBeVisible();
  await list.getByRole('button', { name: /^Close/ }).first().click();
  await expect(page.locator('[data-celebration]')).toHaveCount(0);
});

test('its box turns the celebrations off, and Settings turns them back on', async ({ page }) => {
  await openMap(page);
  const ticket = await openCountry(page, 'Peru');
  await ticket.getByRole('checkbox', { name: 'Been to Caral' }).check();
  const party = celebrationOf(page, 'Caral');
  await party.getByLabel('Don’t show these again').check();
  // It stays until it's closed
  await expect(party).toBeVisible();
  await party.getByRole('button', { name: 'Carry on' }).click();

  // The next tick stamps quietly
  await ticket.getByRole('checkbox', { name: 'Been to Chan Chan' }).check();
  await expect(ticket.locator('[data-landmark-progress]')).toHaveAttribute('data-landmark-progress', '2');
  await ticket.getByRole('button', { name: /^Close/ }).first().click();
  await expect(page.locator('[data-celebration]')).toHaveCount(0);

  const settings = await openTool(page, 'Map settings', 'Settings');
  const celebrations = settings.getByRole('switch', { name: 'Celebrations for new stamps and countries' });
  await expect(celebrations).not.toBeChecked();
  await settings.getByText('Celebrations for new stamps and countries', { exact: true }).click();
  await expect(celebrations).toBeChecked();
});

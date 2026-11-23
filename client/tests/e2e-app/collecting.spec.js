import { test, expect, openMap, openTool } from './fixtures.js';

// Collecting (docs/API.md "Collecting"; 21 Nov 2026, the user's wish): each country's ticket is
// a checklist of its landmarks (stamped in the passport, or ticked "been here", photo or not),
// and the statistics count the World Heritage Sites been to. Then the emails people can stop
// (docs/API.md "Emails"): the account page's switch and an email's unsubscribe link.

async function openCountry(page, name) {
  const list = await openTool(page, 'Country list', 'Countries');
  await list.getByRole('button', { name, exact: true }).click();
  return page.getByRole('dialog', { name });
}

const progressOf = async (ticket) => Number(await ticket.locator('[data-landmark-progress]').getAttribute('data-landmark-progress'));

async function heritageCount(page) {
  const stats = await openTool(page, 'Travel statistics', 'Travel statistics');
  const tile = stats.locator('div').filter({ has: page.getByText('World Heritage Sites', { exact: true }) }).last();
  await expect(tile).toContainText(/of 1,\d{3}/);
  const count = Number((await tile.locator('dd').innerText()).split(' ')[0]);
  await stats.getByRole('button', { name: 'Close Travel statistics' }).click();
  return count;
}

test('a country’s ticket is a checklist: a tick counts, as a stamp does, and so do the statistics', async ({ page }) => {
  await openMap(page);
  const before = await heritageCount(page);

  const ticket = await openCountry(page, 'Peru');
  await expect(ticket.locator('[data-landmark-progress]')).toBeVisible();
  const start = await progressOf(ticket);
  const caral = ticket.getByRole('checkbox', { name: 'Been to Caral' });
  await caral.check();
  await expect.poll(() => progressOf(ticket)).toBe(start + 1);
  await ticket.getByRole('button', { name: /^Close/ }).first().click();

  // A World Heritage Site: the statistics count it, and Peru is on the map now
  expect(await heritageCount(page)).toBe(before + 1);

  // Kept, and taken back
  const again = await openCountry(page, 'Peru');
  await expect(again.getByRole('checkbox', { name: 'Been to Caral' })).toBeChecked();
  await again.getByRole('checkbox', { name: 'Been to Caral' }).uncheck();
  await expect.poll(() => progressOf(again)).toBe(start);
});

// 23 Nov 2026, the user's decision: "both methods should get a stamp in the passport"
test('a tick stamps the passport too: a stamp with “Been here” in its frame and no photo to open', { tag: '@phone' }, async ({ page }) => {
  await openMap(page);
  const ticket = await openCountry(page, 'Spain');
  await ticket.getByRole('button', { name: /^Show all \d+ landmarks$/ }).click().catch(() => {});
  const alhambra = ticket.getByRole('checkbox', { name: 'Been to Alhambra' });
  await alhambra.check();
  const card = ticket.getByRole('listitem').filter({ has: page.getByRole('checkbox', { name: 'Been to Alhambra' }) });
  await expect(card.locator('[data-landmark-mark="ticked"]')).toHaveText('Stamped in the passport');

  await page.goto('/maps/map-home/passport');
  await page.getByRole('combobox', { name: 'Go to a page' }).selectOption({ label: '4. Spain' });
  const book = page.getByRole('region', { name: 'Passport book' });
  const stamps = book.getByRole('region', { name: 'Landmark stamps (2)' });
  const stamp = stamps.getByRole('img', { name: 'Stamp: Alhambra', exact: true });
  await expect(stamp).toBeVisible();
  await expect(stamp).toHaveAccessibleDescription(/^Alhambra, stamped \d+ \w+ \d{4}, UNESCO World Heritage Site, ticked as been here, no photo yet\.$/);
  await expect(stamp.locator('[data-stamp-been-here]')).toHaveCount(1);
  await expect(stamps.getByRole('button', { name: 'Open the photo of Alhambra' })).toHaveCount(0);
  // No longer one to collect
  await expect(book.getByRole('region', { name: /^Still to stamp/ })).not.toContainText('Alhambra');
});

test('a stamped landmark shows as stamped, with no tick to take it back', async ({ page }) => {
  await openMap(page);
  const ticket = await openCountry(page, 'France');
  await ticket.getByRole('button', { name: /^Show all \d+ landmarks$/ }).click().catch(() => {});
  await expect(ticket.locator('[data-landmark-mark="stamped"]').first()).toBeVisible();
  expect(await progressOf(ticket)).toBeGreaterThan(0);
});

test('on the starry night, a ticked box’s tick is the navy ink, so it shows on the pale blue', async ({ page }) => {
  // 23 Nov 2026, the user's report: the forms plugin's white tick barely showed there
  await openMap(page);
  const settings = await openTool(page, 'Map settings', 'Settings');
  await settings.getByText('Starry night', { exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-map-theme', 'starry');
  await settings.getByRole('button', { name: 'Close Settings' }).click();

  const ticket = await openCountry(page, 'Peru');
  const caral = ticket.getByRole('checkbox', { name: 'Been to Caral' });
  await caral.check();
  const look = await caral.evaluate((el) => ({ fill: getComputedStyle(el).backgroundColor, tick: getComputedStyle(el).backgroundImage }));
  expect(look.fill).toBe('rgb(191, 224, 247)');
  expect(look.tick).toMatch(/fill='%2308183a'/i);
});

test('the account page switches “On this day” off and on', async ({ page }) => {
  await page.goto('/account');
  const card = page.getByRole('region', { name: 'Emails we send' });
  const box = card.getByRole('checkbox', { name: /On this day/ });
  await expect(box).toBeChecked();
  await box.uncheck();
  await expect(card.getByText('Saved.')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('region', { name: 'Emails we send' }).getByRole('checkbox', { name: /On this day/ })).not.toBeChecked();
});

test('an email’s unsubscribe link asks, then stops them', async ({ page }) => {
  await page.goto('/unsubscribe?u=mock-user&t=signed');
  await expect(page.getByRole('heading', { name: 'On this day' })).toBeVisible();
  await page.getByRole('button', { name: 'Stop these emails' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'no more “On this day” emails' })).toBeVisible();
  await page.goto('/account');
  await expect(page.getByRole('region', { name: 'Emails we send' }).getByRole('checkbox', { name: /On this day/ })).not.toBeChecked();
});

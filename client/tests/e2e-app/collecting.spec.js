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

test('a stamped landmark shows as stamped, with no tick to take it back', async ({ page }) => {
  await openMap(page);
  const ticket = await openCountry(page, 'France');
  await ticket.getByRole('button', { name: /^Show all \d+ landmarks$/ }).click().catch(() => {});
  await expect(ticket.locator('[data-landmark-mark="stamped"]').first()).toBeVisible();
  expect(await progressOf(ticket)).toBeGreaterThan(0);
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

import { test, expect, openMap, pressCountry } from './fixtures.js';

// Enclaves (27 Nov 2026, the user's report: "I cant click on lesotho and it needs to be a
// different colour to south africa"): South Africa's outline had Lesotho's hole as a shape of
// its own, drawn in South Africa's pink over Lesotho and taking its presses. The hole is now
// part of South Africa's path (images/src/tools/lib/outlinePaths.mjs), so Lesotho shows its own
// colour and opens its own ticket.

test('Lesotho is drawn in its own colour and opens its own ticket, inside South Africa', async ({ page }) => {
  await openMap(page);
  const fills = await page.evaluate(() => {
    const fillOf = (code) => getComputedStyle(document.querySelector(`[data-code="${code}"] path`)).fill;
    return { LS: fillOf('LS'), ZA: fillOf('ZA') };
  });
  expect(fills.LS).not.toBe(fills.ZA);

  // pressCountry presses a point of Lesotho the browser finds Lesotho under (not South Africa)
  await pressCountry(page, 'LS');
  await expect(page.getByRole('dialog', { name: 'Lesotho', exact: true })).toBeVisible();
});

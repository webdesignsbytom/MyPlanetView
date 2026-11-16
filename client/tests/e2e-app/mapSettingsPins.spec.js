import { test, expect, openMap, openTool } from './fixtures.js';

// The landmark pins setting (17 Nov 2026, the user's wish: finer control of the dots) and the
// traveller dropdowns in Settings, which stay the same height whatever country is chosen.
// The seeded map has 13 passport stamps (src/dev/mock/seed.js).

const pins = (page) => page.locator('[data-landmark-pins]');

async function choosePins(page, label) {
  const settings = await openTool(page, 'Map settings', 'Settings');
  await settings.getByRole('radio', { name: label, exact: true }).check();
  await settings.getByRole('button', { name: 'Close Settings' }).click();
  await expect(settings).toBeHidden();
}

test('the landmark pins show when zoomed in, always, only the passport’s, or not at all', async ({ page }) => {
  await openMap(page);
  // The default: the whole world is too far out for them
  await expect(pins(page)).toHaveCount(0);

  await choosePins(page, 'Always, at every zoom');
  await expect(pins(page)).toHaveCount(1);
  await expect.poll(async () => Number(await pins(page).getAttribute('data-landmark-pins'))).toBeGreaterThan(0);

  await choosePins(page, 'Only the landmarks in your passport');
  await expect(pins(page)).toHaveAttribute('data-landmark-pins', '0');
  await expect(pins(page)).toHaveAttribute('data-stamped-pins', '13');

  await choosePins(page, 'Off');
  await expect(pins(page)).toHaveCount(0);
});

test('a traveller’s two country dropdowns are the same height, even with a long name chosen', async ({ page }) => {
  await openMap(page);
  const settings = await openTool(page, 'Map settings', 'Settings');
  await settings.getByRole('tab', { name: 'This map' }).click();
  const born = page.locator('#traveller-0-birth');
  const favourite = page.locator('#traveller-0-favourite');
  await favourite.selectOption('VC');
  // The full name is there to read on hover
  await expect(favourite).toHaveAttribute('title', 'Saint Vincent and the Grenadines');
  const [a, b] = await Promise.all([born.boundingBox(), favourite.boundingBox()]);
  expect(Math.round(a.height)).toBe(Math.round(b.height));
});

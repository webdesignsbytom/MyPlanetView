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

test('the landmark pins show only the passport’s, when zoomed in, always, or not at all', async ({ page }) => {
  await openMap(page);
  // The default (18 Nov 2026): only the passport's, whatever the zoom
  await expect(pins(page)).toHaveAttribute('data-landmark-pins', '0');
  // The passport's 25: 13 photos' and the 12 heritage sites ticked (data/demoTravels.js)
  await expect(pins(page)).toHaveAttribute('data-stamped-pins', '25');

  // When zoomed in: the whole world is too far out for them
  await choosePins(page, 'When zoomed in');
  await expect(pins(page)).toHaveCount(0);

  await choosePins(page, 'Always, at every zoom');
  await expect(pins(page)).toHaveCount(1);
  await expect.poll(async () => Number(await pins(page).getAttribute('data-landmark-pins'))).toBeGreaterThan(0);

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

// 22 Nov 2026 (the user's report): choosing a style or a map type low down in Settings moved
// the whole map page up, leaving a blank strip at the bottom. Each card's radio is hidden
// (sr-only, absolutely placed), and without a positioned card it was placed against the page,
// far below the scrolled panel, so focusing it scrolled the page to show it.
test('choosing a style or a map type low in Settings leaves the map page where it is', async ({ page }) => {
  await openMap(page);
  const settings = await openTool(page, 'Map settings', 'Settings');
  const frame = page.locator('[data-map-style]:has(#main-content)');
  const pageMoved = () =>
    frame.evaluate((el) => Math.round(el.scrollTop + document.scrollingElement.scrollTop + el.getBoundingClientRect().top));

  for (const name of ['Detailed', 'Starry night', 'Regular', 'World map']) {
    const named = { name: new RegExp(`^${name}`) };
    const radio = settings.getByRole('radio', named);
    const card = settings.locator('label').filter({ has: page.getByRole('radio', named) });
    await card.scrollIntoViewIfNeeded();
    await card.click();
    await expect(radio).toBeChecked();
    expect(await pageMoved()).toBe(0);
  }
});

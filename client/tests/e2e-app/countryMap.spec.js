import { test, expect, openMap, openTool, expectStats } from './fixtures.js';

// A country opened on its own (docs/API.md "Country maps"; 18 Nov 2026, the user's wish): its
// states coloured as the map stands with them, and its pins, each with a visit for every time.
// The seeded map (src/dev/mock/seed.js) has New York and Massachusetts visited, and a pin in
// Paris with two visits; it counts 8 countries on 2 continents.

async function openCountryMap(page, name) {
  const list = await openTool(page, 'Country list', 'Countries');
  await list.getByRole('button', { name, exact: true }).click();
  const ticket = page.getByRole('dialog', { name });
  await ticket.getByRole('button', { name: `Open ${name} on its own map` }).click();
  const map = page.locator('[data-country-map]');
  await expect(map.getByRole('heading', { name })).toBeVisible();
  await expect(map.locator('[data-state]').first()).toBeVisible({ timeout: 15000 });
  return map;
}

/** Press the middle of a state (a compact one, so its middle is inside it). */
async function pressState(page, code) {
  const box = await page.locator(`[data-state="${code}"] path`).first().boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
}

test('a country opens on its own, with its states and a pin’s visits kept apart', async ({ page }) => {
  await openMap(page);
  const map = await openCountryMap(page, 'France');
  await expect(map.getByText('0 of 103 departments visited')).toBeVisible();
  // The pin in Paris: two visits, newest first, each with its own photos
  await map.locator('[data-pin]').first().click();
  const pin = page.getByRole('dialog', { name: 'Paris' });
  await expect(pin.getByText('France · 2 visits')).toBeVisible();
  const visits = pin.locator('[data-pin-visit]');
  await expect(visits).toHaveCount(2);
  await expect(visits.nth(0).getByRole('heading')).toHaveText('May 2025');
  await expect(visits.nth(1).getByRole('heading')).toHaveText('April 2019');
  await expect(visits.nth(0).getByRole('button', { name: /^Photo 1 of 1 from May 2025$/ })).toBeVisible();
  // Back to the world
  await pin.getByRole('button', { name: 'Close Paris' }).click();
  await map.getByRole('button', { name: 'World map' }).click();
  await expect(page.locator('[data-country-map]')).toHaveCount(0);
  await expect(page.locator('[data-code="FR"]')).toBeVisible();
  // The world map is a new <svg>: focus is on it, and its wheel still zooms (19 Nov 2026,
  // the audit: the listener had stayed on the old one)
  const world = page.locator('#main-content svg[role="application"]');
  await expect(world).toBeFocused();
  const before = await world.getAttribute('viewBox');
  const box = await world.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.wheel(0, -400);
  await expect.poll(() => world.getAttribute('viewBox')).not.toBe(before);
});

// The little 3D landmark models (22 Nov 2026, the user's wish): on the country maps only, each
// standing on its real spot, as Big Ben does on Westminster
test('Big Ben stands on Westminster on the United Kingdom’s own map', async ({ page }) => {
  await openMap(page);
  await expect(page.locator('[data-landmark-model]')).toHaveCount(0);
  const map = await openCountryMap(page, 'United Kingdom');
  const model = map.locator('[data-landmark-model="big-ben"]');
  await expect(model.locator('image')).toBeVisible();
  // The picture has loaded, and the spot its tile stands on is inside Westminster
  await expect
    .poll(() =>
      model.locator('image').evaluate((image) => {
        const probe = new Image();
        probe.src = image.href.baseVal;
        return probe.decode().then(
          () => probe.naturalWidth,
          () => 0,
        );
      }),
    )
    .toBeGreaterThan(0);
  const onWestminster = await model.evaluate((group) => {
    const { e: x, f: y } = group.transform.baseVal.consolidate().matrix;
    const point = new DOMPoint(x, y);
    return [...document.querySelectorAll('[data-state="GB-WSM"] path')].some((path) => path.isPointInFill(point));
  });
  expect(onWestminster).toBe(true);
  // Only the country's own map has it: none on the world map
  await map.getByRole('button', { name: 'World map' }).click();
  await expect(page.locator('[data-country-map]')).toHaveCount(0);
  await expect(page.locator('[data-landmark-model]')).toHaveCount(0);
});

test('marking a state colours it and brings its country', async ({ page }) => {
  await openMap(page);
  const map = await openCountryMap(page, 'Canada');
  await pressState(page, 'CA-SK');
  const popover = page.getByRole('dialog', { name: 'Saskatchewan' });
  await popover.getByRole('button', { name: 'Visited' }).click();
  await expect(page.locator('[data-state="CA-SK"]')).toHaveAttribute('data-status', 'VISITED');
  await expect(map.getByText('1 of 13 provinces visited')).toBeVisible();
  // Canada came with it (North America already counted, through the US)
  await expectStats(page, '9 countries, 2 continents, 16 photos');
});

test('an editor drops a pin and saves its first visit', async ({ page }) => {
  await openMap(page);
  const map = await openCountryMap(page, 'United States');
  await expect(map.getByText('2 of 51 states visited')).toBeVisible();
  await map.getByRole('button', { name: 'Add a pin' }).click();
  await expect(map.getByText('Press the map where the pin goes.')).toBeVisible();
  await pressState(page, 'US-TX');
  const panel = page.getByRole('dialog', { name: 'New pin in United States' });
  await panel.getByRole('textbox', { name: 'Name' }).fill('Austin');
  // An exact spot: shared with the map's viewers only when chosen (19 Nov 2026, the user's decision)
  await expect(panel.getByRole('checkbox', { name: 'Show this pin to everyone the map is shared with' })).not.toBeChecked();
  await panel.getByRole('button', { name: 'Next: the first visit' }).click();
  await panel.getByRole('combobox', { name: 'When' }).selectOption('Only the year');
  await panel.getByRole('textbox', { name: 'Year' }).fill('2024');
  await panel.getByRole('button', { name: 'Save the pin' }).click();
  const pin = page.getByRole('dialog', { name: 'Austin' });
  await expect(pin.getByText('United States · 1 visit · only the map’s editors see it')).toBeVisible();
  await expect(pin.locator('[data-pin-visit]').getByRole('heading')).toHaveText('2024');
  await expect(map.locator('[data-pin]')).toHaveCount(1);

  // Going back: a second visit, kept apart from the first
  await pin.getByRole('button', { name: 'Add a visit' }).click();
  await pin.getByRole('combobox', { name: 'When' }).selectOption('Only the year');
  await pin.getByRole('textbox', { name: 'Year' }).fill('2025');
  await pin.getByRole('button', { name: 'Add the visit' }).click();
  await expect(pin.getByText('United States · 2 visits')).toBeVisible();
  await expect(pin.locator('[data-pin-visit]').getByRole('heading')).toHaveText(['2025', '2024']);
});

test('a country opens on its own on a phone too', { tag: '@phone' }, async ({ page }) => {
  await openMap(page);
  const map = await openCountryMap(page, 'United States');
  await expect(map.getByText('2 of 51 states visited')).toBeVisible();
  await expect(page.locator('[data-state="US-NY"]')).toHaveAttribute('data-status', 'VISITED');
});

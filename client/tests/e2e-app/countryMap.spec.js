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
// standing on its real spot, as Big Ben does on Westminster and the Eiffel Tower on Paris

/**
 * The model is drawn, its picture has loaded, and the spot its tile stands on is in the state
 * (`inBounds`: within the state's bounds, for a spot off its shore, as Liberty Island is).
 */
async function expectModelOn(map, id, stateCode, { inBounds = false } = {}) {
  const model = map.locator(`[data-landmark-model="${id}"]`);
  await expect(model.locator('image')).toBeVisible();
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
  const onState = await model.evaluate(
    (group, { code, bounds }) => {
      const { e: x, f: y } = group.transform.baseVal.consolidate().matrix;
      const state = document.querySelector(`[data-state="${code}"]`);
      if (bounds) {
        const box = state.getBBox();
        return x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height;
      }
      const point = new DOMPoint(x, y);
      return [...state.querySelectorAll('path')].some((path) => path.isPointInFill(point));
    },
    { code: stateCode, bounds: inBounds },
  );
  expect(onState).toBe(true);
  return model;
}

test('Big Ben stands on Westminster on the United Kingdom’s own map', async ({ page }) => {
  await openMap(page);
  await expect(page.locator('[data-landmark-model]')).toHaveCount(0);
  const map = await openCountryMap(page, 'United Kingdom');
  await expectModelOn(map, 'big-ben', 'GB-WSM');
  await expect(map.locator('[data-landmark-model]')).toHaveCount(1);
  // Only the country's own map has it: none on the world map
  await map.getByRole('button', { name: 'World map' }).click();
  await expect(page.locator('[data-country-map]')).toHaveCount(0);
  await expect(page.locator('[data-landmark-model]')).toHaveCount(0);
});

test('the Eiffel Tower stands on Paris on France’s own map, a little taller than Big Ben', async ({ page }) => {
  await openMap(page);
  const map = await openCountryMap(page, 'France');
  const tower = await expectModelOn(map, 'eiffel-tower', 'FR-75');
  await expect(map.locator('[data-landmark-model]')).toHaveCount(1);
  // Every model is drawn at one scale: at the same zoom the tower is taller than Big Ben (64 px
  // at zoom 1), and the pin in Paris is still drawn over it
  const height = await tower.locator('image').evaluate((image) => image.getBoundingClientRect().height);
  const zoom = await map.locator('svg[role="application"]').evaluate((svg) => svg.getBoundingClientRect().width / svg.viewBox.baseVal.width / 0.96);
  expect(height).toBeGreaterThan(Math.min(150, Math.max(40, 64 * Math.sqrt(zoom))) * 1.02);
  await map.locator('[data-pin]').first().click();
  await expect(page.getByRole('dialog', { name: 'Paris' })).toBeVisible();
});

test('the Colosseum stands on Rome on Italy’s own map, low and wide', async ({ page }) => {
  await openMap(page);
  const map = await openCountryMap(page, 'Italy');
  const colosseum = await expectModelOn(map, 'colosseum', 'IT-RM');
  await expect(map.locator('[data-landmark-model]')).toHaveCount(1);
  // Low and wide (drawn at least 0.7 of Big Ben's height, bigger than the one scale, so it reads at a glance)
  const box = await colosseum.locator('image').boundingBox();
  expect(box.width).toBeGreaterThan(box.height);
});

test('the Statue of Liberty stands in New York Harbor on the United States’ own map', async ({ page }) => {
  await openMap(page);
  const map = await openCountryMap(page, 'United States');
  // Liberty Island is off New York's shore at the map's detail: its spot is in the harbour
  await expectModelOn(map, 'statue-of-liberty', 'US-NY', { inBounds: true });
  await expect(map.locator('[data-landmark-model]')).toHaveCount(1);
});

// The next five (22 Nov 2026), each on its own country's map, inside its state or province
for (const [country, id, area, place] of [
  ['India', 'taj-mahal', 'IN-UP', 'Uttar Pradesh'],
  ['Egypt', 'pyramids-of-giza', 'EG-GZ', 'Giza'],
  ['Australia', 'sydney-opera-house', 'AUS-2654', 'New South Wales'],
  ['Brazil', 'christ-the-redeemer', 'BR-RJ', 'Rio de Janeiro'],
  ['China', 'great-wall', 'CN-BJ', 'Beijing'],
  // and the five after them
  ['Japan', 'mount-fuji', 'JP-19', 'Yamanashi (its summit on the border)'],
  ['Greece', 'parthenon', 'GR-A1', 'Attica'],
  ['Spain', 'sagrada-familia', 'ES-B', 'Barcelona'],
  // Natural Earth swaps Moscow's two codes: RU-MOS is the city, "Moskva"
  ['Russia', 'saint-basils', 'RU-MOS', 'Moscow'],
  ['Mexico', 'chichen-itza', 'MX-YUC', 'Yucatán'],
  // and the five after those
  ['Peru', 'machu-picchu', 'PE-CUS', 'Cusco'],
  ['Cambodia', 'angkor-wat', 'KH-17', 'Siem Reap'],
  ['Jordan', 'petra', 'JO-MN', 'Ma’an'],
  ['Germany', 'neuschwanstein', 'DE-BY', 'Bavaria'],
  // Easter Island is in one of Chile's insets, part of Valparaíso
  ['Chile', 'moai', 'CL-VS', 'Valparaíso'],
  // and the five after those
  ['Netherlands', 'kinderdijk', 'NL-ZH', 'South Holland'],
  ['Turkey', 'hagia-sophia', 'TR-34', 'Istanbul'],
  ['Canada', 'cn-tower', 'CA-ON', 'Ontario'],
  ['United Arab Emirates', 'burj-khalifa', 'AE-DU', 'Dubai'],
  ['Singapore', 'marina-bay-sands', 'SG-01', 'Central Singapore'],
  // and the five after those
  ['South Africa', 'table-mountain', 'ZA-WC', 'the Western Cape'],
  ['Indonesia', 'borobudur', 'ID-JT', 'Central Java'],
  // Kuala Lumpur is inside Selangor on the map; the city's own outline is drawn over it
  ['Malaysia', 'petronas-towers', 'MY-14', 'Kuala Lumpur'],
  ['Thailand', 'ayutthaya', 'TH-14', 'Ayutthaya'],
  // and the five after those
  ['Tanzania', 'kilimanjaro', 'TZ-09', 'Kilimanjaro'],
  ['Myanmar', 'bagan', 'MM-04', 'Mandalay'],
  // Prague is inside Central Bohemia on the map; the city's own outline is drawn over it
  ['Czechia', 'prague-castle', 'CZ-PR', 'Prague'],
  // and the five after those
  ['Argentina', 'perito-moreno', 'AR-Z', 'Santa Cruz'],
  // Seoul is inside Gyeonggi on the map; the city's own outline is drawn over it
  ['South Korea', 'gyeongbokgung', 'KR-11', 'Seoul'],
  ['Cuba', 'old-havana', 'CU-03', 'Havana'],
  ['Norway', 'bryggen', 'NO-12', 'Hordaland'],
]) {
  test(`${country}’s own map has its landmark model, in ${place}`, async ({ page }) => {
    await openMap(page);
    const map = await openCountryMap(page, country);
    await expectModelOn(map, id, area);
    await expect(map.locator('[data-landmark-model]')).toHaveCount(1);
  });
}

// Spots just off their area's outline at the map's detail: within its bounds. The Tower of
// Belém stands in the Tagus; Victoria Falls is on the Zambezi, the border; Ha Long Bay is the bay
for (const [country, id, area, place] of [
  ['Portugal', 'belem-tower', 'PT-11', 'Lisbon'],
  ['Zambia', 'victoria-falls', 'ZM-07', 'Southern Province'],
  ['Vietnam', 'ha-long-bay', 'VN-13', 'Quảng Ninh'],
  // the Cliffs of Moher are Clare's very edge, the sea's side of its coastline at the map's detail
  ['Ireland', 'cliffs-of-moher', 'IE-CE', 'Clare'],
]) {
  test(`${country}’s own map has its landmark model, by ${place}`, async ({ page }) => {
    await openMap(page);
    const map = await openCountryMap(page, country);
    await expectModelOn(map, id, area, { inBounds: true });
    await expect(map.locator('[data-landmark-model]')).toHaveCount(1);
  });
}

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
  // A finger's drag and pinch are the map's own, as on the world map: without it the phone's
  // browser held back the touch moves, and panning was jerky (23 Nov 2026, the user's report)
  await expect(map.getByRole('application')).toHaveCSS('touch-action', 'none');
});

import { test, expect } from './fixtures.js';

// The draft of a new home page (dev server only, /dev/home; components/homeDraft/): the Earth
// turning on a canvas with three destination cards, the site's real links in its own bar.
// The tests' browsers ask for reduced motion, so the globe stands still unless a test says
// otherwise. Mock mode is signed in as the test user.
const DRAFT = '/dev/home';

// A fingerprint of a band across the globe's middle, to tell whether it has moved
const globeBand = (page) =>
  page.locator('[data-home-draft] canvas').evaluate((canvas) => {
    const y = Math.floor(canvas.height * 0.49);
    const x = Math.floor(canvas.width * 0.55);
    const { data } = canvas.getContext('2d').getImageData(x, y - 20, canvas.width - x, 40);
    let sum = 0;
    for (let i = 0; i < data.length; i += 3) sum = (sum * 31 + data[i]) % 1000000007;
    return sum;
  });

async function openDraft(page) {
  await page.goto(DRAFT);
  await expect(page.getByRole('heading', { level: 1, name: 'Picture Your Travel' })).toBeVisible();
  await expect(page.locator('[data-globe-drawn]')).toBeAttached({ timeout: 30000 });
}

const cardIds = (page) => page.locator('[data-destination]').evaluateAll((cards) => cards.map((card) => card.getAttribute('data-destination')));

test.describe('The home page draft', () => {
  test('draws the globe with three destination cards, on one screen, and is never indexed', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(String(error)));
    await openDraft(page);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,nofollow');
    await expect(page.getByText('One map for a lifetime of travel: every country, photo and trip, kept private.')).toBeVisible();
    expect(await cardIds(page)).toEqual(['392', '764', '036']);
    await expect(page.getByRole('button', { name: /Japan\s*Mount Fuji/ })).toBeVisible();
    // The Earth is painted at the right-hand side of the canvas
    const alpha = await page.locator('[data-home-draft] canvas').evaluate((canvas) => {
      const pixel = canvas.getContext('2d').getImageData(Math.floor(canvas.width * 0.9), Math.floor(canvas.height * 0.49), 1, 1);
      return pixel.data[3];
    });
    expect(alpha).toBe(255);
    // A wide screen shows it all without scrolling, "TRAVEL" on one line, no pause button
    expect(await page.evaluate(() => document.documentElement.scrollHeight - innerHeight)).toBe(0);
    const travel = page.locator('[data-home-draft] h1 strong');
    expect(await travel.evaluate((word) => word.getClientRects().length)).toBe(1);
    await expect(page.getByRole('button', { name: /rotation/ })).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test('has the site’s real links, and its button opens the map', async ({ page }) => {
    await openDraft(page);
    const nav = page.getByRole('navigation', { name: 'Main' });
    for (const name of ['My map', 'Challenges', 'Home', 'About', 'FAQ', 'Pricing', 'Contact', 'Account']) {
      await expect(nav.getByRole('link', { name, exact: true })).toBeVisible();
    }
    await expect(nav.getByRole('button', { name: /^Log out/ })).toBeVisible();
    await nav.getByRole('link', { name: 'Pricing' }).click();
    await expect(page).toHaveURL(/\/pricing$/);

    // Signed in, the button opens the map (its address checked: the map page is the heaviest)
    await openDraft(page);
    await expect(page.getByRole('link', { name: /Open Your Travel Map/ })).toHaveAttribute('href', '/map');
  });

  test('opens a destination from its card, and Escape closes it', async ({ page }) => {
    await openDraft(page);
    await page.getByRole('button', { name: /Australia\s*Uluru/ }).click();
    const dialog = page.getByRole('dialog', { name: 'Australia' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { level: 3, name: 'Uluru' })).toBeVisible();
    await expect(dialog.getByRole('img', { name: 'Uluru' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });

  test.describe('with motion', () => {
    test.use({ contextOptions: { reducedMotion: 'no-preference' } });

    test('turns by itself, and changes a card every few seconds', async ({ page }) => {
      await openDraft(page);
      const start = await globeBand(page);
      await expect.poll(() => globeBand(page)).not.toBe(start);
      await expect.poll(() => cardIds(page), { timeout: 15000 }).not.toEqual(['392', '764', '036']);
    });
  });

  test('stands still for a viewer who asked for less motion', async ({ page }) => {
    await openDraft(page);
    const still = await globeBand(page);
    await page.waitForTimeout(1000);
    expect(await globeBand(page)).toBe(still);
  });

  test('puts the links behind a menu and the globe under the introduction on a phone', { tag: '@phone' }, async ({ page }) => {
    // The draft stacks below 761px (and on upright tablets)
    test.skip(page.viewportSize().width > 760, 'phone only');
    await openDraft(page);
    const button = await page.getByRole('link', { name: /Open Your Travel Map/ }).boundingBox();
    const globe = await page.getByRole('region', { name: 'Rotating Earth with highlighted countries' }).boundingBox();
    expect(globe.y).toBeGreaterThanOrEqual(button.y + button.height);

    const nav = page.getByRole('navigation', { name: 'Main' });
    await expect(nav).toBeHidden();
    const menu = page.getByRole('button', { name: 'Menu' });
    await menu.click();
    await expect(nav.getByRole('link', { name: 'About' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(nav).toBeHidden();
    await expect(menu).toBeFocused();
  });
});

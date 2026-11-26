import { test, expect, openMap, openTool, pressCountry, toolbar } from './fixtures.js';

// The tab on the toolbar's left edge (25 Nov 2026, the user's wish): it hides every menu on the
// map page, each sliding off by its closest side, leaving the tab on the screen's right edge to
// bring them back. Not saved: a reload shows them. Wide screens only.

const tab = (page) => page.locator('[data-menus-tab]');
const tools = (page) => page.locator('[data-map-tools]');
const tags = (page) => page.locator('[data-map-tags]');
// Out of the keyboard's and screen readers' way: inside an inert piece
const outOfReach = (locator) => locator.evaluate((el) => Boolean(el.closest('[inert]')));

test('the tab hides the menus, leaving itself on the right edge, and brings them back', async ({ page }) => {
  await openMap(page);
  await expect(tab(page)).toHaveAttribute('aria-label', 'Hide the menus');
  // On the toolbar's left edge, half way down
  const [tabBox, toolsBox] = [await tab(page).boundingBox(), await toolbar(page).boundingBox()];
  expect(Math.abs(tabBox.x + tabBox.width - toolsBox.x)).toBeLessThan(4);
  expect(Math.abs(tabBox.y + tabBox.height / 2 - (toolsBox.y + toolsBox.height / 2))).toBeLessThan(4);

  await tab(page).click();
  await expect(tab(page)).toHaveAttribute('aria-label', 'Show the menus');
  // Each by its closest side: the toolbar right, the tags at the top left up or left
  await expect(tools(page)).toHaveAttribute('data-slid-away', 'right');
  await expect(tags(page)).toHaveAttribute('data-slid-away', /^(top|left)$/);
  await expect(toolbar(page)).not.toBeInViewport();
  await expect(page.getByRole('button', { name: 'Zoom in' })).not.toBeInViewport();
  // Out of the keyboard's way, all but the tab
  expect(await outOfReach(toolbar(page).getByRole('button', { name: 'Travel statistics', exact: true }))).toBe(true);
  expect(await outOfReach(tab(page))).toBe(false);
  // The tab is left on the screen's right edge (it overlaps the toolbar by 2px, so as much
  // goes past the edge with it)
  const view = page.viewportSize();
  const away = await tab(page).boundingBox();
  expect(Math.abs(away.x + away.width - view.width)).toBeLessThanOrEqual(3);

  await tab(page).click();
  await expect(tab(page)).toHaveAttribute('aria-label', 'Hide the menus');
  await expect(tools(page)).not.toHaveAttribute('data-slid-away');
  await expect(toolbar(page)).toBeInViewport();
  await expect(page.getByRole('button', { name: 'Zoom in' })).toBeInViewport();
});

test('an open panel slides away with them, and comes back with them', async ({ page }) => {
  await openMap(page);
  const stats = await openTool(page, 'Travel statistics', 'Travel statistics');
  await tab(page).click();
  await expect(stats).not.toBeInViewport();
  await expect(page.locator('[data-map-panels]')).toHaveAttribute('data-slid-away', /^(top|bottom|left|right)$/);
  await tab(page).click();
  await expect(stats).toBeInViewport();
});

test('a country pressed while they’re hidden brings them back with its ticket; a reload shows them', async ({ page }) => {
  await openMap(page);
  await tab(page).click();
  await expect(toolbar(page)).not.toBeInViewport();
  await pressCountry(page, 'FR');
  const france = page.getByRole('dialog', { name: 'France' });
  await expect(france).toBeInViewport();
  await expect(tab(page)).toHaveAttribute('aria-label', 'Hide the menus');
  await expect(toolbar(page)).toBeInViewport();

  await tab(page).click();
  await expect(toolbar(page)).not.toBeInViewport();
  await page.reload();
  await expect(page.locator('[data-map-loading]')).toHaveCount(0);
  await expect(toolbar(page)).toBeInViewport();
  await expect(tab(page)).toHaveAttribute('aria-label', 'Hide the menus');
});

test('a country’s own map’s header and stamps go too', async ({ page }) => {
  await openMap(page);
  const list = await openTool(page, 'Country list', 'Countries');
  await list.getByRole('button', { name: 'Italy', exact: true }).click();
  await page.getByRole('dialog', { name: 'Italy' }).getByRole('button', { name: 'Open Italy on its own map' }).click();
  const map = page.locator('[data-country-map]');
  const header = map.locator('[data-country-map-header]');
  await expect(header).toBeInViewport();
  await tab(page).click();
  await expect(header).not.toBeInViewport();
  expect(await outOfReach(map.getByRole('button', { name: 'World map' }).first())).toBe(true);
  await tab(page).click();
  await expect(header).toBeInViewport();
});

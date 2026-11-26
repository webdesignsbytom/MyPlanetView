import { createRequire } from 'node:module';
import { test, expect } from './fixtures.js';

// The pages' accessibility, checked by axe-core against WCAG 2.2 AA (26 Nov 2026, the
// audit: cream lettering on the poster red, gold on the deep red, red words on paper, links
// told apart by colour alone and an unnamed file input; the launch checklist wants
// Lighthouse's accessibility score at 95 or more). Mock mode signs the test user in.

const AXE_SCRIPT = createRequire(import.meta.url).resolve('axe-core/axe.min.js');

const PAGES = [
  ['home', '/', 'h1'],
  ['about', '/about', 'h1'],
  ['FAQ', '/faq', 'h1'],
  ['pricing', '/pricing', '[data-current-plan]'],
  ['sign-up', '/sign-up', 'h1'],
  ['forgot password', '/forgot-password', 'h1'],
  ['account', '/account', 'h1'],
  ['a country guide', '/countries/japan', 'h1'],
  ['a month', '/where-to-go/january', 'h1'],
  ['challenges', '/challenges', 'h1'],
  ['gifts', '/gifts', 'h1'],
];

/** Every WCAG A and AA problem axe finds on the page, one line each. */
async function problems(page) {
  await page.addScriptTag({ path: AXE_SCRIPT });
  return page.evaluate(async () => {
    // eslint-disable-next-line no-undef
    const result = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] }, resultTypes: ['violations'] });
    return result.violations.flatMap((v) => v.nodes.map((node) => `${v.id}: ${node.target.join(' ')} (${node.failureSummary?.split('\n')[1]?.trim() ?? ''})`));
  });
}

test.describe('Accessibility', () => {
  for (const [name, path, ready] of PAGES) {
    test(`the ${name} page has no WCAG AA problems`, { tag: '@phone' }, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator(ready).first()).toBeVisible();
      await page.waitForLoadState('networkidle');
      expect(await problems(page)).toEqual([]);
    });
  }

  test('the links inside sentences are underlined, not told apart by colour alone', async ({ page }) => {
    await page.goto('/forgot-password');
    const link = page.getByRole('link', { name: 'Go to login page' });
    await expect(link).toBeVisible();
    expect(await link.evaluate((el) => getComputedStyle(el).textDecorationLine)).toContain('underline');
  });

  test('the avatar’s file input is named and left out of the Tab order', async ({ page }) => {
    await page.goto('/account');
    const input = page.locator('#avatar-file');
    await expect(input).toHaveAttribute('aria-label', 'Choose an avatar picture');
    await expect(input).toHaveAttribute('tabindex', '-1');
  });
});

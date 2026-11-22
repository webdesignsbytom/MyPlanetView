import { test, expect } from './fixtures.js';

// The public pages no other test opens: About, the country guides' index, the terms and
// privacy page (and its two anchors), the maintenance page and the 404. Mock mode signs the
// test user in, so the calls to action say "Open your map".

test.describe('Public pages', () => {
  test('About tells the story, then how it works, and opens your map', { tag: '@phone' }, async ({ page }) => {
    await page.goto('/about');
    await expect(page.getByRole('heading', { level: 1, name: 'About My Planet View' })).toBeVisible();
    const main = page.locator('#main-content');
    await expect(main).toHaveAttribute('aria-labelledby', 'about-title');

    const story = page.getByRole('region', { name: 'Our story' });
    for (const heading of ['Why it exists', 'Made for how people really travel', 'Private by default', 'Who runs it']) {
      await expect(story.getByRole('heading', { name: heading })).toBeVisible();
    }
    await expect(page.locator('#how-it-works')).toBeVisible();

    // Signed in, the call to action opens the map
    const open = page.locator('#how-it-works').getByRole('link', { name: /your My Planet View map/ });
    await expect(open).toHaveText('Open your map');
    await expect(open).toHaveAttribute('href', '/map');
    await open.click();
    await expect(page).toHaveURL(/\/map$/);
  });

  test('the country guides are listed by continent, each linking to its guide', async ({ page }) => {
    await page.goto('/countries');
    await expect(page.getByRole('heading', { level: 1, name: 'Countries' })).toBeVisible();
    const europe = page.getByRole('region', { name: 'Europe', exact: true });
    await expect(europe).toBeVisible();
    const france = europe.getByRole('link', { name: 'France', exact: true });
    await expect(france).toHaveAttribute('href', '/countries/france');
    // On the dev server the guides are drafts, and say so
    await expect(europe.getByText('Draft', { exact: true }).first()).toBeVisible();
    await expect(page.getByRole('region', { name: 'Asia', exact: true }).getByRole('link', { name: 'Japan', exact: true })).toBeVisible();

    // Signed in, the foot of the page goes back to the map
    const start = page.getByRole('region', { name: 'Back to your map' });
    await expect(start.getByRole('link', { name: 'Open your map' })).toHaveAttribute('href', '/map');

    await france.click();
    await expect(page).toHaveURL(/\/countries\/france$/);
    await expect(page.getByRole('heading', { level: 1, name: 'France' })).toBeVisible();
  });

  test('the terms and the privacy policy, with a contents card that jumps to each', async ({ page }) => {
    await page.goto('/user-agreements');
    await expect(page.getByRole('heading', { level: 1, name: 'Terms and privacy' })).toBeVisible();
    await expect(page.locator('#legal-version')).toContainText(/Version \d+\.\d+\.\d+, last updated/);
    const terms = page.getByRole('region', { name: 'Terms & Conditions' });
    const privacy = page.getByRole('region', { name: 'Privacy & Data' });
    await expect(terms).toContainText('Plans and prices');
    await expect(privacy).toContainText('Location data in your photos');

    const contents = page.getByRole('navigation', { name: 'Contents' });
    const toPrivacy = contents.getByRole('link', { name: 'Privacy & Data', exact: true }).first();
    await toPrivacy.click();
    await expect(page).toHaveURL(/\/user-agreements#privacy-policy$/);
    await expect(toPrivacy).toHaveAttribute('aria-current', 'true');
    await expect(page.locator('#privacy-policy')).toBeFocused();
    await expect(page.locator('#privacy-policy')).toBeInViewport();
  });

  for (const [anchor, name] of [
    ['terms-and-conditions', 'Terms & Conditions'],
    ['privacy-policy', 'Privacy & Data'],
  ]) {
    test(`a link to #${anchor} opens the page there`, async ({ page }) => {
      await page.goto(`/user-agreements#${anchor}`);
      const card = page.getByRole('region', { name, exact: true });
      await expect(card).toBeVisible();
      // Scrolled to once the lazy page has drawn it (hooks/FocusMainOnRouteChange.js)
      await expect(card.getByRole('heading', { level: 2, name, exact: true })).toBeInViewport();
      await expect(
        page.getByRole('navigation', { name: 'Contents' }).getByRole('link', { name, exact: true }).first(),
      ).toHaveAttribute('aria-current', 'true');
    });
  }

  test('the maintenance page says the site is closed for repairs, with no footer', async ({ page }) => {
    await page.goto('/down-for-maintenance');
    await expect(page.getByRole('heading', { level: 1, name: "We'll be back soon!" })).toBeVisible();
    await expect(page.getByText('Our site is currently undergoing scheduled maintenance.')).toBeVisible();
    await expect(page.getByText('Thank you for your patience.')).toBeVisible();
    await expect(page.getByRole('contentinfo')).toHaveCount(0);
  });

  test('an address that is no page shows the lost-luggage 404, with the ways back', { tag: '@phone' }, async ({ page }) => {
    await page.goto('/no-such-page-here');
    await expect(page.getByRole('heading', { level: 1, name: 'Error 404' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Page not found' })).toBeVisible();
    await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute('content', /noindex/);
    await expect(page.getByRole('img', { name: 'A funny and cute lost cat for the error page.' })).toBeVisible();

    const ways = page.getByRole('navigation', { name: 'Ways back' });
    await expect(ways.getByRole('link')).toHaveText(['Back to the home page', 'Read the FAQ', 'Contact us']);
    await ways.getByRole('link', { name: 'Read the FAQ' }).click();
    await expect(page).toHaveURL(/\/faq$/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});

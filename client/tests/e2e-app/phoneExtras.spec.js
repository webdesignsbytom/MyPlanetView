import { devices } from '@playwright/test';
import { test, expect, openMap } from './fixtures.js';

// Phone-only behaviour, on a Pixel 7 in this file whichever project runs it (the phone
// project runs only @phone tests, so these run once, in the desktop project): a long press
// on a country shows its postcard (CountryLayer, 17 Nov 2026), and the tips' "Install the app"
// when the browser offers to install the site (utils/pwa/installPrompt.js), or an iPhone's way.
const { defaultBrowserType: _browser, ...pixel } = devices['Pixel 7'];
test.use(pixel);

/** A point on screen where the map shows the country itself, trying each of its shapes. */
async function pointOn(page, code) {
  return page.evaluate((code) => {
    const pieces = [...document.querySelectorAll(`[data-code="${code}"]`)].flatMap((el) => [...el.querySelectorAll('path'), el]);
    for (const el of pieces) {
      const box = el.getBoundingClientRect();
      for (let fy = 0.2; fy < 0.9; fy += 0.1) {
        for (let fx = 0.2; fx < 0.9; fx += 0.1) {
          const x = box.left + box.width * fx;
          const y = box.top + box.height * fy;
          if (x > 0 && y > 0 && x < innerWidth && y < innerHeight && document.elementFromPoint(x, y)?.closest('[data-code]')?.getAttribute('data-code') === code) {
            return { x, y };
          }
        }
      }
    }
    return null;
  }, code);
}

const tipsDialog = (page) => page.getByRole('dialog', { name: 'Tips', exact: true });

test('a long press on a country shows its postcard while held, and opens nothing', async ({ page }) => {
  await openMap(page);
  const at = await pointOn(page, 'FR');
  expect(at, 'a point of France on screen').not.toBeNull();
  const cdp = await page.context().newCDPSession(page);
  const touch = (type) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x: at.x, y: at.y }] });
  const card = page.locator('[data-hover-card="FR"]');

  // The card's code loads in the background: press again until it has come
  await expect(async () => {
    await touch('touchStart');
    try {
      await expect(card).toBeVisible({ timeout: 1500 });
    } finally {
      await touch('touchEnd');
    }
  }).toPass({ timeout: 20_000 });

  // Held: the postcard stays, with the country's poster
  await touch('touchStart');
  await expect(card).toBeVisible();
  await expect(card).toContainText('France');
  await expect(card.locator('img')).toHaveAttribute('src', /visitCountryPosters\//);
  // Lifted: it goes, and the press opened no ticket (a tap would have)
  await touch('touchEnd');
  await expect(card).toBeHidden();
  await page.waitForTimeout(600);
  await expect(page.getByRole('dialog', { name: /France/ })).toHaveCount(0);
});

test.describe('The tips on a phone', () => {
  test.use({ mapTips: true });

  test('when the browser offers to install the site, the tip has a button that does it', async ({ page }) => {
    await openMap(page);
    const tips = tipsDialog(page);
    await expect(tips).toBeVisible();
    // No offer yet: the browser's menu is the way
    await expect(tips).toContainText('choose Install app or Add to Home screen');
    await expect(tips.getByRole('button', { name: 'Install the app', exact: true })).toHaveCount(0);

    // The browser makes its offer (a production build with its service worker would)
    await page.evaluate(() => {
      const offer = new Event('beforeinstallprompt', { cancelable: true });
      offer.prompt = async () => {
        window.__installPrompted = true;
      };
      offer.userChoice = Promise.resolve({ outcome: 'accepted', platform: 'web' });
      window.dispatchEvent(offer);
    });
    await expect(tips).toContainText('Install it, and it opens from its own icon on your home screen');
    await tips.getByRole('button', { name: 'Install the app', exact: true }).click();
    await expect(tips.getByText('Installed: it’s on your home screen.')).toBeVisible();
    expect(await page.evaluate(() => window.__installPrompted)).toBe(true);
    // An offer is used once
    await expect(tips.getByRole('button', { name: 'Install the app', exact: true })).toHaveCount(0);
  });

  test.describe('on an iPhone', () => {
    test.use({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1' });

    test('the tip says to use Share, then Add to Home Screen', async ({ page }) => {
      await openMap(page);
      const tips = tipsDialog(page);
      await expect(tips.getByRole('heading', { name: 'Install the app', exact: true })).toBeVisible();
      await expect(tips).toContainText('Tap Share, then Add to Home Screen');
      await expect(tips.getByRole('button', { name: 'Install the app', exact: true })).toHaveCount(0);
    });
  });
});

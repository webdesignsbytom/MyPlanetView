import { devices } from '@playwright/test';
import { test, expect, HOME_MAP, HOME_SHARE_CODE, openMap, toolbar } from './fixtures.js';

// Phone-only behaviour, on a Pixel 7 in this file whichever project runs it (the phone
// project runs only @phone tests, so these run once, in the desktop project): a long press
// on a country shows its postcard (CountryLayer, 17 Nov 2026), the full-screen menu (27 Nov
// 2026), a long dropdown's list, and the tips' "Install the app" when the browser offers to
// install the site (utils/pwa/installPrompt.js), or an iPhone's way.
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
  // ...wholly on the screen, drawn smaller when it fits neither above nor below the finger (27
  // Nov 2026, the user's report: on phones it ran off the bottom). The poster's box keeps its
  // shape while it loads, so the card is its full height already.
  await expect
    .poll(() => card.evaluate((el) => { const r = el.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight && r.height > 200; }))
    .toBe(true);
  // Lifted: it goes, and the press opened no ticket (a tap would have)
  await touch('touchEnd');
  await expect(card).toBeHidden();
  await page.waitForTimeout(600);
  await expect(page.getByRole('dialog', { name: /France/ })).toHaveCount(0);
});

// The phone's menu (27 Nov 2026, the user's wishes): over the whole screen, a close stamp at its
// top right where the Menu stamp is, and room for "View passport"
test.describe('The phone’s menu', () => {
  const menuStamp = (page) => toolbar(page).getByRole('button', { name: 'Menu', exact: true });
  const menuDialog = (page) => page.getByRole('dialog', { name: 'Menu', exact: true });

  test('opens over the whole screen, over everything, and shuts with its close stamp at the top right', async ({ page }) => {
    await openMap(page);
    const stamp = menuStamp(page);
    const stampBox = await stamp.boundingBox();
    await stamp.click();
    const menu = menuDialog(page);
    await expect(menu).toBeVisible();
    await expect(stamp).toHaveAttribute('aria-expanded', 'true');
    const { width, height } = page.viewportSize();
    const box = await menu.boundingBox();
    expect(Math.round(box.x)).toBe(0);
    expect(Math.round(box.y)).toBe(0);
    expect(Math.round(box.width)).toBe(width);
    expect(Math.round(box.height)).toBe(height);
    // Nothing of the map shows through or over it, at any corner
    const corners = [
      [4, 4],
      [width - 4, 4],
      [4, height - 4],
      [width - 4, height - 4],
    ];
    for (const [x, y] of corners) {
      expect(await page.evaluate(([px, py]) => Boolean(document.elementFromPoint(px, py)?.closest('[data-phone-menu]')), [x, y]), `the menu at ${x}, ${y}`).toBe(true);
    }
    // The close stamp sits where the Menu stamp is, and has the focus
    const close = menu.getByRole('button', { name: 'Close the menu' });
    await expect(close).toBeFocused();
    const closeBox = await close.boundingBox();
    expect(Math.abs(closeBox.x + closeBox.width - (stampBox.x + stampBox.width))).toBeLessThan(6);
    expect(Math.abs(closeBox.y - stampBox.y)).toBeLessThan(6);
    await expect(menu.getByRole('button', { name: 'Country list', exact: true })).toBeVisible();
    await close.click();
    await expect(menu).toBeHidden();
    await expect(stamp).toHaveAttribute('aria-expanded', 'false');
    await expect(stamp).toBeFocused();
  });

  test('a tool chosen opens its panel, and Escape shuts the menu', async ({ page }) => {
    await openMap(page);
    await menuStamp(page).click();
    await menuDialog(page).getByRole('button', { name: 'Trips', exact: true }).click();
    await expect(menuDialog(page)).toBeHidden();
    await expect(page.getByRole('dialog', { name: 'Trips', exact: true })).toBeVisible();
    await page.getByRole('dialog', { name: 'Trips', exact: true }).getByRole('button', { name: /^Close/ }).first().click();
    await menuStamp(page).click();
    await expect(menuDialog(page)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(menuDialog(page)).toBeHidden();
    await expect(menuStamp(page)).toBeFocused();
  });

  test('has “View passport”, which opens the map’s passport', async ({ page }) => {
    await openMap(page);
    await menuStamp(page).click();
    const passport = menuDialog(page).getByRole('link', { name: 'View passport', exact: true });
    await expect(passport).toBeVisible();
    await passport.click();
    await expect(page).toHaveURL(/\/maps\/map-home\/passport$/);
    await expect(page.getByRole('heading', { level: 1, name: HOME_MAP })).toBeVisible();
  });

  test('a share link’s menu opens the passport through the link', async ({ page }) => {
    await openMap(page, `/shared/${HOME_SHARE_CODE}`);
    await menuStamp(page).click();
    await menuDialog(page).getByRole('link', { name: 'View passport', exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/shared/${HOME_SHARE_CODE}/passport$`));
  });
});

// A dropdown's list on a small phone (27 Nov 2026, the user's report: lists ran off the screen):
// never taller than the room on the side it opens, so it never slides up over its own box
test.describe('A long dropdown on a small phone', () => {
  test.use({ viewport: { width: 360, height: 560 } });

  test('opens beside its box, within the screen', async ({ page }) => {
    await openMap(page);
    // The site's own dropdown style (styles/select.css) on a list longer than the screen
    await page.evaluate(() => {
      const select = document.createElement('select');
      select.className = 'app-select';
      select.setAttribute('aria-label', 'A long list');
      select.style.cssText = 'position:fixed;top:240px;left:20px;width:320px;z-index:100';
      for (let i = 0; i < 60; i += 1) select.append(new Option(`Option ${i + 1}`, String(i)));
      document.body.append(select);
    });
    const select = page.getByRole('combobox', { name: 'A long list' });
    await select.click();
    const where = () =>
      page.evaluate(() => {
        const box = document.querySelector('select[aria-label="A long list"]');
        const first = box.options[0].getBoundingClientRect();
        return { boxBottom: box.getBoundingClientRect().bottom, firstTop: first.top, open: box.matches(':open') };
      });
    await expect.poll(async () => (await where()).open).toBe(true);
    const { boxBottom, firstTop } = await where();
    // Below its box (there's more room there), never over it
    expect(firstTop).toBeGreaterThanOrEqual(boxBottom);
    await page.keyboard.press('Escape');
  });
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

import { test, expect, HOME_SHARE_CODE, openMap, openTool } from './fixtures.js';

// Monthly photo themes (docs/API.md, "Photo themes"). The mock seeds the server's example
// year from last month on: last month "Doors" (the test user's map has Granada in it), this
// month "Worst weather" (Canals at dusk and Evening by the Seine). Themes run by the UTC month.

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const monthLabel = (offset = 0) => {
  const now = new Date();
  const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset, 1));
  return `${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
};

const themeSection = (panel) => panel.getByRole('region', { name: 'Monthly theme' });

test.describe('Monthly photo themes', () => {
  test('the badges panel shows this month’s theme and its album; a photo comes out from the viewer', async ({ page }) => {
    await openMap(page);
    const panel = await openTool(page, 'Badges and goals', 'Badges and goals');
    const theme = themeSection(panel);
    await expect(theme.getByText('Worst weather', { exact: true })).toBeVisible();
    await expect(theme.getByText('2 photos from this map (18 more can go in)')).toBeVisible();
    await expect(theme.getByRole('button', { name: `${monthLabel(-1)}: Doors (1 photo)` })).toBeVisible();

    await theme.getByRole('button', { name: 'Open the album' }).click();
    const album = page.getByRole('dialog', { name: `Worst weather: ${monthLabel()}` });
    // Newest entry first
    await expect(album.getByRole('button', { name: /^Open / })).toHaveCount(2);
    await album.getByRole('button', { name: 'Open Evening by the Seine' }).click();
    const viewer = page.getByRole('dialog', { name: 'Evening by the Seine' });
    await expect(viewer.getByText(/In this month’s theme:\s*Worst weather/)).toBeVisible();
    await viewer.getByRole('button', { name: 'Take it out of “Worst weather”' }).click();
    await expect(viewer.getByRole('button', { name: 'Enter it in this month’s theme: Worst weather' })).toBeVisible();
    // Escape closes the viewer first: the album has one photo left
    await page.keyboard.press('Escape');
    await expect(viewer).toBeHidden();
    await expect(album.getByRole('button', { name: /^Open / })).toHaveCount(1);
    await page.keyboard.press('Escape');
    await expect(album).toBeHidden();
    await expect(theme.getByText('1 photo from this map (19 more can go in)')).toBeVisible();
  });

  test('an editor chooses photos from anywhere on the map', async ({ page }) => {
    await openMap(page);
    const panel = await openTool(page, 'Badges and goals', 'Badges and goals');
    const theme = themeSection(panel);
    await theme.getByRole('button', { name: 'Choose photos' }).click();
    const picker = page.getByRole('dialog', { name: 'Choose photos for “Worst weather”' });
    // The ones already in are marked and can't be chosen again
    await expect(picker.getByRole('button', { name: 'Canals at dusk (already in the theme)' })).toBeDisabled();
    await picker.getByRole('button', { name: 'Granada', exact: true }).click();
    await picker.getByRole('button', { name: 'Tower Bridge', exact: true }).click();
    await expect(picker.getByText(/18 more can go in this month: 2 chosen\./)).toBeVisible();
    await picker.getByRole('button', { name: 'Enter 2 photos' }).click();
    await expect(picker).toBeHidden();
    await expect(theme.getByText('4 photos from this map (16 more can go in)')).toBeVisible();
  });

  test('a share link shows the albums, with nothing to enter', async ({ page }) => {
    await page.goto(`/shared/${HOME_SHARE_CODE}`);
    await expect(page.getByRole('application', { name: /: world map$/ })).toBeVisible();
    const panel = await openTool(page, 'Badges and goals', 'Badges and goals');
    const theme = themeSection(panel);
    await expect(theme.getByText('2 photos from this map')).toBeVisible();
    await expect(theme.getByRole('button', { name: 'Choose photos' })).toHaveCount(0);
    await theme.getByRole('button', { name: 'Open the album' }).click();
    const album = page.getByRole('dialog', { name: `Worst weather: ${monthLabel()}` });
    await album.getByRole('button', { name: 'Open Canals at dusk' }).click();
    const viewer = page.getByRole('dialog', { name: 'Canals at dusk' });
    await expect(viewer.getByText(/In this month’s theme:\s*Worst weather/)).toBeVisible();
    await expect(viewer.getByRole('button', { name: /Take it out|Enter it/ })).toHaveCount(0);
  });

  test('an admin writes the year ahead: fills a gap, changes and deletes a theme', async ({ page }) => {
    await page.goto('/admin/themes?mockRole=ADMIN');
    await expect(page.getByRole('heading', { level: 1, name: 'Photo Themes' })).toBeVisible();
    const list = page.getByRole('region', { name: 'List of themes' });
    const item = (title) => list.getByRole('article', { name: new RegExp(`: ${title}$`) });
    await expect(item('Worst weather').getByText('Running now')).toBeVisible();
    await expect(item('Worst weather')).toContainText('2 photos entered on 1 map');
    // A theme with photos in can't be deleted; an empty one can
    await expect(item('Doors').getByRole('button', { name: 'Delete Doors' })).toHaveCount(0);
    await expect(item('Street food').getByText('Coming')).toBeVisible();

    // The seed covers eleven months ahead: the twelfth is a gap
    const gap = monthLabel(11);
    await page.getByRole('button', { name: `Write a theme for ${gap}` }).click();
    const dialog = page.getByRole('dialog', { name: 'New theme' });
    await dialog.getByRole('textbox', { name: 'Title' }).fill('Markets');
    await dialog.getByRole('button', { name: 'Make theme' }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByText(`Markets is saved for ${gap}.`)).toBeVisible();
    await expect(page.getByText('Every month of the coming year has a theme.')).toBeVisible();

    await item('Markets').getByRole('button', { name: 'Change Markets' }).click();
    const change = page.getByRole('dialog', { name: 'Change “Markets”' });
    await change.getByRole('textbox', { name: 'Title' }).fill('Night markets');
    await change.getByRole('button', { name: 'Save changes' }).click();
    await expect(item('Night markets')).toBeVisible();

    await item('Night markets').getByRole('button', { name: 'Delete Night markets' }).click();
    await page.getByRole('dialog', { name: 'Delete “Night markets”?' }).getByRole('button', { name: 'Delete theme' }).click();
    await expect(item('Night markets')).toHaveCount(0);
    await expect(page.getByRole('button', { name: `Write a theme for ${gap}` })).toBeVisible();
  });
});

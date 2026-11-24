import { test, expect, openMap, openTool } from './fixtures.js';

// Collector's counts (24 Nov 2026, the user's wish): the UN's 193 member states, a counter in the
// statistics beside the map's own count; the map itself never changes. The seeded map has eight
// places visited or lived in, every one a member state, and three it wants to go to.

test('the statistics count the UN member states been to, and list the ones to go', { tag: '@phone' }, async ({ page }) => {
  await openMap(page);
  const stats = await openTool(page, 'Travel statistics', 'Travel statistics');
  const counts = stats.getByRole('region', { name: 'Collector’s counts' });
  await expect(counts).toContainText('UN member states');
  await expect(counts).toContainText('8 of 193');

  // Folded away until asked for; a wish (Japan) is still to go
  const list = counts.getByRole('list', { name: 'UN member states to go' });
  await expect(list).toBeHidden();
  await counts.getByRole('button', { name: 'Show the 185 to go' }).click();
  await expect(list).toBeVisible();
  await expect(list.getByRole('listitem')).toHaveCount(185);
  await expect(list.locator('[data-un-to-go="FR"]')).toHaveCount(0);

  // Each opens its country's ticket
  await list.getByRole('button', { name: 'Japan', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Japan' })).toBeVisible();
});

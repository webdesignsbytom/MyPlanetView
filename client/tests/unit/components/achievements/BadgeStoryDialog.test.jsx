import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import BadgeStoryDialog from '@/components/achievements/BadgeStoryDialog';
import { getBadgeStory } from '@/api/travelApi';

vi.mock('@/api/travelApi', () => ({ getBadgeStory: vi.fn() }));
// The One Shots' Commons photos are their own chunk
vi.mock('@/hooks/useOneShotPhotos', () => ({ default: () => null }));

const TEN = ['GB', 'IE', 'US', 'NL', 'ES', 'FR', 'PT', 'GR', 'TR', 'MA'];
const placesStory = (codes, extra = {}) => ({
  key: 'countries-10',
  group: 'countries',
  measure: 'countries',
  kind: 'places',
  need: codes.length,
  have: codes.length,
  items: codes.map((code, i) => ({ code, on: `20${10 + i}-06-01` })),
  earnedWith: codes.length - 1,
  ...extra,
});

const BADGE = { key: 'countries-10', group: 'countries', have: 10, need: 10, earnedAt: '2026-11-21T10:00:00.000Z' };

const show = (props = {}) => {
  const onClose = vi.fn();
  const view = render(<BadgeStoryDialog badge={BADGE} where={{ mapId: 'map-1' }} onClose={onClose} {...props} />);
  return { ...view, onClose };
};

beforeEach(() => vi.resetAllMocks());

describe('BadgeStoryDialog', () => {
  it('is a dialog named for the badge, with when it was earned and what it means', async () => {
    getBadgeStory.mockResolvedValue({ story: placesStory(TEN) });
    show();
    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.dataset.badgeStory).toBe('countries-10');
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('Ten countries');
    expect(document.getElementById(dialog.getAttribute('aria-describedby')).textContent).toContain('10 countries visited or lived in');
    expect(dialog.querySelector('[data-badge-earned-on]').textContent).toBe('Earned 21 Nov 2026');
    expect(screen.getByText('Badge earned')).toBeTruthy();
    await waitFor(() => expect(dialog.querySelector('[data-badge-earned-with]')).not.toBeNull());
    expect(getBadgeStory).toHaveBeenCalledWith({ mapId: 'map-1', shareCode: null }, 'countries-10', { travellerId: null });
  });

  it('shows the one that earned it, with its passport stamp, then all of them in order, that one marked', async () => {
    getBadgeStory.mockResolvedValue({ story: placesStory(TEN) });
    const { container } = show();
    const earned = await waitFor(() => {
      const box = container.querySelector('[data-badge-earned-with]');
      expect(box).not.toBeNull();
      return box;
    });
    expect(earned.textContent).toContain('Your tenth country');
    expect(earned.textContent).toContain('Morocco');
    expect(earned.textContent).toContain('1 Jun 2019');
    // The passport's entry stamp, drawn
    expect(earned.querySelector('svg')).not.toBeNull();
    expect(screen.getByText('In the order you went')).toBeTruthy();
    const rows = [...container.querySelectorAll('[data-badge-story-list] li')];
    expect(rows.map((row) => row.textContent.split(/\d{1,2} \w{3} \d{4}/)[0].replace(/^\d+/, ''))).toEqual([
      'United Kingdom',
      'Ireland',
      'United States',
      'Netherlands',
      'Spain',
      'France',
      'Portugal',
      'Greece',
      'Turkey',
      'Morocco',
    ]);
    expect(rows.filter((row) => row.hasAttribute('data-earned-it'))).toEqual([rows[9]]);
    expect(rows[9].textContent).toContain('the one that earned it');
  });

  it('shows a long list’s first ten until all are asked for', async () => {
    const codes = [...TEN, 'JO', 'TZ', 'ZA', 'IN', 'MY', 'NZ', 'MX', 'CU', 'IT', 'AT', 'JP', 'PE', 'IS', 'DE', 'CL'];
    getBadgeStory.mockResolvedValue({ story: placesStory(codes, { key: 'countries-25' }) });
    const { container } = show({ badge: { ...BADGE, key: 'countries-25' } });
    const more = await screen.findByText('Show all 25');
    expect(container.querySelectorAll('[data-badge-story-list] li')).toHaveLength(10);
    fireEvent.click(more);
    expect(container.querySelectorAll('[data-badge-story-list] li')).toHaveLength(25);
    expect(screen.queryByText('Show all 25')).toBeNull();
  });

  it('says so while it loads', () => {
    getBadgeStory.mockReturnValue(new Promise(() => {}));
    const { container } = show();
    expect(screen.getByRole('status').textContent).toContain('Finding what earned it');
    expect(container.querySelector('section').getAttribute('aria-busy')).toBe('true');
  });

  it('says so when it couldn’t load', async () => {
    getBadgeStory.mockRejectedValue(Object.assign(new Error('nope'), { friendlyMessage: 'No response from the server.' }));
    const { container } = show();
    expect(await screen.findByText('No response from the server.')).toBeTruthy();
    expect(screen.queryByRole('status')).toBeNull();
    expect(container.querySelector('section').getAttribute('aria-busy')).toBe('false');
  });

  it('tells an earned badge with fewer to show than it took so, with no one marked', async () => {
    getBadgeStory.mockResolvedValue({ story: placesStory(TEN.slice(0, 9), { need: 10, have: 9, earnedWith: null }) });
    const { container } = show();
    expect(await screen.findByText('It was earned with 10; 9 show on the map now.')).toBeTruthy();
    expect(container.querySelector('[data-badge-earned-with]')).toBeNull();
    expect(container.querySelector('[data-earned-it]')).toBeNull();
  });

  it('shows a stamp’s photo, a One Shot’s place, a theme’s month', async () => {
    getBadgeStory.mockResolvedValue({
      story: {
        key: 'landmarks-1',
        measure: 'landmarks',
        kind: 'stamps',
        need: 1,
        have: 1,
        items: [{ landmarkId: 'l-1', name: 'Eiffel Tower', code: 'FR', isUnesco: false, on: '2014-06-02', ticked: false, thumbUrl: 'https://photos.example/eiffel.webp' }],
        earnedWith: 0,
      },
    });
    const { container, unmount } = show({ badge: { key: 'landmarks-1', group: 'landmarks', earnedAt: null } });
    await waitFor(() => expect(container.querySelector('[data-badge-earned-with]')).not.toBeNull());
    const box = container.querySelector('[data-badge-earned-with]');
    expect(box.textContent).toContain('Your first passport stamp');
    expect(box.textContent).toContain('Eiffel Tower');
    expect(box.textContent).toContain('France');
    expect(box.querySelector('image').getAttribute('href')).toBe('https://photos.example/eiffel.webp');
    // One thing: no list
    expect(container.querySelector('[data-badge-story-list]')).toBeNull();
    expect(container.querySelector('[data-badge-earned-on]').textContent).toBe('Earned');
    unmount();

    getBadgeStory.mockResolvedValue({
      story: {
        key: 'themes-3',
        measure: 'themes',
        kind: 'themes',
        need: 3,
        have: 3,
        items: ['Doors', 'Worst weather', 'Reflections'].map((title, i) => ({ title, month: `2026-0${i + 1}-01`, on: `2026-0${i + 1}-05` })),
        earnedWith: 2,
      },
    });
    const themes = show({ badge: { key: 'themes-3', group: 'themes', earnedAt: '2026-03-05' } });
    expect(await screen.findByText('Your third monthly theme')).toBeTruthy();
    expect(themes.container.querySelector('[data-badge-earned-with]').textContent).toContain('March 2026');
    expect(screen.getByText('In the order entered')).toBeTruthy();
  });

  it('shows the photo that reached a photo badge’s number', async () => {
    getBadgeStory.mockResolvedValue({
      story: { key: 'photos-100', measure: 'photos', kind: 'photos', need: 100, have: 100, items: [], earnedWith: null, photo: { id: 'p', video: false, code: 'FR', addedOn: '2024-03-03', takenOn: null, thumbUrl: 'https://photos.example/p.webp' } },
    });
    const { container } = show({ badge: { key: 'photos-100', group: 'photos', earnedAt: '2024-03-03' } });
    expect(await screen.findByText('Your 100th photo went on the map on 3 Mar 2024.')).toBeTruthy();
    expect(container.querySelector('img').getAttribute('src')).toBe('https://photos.example/p.webp');
    expect(screen.queryByText(/It was earned with/)).toBeNull();
  });

  it('shows a country collection’s medal as its badge', async () => {
    getBadgeStory.mockResolvedValue({
      story: { key: 'collect-IE-bronze', measure: 'collection', kind: 'stamps', place: 'IE', tier: 'bronze', need: 1, have: 1, items: [{ landmarkId: 'l', name: 'Cliffs of Moher', code: 'IE', isUnesco: false, on: '2019-08-03', ticked: true, thumbUrl: null }], earnedWith: 0 },
    });
    show({ badge: { key: 'collect-IE-bronze', group: 'collections', place: 'IE', tier: 'bronze', earnedAt: '2026-11-24' } });
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('Bronze for Ireland');
    expect(await screen.findByText('Won Ireland’s bronze')).toBeTruthy();
  });

  it('is one traveller’s badge, from their trips, when it’s theirs', async () => {
    getBadgeStory.mockResolvedValue({ story: placesStory(['PT'], { key: 'countries-1', items: [{ code: 'PT', on: '2025-03-08', trip: { id: 't', title: 'Lisbon' } }] }) });
    const { container } = show({ badge: { key: 'countries-1', group: 'countries', earnedAt: '2025-03-08' }, traveller: { id: 'trav-1', name: 'Ann' } });
    expect(screen.getByText('Ann’s badge')).toBeTruthy();
    expect(await screen.findByText('Ann’s first country')).toBeTruthy();
    expect(container.querySelector('[data-badge-earned-with]').textContent).toContain('On Lisbon, 8 Mar 2025');
    expect(getBadgeStory).toHaveBeenCalledWith({ mapId: 'map-1', shareCode: null }, 'countries-1', { travellerId: 'trav-1' });
  });

  it('asks through a share link’s code', () => {
    getBadgeStory.mockResolvedValue({ story: placesStory(TEN) });
    show({ where: { shareCode: 'ABCD-EFGH-JKMN' } });
    expect(getBadgeStory).toHaveBeenCalledWith({ mapId: null, shareCode: 'ABCD-EFGH-JKMN' }, 'countries-10', { travellerId: null });
  });

  it('closes with its stamp, “Carry on”, Escape or a press outside it', async () => {
    getBadgeStory.mockResolvedValue({ story: placesStory(TEN) });
    const { container, onClose } = show();
    fireEvent.click(screen.getByText('Carry on'));
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.mouseDown(container.firstChild);
    // A press inside it doesn't
    fireEvent.mouseDown(screen.getByRole('dialog'));
    expect(onClose).toHaveBeenCalledTimes(4);
    await waitFor(() => expect(container.querySelector('[data-badge-earned-with]')).not.toBeNull());
  });
});

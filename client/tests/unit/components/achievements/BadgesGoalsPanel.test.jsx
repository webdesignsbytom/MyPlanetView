import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BadgesGoalsPanel from '@/components/achievements/BadgesGoalsPanel';
import ThemeSection from '@/components/themes/ThemeSection';

// The theme section has its own tests; here it only records what it's given
vi.mock('@/components/themes/ThemeSection', () => ({ default: vi.fn(() => <div data-theme-section='' />) }));

const GOALS = [{ id: 'g-1', kind: 'COUNTRY_COUNT', target: 10, progress: { have: 4, need: 10 } }];
const BADGES = [
  { key: 'countries-1', group: 'countries', earnedAt: '2026-01-01' },
  { key: 'countries-5', group: 'countries', have: 2, need: 5 },
];

const achievementsWith = (extra = {}) => ({
  badges: BADGES,
  goals: GOALS,
  loading: false,
  error: null,
  addGoal: vi.fn().mockResolvedValue(),
  editGoal: vi.fn().mockResolvedValue(),
  removeGoal: vi.fn().mockResolvedValue(),
  check: vi.fn(),
  ...extra,
});

const open = (props = {}) => {
  const onClose = vi.fn();
  const achievements = props.achievements || achievementsWith();
  const view = render(
    <MemoryRouter>
      <BadgesGoalsPanel achievements={achievements} mapId='map-1' onClose={onClose} {...props} />
    </MemoryRouter>,
  );
  return { ...view, onClose, achievements };
};

describe('BadgesGoalsPanel', { timeout: 20000 }, () => {
  it('is a map panel named Badges and goals', () => {
    const { container, onClose } = open();
    const panel = container.querySelector('[data-map-panel]');
    expect(panel.getAttribute('role')).toBe('dialog');
    expect(container.querySelector('h2').textContent).toBe('Badges and goals');
    fireEvent.click(screen.getByLabelText('Close Badges and goals'));
    expect(onClose).toHaveBeenCalled();
  });

  it('shows a spinner until the badges arrive, and the error', () => {
    open({ achievements: achievementsWith({ badges: null, goals: null, loading: true, error: 'Could not load.' }) });
    expect(screen.getByText('Loading badges and goals…')).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toBe('Could not load.');
  });

  it('lists the goals and the badges on the suitcase', () => {
    const { container } = open();
    expect(screen.getByText('4 of 10 countries')).toBeTruthy();
    expect(screen.getByText(/1 of 2 earned\./)).toBeTruthy();
    expect(container.querySelector('[data-theme-section]')).toBeTruthy();
  });

  it('gives viewers no goal buttons', () => {
    open({ achievements: achievementsWith({ goals: [] }) });
    expect(screen.getByText('No goals on this map yet.')).toBeTruthy();
    expect(screen.queryByText('Add a goal')).toBeNull();
  });

  it('adds a goal for an editor, then puts the button back', async () => {
    const { achievements } = open({ canEdit: true, achievements: achievementsWith({ goals: [] }) });
    expect(screen.getByText(/No goals yet\. Set one/)).toBeTruthy();
    fireEvent.click(screen.getByText('Add a goal'));
    fireEvent.change(screen.getByLabelText(/How many countries/), { target: { value: '12' } });
    fireEvent.click(screen.getByText('Add goal'));
    await waitFor(() => expect(achievements.addGoal).toHaveBeenCalledWith({ kind: 'COUNTRY_COUNT', target: 12, title: null, deadline: null }));
    await waitFor(() => expect(screen.getByText('Add a goal')).toBeTruthy());
  });

  it('changes a goal in place', async () => {
    const { achievements } = open({ canEdit: true });
    fireEvent.click(screen.getByLabelText('Edit 10 countries'));
    expect(screen.queryByText('Add a goal')).toBeNull();
    fireEvent.change(screen.getByLabelText('Name it (optional)'), { target: { value: 'Ten' } });
    fireEvent.click(screen.getByText('Save goal'));
    await waitFor(() => expect(achievements.editGoal).toHaveBeenCalledWith('g-1', { title: 'Ten' }));
  });

  it('deletes through the achievements', async () => {
    const { achievements } = open({ canEdit: true });
    fireEvent.click(screen.getByLabelText('Delete 10 countries'));
    fireEvent.click(screen.getByText('Yes, delete'));
    await waitFor(() => expect(achievements.removeGoal).toHaveBeenCalledWith('g-1'));
  });

  it('says when the map holds as many goals as it can', () => {
    const goals = Array.from({ length: 50 }, (_, i) => ({ id: `g-${i}`, kind: 'COUNTRY_COUNT', target: i + 1, progress: { have: 0, need: i + 1 } }));
    open({ canEdit: true, achievements: achievementsWith({ goals }) });
    expect(screen.getByText('This map has 50 goals, the most it can hold. Delete one to add another.')).toBeTruthy();
    expect(screen.queryByText('Add a goal')).toBeNull();
  });

  it('tells someone unverified why they can’t set goals', () => {
    open({ locked: true, achievements: achievementsWith({ goals: [] }) });
    expect(screen.getByText(/Verify your email address to set goals\./)).toBeTruthy();
    expect(screen.getByText(/No goals yet\. Set one/)).toBeTruthy();
  });

  it('links to the map’s passport, or a share link’s', () => {
    const { container, unmount } = open();
    expect(container.querySelector('footer a').getAttribute('href')).toBe('/maps/map-1/passport');
    unmount();
    const shared = open({ mapId: null, shareCode: 'ABCD-EFGH-JKLM' });
    expect(shared.container.querySelector('footer a').getAttribute('href')).toBe('/shared/ABCD-EFGH-JKLM/passport');
  });

  it('gives the theme section what it needs, never editing through a share link', () => {
    const check = vi.fn();
    open({ canEdit: true, locked: true, mapId: 'map-1', achievements: achievementsWith({ check }) });
    expect(ThemeSection.mock.lastCall[0]).toMatchObject({ mapId: 'map-1', shareCode: null, canEdit: true, locked: true, onChanged: check });
    open({ canEdit: true, locked: true, mapId: null, shareCode: 'CODE' });
    expect(ThemeSection.mock.lastCall[0]).toMatchObject({ shareCode: 'CODE', canEdit: false, locked: false });
  });

  it('has no theme section without a map or a link', () => {
    const { container } = open({ mapId: null });
    expect(container.querySelector('[data-theme-section]')).toBeNull();
    expect(container.querySelector('footer')).toBeNull();
  });

  // The country collections (24 Nov 2026): their own group on the suitcase, a medal to share
  describe('the country collections', () => {
    const withCollections = (extra = {}) =>
      achievementsWith({
        badges: [
          ...BADGES,
          { key: 'collect-MT-bronze', group: 'collections', place: 'MT', tier: 'bronze', have: 1, need: 1, earnedAt: '2026-11-24' },
          { key: 'collect-MT-silver', group: 'collections', place: 'MT', tier: 'silver', have: 1, need: 2, earnedAt: null },
          { key: 'collect-MT-gold', group: 'collections', place: 'MT', tier: 'gold', have: 1, need: 3, earnedAt: null },
        ],
        ...extra,
      });

    it('shows a place’s medals under Country collections, and shares the best one', () => {
      const onShareCollection = vi.fn();
      const { container } = open({ achievements: withCollections(), onShareCollection });
      expect(screen.getByRole('heading', { name: 'Country collections' })).toBeTruthy();
      expect(container.querySelector('[data-collection="MT"]').textContent).toContain('1 of 3 landmarks stamped');
      fireEvent.click(screen.getByRole('button', { name: 'Share your bronze medal for Malta' }));
      expect(onShareCollection).toHaveBeenCalledWith(expect.objectContaining({ place: 'MT', best: 'bronze' }));
    });

    it('offers no sharing through a share link, nor on one traveller’s badges', () => {
      const shared = open({ achievements: withCollections() });
      expect(screen.queryByRole('button', { name: /^Share your/ })).toBeNull();
      shared.unmount();
      const travellers = [
        { id: 't-1', name: 'Charlie', badges: [{ key: 'countries-1', group: 'countries', earned: true, earnedOn: '2025-07-04' }] },
        { id: 't-2', name: 'Alex', badges: [] },
      ];
      open({ perPerson: true, achievements: withCollections({ travellers }), onShareCollection: vi.fn() });
      fireEvent.click(screen.getByText('Charlie'));
      expect(screen.queryByRole('heading', { name: 'Country collections' })).toBeNull();
    });
  });

  describe('a family’s badges per person', () => {
    const travellers = [
      { id: 't-1', name: 'Charlie', badges: [{ key: 'countries-1', group: 'countries', earned: true, earnedOn: '2025-07-04' }] },
      { id: 't-2', name: 'Alex', badges: [{ key: 'countries-1', group: 'countries', earned: false, have: 0, need: 1 }] },
    ];

    it('switches the suitcase to one traveller’s badges, dated by their trip', () => {
      open({ perPerson: true, achievements: achievementsWith({ travellers }) });
      expect(screen.getByText('Everyone').getAttribute('aria-pressed')).toBe('true');
      fireEvent.click(screen.getByText('Charlie'));
      expect(screen.getByText('Charlie').getAttribute('aria-pressed')).toBe('true');
      expect(screen.getByText(/From the completed trips Charlie was on\./)).toBeTruthy();
      expect(screen.getByText('Earned 4 Jul 2025')).toBeTruthy();
      fireEvent.click(screen.getByText('Everyone'));
      expect(screen.queryByText(/From the completed trips/)).toBeNull();
    });

    it('has no switch on a couple’s map or with one traveller', () => {
      open({ perPerson: false, achievements: achievementsWith({ travellers }) });
      expect(screen.queryByText('Everyone')).toBeNull();
      open({ perPerson: true, achievements: achievementsWith({ travellers: travellers.slice(0, 1) }) });
      expect(screen.queryByText('Everyone')).toBeNull();
    });
  });
});

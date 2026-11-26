// Vs mode's cards (26 Nov 2026; docs/API.md "Vs mode")
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import VsBadges from '@/components/vs/VsBadges';
import VsCategories from '@/components/vs/VsCategories';
import VsCreateCard from '@/components/vs/VsCreateCard';
import VsDetail from '@/components/vs/VsDetail';
import VsInviteCard from '@/components/vs/VsInviteCard';
import VsListCard from '@/components/vs/VsListCard';
import VsMedal from '@/components/vs/VsMedal';
import VsMedalTable from '@/components/vs/VsMedalTable';
import VsMyMapCard from '@/components/vs/VsMyMapCard';
import VsSettingsCard from '@/components/vs/VsSettingsCard';
import { createVsGroup, deleteVsGroup, getMyVsGroups, getVsGroup, leaveVsGroup, renameVsGroup, resetVsLink, setMyVsMap } from '@/api/vsApi';
import { getMyMaps } from '@/api/travelApi';
import useMustVerifyEmail from '@/hooks/useMustVerifyEmail';
import { VS_CATEGORIES } from '@/utils/vs/vsRules';
import { elsewhere, renderPage } from '../../pages/renderPage';

vi.mock('@/api/vsApi', () => ({
  createVsGroup: vi.fn(),
  deleteVsGroup: vi.fn(),
  getMyVsGroups: vi.fn(),
  getVsGroup: vi.fn(),
  leaveVsGroup: vi.fn(),
  renameVsGroup: vi.fn(),
  resetVsLink: vi.fn(),
  setMyVsMap: vi.fn(),
}));
vi.mock('@/api/travelApi', () => ({ getMyMaps: vi.fn() }));
vi.mock('@/hooks/useMustVerifyEmail', () => ({ default: vi.fn(() => false) }));
// The share picture's dialog: what it was handed
vi.mock('@/components/map/lazyMapPanels', () => ({
  ShareCardDialog: ({ card, title, onClose }) => (
    <div data-share-dialog={title}>
      {card.shareText}
      <button type='button' onClick={onClose}>
        Close it
      </button>
    </div>
  ),
}));

const MAPS = [
  { id: 'm-own', name: 'My map', role: 'OWNER' },
  { id: 'm-edit', name: 'Our trips', role: 'EDITOR' },
  { id: 'm-view', name: 'Their map', role: 'VIEWER' },
];

const values = (n) => Object.fromEntries(VS_CATEGORIES.map((c) => [c, n]));
const medals = (medal) => Object.fromEntries(VS_CATEGORIES.map((c) => [c, medal]));
const member = (over) => ({
  name: 'Jo',
  isYou: false,
  startedIt: false,
  counting: true,
  values: values(1),
  badges: [],
  medals: medals(null),
  gold: 0,
  silver: 0,
  bronze: 0,
  place: 1,
  ...over,
});
const group = (over = {}) => ({
  id: 'vs-1',
  title: 'Who has travelled most?',
  joinCode: 'VS22-FRND-8MAX',
  youStartedIt: false,
  myMap: { id: 'm-own', name: 'My map' },
  categories: VS_CATEGORIES,
  memberLimit: 8,
  members: [
    member({ name: 'Charlie', isYou: true, values: values(5), medals: medals('gold'), gold: 10, place: 1, badges: ['first-steps', 'globetrotter'] }),
    member({ name: 'Sam', startedIt: true, values: values(2), medals: medals('silver'), silver: 10, place: 2, badges: ['first-steps'] }),
  ],
  ...over,
});
const failure = (message) => Object.assign(new Error('no'), { friendlyMessage: message });

beforeEach(() => {
  vi.clearAllMocks();
  getMyMaps.mockResolvedValue({ maps: MAPS });
  useMustVerifyEmail.mockReturnValue(false);
});

describe('VsMedal', () => {
  it('is a named disc in its metal, or nothing', () => {
    const { container, rerender } = render(<VsMedal medal='silver' />);
    expect(screen.getByRole('img').getAttribute('aria-label')).toBe('Silver');
    expect(container.querySelector('[data-medal="silver"]')).not.toBeNull();
    rerender(<VsMedal medal={null} />);
    expect(container.innerHTML).toBe('');
  });
});

describe('VsMedalTable', () => {
  it('lists everyone by place with their medals, someone with no map last', () => {
    const { container } = render(
      <VsMedalTable
        members={[
          member({ name: 'Zed', counting: false, values: null, place: null }),
          member({ name: 'Sam', silver: 3, place: 2 }),
          member({ name: 'Charlie', isYou: true, gold: 4, bronze: 1, place: 1 }),
        ]}
      />,
    );
    const rows = [...container.querySelectorAll('[data-vs-member]')].map((tr) => [...tr.querySelectorAll('td')].map((td) => td.textContent));
    expect(rows).toEqual([
      ['1st', 'Charlie (you)', '4', '0', '1'],
      ['2nd', 'Sam', '0', '3', '0'],
      ['–', 'ZedNo map counting', '0', '0', '0'],
    ]);
    expect([...container.querySelectorAll('thead [data-medal]')].map((m) => m.getAttribute('aria-label'))).toEqual(['Gold', 'Silver', 'Bronze']);
  });
});

describe('VsCategories', () => {
  it('puts two people head to head, every category with its numbers and medals', () => {
    const { container } = render(<VsCategories categories={VS_CATEGORIES} members={group().members} />);
    expect(container.querySelector('[data-vs-head-to-head]')).not.toBeNull();
    const sections = container.querySelectorAll('[data-vs-category]');
    expect(sections).toHaveLength(VS_CATEGORIES.length);
    const distance = container.querySelector('[data-vs-category="distanceKm"]');
    expect(distance.querySelector('h3').textContent).toBe('Distance travelled');
    expect(distance.textContent).toContain('5 km');
    expect(distance.textContent).toContain('2 km');
    expect([...distance.querySelectorAll('[data-medal]')].map((m) => m.getAttribute('data-medal'))).toEqual(['gold', 'silver']);
    expect(container.textContent).toContain('Charlie (you)');
  });

  it('ranks three or more in each category, ties sharing a place, leaving out anyone with no map', () => {
    const members = [
      member({ name: 'Charlie', isYou: true, values: { ...values(1), countries: 4 }, medals: { ...medals(null), countries: 'gold' } }),
      member({ name: 'Sam', values: { ...values(1), countries: 2 } }),
      member({ name: 'Jo', values: { ...values(1), countries: 2 } }),
      member({ name: 'Zed', counting: false, values: null }),
    ];
    const { container } = render(<VsCategories categories={['countries']} members={members} />);
    expect(container.querySelector('[data-vs-head-to-head]')).toBeNull();
    const items = [...container.querySelectorAll('[data-vs-category="countries"] li')].map((li) => li.textContent);
    expect(items).toEqual(['1stCharlie (you)4', '2ndJo2', '2ndSam2']);
  });
});

describe('VsBadges', () => {
  it('lists the badges only some have, with who, and counts the ones everyone has', () => {
    const { container } = render(<VsBadges members={group().members} />);
    expect(container.textContent).toContain('1 badge you all have');
    const items = [...container.querySelectorAll('[data-vs-badge]')];
    expect(items.map((li) => li.getAttribute('data-vs-badge'))).toEqual(['globetrotter']);
    expect(items[0].textContent).toContain('Only you');
  });

  it('waits for a friend, and says when everyone has the same', () => {
    const { container, rerender } = render(<VsBadges members={[group().members[0]]} />);
    expect(container.textContent).toContain('Once a friend joins');
    rerender(<VsBadges members={[member({ name: 'A', badges: ['first-steps'] }), member({ name: 'B', badges: ['first-steps'] })]} />);
    expect(container.textContent).toBe('You all have the same badge.');
  });

  it('shows twelve, then all', () => {
    const many = Array.from({ length: 14 }, (_, i) => `collect-p${i}-gold`);
    render(<VsBadges members={[member({ name: 'A', badges: many }), member({ name: 'B' })]} />);
    expect(document.querySelectorAll('[data-vs-badge]')).toHaveLength(12);
    fireEvent.click(screen.getByText('Show all 14'));
    expect(document.querySelectorAll('[data-vs-badge]')).toHaveLength(14);
  });
});

describe('VsListCard', () => {
  it('lists the comparisons you’re in, each a link', async () => {
    getMyVsGroups.mockResolvedValue({
      groups: [
        { id: 'vs-1', title: 'The gang', memberCount: 3, youStartedIt: true, hasMap: true },
        { id: 'vs-2', title: 'Work', memberCount: 1, youStartedIt: false, hasMap: false },
      ],
    });
    renderPage(<VsListCard />);
    const link = await screen.findByText('The gang');
    expect(link.getAttribute('href')).toBe('/vs/vs-1');
    expect(document.querySelector('[data-vs-group="vs-1"]').textContent).toContain('3 people · you started it');
    expect(document.querySelector('[data-vs-group="vs-2"]').textContent).toContain('Just you so far · no map counting for you');
  });

  it('says when there are none, or they couldn’t load', async () => {
    getMyVsGroups.mockResolvedValue({ groups: [] });
    const { unmount } = renderPage(<VsListCard />);
    expect(await screen.findByText(/None yet/)).toBeTruthy();
    unmount();
    getMyVsGroups.mockRejectedValue(failure('Offline.'));
    renderPage(<VsListCard />);
    expect((await screen.findByRole('alert')).textContent).toBe('Offline.');
  });
});

describe('VsCreateCard', () => {
  it('starts one with the map that counts, then opens it', async () => {
    createVsGroup.mockResolvedValue({ group: { id: 'vs-new' } });
    renderPage(<VsCreateCard />, { path: '/vs' });
    const select = await screen.findByLabelText('The map that counts for you');
    await waitFor(() => expect(select.value).toBe('m-own'));
    expect([...select.querySelectorAll('option')].map((o) => o.value).filter(Boolean)).toEqual(['m-own', 'm-edit']);
    fireEvent.change(select, { target: { value: 'm-edit' } });
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: ' The gang ' } });
    fireEvent.click(screen.getByText('Start the comparison'));
    await waitFor(() => expect(elsewhere().getAttribute('data-elsewhere')).toBe('/vs/vs-new'));
    expect(createVsGroup).toHaveBeenCalledWith({ title: 'The gang', mapId: 'm-edit' });
  });

  it('uses the usual title when none is typed, and says why it failed', async () => {
    createVsGroup.mockRejectedValue(failure('You’re in 30 comparisons.'));
    renderPage(<VsCreateCard />, { path: '/vs' });
    await waitFor(() => expect(screen.getByLabelText('The map that counts for you').value).toBe('m-own'));
    fireEvent.click(screen.getByText('Start the comparison'));
    expect((await screen.findByRole('alert')).textContent).toBe('You’re in 30 comparisons.');
    expect(createVsGroup).toHaveBeenCalledWith({ title: 'Who has travelled most?', mapId: 'm-own' });
  });

  it('asks an unverified address to verify first', () => {
    renderPage(<VsCreateCard locked />, { path: '/vs' });
    expect(screen.getByText('Verify your email address to start one.')).toBeTruthy();
    expect(screen.queryByText('Start the comparison')).toBeNull();
  });
});

describe('VsInviteCard', () => {
  it('shows the link and how many are in, and copies it', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    render(<VsInviteCard group={group()} onChanged={vi.fn()} />);
    expect(screen.getByLabelText('Join link').value).toBe(`${window.location.origin}/vs/join/VS22-FRND-8MAX`);
    expect(document.querySelector('[data-vs-count]').textContent).toMatch(/^2 of 8 in\./);
    fireEvent.click(screen.getByText('Copy link'));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/vs/join/VS22-FRND-8MAX`));
    expect(await screen.findByText(/^Copied/)).toBeTruthy();
    expect(screen.queryByText('Make a new link')).toBeNull();
  });

  it('says when it’s full, and lets the starter make a new link after asking', async () => {
    const eight = Array.from({ length: 8 }, (_, i) => member({ name: `P${i}` }));
    resetVsLink.mockResolvedValue({ group: group({ joinCode: 'NEW2-LINK-HERE' }) });
    const onChanged = vi.fn();
    render(<VsInviteCard group={group({ members: eight })} canReset onChanged={onChanged} />);
    expect(screen.getByText('8 people are in, the most a comparison can have.')).toBeTruthy();
    fireEvent.click(screen.getByText('Make a new link'));
    expect(screen.getByText(/The old one stops working/)).toBeTruthy();
    fireEvent.click(screen.getAllByText('Make a new link')[0]);
    await waitFor(() => expect(onChanged).toHaveBeenCalledWith(expect.objectContaining({ joinCode: 'NEW2-LINK-HERE' })));
    expect(resetVsLink).toHaveBeenCalledWith('vs-1');
  });
});

describe('VsMyMapCard', () => {
  it('changes the map that counts, and leaves', async () => {
    setMyVsMap.mockResolvedValue({ group: group({ myMap: { id: 'm-edit', name: 'Our trips' } }) });
    leaveVsGroup.mockResolvedValue({});
    const onChanged = vi.fn();
    renderPage(<VsMyMapCard group={group()} onChanged={onChanged} />, { path: '/vs/vs-1' });
    expect(screen.getByText(/Counting “My map”/)).toBeTruthy();
    const select = await screen.findByLabelText('The map that counts for you');
    await waitFor(() => expect(select.querySelectorAll('option').length).toBeGreaterThan(1));
    expect(screen.getByText('Count this map').closest('button').disabled).toBe(true);
    fireEvent.change(select, { target: { value: 'm-edit' } });
    fireEvent.click(screen.getByText('Count this map'));
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
    expect(setMyVsMap).toHaveBeenCalledWith('vs-1', 'm-edit');
    fireEvent.click(screen.getByText('Leave the comparison'));
    await waitFor(() => expect(elsewhere().getAttribute('data-elsewhere')).toBe('/vs'));
  });

  it('says when no map counts, locks it while unverified, and the starter can’t leave', () => {
    const lost = group({ youStartedIt: true, myMap: null, members: [member({ isYou: true, counting: false, values: null })] });
    renderPage(<VsMyMapCard group={lost} locked onChanged={vi.fn()} />, { path: '/vs/vs-1' });
    expect(screen.getByText(/No map is counting for you/)).toBeTruthy();
    expect(screen.getByText('Verify your email address to change the map that counts.')).toBeTruthy();
    expect(screen.queryByText('Leave the comparison')).toBeNull();
  });
});

describe('VsSettingsCard', () => {
  it('renames it, and deletes it after asking', async () => {
    renameVsGroup.mockResolvedValue({ group: group({ title: 'Gang' }) });
    deleteVsGroup.mockResolvedValue({});
    const onChanged = vi.fn();
    renderPage(<VsSettingsCard group={group({ youStartedIt: true })} onChanged={onChanged} />, { path: '/vs/vs-1' });
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Gang' } });
    fireEvent.click(screen.getByText('Save'));
    expect(await screen.findByText('Saved.')).toBeTruthy();
    expect(renameVsGroup).toHaveBeenCalledWith('vs-1', 'Gang');
    fireEvent.click(screen.getByText('Delete the comparison'));
    expect(screen.getByText(/for everyone in it\? It can’t be undone/)).toBeTruthy();
    fireEvent.click(screen.getByText('Delete it'));
    await waitFor(() => expect(elsewhere().getAttribute('data-elsewhere')).toBe('/vs'));
    expect(deleteVsGroup).toHaveBeenCalledWith('vs-1');
  });
});

describe('VsDetail', () => {
  it('shows the medal table, everything compared, the badges, the link and your map', async () => {
    getVsGroup.mockResolvedValue({ group: group() });
    renderPage(<VsDetail groupId='vs-1' />, { path: '/vs/:groupId', at: '/vs/vs-1' });
    expect(await screen.findByText('Who has travelled most?')).toBeTruthy();
    expect(getVsGroup).toHaveBeenCalledWith('vs-1');
    expect(document.querySelector('h1').textContent).toBe('Who has travelled most?');
    expect(document.body.textContent).toContain('You’re 1st of 2: 10 gold.');
    expect(screen.getByText('Medal table')).toBeTruthy();
    expect(screen.getByText('Head to head')).toBeTruthy();
    expect(document.querySelector('[data-vs-badges]')).not.toBeNull();
    expect(screen.getByText('Bring your friends')).toBeTruthy();
    expect(screen.getByText('Your map')).toBeTruthy();
    // Only the starter changes it
    expect(screen.queryByText('Change the comparison')).toBeNull();
  });

  it('shares a picture of your medals once you have one', async () => {
    getVsGroup.mockResolvedValue({ group: group() });
    renderPage(<VsDetail groupId='vs-1' />, { path: '/vs/:groupId', at: '/vs/vs-1' });
    fireEvent.click(await screen.findByText('Share a picture'));
    const dialog = await waitFor(() => document.querySelector('[data-share-dialog]'));
    expect(dialog.getAttribute('data-share-dialog')).toBe('Share your medals');
    expect(dialog.textContent).toContain('1st place in “Who has travelled most?”: 10 gold.');
    fireEvent.click(screen.getByText('Close it'));
    expect(document.querySelector('[data-share-dialog]')).toBeNull();
  });

  it('has no picture without a medal, ranks three, and gives the starter the changes', async () => {
    const three = group({
      youStartedIt: true,
      members: [
        member({ name: 'Charlie', isYou: true, place: 3 }),
        member({ name: 'Sam', gold: 1, place: 1 }),
        member({ name: 'Jo', silver: 1, place: 2 }),
      ],
    });
    getVsGroup.mockResolvedValue({ group: three });
    renderPage(<VsDetail groupId='vs-1' />, { path: '/vs/:groupId', at: '/vs/vs-1' });
    expect(await screen.findByText('Everything compared')).toBeTruthy();
    expect(screen.queryByText('Share a picture')).toBeNull();
    expect(screen.getByText('Change the comparison')).toBeTruthy();
    expect(screen.getByText('Make a new link')).toBeTruthy();
  });

  it('alone: your numbers, and medals once a friend joins', async () => {
    getVsGroup.mockResolvedValue({ group: group({ members: [member({ name: 'Charlie', isYou: true })] }) });
    renderPage(<VsDetail groupId='vs-1' />, { path: '/vs/:groupId', at: '/vs/vs-1' });
    expect(await screen.findByText('Your numbers so far. Medals come once a friend joins.')).toBeTruthy();
    expect(document.body.textContent).toContain('Everyone’s travels compared');
  });

  it('says when it can’t be opened, as the page’s one heading', async () => {
    getVsGroup.mockRejectedValue(failure('That comparison doesn’t exist, or you’re not in it.'));
    renderPage(<VsDetail groupId='vs-1' />, { path: '/vs/:groupId', at: '/vs/vs-1' });
    expect((await screen.findByRole('alert')).textContent).toBe('That comparison doesn’t exist, or you’re not in it.');
    expect(document.querySelector('h1').textContent).toBe('Vs mode');
    expect(screen.getByText('Your comparisons').getAttribute('href')).toBe('/vs');
  });
});

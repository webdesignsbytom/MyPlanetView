import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import BadgeOwnerSwitch from '@/components/achievements/BadgeOwnerSwitch';
import BadgeSticker from '@/components/achievements/BadgeSticker';
import BadgeSuitcase, { BADGE_GROUPS_CLOSED_KEY } from '@/components/achievements/BadgeSuitcase';
import GoalProgressBar from '@/components/achievements/GoalProgressBar';

const TRAVELLERS = [
  { id: 't-1', name: 'Charlie' },
  { id: 't-2', name: 'Alex' },
];

describe('BadgeOwnerSwitch', () => {
  it('offers everyone first, then each traveller, in a labelled group', () => {
    render(<BadgeOwnerSwitch travellers={TRAVELLERS} value={null} onChange={vi.fn()} />);
    const group = screen.getByRole('group');
    expect(group.getAttribute('aria-label')).toBe('Whose badges');
    const buttons = within(group).getAllByRole('button');
    expect(buttons.map((b) => b.textContent)).toEqual(['Everyone', 'Charlie', 'Alex']);
    expect(buttons.map((b) => b.getAttribute('aria-pressed'))).toEqual(['true', 'false', 'false']);
  });

  it('presses the chosen traveller and reports each choice', () => {
    const onChange = vi.fn();
    render(<BadgeOwnerSwitch travellers={TRAVELLERS} value='t-2' onChange={onChange} />);
    expect(screen.getByText('Alex').getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText('Everyone').getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(screen.getByText('Charlie'));
    expect(onChange).toHaveBeenLastCalledWith('t-1');
    fireEvent.click(screen.getByText('Everyone'));
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it('takes the passport page’s words', () => {
    render(<BadgeOwnerSwitch travellers={TRAVELLERS} value={null} onChange={vi.fn()} label='Whose passport' everyone='The whole family' />);
    expect(screen.getByRole('group').getAttribute('aria-label')).toBe('Whose passport');
    expect(screen.getByText('The whole family')).toBeTruthy();
  });
});

describe('BadgeSticker', () => {
  const sticker = (badge) => render(<ul><BadgeSticker badge={badge} /></ul>).container.querySelector('li');

  it('shows an earned badge with its day and description', () => {
    const li = sticker({ key: 'countries-10', group: 'countries', earnedAt: '2026-03-12T10:00:00Z' });
    expect(li.textContent).toContain('Ten countries');
    expect(li.textContent).toContain('Earned 12 Mar 2026');
    expect(li.getAttribute('title')).toContain('10 countries visited or lived in');
    expect(li.querySelector('.sr-only').textContent).toContain('10 countries visited');
    expect(li.querySelector('[aria-hidden="true"]').className).toContain('border-double');
  });

  it('says only "Earned" for a traveller’s badge from a trip with no dates', () => {
    const li = sticker({ key: 'landmarks-1', group: 'landmarks', earned: true });
    expect(li.textContent).toContain('First stamp');
    expect(screen.getByText('Earned').className).toContain('text-poster-red-deep');
  });

  it('shows how far along one not earned yet is, as a dashed outline', () => {
    const li = sticker({ key: 'countries-25', group: 'countries', have: 3, need: 25 });
    expect(li.textContent).toContain('3 of 25');
    expect(li.textContent).not.toContain('Earned');
    expect(li.querySelector('[aria-hidden="true"]').className).toContain('border-dashed');
  });

  // 27 Nov 2026, the user's wish: an earned badge opens its own card
  it('is a button opening its card once earned, and only then', () => {
    const onOpen = vi.fn();
    const earned = { key: 'countries-10', group: 'countries', earnedAt: '2026-03-12T10:00:00Z' };
    const { container, unmount } = render(
      <ul>
        <BadgeSticker badge={earned} onOpen={onOpen} />
        <BadgeSticker badge={{ key: 'countries-25', group: 'countries', have: 3, need: 25 }} onOpen={onOpen} />
      </ul>,
    );
    const [button, ...others] = container.querySelectorAll('button');
    expect(others).toEqual([]);
    expect(button.getAttribute('aria-haspopup')).toBe('dialog');
    expect(button.dataset.badgeOpen).toBe('countries-10');
    // Its name: the badge, when, and what it means
    expect(button.textContent).toContain('Ten countries');
    expect(button.textContent).toContain('Earned 12 Mar 2026');
    fireEvent.click(button);
    expect(onOpen).toHaveBeenCalledWith(earned);
    unmount();
    // Without a way to open it, a plain sticker
    expect(sticker(earned).querySelector('button')).toBeNull();
  });

  it('names a badge the client doesn’t know from its key', () => {
    const li = sticker({ key: 'secret-new-badge', group: 'countries', have: 0, need: 1 });
    expect(li.textContent).toContain('secret new badge');
    expect(li.getAttribute('title')).toBeNull();
  });
});

describe('BadgeSuitcase', () => {
  afterEach(() => sessionStorage.clear());

  const BADGES = [
    { key: 'photos-100', group: 'photos', have: 10, need: 100 },
    { key: 'countries-1', group: 'countries', earnedAt: '2026-01-01' },
    { key: 'countries-5', group: 'countries', have: 2, need: 5 },
    { key: 'mystery', group: 'later', earned: true },
  ];

  it('counts the earned ones and groups the stickers in the server’s order, unknown groups last', () => {
    const { container } = render(<BadgeSuitcase badges={BADGES} />);
    expect(screen.getByText(/2 of 4 earned\./)).toBeTruthy();
    expect(screen.getByText(/Each is a sticker on the suitcase/)).toBeTruthy();
    const headings = [...container.querySelectorAll('h4')].map((h) => h.textContent);
    expect(headings).toEqual(['Countries', 'Photos', 'later']);
    expect(container.querySelectorAll('li').length).toBe(4);
  });

  // 25 Nov 2026, the user's wish: the arrow at the far right of the suitcase
  it('puts each group’s arrow at the far right, the heading’s words filling the rest', () => {
    const { container } = render(<BadgeSuitcase badges={BADGES} />);
    for (const toggle of container.querySelectorAll('[data-badge-group-toggle]')) {
      const classes = toggle.getAttribute('class').split(/\s+/);
      expect(classes).toContain('grid-cols-[minmax(0,1fr)_auto]');
      expect(classes).toContain('w-full');
      expect(classes).not.toContain('justify-start');
      expect(toggle.lastElementChild.tagName.toLowerCase()).toBe('svg');
    }
  });

  it('folds a group away with its heading’s arrow, and opens it again', () => {
    const { container } = render(<BadgeSuitcase badges={BADGES} />);
    const toggle = within(container.querySelector('[data-badge-group="countries"] h4')).getByRole('button');
    const body = document.getElementById(toggle.getAttribute('aria-controls'));
    expect(toggle.textContent).toBe('Countries');
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(body.hidden).toBe(false);
    expect(body.querySelectorAll('li').length).toBe(2);
    // Up to close, down to open (27 Nov 2026, the user's wish: it pointed right when closed)
    expect(toggle.querySelector('svg').getAttribute('class')).toContain('rotate-180');

    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(body.hidden).toBe(true);
    expect(toggle.querySelector('svg').getAttribute('class')).not.toContain('rotate-');
    // The other groups stay as they were
    const photos = within(container.querySelector('[data-badge-group="photos"] h4')).getByRole('button');
    expect(photos.getAttribute('aria-expanded')).toBe('true');

    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(body.hidden).toBe(false);
  });

  it('remembers the folded groups for the visit', () => {
    const first = render(<BadgeSuitcase badges={BADGES} />);
    fireEvent.click(within(first.container.querySelector('[data-badge-group="photos"] h4')).getByRole('button'));
    expect(JSON.parse(sessionStorage.getItem(BADGE_GROUPS_CLOSED_KEY))).toEqual(['photos']);
    first.unmount();

    const { container } = render(<BadgeSuitcase badges={BADGES} />);
    const open = (id) => within(container.querySelector(`[data-badge-group="${id}"] h4`)).getByRole('button').getAttribute('aria-expanded');
    expect(open('photos')).toBe('false');
    expect(open('countries')).toBe('true');
    // Opened again, nothing is left folded
    fireEvent.click(within(container.querySelector('[data-badge-group="photos"] h4')).getByRole('button'));
    expect(sessionStorage.getItem(BADGE_GROUPS_CLOSED_KEY)).toBeNull();
  });

  it('opens every group when the saved list can’t be read', () => {
    sessionStorage.setItem(BADGE_GROUPS_CLOSED_KEY, 'not json');
    const { container } = render(<BadgeSuitcase badges={BADGES} />);
    const toggles = [...container.querySelectorAll('h4 button')];
    expect(toggles.map((t) => t.getAttribute('aria-expanded'))).toEqual(['true', 'true', 'true']);
  });

  it('puts its note and the switch above the case', () => {
    render(
      <BadgeSuitcase badges={BADGES} note='From the completed trips Charlie was on.'>
        <span data-testid='switch'>switch</span>
      </BadgeSuitcase>,
    );
    expect(screen.getByText(/From the completed trips Charlie was on\./)).toBeTruthy();
    expect(screen.queryByText(/Each is a sticker/)).toBeNull();
    expect(screen.getByTestId('switch')).toBeTruthy();
  });
});

describe('GoalProgressBar', () => {
  const width = (fraction) => render(<GoalProgressBar fraction={fraction} />).container.querySelector('span span').style.width;

  it('fills to the rounded share, held between 0 and 100%', () => {
    expect(width(0.456)).toBe('46%');
    expect(width(1.7)).toBe('100%');
    expect(width(-2)).toBe('0%');
  });

  it('is decorative', () => {
    const { container } = render(<GoalProgressBar fraction={0.5} className='extra' />);
    expect(container.firstChild.getAttribute('aria-hidden')).toBe('true');
    expect(container.firstChild.className).toContain('extra');
  });
});

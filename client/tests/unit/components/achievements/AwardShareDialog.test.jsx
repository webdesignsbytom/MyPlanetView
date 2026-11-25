// The award pop-up's "Share a picture" (25 Nov 2026, the user's wish): what was earned as a
// picture to post, one card per item, chosen by buttons when there are several
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AwardShareDialog from '@/components/achievements/AwardShareDialog';
import { drawShareCard } from '@/utils/shareCard/drawShareCard';

// The canvas drawing is drawShareCard's own test's; here it hands back a PNG blob
vi.mock('@/utils/shareCard/drawShareCard', () => ({ drawShareCard: vi.fn() }));

const MAP = {
  name: 'Our map',
  splitUk: false,
  stats: { countries: 12, continents: 6, landmarks: 3 },
  visits: [{ countryCode: 'PE', status: 'VISITED' }],
};
const BADGES = [
  { key: 'continent-south-america', group: 'continents', earnedAt: '2026-11-25T10:00:00.000Z' },
  { key: 'continents-all', group: 'continents', earnedAt: '2026-11-25T10:00:00.000Z' },
];
const SOUTH_AMERICA = { type: 'badge', key: 'continent-south-america' };
const SIX = { type: 'badge', key: 'continents-all' };
const GOAL = { type: 'goal', goal: { id: 'g1', kind: 'COUNTRY_COUNT', target: 12, title: 'A dozen', progress: { have: 12, need: 12 } } };

const dialog = () => document.querySelector('[role="dialog"]');
const pictureName = () => document.querySelector('[data-share-card]')?.getAttribute('alt');

beforeEach(() => {
  vi.clearAllMocks();
  drawShareCard.mockResolvedValue(new Blob(['png'], { type: 'image/png' }));
  URL.createObjectURL = vi.fn(() => 'blob:award');
  URL.revokeObjectURL = vi.fn();
});

describe('AwardShareDialog', () => {
  it('shares one badge: its sticker, with no choice to make', async () => {
    render(<AwardShareDialog news={[SOUTH_AMERICA]} badges={BADGES} map={MAP} onClose={() => {}} />);
    expect(dialog().textContent).toContain('Share your badge');
    expect(screen.queryByRole('group', { name: 'Which one to share' })).toBeNull();
    await waitFor(() => expect(pictureName()).toBe('Your share card: South America, 12 countries, 6 continents, 3 landmarks'));
    const [card] = drawShareCard.mock.calls[0];
    expect(card).toMatchObject({ title: 'South America', note: 'A first country in South America.' });
    expect(card.badge.icon.paths.length).toBeGreaterThan(0);
    // The words go with it, as the post will show them
    expect(screen.getByLabelText('Words to go with it').value).toBe('New badge on my travel map: South America! 12 countries so far.');
  });

  it('titles a goal’s', () => {
    render(<AwardShareDialog news={[GOAL]} map={MAP} onClose={() => {}} />);
    expect(dialog().textContent).toContain('Share your goal');
  });

  it('chooses between several, the first to start with, each with its own words', async () => {
    render(<AwardShareDialog news={[SOUTH_AMERICA, SIX, GOAL]} badges={BADGES} map={MAP} onClose={() => {}} />);
    expect(dialog().textContent).toContain('Share what you earned');
    const group = screen.getByRole('group', { name: 'Which one to share' });
    const buttons = [...group.querySelectorAll('button')];
    expect(buttons.map((b) => b.textContent)).toEqual(['South America', 'Six continents', 'A dozen']);
    expect(buttons.map((b) => b.getAttribute('aria-pressed'))).toEqual(['true', 'false', 'false']);
    await waitFor(() => expect(pictureName()).toMatch(/^Your share card: South America,/));

    fireEvent.click(buttons[1]);
    expect(buttons[1].getAttribute('aria-pressed')).toBe('true');
    await waitFor(() => expect(pictureName()).toMatch(/^Your share card: Six continents,/));
    expect(screen.getByLabelText('Words to go with it').value).toBe('New badge on my travel map: Six continents! 12 countries so far.');

    fireEvent.click(buttons[2]);
    await waitFor(() => expect(pictureName()).toMatch(/^Your share card: A dozen,/));
    expect(screen.getByLabelText('Words to go with it').value).toBe('Goal reached on my travel map: A dozen!');
  });

  it('keeps its pictures as the dialog opened: a map changing underneath doesn’t redraw them', async () => {
    const { rerender } = render(<AwardShareDialog news={[SOUTH_AMERICA]} badges={BADGES} map={MAP} onClose={() => {}} />);
    await waitFor(() => expect(drawShareCard).toHaveBeenCalledTimes(1));
    rerender(<AwardShareDialog news={[SOUTH_AMERICA]} badges={BADGES} map={{ ...MAP, stats: { countries: 13 } }} onClose={() => {}} />);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(drawShareCard).toHaveBeenCalledTimes(1);
  });

  it('closes with its stamp', () => {
    const onClose = vi.fn();
    render(<AwardShareDialog news={[SOUTH_AMERICA]} badges={BADGES} map={MAP} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalled();
  });
});

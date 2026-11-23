import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import CountryCollections from '@/components/achievements/CountryCollections';

// The country collections on the suitcase (24 Nov 2026): a row per place started, its medals
const tier = (place, name, have, need, earnedAt = null) => ({ key: `collect-${place}-${name}`, group: 'collections', place, tier: name, have, need, earnedAt });
const BADGES = [
  tier('IT', 'bronze', 15, 15, '2026-11-20T10:00:00.000Z'),
  tier('IT', 'silver', 20, 29),
  tier('IT', 'gold', 20, 58),
  tier('FR', 'bronze', 2, 12),
  tier('FR', 'silver', 2, 24),
  tier('FR', 'gold', 2, 48),
  tier('VA', 'gold', 1, 1, '2026-11-21T10:00:00.000Z'),
];

describe('CountryCollections', () => {
  it('shows a row per place, the best medals first, with how many landmarks are stamped', () => {
    const { container } = render(<CountryCollections badges={BADGES} />);
    expect([...container.querySelectorAll('[data-collection]')].map((row) => row.getAttribute('data-collection'))).toEqual(['VA', 'IT', 'FR']);
    const italy = container.querySelector('[data-collection="IT"]');
    expect(italy.textContent).toContain('Italy');
    expect(italy.textContent).toContain('20 of 58 landmarks stamped');
    expect(container.querySelector('[data-collection="VA"]').textContent).toContain('1 of 1 landmark stamped');
  });

  it('shows each medal in its metal once earned, with when, and how far along before that', () => {
    const { container } = render(<CountryCollections badges={BADGES} />);
    const italy = container.querySelector('[data-collection="IT"]');
    const medals = [...italy.querySelectorAll('[data-medal]')];
    expect(medals.map((m) => [m.getAttribute('data-medal'), m.hasAttribute('data-earned')])).toEqual([
      ['bronze', true],
      ['silver', false],
      ['gold', false],
    ]);
    expect(medals[0].textContent).toContain('Earned 20 Nov 2026');
    expect(medals[1].textContent).toContain('20 of 29');
    // Its words for screen readers and as a tooltip
    expect(medals[2].getAttribute('title')).toBe('Every one of Italy’s landmarks stamped in the passport, by a photo or a “been here” tick.');
    expect(screen.getByRole('list', { name: 'Medals for Italy' })).toBeTruthy();
  });

  it('shares a place’s best medal, only where there is one and sharing is offered', () => {
    const onShare = vi.fn();
    render(<CountryCollections badges={BADGES} onShare={onShare} />);
    fireEvent.click(screen.getByRole('button', { name: 'Share your bronze medal for Italy' }));
    expect(onShare).toHaveBeenCalledWith(expect.objectContaining({ place: 'IT', best: 'bronze', have: 20, total: 58 }));
    expect(screen.getByRole('button', { name: 'Share your gold medal for Vatican City' })).toBeTruthy();
    // France has no medal yet
    expect(screen.queryByRole('button', { name: /medal for France/ })).toBeNull();
  });

  it('offers no sharing without a way to share, and shows nothing with no places', () => {
    render(<CountryCollections badges={BADGES} />);
    expect(screen.queryByRole('button')).toBeNull();
    const { container } = render(<CountryCollections badges={[]} />);
    expect(container.innerHTML).toBe('');
  });
});

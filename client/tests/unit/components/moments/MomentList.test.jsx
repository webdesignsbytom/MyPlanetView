import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import MomentList from '@/components/moments/MomentList';

vi.mock('@/api/travelApi', () => ({ deleteMoment: vi.fn() }));
// The form isn't opened here
vi.mock('@/components/moments/MomentForm', () => ({ default: () => null }));

const moment = (id, title, kind = 'SAW_OR_DID') => ({ id, title, kind, countryCode: 'KE', travellerIds: [], photos: [], happenedOn: '2025-03-04', datePrecision: 'DAY' });
const listOf = (moments) => ({ moments, loading: false, error: null, nextCursor: null, loadMore: vi.fn(), saved: vi.fn(), removed: vi.fn() });

describe('MomentList', () => {
  it('is one plain list without groups, its titles at the level given', () => {
    const { container } = render(<MomentList list={listOf([moment('a', 'Lions')])} headingLevel={3} />);
    expect(container.querySelector('[data-moment-days]')).toBeNull();
    expect(container.querySelector('ul > li h3').textContent).toBe('Lions');
  });

  // 23 Nov 2026: a trip's moments day by day
  it('draws each group under its own heading, a level above the moments, with where it was', () => {
    const groupMoments = vi.fn((moments) => [
      { key: '2025-03-04', title: 'Day 3 · Tuesday 4 March 2025', where: 'Maasai Mara', moments: moments.slice(0, 2) },
      { key: 'other', title: 'Other moments', where: null, moments: moments.slice(2) },
    ]);
    const { container } = render(
      <MomentList list={listOf([moment('a', 'Lions at dawn', 'SAFARI'), moment('b', 'Bush dinner', 'MEAL'), moment('c', 'A note')])} headingLevel={4} groupMoments={groupMoments} />,
    );
    const days = [...container.querySelectorAll('[data-moment-days] > li')];
    expect(days.map((d) => d.getAttribute('data-moment-day'))).toEqual(['2025-03-04', 'other']);
    expect(days[0].querySelector('h3').textContent).toBe('Day 3 · Tuesday 4 March 2025');
    expect(days[0].querySelector('p').textContent).toBe('Maasai Mara');
    expect([...days[0].querySelectorAll('h4')].map((h) => h.textContent)).toEqual(['Lions at dawn', 'Bush dinner']);
    // The kind is written on each card
    expect(days[0].textContent).toContain('Safari');
    expect(days[0].textContent).toContain('A meal to remember');
    expect(days[1].querySelector('h3').textContent).toBe('Other moments');
    expect(days[1].querySelectorAll('p').length).toBeGreaterThan(0);
  });

  it('shows the empty line, and never calls the grouping, with no moments', () => {
    const groupMoments = vi.fn();
    const { container } = render(<MomentList list={listOf([])} groupMoments={groupMoments} emptyText='Nothing yet.' />);
    expect(container.textContent).toContain('Nothing yet.');
    expect(groupMoments).not.toHaveBeenCalled();
  });
});

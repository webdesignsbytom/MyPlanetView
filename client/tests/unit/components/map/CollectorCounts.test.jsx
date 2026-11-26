import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import CollectorCounts from '@/components/map/CollectorCounts';
import { UN_MEMBER_CODES } from '@/utils/map/unMembers';

// Collector's counts (24 Nov 2026, the user's wish): the UN's 193, a counter beside the map's own
const visit = (countryCode, status = 'VISITED') => ({ countryCode, status });

describe('CollectorCounts', () => {
  it('counts the UN member states been to, out of 193, and says how', () => {
    const { container } = render(<CollectorCounts count={3} visits={[visit('FR'), visit('XE'), visit('IC'), visit('GL')]} />);
    const section = container.querySelector('[data-collector-counts]');
    expect(screen.getByRole('heading', { level: 3, name: 'Collector’s counts' })).toBeTruthy();
    expect(section.querySelector('[data-un-count]').getAttribute('data-un-count')).toBe('3');
    expect(section.textContent).toContain('UN member states');
    expect(section.textContent).toContain('3 of 193');
    expect(section.textContent).toMatch(/territories such as Greenland/);
  });

  it('works the count out from the visits when the reply has none', () => {
    const { container } = render(<CollectorCounts visits={[visit('FR'), visit('DE', 'LIVED'), visit('JP', 'WANT_TO_GO')]} />);
    expect(container.querySelector('[data-un-count]').getAttribute('data-un-count')).toBe('2');
  });

  it('folds the ones to go away, A–Z, each opening its country', () => {
    const onOpenCountry = vi.fn();
    const { container } = render(<CollectorCounts count={1} visits={[visit('FR')]} onOpenCountry={onOpenCountry} />);
    const toggle = screen.getByText('Show the 192 to go');
    const list = container.querySelector('ul');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(toggle.getAttribute('aria-controls')).toBe(list.id);
    expect(list.hidden).toBe(true);
    fireEvent.click(toggle);
    expect(list.hidden).toBe(false);
    expect(toggle.textContent).toBe('Hide the ones to go');
    const rows = list.querySelectorAll('[data-un-to-go]');
    expect(rows).toHaveLength(192);
    expect(rows[0].textContent).toBe('Afghanistan');
    expect(list.querySelector('[data-un-to-go="FR"]')).toBeNull();
    fireEvent.click(list.querySelector('[data-un-to-go="JP"] button'));
    expect(onOpenCountry).toHaveBeenCalledWith('JP');
  });

  it('lists plain names where nothing can be opened', () => {
    const { container } = render(<CollectorCounts visits={[]} />);
    expect(container.querySelector('[data-un-to-go="JP"] button')).toBeNull();
    expect(container.querySelector('[data-un-to-go="JP"]').textContent).toBe('Japan');
  });

  it('says so once every one is visited', () => {
    render(<CollectorCounts visits={UN_MEMBER_CODES.map((code) => visit(code))} />);
    expect(screen.getByText('Every one of them!')).toBeTruthy();
    expect(screen.queryByText(/to go/)).toBeNull();
  });
});

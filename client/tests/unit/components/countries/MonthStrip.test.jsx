import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import MonthStrip from '@/components/countries/MonthStrip';
import MonthStripSummary from '@/components/countries/MonthStripSummary';
import SeasonIcon from '@/components/countries/SeasonIcon';

const MONTHS = ['good', 'good', 'good', 'best', 'best', 'best', 'avoid', 'avoid', 'best', 'best', 'good', 'good'];

describe('MonthStrip', () => {
  it('is a list a screen reader reads in full, each month saying its rating in words', () => {
    const { container } = render(<MonthStrip months={MONTHS} label='France, month by month' />);
    const list = container.querySelector('ol');
    expect(list.getAttribute('aria-label')).toBe('France, month by month');
    expect(list.getAttribute('aria-hidden')).toBeNull();
    const items = [...list.querySelectorAll('li')];
    expect(items.length).toBe(12);
    // What's heard: the sr-only full name, then the rating (the short name is hidden)
    const heard = items.map((li) =>
      [...li.querySelectorAll(':scope > span')]
        .filter((span) => span.getAttribute('aria-hidden') !== 'true')
        .map((span) => span.textContent)
        .join(''),
    );
    expect(heard[0]).toBe('January: Good');
    expect(heard[3]).toBe('April: Best');
    expect(heard[6]).toBe('July: Avoid');
    expect(heard[11]).toBe('December: Good');
  });

  it('never rests on colour alone: a best month also has a star, and every month its word', () => {
    const { container } = render(<MonthStrip months={MONTHS} label='x' />);
    const items = container.querySelectorAll('li');
    expect(items[3].querySelector('svg')).toBeTruthy();
    expect(items[3].querySelector('svg').getAttribute('aria-hidden')).toBe('true');
    expect(items[0].querySelector('svg')).toBeNull();
    expect(items[0].querySelector('span[aria-hidden="true"]').textContent).toBe('Jan');
    // Each rating has its own tone
    expect(items[3].className).toContain('solid-good');
    expect(items[0].className).toContain('tone-good');
    expect(items[6].className).toContain('tone-danger');
  });

  it('as a compact strip: initials, hidden from assistive tech, avoid months struck through', () => {
    const { container } = render(<MonthStrip months={MONTHS} compact />);
    const list = container.querySelector('ol');
    expect(list.getAttribute('aria-hidden')).toBe('true');
    const items = [...list.querySelectorAll('li')];
    expect(items.map((li) => li.textContent).join('')).toBe('JFMAMJJASOND');
    expect(items[6].className).toContain('line-through');
    expect(items[0].className).not.toContain('line-through');
  });
});

describe('MonthStripSummary', () => {
  it('says the best and the months to avoid, in short', () => {
    const { container } = render(<MonthStripSummary months={MONTHS} className='extra' />);
    expect(container.textContent).toBe('Best: Apr–Jun, Sep–Oct · Avoid: Jul–Aug');
    expect(container.querySelector('p').className).toContain('extra');
  });

  it('says no month stands out, and has no avoid part when none is to be avoided', () => {
    const { container } = render(<MonthStripSummary months={Array(12).fill('good')} />);
    expect(container.textContent).toBe('Best: no month stands out');
  });

  it('runs a best stretch over the new year as one', () => {
    const months = ['best', 'best', 'good', 'good', 'good', 'good', 'good', 'good', 'good', 'good', 'good', 'best'];
    const { container } = render(<MonthStripSummary months={months} />);
    expect(container.textContent).toBe('Best: Dec–Feb');
  });
});

describe('SeasonIcon', () => {
  const inkOf = (name) => render(<SeasonIcon name={name} />).container.querySelector('span');

  it('is decorative, a round stamp with an icon', () => {
    const span = inkOf('Spring');
    expect(span.getAttribute('aria-hidden')).toBe('true');
    expect(span.querySelector('svg')).toBeTruthy();
  });

  it('matches a season by a word in its name, giving each its own ink', () => {
    expect(inkOf('Spring').className).toContain('text-status-good');
    expect(inkOf('Dry season').className).toContain('text-status-warning');
    expect(inkOf('Summer').className).toContain('text-status-warning');
    expect(inkOf('Hot season').className).toContain('text-colour6');
    expect(inkOf('Autumn').className).toContain('text-colour6');
    expect(inkOf('The monsoon').className).toContain('text-colour7');
    expect(inkOf('Winter').className).toContain('text-colour7');
  });

  it('gives "after the monsoon" its own sun behind a cloud, not the monsoon’s rain', () => {
    const after = inkOf('After the monsoon');
    const monsoon = inkOf('Monsoon');
    expect(after.className).toContain('text-colour9');
    expect(after.innerHTML).not.toBe(monsoon.innerHTML);
  });

  it('falls back on a sun behind a cloud for a name it doesn’t know', () => {
    const unknown = inkOf('Shoulder months');
    expect(unknown.className).toContain('text-colour9');
    expect(unknown.innerHTML).toBe(inkOf('Between the rains').innerHTML);
  });
});

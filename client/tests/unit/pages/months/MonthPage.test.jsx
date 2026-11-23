import React from 'react';
import { describe, expect, it } from 'vitest';
import { waitFor } from '@testing-library/react';
import MonthPage from '@/pages/months/MonthPage';
import { loadMonthPage } from '@/utils/months/monthPages';
import { headings, onlyMain, renderPage } from '../renderPage';

const pick = (code, name, slug, over = {}) => ({ code, name, slug, status: 'checked', season: `${name} in season.`, festivals: [], ...over });

const page = (over = {}) => ({
  month: 5,
  slug: 'may',
  status: 'checked',
  lastChecked: '2026-11-16',
  summary: 'Late spring: long days before the summer crowds.',
  intro: ['May is the shoulder season.', 'Book early for June.'],
  picks: {
    best: [pick('FR', 'France', 'france'), pick('IT', 'Italy', 'italy')],
    good: [pick('ES', 'Spain', 'spain')],
    regions: [{ ...pick('US', 'United States', 'united-states'), region: 'Hawaii', text: 'Dry and sunny.' }],
  },
  ...over,
});

describe('MonthPage', { timeout: 20000 }, () => {
  it('has one main, labelled by its h1 and described by its summary, with each list', () => {
    renderPage(<MonthPage page={page()} />, { path: '/where-to-go/may' });
    const { count, main, id } = onlyMain();
    expect(count).toBe(1);
    expect(id).toBe('main-content');
    expect(main.getAttribute('aria-labelledby')).toBe('month-title');
    expect(main.getAttribute('aria-describedby')).toBe('month-summary');
    expect(headings()).toEqual(['Where to go in May']);
    expect(document.getElementById('month-intro-heading').textContent).toBe('May around the world');
    expect(main.textContent).toContain('Book early for June.');
    expect(document.getElementById('month-best-heading').textContent).toBe('At their best in May');
    expect(document.getElementById('month-good-heading').textContent).toBe('Also good in May');
    expect(document.getElementById('month-regions-heading').textContent).toBe('Regions at their best in May');
  });

  it('leaves out an empty list', () => {
    renderPage(<MonthPage page={page({ picks: { best: [pick('FR', 'France', 'france')], good: [], regions: [] } })} />, { path: '/where-to-go/may' });
    expect(document.getElementById('month-best-heading')).toBeTruthy();
    expect(document.getElementById('month-good-heading')).toBeNull();
    expect(document.getElementById('month-regions-heading')).toBeNull();
  });

  it('a draft is never indexed and links every month; a checked one is indexed', async () => {
    const draft = renderPage(<MonthPage page={page({ status: 'draft' })} />, { path: '/where-to-go/may' });
    await waitFor(() => expect(document.head.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe('noindex,nofollow'));
    // Drafts list the other months the dev server has
    expect(document.querySelector('[aria-label="Where to go, month by month"]')).toBeTruthy();
    draft.unmount();
    renderPage(<MonthPage page={page()} />, { path: '/where-to-go/may' });
    await waitFor(() => expect(document.head.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe('index,follow'));
    expect(document.head.querySelector('link[rel="canonical"]').getAttribute('href')).toMatch(/\/where-to-go\/may$/);
  });

  it('renders a real month file as the build loads it', async () => {
    const real = await loadMonthPage('may');
    renderPage(<MonthPage page={real} />, { path: '/where-to-go/may' });
    expect(onlyMain().count).toBe(1);
    expect(headings()).toEqual(['Where to go in May']);
  });
});

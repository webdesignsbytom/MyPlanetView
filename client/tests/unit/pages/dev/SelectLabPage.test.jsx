import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import SelectLabPage from '@/pages/dev/SelectLabPage';
import { DEV_SELECT_LAB_PAGE_URL } from '@/utils/constants/routes';
import { headings, onlyMain, renderPage } from '../renderPage';

const cssBlock = () => document.querySelector('main pre code').textContent;

describe('SelectLabPage (dev server only)', () => {
  it('has one main, labelled by its h1, and is never indexed', async () => {
    renderPage(<SelectLabPage />, { path: DEV_SELECT_LAB_PAGE_URL });
    const { count, main, id } = onlyMain();
    expect(count).toBe(1);
    expect(id).toBe('main-content');
    expect(main.getAttribute('aria-labelledby')).toBe('select-lab-heading');
    expect(headings()).toEqual(['Dropdown lab']);
    await waitFor(() => expect(document.head.querySelector('meta[name="robots"]').getAttribute('content')).toBe('noindex,nofollow'));
  });

  it('says whether this browser has customisable selects', () => {
    renderPage(<SelectLabPage />, { path: DEV_SELECT_LAB_PAGE_URL });
    expect(document.querySelector('main [role="status"]').textContent).toMatch(/customizable select/);
  });

  it('writes the CSS for the settings, and changes it with them', () => {
    renderPage(<SelectLabPage />, { path: DEV_SELECT_LAB_PAGE_URL });
    expect(cssBlock()).toContain(':root {');
    expect(cssBlock()).toContain('--select-checkmark: inline;');
    fireEvent.click(screen.getByLabelText('Tick next to the selected option'));
    expect(cssBlock()).toContain('--select-checkmark: none;');
    fireEvent.click(screen.getByLabelText('Fade in when it opens'));
    expect(cssBlock()).toMatch(/--select-fade: (0s|0\.18s);/);
    // The settings go onto the main as custom properties
    expect(document.querySelector('main').style.getPropertyValue('--select-checkmark')).toBe('none');
  });

  it('works out the contrast of each pair of colours', () => {
    renderPage(<SelectLabPage />, { path: DEV_SELECT_LAB_PAGE_URL });
    const box = screen.getByText('Box').closest('li');
    // jsdom has no stylesheet, so both colours start black: 1:1
    expect(box.textContent).toContain('1.0:1 below 4.5');
    fireEvent.change(screen.getByLabelText('Box background'), { target: { value: '#ffffff' } });
    expect(box.textContent).toContain('21.0:1 pass');
  });

  it('resets to the defaults', () => {
    renderPage(<SelectLabPage />, { path: DEV_SELECT_LAB_PAGE_URL });
    const before = cssBlock();
    fireEvent.change(screen.getByLabelText('Border'), { target: { value: '#123456' } });
    expect(cssBlock()).toContain('--select-border: #123456;');
    fireEvent.click(screen.getByText('Reset to the site defaults'));
    expect(cssBlock()).toBe(before);
  });

  it('copies the CSS, and says so', async () => {
    const writeText = vi.fn().mockResolvedValue();
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    renderPage(<SelectLabPage />, { path: DEV_SELECT_LAB_PAGE_URL });
    fireEvent.click(screen.getByText('Copy CSS'));
    await waitFor(() => expect(screen.getByText('Copied')).toBeTruthy());
    expect(writeText).toHaveBeenCalledWith(cssBlock());
  });

  it('keeps the button as it was when copying fails', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    renderPage(<SelectLabPage />, { path: DEV_SELECT_LAB_PAGE_URL });
    fireEvent.click(screen.getByText('Copy CSS'));
    await waitFor(() => expect(writeText).toHaveBeenCalled());
    expect(screen.getByText('Copy CSS')).toBeTruthy();
  });
});

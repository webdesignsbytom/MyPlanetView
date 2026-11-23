import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import CountryListPanel from '@/components/map/CountryListPanel';
import { SplitUkProvider } from '@/hooks/useSplitUk';
import { REGION_PLACES, SPECIAL_PLACES, countriesOnMap } from '@/utils/map/countries';

// Every country, special place and region: plain selectors only, and more time than usual
const open = (props = {}, splitUk = false) => {
  const onChangeStatus = vi.fn().mockResolvedValue();
  const onShowCountry = vi.fn();
  const result = render(
    <SplitUkProvider value={splitUk}>
      <CountryListPanel visitsByCode={{}} canEdit={false} onChangeStatus={onChangeStatus} onShowCountry={onShowCountry} onClose={() => {}} {...props} />
    </SplitUkProvider>,
  );
  const panel = document.querySelector('[data-map-panel]');
  const names = () => [...panel.querySelectorAll('li > button:first-child')].map((b) => b.textContent);
  const counts = () => panel.querySelector('p[aria-live="polite"]').textContent;
  return { ...result, panel, names, counts, onChangeStatus, onShowCountry };
};

describe('CountryListPanel', { timeout: 30000 }, () => {
  it('is a ticket with every country under its letter, then the special places and regions', () => {
    const { panel, counts } = open();
    expect(panel.querySelector('h2').textContent).toBe('Countries');
    expect(panel.textContent).toContain('Travel log, A to Z');
    const headings = [...panel.querySelectorAll('section > h3')].map((h) => h.textContent);
    expect(headings[0]).toBe('A');
    expect(headings).toContain('Special places');
    expect(headings[headings.length - 1]).toBe('Regions');
    const all = countriesOnMap(false).length;
    expect(counts()).toBe(`${all} of ${all} countries, ${SPECIAL_PLACES.length} of ${SPECIAL_PLACES.length} special places, ${REGION_PLACES.length} of ${REGION_PLACES.length} regions`);
  });

  it('files Côte d’Ivoire under C, accents folded', () => {
    const { panel } = open();
    const c = [...panel.querySelectorAll('section')].find((s) => s.querySelector('h3').textContent === 'C');
    expect(c.textContent).toContain("Côte d'Ivoire");
  });

  it('finds a place by name, ignoring accents and case', () => {
    const { panel, names, counts } = open();
    fireEvent.change(panel.querySelector('#country-search'), { target: { value: 'COTE' } });
    expect(names()).toEqual(["Côte d'Ivoire"]);
    expect(counts()).toMatch(/^1 of \d+ countries, 0 of 5 special places, 0 of \d+ regions$/);
    fireEvent.change(panel.querySelector('#country-search'), { target: { value: 'zzzz' } });
    expect(screen.getByText('Nowhere matches that. Try another spelling or show all places.')).toBeTruthy();
  });

  it('shows only the places with a status chosen', () => {
    const { panel, names } = open({ visitsByCode: { FR: 'VISITED', JP: 'WANT_TO_GO', XB: 'VISITED', AQ: 'VISITED' } });
    fireEvent.change(panel.querySelector('#country-filter'), { target: { value: 'VISITED' } });
    expect(names()).toEqual(['France', 'Antarctica', 'Bali']);
    fireEvent.change(panel.querySelector('#country-filter'), { target: { value: 'WANT_TO_GO' } });
    expect(names()).toEqual(['Japan']);
  });

  it('opens a place from its name', () => {
    const { onShowCountry } = open();
    fireEvent.click(screen.getByText('Peru'));
    expect(onShowCountry).toHaveBeenCalledWith('PE');
  });

  it('lists the UK’s nations instead of the UK on a split map', () => {
    const split = open({}, true).names();
    expect(split).toContain('Scotland');
    expect(split).not.toContain('United Kingdom');
  });

  it('keeps the UK in the list while its old mark waits for its nations', () => {
    const { names } = open({ visitsByCode: { GB: 'VISITED' } }, true);
    expect(names()).toContain('United Kingdom');
    expect(names()).toContain('England');
  });

  it('shows statuses in words to someone who can’t change them, and stamps to an editor', () => {
    const viewer = open({ visitsByCode: { FR: 'VISITED' } });
    expect(viewer.panel.querySelector('[aria-label^="Status for"]')).toBeNull();
    viewer.unmount();
    const editor = open({ canEdit: true, visitsByCode: { FR: 'VISITED' } });
    expect(editor.panel.querySelector('[aria-label="Status for France: Visited"]')).not.toBeNull();
  });

  it('saves a status from a row, and says why one failed', async () => {
    const { panel, onChangeStatus } = open({ canEdit: true });
    onChangeStatus.mockRejectedValueOnce(Object.assign(new Error('x'), { friendlyMessage: 'Offline.' }));
    fireEvent.click(panel.querySelector('[aria-label="Status for Peru: Not yet"]'));
    fireEvent.change(panel.querySelector('select#status-PE'), { target: { value: 'VISITED' } });
    expect(onChangeStatus).toHaveBeenCalledWith('PE', 'VISITED');
    await waitFor(() => expect(panel.querySelector('[role="alert"]').textContent).toBe('Offline.'));
  });

  it('jumps to the special places and puts focus on their heading', () => {
    const { panel } = open();
    const scroller = panel.querySelector('.overflow-y-auto');
    scroller.style.overflowY = 'auto';
    scroller.scrollBy = vi.fn();
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    fireEvent.click(screen.getByText('Special places', { selector: 'button' }));
    expect(scroller.scrollBy).toHaveBeenCalledWith(expect.objectContaining({ behavior: 'auto' }));
    expect(document.activeElement.textContent).toBe('Special places');
  });

  it('offers the unplaced photos, ticking several countries, and says when it’s locked', () => {
    const onShowUnplaced = vi.fn();
    const onQuickFill = vi.fn();
    open({ onShowUnplaced, unplacedCount: 4, onQuickFill, locked: true });
    fireEvent.click(screen.getByText('Unplaced photos (4)'));
    fireEvent.click(screen.getByText('Tick several countries'));
    expect(onShowUnplaced).toHaveBeenCalled();
    expect(onQuickFill).toHaveBeenCalled();
    expect(screen.getByText(/to tick off countries/)).toBeTruthy();
  });
});

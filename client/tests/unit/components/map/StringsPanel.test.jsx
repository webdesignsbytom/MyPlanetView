import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import StringsPanel from '@/components/map/StringsPanel';
import useMapDesignEditor from '@/hooks/useMapDesignEditor';
import { withProviders } from './helpers';

vi.mock('@/hooks/useMapDesignEditor', () => ({ default: vi.fn() }));

// The visited strings, and one planned (25 Nov 2026, the user's wish: their own tab)
const STRINGS = [
  { id: 's1', kind: 'VISITED', from: 'FR', to: 'JP' },
  { id: 's2', from: 'BR', to: 'PE' },
  { id: 'p1', kind: 'PLANNED', from: 'IS', to: 'JP' },
];
const MAP = { id: 'm1', name: 'Our map', designs: { animated: { shown: true, string: '#c0ffee', plannedString: '#1d4ed8' } } };

const editor = (overrides = {}) => ({ design: MAP.designs.animated, status: { state: 'idle', error: '' }, change: vi.fn(), ...overrides });

function open(props = {}) {
  const handlers = {
    onShowStrings: vi.fn(),
    onTie: vi.fn().mockResolvedValue({ id: 's9', from: 'DE', to: 'IT' }),
    onTieAuto: vi.fn().mockResolvedValue({ added: 3, full: false, strings: [] }),
    onUntie: vi.fn().mockResolvedValue(undefined),
    onUntieAll: vi.fn().mockResolvedValue(undefined),
    onStringMode: vi.fn(),
    onClose: vi.fn(),
  };
  const view = render(withProviders(<StringsPanel map={MAP} styleId='animated' strings={STRINGS} {...handlers} {...props} />));
  return { ...handlers, ...view };
}

// Each tab's own content (both stay on the page, the closed one hidden)
const tab = (kind) => within(document.querySelector(`[data-strings-tab="${kind}"]`));
const button = (kind, text) => tab(kind).getByText(text).closest('button');
// The closed tab is hidden, so role queries look in it on purpose
const status = (kind) => tab(kind).getByRole('status', { hidden: true }).textContent;
const openTab = (name) => fireEvent.click(screen.getByRole('tab', { name }));

describe('StringsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useMapDesignEditor.mockReturnValue(editor());
  });

  it('has a tab for the visited strings and one for the planned, the visited open first', () => {
    open();
    const tabs = screen.getAllByRole('tab');
    expect(tabs.map((t) => t.textContent)).toEqual(['Visited', 'Planned']);
    expect(tabs.map((t) => t.getAttribute('aria-selected'))).toEqual(['true', 'false']);
    expect(document.querySelector('[data-strings-tab="PLANNED"]').closest('[role="tabpanel"]').hidden).toBe(true);
    openTab('Planned');
    expect(screen.getByRole('tab', { name: 'Planned' }).getAttribute('aria-selected')).toBe('true');
    expect(document.querySelector('[data-strings-tab="VISITED"]').closest('[role="tabpanel"]').hidden).toBe(true);
    // The arrow keys move between them
    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'ArrowLeft' });
    expect(screen.getByRole('tab', { name: 'Visited' }).getAttribute('aria-selected')).toBe('true');
  });

  it('lists each kind’s strings in its own tab, with a way to take each off', () => {
    open();
    expect(tab('VISITED').getByText('2 strings')).toBeTruthy();
    const items = (kind) => [...document.querySelectorAll(`[data-strings-tab="${kind}"] [data-string-item]`)].map((li) => li.getAttribute('data-string-item'));
    expect(items('VISITED')).toEqual(['FR-JP', 'BR-PE']);
    expect(items('PLANNED')).toEqual(['IS-JP']);
    expect(tab('PLANNED').getByText('1 planned string')).toBeTruthy();
    expect(tab('VISITED').getByText('Take off the string from Brazil to Peru')).toBeTruthy();
  });

  it('says so when there are none, with nothing to take off', () => {
    open({ strings: [] });
    expect(tab('VISITED').getByText('No strings yet')).toBeTruthy();
    expect(tab('PLANNED').getByText('No planned strings yet')).toBeTruthy();
    expect(tab('VISITED').queryByText('Take every string off')).toBeNull();
  });

  it('goes into string mode for the tab’s kind', () => {
    const { onStringMode } = open();
    fireEvent.click(button('VISITED', 'Tie strings on the map'));
    fireEvent.click(button('PLANNED', 'Tie strings on the map'));
    expect(onStringMode.mock.calls).toEqual([['VISITED'], ['PLANNED']]);
  });

  it('ties a string of the tab’s kind between two places chosen from the lists', async () => {
    const { onTie } = open();
    expect(button('PLANNED', 'Tie this string').disabled).toBe(true);
    fireEvent.change(tab('PLANNED').getByLabelText('From'), { target: { value: 'DE' } });
    fireEvent.change(tab('PLANNED').getByLabelText('To'), { target: { value: 'IT' } });
    fireEvent.click(button('PLANNED', 'Tie this string'));
    await waitFor(() => expect(status('PLANNED')).toBe('Tied: Germany to Italy.'));
    expect(onTie).toHaveBeenCalledWith('DE', 'IT', 'PLANNED');
  });

  it('won’t tie a place to itself', () => {
    const { onTie } = open();
    fireEvent.change(tab('VISITED').getByLabelText('From'), { target: { value: 'DE' } });
    fireEvent.change(tab('VISITED').getByLabelText('To'), { target: { value: 'DE' } });
    fireEvent.click(button('VISITED', 'Tie this string'));
    expect(tab('VISITED').getByRole('alert').textContent).toBe('Choose two different places.');
    expect(onTie).not.toHaveBeenCalled();
  });

  it('adds each kind’s automatic ones and says how many, from what', async () => {
    const { onTieAuto } = open();
    fireEvent.click(button('VISITED', 'Add strings automatically'));
    await waitFor(() => expect(status('VISITED')).toBe('Added 3 strings from your trips and first visits.'));
    fireEvent.click(button('PLANNED', 'Add strings automatically'));
    await waitFor(() => expect(status('PLANNED')).toBe('Added 3 strings from your planned trips and the places you want to go.'));
    expect(onTieAuto.mock.calls).toEqual([['VISITED'], ['PLANNED']]);
  });

  it('says when there was nothing new, or no room left', async () => {
    const nothing = open({ onTieAuto: vi.fn().mockResolvedValue({ added: 0, full: false }) });
    fireEvent.click(button('PLANNED', 'Add strings automatically'));
    await waitFor(() => expect(status('PLANNED')).toBe('Nothing new to add: your plans are already strung.'));
    nothing.unmount();
    open({ onTieAuto: vi.fn().mockResolvedValue({ added: 1, full: true }) });
    fireEvent.click(button('VISITED', 'Add strings automatically'));
    await waitFor(() => expect(status('VISITED')).toBe('Added 1 — the map holds no more of these strings.'));
  });

  it('takes one off', async () => {
    const { onUntie } = open();
    fireEvent.click(tab('PLANNED').getByText('Take off the string from Iceland to Japan').closest('button'));
    await waitFor(() => expect(status('PLANNED')).toBe('Taken off: Iceland to Japan.'));
    expect(onUntie).toHaveBeenCalledWith(STRINGS[2]);
  });

  it('asks before taking every string of a kind off', async () => {
    const { onUntieAll } = open();
    fireEvent.click(button('PLANNED', 'Take every planned string off'));
    expect(screen.getByText('Take every planned string off?')).toBeTruthy();
    expect(screen.getByText(/All 1 planned strings on this map come off/)).toBeTruthy();
    expect(onUntieAll).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Confirm').closest('button'));
    await waitFor(() => expect(onUntieAll).toHaveBeenCalledWith('PLANNED'));
  });

  it('says why when the server refuses', async () => {
    open({ onTieAuto: vi.fn().mockRejectedValue(Object.assign(new Error('no'), { friendlyMessage: 'Not now.' })) });
    fireEvent.click(button('VISITED', 'Add strings automatically'));
    await waitFor(() => expect(tab('VISITED').getByRole('alert').textContent).toBe('Not now.'));
  });

  it('switches the viewer’s own showing of each kind', () => {
    const { onShowStrings } = open({ shown: { VISITED: true, PLANNED: false } });
    const visited = tab('VISITED').getByLabelText('Show visited strings on the map');
    const planned = tab('PLANNED').getByLabelText('Show planned strings on the map');
    expect([visited.checked, planned.checked]).toEqual([true, false]);
    fireEvent.click(visited);
    fireEvent.click(planned);
    expect(onShowStrings.mock.calls).toEqual([
      ['VISITED', false],
      ['PLANNED', true],
    ]);
  });

  // Their colours, here with them (25 Nov 2026, the user's wish: "all in one place")
  it('gives each kind its colours in the map’s design, for the owner and co-owners', () => {
    const e = editor();
    useMapDesignEditor.mockReturnValue(e);
    const onDesignChange = vi.fn();
    const preview = { get: () => null, subscribe: () => () => {} };
    open({ onDesignChange, designPreview: preview });
    expect(useMapDesignEditor).toHaveBeenCalledWith({ mapId: 'm1', style: 'animated', design: MAP.designs.animated, onDesignChange, preview });
    expect(tab('VISITED').getByLabelText('String colour').value).toBe('#c0ffee');
    expect(tab('PLANNED').getByLabelText('String colour').value).toBe('#1d4ed8');
    fireEvent.input(tab('PLANNED').getByLabelText('String colour'), { target: { value: '#0000ff' } });
    fireEvent.click(tab('VISITED').getByLabelText('Two tone string'));
    expect(e.change.mock.calls).toEqual([[{ plannedString: '#0000ff' }], [{ stringTwist: expect.stringMatching(/^#[0-9a-f]{6}$/) }]]);
  });

  it('says whose choice the colours are, for an editor who can’t change them', () => {
    const { container } = open({ onDesignChange: null });
    expect(tab('VISITED').queryByLabelText('String colour')).toBeNull();
    expect(container.querySelector('[data-strings-tab="PLANNED"] [data-string-colour-note]').textContent).toBe('Their colours are the map owner’s choice.');
  });

  // 25 Nov 2026, the user's wish: no "Saved." (a change shows on the map at once); a failure is said
  it('says nothing when the colours are saved, only when they couldn’t be', () => {
    useMapDesignEditor.mockReturnValue(editor({ status: { state: 'saved', error: '' } }));
    const saved = open({ onDesignChange: vi.fn() });
    expect(tab('VISITED').queryByText('Saved.')).toBeNull();
    expect(tab('VISITED').queryByRole('alert')).toBeNull();
    saved.unmount();
    useMapDesignEditor.mockReturnValue(editor({ status: { state: 'idle', error: 'The design couldn’t be saved. Please try again.' } }));
    open({ onDesignChange: vi.fn() });
    expect(tab('VISITED').getByRole('alert').textContent).toBe('The design couldn’t be saved. Please try again.');
  });

  it('locks every change until the email is verified', () => {
    open({ locked: true });
    expect(tab('VISITED').getByText(/Verify your email address to tie strings/)).toBeTruthy();
    for (const text of ['Tie strings on the map', 'Add strings automatically', 'Tie this string', 'Take every string off']) {
      expect(button('VISITED', text).disabled).toBe(true);
    }
  });
});

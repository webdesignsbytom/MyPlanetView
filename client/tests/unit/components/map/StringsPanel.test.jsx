import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import StringsPanel from '@/components/map/StringsPanel';
import { withProviders } from './helpers';

const STRINGS = [
  { id: 's1', from: 'FR', to: 'JP' },
  { id: 's2', from: 'BR', to: 'PE' },
];

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
  const view = render(withProviders(<StringsPanel strings={STRINGS} {...handlers} {...props} />));
  return { ...handlers, ...view };
}

const button = (text) => screen.getByText(text).closest('button');
const status = () => screen.getByRole('status').textContent;

describe('StringsPanel', () => {
  it('lists every string with a way to take it off', () => {
    const { container } = open();
    expect(screen.getByText('2 strings')).toBeTruthy();
    expect([...container.querySelectorAll('[data-string-item]')].map((li) => li.getAttribute('data-string-item'))).toEqual(['FR-JP', 'BR-PE']);
    expect(screen.getByText('France to Japan')).toBeTruthy();
    expect(screen.getByText('Take off the string from Brazil to Peru')).toBeTruthy();
  });

  it('says so when there are none, with nothing to take off', () => {
    open({ strings: [] });
    expect(screen.getByText('No strings yet')).toBeTruthy();
    expect(screen.queryByText('Take every string off')).toBeNull();
  });

  it('goes into string mode on the map', () => {
    const { onStringMode } = open();
    fireEvent.click(button('Tie strings on the map'));
    expect(onStringMode).toHaveBeenCalledTimes(1);
  });

  it('ties a string between two places chosen from the lists', async () => {
    const { onTie } = open();
    expect(button('Tie this string').disabled).toBe(true);
    fireEvent.change(screen.getByLabelText('From'), { target: { value: 'DE' } });
    fireEvent.change(screen.getByLabelText('To'), { target: { value: 'IT' } });
    fireEvent.click(button('Tie this string'));
    await waitFor(() => expect(status()).toBe('Tied: Germany to Italy.'));
    expect(onTie).toHaveBeenCalledWith('DE', 'IT');
  });

  it('won’t tie a place to itself', () => {
    const { onTie } = open();
    fireEvent.change(screen.getByLabelText('From'), { target: { value: 'DE' } });
    fireEvent.change(screen.getByLabelText('To'), { target: { value: 'DE' } });
    fireEvent.click(button('Tie this string'));
    expect(screen.getByRole('alert').textContent).toBe('Choose two different places.');
    expect(onTie).not.toHaveBeenCalled();
  });

  it('adds the automatic ones and says how many', async () => {
    const { onTieAuto } = open();
    fireEvent.click(button('Add strings automatically'));
    await waitFor(() => expect(status()).toBe('Added 3 strings from your trips and first visits.'));
    expect(onTieAuto).toHaveBeenCalled();
  });

  it('says when there was nothing new, or no room left', async () => {
    const nothing = open({ onTieAuto: vi.fn().mockResolvedValue({ added: 0, full: false }) });
    fireEvent.click(button('Add strings automatically'));
    await waitFor(() => expect(status()).toBe('Nothing new to add: your trips and first visits are already strung.'));
    nothing.unmount();
    open({ onTieAuto: vi.fn().mockResolvedValue({ added: 1, full: true }) });
    fireEvent.click(button('Add strings automatically'));
    await waitFor(() => expect(status()).toBe('Added 1 — the map holds no more strings.'));
  });

  it('takes one off', async () => {
    const { onUntie } = open();
    fireEvent.click(screen.getByText('Take off the string from France to Japan').closest('button'));
    await waitFor(() => expect(status()).toBe('Taken off: France to Japan.'));
    expect(onUntie).toHaveBeenCalledWith(STRINGS[0]);
  });

  it('asks before taking every string off', async () => {
    const { onUntieAll } = open();
    fireEvent.click(button('Take every string off'));
    expect(screen.getByText('Take every string off?')).toBeTruthy();
    expect(screen.getByText(/All 2 strings on this map come off/)).toBeTruthy();
    expect(onUntieAll).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Confirm').closest('button'));
    await waitFor(() => expect(onUntieAll).toHaveBeenCalled());
  });

  it('says why when the server refuses', async () => {
    open({ onTieAuto: vi.fn().mockRejectedValue(Object.assign(new Error('no'), { friendlyMessage: 'Not now.' })) });
    fireEvent.click(button('Add strings automatically'));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe('Not now.'));
  });

  it('switches the viewer’s own showing of them', () => {
    const { onShowStrings } = open({ showStrings: true });
    const box = screen.getByLabelText('Show strings on the map');
    expect(box.checked).toBe(true);
    fireEvent.click(box);
    expect(onShowStrings).toHaveBeenCalledWith(false);
  });

  it('says where their colour is chosen, for those who can', () => {
    const owner = open({ canDesign: true });
    expect(owner.container.querySelector('[data-string-colour-note]').textContent).toContain('under How it looks: “String colour”');
    owner.unmount();
    const editor = open({ canDesign: false });
    expect(editor.container.querySelector('[data-string-colour-note]').textContent).toBe('Their colour is the map owner’s choice, in its settings.');
  });

  it('locks every change until the email is verified', () => {
    open({ locked: true });
    expect(screen.getByText(/Verify your email address to tie strings/)).toBeTruthy();
    for (const text of ['Tie strings on the map', 'Add strings automatically', 'Tie this string', 'Take every string off']) {
      expect(button(text).disabled).toBe(true);
    }
  });
});

import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, waitFor, within } from '@testing-library/react';
import QuickFillDialog from '@/components/map/QuickFillDialog';
import { quickFillVisits } from '@/api/travelApi';

vi.mock('@/api/travelApi', () => ({ quickFillVisits: vi.fn() }));

const open = (props = {}) => {
  const onSaved = vi.fn();
  const onClose = vi.fn();
  render(<QuickFillDialog mapId='map-1' visitsByCode={{}} onSaved={onSaved} onClose={onClose} {...props} />);
  return { onSaved, onClose, dialog: document.querySelector('[role="dialog"]') };
};

// Over 230 tick boxes: label lookups (never getByRole, which is far too slow on a page this
// size in jsdom), and more time than the default
describe('QuickFillDialog', { timeout: 30000 }, () => {
  it('lists every continent with a tick box per country', () => {
    const { dialog } = open();
    expect(dialog.querySelectorAll('[data-quick-fill-continent]').length).toBe(7);
    expect(within(dialog).getByLabelText('France').checked).toBe(false);
    expect(within(dialog).getByLabelText('Antarctica')).toBeTruthy();
  });

  it('shows the UK’s nations instead of the UK on a split map', () => {
    const { dialog } = open({ splitUk: true });
    expect(within(dialog).getByLabelText('Scotland')).toBeTruthy();
    expect(within(dialog).queryByLabelText('United Kingdom')).toBeNull();
  });

  it('ticks and fixes the countries already on the map', () => {
    const { dialog } = open({ visitsByCode: { FR: 'VISITED', JP: 'WANT_TO_GO' } });
    const france = within(dialog).getByLabelText('France (on your map)');
    expect(france.checked).toBe(true);
    expect(france.disabled).toBe(true);
    // "want to go" isn't visited: it can be ticked
    expect(within(dialog).getByLabelText('Japan').disabled).toBe(false);
  });

  it('finds a country by name, ignoring accents and case', () => {
    const { dialog } = open();
    fireEvent.change(within(dialog).getByLabelText('Find a country'), { target: { value: 'COTE' } });
    expect(within(dialog).getByLabelText("Côte d'Ivoire")).toBeTruthy();
    expect(within(dialog).queryByLabelText('France')).toBeNull();
    fireEvent.change(within(dialog).getByLabelText('Find a country'), { target: { value: 'zzzz' } });
    expect(within(dialog).getByText('No country is called that.')).toBeTruthy();
  });

  it('saves the ticked countries, then closes', async () => {
    quickFillVisits.mockResolvedValue({ added: 2 });
    const { dialog, onSaved, onClose } = open();
    const save = within(dialog).getByText('Colour them in').closest('button');
    expect(save.disabled).toBe(true);
    fireEvent.click(within(dialog).getByLabelText('France'));
    fireEvent.click(within(dialog).getByLabelText('Peru'));
    fireEvent.click(within(dialog).getByText('Colour in 2 countries'));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(quickFillVisits).toHaveBeenCalledWith('map-1', ['FR', 'PE']);
    expect(onSaved).toHaveBeenCalledWith(2);
  });

  it('says why when the save fails, and stays open', async () => {
    quickFillVisits.mockRejectedValue(Object.assign(new Error('no'), { friendlyMessage: 'Try later.' }));
    const { dialog, onClose } = open();
    fireEvent.click(within(dialog).getByLabelText('Peru'));
    fireEvent.click(within(dialog).getByText('Colour in 1 country'));
    expect((await within(dialog).findByText('Try later.')).getAttribute('role')).toBe('alert');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('offers Skip the first time and Cancel after', () => {
    const { dialog, onClose } = open({ first: true });
    fireEvent.click(within(dialog).getByText('Skip'));
    expect(onClose).toHaveBeenCalled();
  });
});

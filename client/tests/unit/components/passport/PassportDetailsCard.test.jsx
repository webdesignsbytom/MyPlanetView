// "Travellers’ details" under the passport (components/passport/PassportDetailsCard.jsx; 27 Nov
// 2026, the user's wish: "below the passport we should have a edit data container for the
// peoples info"): each traveller's names, nationality, places and date of birth, saved together
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import PassportDetailsCard from '@/components/passport/PassportDetailsCard';
import { saveTravellerDetails } from '@/utils/map/saveMapSetup';

vi.mock('@/utils/map/saveMapSetup', () => ({ saveTravellerDetails: vi.fn() }));

const TRAVELLERS = [
  { id: 't1', name: 'Charlie', lastName: null, nationalityCode: null, birthCountryCode: 'GB', favouriteCountryCode: null, birthDate: '1990-01-14' },
  { id: 't2', name: 'Alex', lastName: 'Byrne', nationalityCode: 'IE', birthCountryCode: 'IE', favouriteCountryCode: 'JP', birthDate: null },
];
const byId = (id) => document.getElementById(id);
const saveButton = () => screen.getByText('Save details').closest('button');

beforeEach(() => {
  vi.clearAllMocks();
  saveTravellerDetails.mockImplementation(async (_mapId, _before, form) => form.filter((t) => t.id === 't1').map((t) => ({ ...t })));
});

const open = (props = {}) => {
  const onSaved = vi.fn();
  render(<PassportDetailsCard mapId='map-1' travellers={TRAVELLERS} onSaved={onSaved} {...props} />);
  return { onSaved };
};

describe('PassportDetailsCard', () => {
  it('lists every traveller under their own name, with every detail the passport shows, filled in', () => {
    open();
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('Travellers’ details');
    expect([...document.querySelectorAll('legend')].map((l) => l.textContent)).toEqual(['Charlie', 'Alex']);
    expect(byId('traveller-0-name').value).toBe('Charlie');
    expect(byId('traveller-1-lastname').value).toBe('Byrne');
    expect(byId('traveller-1-nationality').value).toBe('IE');
    expect(byId('traveller-0-birth').value).toBe('GB');
    expect(byId('traveller-1-favourite').value).toBe('JP');
    expect(byId('traveller-0-born-on').value).toBe('1990-01-14');
    // Travellers are added and taken off in Settings, never here
    expect(screen.queryByText(/^Remove/)).toBeNull();
    expect(screen.getByText(/Add or take off travellers in the map’s settings/)).toBeTruthy();
  });

  it('saves the changes, says so, and hands back what was saved', async () => {
    const { onSaved } = open();
    fireEvent.change(byId('traveller-0-lastname'), { target: { value: 'Reid' } });
    fireEvent.change(byId('traveller-0-nationality'), { target: { value: 'GB' } });
    fireEvent.click(saveButton());
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    const [mapId, before, form] = saveTravellerDetails.mock.calls[0];
    expect(mapId).toBe('map-1');
    expect(before).toBe(TRAVELLERS);
    expect(form[0]).toMatchObject({ id: 't1', name: 'Charlie', lastName: 'Reid', nationalityCode: 'GB' });
    expect(onSaved).toHaveBeenCalledWith([expect.objectContaining({ id: 't1', lastName: 'Reid' })], { birthplaceChanged: false });
    expect(await screen.findByText('Saved')).toBeTruthy();
    // Changing anything again takes the stamp away
    fireEvent.change(byId('traveller-1-lastname'), { target: { value: 'Byrnes' } });
    expect(screen.queryByText('Saved')).toBeNull();
  });

  it('says when a birthplace changed, as it can bring a page', async () => {
    const { onSaved } = open();
    fireEvent.change(byId('traveller-0-birth'), { target: { value: 'IE' } });
    fireEvent.click(saveButton());
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(expect.any(Array), { birthplaceChanged: true }));
  });

  it('says why it couldn’t save, and keeps what was typed', async () => {
    saveTravellerDetails.mockRejectedValue(Object.assign(new Error('x'), { friendlyMessage: 'Give every traveller a first name.' }));
    const { onSaved } = open();
    fireEvent.change(byId('traveller-0-name'), { target: { value: '' } });
    fireEvent.click(saveButton());
    expect(await screen.findByText('Give every traveller a first name.')).toBeTruthy();
    expect(onSaved).not.toHaveBeenCalled();
    expect(byId('traveller-0-name').value).toBe('');
  });

  it('waits for a verified address, and says why', () => {
    open({ locked: true });
    expect(saveButton().disabled).toBe(true);
    expect(screen.getByText(/Verify your email address to change these details/)).toBeTruthy();
  });
});

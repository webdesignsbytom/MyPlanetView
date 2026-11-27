import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import GroupTypePicker from '@/components/onboarding/GroupTypePicker';
import MapSetupForm from '@/components/onboarding/MapSetupForm';
import TravellerFieldset from '@/components/onboarding/TravellerFieldset';

const byId = (id) => document.getElementById(id);
const travellerNames = () => [...document.querySelectorAll('input[id$="-name"]')].filter((input) => input.id.startsWith('traveller-')).map((input) => input.value);
const type = (id, value) => fireEvent.change(byId(id), { target: { value } });
const radio = (value) => document.querySelector(`input[name="groupType"][value="${value}"]`);

// Each traveller has two 230-country dropdowns: lookups by id, never by role
describe('GroupTypePicker', () => {
  it('offers just me, a couple and a family, and reports the choice', () => {
    const onChange = vi.fn();
    const { container } = render(<GroupTypePicker value='COUPLE' onChange={onChange} />);
    expect(container.querySelector('legend').textContent).toBe('Who is this map for?');
    const radios = [...container.querySelectorAll('input[type="radio"]')];
    expect(radios.map((r) => r.value)).toEqual(['SOLO', 'COUPLE', 'FAMILY']);
    expect(radios.map((r) => r.checked)).toEqual([false, true, false]);
    expect(container.textContent).toContain('Just me');
    expect(container.textContent).toContain('Two of you, travelling together');
    fireEvent.click(radios[2]);
    expect(onChange).toHaveBeenCalledWith('FAMILY');
  });
});

describe('TravellerFieldset', () => {
  const traveller = { name: 'Sam', birthCountryCode: 'GB', favouriteCountryCode: '' };

  it('is numbered, with name, birth and favourite country, each change reported whole', () => {
    const onChange = vi.fn();
    const { container } = render(<TravellerFieldset index={1} traveller={traveller} onChange={onChange} onRemove={() => {}} canRemove={false} />);
    expect(container.querySelector('legend').textContent).toBe('Traveller 2');
    expect(byId('traveller-1-name').value).toBe('Sam');
    expect(byId('traveller-1-birth').value).toBe('GB');
    expect(byId('traveller-1-favourite').value).toBe('');
    expect(byId('traveller-1-favourite').querySelector('option').textContent).toBe('Not set');
    fireEvent.change(byId('traveller-1-favourite'), { target: { value: 'JP' } });
    expect(onChange).toHaveBeenCalledWith({ ...traveller, favouriteCountryCode: 'JP' });
    expect(screen.queryByText(/^Remove/)).toBeNull();
  });

  // 27 Nov 2026, the user's wish: "Passport needs first name last name"
  it('asks for a first name and an optional last name, side by side', () => {
    const onChange = vi.fn();
    render(<TravellerFieldset index={0} traveller={traveller} onChange={onChange} onRemove={() => {}} canRemove={false} />);
    expect(screen.getByLabelText(/^First name/).value).toBe('Sam');
    const last = screen.getByLabelText('Last name (optional)');
    expect(last.value).toBe('');
    expect(last.required).toBe(false);
    fireEvent.change(last, { target: { value: 'Carter' } });
    expect(onChange).toHaveBeenCalledWith({ ...traveller, lastName: 'Carter' });
    // Side by side in one row from small screens up
    const row = byId('traveller-0-name').closest('[class~="sm:grid-cols-2"]');
    expect(row).toBeTruthy();
    expect(row.contains(last)).toBe(true);
  });

  // 27 Nov 2026, the user's wish: "Passport also needs nationality"; asked with the date of birth
  it('asks for an optional nationality, a country, only with the date of birth', () => {
    const first = render(<TravellerFieldset index={0} traveller={traveller} onChange={() => {}} onRemove={() => {}} canRemove={false} />);
    expect(byId('traveller-0-nationality')).toBeNull();
    first.unmount();
    const onChange = vi.fn();
    render(<TravellerFieldset index={0} traveller={{ ...traveller, nationalityCode: 'IE' }} onChange={onChange} onRemove={() => {}} canRemove={false} askBirthDate />);
    const select = byId('traveller-0-nationality');
    expect(select.value).toBe('IE');
    expect(screen.getByText('Nationality (optional)')).toBeTruthy();
    const values = [...select.querySelectorAll('option')].map((o) => o.value);
    expect(values[0]).toBe('');
    expect(values).toContain('PH');
    // Countries alone: never Antarctica, a pole, a UK nation or a region
    for (const code of ['AQ', 'XN', 'XS', 'XC', 'XH']) expect(values).not.toContain(code);
    fireEvent.change(select, { target: { value: 'PH' } });
    expect(onChange).toHaveBeenCalledWith({ ...traveller, nationalityCode: 'PH' });
  });

  // 23 Nov 2026, the user's wish: asked when people are added to a map, never at sign-up
  it('asks for an optional date of birth only when told to, from 1900 to today', () => {
    const first = render(<TravellerFieldset index={0} traveller={traveller} onChange={() => {}} onRemove={() => {}} canRemove={false} />);
    expect(byId('traveller-0-born-on')).toBeNull();
    first.unmount();
    const onChange = vi.fn();
    render(<TravellerFieldset index={0} traveller={{ ...traveller, birthDate: '1990-05-20' }} onChange={onChange} onRemove={() => {}} canRemove={false} askBirthDate />);
    const input = byId('traveller-0-born-on');
    expect(input.type).toBe('date');
    expect(input.value).toBe('1990-05-20');
    expect(input.min).toBe('1900-01-01');
    expect(input.max).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(screen.getByText('Date of birth (optional)')).toBeTruthy();
    expect(document.getElementById(`${input.id}-hint`).textContent).toContain('Only the map’s editors see it.');
    fireEvent.change(input, { target: { value: '1991-01-02' } });
    expect(onChange).toHaveBeenCalledWith({ ...traveller, birthDate: '1991-01-02' });
  });

  it('can be removed when allowed, named by the traveller', () => {
    const onRemove = vi.fn();
    const first = render(<TravellerFieldset index={0} traveller={traveller} onChange={() => {}} onRemove={onRemove} canRemove />);
    fireEvent.click(screen.getByText('Remove Sam'));
    expect(onRemove).toHaveBeenCalled();
    first.unmount();
    render(<TravellerFieldset index={0} traveller={{ ...traveller, name: '' }} onChange={() => {}} onRemove={() => {}} canRemove />);
    expect(screen.getByText('Remove this traveller')).toBeTruthy();
  });
});

describe('MapSetupForm', { timeout: 20000 }, () => {
  const setUp = (props = {}) => {
    const onSubmit = props.onSubmit ?? vi.fn().mockResolvedValue();
    render(<MapSetupForm initial={{ name: 'My map', groupType: 'SOLO', splitUk: true, travellers: [] }} onSubmit={onSubmit} {...props} />);
    return onSubmit;
  };

  it('starts a solo map with one blank traveller, no room for more, the UK split', () => {
    setUp();
    expect(radio('SOLO').checked).toBe(true);
    expect(travellerNames()).toEqual(['']);
    expect(screen.queryByText('Add another traveller')).toBeNull();
    expect(byId('map-name').value).toBe('My map');
    expect(byId('map-split-uk').checked).toBe(true);
  });

  it('suggests the map’s name from the travellers until it is typed over', () => {
    setUp();
    type('traveller-0-name', 'Sam');
    expect(byId('map-name').value).toBe('Sam\'s travels');
    fireEvent.click(radio('COUPLE'));
    // A couple has two travellers
    expect(travellerNames()).toEqual(['Sam', '']);
    type('traveller-1-name', 'Alex');
    expect(byId('map-name').value).toBe('Sam & Alex\'s travels');
    fireEvent.click(radio('FAMILY'));
    expect(byId('map-name').value).toBe('Sam\'s family travels');
    type('map-name', 'The Carters');
    type('traveller-1-name', 'Jo');
    expect(byId('map-name').value).toBe('The Carters');
  });

  it('a family can add travellers; a couple only shows "Add" while there is room', () => {
    setUp({ initial: { name: '', groupType: 'FAMILY', travellers: [] } });
    expect(travellerNames()).toEqual(['', '']);
    fireEvent.click(screen.getByText('Add another traveller'));
    expect(travellerNames()).toEqual(['', '', '']);
    // Above the family's minimum of two, each can be removed
    expect(screen.getAllByText('Remove this traveller').length).toBe(3);
    fireEvent.click(screen.getAllByText('Remove this traveller')[2]);
    expect(travellerNames()).toEqual(['', '']);
    expect(screen.queryByText('Remove this traveller')).toBeNull();
  });

  it('checks the name and travellers before saving', async () => {
    const onSubmit = setUp();
    type('map-name', '  ');
    fireEvent.click(screen.getByText('Save'));
    expect(await screen.findByText('Give the map a name.')).toBeTruthy();
    type('map-name', 'Mine');
    fireEvent.click(screen.getByText('Save'));
    expect(await screen.findByText('Add at least one traveller’s name.')).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('won’t make a couple’s map of three people', async () => {
    const onSubmit = setUp({
      initial: { name: 'Ours', groupType: 'FAMILY', travellers: [{ id: 't1', name: 'Sam' }, { id: 't2', name: 'Alex' }, { id: 't3', name: 'Jo' }] },
    });
    fireEvent.click(radio('COUPLE'));
    fireEvent.click(screen.getByText('Save'));
    expect(await screen.findByText('"A couple" is for two travellers: remove the others first.')).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('saves the form and shows the Saved stamp until something changes', async () => {
    const onSavedChange = vi.fn();
    const onSubmit = setUp({ onSavedChange, submitLabel: 'Save map' });
    type('traveller-0-name', 'Sam');
    fireEvent.change(byId('traveller-0-birth'), { target: { value: 'GB' } });
    fireEvent.click(byId('map-split-uk'));
    fireEvent.click(screen.getByText('Save map'));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0]).toEqual({
      name: 'Sam\'s travels',
      groupType: 'SOLO',
      splitUk: false,
      travellers: [{ id: undefined, name: 'Sam', lastName: '', nationalityCode: '', birthCountryCode: 'GB', favouriteCountryCode: '', birthDate: '' }],
    });
    await waitFor(() => expect(onSavedChange).toHaveBeenLastCalledWith(true));
    expect(screen.getByText(/Saved/)).toBeTruthy();
    type('traveller-0-name', 'Samuel');
    expect(onSavedChange).toHaveBeenLastCalledWith(false);
  });

  it('never asks a date of birth without askBirthDate (the welcome page, straight after sign-up)', () => {
    setUp();
    expect(byId('traveller-0-born-on')).toBeNull();
  });

  it('keeps a traveller’s date of birth, and saves a new one', async () => {
    const onSubmit = setUp({
      askBirthDate: true,
      initial: { name: 'Ours', groupType: 'COUPLE', travellers: [{ id: 't1', name: 'Sam', birthDate: '1985-03-04' }, { id: 't2', name: 'Alex' }] },
    });
    expect(byId('traveller-0-born-on').value).toBe('1985-03-04');
    expect(byId('traveller-1-born-on').value).toBe('');
    type('traveller-1-born-on', '1987-07-08');
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0].travellers.map((t) => t.birthDate)).toEqual(['1985-03-04', '1987-07-08']);
  });

  it('shows why a save failed', async () => {
    setUp({ onSubmit: vi.fn().mockRejectedValue(Object.assign(new Error('x'), { friendlyMessage: 'A couple’s map is two people.' })) });
    type('traveller-0-name', 'Sam');
    fireEvent.click(screen.getByText('Save'));
    expect(await screen.findByText('A couple’s map is two people.')).toBeTruthy();
  });

  // Settings (27 Nov 2026, the user's wish): the choices behind a button
  it('with `typeBehindButton`, says who the map is for and keeps the choices behind "Change map type"', async () => {
    const onSubmit = setUp({ typeBehindButton: true, initial: { name: 'Ours', groupType: 'COUPLE', travellers: [{ id: 't1', name: 'Sam' }, { id: 't2', name: 'Alex' }] } });
    expect(radio('COUPLE')).toBeNull();
    expect(document.querySelector('[data-map-type]').textContent).toContain('This map is for: A couple');
    const change = screen.getByText('Change map type');
    expect(change.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(change);
    expect(change.getAttribute('aria-expanded')).toBe('true');
    expect(change.getAttribute('aria-controls')).toBe('map-type-choices');
    expect(radio('COUPLE').checked).toBe(true);
    fireEvent.click(radio('FAMILY'));
    expect(document.querySelector('[data-map-type]').textContent).toContain('This map is for: A family');
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ groupType: 'FAMILY' })));
    // Shut again
    fireEvent.click(change);
    expect(radio('FAMILY')).toBeNull();
  });

  it('shows the choices at once without it (the welcome page)', () => {
    setUp();
    expect(screen.queryByText('Change map type')).toBeNull();
    expect(radio('SOLO')).not.toBeNull();
  });

  it('an editor sees only the travellers: no kind, name or UK switch', () => {
    setUp({ canRename: false, initial: { name: 'Ours', groupType: 'COUPLE', travellers: [{ id: 't1', name: 'Sam' }, { id: 't2', name: 'Alex' }] } });
    expect(radio('COUPLE')).toBeNull();
    expect(byId('map-name')).toBeNull();
    expect(byId('map-split-uk')).toBeNull();
    expect(travellerNames()).toEqual(['Sam', 'Alex']);
  });

  it('says what the UK switch does to places already on the map, when asked', () => {
    setUp({ splitUkNote: true });
    expect(byId('map-split-uk-hint').textContent).toContain('Turning it off puts them all back in the United Kingdom.');
  });
});

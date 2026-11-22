import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import TripStopForm from '@/components/trips/TripStopForm';
import useLandmarks from '@/hooks/useLandmarks';
import { SplitUkProvider } from '@/hooks/useSplitUk';

vi.mock('@/hooks/useLandmarks', () => ({ default: vi.fn() }));

const LANDMARKS = {
  FR: [
    { id: 'eiffel', name: 'Eiffel Tower' },
    { id: 'louvre', name: 'Louvre' },
  ],
};

const set = (label, value) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
const submit = () => fireEvent.submit(document.querySelector('form'));

describe('TripStopForm', { timeout: 20000 }, () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useLandmarks.mockImplementation((code) => ({ landmarks: LANDMARKS[code] || [] }));
  });

  it('starts empty, the landmark list waiting for a country', () => {
    render(<TripStopForm onSubmit={vi.fn()} />);
    expect(screen.getByLabelText(/^Country/).value).toBe('');
    const landmark = screen.getByLabelText('Landmark');
    expect(landmark.disabled).toBe(true);
    expect(landmark.textContent).toContain('None known');
    expect(useLandmarks).toHaveBeenLastCalledWith('', { enabled: false });
    expect(screen.getByText('Add stop')).toBeTruthy();
  });

  it('offers a country’s landmarks once it is chosen, and forgets the landmark when the country changes', () => {
    render(<TripStopForm onSubmit={vi.fn()} />);
    set(/^Country/, 'FR');
    expect(useLandmarks).toHaveBeenLastCalledWith('FR', { enabled: true });
    const landmark = screen.getByLabelText('Landmark');
    expect(landmark.disabled).toBe(false);
    expect([...landmark.options].map((o) => o.textContent)).toEqual(['None', 'Eiffel Tower', 'Louvre']);
    set('Landmark', 'louvre');
    expect(screen.getByLabelText('Landmark').value).toBe('louvre');
    set(/^Country/, 'JP');
    expect(screen.getByLabelText('Landmark').value).toBe('');
  });

  it('lists the special places after the countries, and the UK’s nations on a split map', () => {
    const { unmount } = render(<TripStopForm onSubmit={vi.fn()} />);
    const groups = [...document.querySelectorAll('optgroup')].map((g) => g.label);
    expect(groups).toEqual(['Countries', 'Special places']);
    expect(document.querySelector('option[value="GB"]')).toBeTruthy();
    expect(document.querySelector('option[value="XC"]')).toBeNull();
    unmount();
    render(
      <SplitUkProvider value>
        <TripStopForm onSubmit={vi.fn()} />
      </SplitUkProvider>,
    );
    expect(document.querySelector('option[value="XC"]').textContent).toBe('Scotland');
    expect(document.querySelector('option[value="GB"]')).toBeNull();
  });

  it('asks for a country first', () => {
    const onSubmit = vi.fn();
    render(<TripStopForm onSubmit={onSubmit} />);
    submit();
    expect(screen.getByRole('alert').textContent).toBe('Choose a country for this stop.');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('refuses leaving before arriving', () => {
    const onSubmit = vi.fn();
    render(<TripStopForm onSubmit={onSubmit} />);
    set(/^Country/, 'FR');
    set('Arrive', '2027-06-05');
    set('Leave', '2027-06-01');
    expect(screen.getByLabelText('Leave').getAttribute('min')).toBe('2027-06-05');
    submit();
    expect(screen.getByRole('alert').textContent).toBe('You leave before you arrive.');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('adds a stop, trimming its words, then starts afresh', async () => {
    const onSubmit = vi.fn().mockResolvedValue();
    render(<TripStopForm onSubmit={onSubmit} />);
    set(/^Country/, 'FR');
    set('Landmark', 'eiffel');
    set('Town or place', '  Paris ');
    set('Arrive', '2027-06-01');
    set('Leave', '2027-06-04');
    set('Notes', ' Bring a coat ');
    submit();
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit).toHaveBeenCalledWith({
      countryCode: 'FR',
      landmarkId: 'eiffel',
      placeName: 'Paris',
      arriveOn: '2027-06-01',
      leaveOn: '2027-06-04',
      notes: 'Bring a coat',
    });
    await waitFor(() => expect(screen.getByLabelText(/^Country/).value).toBe(''));
    expect(screen.getByLabelText('Town or place').value).toBe('');
  });

  it('sends what is left empty as null', async () => {
    const onSubmit = vi.fn().mockResolvedValue();
    render(<TripStopForm onSubmit={onSubmit} />);
    set(/^Country/, 'AQ');
    submit();
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0]).toEqual({ countryCode: 'AQ', landmarkId: null, placeName: null, arriveOn: null, leaveOn: null, notes: null });
  });

  it('edits a stop in place, keeping it after saving, with its own ids and button', async () => {
    const onSubmit = vi.fn().mockResolvedValue();
    const onCancel = vi.fn();
    const stop = { countryCode: 'FR', landmarkId: 'louvre', placeName: 'Paris', arriveOn: '2027-06-01', leaveOn: '', notes: 'Art' };
    render(<TripStopForm initial={stop} idPrefix='stop-s1' submitLabel='Save stop' onSubmit={onSubmit} onCancel={onCancel} />);
    expect(document.getElementById('stop-s1-country').value).toBe('FR');
    expect(screen.getByLabelText('Landmark').value).toBe('louvre');
    fireEvent.click(screen.getByText('Save stop'));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(screen.getByLabelText('Town or place').value).toBe('Paris');
    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('says why a save failed', async () => {
    render(<TripStopForm onSubmit={vi.fn().mockRejectedValue(Object.assign(new Error('x'), { friendlyMessage: 'Too many stops.' }))} />);
    set(/^Country/, 'FR');
    submit();
    expect((await screen.findByRole('alert')).textContent).toBe('Too many stops.');
    expect(screen.getByLabelText(/^Country/).value).toBe('FR');
  });
});

import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import FlightLogDialog from '@/components/flights/FlightLogDialog';
import { addFlights, deleteFlight, getMapFlights } from '@/api/flightsApi';
import { createStop, createTrip } from '@/api/travelApi';

vi.mock('@/api/flightsApi', () => ({ getMapFlights: vi.fn(), addFlights: vi.fn(), deleteFlight: vi.fn() }));
vi.mock('@/api/travelApi', () => ({ createTrip: vi.fn(), createStop: vi.fn() }));
vi.mock('@/utils/flights/airports', async (importOriginal) => ({
  ...(await importOriginal()),
  loadAirports: () =>
    Promise.resolve({
      LHR: ['London Heathrow Airport', 'London', 'GB', 51.4707, -0.4599, 'XE'],
      JFK: ['John F. Kennedy International Airport', 'New York', 'US', 40.6394, -73.7793, null],
      FCO: ['Rome Fiumicino', 'Rome', 'IT', 41.8, 12.25, null],
    }),
}));

const LOG = {
  flights: [{ id: 'f1', tripId: null, from: 'LHR', to: 'FCO', flownOn: '2025-07-02', carrier: 'BA', flightNumber: '548', distanceKm: 1444, source: 'MANUAL' }],
  totals: { flights: 1, distanceKm: 1444, airports: ['FCO', 'LHR'], airlines: 1, longest: null },
};
const IATA_PASS = 'M1DESMARAIS/LUC       EABC123 LHRJFKBA 0117 152J001A0025 100';

describe('FlightLogDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getMapFlights.mockResolvedValue(LOG);
  });

  it('shows the log’s numbers, the airports as stamps, and each flight', async () => {
    render(<FlightLogDialog mapId='m1' onClose={vi.fn()} />);
    expect(await screen.findByText('LHR → FCO · BA 548')).toBeTruthy();
    expect(screen.getByText('1,444 km (897 miles)')).toBeTruthy();
    expect(document.querySelectorAll('[data-airport-stamps] li')).toHaveLength(2);
    expect(screen.getByText(/2 Jul 2025 · London to Rome/)).toBeTruthy();
    // A viewer can't add or delete
    expect(screen.queryByText('Scan a boarding pass')).toBeNull();
    expect(screen.queryByText('Delete')).toBeNull();
  });

  it('asks an unverified editor to verify first', async () => {
    render(<FlightLogDialog mapId='m1' canEdit onClose={vi.fn()} />);
    expect(await screen.findByText('Verify your email address to add flights.')).toBeTruthy();
  });

  it('reads a pasted boarding pass, makes the trip and marks the countries', async () => {
    createTrip.mockResolvedValue({ trip: { id: 'trip-new' } });
    createStop.mockResolvedValue({});
    addFlights.mockResolvedValue({ flights: [{ id: 'f2' }], skipped: 0 });
    const onSetVisit = vi.fn().mockResolvedValue({});
    const onChanged = vi.fn();
    render(<FlightLogDialog mapId='m1' canEdit canAdd visitsByCode={{ GB: 'LIVED' }} onSetVisit={onSetVisit} onChanged={onChanged} onClose={vi.fn()} />);
    fireEvent.click(await screen.findByText('Scan a boarding pass'));
    fireEvent.change(screen.getByLabelText(/The barcode’s text/), { target: { value: IATA_PASS } });
    fireEvent.click(screen.getByText('Read it'));

    expect(await screen.findByText(/London \(LHR\) → New York \(JFK\) · BA 117/)).toBeTruthy();
    expect(screen.getByLabelText(/United Kingdom/).disabled).toBe(true);
    expect(screen.getByLabelText(/United States/).checked).toBe(true);
    expect(screen.getByLabelText('Its title').value).toBe('Trip to New York');
    fireEvent.click(screen.getByText('Save to my flight log'));

    await waitFor(() => expect(onChanged).toHaveBeenCalled());
    expect(createTrip).toHaveBeenCalledWith('m1', expect.objectContaining({ title: 'Trip to New York' }));
    expect(createStop).toHaveBeenCalledWith('trip-new', { countryCode: 'US', placeName: 'New York' });
    expect(addFlights).toHaveBeenCalledWith('m1', expect.objectContaining({ source: 'BOARDING_PASS', tripId: 'trip-new' }));
    expect(await screen.findByText(/1 flight added/)).toBeTruthy();
  });

  it('says when pasted text isn’t a boarding pass, and when an airport is unknown', async () => {
    render(<FlightLogDialog mapId='m1' canEdit canAdd onSetVisit={vi.fn()} onClose={vi.fn()} />);
    fireEvent.click(await screen.findByText('Scan a boarding pass'));
    fireEvent.change(screen.getByLabelText(/The barcode’s text/), { target: { value: 'hello' } });
    fireEvent.click(screen.getByText('Read it'));
    expect(await screen.findByText(/That isn’t a boarding pass’s barcode/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText(/The barcode’s text/), { target: { value: IATA_PASS.replace('LHRJFK', 'LHRQQQ') } });
    fireEvent.click(screen.getByText('Read it'));
    expect(await screen.findByText(/We don’t know the airport QQQ/)).toBeTruthy();
    expect(screen.getByText('Save to my flight log').closest('button').disabled).toBe(true);
  });

  it('takes a typed flight, and deletes one for an editor', async () => {
    deleteFlight.mockResolvedValue({ deleted: true });
    render(<FlightLogDialog mapId='m1' canEdit canAdd onSetVisit={vi.fn()} onClose={vi.fn()} />);
    fireEvent.click(await screen.findByText('Scan a boarding pass'));
    fireEvent.change(screen.getByLabelText('From (airport code)'), { target: { value: 'lhr' } });
    fireEvent.change(screen.getByLabelText('To (airport code)'), { target: { value: 'QQQ' } });
    fireEvent.click(screen.getByText('Add this flight'));
    expect(await screen.findByText(/Give two different airports/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText('To (airport code)'), { target: { value: 'jfk' } });
    fireEvent.click(screen.getByText('Add this flight'));
    expect(await screen.findByText('Give the day of the flight.')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Day'), { target: { value: '2026-06-01' } });
    fireEvent.click(screen.getByText('Add this flight'));
    expect(await screen.findByText(/London \(LHR\) → New York \(JFK\)/)).toBeTruthy();
    expect(document.querySelector('[data-flight-leg]').textContent).toMatch(/^1 Jun 2026 · London/);
    fireEvent.click(screen.getByText('Start again'));
    fireEvent.click(screen.getByText('Cancel'));
    fireEvent.click(screen.getByText('Delete'));
    await waitFor(() => expect(deleteFlight).toHaveBeenCalledWith('f1'));
  });
});

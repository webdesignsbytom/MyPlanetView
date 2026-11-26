import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import FlightLogDialog from '@/components/flights/FlightLogDialog';
import { addFlights, deleteFlight, getMapFlights } from '@/api/flightsApi';
import { createStop, createTrip } from '@/api/travelApi';
import { DistanceUnitProvider } from '@/hooks/useDistanceUnit';

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

  // 25 Nov 2026, the user's wishes: each section folds under an arrow on the far right, kept for
  // the visit; the list is "Flights taken"; the stamps have more style (AirportStamp)
  it('folds the airports and the flights taken away, and remembers it for the visit', async () => {
    sessionStorage.clear();
    const { unmount } = render(<FlightLogDialog mapId='m1' onClose={vi.fn()} />);
    await screen.findByText('LHR → FCO · BA 548');
    const airports = screen.getByRole('button', { name: 'Airports collected' });
    const flights = screen.getByRole('button', { name: 'Flights taken' });
    expect(airports.getAttribute('aria-expanded')).toBe('true');
    expect(flights.getAttribute('aria-expanded')).toBe('true');
    // The name, then the arrow last, on the far right
    expect(airports.lastElementChild.tagName.toLowerCase()).toBe('svg');
    expect(airports.className).toContain('grid-cols-[minmax(0,1fr)_auto]');

    fireEvent.click(flights);
    expect(flights.getAttribute('aria-expanded')).toBe('false');
    expect(document.getElementById(flights.getAttribute('aria-controls')).hidden).toBe(true);
    expect(document.getElementById(airports.getAttribute('aria-controls')).hidden).toBe(false);
    expect(JSON.parse(sessionStorage.getItem('mpv:flightLogClosed'))).toEqual(['flights']);
    unmount();

    render(<FlightLogDialog mapId='m1' onClose={vi.fn()} />);
    await screen.findByText('LHR → FCO · BA 548');
    const again = screen.getByRole('button', { name: 'Flights taken' });
    expect(again.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(again);
    expect(again.getAttribute('aria-expanded')).toBe('true');
    expect(sessionStorage.getItem('mpv:flightLogClosed')).toBeNull();
  });

  it('draws each airport as a stamp with its city and first day flown, and says so in words', async () => {
    render(<FlightLogDialog mapId='m1' onClose={vi.fn()} />);
    await screen.findByText('LHR → FCO · BA 548');
    const items = [...document.querySelectorAll('[data-airport-stamps] li')];
    const rome = items.find((li) => li.textContent.includes('Rome Fiumicino'));
    expect(rome.querySelector('svg[data-airport-stamp]').getAttribute('aria-hidden')).toBe('true');
    expect([...rome.querySelectorAll('textPath')].map((t) => t.textContent)).toEqual(['ROME', '2 JUL 2025']);
    expect(rome.querySelector('.sr-only').textContent).toBe('Rome Fiumicino (FCO), first flown 2 Jul 2025');
  });

  // 24 Nov 2026, the user's wish: what the distance is like, and miles first on a map in miles
  it('says what the distance flown is like', async () => {
    render(<FlightLogDialog mapId='m1' onClose={vi.fn()} />);
    const flown = (await screen.findByText('Flown')).parentElement;
    expect([...flown.querySelectorAll('dd')].map((d) => d.textContent)).toEqual(['1,444 km (897 miles)', 'About as far as London to Rome']);
  });

  it('puts miles first on a map shown in miles', async () => {
    render(
      <DistanceUnitProvider value='miles'>
        <FlightLogDialog mapId='m1' onClose={vi.fn()} />
      </DistanceUnitProvider>,
    );
    expect(await screen.findByText('897 miles (1,444 km)')).toBeTruthy();
    expect(screen.getByText(/2 Jul 2025 · London to Rome · 897 miles \(1,444 km\)/)).toBeTruthy();
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

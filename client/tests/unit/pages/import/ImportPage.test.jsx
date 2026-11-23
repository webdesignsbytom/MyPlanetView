import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import ImportPage from '@/pages/import/ImportPage';
import { getMap, getMyMaps } from '@/api/travelApi';
import { exportFiles } from '@/utils/import/exportFiles';
import { readPolarstepsExport } from '@/utils/import/polarsteps';
import { runPolarstepsImport } from '@/utils/import/runImport';
import { forgetMapLists } from '@/utils/map/mapListCache';
import useMustVerifyEmail from '@/hooks/useMustVerifyEmail';
import { IMPORT_PAGE_URL } from '@/utils/constants/routes';
import { headings, onlyMain, renderPage, signedIn } from '../renderPage';

vi.mock('@/api/travelApi', () => ({ getMap: vi.fn(), getMyMaps: vi.fn() }));
vi.mock('@/utils/import/exportFiles', () => ({ exportFiles: vi.fn() }));
vi.mock('@/utils/import/polarsteps', () => ({ readPolarstepsExport: vi.fn() }));
vi.mock('@/utils/import/runImport', () => ({ runPolarstepsImport: vi.fn() }));
vi.mock('@/utils/map/mapListCache', () => ({ forgetMapLists: vi.fn() }));
vi.mock('@/hooks/useMustVerifyEmail', () => ({ default: vi.fn(() => false) }));

const MAPS = [
  { id: 'm-1', name: 'My map', role: 'OWNER' },
  { id: 'm-2', name: 'Our trips', role: 'EDITOR' },
];
const TRIPS = [
  { key: 'k1', id: '1', title: 'Iceland ring road', startDate: '2024-06-01', endDate: '2024-06-14', countries: ['IS'], photos: 3, stories: 1, videos: 0, unreadable: 0 },
  { key: 'k2', id: '2', title: 'Weekend in Rome', startDate: null, endDate: null, countries: ['IT'], photos: 1, stories: 0, videos: 0, unreadable: 0 },
];

const open = (at = IMPORT_PAGE_URL) => renderPage(<ImportPage />, { path: IMPORT_PAGE_URL, at, auth: signedIn() });
const pickZip = () => {
  const file = new File(['zip'], 'polarsteps.zip', { type: 'application/zip' });
  fireEvent.change(document.querySelector('[data-import-zip]'), { target: { files: [file] } });
  return file;
};

beforeEach(() => {
  vi.clearAllMocks();
  useMustVerifyEmail.mockReturnValue(false);
  getMyMaps.mockResolvedValue({ maps: MAPS });
  getMap.mockImplementation((id) => Promise.resolve({ map: { id, uploadRules: { photosPerCountry: id === 'm-2' ? 200 : 30 } } }));
  exportFiles.mockResolvedValue([{ path: 'trip/trip.json' }]);
  readPolarstepsExport.mockResolvedValue(TRIPS);
});

describe('ImportPage', () => {
  it('has one main and its h1, starting with the download to pick', () => {
    open();
    const { count, main, id } = onlyMain();
    expect(count).toBe(1);
    expect(id).toBe('main-content');
    expect(main.getAttribute('aria-labelledby')).toBe('import-page-heading');
    expect(headings()).toEqual(['Bring your travels from Polarsteps']);
    expect(main.querySelector('[data-import-zip]')).toBeTruthy();
    expect(main.querySelector('[data-import-trip]')).toBeNull();
  });

  it('reads the download and offers every trip, all chosen, on the map from ?map=', async () => {
    open(`${IMPORT_PAGE_URL}?map=m-2`);
    const file = pickZip();
    await waitFor(() => expect(document.querySelectorAll('[data-import-trip]').length).toBe(2));
    expect(exportFiles).toHaveBeenCalledWith([file]);
    expect([...document.querySelectorAll('[data-import-trip] input')].every((input) => input.checked)).toBe(true);
    await waitFor(() => expect(screen.getByLabelText('Bring them to').value).toBe('m-2'));
    expect(getMap).toHaveBeenCalledWith('m-2');
    await waitFor(() => expect(document.querySelector('main').textContent).toContain('This map keeps 200 photos of each country'));
  });

  it('says why a download couldn’t be read', async () => {
    readPolarstepsExport.mockRejectedValue(new Error('No trip.json in that download.'));
    open();
    pickZip();
    expect(await screen.findByText('No trip.json in that download.')).toBeTruthy();
    expect(document.querySelector('[data-import-trip]')).toBeNull();
  });

  it('runs the chosen trips onto the map, showing the progress, then opens the map', async () => {
    runPolarstepsImport.mockImplementation(async ({ onProgress }) => {
      onProgress({ stage: 'photos', trips: 1, tripsNew: 1, tripsTotal: 1, photos: 1, photosTotal: 3, already: 0, full: 0, failed: 0, stories: 0, storiesTotal: 1 });
      onProgress({ stage: 'done', trips: 1, tripsNew: 1, tripsTotal: 1, photos: 3, photosTotal: 3, already: 0, full: 0, failed: 0, stories: 1, storiesTotal: 1 });
    });
    open();
    pickZip();
    await waitFor(() => expect(document.querySelectorAll('[data-import-trip]').length).toBe(2));
    fireEvent.click(document.querySelector('[data-import-trip="Weekend in Rome"] input'));
    fireEvent.click(screen.getByText('Bring 1 trip to the map'));
    await waitFor(() => expect(document.querySelector('[data-import-stage]')?.getAttribute('data-import-stage')).toBe('done'));
    const call = runPolarstepsImport.mock.calls[0][0];
    expect(call.mapId).toBe('m-1');
    expect(call.trips.map((trip) => trip.key)).toEqual(['k1']);
    expect(call.withPhotos).toBe(true);
    expect(call.withStories).toBe(true);
    expect(call.uploadRules).toEqual({ photosPerCountry: 30 });
    expect(forgetMapLists).toHaveBeenCalled();
    expect(screen.getByText('Open the map').getAttribute('href')).toBe('/maps/m-1');
    // Done: the download can be picked again
    expect(document.querySelector('[data-import-zip]')).toBeTruthy();
  });

  it('stopping aborts the run and says it stopped early', async () => {
    runPolarstepsImport.mockImplementation(
      ({ signal, onProgress }) =>
        new Promise((resolve, reject) => {
          onProgress({ stage: 'trips', trips: 0, tripsNew: 0, tripsTotal: 2, photos: 0, photosTotal: 0, already: 0, full: 0, failed: 0 });
          signal.addEventListener('abort', () => reject(Object.assign(new Error('stopped'), { name: 'AbortError' })));
        }),
    );
    open();
    pickZip();
    fireEvent.click(await screen.findByText('Bring 2 trips to the map'));
    await waitFor(() => expect(screen.getByText('Stop')).toBeTruthy());
    // While it runs, nothing else can be picked
    expect(document.querySelector('[data-import-zip]')).toBeNull();
    fireEvent.click(screen.getByText('Stop'));
    expect(await screen.findByText('Stopped. Run it again to carry on where it stopped.')).toBeTruthy();
  });

  it('a failed run says why', async () => {
    runPolarstepsImport.mockRejectedValue(Object.assign(new Error('x'), { friendlyMessage: 'The map is locked.' }));
    open();
    pickZip();
    fireEvent.click(await screen.findByText('Bring 2 trips to the map'));
    expect(await screen.findByText('The map is locked.')).toBeTruthy();
    expect(screen.getByText('The import stopped.')).toBeTruthy();
  });

  it('with no map to bring them to, says so', async () => {
    getMyMaps.mockResolvedValue({ maps: [{ id: 'v', name: 'Theirs', role: 'VIEWER' }] });
    open();
    pickZip();
    expect(await screen.findByText('You need a map of your own (or one you edit) to bring them to.')).toBeTruthy();
  });

  it('unverified: can choose but not start', async () => {
    useMustVerifyEmail.mockReturnValue(true);
    open();
    pickZip();
    expect(await screen.findByText(/Verify your email address to import/)).toBeTruthy();
    expect(screen.queryByText(/^Bring \d/)).toBeNull();
  });
});

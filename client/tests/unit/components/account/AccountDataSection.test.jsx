import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import AccountDataSection from '@/components/account/AccountDataSection';
import { buildDataExport, dataExportFileName, saveJsonFile } from '@/utils/account/dataExport';

vi.mock('@/utils/account/dataExport', () => ({
  buildDataExport: vi.fn(),
  dataExportFileName: vi.fn(() => 'my-planet-view-data-2026-11-22.json'),
  saveJsonFile: vi.fn(),
}));

const button = () => screen.getByText('Download my data').closest('button');

describe('AccountDataSection', () => {
  beforeEach(() => vi.resetAllMocks());

  it('gathers the data, says how far it has got, then saves one JSON file', async () => {
    let progress;
    let finish;
    buildDataExport.mockImplementation(({ onProgress }) => {
      progress = onProgress;
      return new Promise((resolve) => (finish = resolve));
    });
    const { container } = render(<AccountDataSection />);
    fireEvent.click(button());
    expect(button().getAttribute('aria-busy')).toBe('true');
    expect(button().disabled).toBe(true);
    act(() => progress('map 2 of 3'));
    expect(container.querySelector('[role="status"]').textContent).toBe('Gathering: map 2 of 3…');

    const contents = { exportedAt: '2026-11-22T10:00:00.000Z', maps: [] };
    await act(async () => finish(contents));
    expect(dataExportFileName).toHaveBeenCalledWith('2026-11-22T10:00:00.000Z');
    expect(saveJsonFile).toHaveBeenCalledWith(contents, 'my-planet-view-data-2026-11-22.json');
    expect(screen.getByText('Your data is downloading. The photo links in it work for 7 days.').getAttribute('role')).toBe('alert');
    expect(button().getAttribute('aria-busy')).toBe('false');
    expect(container.querySelector('[role="status"]').textContent).toBe('');
  });

  it('says why when the data couldn’t be gathered, and can be tried again', async () => {
    buildDataExport.mockRejectedValueOnce(Object.assign(new Error('no'), { friendlyMessage: 'The server is busy.' }));
    render(<AccountDataSection />);
    fireEvent.click(button());
    expect(await screen.findByText('The server is busy.')).toBeTruthy();
    expect(saveJsonFile).not.toHaveBeenCalled();
    expect(button().disabled).toBe(false);

    buildDataExport.mockRejectedValueOnce(new Error('offline'));
    fireEvent.click(button());
    expect(await screen.findByText('Your data couldn’t be gathered. Please try again.')).toBeTruthy();
  });

  it('starts only one download at a time', async () => {
    buildDataExport.mockReturnValue(new Promise(() => {}));
    render(<AccountDataSection />);
    fireEvent.click(button());
    fireEvent.click(button());
    await waitFor(() => expect(buildDataExport).toHaveBeenCalledTimes(1));
  });
});

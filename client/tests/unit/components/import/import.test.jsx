import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ImportChooseCard from '@/components/import/ImportChooseCard';
import ImportPickCard from '@/components/import/ImportPickCard';
import ImportProgressCard from '@/components/import/ImportProgressCard';

describe('ImportPickCard', () => {
  it('takes the zip or the unzipped folder and hands the files on', () => {
    const onPick = vi.fn();
    const { container } = render(<ImportPickCard reading={false} error={null} onPick={onPick} />);
    const zip = container.querySelector('[data-import-zip]');
    const folder = container.querySelector('[data-import-folder]');
    expect(zip.getAttribute('accept')).toBe('.zip,application/zip');
    expect(folder.hasAttribute('webkitdirectory')).toBe(true);
    expect(folder.multiple).toBe(true);
    const clicked = vi.spyOn(zip, 'click').mockImplementation(() => {});
    fireEvent.click(screen.getByText('Choose the zip'));
    expect(clicked).toHaveBeenCalled();
    const file = new File(['zip'], 'polarsteps.zip', { type: 'application/zip' });
    fireEvent.change(zip, { target: { files: [file] } });
    expect(onPick).toHaveBeenCalledWith([file]);
  });

  it('opens the folder picker from its own button', () => {
    const { container } = render(<ImportPickCard reading={false} error={null} onPick={() => {}} />);
    const folder = container.querySelector('[data-import-folder]');
    const clicked = vi.spyOn(folder, 'click').mockImplementation(() => {});
    fireEvent.click(screen.getByText('Choose the unzipped folder'));
    expect(clicked).toHaveBeenCalled();
  });

  it('a choice with no files is ignored', () => {
    const onPick = vi.fn();
    const { container } = render(<ImportPickCard reading={false} error={null} onPick={onPick} />);
    fireEvent.change(container.querySelector('[data-import-zip]'), { target: { files: [] } });
    expect(onPick).not.toHaveBeenCalled();
  });

  it('says it is reading, and shows an error', () => {
    const { container } = render(<ImportPickCard reading error='That isn’t a Polarsteps download.' onPick={() => {}} />);
    expect(container.querySelector('[role="status"]').textContent).toBe('Reading your download…');
    expect(screen.getByText('Choose the unzipped folder').closest('button').disabled).toBe(true);
    expect(screen.getByText('That isn’t a Polarsteps download.')).toBeTruthy();
  });
});

describe('ImportChooseCard', () => {
  const TRIPS = [
    { key: 'k1', id: '1', title: 'Iceland ring road', startDate: '2024-06-01', endDate: '2024-06-14', countries: ['IS'], photos: 120, stories: 3, videos: 2, unreadable: 1 },
    { key: 'k2', id: '2', title: 'Weekend in Rome', startDate: null, endDate: null, countries: ['IT', 'VA'], photos: 1, stories: 0, videos: 0, unreadable: 0 },
  ];
  const props = (over = {}) => ({
    trips: TRIPS,
    chosen: new Set(['k1']),
    onToggle: vi.fn(),
    onAll: vi.fn(),
    mapId: 'm1',
    mapOptions: [{ value: 'm1', label: 'My map' }, { value: 'm2', label: 'Our trips (you edit it)' }],
    onMap: vi.fn(),
    uploadRules: { photosPerCountry: 30 },
    withPhotos: true,
    onPhotos: vi.fn(),
    withStories: true,
    onStories: vi.fn(),
    locked: false,
    onStart: vi.fn(),
    ...over,
  });

  it('lists every trip with its dates, countries, photos and stories, ticked as chosen', () => {
    const p = props();
    const { container } = render(<ImportChooseCard {...p} />);
    expect(container.textContent).toContain('Trips (1 of 2)');
    const iceland = container.querySelector('[data-import-trip="Iceland ring road"]');
    expect(iceland.querySelector('input').checked).toBe(true);
    expect(iceland.textContent).toMatch(/2024.*· 1 country · 120 photos · 3 stories/);
    const rome = container.querySelector('[data-import-trip="Weekend in Rome"]');
    expect(rome.querySelector('input').checked).toBe(false);
    expect(rome.textContent).toContain('No dates · 2 countries · 1 photo');
    fireEvent.click(rome.querySelector('input'));
    expect(p.onToggle).toHaveBeenCalledWith('k2');
  });

  it('counts what the chosen trips bring, what can’t come, and the plan’s limit', () => {
    const { container } = render(<ImportChooseCard {...props()} />);
    expect(container.textContent).toContain('Their photos (120 photos)');
    expect(container.textContent).toContain('(3 stories)');
    expect(container.textContent).toContain('This map keeps 30 photos of each country');
    expect(container.textContent).toContain('2 videos can’t come');
    expect(container.textContent).toContain('1 HEIC photo can’t come');
    expect(screen.getByText('Bring 1 trip to the map')).toBeTruthy();
  });

  it('chooses all or none, the map, and what to bring', () => {
    const p = props();
    render(<ImportChooseCard {...p} />);
    fireEvent.click(screen.getByText('All of them'));
    expect(p.onAll).toHaveBeenCalledWith(true);
    fireEvent.click(screen.getByText('None'));
    expect(p.onAll).toHaveBeenCalledWith(false);
    fireEvent.change(screen.getByLabelText('Bring them to'), { target: { value: 'm2' } });
    expect(p.onMap).toHaveBeenCalledWith('m2');
    fireEvent.click(screen.getByLabelText('Their photos (120 photos)'));
    expect(p.onPhotos).toHaveBeenCalledWith(false);
    fireEvent.click(screen.getByText('Bring 1 trip to the map'));
    expect(p.onStart).toHaveBeenCalled();
  });

  it('can’t start with no trip or no map, and not while unverified', () => {
    const none = render(<ImportChooseCard {...props({ chosen: new Set() })} />);
    expect(screen.getByText('Bring 0 trips to the map').closest('button').disabled).toBe(true);
    none.unmount();
    const noMap = render(<ImportChooseCard {...props({ mapId: '' })} />);
    expect(screen.getByText('Bring 1 trip to the map').closest('button').disabled).toBe(true);
    noMap.unmount();
    const { container } = render(<ImportChooseCard {...props({ locked: true, withPhotos: false })} />);
    expect(screen.queryByText(/^Bring \d/)).toBeNull();
    expect(container.textContent).toContain('Verify your email address to import.');
    expect(container.textContent).not.toContain('This map keeps');
  });
});

describe('ImportProgressCard', () => {
  const progress = (over = {}) => ({
    stage: 'photos',
    trips: 2,
    tripsNew: 1,
    tripsTotal: 2,
    photos: 40,
    photosTotal: 100,
    already: 5,
    full: 3,
    failed: 2,
    stories: 0,
    storiesTotal: 3,
    failures: ['IMG_1.jpg: too big'],
    ...over,
  });
  const inRouter = (element) => render(<MemoryRouter>{element}</MemoryRouter>);

  it('shows the stage, the share of photos brought and every count, with Stop', () => {
    const onStop = vi.fn();
    const { container } = inRouter(<ImportProgressCard progress={progress()} mapId='m1' onStop={onStop} />);
    expect(container.querySelector('[data-import-stage]').getAttribute('data-import-stage')).toBe('photos');
    expect(container.querySelector('[role="status"]').textContent).toBe('Bringing the photos…');
    expect(container.textContent).toContain('Bringing your travels');
    expect(container.querySelector('progress').value).toBe(50);
    expect(container.textContent).toContain('Trips: 2 trips of 2 (1 was there already)');
    expect(container.querySelector('[data-import-photos]').getAttribute('data-import-photos')).toBe('40');
    expect(container.textContent).toContain('Photos: 40 photos of 100, 5 there already, 3 left out');
    expect(container.textContent).toContain('Stories: 0 of 3');
    expect(container.textContent).toContain('2 things couldn’t be brought.');
    expect(container.textContent).toContain('IMG_1.jpg: too big');
    fireEvent.click(screen.getByText('Stop'));
    expect(onStop).toHaveBeenCalled();
    expect(screen.queryByText('Open the map')).toBeNull();
  });

  it('says it is waiting out the upload limit', () => {
    const { container } = inRouter(<ImportProgressCard progress={progress({ waitingUntil: Date.now() + 1000 })} mapId='m1' onStop={() => {}} />);
    expect(container.textContent).toContain('Waiting a little');
  });

  it('done: opens the map', () => {
    const { container } = inRouter(<ImportProgressCard progress={progress({ stage: 'done', failures: [], failed: 0 })} mapId='m1' onStop={() => {}} />);
    expect(container.querySelector('[role="status"]').textContent).toBe('Done.');
    expect(container.textContent).toContain('Your import');
    expect(screen.getByText('Open the map').getAttribute('href')).toBe('/maps/m1');
    expect(screen.queryByText('Stop')).toBeNull();
  });

  it('stopped early or failed: says so, with the error, and no Stop', () => {
    const stopped = inRouter(<ImportProgressCard progress={progress()} mapId='m1' stoppedEarly onStop={() => {}} />);
    expect(stopped.container.querySelector('[role="status"]').textContent).toBe('Stopped. Run it again to carry on where it stopped.');
    stopped.unmount();
    const { container } = inRouter(<ImportProgressCard progress={progress()} mapId='m1' error='The server said no.' onStop={() => {}} />);
    expect(container.querySelector('[role="status"]').textContent).toBe('The import stopped.');
    expect(container.querySelector('[role="alert"]').textContent).toBe('The server said no.');
    expect(screen.queryByText('Stop')).toBeNull();
  });

  it('before any progress it is starting', () => {
    const { container } = inRouter(<ImportProgressCard progress={null} mapId={null} onStop={() => {}} />);
    expect(container.querySelector('[role="status"]').textContent).toBe('Starting…');
    // No stage yet: no stage marked for the tests to wait on
    expect(container.querySelector('[data-import-stage]')).toBeNull();
    expect(screen.queryByText('Open the map')).toBeNull();
  });
});

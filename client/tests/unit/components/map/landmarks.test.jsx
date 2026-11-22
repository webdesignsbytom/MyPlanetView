import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import LandmarkCard from '@/components/map/LandmarkCard';
import CountryLandmarks from '@/components/map/CountryLandmarks';
import useLandmarks from '@/hooks/useLandmarks';
import { LandmarkMarksContext } from '@/hooks/useLandmarkMarks';

vi.mock('@/hooks/useLandmarks', () => ({ default: vi.fn() }));
vi.mock('@/hooks/useLandmarkPhotos', () => ({
  default: () => ({
    LICENCES: [['CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0/']],
    LANDMARK_PHOTOS: { 'eiffel-tower': [480, 320, 'A. Photographer', 0, 'Eiffel.jpg'] },
  }),
}));

const PHOTO = {
  avif: '/p.avif',
  webp: '/p.webp',
  width: 480,
  height: 320,
  author: 'A. Photographer',
  licence: 'CC BY 4.0',
  licenceUrl: 'https://creativecommons.org/licenses/by/4.0/',
  source: 'https://commons.wikimedia.org/wiki/File:X.jpg',
};
const card = (props) =>
  render(
    <ul>
      <LandmarkCard landmark={{ id: 'l1', name: 'Louvre', isUnesco: false }} {...props} />
    </ul>,
  );

describe('LandmarkCard', () => {
  it('frames the photo and credits it as its licence asks', () => {
    const { container } = card({ photo: PHOTO });
    const img = container.querySelector('img');
    expect(img.getAttribute('src')).toBe('/p.webp');
    expect(img.getAttribute('alt')).toBe('');
    expect(container.querySelector('source').getAttribute('srcset')).toBe('/p.avif');
    const [author, licence] = container.querySelectorAll('a');
    expect(author.textContent).toBe('A. Photographer');
    expect(author.getAttribute('href')).toBe(PHOTO.source);
    expect(author.getAttribute('rel')).toBe('noopener noreferrer');
    expect(licence.textContent).toBe('CC BY 4.0');
  });

  it('shows the licence unlinked when it has no address, and the landmark icon without a photo', () => {
    const { container } = card({ photo: { ...PHOTO, licenceUrl: '' } });
    expect(container.querySelectorAll('a').length).toBe(1);
    expect(container.textContent).toContain('CC BY 4.0');
    const { container: bare } = card({ photo: null });
    expect(bare.querySelector('img')).toBeNull();
    expect(bare.querySelector('svg')).not.toBeNull();
  });

  it('marks a World Heritage Site for screen readers too', () => {
    const { container } = card({ landmark: { id: 'l2', name: 'Petra', isUnesco: true } });
    expect(container.textContent).toContain('Petra (UNESCO World Heritage Site)');
  });

  it('says a stamped landmark is in the passport, with no tick', () => {
    const { container } = card({ mark: 'stamped', onToggle: vi.fn() });
    expect(container.querySelector('[data-landmark-mark="stamped"]').textContent).toBe('Stamped in the passport');
    expect(container.querySelector('input')).toBeNull();
  });

  it('gives an editor the "Been here" tick', () => {
    const onToggle = vi.fn();
    card({ mark: 'ticked', onToggle });
    const box = screen.getByLabelText('Been to Louvre');
    expect(box.checked).toBe(true);
    fireEvent.click(box);
    expect(onToggle).toHaveBeenCalledWith('l1', false);
  });

  it('shows a viewer a ticked landmark in words', () => {
    const { container } = card({ mark: 'ticked' });
    expect(container.querySelector('[data-landmark-mark="ticked"]').textContent).toBe('Been here');
  });

  it('lists two of its moments, then how many more', () => {
    const moments = [
      { id: 'm1', title: 'Engaged', happenedOn: '2020-06-01', datePrecision: 'DAY' },
      { id: 'm2', title: 'Picnic', happenedOn: null, datePrecision: null },
      { id: 'm3', title: 'Third' },
      { id: 'm4', title: 'Fourth' },
    ];
    const { container } = card({ moments });
    const list = container.querySelector('ul[aria-label="Moments at Louvre"]');
    const items = [...list.querySelectorAll('li')].map((li) => li.textContent);
    expect(items.length).toBe(3);
    expect(items[0]).toMatch(/^Engaged, .+2020/);
    expect(items[1]).toBe('Picnic');
    expect(items[2]).toBe('and 2 more');
  });
});

const LANDMARKS = Array.from({ length: 8 }, (_, i) => ({
  id: `l${i}`,
  name: `Landmark ${i}`,
  slug: i === 0 ? 'eiffel-tower' : `landmark-${i}`,
  isUnesco: i === 3,
}));
const marks = (value) => ({ stamped: new Set(), ticked: new Set(), onToggle: null, ...value });
const landmarks = (props = {}, value = marks()) =>
  render(
    <LandmarkMarksContext.Provider value={value}>
      <CountryLandmarks countryCode='FR' {...props} />
    </LandmarkMarksContext.Provider>,
  );

describe('CountryLandmarks', () => {
  beforeEach(() => useLandmarks.mockReturnValue({ landmarks: LANDMARKS, loading: false, error: null }));

  it('says while it loads, or why it failed, and shows nothing for a country with none', () => {
    useLandmarks.mockReturnValueOnce({ landmarks: [], loading: true, error: null });
    expect(landmarks().container.textContent).toBe('Loading landmarks…');
    useLandmarks.mockReturnValueOnce({ landmarks: [], loading: false, error: 'Offline.' });
    expect(landmarks().container.textContent).toBe('Offline.');
    useLandmarks.mockReturnValueOnce({ landmarks: [], loading: false, error: null });
    expect(landmarks().container.textContent).toBe('');
  });

  it('shows six, then the rest on asking', () => {
    const { container } = landmarks();
    expect(container.querySelector('h3').textContent).toBe('Landmarks (8)');
    expect(container.querySelectorAll('#landmarks-list-FR > li').length).toBe(6);
    const more = screen.getByText('Show all 8 landmarks');
    expect(more.getAttribute('aria-expanded')).toBe('false');
    expect(more.getAttribute('aria-controls')).toBe('landmarks-list-FR');
    fireEvent.click(more);
    expect(container.querySelectorAll('#landmarks-list-FR > li').length).toBe(8);
    expect(screen.getByText('Show fewer').getAttribute('aria-expanded')).toBe('true');
    // A World Heritage Site among them: the key's line
    expect(screen.getByText('UNESCO World Heritage Site')).toBeTruthy();
  });

  it('gives each card its photo from the credits', () => {
    const { container } = landmarks();
    expect(container.querySelectorAll('img').length).toBe(1);
  });

  it('counts the landmarks been to, stamped or ticked', () => {
    const { container } = landmarks({}, marks({ stamped: new Set(['l1']), ticked: new Set(['l2', 'l5']) }));
    const progress = container.querySelector('[data-landmark-progress]');
    expect(progress.getAttribute('data-landmark-progress')).toBe('3');
    expect(progress.textContent).toBe('Been to 3 of 8.');
    expect(container.querySelector('[data-landmark-mark="stamped"]')).not.toBeNull();
  });

  it('puts the landmarks where something happened first', () => {
    const moments = [{ id: 'm1', title: 'Wedding', landmark: { id: 'l7' } }, { id: 'm2', title: 'No place' }];
    const { container } = landmarks({ moments });
    const first = container.querySelector('#landmarks-list-FR > li');
    expect(first.textContent).toContain('Landmark 7');
    expect(first.textContent).toContain('Wedding');
  });

  it('lets an editor tick, and says when a tick can’t be saved', async () => {
    const onToggle = vi.fn().mockRejectedValueOnce(Object.assign(new Error('x'), { friendlyMessage: 'No connection.' })).mockResolvedValue();
    const { container } = landmarks({}, marks({ onToggle }));
    expect(container.querySelector('[data-landmark-progress]').textContent).toBe('Been to 0 of 8: tick the ones you’ve seen, photo or not.');
    fireEvent.click(screen.getByLabelText('Been to Landmark 1'));
    expect(onToggle).toHaveBeenCalledWith('l1', true);
    expect((await screen.findByRole('alert')).textContent).toBe('No connection.');
    fireEvent.click(screen.getByLabelText('Been to Landmark 2'));
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
  });
});

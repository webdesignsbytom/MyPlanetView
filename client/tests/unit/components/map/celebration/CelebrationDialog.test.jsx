import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import CelebrationDialog from '@/components/map/celebration/CelebrationDialog';
import { LandmarkMarksContext } from '@/hooks/useLandmarkMarks';
import { SplitUkProvider } from '@/hooks/useSplitUk';
import { withProviders } from '../helpers';

// The landmarks the session has (useLandmarks: every one, or a place's)
const LANDMARKS = [
  { id: 'lm-eiffel', name: 'Eiffel Tower', slug: 'eiffel-tower', countryCode: 'FR', isUnesco: false, wikidataId: 'Q243' },
  { id: 'lm-louvre', name: 'Louvre', slug: 'louvre', countryCode: 'FR', isUnesco: false, wikidataId: 'Q19675' },
  { id: 'lm-chartres', name: 'Chartres Cathedral', slug: 'chartres-cathedral', countryCode: 'FR', isUnesco: true, wikidataId: 'Q1' },
  { id: 'lm-big-ben', name: 'Big Ben', slug: 'big-ben', countryCode: 'GB', nation: 'XE', isUnesco: true, wikidataId: 'Q41225' },
];
vi.mock('@/hooks/useLandmarks', () => ({
  default: vi.fn((code, { enabled = true } = {}) => ({
    landmarks: !enabled ? [] : code ? LANDMARKS.filter((l) => l.countryCode === code || l.nation === code) : LANDMARKS,
    loading: false,
    error: null,
  })),
}));
// Life's One Shots' photo credits (generated): none, so an item shows its binoculars
vi.mock('@/hooks/useOneShotPhotos', () => ({ default: () => null }));
// The landmark photos' credits (generated): Chartres has one
vi.mock('@/hooks/useLandmarkPhotos', () => ({
  default: () => ({
    LICENCES: [['CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0']],
    LANDMARK_PHOTOS: { 'chartres-cathedral': [480, 360, 'A. Photographer', 0, 'Chartres 1.jpg'] },
  }),
}));

const open = (celebration, { ticked = [], stamped = [], splitUk = false } = {}) => {
  const onClose = vi.fn();
  const marks = { stamped: new Set(stamped), ticked: new Set(ticked), onToggle: null, onPhotoStamped: null };
  const result = render(
    withProviders(
      <SplitUkProvider value={splitUk}>
        <LandmarkMarksContext.Provider value={marks}>
          <CelebrationDialog celebration={celebration} passportHref='/maps/map-1/passport' onClose={onClose} />
        </LandmarkMarksContext.Provider>
      </SplitUkProvider>,
    ),
  );
  const dialog = screen.getByRole('dialog');
  return { ...result, dialog, onClose };
};

const tick = (landmarkId, extra = {}) => ({ kind: 'landmark', landmarkId, stampedOn: '2026-11-24', photoUrl: null, newPlace: null, ...extra });

describe('CelebrationDialog', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('a landmark', () => {
    it('is named by the landmark, says it’s stamped and how the country stands', () => {
      const { dialog } = open(tick('lm-eiffel', { newPlace: 'FR' }), { ticked: ['lm-louvre'] });
      expect(dialog.getAttribute('aria-modal')).toBe('true');
      expect(dialog.getAttribute('data-celebration')).toBe('landmark');
      expect(screen.getByRole('heading', { level: 2, name: 'Eiffel Tower' })).toBeTruthy();
      expect(dialog.textContent).toContain('Been here!');
      const text = document.getElementById(dialog.getAttribute('aria-describedby'));
      expect(text.textContent).toBe('Stamped in your passport. France is on your map now, with its own page.');
      // Itself and the Louvre, ticked before
      expect(dialog.querySelector('[data-celebration-progress]').textContent).toBe('Been to 2 of 3 landmarks in France.');
    });

    it('shows its model, and the passport’s own stamp for a tick: “Been here” in its frame, dated today', () => {
      const { dialog } = open(tick('lm-eiffel'));
      expect(dialog.querySelector('[data-celebration-model]').getAttribute('data-celebration-model')).toBe('eiffel-tower');
      const stamp = dialog.querySelector('[data-celebration-stamp]');
      expect(stamp.querySelector('[data-stamp-been-here]')).not.toBeNull();
      expect(stamp.textContent).toContain('EIFFEL TOWER');
      expect(stamp.textContent).toContain('24 NOV 2026');
      // Decorative: the words say it all
      expect(stamp.getAttribute('aria-hidden')).toBe('true');
      expect(dialog.querySelector('[data-celebration-stars]').getAttribute('aria-hidden')).toBe('true');
    });

    it('shows the model whose card the tick was on (a country’s own map), not the landmark’s own', () => {
      const { dialog } = open(tick('lm-eiffel', { modelId: 'arc-de-triomphe' }));
      expect(dialog.querySelector('[data-celebration-model]').getAttribute('data-celebration-model')).toBe('arc-de-triomphe');
      // Still the landmark's celebration: its name and stamp
      expect(screen.getByRole('heading', { level: 2, name: 'Eiffel Tower' })).toBeTruthy();
    });

    it('shows the landmark’s own model when the card’s model isn’t known', () => {
      const { dialog } = open(tick('lm-eiffel', { modelId: 'no-such-model' }));
      expect(dialog.querySelector('[data-celebration-model]').getAttribute('data-celebration-model')).toBe('eiffel-tower');
    });

    it('shows the map’s own photo where there’s no model, in the stamp too', () => {
      const { dialog } = open(tick('lm-louvre', { photoUrl: 'https://photos.example/p1.webp', stampedOn: '2019-05-02' }));
      expect(dialog.querySelector('[data-celebration-model]')).toBeNull();
      expect(dialog.querySelector('figure img').getAttribute('src')).toBe('https://photos.example/p1.webp');
      const stamp = dialog.querySelector('[data-celebration-stamp]');
      expect(stamp.querySelector('image').getAttribute('href')).toBe('https://photos.example/p1.webp');
      expect(stamp.querySelector('[data-stamp-been-here]')).toBeNull();
      expect(stamp.textContent).toContain('2 MAY 2019');
    });

    it('else the landmark’s photo from Wikimedia Commons, with the credit its licence asks for', () => {
      const { dialog } = open(tick('lm-chartres'));
      const links = [...dialog.querySelectorAll('figcaption a')];
      expect(links.map((a) => a.textContent)).toEqual(['A. Photographer', 'CC BY-SA 4.0']);
      expect(links[0].getAttribute('href')).toBe('https://commons.wikimedia.org/wiki/File:Chartres_1.jpg');
    });

    it('counts a UK landmark in its nation on a map that splits the UK', () => {
      const { dialog } = open(tick('lm-big-ben'), { splitUk: true });
      expect(dialog.querySelector('[data-celebration-progress]').textContent).toBe('Been to 1 of 1 landmarks in England.');
    });
  });

  describe('a country', () => {
    const visit = (extra = {}) => ({ kind: 'country', code: 'FR', status: 'VISITED', firstVisitedOn: null, ...extra });

    // 24 Nov 2026, the user's wishes: "You visited France!", and the words name it
    it('says you visited it, with its page, entry stamp and landmarks to collect', () => {
      const { dialog } = open(visit());
      expect(dialog.getAttribute('data-celebration')).toBe('country');
      expect(screen.getByRole('heading', { level: 2, name: 'You visited France!' })).toBeTruthy();
      expect(dialog.textContent).not.toContain('Visited!');
      const text = document.getElementById(dialog.getAttribute('aria-describedby'));
      expect(text.textContent).toBe(
        'France now has its own page in your passport, with its entry stamp. Add the day you first went on its ticket, and the stamp is dated.',
      );
      const stamp = dialog.querySelector('[data-celebration-stamp]');
      expect(stamp.textContent).toContain('ADMITTED');
      expect(stamp.textContent).toContain('DATE NOT KNOWN');
      expect(dialog.querySelector('[data-celebration-progress]').textContent).toBe(
        '3 landmarks to collect there: tick the ones you’ve seen on its ticket.',
      );
    });

    it('draws its outline, in its own colour, above its models, the tallest first', () => {
      const { dialog } = open(visit());
      const outline = dialog.querySelector('[data-celebration-outline="FR"]');
      expect(outline.tagName.toLowerCase()).toBe('svg');
      // As the map draws it: its pastel (France's is the first), and its code for a map design's colour
      expect(outline.querySelector('g[data-code="FR"]').getAttribute('class')).toContain('fill-map-visit-1');
      expect(outline.querySelectorAll('path').length).toBeGreaterThan(0);
      expect(dialog.querySelector('[data-celebration-poster]')).toBeNull();
      // The outline comes first, the models under it
      const models = [...dialog.querySelectorAll('[data-celebration-model]')];
      expect(models.map((img) => img.getAttribute('data-celebration-model'))).toHaveLength(3);
      expect(models[0].getAttribute('data-celebration-model')).toBe('eiffel-tower');
      expect(outline.compareDocumentPosition(models[0]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it('says you lived in it, with a residence stamp dated with the first visit', () => {
      const { dialog } = open(visit({ status: 'LIVED', firstVisitedOn: '2016-08-01' }), { ticked: ['lm-louvre'] });
      expect(screen.getByRole('heading', { level: 2, name: 'You lived in France!' })).toBeTruthy();
      const text = document.getElementById(dialog.getAttribute('aria-describedby'));
      expect(text.textContent).toBe('France now has its own page in your passport, with its residence stamp.');
      const stamp = dialog.querySelector('[data-celebration-stamp]');
      expect(stamp.textContent).toContain('RESIDENT');
      expect(stamp.textContent).toContain('1 AUG 2016');
      expect(dialog.querySelector('[data-celebration-progress]').textContent).toBe('Been to 1 of its 3 landmarks: tick the others you’ve seen on its ticket.');
    });

    it('gives a place with no outline or models its placeholder card', () => {
      const { dialog } = open(visit({ code: 'XN' }));
      expect(screen.getByRole('heading', { level: 2, name: 'You visited the North Pole!' })).toBeTruthy();
      expect(dialog.querySelector('[data-celebration-outline]')).toBeNull();
      expect(dialog.querySelector('[data-celebration-poster]')).not.toBeNull();
      expect(dialog.querySelector('[data-celebration-model]')).toBeNull();
      expect(dialog.querySelector('[data-celebration-progress]')).toBeNull();
    });
  });

  // Life's One Shots (24 Nov 2026): no passport stamp yet (the user: nothing in the passport)
  describe('a One Shot', () => {
    const shot = (extra = {}) => ({ kind: 'oneShot', itemKey: 'northern-lights', seenOn: '2023-02-14', datePrecision: 'DAY', countryCode: 'NO', photoUrl: null, ...extra });

    it('is named by the item, says it’s ticked and how far along its list is', () => {
      const { dialog } = open(shot());
      expect(dialog.getAttribute('data-celebration')).toBe('oneShot');
      expect(screen.getByRole('heading', { level: 2, name: 'Northern lights' })).toBeTruthy();
      expect(dialog.textContent).toContain('Seen it!');
      const text = document.getElementById(dialog.getAttribute('aria-describedby'));
      expect(text.textContent).toBe('Ticked in Life’s One Shots.');
      expect(dialog.querySelector('[data-celebration-progress]').textContent).toBe('1 of 32 wonders ticked.');
      // Nothing of the passport's
      expect(dialog.querySelector('[data-celebration-stamp]')).toBeNull();
      expect(dialog.textContent).not.toMatch(/passport/i);
    });

    it('says “Done it!” for a journey, and shows the map’s own photo when the tick has one', () => {
      const { dialog } = open(shot({ itemKey: 'trans-siberian', photoUrl: 'https://photos.example/p1.webp' }));
      expect(dialog.textContent).toContain('Done it!');
      expect(dialog.querySelector('img').getAttribute('src')).toBe('https://photos.example/p1.webp');
    });
  });

  describe('its controls', () => {
    it('opens on its close stamp, and goes to the passport or carries on', () => {
      const { dialog, onClose } = open(tick('lm-eiffel'));
      expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Close' }));
      expect(screen.getByRole('link', { name: 'Open passport' }).getAttribute('href')).toBe('/maps/map-1/passport');
      fireEvent.click(screen.getByRole('button', { name: 'Carry on' }));
      expect(onClose).toHaveBeenCalledTimes(1);
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(onClose).toHaveBeenCalledTimes(2);
      // A press on the dimmed page round it
      fireEvent.mouseDown(dialog.parentElement);
      expect(onClose).toHaveBeenCalledTimes(3);
      fireEvent.mouseDown(dialog);
      expect(onClose).toHaveBeenCalledTimes(3);
    });

    // 24 Nov 2026, the user's report: the stamp, waiting at 2.4× its size to come down, gave the
    // ticket a sideways scrollbar as it opened
    it('scrolls its words up and down only, so the stamp coming down gives it no sideways scrollbar', () => {
      const { dialog } = open(tick('lm-eiffel'));
      const body = dialog.querySelector('[data-celebration-body]');
      const classes = body.getAttribute('class').split(/\s+/);
      expect(classes).toContain('overflow-y-auto');
      expect(classes).toContain('overflow-x-hidden');
      expect(body.contains(dialog.querySelector('[data-celebration-stamp]'))).toBe(true);
    });

    // 24 Nov 2026, the user's report: tilted, the stamp's top corner rose past the words' edge
    it('gives the stamp room above it for its tilt', () => {
      const { dialog } = open(tick('lm-eiffel'));
      expect(dialog.querySelector('[data-celebration-stamp]').getAttribute('class').split(/\s+/)).toContain('pt-3');
    });

    // 24 Nov 2026, the user's wish: no box to turn them off (Settings, Help, has the switch)
    it('has no box to turn it off, a country’s or a landmark’s', () => {
      const { dialog, unmount } = open(tick('lm-eiffel'));
      expect(dialog.querySelector('input[type="checkbox"]')).toBeNull();
      expect(dialog.textContent).not.toContain('Don’t show these again');
      unmount();
      const country = open({ kind: 'country', code: 'FR', status: 'VISITED', firstVisitedOn: '2026-11-24' });
      expect(country.dialog.querySelector('input[type="checkbox"]')).toBeNull();
      expect(screen.getByRole('link', { name: 'Open passport' })).toBeTruthy();
    });
  });
});

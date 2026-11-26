import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import LandmarkModelCard from '@/components/countryMap/LandmarkModelCard';
import { LandmarkMarksContext } from '@/hooks/useLandmarkMarks';

// A little 3D landmark model's card on a country's own map (24 Nov 2026, the user's wishes: press
// a model to read about it, in a big panel in the middle of the screen, the model alone on the
// left, and on the right the place: Wikipedia's words, its facts, a "Been here" tick that
// celebrates, and the credits).

const LANDMARKS = [
  { id: 'lm-westminster', name: 'Westminster Palace and Abbey', slug: 'westminster-palace-and-abbey', countryCode: 'GB', isUnesco: true, wikidataId: 'Q10344038' },
  { id: 'lm-eiffel', name: 'Eiffel Tower', slug: 'eiffel-tower', countryCode: 'FR', isUnesco: false, wikidataId: 'Q243' },
];
vi.mock('@/hooks/useLandmarks', () => ({ default: () => ({ landmarks: LANDMARKS, loading: false, error: null }) }));
vi.mock('@/hooks/useModelFacts', () => ({
  default: () => ({
    TEXT_LICENCE: ['CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0/'],
    MODEL_FACTS: {
      'big-ben': {
        article: 'Big Ben',
        text: 'Big Ben is the nickname for the Great Bell of the Great Clock of Westminster.',
        built: '1859',
        height: 96,
        architects: ['Augustus Pugin', 'Charles Barry'],
      },
    },
  }),
}));

const BIG_BEN = { id: 'big-ben', name: 'Big Ben', landmark: 'Q10344038', aspect: 0.6, images: { 160: '/bb-160.webp', 320: '/bb-320.webp' } };
const EIFFEL = { id: 'eiffel-tower', name: 'Eiffel Tower', landmark: 'Q243', aspect: 0.5, images: { 160: '/e-160.webp', 320: '/e-320.webp' } };
// A model of one thing of a landmark that isn't a World Heritage Site
const LIFT = { id: 'eiffel-lift', name: 'The Eiffel Tower’s lift', landmark: 'Q243', aspect: 0.5, images: { 160: '/l-160.webp', 320: '/l-320.webp' } };

const open = ({ model = BIG_BEN, stateName = 'Westminster', countryName = 'United Kingdom', ticked = [], stamped = [], onToggle = vi.fn().mockResolvedValue({}) } = {}) => {
  const onClose = vi.fn();
  const marks = { stamped: new Set(stamped), ticked: new Set(ticked), onToggle, onPhotoStamped: null };
  render(
    <LandmarkMarksContext.Provider value={marks}>
      <LandmarkModelCard model={model} stateName={stateName} countryName={countryName} onClose={onClose} />
    </LandmarkMarksContext.Provider>,
  );
  const shade = document.querySelector('[data-landmark-card]');
  const panel = screen.getByRole('dialog');
  const about = document.querySelector('[data-landmark-about]');
  return { shade, panel, about, onClose, onToggle };
};

// The facts list as [label, words] pairs
const factRows = (about) => [...about.querySelectorAll('dt')].map((dt) => [dt.textContent, dt.nextElementSibling.textContent]);

describe('LandmarkModelCard', () => {
  beforeEach(() => vi.clearAllMocks());

  it('is a panel over the dimmed map, named by the model in its title strip, which has focus', () => {
    const { shade, panel } = open();
    expect(shade.getAttribute('data-landmark-card')).toBe('big-ben');
    expect(shade.getAttribute('class')).toContain('bg-scrim');
    const title = screen.getByRole('heading', { level: 2, name: 'Big Ben' });
    expect(panel.getAttribute('aria-labelledby')).toBe(title.id);
    expect(document.activeElement).toBe(title);
    // Big on wide screens: two columns side by side from lg
    expect(panel.getAttribute('class')).toContain('nophone:w-[60rem]');
    expect(panel.querySelector('.lg\\:grid-cols-2')).toBeTruthy();
  });

  it('has the model alone on the left, in the middle of its column, and no other picture', () => {
    const { panel } = open();
    const side = panel.querySelector('[data-landmark-model-picture]');
    expect(side.getAttribute('class')).toContain('place-items-center');
    expect([...side.children].map((child) => child.getAttribute('src'))).toEqual(['/bb-320.webp']);
    expect(side.querySelector('img').getAttribute('alt')).toBe('');
    expect(panel.querySelectorAll('img')).toHaveLength(1);
    expect(panel.querySelector('figure')).toBeNull();
  });

  it('says about the place on the right: Wikipedia’s words, its facts, the tick and the credits', () => {
    const { about } = open();
    expect(screen.getByRole('heading', { level: 3, name: 'About Big Ben' })).toBeTruthy();
    expect(about.textContent).toContain('Big Ben is the nickname for the Great Bell');
    // Its landmark is a World Heritage Site, named in that row (no "Part of" as well)
    expect(factRows(about)).toEqual([
      ['Where', 'Westminster, United Kingdom'],
      ['Dates from', '1859'],
      ['Height', '96 m (315 ft)'],
      ['Architects', 'Augustus Pugin, Charles Barry'],
      ['World Heritage', 'Westminster Palace and Abbey'],
    ]);
    // The tick is in this column, after the facts
    const tick = about.querySelector('[data-landmark-been]');
    expect(tick.contains(screen.getByLabelText('Been to Big Ben'))).toBe(true);
    expect(about.querySelector('dl').compareDocumentPosition(tick) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const article = screen.getAllByRole('link').filter((link) => link.getAttribute('href') === 'https://en.wikipedia.org/wiki/Big_Ben');
    expect(article.map((link) => link.textContent)).toEqual(['Big Ben', 'Read more on Wikipedia (opens in a new tab)']);
    expect(article.every((link) => link.getAttribute('target') === '_blank' && link.getAttribute('rel') === 'noopener noreferrer')).toBe(true);
    expect(screen.getAllByText('CC BY-SA 4.0').some((link) => link.getAttribute('href') === 'https://creativecommons.org/licenses/by-sa/4.0/')).toBe(true);
  });

  it('names the landmark it’s part of when that isn’t a World Heritage Site', () => {
    const { about } = open({ model: LIFT, stateName: 'Paris', countryName: 'France' });
    expect(factRows(about)).toEqual([
      ['Where', 'Paris, France'],
      ['Part of', 'Eiffel Tower'],
    ]);
  });

  it('with no words about it yet, gives where it is and a link to its landmark on Wikipedia', () => {
    const { about } = open({ model: EIFFEL, stateName: null, countryName: 'France' });
    expect(factRows(about)).toEqual([['Where', 'France']]);
    expect(about.textContent).not.toContain('Text from Wikipedia');
    expect(screen.getByText('Read more on Wikipedia').closest('a').getAttribute('href')).toBe(
      'https://www.wikidata.org/wiki/Special:GoToLinkedPage/enwiki/Q243',
    );
  });

  it('lets an editor tick “Been here”, which ticks the landmark with this model for the celebration', () => {
    const { onToggle } = open();
    const box = screen.getByLabelText('Been to Big Ben');
    expect(box.checked).toBe(false);
    fireEvent.click(box);
    expect(onToggle).toHaveBeenCalledWith('lm-westminster', true, { modelId: 'big-ben' });
  });

  it('shows a tick as been, and lets it be taken off', () => {
    const { panel, onToggle } = open({ ticked: ['lm-westminster'] });
    const box = screen.getByLabelText('Been to Big Ben');
    expect(box.checked).toBe(true);
    expect(panel.querySelector('[data-landmark-been]').getAttribute('data-landmark-been')).toBe('yes');
    expect(screen.getByText('Stamped in the passport')).toBeTruthy();
    fireEvent.click(box);
    expect(onToggle).toHaveBeenCalledWith('lm-westminster', false, { modelId: 'big-ben' });
  });

  it('shows a photo’s stamp ticked, not to be taken off', () => {
    open({ stamped: ['lm-westminster'] });
    const box = screen.getByLabelText('Been to Big Ben');
    expect(box.checked).toBe(true);
    expect(box.disabled).toBe(true);
    expect(screen.getByText('Stamped in the passport by a photo')).toBeTruthy();
  });

  it('says why a tick wasn’t saved', async () => {
    open({ onToggle: vi.fn().mockRejectedValue(Object.assign(new Error('x'), { friendlyMessage: 'Not now.' })) });
    fireEvent.click(screen.getByLabelText('Been to Big Ben'));
    expect((await screen.findByText('Not now.')).getAttribute('role')).toBe('alert');
  });

  it('gives a viewer no tick, only whether the map has been', () => {
    const { panel, about } = open({ onToggle: null, ticked: ['lm-westminster'] });
    expect(panel.querySelector('input[type="checkbox"]')).toBeNull();
    expect(about.textContent).toContain('Been here: stamped in the passport');
  });

  it('closes with its close stamp, Escape, or a press on the dimmed map round it, not inside it', () => {
    const { shade, panel, onClose } = open();
    fireEvent.mouseDown(panel);
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.mouseDown(shade);
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByLabelText('Close Big Ben'));
    expect(onClose).toHaveBeenCalledTimes(2);
    fireEvent.keyDown(panel, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(3);
  });
});

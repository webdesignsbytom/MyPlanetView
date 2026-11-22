import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import PassportVisaPage from '@/components/passport/PassportVisaPage';

const stamp = (id, name, over = {}) => ({
  landmarkId: id,
  name,
  stampedOn: '2019-06-02',
  isUnesco: false,
  photoCount: 2,
  photoChosen: false,
  photo: { id: `photo-${id}`, thumbUrl: null },
  moments: [],
  ...over,
});

const landmarks = (n) => Array.from({ length: n }, (_, i) => ({ id: `todo-${i}`, name: `Landmark ${i + 1}`, isUnesco: i === 0 }));

const pageOf = (over = {}) => ({
  countryCode: 'IT',
  status: 'VISITED',
  enteredOn: '2019-06-01',
  stamps: [stamp('lm-col', 'Colosseum'), stamp('lm-pan', 'Pantheon')],
  toStamp: landmarks(3),
  ...over,
});

const show = (page = pageOf(), props = {}) => {
  const onOpenPhoto = vi.fn();
  const onPickPhoto = vi.fn();
  const view = render(
    <PassportVisaPage page={page} pageNumber={3} headingId='visa-it' canPick={false} locked={false} onOpenPhoto={onOpenPhoto} onPickPhoto={onPickPhoto} {...props} />,
  );
  return { ...view, onOpenPhoto, onPickPhoto };
};

describe('PassportVisaPage', () => {
  it('heads the page with the country’s name and its own name for itself', () => {
    const { container } = show();
    const heading = screen.getByText('Italy');
    expect(heading.tagName).toBe('H2');
    expect(heading.id).toBe('visa-it');
    expect(container.querySelector('section').getAttribute('aria-labelledby')).toBe('visa-it');
    const local = container.querySelector('bdi');
    expect(local.textContent).toBe('Italia');
    expect(local.getAttribute('lang')).toBe('it');
  });

  it('leaves the local name out when it is the English one', () => {
    const { container } = show(pageOf({ countryCode: 'FR' }));
    expect(screen.getByText('France').tagName).toBe('H2');
    expect(container.querySelector('bdi')).toBeNull();
  });

  it.each([
    ['VISITED', '2019-06-01', 'Visited, first on 1 Jun 2019'],
    ['VISITED', null, 'Visited'],
    ['LIVED', '2019-06-01', 'Lived there, from 1 Jun 2019'],
    ['LIVED', null, 'Lived there'],
    [null, '2019-06-01', 'Stamped from photos, the first on 1 Jun 2019'],
    [null, null, 'Stamped from photos'],
  ])('says how the map stands with it (%s, %s)', (status, enteredOn, line) => {
    show(pageOf({ status, enteredOn }));
    expect(screen.getByText(line)).toBeTruthy();
  });

  it('shows the entry stamp', () => {
    const { container } = show();
    const texts = [...container.querySelectorAll('svg text')].map((t) => t.textContent);
    expect(texts).toContain('ITALY');
  });

  it('lists a stamp for each landmark photographed, with their count', () => {
    const { container, onOpenPhoto } = show();
    const stamps = screen.getByText('Landmark stamps').closest('section');
    expect(stamps.querySelector('h3').textContent).toBe('Landmark stamps (2)');
    expect(within(stamps).getAllByText(/^Open the photo of/).map((el) => el.textContent)).toEqual([
      'Open the photo of Colosseum',
      'Open the photo of Pantheon',
    ]);
    fireEvent.click(within(stamps).getByText('Open the photo of Pantheon').closest('button'));
    expect(onOpenPhoto).toHaveBeenCalledWith('photo-lm-pan');
    // No editing for viewers
    expect(container.querySelector('[aria-label^="Choose the photo"]')).toBeNull();
  });

  it('lets editors choose a stamp’s photo, locked until they verify', () => {
    const { onPickPhoto, unmount } = show(pageOf(), { canPick: true });
    fireEvent.click(screen.getByLabelText('Choose the photo for Colosseum'));
    expect(onPickPhoto).toHaveBeenCalledWith(expect.objectContaining({ landmarkId: 'lm-col' }));
    unmount();
    show(pageOf(), { canPick: true, locked: true });
    expect(screen.getByLabelText('Choose the photo for Colosseum').disabled).toBe(true);
  });

  it('says how to get a stamp when there are none', () => {
    show(pageOf({ stamps: [] }));
    expect(screen.getByText('Landmark stamps').closest('h3').textContent).toBe('Landmark stamps (0)');
    expect(screen.getByText(/No landmark stamped in Italy yet\./)).toBeTruthy();
  });

  it('lists the moments at the stamped landmarks', () => {
    const moments = [
      { id: 'm1', title: 'Engaged', happenedOn: '2019-06-01', datePrecision: 'MONTH' },
      { id: 'm2', title: 'Gelato', happenedOn: null, datePrecision: null },
    ];
    show(pageOf({ stamps: [stamp('lm-col', 'Colosseum', { moments }), stamp('lm-pan', 'Pantheon')] }));
    const list = screen.getByText('Moments here').nextElementSibling;
    expect([...list.querySelectorAll('li')].map((li) => li.textContent)).toEqual(['Colosseum: Engaged, June 2019', 'Colosseum: Gelato']);
  });

  it('has no moments list when no stamp has a moment', () => {
    show();
    expect(screen.queryByText('Moments here')).toBeNull();
  });

  it('lists the landmarks still to stamp as dotted outlines, naming UNESCO sites for screen readers', () => {
    show();
    const section = screen.getByText('Still to stamp').closest('section');
    expect(section.querySelector('h3').textContent).toBe('Still to stamp (3)');
    const items = section.querySelectorAll('li');
    expect(items.length).toBe(3);
    expect(items[0].textContent).toBe('Landmark 1 (UNESCO World Heritage Site)');
    expect(items[0].querySelector('svg').getAttribute('aria-hidden')).toBe('true');
    expect(within(section).queryByText(/^Show all/)).toBeNull();
  });

  it('shows the first 12 still to stamp, then all of them on request', () => {
    show(pageOf({ toStamp: landmarks(15) }));
    const section = screen.getByText('Still to stamp').closest('section');
    expect(section.querySelectorAll('li').length).toBe(12);
    const more = within(section).getByText('Show all 15');
    expect(more.getAttribute('aria-expanded')).toBe('false');
    expect(document.getElementById(more.getAttribute('aria-controls'))).toBe(section.querySelector('ul'));
    fireEvent.click(more);
    expect(section.querySelectorAll('li').length).toBe(15);
    expect(more.getAttribute('aria-expanded')).toBe('true');
    expect(more.textContent).toBe('Show fewer');
    fireEvent.click(more);
    expect(section.querySelectorAll('li').length).toBe(12);
  });

  it('has no checklist once every landmark is stamped', () => {
    show(pageOf({ toStamp: [] }));
    expect(screen.queryByText('Still to stamp')).toBeNull();
  });

  it('numbers the page', () => {
    const { container } = show();
    expect(container.querySelector('section').querySelector(':scope > p:last-of-type').textContent).toBe('Page 3');
  });
});

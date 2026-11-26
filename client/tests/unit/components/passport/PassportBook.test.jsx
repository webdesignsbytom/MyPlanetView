import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import PassportBook from '@/components/passport/PassportBook';

const PASSPORT = {
  map: { id: 'map-1', name: 'Charlie & Alex’s travels', plan: { id: 'REGULAR' } },
  travellers: [
    { id: 't1', name: 'Charlie Reid', birthCountryCode: 'GB', favouriteCountryCode: null },
    { id: 't2', name: 'Alex Byrne', birthCountryCode: null, favouriteCountryCode: null },
  ],
  pages: [
    {
      countryCode: 'IT',
      status: 'VISITED',
      enteredOn: '2019-06-01',
      stamps: [{ landmarkId: 'lm-col', name: 'Colosseum', stampedOn: '2019-06-02', photoCount: 2, photo: { id: 'p1', thumbUrl: null } }],
      toStamp: [],
    },
    { countryCode: 'FR', status: 'LIVED', enteredOn: null, stamps: [], toStamp: [] },
  ],
  totals: { countries: 2, continents: 1, specialPlaces: 0, regions: 0, landmarks: 1, unesco: 0 },
};

// jsdom has neither Web Animations nor media queries: a recording `animate`, and a
// `matchMedia` answering the queries the book asks
let animations;
let finishTurns;
const media = { reduced: false, phone: false, wide: true };

beforeEach(() => {
  animations = [];
  finishTurns = true;
  Object.assign(media, { reduced: false, phone: false, wide: true });
  Object.defineProperty(Element.prototype, 'animate', {
    configurable: true,
    writable: true,
    value: function animate(keyframes, options) {
      const animation = { element: this, keyframes, options, cancel: vi.fn(), finished: finishTurns ? Promise.resolve() : new Promise(() => {}) };
      animations.push(animation);
      return animation;
    },
  });
  vi.stubGlobal('matchMedia', (query) => ({
    matches:
      (query.includes('prefers-reduced-motion') && media.reduced) ||
      (query.includes('max-width: 767px') && media.phone) ||
      (query === '(min-width: 768px)' && media.wide),
    addEventListener() {},
    removeEventListener() {},
  }));
});

afterEach(() => {
  delete Element.prototype.animate;
});

const open = (props = {}) => {
  const onOpenPhoto = vi.fn();
  const view = render(<PassportBook passport={PASSPORT} onOpenPhoto={onOpenPhoto} {...props} />);
  return { ...view, onOpenPhoto };
};

const status = () => screen.getByRole('status').textContent;
const previous = () => screen.getByText('Previous page').closest('button');
const next = () => screen.getByText('Next page').closest('button');
const pageList = () => screen.getByLabelText('Go to a page');
// The live page (not a copy turning over it)
const livePage = (container) => [...container.querySelectorAll('section[aria-label="Passport book"] > div > div')].find((el) => !el.hasAttribute('inert'));
// Text on the live page only: right after a turn, the copies turning over it are still in the
// page (inert) until the turn's animation has finished
const notCopy = (el) => !el.closest('[inert]');
const live = (text) => screen.getAllByText(text).find(notCopy);
const liveQuery = (text) => screen.queryAllByText(text).find(notCopy) ?? null;

describe('PassportBook', () => {
  it('opens on the cover, in the cover the owner’s plan gives', () => {
    const { container } = open();
    expect(status()).toBe('Page 1 of 5: Cover');
    expect(container.querySelector('[data-cover]').getAttribute('data-cover')).toBe('REGULAR');
    expect(container.querySelector('section[aria-label="Passport book"]').className).toContain('passport-business');
    expect(previous().disabled).toBe(true);
    expect(next().disabled).toBe(false);
  });

  it('sizes the book to fit above its page bar, which keeps to the window’s foot on wide screens only', () => {
    const { container } = open();
    const leaves = container.querySelector('[data-book-height]');
    // jsdom: a 768-pixel window, nothing above the book, a bar of no height
    expect(leaves.getAttribute('data-book-height')).toBe('640');
    expect(leaves.style.getPropertyValue('--book-h')).toBe('640px');
    expect(leaves.className).toContain('md:h-[var(--book-h,40rem)]');
    const bar = container.querySelector('nav[aria-label="Passport pages"]');
    expect(bar.className).toContain('md:sticky');
    expect(bar.className.split(/\s+/)).not.toContain('sticky');
  });

  it('lists every page: the cover, the travellers, a visa page per country and the totals', () => {
    open();
    expect([...pageList().querySelectorAll('option')].map((o) => o.textContent)).toEqual([
      '1. Cover',
      '2. Travellers',
      '3. Italy',
      '4. France',
      '5. Totals',
    ]);
    expect(pageList().value).toBe('0');
  });

  it('turns the pages with the buttons, and stops at the back', () => {
    open();
    fireEvent.click(next());
    expect(status()).toBe('Page 2 of 5: Travellers');
    expect(live('Travellers').tagName).toBe('H2');
    fireEvent.click(next());
    expect(live('Italy').tagName).toBe('H2');
    fireEvent.click(previous());
    expect(status()).toBe('Page 2 of 5: Travellers');
    fireEvent.change(pageList(), { target: { value: '4' } });
    expect(status()).toBe('Page 5 of 5: Totals');
    expect(next().disabled).toBe(true);
    fireEvent.click(next());
    expect(status()).toBe('Page 5 of 5: Totals');
  });

  // 24 Nov 2026, the user's wish: the celebration's "Open passport" opens the book from its cover
  // straight to the new country's page, the pages between skipped
  describe('opened at a place’s page (openAt)', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());
    const sheetTurns = () => animations.filter((a) => a.keyframes.some((frame) => String(frame.transform).includes('rotateY')));

    it('shows the closed cover a moment, then opens it straight to the place, with the cover’s own turn', () => {
      finishTurns = false;
      const { container } = open({ openAt: 'FR' });
      expect(status()).toBe('Page 1 of 5: Cover');
      act(() => vi.advanceTimersByTime(599));
      expect(status()).toBe('Page 1 of 5: Cover');
      act(() => vi.advanceTimersByTime(1));
      expect(status()).toBe('Page 4 of 5: France');
      // One turn, the cover's (it slides, then turns), its back the new page: no page between shows
      expect(sheetTurns().map((a) => a.options.duration)).toEqual([950]);
      const copies = [...container.querySelectorAll('[inert]')].map((copy) => copy.textContent);
      expect(copies.some((text) => text.includes('Travellers') || text.includes('Italy'))).toBe(false);
      expect(copies.some((text) => text.includes('France'))).toBe(true);
    });

    it('opens only once, and not after a page was turned by hand meanwhile', () => {
      const { rerender, onOpenPhoto } = open({ openAt: 'FR' });
      fireEvent.click(next());
      act(() => vi.advanceTimersByTime(1000));
      expect(status()).toBe('Page 2 of 5: Travellers');
      fireEvent.click(previous());
      rerender(<PassportBook passport={{ ...PASSPORT }} onOpenPhoto={onOpenPhoto} openAt='FR' />);
      act(() => vi.advanceTimersByTime(1000));
      expect(status()).toBe('Page 1 of 5: Cover');
    });

    it('stays on the cover for a place the book has no page for', () => {
      open({ openAt: 'JP' });
      act(() => vi.advanceTimersByTime(1000));
      expect(status()).toBe('Page 1 of 5: Cover');
    });
  });

  it('goes straight to a page chosen from the list', () => {
    open();
    fireEvent.change(pageList(), { target: { value: '3' } });
    expect(status()).toBe('Page 4 of 5: France');
    expect(pageList().value).toBe('3');
    expect(live('Lived there')).toBeTruthy();
  });

  it('fades the page in with reduced motion, with no page turning over it', () => {
    media.reduced = true;
    const { container } = open();
    fireEvent.click(next());
    expect(animations.length).toBe(1);
    expect(animations[0].keyframes).toEqual([{ opacity: 0 }, { opacity: 1 }]);
    expect(animations[0].options).toEqual({ duration: 200, easing: 'ease-out' });
    expect(animations[0].element).toBe(livePage(container));
    expect(container.querySelectorAll('[inert]').length).toBe(0);
  });

  it('turns a real page on wide screens, then takes the turning copy away', async () => {
    finishTurns = false;
    const { container } = open();
    fireEvent.click(next());
    fireEvent.click(next());
    // Cover to travellers was the cover's own turn; travellers to Italy is a page's
    const sheet = animations.filter((a) => a.keyframes.some((frame) => String(frame.transform).includes('rotateY')));
    expect(sheet.map((a) => a.options.duration)).toEqual([950, 700]);
    expect(sheet[1].options.direction).toBe('normal');
    // The sheet and the page that stays under it are copies, out of the way of screen readers
    const copies = container.querySelectorAll('[inert]');
    expect(copies.length).toBeGreaterThan(0);
    copies.forEach((copy) => expect(copy.getAttribute('aria-hidden')).toBe('true'));
    // Turning back plays the sheet backwards
    fireEvent.click(previous());
    const back = animations.filter((a) => a.keyframes.some((frame) => String(frame.transform).includes('rotateY'))).at(-1);
    expect(back.options.direction).toBe('reverse');
  });

  it('clears the turning copies once the turn has finished', async () => {
    const { container } = open();
    fireEvent.click(next());
    await waitFor(() => expect(container.querySelectorAll('[inert]').length).toBe(0));
    expect(status()).toBe('Page 2 of 5: Travellers');
  });

  it('cancels a turn still running when the page turns again', () => {
    finishTurns = false;
    open();
    fireEvent.click(next());
    const first = animations.slice();
    fireEvent.click(next());
    first.forEach((animation) => expect(animation.cancel).toHaveBeenCalled());
  });

  it('slides the pages on a phone, the old one sliding out', () => {
    media.phone = true;
    media.wide = false;
    finishTurns = false;
    const { container } = open();
    fireEvent.click(next());
    const transforms = animations.map((a) => a.keyframes.map((frame) => frame.transform));
    expect(transforms).toEqual([
      ['translateX(100%)', 'translateX(0)'],
      ['translateX(0)', 'translateX(-100%)'],
    ]);
    expect(container.querySelectorAll('[inert]').length).toBe(1);
  });

  describe('the arrow keys', () => {
    it('turn the page from anywhere on the page', () => {
      open();
      fireEvent.keyDown(document.body, { key: 'ArrowRight' });
      expect(status()).toBe('Page 2 of 5: Travellers');
      fireEvent.keyDown(document.body, { key: 'ArrowRight' });
      expect(status()).toBe('Page 3 of 5: Italy');
      fireEvent.keyDown(document.body, { key: 'ArrowLeft' });
      expect(status()).toBe('Page 2 of 5: Travellers');
    });

    it('stop at the cover and the back', () => {
      open();
      fireEvent.keyDown(document.body, { key: 'ArrowLeft' });
      expect(status()).toBe('Page 1 of 5: Cover');
    });

    it('leave a field, a dialog and a modifier key alone', () => {
      open();
      fireEvent.keyDown(pageList(), { key: 'ArrowRight' });
      expect(status()).toBe('Page 1 of 5: Cover');
      fireEvent.keyDown(document.body, { key: 'ArrowRight', shiftKey: true });
      fireEvent.keyDown(document.body, { key: 'ArrowRight', altKey: true });
      expect(status()).toBe('Page 1 of 5: Cover');
      const input = document.createElement('input');
      document.body.appendChild(input);
      fireEvent.keyDown(input, { key: 'ArrowRight' });
      expect(status()).toBe('Page 1 of 5: Cover');
      input.remove();
    });

    it('do nothing while a modal dialog is open over the book', () => {
      open();
      const dialog = document.createElement('div');
      dialog.setAttribute('aria-modal', 'true');
      document.body.appendChild(dialog);
      fireEvent.keyDown(document.body, { key: 'ArrowRight' });
      expect(status()).toBe('Page 1 of 5: Cover');
      dialog.remove();
      fireEvent.keyDown(document.body, { key: 'ArrowRight' });
      expect(status()).toBe('Page 2 of 5: Travellers');
    });

    it('stop listening once the book has gone', () => {
      const { unmount } = open();
      unmount();
      expect(() => fireEvent.keyDown(document.body, { key: 'ArrowRight' })).not.toThrow();
    });
  });

  describe('a double-click', () => {
    beforeEach(() => {
      vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, width: 800, height: 600, right: 800, bottom: 600 });
    });

    it('opens the closed cover', () => {
      const { container } = open();
      fireEvent.doubleClick(container.querySelector('[data-cover] h2'));
      expect(status()).toBe('Page 2 of 5: Travellers');
    });

    it('does nothing in the space beside the closed cover', () => {
      const { container } = open();
      fireEvent.doubleClick(livePage(container));
      expect(status()).toBe('Page 1 of 5: Cover');
    });

    it('turns back on the left-hand page of an open spread and on on the right-hand one', () => {
      const { container } = open();
      fireEvent.change(pageList(), { target: { value: '2' } });
      fireEvent.doubleClick(live('Italy'), { clientX: 600 });
      expect(status()).toBe('Page 4 of 5: France');
      fireEvent.doubleClick(livePage(container), { clientX: 100 });
      expect(status()).toBe('Page 3 of 5: Italy');
    });

    it('always turns on, on a phone’s single page', () => {
      media.wide = false;
      const { container } = open();
      fireEvent.change(pageList(), { target: { value: '2' } });
      fireEvent.doubleClick(livePage(container), { clientX: 100 });
      expect(status()).toBe('Page 4 of 5: France');
    });

    it('leaves a stamp, a button or a link to do its own job', () => {
      open();
      fireEvent.change(pageList(), { target: { value: '2' } });
      fireEvent.doubleClick(live('Open the photo of Colosseum'), { clientX: 600 });
      expect(status()).toBe('Page 3 of 5: Italy');
    });
  });

  describe('a swipe', () => {
    // jsdom has no PointerEvent, so fireEvent would send a plain Event without the position
    beforeEach(() => {
      vi.stubGlobal(
        'PointerEvent',
        class PointerEvent extends MouseEvent {
          constructor(type, init = {}) {
            super(type, init);
            this.pointerType = init.pointerType ?? '';
          }
        },
      );
    });

    const swipe = (container, { from, to, pointerType = 'touch', dy = 0 }) => {
      const area = container.querySelector('section[aria-label="Passport book"] > div');
      fireEvent.pointerDown(area, { pointerType, clientX: from, clientY: 100 });
      fireEvent.pointerUp(area, { pointerType, clientX: to, clientY: 100 + dy });
    };

    it('to the left turns on and to the right turns back', () => {
      const { container } = open();
      swipe(container, { from: 300, to: 200 });
      expect(status()).toBe('Page 2 of 5: Travellers');
      swipe(container, { from: 200, to: 300 });
      expect(status()).toBe('Page 1 of 5: Cover');
    });

    it('ignores a short or a mostly vertical one, and the mouse', () => {
      const { container } = open();
      swipe(container, { from: 300, to: 270 });
      swipe(container, { from: 300, to: 200, dy: 120 });
      swipe(container, { from: 300, to: 200, pointerType: 'mouse' });
      expect(status()).toBe('Page 1 of 5: Cover');
    });
  });

  it('shows only one traveller on their own passport', () => {
    open({ passport: { ...PASSPORT, map: { ...PASSPORT.map, traveller: { id: 't2', name: 'Alex Byrne' } } } });
    fireEvent.click(next());
    expect(live('Alex Byrne')).toBeTruthy();
    expect(liveQuery('Charlie Reid')).toBeNull();
  });

  // 24 Nov 2026, the user's wish: a stamp opens its photo; nobody picks it here
  it('opens a stamp’s photo, and offers none to choose', () => {
    const { onOpenPhoto } = open();
    fireEvent.change(pageList(), { target: { value: '2' } });
    fireEvent.click(live('Open the photo of Colosseum').closest('button'));
    expect(onOpenPhoto).toHaveBeenCalledWith('p1');
    expect(screen.queryAllByText('Choose photo')).toHaveLength(0);
  });

  it('says on the back when there are no visa pages yet', () => {
    open({ passport: { ...PASSPORT, pages: [] } });
    fireEvent.change(pageList(), { target: { value: '2' } });
    expect(status()).toBe('Page 3 of 3: Totals');
    expect(live(/^No visa pages yet\./)).toBeTruthy();
  });

  it('keeps its place when the passport reloads with fewer pages', () => {
    const { rerender } = open();
    fireEvent.change(pageList(), { target: { value: '4' } });
    act(() => {
      rerender(<PassportBook passport={{ ...PASSPORT, pages: [] }} onOpenPhoto={vi.fn()} />);
    });
    expect(status()).toBe('Page 3 of 3: Totals');
  });
});

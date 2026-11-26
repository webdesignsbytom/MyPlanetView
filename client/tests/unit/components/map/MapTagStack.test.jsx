import React, { useEffect, useState } from 'react';
import { describe, expect, it } from 'vitest';
import { act, fireEvent, render } from '@testing-library/react';
import MapTagStack from '@/components/map/MapTagStack';

// A note that shows (or not) as its owner says, as the map's tags decide for themselves
function Note({ name, show = true, later = false, closeable = false }) {
  const [here, setHere] = useState(show && !later);
  useEffect(() => {
    if (!later) return undefined;
    const timer = setTimeout(() => setHere(true), 0);
    return () => clearTimeout(timer);
  }, [later]);
  if (!here) return null;
  return (
    <section aria-label={name} data-note={name}>
      {name}
      {closeable ? (
        <button type='button' onClick={() => setHere(false)}>
          Close {name}
        </button>
      ) : null}
    </section>
  );
}

const visibleNotes = (container) =>
  [...container.querySelectorAll('[data-tag-slot]')].filter((slot) => !slot.className.split(/\s+/).includes('hidden')).map((slot) => slot.querySelector('[data-note]')?.dataset.note);
const stepper = (container) => container.querySelector('[data-tag-stepper]');
const press = (container, name) => fireEvent.click(container.querySelector(`button[aria-label="${name}"]`));

describe('MapTagStack', () => {
  it('shows one note at a time, the first in order, with arrows and a count between them', () => {
    const { container } = render(
      <MapTagStack>
        <Note key='home' name='Welcome home' />
        <Note key='anniversary' name='On this day' />
        <Note key='countdown' name='Your next trip' />
      </MapTagStack>,
    );
    expect(visibleNotes(container)).toEqual(['Welcome home']);
    expect(stepper(container).getAttribute('role')).toBe('group');
    expect(stepper(container).textContent).toBe('1 of 3');
    press(container, 'Next note');
    expect(visibleNotes(container)).toEqual(['On this day']);
    expect(stepper(container).textContent).toBe('2 of 3');
    press(container, 'Next note');
    press(container, 'Next note');
    // Round again to the first
    expect(visibleNotes(container)).toEqual(['Welcome home']);
    press(container, 'Previous note');
    expect(visibleNotes(container)).toEqual(['Your next trip']);
    expect(stepper(container).textContent).toBe('3 of 3');
  });

  it('counts only the notes that show, with no arrows for one, and nothing at all for none', () => {
    const one = render(
      <MapTagStack>
        <Note key='home' name='Welcome home' show={false} />
        {null}
        <Note key='countdown' name='Your next trip' />
      </MapTagStack>,
    );
    expect(visibleNotes(one.container)).toEqual(['Your next trip']);
    expect(stepper(one.container)).toBeNull();
    one.unmount();
    const none = render(
      <MapTagStack>
        <Note key='home' name='Welcome home' show={false} />
      </MapTagStack>,
    );
    expect(none.container.querySelector('[data-map-tag-stack]').className).toBe('hidden');
  });

  it('keeps the note the viewer moved to when another arrives, and moves on when one is closed', async () => {
    const { container } = render(
      <MapTagStack>
        <Note key='home' name='Welcome home' later />
        <Note key='anniversary' name='On this day' closeable />
        <Note key='countdown' name='Your next trip' />
      </MapTagStack>,
    );
    expect(visibleNotes(container)).toEqual(['On this day']);
    press(container, 'Next note');
    expect(visibleNotes(container)).toEqual(['Your next trip']);
    // "Welcome home" arrives: first in order, but the viewer's choice stays
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(visibleNotes(container)).toEqual(['Your next trip']);
    expect(stepper(container).textContent).toBe('3 of 3');
    press(container, 'Previous note');
    expect(visibleNotes(container)).toEqual(['On this day']);
    // Closed, the first of those left shows
    fireEvent.click([...container.querySelectorAll('button')].find((b) => b.textContent === 'Close On this day'));
    await act(async () => {});
    expect(visibleNotes(container)).toEqual(['Welcome home']);
    expect(stepper(container).textContent).toBe('1 of 2');
  });
});

import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import TripStopFormCard from '@/components/trips/TripStopFormCard';

describe('TripStopFormCard', () => {
  it('is a section named by its h3 title, with its form inside', () => {
    const { container } = render(
      <TripStopFormCard title='Add a stop' closeLabel='Close the new stop form' onClose={vi.fn()}>
        <p>The form</p>
      </TripStopFormCard>,
    );
    const section = container.querySelector('section');
    const heading = container.querySelector('h3');
    expect(heading.textContent).toBe('Add a stop');
    expect(section.getAttribute('aria-labelledby')).toBe(heading.id);
    expect(screen.getByText('The form')).toBeTruthy();
  });

  it('closes with its close stamp', () => {
    const onClose = vi.fn();
    render(
      <TripStopFormCard title='Edit stop 1' closeLabel='Stop editing stop 1, France' onClose={onClose}>
        <p>Form</p>
      </TripStopFormCard>,
    );
    fireEvent.click(screen.getByLabelText('Stop editing stop 1, France'));
    expect(onClose).toHaveBeenCalled();
  });

  it('moves focus to its title only when asked', () => {
    const { container, unmount } = render(
      <TripStopFormCard title='Quiet' closeLabel='Close' onClose={vi.fn()}>
        <p>Form</p>
      </TripStopFormCard>,
    );
    expect(document.activeElement).not.toBe(container.querySelector('h3'));
    unmount();
    const opened = render(
      <TripStopFormCard title='Asked for' closeLabel='Close' onClose={vi.fn()} autoFocus>
        <p>Form</p>
      </TripStopFormCard>,
    );
    expect(document.activeElement).toBe(opened.container.querySelector('h3'));
  });
});

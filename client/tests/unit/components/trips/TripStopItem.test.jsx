import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import TripStopItem from '@/components/trips/TripStopItem';
import useLandmarks from '@/hooks/useLandmarks';

vi.mock('@/hooks/useLandmarks', () => ({ default: vi.fn() }));

const STOP = { id: 's1', countryCode: 'FR', landmarkName: 'Eiffel Tower', placeName: 'Paris', arriveOn: '2027-06-01', leaveOn: '2027-06-04', notes: 'Bring a coat' };

const item = (props = {}) => (
  <ol>
    <TripStopItem stop={STOP} index={1} count={3} canEdit busy={false} onMove={vi.fn()} onSave={vi.fn()} onRemove={vi.fn()} {...props} />
  </ol>
);

describe('TripStopItem', { timeout: 20000 }, () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useLandmarks.mockReturnValue({ landmarks: [] });
  });

  it('shows its number, place, dates and notes', () => {
    const { container } = render(item());
    expect(container.textContent).toContain('Stop 2: ');
    expect(container.textContent).toContain('France — Eiffel Tower, Paris');
    expect(screen.getByText('1 Jun 2027 – 4 Jun 2027')).toBeTruthy();
    expect(screen.getByText('Bring a coat')).toBeTruthy();
  });

  it('leaves out what a stop doesn’t have', () => {
    const { container } = render(item({ stop: { id: 's', countryCode: 'JP' }, canEdit: false }));
    expect(container.textContent).toBe('2Stop 2: Japan');
  });

  it('has no controls for a viewer', () => {
    const { container } = render(item({ canEdit: false }));
    expect(container.querySelectorAll('button').length).toBe(0);
  });

  it('moves up and down, with each end’s stamp disabled', () => {
    const onMove = vi.fn();
    const { rerender } = render(item({ onMove }));
    fireEvent.click(screen.getByLabelText('Move stop 2, France up'), { detail: 1 });
    expect(onMove).toHaveBeenLastCalledWith(-1);
    fireEvent.click(screen.getByLabelText('Move stop 2, France down'), { detail: 1 });
    expect(onMove).toHaveBeenLastCalledWith(1);
    rerender(item({ index: 0, onMove }));
    expect(screen.getByLabelText('Move stop 1, France up').disabled).toBe(true);
    rerender(item({ index: 2, onMove }));
    expect(screen.getByLabelText('Move stop 3, France down').disabled).toBe(true);
  });

  it('ignores a move or a remove while saving', () => {
    const onMove = vi.fn();
    const onRemove = vi.fn();
    render(item({ busy: true, onMove, onRemove }));
    fireEvent.click(screen.getByLabelText('Move stop 2, France up'), { detail: 1 });
    fireEvent.click(screen.getByLabelText('Remove stop 2, France'));
    expect(onMove).not.toHaveBeenCalled();
    expect(onRemove).not.toHaveBeenCalled();
    // Nothing focused is disabled while saving
    expect(screen.getByLabelText('Remove stop 2, France').disabled).toBe(false);
  });

  it('keeps keyboard focus on the moved stop’s stamp, or its other stamp at an end', () => {
    const onMove = vi.fn().mockResolvedValue();
    const { rerender } = render(item({ onMove }));
    // Enter or Space: a click with detail 0
    fireEvent.click(screen.getByLabelText('Move stop 2, France down'), { detail: 0 });
    rerender(item({ index: 2, onMove }));
    expect(document.activeElement.getAttribute('aria-label')).toBe('Move stop 3, France up');
    fireEvent.click(screen.getByLabelText('Move stop 3, France up'), { detail: 0 });
    rerender(item({ index: 1, onMove }));
    expect(document.activeElement.getAttribute('aria-label')).toBe('Move stop 2, France up');
  });

  it('removes the stop', () => {
    const onRemove = vi.fn();
    render(item({ onRemove }));
    fireEvent.click(screen.getByLabelText('Remove stop 2, France'));
    expect(onRemove).toHaveBeenCalled();
  });

  it('edits the stop on its own form card, then hands focus back to Edit', async () => {
    const onSave = vi.fn().mockResolvedValue();
    const { container } = render(item({ onSave }));
    fireEvent.click(screen.getByLabelText('Edit stop 2, France'));
    expect(container.querySelector('h3').textContent).toBe('Edit stop 2');
    expect(document.activeElement).toBe(container.querySelector('h3'));
    const place = await screen.findByLabelText('Town or place');
    expect(place.value).toBe('Paris');
    expect(place.id).toBe('stop-s1-place');
    fireEvent.change(place, { target: { value: 'Lyon' } });
    fireEvent.click(screen.getByText('Save stop'));
    await waitFor(() => expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ countryCode: 'FR', placeName: 'Lyon' })));
    await waitFor(() => expect(container.querySelector('h3')).toBeNull());
    expect(document.activeElement.getAttribute('aria-label')).toBe('Edit stop 2, France');
  });

  it('closes the form with its close stamp', async () => {
    const { container } = render(item());
    fireEvent.click(screen.getByLabelText('Edit stop 2, France'));
    fireEvent.click(screen.getByLabelText('Stop editing stop 2, France'));
    expect(container.querySelector('h3')).toBeNull();
    expect(document.activeElement.getAttribute('aria-label')).toBe('Edit stop 2, France');
  });

  it('puts focus on Edit when asked (a neighbour was removed)', () => {
    const onFocused = vi.fn();
    render(item({ focusEdit: true, onFocused }));
    expect(document.activeElement.getAttribute('aria-label')).toBe('Edit stop 2, France');
    expect(onFocused).toHaveBeenCalled();
  });
});

import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import StringModeTag from '@/components/map/StringModeTag';

describe('StringModeTag', () => {
  it('says how to start, and the place chosen first', () => {
    const { rerender, container } = render(<StringModeTag onDone={vi.fn()} />);
    expect(container.querySelector('[data-string-mode]').getAttribute('aria-label')).toBe('String mode');
    expect(screen.getByRole('status').textContent).toBe('Click a country to start a string. Click a string to take it off.');
    rerender(<StringModeTag startCode='FR' onDone={vi.fn()} />);
    expect(screen.getByRole('status').textContent).toBe('From France: click the country to tie it to.');
  });

  it('reads out what just happened, with what to do next under it', () => {
    render(<StringModeTag message='Tied France to Japan.' onDone={vi.fn()} />);
    expect(screen.getByRole('status').textContent).toBe('Tied France to Japan.');
    expect(screen.getByText('Click a country to start a string. Click a string to take it off.')).toBeTruthy();
  });

  // Planned strings (25 Nov 2026, the user's wish): the tag says which kind is being tied
  it('says when it’s the planned strings being tied', () => {
    const { container, rerender } = render(<StringModeTag onDone={vi.fn()} />);
    expect(container.querySelector('[data-string-mode]').getAttribute('data-string-mode')).toBe('VISITED');
    expect(screen.getByText('String mode')).toBeTruthy();
    rerender(<StringModeTag kind='PLANNED' onDone={vi.fn()} />);
    expect(container.querySelector('[data-string-mode]').getAttribute('data-string-mode')).toBe('PLANNED');
    expect(screen.getByText('String mode: planned strings')).toBeTruthy();
  });

  it('marks a failure', () => {
    render(<StringModeTag message='That string didn’t tie.' error onDone={vi.fn()} />);
    expect(screen.getByRole('status').className).toContain('text-status-critical');
  });

  it('ends with Done or Escape, but not Escape meant for a dialog over it', () => {
    const onDone = vi.fn();
    render(<StringModeTag onDone={onDone} />);
    fireEvent.click(screen.getByText('Done'));
    expect(onDone).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onDone).toHaveBeenCalledTimes(2);
    const dialog = document.createElement('div');
    dialog.setAttribute('aria-modal', 'true');
    document.body.appendChild(dialog);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onDone).toHaveBeenCalledTimes(2);
    dialog.remove();
  });

  it('stops listening once it’s gone', () => {
    const onDone = vi.fn();
    const { unmount } = render(<StringModeTag onDone={onDone} />);
    unmount();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onDone).not.toHaveBeenCalled();
  });
});

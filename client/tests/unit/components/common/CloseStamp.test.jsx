import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import CloseStamp from '@/components/common/CloseStamp';

const stamp = (props = {}) => {
  render(<CloseStamp label='Close France' onClick={() => {}} {...props} />);
  return screen.getByLabelText('Close France');
};

describe('CloseStamp', () => {
  it('is a button named by its label, with the label as its tooltip', () => {
    const button = stamp();
    expect(button.tagName).toBe('BUTTON');
    expect(button.getAttribute('type')).toBe('button');
    expect(button.getAttribute('title')).toBe('Close France');
  });

  it('shows a longer hint as its tooltip when given one', () => {
    expect(stamp({ hint: 'Close France and go back to the map' }).getAttribute('title')).toBe('Close France and go back to the map');
  });

  it('calls onClick when pressed, and not while disabled', () => {
    const onClick = vi.fn();
    const { rerender } = render(<CloseStamp label='Close' onClick={onClick} />);
    fireEvent.click(screen.getByLabelText('Close'));
    expect(onClick).toHaveBeenCalledTimes(1);
    rerender(<CloseStamp label='Close' onClick={onClick} disabled />);
    fireEvent.click(screen.getByLabelText('Close'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('is the usual size unless asked to be small', () => {
    const classes = stamp().className.split(' ');
    expect(classes).toContain('h-10');
    expect(classes).not.toContain('h-7');
  });

  it('is small with `small`', () => {
    const classes = stamp({ small: true }).className.split(' ');
    expect(classes).toContain('h-7');
    expect(classes).not.toContain('h-10');
    expect(classes.some((name) => name.startsWith('lg:'))).toBe(false);
  });

  it('is small on phones and tablets and the usual size from lg with `smallUntilLg` (the country ticket)', () => {
    const classes = stamp({ smallUntilLg: true }).className.split(' ');
    expect(classes).toEqual(expect.arrayContaining(['h-7', 'w-7', 'lg:h-10', 'lg:w-10']));
  });
});

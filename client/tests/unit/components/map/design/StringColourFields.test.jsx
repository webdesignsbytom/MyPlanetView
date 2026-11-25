// One kind of string's colours (src/components/map/design/StringColourFields.jsx): in the Strings
// panel's tabs since 25 Nov 2026 (the user's wish: "all in one place"), the visited strings'
// and the planned ones' apart
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import StringColourFields from '@/components/map/design/StringColourFields';

const USUAL = { colour: '#c8102e', twist: '#faf6ec' };
const show = (design, kind = 'VISITED') => {
  const onChange = vi.fn();
  const view = render(<StringColourFields id='s' kind={kind} design={design} usual={USUAL} onChange={onChange} />);
  return { ...view, onChange };
};

describe('StringColourFields', () => {
  it('changes the visited strings’ colour and opacity, and puts it back', () => {
    const { onChange, container } = show({ string: '#c0ffee' });
    expect(container.querySelector('[data-string-colours]').getAttribute('data-string-colours')).toBe('VISITED');
    expect(screen.getByLabelText('String colour').value).toBe('#c0ffee');
    fireEvent.input(screen.getByLabelText('String colour'), { target: { value: '#1d4ed8' } });
    fireEvent.change(screen.getByLabelText('String colour opacity'), { target: { value: '50' } });
    fireEvent.click(screen.getByLabelText('String colour: back to the usual colour'));
    expect(onChange.mock.calls).toEqual([[{ string: '#1d4ed8' }], [{ string: '#c0ffee80' }], [{ string: null }]]);
  });

  it('starts from the style’s usual colour', () => {
    show({ string: null });
    expect(screen.getByLabelText('String colour').value).toBe('#c8102e');
  });

  // Two colours twisted together, as baker's twine (25 Nov 2026, the user's wish)
  it('twists a second colour in, from the style’s usual one, and back to one colour', () => {
    const { onChange, rerender } = show({ string: '#c8102e', stringTwist: null });
    const box = screen.getByLabelText('Two tone string');
    expect(box.checked).toBe(false);
    expect(screen.queryByLabelText('Second string colour')).toBeNull();
    fireEvent.click(box);
    expect(onChange).toHaveBeenLastCalledWith({ stringTwist: '#faf6ec' });

    rerender(<StringColourFields id='s' design={{ string: '#c8102e', stringTwist: '#123456' }} usual={USUAL} onChange={onChange} />);
    expect(screen.getByLabelText('Two tone string').checked).toBe(true);
    const second = screen.getByLabelText('Second string colour');
    expect(second.value).toBe('#123456');
    fireEvent.input(second, { target: { value: '#00aa00' } });
    expect(onChange).toHaveBeenLastCalledWith({ stringTwist: '#00aa00' });
    // "Usual" is the style's usual second colour, never one colour again
    fireEvent.click(screen.getByLabelText('Second string colour: back to the usual colour'));
    expect(onChange).toHaveBeenLastCalledWith({ stringTwist: '#faf6ec' });
    fireEvent.click(screen.getByLabelText('Two tone string'));
    expect(onChange).toHaveBeenLastCalledWith({ stringTwist: null });
  });

  // 25 Nov 2026, the user's wish: with a two tone string, the opacity goes to the bottom
  it('puts the opacity under the colour, and under the second colour once there is one', () => {
    const order = (container) =>
      [...container.querySelectorAll('input')].map((input) => (input.type === 'range' ? 'opacity' : input.type === 'checkbox' ? 'two tone' : input.id.endsWith('twist-colour') ? 'second' : 'colour'));
    const one = show({ string: '#c0ffee80' });
    expect(order(one.container)).toEqual(['colour', 'opacity', 'two tone']);
    one.unmount();
    const { container, onChange } = show({ string: '#c0ffee80', stringTwist: '#123456' });
    expect(order(container)).toEqual(['colour', 'two tone', 'second', 'opacity']);
    // Still the string's opacity, kept when its colour changes
    const slider = screen.getByLabelText('String colour opacity');
    expect(slider.value).toBe('50');
    fireEvent.change(slider, { target: { value: '30' } });
    expect(onChange).toHaveBeenLastCalledWith({ string: '#c0ffee4d' });
    fireEvent.input(screen.getByLabelText('String colour'), { target: { value: '#1d4ed8' } });
    expect(onChange).toHaveBeenLastCalledWith({ string: '#1d4ed880' });
  });

  it('changes the planned strings’ own fields', () => {
    const { onChange } = show({ string: '#c0ffee', plannedString: '#1d4ed8', plannedStringTwist: null }, 'PLANNED');
    expect(screen.getByLabelText('String colour').value).toBe('#1d4ed8');
    fireEvent.input(screen.getByLabelText('String colour'), { target: { value: '#0000ff' } });
    fireEvent.click(screen.getByLabelText('Two tone string'));
    expect(onChange.mock.calls).toEqual([[{ plannedString: '#0000ff' }], [{ plannedStringTwist: '#faf6ec' }]]);
  });
});

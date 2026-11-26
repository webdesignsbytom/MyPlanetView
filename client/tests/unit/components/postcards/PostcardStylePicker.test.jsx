// The postcard's style (components/postcards/PostcardStylePicker.jsx): four radio cards, each with
// a swatch in the card's own colours
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import PostcardStylePicker from '@/components/postcards/PostcardStylePicker';
import { POSTCARD_COLOURS } from '@/utils/constants/brandColours';

const card = (style) => document.querySelector(`[data-postcard-style="${style}"]`);
// jsdom gives a style's colours back as rgb(): compare like with like
const rgb = (hex) => `rgb(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(', ')})`;

describe('PostcardStylePicker', () => {
  it('offers the four styles, the one chosen checked, each named and described', () => {
    render(<PostcardStylePicker value='vintage' onChange={vi.fn()} />);
    expect(document.querySelector('legend').textContent).toBe('Style');
    expect([...document.querySelectorAll('[data-postcard-style]')].map((el) => el.dataset.postcardStyle)).toEqual(['classic', 'vintage', 'airmail', 'night']);
    expect(card('vintage').querySelector('input').checked).toBe(true);
    expect(card('classic').querySelector('input').checked).toBe(false);
    expect(card('airmail').textContent).toContain('Red and blue striped edge');
  });

  it('shows each in its own paper, edge and lettering, kept in colour on Black and white', () => {
    render(<PostcardStylePicker value='classic' onChange={vi.fn()} />);
    const swatch = (style) => card(style).querySelector('[data-keep-colour]');
    expect(swatch('night').style.background).toBe(rgb(POSTCARD_COLOURS.night.paper));
    expect(swatch('night').style.color).toBe(rgb(POSTCARD_COLOURS.night.lettering));
    // Airmail's edge is its red stripe
    expect(swatch('airmail').style.borderColor).toBe(rgb(POSTCARD_COLOURS.airmail.stripes[0]));
  });

  it('chooses one, unless it’s disabled', () => {
    const onChange = vi.fn();
    const { rerender } = render(<PostcardStylePicker value='classic' onChange={onChange} />);
    fireEvent.click(card('night').querySelector('input'));
    expect(onChange).toHaveBeenCalledWith('night');
    rerender(<PostcardStylePicker value='classic' onChange={onChange} disabled />);
    expect(card('airmail').querySelector('input').disabled).toBe(true);
  });
});

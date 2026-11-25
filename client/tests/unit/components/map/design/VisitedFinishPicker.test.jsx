// The metallic finishes beside the visited colour (src/components/map/design/VisitedFinishPicker.jsx;
// 25 Nov 2026, the user's wish: "a few options next to the colour selector ... gold silver bronze")
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import VisitedFinishPicker from '@/components/map/design/VisitedFinishPicker';

describe('VisitedFinishPicker', () => {
  it('offers gold, silver and bronze in a named group, each with its swatch', () => {
    const { container } = render(<VisitedFinishPicker id='f' onChange={vi.fn()} />);
    const group = container.querySelector('[role="group"]');
    expect(document.getElementById(group.getAttribute('aria-labelledby')).textContent).toBe('Or a metallic finish');
    const buttons = [...group.querySelectorAll('button')];
    expect(buttons.map((b) => b.textContent)).toEqual(['Gold', 'Silver', 'Bronze']);
    expect(buttons.map((b) => b.getAttribute('aria-pressed'))).toEqual(['false', 'false', 'false']);
    expect(buttons[0].querySelector('[aria-hidden]').getAttribute('class')).toContain('var(--medal-gold-shine)');
  });

  it('chooses one, presses it, and goes back to the colour when it’s pressed again', () => {
    const onChange = vi.fn();
    const { rerender } = render(<VisitedFinishPicker id='f' onChange={onChange} />);
    fireEvent.click(screen.getByText('Gold'));
    expect(onChange).toHaveBeenLastCalledWith('GOLD');
    rerender(<VisitedFinishPicker id='f' value='GOLD' onChange={onChange} />);
    expect(screen.getByText('Gold').getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByText('Silver'));
    expect(onChange).toHaveBeenLastCalledWith('SILVER');
    fireEvent.click(screen.getByText('Gold'));
    expect(onChange).toHaveBeenLastCalledWith(null);
  });
});

// The passport cover's colour (26 Nov 2026, the user's wish: "just the cover colour, and gold or
// silver lettering stays tied to the plan")
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import PassportCoverPicker from '@/components/passport/PassportCoverPicker';
import { COVER_COLOURS, coverBoard, planCoverColour } from '@/utils/passport/passportBook';
import { PASSPORT_COLOURS } from '../../../../../server/src/utils/passportCovers.js';

describe('the cover colours', () => {
  it('are the server’s, each a leather token', () => {
    expect(COVER_COLOURS.map((c) => c.id)).toEqual([...PASSPORT_COLOURS]);
    for (const colour of COVER_COLOURS) expect(colour.token).toMatch(/^--cover-[a-z]+$/);
  });

  it('set the board’s colour, or leave the plan’s', () => {
    expect(coverBoard('GREEN')).toEqual({ '--board': 'var(--cover-green)' });
    expect(coverBoard(null)).toBeUndefined();
    expect(coverBoard('PINK')).toBeUndefined();
  });

  it('know each plan’s own', () => {
    expect(planCoverColour({ id: 'FREE' })).toBe('BURGUNDY');
    expect(planCoverColour({ id: 'REGULAR' })).toBe('NAVY');
    expect(planCoverColour({ id: 'PREMIUM' })).toBe('BLACK');
    expect(planCoverColour(null)).toBe('BURGUNDY');
  });
});

describe('PassportCoverPicker', () => {
  const swatch = (id) => document.querySelector(`[data-cover-colour="${id}"] input`);

  it('ticks the plan’s own colour when none is chosen, and says the lettering stays', () => {
    render(<PassportCoverPicker value={null} plan={{ id: 'REGULAR' }} onChange={() => {}} />);
    expect(swatch('NAVY').checked).toBe(true);
    expect(document.querySelector('[data-cover-colour="NAVY"]').textContent).toContain('Your plan’s');
    expect(screen.getByText(/The lettering stays your plan’s, silver/)).toBeTruthy();
    expect(screen.getByLabelText(/Green/).getAttribute('type')).toBe('radio');
  });

  it('hands over the colour chosen, and null for the plan’s own', () => {
    const onChange = vi.fn();
    render(<PassportCoverPicker value='GREEN' plan={{ id: 'FREE' }} onChange={onChange} />);
    expect(swatch('GREEN').checked).toBe(true);
    fireEvent.click(swatch('TAN'));
    expect(onChange).toHaveBeenLastCalledWith('TAN');
    fireEvent.click(swatch('BURGUNDY'));
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it('waits while it saves, and says why it couldn’t', () => {
    render(<PassportCoverPicker value={null} plan={{ id: 'PREMIUM' }} onChange={() => {}} busy error='Offline.' />);
    expect(swatch('GREEN').disabled).toBe(true);
    expect(screen.getByRole('alert').textContent).toBe('Offline.');
    expect(screen.getByText(/lettering stays your plan’s, gold/)).toBeTruthy();
  });
});

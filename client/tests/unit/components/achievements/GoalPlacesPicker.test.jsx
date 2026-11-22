import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import GoalPlacesPicker from '@/components/achievements/GoalPlacesPicker';
import { SplitUkProvider } from '@/hooks/useSplitUk';

const pick = (props = {}, splitUk = false) => {
  const onChange = vi.fn();
  render(
    <SplitUkProvider value={splitUk}>
      <GoalPlacesPicker idPrefix='p' codes={[]} onChange={onChange} {...props} />
    </SplitUkProvider>,
  );
  return { onChange, select: screen.getByLabelText('Add a place') };
};

// Every country as an option: label lookups only
describe('GoalPlacesPicker', { timeout: 20000 }, () => {
  it('starts empty', () => {
    pick();
    expect(screen.getByText('No places on the list yet.')).toBeTruthy();
    expect(screen.getByText('0 of up to 100 places.')).toBeTruthy();
    expect(screen.queryByText(/want to go/)).toBeNull();
  });

  it('adds a place picked from the list', () => {
    const { onChange, select } = pick({ codes: ['JP'] });
    fireEvent.change(select, { target: { value: 'PE' } });
    expect(onChange).toHaveBeenCalledWith(['JP', 'PE']);
  });

  it('greys out the places already on it and lists them as tags', () => {
    const { select } = pick({ codes: ['JP', 'PE'] });
    expect(select.querySelector('option[value="JP"]').disabled).toBe(true);
    expect(select.querySelector('option[value="FR"]').disabled).toBe(false);
    expect(screen.getByLabelText('Places on the list').querySelectorAll('li').length).toBe(2);
    expect(screen.getByText('2 of up to 100 places.')).toBeTruthy();
  });

  it('takes a place off the list', () => {
    const { onChange } = pick({ codes: ['JP', 'PE'] });
    fireEvent.click(screen.getByLabelText('Take Japan off the list'));
    expect(onChange).toHaveBeenCalledWith(['PE']);
  });

  it('adds the “want to go” countries not on it yet', () => {
    const { onChange } = pick({ codes: ['JP'], wantToGo: ['JP', 'IS', 'NZ'] });
    fireEvent.click(screen.getByText('Add your “want to go” countries (2)'));
    expect(onChange).toHaveBeenCalledWith(['JP', 'IS', 'NZ']);
  });

  it('stops at a hundred places', () => {
    const codes = Array.from({ length: 100 }, (_, i) => `Z${i}`);
    const { onChange, select } = pick({ codes, wantToGo: ['JP'] });
    expect(select.disabled).toBe(true);
    fireEvent.click(screen.getByText(/Add your “want to go” countries/));
    expect(onChange).toHaveBeenCalledWith(codes);
  });

  it('offers the UK’s nations on a map that splits it', () => {
    const { select } = pick({}, true);
    expect(select.querySelector('option[value="XC"]')).toBeTruthy();
    expect(select.querySelector('option[value="GB"]')).toBeNull();
  });
});

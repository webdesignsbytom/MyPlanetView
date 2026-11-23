import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import OneShotsHere from '@/components/oneShots/OneShotsHere';
import { OneShotsContext } from '@/hooks/useOneShots';

// Life's One Shots in a country's ticket (24 Nov 2026): what's been seen there, what's left
const show = (code, name, oneShots = [], open = vi.fn()) => {
  const view = render(
    <OneShotsContext.Provider value={{ oneShots, open }}>
      <OneShotsHere code={code} countryName={name} />
    </OneShotsContext.Provider>,
  );
  return { ...view, open };
};

describe('OneShotsHere', () => {
  it('lists what’s been seen there, and some of what’s still to see, each opening the panel', () => {
    const { container, open } = show('IS', 'Iceland', [{ itemKey: 'puffin', seenOn: '2013-06-01', datePrecision: 'MONTH', countryCode: 'IS' }]);
    expect(container.querySelector('[data-one-shots-here="IS"]')).toBeTruthy();
    const seen = screen.getByRole('list', { name: 'Seen or done in Iceland' });
    expect(seen.textContent).toContain('Atlantic puffin');
    expect(seen.textContent).toContain('Seen: June 2013, in Iceland');
    expect(container.textContent).toMatch(/Still to see here: .*Northern lights.* and \d+ more\./);
    fireEvent.click(screen.getByRole('button', { name: 'Northern lights' }));
    expect(open).toHaveBeenCalledWith('northern-lights');
    fireEvent.click(screen.getByRole('button', { name: 'Atlantic puffin' }));
    expect(open).toHaveBeenCalledWith('puffin');
  });

  it('shows nothing for a place with nothing to see, and plain names where the panel can’t open', () => {
    const { container } = show('LU', 'Luxembourg');
    expect(container.innerHTML).toBe('');
    render(
      <OneShotsContext.Provider value={{ oneShots: [], open: null }}>
        <OneShotsHere code='KE' countryName='Kenya' />
      </OneShotsContext.Provider>,
    );
    expect(screen.queryByRole('button', { name: 'Lion' })).toBeNull();
    expect(screen.getByText(/Still to see here:/).closest('p').textContent).toContain('Lion');
  });
});

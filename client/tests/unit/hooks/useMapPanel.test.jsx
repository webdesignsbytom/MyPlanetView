import React, { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render } from '@testing-library/react';
import useMapPanel from '@/hooks/useMapPanel';

function Panel({ title, onClose, children }) {
  const { titleId, headingRef, panelProps } = useMapPanel(onClose);
  return (
    <div {...panelProps} data-testid={title}>
      <h2 id={titleId} ref={headingRef} tabIndex={-1}>
        {title}
      </h2>
      {children}
    </div>
  );
}

describe('useMapPanel', () => {
  it('is a non-modal dialog named by its heading, which takes focus', () => {
    render(<Panel title='Statistics' onClose={() => {}} />);
    const panel = document.querySelector('[data-map-panel]');
    expect(panel.getAttribute('role')).toBe('dialog');
    expect(panel.getAttribute('aria-modal')).toBe('false');
    const heading = document.getElementById(panel.getAttribute('aria-labelledby'));
    expect(heading.textContent).toBe('Statistics');
    expect(document.activeElement).toBe(heading);
  });

  it('closes on Escape, unless something inside already handled it', () => {
    const onClose = vi.fn();
    const { getByTestId } = render(
      <Panel title='Settings' onClose={onClose}>
        <input aria-label='Name' onKeyDown={(e) => e.key === 'Escape' && e.preventDefault()} />
      </Panel>,
    );
    fireEvent.keyDown(getByTestId('Settings').querySelector('input'), { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.keyDown(getByTestId('Settings'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(getByTestId('Settings'), { key: 'Enter' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('gives focus back to what opened it', () => {
    let toggle;
    function Page() {
      const [open, setOpen] = useState(false);
      toggle = setOpen;
      return (
        <>
          <button>Statistics</button>
          {open && <Panel title='Statistics' onClose={() => setOpen(false)} />}
        </>
      );
    }
    const { getByText } = render(<Page />);
    const opener = getByText('Statistics', { selector: 'button' });
    opener.focus();
    act(() => toggle(true));
    expect(document.activeElement.tagName).toBe('H2');
    act(() => toggle(false));
    expect(document.activeElement).toBe(opener);
  });

  it('gives focus to the map when the opener has gone', () => {
    let setState;
    function Page() {
      const [state, set] = useState({ opener: true, open: false });
      setState = set;
      return (
        <main id='main-content'>
          <svg role='application' tabIndex={0} data-testid='map' />
          {state.opener && <button>Open</button>}
          {state.open && <Panel title='Country' onClose={() => {}} />}
        </main>
      );
    }
    const { getByText, getByTestId } = render(<Page />);
    getByText('Open').focus();
    act(() => setState({ opener: true, open: true }));
    act(() => setState({ opener: false, open: true }));
    act(() => setState({ opener: false, open: false }));
    expect(document.activeElement).toBe(getByTestId('map'));
  });

  it('hands a panel opened from inside another the first one’s opener', () => {
    let setOpen;
    function Page() {
      const [open, set] = useState(null);
      setOpen = set;
      return (
        <>
          <button>Statistics</button>
          {open === 'stats' && (
            <Panel title='Stats' onClose={() => {}}>
              <button>Unplaced photos</button>
            </Panel>
          )}
          {open === 'unplaced' && <Panel title='Unplaced' onClose={() => {}} />}
        </>
      );
    }
    const { getByText } = render(<Page />);
    const opener = getByText('Statistics');
    opener.focus();
    act(() => setOpen('stats'));
    getByText('Unplaced photos').focus();
    act(() => setOpen('unplaced'));
    act(() => setOpen(null));
    expect(document.activeElement).toBe(opener);
  });

  it('leaves focus alone when it is somewhere else on the page', () => {
    let setOpen;
    function Page() {
      const [open, set] = useState(true);
      setOpen = set;
      return (
        <>
          <button>Opener</button>
          <input aria-label='Search' />
          {open && <Panel title='Panel' onClose={() => {}} />}
        </>
      );
    }
    const { getByLabelText } = render(<Page />);
    getByLabelText('Search').focus();
    act(() => setOpen(false));
    expect(document.activeElement).toBe(getByLabelText('Search'));
  });
});

import React, { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render } from '@testing-library/react';
import useModalA11y from '@/hooks/useModalA11y';

function Dialog({ name, onClose, open = true, children }) {
  const ref = useModalA11y(onClose, { open });
  if (!open) return null;
  return (
    <div ref={ref} role='dialog' aria-label={name}>
      <button>{`${name} first`}</button>
      <button disabled>{`${name} off`}</button>
      <button aria-hidden='true'>{`${name} hidden`}</button>
      {children}
      <button>{`${name} last`}</button>
    </div>
  );
}

const key = (k, extra = {}) => fireEvent.keyDown(document.activeElement || document.body, { key: k, ...extra });

describe('useModalA11y', () => {
  it('focuses the first control and locks the page behind', () => {
    const { getByText, unmount } = render(<Dialog name='Share' onClose={() => {}} />);
    expect(document.activeElement).toBe(getByText('Share first'));
    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).toBe('');
  });

  it('closes on Escape', () => {
    const onClose = vi.fn();
    render(<Dialog name='Share' onClose={onClose} />);
    key('Escape');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('keeps Tab inside, skipping disabled and hidden controls', () => {
    const { getByText } = render(<Dialog name='Share' onClose={() => {}} />);
    getByText('Share last').focus();
    key('Tab');
    expect(document.activeElement).toBe(getByText('Share first'));
    key('Tab', { shiftKey: true });
    expect(document.activeElement).toBe(getByText('Share last'));
  });

  it('only the newest dialog answers Escape and Tab', () => {
    const outerClose = vi.fn();
    const innerClose = vi.fn();
    let setInner;
    function Page() {
      const [inner, set] = useState(false);
      setInner = set;
      return (
        <Dialog name='Share' onClose={outerClose}>
          {inner && <Dialog name='Make owner' onClose={innerClose} />}
        </Dialog>
      );
    }
    const { getByText } = render(<Page />);
    // The confirmation opens from inside the open dialog
    act(() => setInner(true));
    expect(document.activeElement).toBe(getByText('Make owner first'));
    key('Escape');
    expect(innerClose).toHaveBeenCalledTimes(1);
    expect(outerClose).not.toHaveBeenCalled();
    // Tab wraps inside the newest dialog only
    getByText('Make owner last').focus();
    key('Tab');
    expect(document.activeElement).toBe(getByText('Make owner first'));
    act(() => setInner(false));
    key('Escape');
    expect(outerClose).toHaveBeenCalledTimes(1);
    expect(innerClose).toHaveBeenCalledTimes(1);
  });

  it('keeps the page locked until the last dialog closes', () => {
    let setBoth;
    function Page() {
      const [open, set] = useState({ a: true, b: true });
      setBoth = set;
      return (
        <>
          {open.a && <Dialog name='A' onClose={() => {}} />}
          {open.b && <Dialog name='B' onClose={() => {}} />}
        </>
      );
    }
    render(<Page />);
    act(() => setBoth({ a: false, b: true }));
    expect(document.body.style.overflow).toBe('hidden');
    act(() => setBoth({ a: false, b: false }));
    expect(document.body.style.overflow).toBe('');
  });

  it('hands focus back to what opened it, when that is still on the page', () => {
    let setOpen;
    function Page() {
      const [open, set] = useState(false);
      setOpen = set;
      return (
        <>
          <button>Open</button>
          <Dialog name='Share' open={open} onClose={() => {}} />
        </>
      );
    }
    const { getByText } = render(<Page />);
    getByText('Open').focus();
    act(() => setOpen(true));
    expect(document.activeElement).toBe(getByText('Share first'));
    act(() => setOpen(false));
    expect(document.activeElement).toBe(getByText('Open'));
  });

  it('does nothing while closed', () => {
    const onClose = vi.fn();
    render(<Dialog name='Share' open={false} onClose={onClose} />);
    key('Escape');
    expect(onClose).not.toHaveBeenCalled();
    expect(document.body.style.overflow).toBe('');
  });

  it('uses the newest onClose it was given', () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = render(<Dialog name='Share' onClose={first} />);
    rerender(<Dialog name='Share' onClose={second} />);
    key('Escape');
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});

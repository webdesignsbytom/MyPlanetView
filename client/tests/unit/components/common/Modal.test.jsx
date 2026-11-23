import React, { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import Modal from '@/components/common/Modal';
import { lockBodyScroll } from '@/utils/layout/bodyScrollLock';

const open = (props = {}) => {
  const onClose = vi.fn();
  const view = render(
    <Modal title='Travel Desk' onClose={onClose} {...props}>
      <button type='button'>First</button>
      <button type='button'>Second</button>
    </Modal>,
  );
  const dialog = document.querySelector('[role="dialog"]');
  return { onClose, dialog, backdrop: dialog.parentElement, ...view };
};

afterEach(() => {
  document.body.style.overflow = '';
});

describe('Modal', () => {
  it('is a modal dialog named by its title strip', () => {
    const { dialog } = open();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    const heading = document.getElementById(dialog.getAttribute('aria-labelledby'));
    expect(heading.textContent).toBe('Travel Desk');
    expect(heading.tagName).toBe('H2');
  });

  it('is never taller than the screen: the title stays and the body scrolls inside', () => {
    const { dialog, backdrop } = open();
    expect(dialog.className).toContain('max-h-full');
    expect(dialog.className).toContain('overflow-hidden');
    expect(dialog.className).toContain('grid-rows-[auto_minmax(0,1fr)]');
    const body = dialog.children[1];
    expect(body.className).toContain('overflow-y-auto');
    expect(body.className).toContain('overscroll-contain');
    // the dimmed page behind it doesn't scroll (a press on its scrollbar closed the dialog)
    expect(backdrop.className).not.toContain('overflow-y-auto');
    expect(backdrop.className).toContain('fixed');
    expect(backdrop.className).toContain('bg-scrim');
  });

  it('is narrow by default, wide when asked, and fills a phone with `fill`', () => {
    expect(open().dialog.className).toContain('max-w-lg');
    document.body.innerHTML = '';
    const wide = open({ wide: true, fill: true });
    expect(wide.dialog.className).toContain('max-w-4xl');
    expect(wide.dialog.className).toContain('phone:h-full');
    expect(wide.backdrop.className).toContain('p-3');
  });

  it('focuses its first control when it opens', () => {
    open();
    // the close stamp comes first, in the title strip
    expect(document.activeElement.getAttribute('aria-label')).toBe('Close');
  });

  it('closes on Escape, on its close stamp and on a press on the dimmed page, never on one inside', () => {
    const { onClose, dialog, backdrop } = open();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalledTimes(2);
    fireEvent.mouseDown(backdrop);
    expect(onClose).toHaveBeenCalledTimes(3);
    fireEvent.mouseDown(dialog);
    fireEvent.mouseDown(screen.getByText('First'));
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it('keeps Tab inside the dialog', () => {
    open();
    const second = screen.getByText('Second');
    second.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement.getAttribute('aria-label')).toBe('Close');
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(second);
  });

  it('locks the page behind it and lets it go when it closes', () => {
    document.body.style.overflow = 'auto';
    const { unmount } = open();
    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).toBe('auto');
  });

  it('hands focus back to what opened it', () => {
    function Opener() {
      const [shown, setShown] = useState(false);
      return (
        <>
          <button type='button' onClick={() => setShown(true)}>
            Open it
          </button>
          {shown ? (
            <Modal title='Box' onClose={() => setShown(false)}>
              <p>Inside</p>
            </Modal>
          ) : null}
        </>
      );
    }
    render(<Opener />);
    const opener = screen.getByText('Open it');
    opener.focus();
    fireEvent.click(opener);
    expect(document.activeElement).not.toBe(opener);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(document.activeElement).toBe(opener);
  });

  it('answers Escape only in the newest of two open dialogs', () => {
    const outer = vi.fn();
    const inner = vi.fn();
    render(
      <>
        <Modal title='Share' onClose={outer}>
          <p>Share</p>
        </Modal>
        <Modal title='Make owner' onClose={inner}>
          <p>Sure?</p>
        </Modal>
      </>,
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(inner).toHaveBeenCalledTimes(1);
    expect(outer).not.toHaveBeenCalled();
  });
});

describe('the counted scroll lock, as dialogs use it', () => {
  it('keeps the page locked until the last of two dialogs closes, whichever closes first', () => {
    document.body.style.overflow = 'scroll';
    const first = lockBodyScroll();
    const second = lockBodyScroll();
    expect(document.body.style.overflow).toBe('hidden');
    // the outer one's clean-up ran first (the share dialog and its confirmation)
    first();
    expect(document.body.style.overflow).toBe('hidden');
    second();
    expect(document.body.style.overflow).toBe('scroll');
  });

  it('counts a release only once', () => {
    document.body.style.overflow = '';
    const first = lockBodyScroll();
    const second = lockBodyScroll();
    first();
    first();
    expect(document.body.style.overflow).toBe('hidden');
    second();
    expect(document.body.style.overflow).toBe('');
  });

  it('leaves the page scrollable when two modals close together', () => {
    document.body.style.overflow = 'visible';
    function Pair() {
      const [shown, setShown] = useState(true);
      return shown ? (
        <>
          <Modal title='Share' onClose={() => setShown(false)}>
            <p>Outer</p>
          </Modal>
          <Modal title='Confirm' onClose={() => setShown(false)}>
            <p>Inner</p>
          </Modal>
        </>
      ) : null;
    }
    render(<Pair />);
    expect(document.body.style.overflow).toBe('hidden');
    act(() => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(document.body.style.overflow).toBe('visible');
  });
});

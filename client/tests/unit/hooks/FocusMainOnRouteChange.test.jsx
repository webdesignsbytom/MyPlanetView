import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import useFocusMainOnRouteChange from '@/hooks/FocusMainOnRouteChange';

let go;
let main;
function Page() {
  useFocusMainOnRouteChange();
  go = useNavigate();
  const { pathname } = useLocation();
  return (
    <>
      <main id='main-content' tabIndex={-1}>
        {pathname}
      </main>
      {pathname === '/legal' && <h2 id='privacy-policy'>Privacy</h2>}
    </>
  );
}

const open = (at = '/') => {
  render(
    <MemoryRouter initialEntries={[at]}>
      <Page />
    </MemoryRouter>,
  );
  main = document.getElementById('main-content');
};

beforeEach(() => {
  vi.stubGlobal('scrollTo', vi.fn());
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  delete Element.prototype.scrollIntoView;
});

describe('useFocusMainOnRouteChange', () => {
  it('leaves the first page alone', async () => {
    open('/');
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(document.activeElement).not.toBe(main);
    expect(window.scrollTo).not.toHaveBeenCalled();
  });

  it('focuses the new page’s main content and scrolls to the top after a route change', async () => {
    open('/');
    act(() => go('/about'));
    await waitFor(() => expect(document.activeElement).toBe(main));
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
  });

  it('scrolls to a #hash once the page has drawn it, focusing the page', async () => {
    open('/');
    act(() => go('/legal#privacy-policy'));
    await waitFor(() => expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ block: 'start' }));
    expect(Element.prototype.scrollIntoView.mock.contexts[0].id).toBe('privacy-policy');
    expect(document.activeElement).toBe(main);
  });

  it('scrolls to the hash on the first load without taking focus', async () => {
    open('/legal#privacy-policy');
    await waitFor(() => expect(Element.prototype.scrollIntoView).toHaveBeenCalled());
    expect(document.activeElement).not.toBe(main);
  });

  it('reads an encoded hash', async () => {
    open('/');
    act(() => go('/legal#privacy%2Dpolicy'));
    await waitFor(() => expect(Element.prototype.scrollIntoView).toHaveBeenCalled());
  });

  it('goes back to where the page was scrolled, once it is tall enough', async () => {
    let scrollY = 0;
    vi.spyOn(window, 'scrollY', 'get').mockImplementation(() => scrollY);
    vi.spyOn(document.documentElement, 'scrollHeight', 'get').mockReturnValue(5000);
    open('/');
    act(() => go('/countries'));
    await waitFor(() => expect(window.scrollTo).toHaveBeenCalledWith(0, 0));
    scrollY = 1200;
    window.dispatchEvent(new Event('scroll'));
    act(() => go('/about'));
    await waitFor(() => expect(window.scrollTo).toHaveBeenCalledTimes(2));
    act(() => go(-1));
    await waitFor(() => expect(window.scrollTo).toHaveBeenLastCalledWith(0, 1200));
    expect(document.activeElement).toBe(main);
  });
});

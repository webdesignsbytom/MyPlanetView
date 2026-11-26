// A shared slideshow's page (pages/show/ShowPage.jsx; 25 Nov 2026; docs/API.md "Photo slideshows")
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { HeadProvider } from 'react-head';
import ShowPage from '@/pages/show/ShowPage';
import { openPhotoShow } from '@/api/photoShowsApi';

vi.mock('@/api/photoShowsApi', () => ({ openPhotoShow: vi.fn() }));
// The slideshow is its own test's: here, what it's given
vi.mock('@/components/map/lazyMapPanels', () => ({
  Slideshow: ({ source, title, intro, photoCount, startSpeed, endNote, onClose }) => (
    <div role='dialog' data-test-slideshow={JSON.stringify({ source, title, intro, photoCount, startSpeed })}>
      {endNote}
      <button type='button' onClick={onClose}>
        Close the slideshow
      </button>
    </div>
  ),
}));
vi.mock('@/components/common/AppPageShell', () => ({ default: ({ children }) => <main>{children}</main> }));

const SHOW = { code: 'SPN2-SHW8-TRP5', title: 'Our favourite photos', seconds: 8, photoCount: 3, coverUrl: '/cover.jpg' };

const visit = (code = 'SPN2-SHW8-TRP5') =>
  render(
    <HeadProvider>
      <MemoryRouter initialEntries={[`/show/${code}`]}>
        <Routes>
          <Route path='/show/:code' element={<ShowPage />} />
        </Routes>
      </MemoryRouter>
    </HeadProvider>,
  );
const slideshow = () => document.querySelector('[data-test-slideshow]');

beforeEach(() => {
  vi.clearAllMocks();
  openPhotoShow.mockResolvedValue({ show: SHOW });
});

describe('ShowPage', () => {
  it('opens the show by its code and plays it at once, from its title, at its speed', async () => {
    visit();
    expect(screen.getByText('Opening the slideshow…')).toBeTruthy();
    expect(await screen.findByText('Our favourite photos', { selector: 'h1' })).toBeTruthy();
    expect(openPhotoShow).toHaveBeenCalledWith('SPN2-SHW8-TRP5');
    expect(JSON.parse(slideshow().getAttribute('data-test-slideshow'))).toEqual({
      source: { showCode: 'SPN2-SHW8-TRP5' },
      title: 'Our favourite photos',
      intro: 'Our favourite photos',
      photoCount: 3,
      startSpeed: 8,
    });
    // The end card asks them to make their own map
    expect(slideshow().querySelector('a').getAttribute('href')).toMatch(/^\/sign-up\?utm_source=show/);
  });

  it('closed, shows the title, how many, the first photo, and plays again', async () => {
    visit();
    await screen.findByText('Close the slideshow');
    fireEvent.click(screen.getByText('Close the slideshow'));
    expect(slideshow()).toBeNull();
    expect(screen.getByText('3 photos')).toBeTruthy();
    expect(document.querySelector('[data-show-page] img').getAttribute('src')).toBe('/cover.jpg');
    expect(screen.getByText('Make your own travel map, free').getAttribute('href')).toMatch(/^\/sign-up\?/);
    fireEvent.click(screen.getByText('Play the slideshow').closest('button'));
    expect(slideshow()).toBeTruthy();
  });

  it('says when it’s gone, or couldn’t be opened', async () => {
    openPhotoShow.mockRejectedValueOnce(Object.assign(new Error('x'), { response: { status: 404 } }));
    const { unmount } = visit('ZZZZ-ZZZZ-ZZZZ');
    expect((await screen.findByRole('alert')).textContent).toBe('This slideshow isn’t there any more. Ask whoever sent it for a new link.');
    expect(slideshow()).toBeNull();
    unmount();
    openPhotoShow.mockRejectedValueOnce(Object.assign(new Error('x'), { friendlyMessage: 'No response from the server.' }));
    visit();
    expect((await screen.findByRole('alert')).textContent).toBe('No response from the server.');
  });
});

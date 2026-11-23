import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import GuessGameDialog from '@/components/guess/GuessGameDialog';
import { createGuessGame, deleteGuessGame, getMapGuessGames } from '@/api/guessApi';
import { getPhotoPage } from '@/api/travelApi';

vi.mock('@/api/guessApi', () => ({ getMapGuessGames: vi.fn(), createGuessGame: vi.fn(), deleteGuessGame: vi.fn() }));
vi.mock('@/api/travelApi', () => ({ getPhotoPage: vi.fn() }));

const photo = (id, countryCode, over = {}) => ({ id, countryCode, thumbUrl: `${id}.jpg`, caption: null, hidden: false, kind: 'PHOTO', ...over });
const PHOTOS = [photo('f1', 'FR'), photo('f2', 'FR'), photo('i1', 'IT'), photo('j1', 'JP'), photo('h1', 'ES', { hidden: true }), photo('u1', null)];
const GAME = { id: 'g1', code: 'GWHR-2WAS-7MAP', title: 'Old game', rounds: 4, plays: 2, best: { name: 'Sam', score: 2980 }, createdAt: '2026-11-17T10:00:00Z' };

describe('GuessGameDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getMapGuessGames.mockResolvedValue({ games: [GAME] });
    getPhotoPage.mockResolvedValue({ photos: PHOTOS });
  });

  it('lists the map’s games with their links, and suggests photos from different countries', async () => {
    render(<GuessGameDialog mapId='m1' onClose={vi.fn()} />);
    expect(await screen.findByText('Old game')).toBeTruthy();
    expect(screen.getByText(/4 photos · played 2 times · best: Sam, 2,980/)).toBeTruthy();
    expect(screen.getByLabelText('Link to Old game').value).toBe(`${window.location.origin}/guess/GWHR-2WAS-7MAP`);
    expect(getPhotoPage).toHaveBeenCalledWith({ mapId: 'm1', limit: 60 });
    // Only the playable four are offered; the first of each country is chosen, then the rest
    const offered = await screen.findAllByLabelText(/^Photo in /);
    expect(offered).toHaveLength(4);
    expect(offered.filter((b) => b.getAttribute('aria-pressed') === 'true')).toHaveLength(4);
  });

  it('makes a game of the photos chosen, in the order pressed', async () => {
    createGuessGame.mockResolvedValue({ game: { ...GAME, id: 'g2', code: 'NEWG-AME2-CODE', title: 'Our trips', plays: 0, best: null, rounds: 3 } });
    render(<GuessGameDialog mapId='m1' onClose={vi.fn()} />);
    await screen.findAllByLabelText(/^Photo in /);
    fireEvent.click(screen.getAllByLabelText('Photo in France')[1]);
    expect(document.querySelector('[data-guess-chosen]').getAttribute('data-guess-chosen')).toBe('3');
    fireEvent.change(screen.getByLabelText('Its title'), { target: { value: 'Our trips' } });
    fireEvent.click(screen.getByText('Make the game'));
    await waitFor(() => expect(createGuessGame).toHaveBeenCalledWith('m1', { title: 'Our trips', photoIds: ['f1', 'i1', 'j1'] }));
    expect(await screen.findByText('Your game is ready')).toBeTruthy();
    expect(screen.getAllByLabelText('Link to Our trips')[0].value).toContain('/guess/NEWG-AME2-CODE');
  });

  it('needs three photos at least', async () => {
    render(<GuessGameDialog mapId='m1' onClose={vi.fn()} />);
    const offered = await screen.findAllByLabelText(/^Photo in /);
    fireEvent.click(offered[0]);
    fireEvent.click(offered[1]);
    expect(screen.getByText('Make the game').closest('button').disabled).toBe(true);
  });

  it('deletes a game', async () => {
    deleteGuessGame.mockResolvedValue({ deleted: true });
    render(<GuessGameDialog mapId='m1' onClose={vi.fn()} />);
    fireEvent.click(await screen.findByText('Delete'));
    await waitFor(() => expect(screen.queryByText('Old game')).toBeNull());
    expect(deleteGuessGame).toHaveBeenCalledWith('g1');
  });

  it('asks an unverified editor to verify first, and says when there are too few photos', async () => {
    const { unmount } = render(<GuessGameDialog mapId='m1' canMake={false} onClose={vi.fn()} />);
    expect(await screen.findByText('Verify your email address to make a game.')).toBeTruthy();
    expect(screen.queryByText('Delete')).toBeNull();
    unmount();
    getPhotoPage.mockResolvedValue({ photos: [photo('a', 'FR')] });
    render(<GuessGameDialog mapId='m1' onClose={vi.fn()} />);
    expect(await screen.findByText(/A game needs at least 3 photos with a country/)).toBeTruthy();
  });
});

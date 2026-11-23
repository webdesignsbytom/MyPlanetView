import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import GuessPage from '@/pages/guess/GuessPage';
import { nameGuessPlay, openGuessGame, sendGuess, startGuessPlay } from '@/api/guessApi';
import { GUESS_PAGE_URL } from '@/utils/constants/routes';
import { headings, onlyMain, renderPage } from '../renderPage';

vi.mock('@/api/guessApi', () => ({ openGuessGame: vi.fn(), startGuessPlay: vi.fn(), sendGuess: vi.fn(), nameGuessPlay: vi.fn() }));
// The map: a button per place to press, and what it shows
vi.mock('@/components/guess/GuessMap', () => ({
  default: ({ chosenCode, answerCode, onChoose }) => (
    <div data-guess-map data-chosen={chosenCode ?? ''} data-answer={answerCode ?? ''}>
      {onChoose && !answerCode ? (
        <button type='button' onClick={() => onChoose('IT')}>
          Press Italy
        </button>
      ) : null}
    </div>
  ),
}));

const CODE = 'GWHR-2WAS-7MAP';
const GAME = { code: CODE, title: 'Guess where we were', mapName: 'Our map', splitUk: false, rounds: [{ url: 'one.jpg' }, { url: 'two.jpg' }] };
const open = () => renderPage(<GuessPage />, { path: GUESS_PAGE_URL, at: `/guess/${CODE}` });

describe('GuessPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    openGuessGame.mockResolvedValue({ game: GAME, leaderboard: [{ name: 'Sam', score: 1500, at: '2026-11-20T10:00:00Z' }] });
    startGuessPlay.mockResolvedValue({ playId: 'p1' });
  });

  it('opens the game with how to play and its board, one main and one h1', async () => {
    open();
    expect(await screen.findByText('Start the game')).toBeTruthy();
    expect(openGuessGame).toHaveBeenCalledWith(CODE);
    expect(onlyMain().count).toBe(1);
    expect(headings()[0]).toBe('Guess where we were');
    expect(screen.getByText(/2 photos from “Our map”/)).toBeTruthy();
    expect(screen.getByText('Sam')).toBeTruthy();
  });

  it('plays a round: choose on the map, guess, see the answer, go on', async () => {
    sendGuess
      .mockResolvedValueOnce({ correct: false, distanceKm: 1104, points: 460, answer: { countryCode: 'FR', countryName: 'France', landmarkName: null }, score: 460, done: false })
      .mockResolvedValueOnce({ correct: true, distanceKm: 0, points: 1000, answer: { countryCode: 'IT', countryName: 'Italy', landmarkName: 'Colosseum' }, score: 1460, done: true });
    open();
    fireEvent.click(await screen.findByText('Start the game'));
    expect(await screen.findByText('Photo 1 of 2')).toBeTruthy();
    expect(screen.getByAltText('Photo 1: where was it taken?').getAttribute('src')).toBe('one.jpg');
    expect(screen.getByText('Guess').closest('button').disabled).toBe(true);
    fireEvent.click(screen.getByText('Press Italy'));
    fireEvent.click(screen.getByText('Guess Italy'));
    await waitFor(() => expect(sendGuess).toHaveBeenCalledWith(CODE, 'p1', { round: 0, countryCode: 'IT' }));
    expect(await screen.findByText('It was France: about 1,104 km from your guess.')).toBeTruthy();
    expect(document.querySelector('[data-guess-map]').getAttribute('data-answer')).toBe('FR');
    expect(screen.getByText(/\+460 points · 460 of 2,000 points so far/)).toBeTruthy();

    fireEvent.click(screen.getByText('Next photo'));
    expect(await screen.findByText('Photo 2 of 2')).toBeTruthy();
    // The list chooses as the map does
    const list = document.getElementById('guess-country');
    fireEvent.change(list, { target: { value: 'IT' } });
    fireEvent.click(screen.getByText('Guess Italy'));
    expect(await screen.findByText('Yes! Colosseum, Italy.')).toBeTruthy();
    fireEvent.click(screen.getByText('See your score'));
    expect(await screen.findByText('1,460 of 2,000 points')).toBeTruthy();
  });

  it('puts the score on the board, then offers sharing and a map of one’s own', async () => {
    sendGuess.mockResolvedValue({ correct: true, distanceKm: 0, points: 1000, answer: { countryCode: 'IT', countryName: 'Italy', landmarkName: null }, score: 1000, done: true });
    nameGuessPlay.mockResolvedValue({ rank: 1, leaderboard: [{ name: 'Jo', score: 1000, at: '2026-11-23T10:00:00Z' }] });
    openGuessGame.mockResolvedValue({ game: { ...GAME, rounds: [{ url: 'one.jpg' }] }, leaderboard: [] });
    open();
    fireEvent.click(await screen.findByText('Start the game'));
    fireEvent.click(await screen.findByText('Press Italy'));
    fireEvent.click(screen.getByText('Guess Italy'));
    fireEvent.click(await screen.findByText('See your score'));
    fireEvent.click(await screen.findByText('Put me on the board'));
    expect(await screen.findByText('Give a name for the board.')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Your name for the leaderboard'), { target: { value: ' Jo ' } });
    fireEvent.click(screen.getByText('Put me on the board'));
    expect(await screen.findByText('You’re number 1 on the board.')).toBeTruthy();
    expect(nameGuessPlay).toHaveBeenCalledWith(CODE, 'p1', 'Jo');
    expect(screen.getByText('Make your own travel map, free').getAttribute('href')).toBe('/sign-up?utm_source=guess&utm_medium=game&utm_campaign=guess-where');

    const writeText = vi.fn().mockResolvedValue();
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    fireEvent.click(screen.getByText('Challenge your friends'));
    expect(await screen.findByText('Copied: paste it to your friends.')).toBeTruthy();
    expect(writeText.mock.calls[0][0]).toBe(`I scored 1,000 of 1,000 points guessing where “Our map” has been. Can you beat me? ${window.location.origin}/guess/${CODE}`);
  });

  it('says so when the game is gone, with a way to make a map', async () => {
    openGuessGame.mockRejectedValue(Object.assign(new Error('x'), { response: { status: 404 } }));
    open();
    expect(await screen.findByText('This game doesn’t exist any more. Ask your friend for a new link.')).toBeTruthy();
    expect(screen.getByText('Make your own travel map')).toBeTruthy();
  });

  it('says why a step failed', async () => {
    startGuessPlay.mockRejectedValue(Object.assign(new Error('x'), { friendlyMessage: 'Too many games just now.' }));
    open();
    fireEvent.click(await screen.findByText('Start the game'));
    expect(await screen.findByText('Too many games just now.')).toBeTruthy();
  });
});

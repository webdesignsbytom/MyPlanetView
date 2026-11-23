import { beforeEach, describe, expect, it, vi } from 'vitest';
import client from '@/api/client';
import { createGuessGame, deleteGuessGame, getMapGuessGames, nameGuessPlay, openGuessGame, sendGuess, startGuessPlay } from '@/api/guessApi';

vi.mock('@/api/client', async () => {
  const { makeFakeClient } = await import('./fakeClient.js');
  return { default: makeFakeClient(), apiHost: '' };
});

beforeEach(() => client.reset());

describe('guessApi', () => {
  it('lists, makes and deletes a map’s games', async () => {
    client.answerWith({ games: [] });
    await expect(getMapGuessGames('m 1')).resolves.toEqual({ games: [] });
    expect(client.get).toHaveBeenCalledWith('/api/maps/m%201/guess-games');
    await createGuessGame('m1', { title: 'T', photoIds: ['a', 'b', 'c'] });
    expect(client.post).toHaveBeenCalledWith('/api/maps/m1/guess-games', { title: 'T', photoIds: ['a', 'b', 'c'] });
    await deleteGuessGame('g1');
    expect(client.delete).toHaveBeenCalledWith('/api/guess-games/g1');
  });

  it('plays a game by its code', async () => {
    await openGuessGame('GWHR-2WAS-7MAP');
    expect(client.get).toHaveBeenCalledWith('/api/guess/GWHR-2WAS-7MAP');
    await startGuessPlay('GWHR-2WAS-7MAP');
    expect(client.post).toHaveBeenCalledWith('/api/guess/GWHR-2WAS-7MAP/plays');
    await sendGuess('GWHR-2WAS-7MAP', 'p1', { round: 0, countryCode: 'FR' });
    expect(client.post).toHaveBeenCalledWith('/api/guess/GWHR-2WAS-7MAP/plays/p1/guesses', { round: 0, countryCode: 'FR' });
    await nameGuessPlay('GWHR-2WAS-7MAP', 'p1', 'Jo');
    expect(client.patch).toHaveBeenCalledWith('/api/guess/GWHR-2WAS-7MAP/plays/p1', { name: 'Jo' });
  });
});

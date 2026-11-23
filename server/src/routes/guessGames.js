import { Router } from 'express';
import {
  deleteGuessGameHandler,
  getGuessGameHandler,
  guessHandler,
  nameGuessPlayHandler,
  startGuessPlayHandler,
} from '../controllers/guessGames.js';
import { requireVerifiedEmail as verified, validateAuthentication } from '../middleware/auth.js';
import { createDbRateLimiter } from '../middleware/dbRateLimit.js';
import { GUESS_PLAY_RATE_LIMIT, GUESS_START_RATE_LIMIT } from '../utils/constants/rateLimitConstants.js';

// "Guess where I was" (docs/API.md "Guess where I was"). Mounted at /api/guess: a game by its
// link's code, for anyone (no sign-in; rate limited per IP); and at /api/guess-games: deleting
// one (its map's editors). Making one is /api/maps/:mapId/guess-games.
const playLimiter = createDbRateLimiter(GUESS_PLAY_RATE_LIMIT);
const startLimiter = createDbRateLimiter(GUESS_START_RATE_LIMIT);

export const guessRouter = Router();
guessRouter.get('/:code', playLimiter, getGuessGameHandler);
guessRouter.post('/:code/plays', playLimiter, startLimiter, startGuessPlayHandler);
guessRouter.post('/:code/plays/:playId/guesses', playLimiter, guessHandler);
guessRouter.patch('/:code/plays/:playId', playLimiter, nameGuessPlayHandler);

export const guessGameRouter = Router();
guessGameRouter.delete('/:gameId', validateAuthentication, verified, deleteGuessGameHandler);

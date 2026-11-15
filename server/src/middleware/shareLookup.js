// Share codes could be guessed through any /api/shared/:code route, not only by
// opening a link. So a photo request whose code matches no map or trip counts
// against the same lookup limit as opening a link (routes/shared.js); a code that
// exists only uses the looser browsing limit, so a visitor isn't blocked after a
// few photos.
import { prisma } from '../prisma.js';
import { normaliseShareCode } from '../utils/shareCodes.js';

/** True when the code can't be a share code, or no map or trip has it. */
export async function shareCodeMatchesNothing(rawCode) {
  const code = normaliseShareCode(rawCode);
  if (!code) return true;
  const map = await prisma.travelMap.findUnique({ where: { shareCode: code }, select: { id: true } });
  if (map) return false;
  const trip = await prisma.trip.findUnique({ where: { shareCode: code }, select: { id: true } });
  return !trip;
}

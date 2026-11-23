import React from 'react';
// Utils
import { points } from '@/utils/guess/guessGame';

// A game's leaderboard: names and scores, best first (`highlight`, a rank, marks the player's own)
function GuessLeaderboard({ rows, highlight = null }) {
  if (!rows?.length) return <p className='text-sm'>No one is on the board yet: be the first.</p>;
  return (
    <ol className='grid gap-1' aria-label='Leaderboard' data-guess-leaderboard>
      {rows.map((row, index) => (
        <li
          key={`${row.name}-${row.at}`}
          className={`grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-2 border-b border-dashed border-poster-brown/40 py-1 text-sm ${
            highlight === index + 1 ? 'font-semibold text-poster-red-deep' : ''
          }`}
        >
          <span className='font-travel'>{index + 1}.</span>
          <span className='truncate'>{row.name}</span>
          <span>{points(row.score)}</span>
        </li>
      ))}
    </ol>
  );
}

export default GuessLeaderboard;

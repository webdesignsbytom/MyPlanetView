import React from 'react';
// Icons
import { FaMedal } from 'react-icons/fa';
// Utils
import { MEDAL_LABELS } from '@/utils/vs/vsWords';

// Each metal's disc and rim, as the country collections' medals (fixed colours)
const METAL = {
  bronze: 'border-medal-bronze-edge bg-medal-bronze',
  silver: 'border-medal-silver-edge bg-medal-silver',
  gold: 'border-medal-gold-edge bg-medal-gold',
};

/** A medal in Vs mode (26 Nov 2026): a small disc in its metal, named for screen readers ("Gold"). */
function VsMedal({ medal, className = 'h-7 w-7 text-xs' }) {
  if (!medal) return null;
  return (
    <span role='img' aria-label={MEDAL_LABELS[medal]} data-medal={medal} className={`inline-grid shrink-0 place-items-center rounded-full border-2 text-poster-ink shadow-paper ${METAL[medal]} ${className}`}>
      <FaMedal aria-hidden='true' />
    </span>
  );
}

export default VsMedal;

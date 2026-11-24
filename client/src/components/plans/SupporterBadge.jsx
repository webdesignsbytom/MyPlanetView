import React from 'react';
// Constants
import { PRICING_PAGE_URL } from '@/utils/constants/routes';
// Utils
import { supporterCover, supporterLinkLabel, supporterWords } from '@/utils/plans/supporterBadge';

// The foil's colour with a pressed-in shade, not the passport's `foil-text` (a gradient clipped to
// the letters under two drop-shadow filters): drawn in Settings on a phone, that held the panel's
// first paint back by about five seconds
const TAG =
  'inline-grid grid-cols-a1a items-center gap-1.5 border border-[var(--foil)] bg-[var(--board)] px-3 py-0.5 font-travel text-sm uppercase leading-tight tracking-wide text-[var(--foil-light)] [text-shadow:0_1px_0_var(--cover-shade)]';

/**
 * The supporter badge (docs/API.md "The supporter badge"; 24 Nov 2026, the user's wish): a
 * paying member's plan as a small leather tag with foil lettering, cut from their passport's
 * cover (First Class black and gold, Business navy and silver), "★ First Class member ★".
 * On the map's banner it's a link to the Pricing page in a new tab, so everyone who opens a
 * shared map can find out about the plans; in Settings (`asLink` false) it's a picture of
 * what the switch shows.
 */
function SupporterBadge({ supporter, asLink = true }) {
  const words = supporterWords(supporter);
  const face = (
    <>
      <span aria-hidden='true' className='text-xs text-[var(--foil)]'>
        ★
      </span>
      <span>{words}</span>
      <span aria-hidden='true' className='text-xs text-[var(--foil)]'>
        ★
      </span>
    </>
  );
  const look = `${supporterCover(supporter)} ${TAG}`;

  if (!asLink) {
    return (
      <span data-supporter-badge={supporter.plan} className={look}>
        {face}
      </span>
    );
  }
  return (
    <a
      href={PRICING_PAGE_URL}
      target='_blank'
      rel='noopener'
      aria-label={supporterLinkLabel(supporter)}
      data-supporter-badge={supporter.plan}
      className={`${look} pointer-events-auto transition hover:brightness-110 focus-visible:outline-[var(--banner-ink)]`}
    >
      {face}
    </a>
  );
}

export default SupporterBadge;

import React, { useId } from 'react';
// The stamps (the account page's backdrop and the loading screen draw them too)
import { ARC_PATH, PASSPORT_STAMPS, TILE_H, TILE_W, drawStamp } from '@/components/common/passportStampArt';

/**
 * A map panel with nothing in it yet (the timeline, the trips, where to go next; 17 Nov 2026,
 * the user's wish: a bare line of text in an empty panel looked bad): a page of the passport
 * waiting for its first stamp. A big round rubber stamp with the panel's icon, a title, what
 * goes here, `steps` (`[{ icon, text }]`: how to add the first), and `children` (the buttons)
 * over the passport stamps, faint in deep red. It fills its panel (MapPanel `fill`), at least
 * 22rem tall.
 * `busy`: the same page while the panel's first list loads (the photo album; 27 Nov 2026, the
 * user's wish: a small spinner at the top looked bad), a status, a dashed ring turning round
 * the stamp (still with reduced motion), and the title its words, not a heading.
 */
function PanelEmptyState({ icon, title, text = null, steps = [], busy = false, children }) {
  const arc = `${useId()}-arc`;
  const Title = busy ? 'p' : 'h3';
  return (
    <section
      role={busy ? 'status' : undefined}
      data-panel-busy={busy ? '' : undefined}
      className='relative grid min-h-[22rem] content-center justify-items-center gap-4 overflow-hidden rounded-lg border-2 border-dashed border-poster-brown/50 bg-paper-cream px-5 py-8 text-center'
    >
      <svg aria-hidden='true' viewBox={`0 0 ${TILE_W} ${TILE_H}`} preserveAspectRatio='xMidYMid slice' className='pointer-events-none absolute inset-0 h-full w-full'>
        <defs>
          <path id={arc} d={ARC_PATH} />
        </defs>
        {PASSPORT_STAMPS.map((stamp, i) => (
          <React.Fragment key={i}>{drawStamp(stamp, arc, 'opacity-[0.07]', 'deep')}</React.Fragment>
        ))}
      </svg>

      <span aria-hidden='true' className='relative grid h-28 w-28 place-items-center'>
        {busy ? (
          <span data-busy-ring='' className='absolute inset-0 rounded-full border-4 border-dashed border-poster-red/60 motion-safe:animate-[spin_5s_linear_infinite]' />
        ) : null}
        <span className='grid h-24 w-24 -rotate-6 place-items-center rounded-full border-[6px] border-double border-poster-red bg-poster-paper text-4xl text-poster-red shadow-paper'>
          {icon}
        </span>
      </span>
      <Title className='relative -rotate-1 font-travel text-2xl uppercase leading-tight tracking-wide text-poster-red-deep'>{title}</Title>
      {text ? <p className='relative max-w-xs text-sm leading-relaxed'>{text}</p> : null}
      {steps.length ? (
        <ol className='relative grid w-full max-w-xs gap-2 text-left'>
          {steps.map((step) => (
            <li key={step.text} className='grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-md bg-poster-paper/70 px-3 py-2 text-sm'>
              <span aria-hidden='true' className='grid h-8 w-8 place-items-center rounded-full border-2 border-poster-brown/60 bg-paper-cream text-poster-red'>
                {step.icon}
              </span>
              <span>{step.text}</span>
            </li>
          ))}
        </ol>
      ) : null}
      {children ? <div className='relative grid w-full max-w-xs gap-2'>{children}</div> : null}
    </section>
  );
}

export default PanelEmptyState;

import React from 'react';

/**
 * The travel-paperwork card every public page is built from: cream paper (it follows
 * light and dark mode) inside the shared `ticket-edge` (thin brown border, dashed
 * printed line, warm shadow).
 * - `title` adds an aged-parchment header strip with the title in the travel face over
 *   a dashed perforation, like the boarding pass (`titleId` names the card for
 *   assistive tech; `headingLevel` 2–4, or 1 when the card is all the page shows, such as an
 *   error; `kicker` is a small line above it).
 * - `action` sits at the right end of that strip (e.g. a list's "Delete All" button).
 * - `header` replaces that strip with your own (e.g. an embedded PageTitleCard).
 * - `as` picks the element: section (default), article, aside, nav…
 * - `bodyClassName` replaces the body's default `gap-4` (pass a gap of your own).
 */
function PaperCard({
  as = 'section',
  title,
  titleId,
  headingLevel = 2,
  kicker,
  action,
  header,
  className = '',
  bodyClassName = '',
  children,
  ...rest
}) {
  const Tag = as;
  const Heading = `h${headingLevel}`;
  return (
    <Tag
      aria-labelledby={title && titleId ? titleId : undefined}
      className={`ticket-edge grid min-w-0 content-start overflow-hidden rounded-lg bg-paper-cream text-colour4 ${className}`}
      {...rest}
    >
      {header ||
        (title ? (
          <header
            className={`paper-aged grid items-center gap-x-4 gap-y-3 border-b-2 border-dashed border-poster-brown px-6 pb-4 pt-5 text-poster-ink sm:px-8 ${
              action ? 'grid-cols-[minmax(0,1fr)_auto]' : ''
            }`}
          >
            <div className='grid min-w-0 gap-1'>
              {kicker ? <p className='font-travel text-xs uppercase tracking-xl text-poster-brown'>{kicker}</p> : null}
              <Heading id={titleId} className='font-travel text-2xl uppercase leading-tight tracking-wide text-poster-red-deep sm:text-3xl'>
                {title}
              </Heading>
            </div>
            {action}
          </header>
        ) : null)}
      <div className={`grid min-w-0 content-start px-6 py-6 sm:px-8 ${bodyClassName || 'gap-4'}`}>{children}</div>
    </Tag>
  );
}

export default PaperCard;

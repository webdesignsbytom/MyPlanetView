import React, { useEffect, useId, useState } from 'react';
// Components
import RadioInput from '@/components/ui/RadioInput';
import DesignColourField from './DesignColourField';
import VisitedFinishPicker from './VisitedFinishPicker';
// Hooks
import useVisitedLookEditor from '@/hooks/useVisitedLookEditor';
// Utils
import { VISITED_LOOKS, readStyleColours, visitedLookOf } from '@/utils/map/mapDesign';

// The map style's own visited colour, which the picker starts from (read from the tokens, as
// MapDesignSection's colours are)
const usualVisited = (styleId) => readStyleColours(styleId, ['--map-visited'])['--map-visited'];

/**
 * Settings, "How it looks", for the owner and co-owners: how the map shows the places visited or
 * lived in (docs/API.md "The visited look"; 25 Nov 2026, the user's wish): a badge on each, as
 * always, one colour over each one's own, or both, the colour, or gold, silver or bronze in its
 * place. The map's own, in every map style (the same day, the user: it showed only in the style
 * whose design set it), so it sits above that style's design. Everyone who opens the map sees it,
 * share links too. Each change shows at once and is saved a moment later (useVisitedLookEditor),
 * with no "Saved." (the user's wish for the Strings panel's colours too): only a failure is said.
 */
function VisitedLookSection({ map, styleId, onSave, preview }) {
  const uid = useId();
  const [usual, setUsual] = useState(() => usualVisited(styleId));
  // Read again when the style changes, once the page has it (Black and white's greys reach <html>
  // in the map page's own effect)
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setUsual(usualVisited(styleId)));
    return () => window.cancelAnimationFrame(frame);
  }, [styleId]);
  const { look, error, change } = useVisitedLookEditor({ map, onSave, preview });
  const shownAs = visitedLookOf(look);

  return (
    <section aria-labelledby={`${uid}-heading`} className='grid gap-4 border-b-2 border-dashed border-poster-brown/50 pb-5' data-visited-look-editor>
      <div className='grid gap-1'>
        <h3 id={`${uid}-heading`} className='font-travel text-lg uppercase leading-tight tracking-wide text-colour9'>
          Places you’ve been
        </h3>
        <p className='text-sm opacity-80'>
          In every map style. Everyone who opens “{map.name}” sees them this way, people you share it with too.
        </p>
      </div>
      <fieldset className='grid gap-2' data-visited-look>
        <legend className='pb-2 text-sm font-medium'>Places you’ve been show as</legend>
        {VISITED_LOOKS.map((option) => (
          <RadioInput
            key={option.id}
            id={`${uid}-look-${option.id}`}
            name={`${uid}-look`}
            value={option.id}
            checked={shownAs === option.id}
            onChange={() => change({ visitedLook: option.id })}
            label={option.label}
          />
        ))}
        {/* A colour of their choosing, or a metallic finish beside it (25 Nov 2026, the user's
            wish: gold, silver, bronze); choosing a colour leaves the metal */}
        {shownAs !== 'BADGE' ? (
          <>
            <DesignColourField
              id={`${uid}-colour`}
              label='Visited country colour'
              value={look.visitedColour}
              usual={usual}
              onChange={(visitedColour) => change({ visitedColour, visitedFinish: null })}
            />
            <VisitedFinishPicker id={`${uid}-finish`} value={look.visitedFinish} onChange={(visitedFinish) => change({ visitedFinish })} />
          </>
        ) : null}
      </fieldset>
      {error ? (
        <p role='alert' className='text-sm font-medium text-status-critical'>
          {error}
        </p>
      ) : null}
    </section>
  );
}

export default VisitedLookSection;

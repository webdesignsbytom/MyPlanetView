import React, { useEffect, useId, useState } from 'react';
// Components
import CheckboxInput from '@/components/ui/CheckboxInput';
import DesignColourField from './DesignColourField';
import DesignCountryColours from './DesignCountryColours';
import DesignPictureField from './DesignPictureField';
// Hooks
import useMapDesignEditor from '@/hooks/useMapDesignEditor';
import useMustVerifyEmail from '@/hooks/useMustVerifyEmail';
// Utils
import { designFor, readStyleColours } from '@/utils/map/mapDesign';
import { mapStyleById } from '@/utils/map/mapStyles';

// The map style's own colours, as the pickers start from them (22 Nov 2026, the user's wish:
// they were always the World map's, so a starry night's showed pastels): read from the tokens
// (a colour picker takes "#rrggbb" only, and the tokens are the one place colours live)
const USUAL_TOKENS = ['--map-visit-1', '--map-visit-2', '--map-visit-3', '--map-visit-4', '--map-visit-5', '--map-visit-6', '--map-visit-7', '--map-ice'];
const readUsualColours = (styleId) => {
  const read = readStyleColours(styleId, ['--map-ink', '--map-grid', '--map-hover', '--map-string', '--map-string-2', ...USUAL_TOKENS]);
  return {
    names: read['--map-ink'],
    grid: read['--map-grid'],
    hover: read['--map-hover'],
    string: read['--map-string'],
    stringTwist: read['--map-string-2'],
    places: read,
  };
};

// Settings, "How it looks", for the owner and co-owners: this map's own design (docs/API.md
// "Map designs"; 21 Nov 2026, the user's wish, free on every plan): a picture for the sea,
// the countries' colours, the names' and grid's, for when chosen colours make them hard to
// see, and the country under the pointer's (23 Nov 2026, the user's wish). One design per map style (22 Nov 2026, the user's wish): this is the one for the
// map's style (`styleId`), and another style keeps its own (SettingsPanel gives each style's
// its own section, keyed by it). Everyone who opens the map sees it, share links too. Each
// change shows on the map at once and is saved a moment later (useMapDesignEditor).
function MapDesignSection({ map, styleId, onDesignChange, preview }) {
  const uid = useId();
  const mustVerify = useMustVerifyEmail();
  const [usual, setUsual] = useState(() => readUsualColours(styleId));
  // Read again when the style changes, once the page has it: Black and white's greys reach
  // <html> in the map page's own effect (useMapTheme), which runs after this one
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setUsual(readUsualColours(styleId)));
    return () => window.cancelAnimationFrame(frame);
  }, [styleId]);
  const editor = useMapDesignEditor({ mapId: map.id, style: styleId, design: designFor(map, styleId), onDesignChange, preview });
  const { design, status, picture } = editor;

  return (
    <section aria-labelledby={`${uid}-heading`} className='grid gap-4 border-b-2 border-dashed border-poster-brown/50 pb-5' data-map-design-editor>
      <div className='grid gap-1'>
        <h3 id={`${uid}-heading`} className='font-travel text-lg uppercase leading-tight tracking-wide text-colour9'>
          This map’s design
        </h3>
        <p className='text-sm opacity-80'>
          A picture of yours on the sea, and your own colours, for the {mapStyleById(styleId).label} style: each style keeps its own.
          Everyone who opens “{map.name}” sees it this way, people you share it with too.
        </p>
      </div>
      {design ? (
        <CheckboxInput
          id={`${uid}-shown`}
          checked={Boolean(design.shown)}
          onChange={(e) => editor.change({ shown: e.target.checked })}
          label='Show this map in its own design'
        />
      ) : null}
      <DesignPictureField
        picture={design?.picture ?? null}
        busy={picture.busy}
        progress={picture.progress}
        locked={mustVerify}
        onChoose={editor.choosePicture}
        onRemove={editor.removePicture}
      />
      <DesignColourField
        id={`${uid}-names`}
        label='Country names'
        value={design?.names ?? null}
        usual={usual.names}
        onChange={(names) => editor.change({ names })}
      />
      <DesignColourField
        id={`${uid}-grid`}
        label='Grid lines'
        value={design?.grid ?? null}
        usual={usual.grid}
        onChange={(grid) => editor.change({ grid })}
      />
      <DesignColourField
        id={`${uid}-hover`}
        label='Country highlight when hovered'
        value={design?.hover ?? null}
        usual={usual.hover}
        onChange={(hover) => editor.change({ hover })}
      />
      {/* The strings between places (the Strings tool; 23 Nov 2026, the user's wish), with an
          opacity for see-through ones (25 Nov 2026, the user's wish) */}
      <DesignColourField
        id={`${uid}-string`}
        label='String colour'
        value={design?.string ?? null}
        usual={usual.string}
        onChange={(string) => editor.change({ string })}
        alpha
      />
      {/* A second colour twisted in, as baker's twine (25 Nov 2026, the user's wish): ticked, it
          starts as the style's usual one (the cream of red-and-white twine); its "Usual" goes
          back to that, and unticking makes the strings one colour again */}
      <CheckboxInput
        id={`${uid}-twist`}
        checked={Boolean(design?.stringTwist)}
        onChange={(e) => editor.change({ stringTwist: e.target.checked ? usual.stringTwist : null })}
        label='Two colours twisted together'
      />
      {design?.stringTwist ? (
        <DesignColourField
          id={`${uid}-twist-colour`}
          label='Second string colour'
          value={design.stringTwist === usual.stringTwist ? null : design.stringTwist}
          usual={usual.stringTwist}
          onChange={(colour) => editor.change({ stringTwist: colour ?? usual.stringTwist })}
        />
      ) : null}
      <DesignCountryColours
        countries={design?.countries}
        usual={usual.places}
        onChange={editor.setCountryColour}
        onResetAll={() => editor.change({ countries: {} })}
      />
      {status.error ? (
        <p role='alert' className='text-sm font-medium text-status-critical'>
          {status.error}
        </p>
      ) : (
        <p aria-live='polite' className='text-sm opacity-80'>
          {status.state === 'saving' ? 'Saving…' : status.state === 'saved' ? 'Saved.' : ''}
        </p>
      )}
    </section>
  );
}

export default MapDesignSection;

import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
// Components
import MapPanel from './MapPanel';
import StringsTab from './StringsTab';
// Hooks
import useMapDesignEditor from '@/hooks/useMapDesignEditor';
// Utils
import { designFor, readStyleColours } from '@/utils/map/mapDesign';
import { stringsOfKind } from '@/utils/map/mapStrings';

// The tabs (25 Nov 2026, the user's wish: the visited and the planned strings apart)
const TABS = [
  { id: 'VISITED', label: 'Visited' },
  { id: 'PLANNED', label: 'Planned' },
];

// The map style's own string colours, as the pickers start from them (the tokens are the one
// place colours live; a colour picker takes "#rrggbb" only)
const readUsualColours = (styleId) => {
  const read = readStyleColours(styleId, ['--map-string', '--map-string-2', '--map-plan-string', '--map-plan-string-2']);
  return {
    VISITED: { colour: read['--map-string'], twist: read['--map-string-2'] },
    PLANNED: { colour: read['--map-plan-string'], twist: read['--map-plan-string-2'] },
  };
};

/**
 * The Strings tool (docs/API.md "Strings"; 23 Nov 2026, the user's wish): thread between places,
 * as on a corkboard, in two tabs (25 Nov 2026, the user's wish): "Visited", between the places
 * been to, and "Planned", between the places planned, in a colour of its own (StringsTab). Each
 * tab has its strings, its switch on the map (`shown[kind]`, `onShowStrings(kind, on)`: the
 * viewer's own settings), string mode for it (`onStringMode(kind)`), the automatic ones, and
 * its colours in the map's design for the map's style (`styleId`), here so they're "all in one
 * place": the owner and co-owners (`onDesignChange`, useTravelMap's setDesign) change them as
 * Settings' "How it looks" changes the rest, shown at once through `designPreview`. Editors
 * only; `locked` while the email isn't verified (the server refuses). The tabs follow the ARIA
 * tabs pattern, as Settings' do.
 */
function StringsPanel({
  map,
  strings = [],
  shown = { VISITED: true, PLANNED: true },
  onShowStrings,
  locked = false,
  styleId,
  onDesignChange = null,
  designPreview,
  onTie,
  onTieAuto,
  onUntie,
  onUntieAll,
  onStringMode,
  onClose,
}) {
  const uid = useId();
  const [tab, setTab] = useState('VISITED');
  const tabsRef = useRef(null);
  const tabId = (id) => `${uid}-tab-${id}`;
  const panelId = (id) => `${uid}-panel-${id}`;

  // One editor for both kinds' colours, as Settings has one for the rest of the design
  const editor = useMapDesignEditor({ mapId: map.id, style: styleId, design: designFor(map, styleId), onDesignChange, preview: designPreview });
  const [usual, setUsual] = useState(() => readUsualColours(styleId));
  // Read again once the page has the style (Black and white's greys reach <html> in an effect)
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setUsual(readUsualColours(styleId)));
    return () => window.cancelAnimationFrame(frame);
  }, [styleId]);
  const byKind = useMemo(() => Object.fromEntries(TABS.map((t) => [t.id, stringsOfKind(strings, t.id)])), [strings]);

  const handleTabKeys = (e) => {
    const index = TABS.findIndex((t) => t.id === tab);
    const next = { ArrowRight: (index + 1) % TABS.length, ArrowLeft: (index - 1 + TABS.length) % TABS.length, Home: 0, End: TABS.length - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    setTab(TABS[next].id);
    tabsRef.current?.querySelectorAll('[role="tab"]')[next]?.focus();
  };

  return (
    <MapPanel title='Strings' onClose={onClose}>
      <div className='grid gap-4' data-strings-panel>
        <div ref={tabsRef} role='tablist' aria-label='Strings' onKeyDown={handleTabKeys} className='grid grid-cols-2 gap-2 border-b-2 border-poster-brown px-1'>
          {TABS.map((t) => (
            <button
              key={t.id}
              id={tabId(t.id)}
              type='button'
              role='tab'
              aria-selected={tab === t.id}
              aria-controls={panelId(t.id)}
              tabIndex={tab === t.id ? 0 : -1}
              onClick={() => setTab(t.id)}
              className={`border-2 border-b-0 border-poster-brown px-3 pb-1.5 pt-2 font-travel text-base uppercase leading-tight tracking-wide transition ${
                tab === t.id ? 'paper-aged translate-y-0.5 text-poster-red-deep' : 'border-dashed bg-paper-cream text-colour9 hover:brightness-95'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {/* Both stay on the page (the closed one hidden), so each tab's aria-controls has its panel */}
        {TABS.map((t) => (
          <div key={t.id} role='tabpanel' id={panelId(t.id)} aria-labelledby={tabId(t.id)} tabIndex={0} hidden={tab !== t.id}>
            <StringsTab
              kind={t.id}
              strings={byKind[t.id]}
              shown={shown[t.id] !== false}
              onShow={(on) => onShowStrings(t.id, on)}
              locked={locked}
              colours={onDesignChange ? { design: editor.design, usual: usual[t.id], onChange: editor.change, status: editor.status } : null}
              onTie={onTie}
              onTieAuto={onTieAuto}
              onUntie={onUntie}
              onUntieAll={onUntieAll}
              onStringMode={onStringMode}
            />
          </div>
        ))}
      </div>
    </MapPanel>
  );
}

export default StringsPanel;

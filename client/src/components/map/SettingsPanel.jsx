import React, { useId, useRef, useState } from 'react';
// Components
import MapPanel from './MapPanel';
import MapStylePicker from './MapStylePicker';
import MapTypePicker from './MapTypePicker';
import MapSettingsToggles from './MapSettingsToggles';
import DeleteMapSection from './DeleteMapSection';
import MainMapSection from './MainMapSection';
import MapDownloadSection from './MapDownloadSection';
import MapSetupForm from '@/components/onboarding/MapSetupForm';
// Utils
import { saveMapSetup } from '@/utils/map/saveMapSetup';

const TABS = [
  { id: 'view', label: 'How it looks' },
  { id: 'map', label: 'This map' },
];

// Settings: how the map looks to you (yours alone, on every map), and, for editors,
// this map's travellers and its photos as a zip ("Print or download"); for the owner, its
// name, group, making it the main map (the one the plan includes) and deletion. The two tabs are
// ticket tabs: the open one is parchment and sits on the panel's brown rule. They follow
// the ARIA tabs pattern: only the open tab is in the tab order, the arrow keys (and Home,
// End) move between tabs and open them, and each tab names its panel.
function SettingsPanel({ settings, onChangeSetting, map, canEdit, isOwner, locked = false, onMapSaved, onMapDeleted, onClose }) {
  const [tab, setTab] = useState('view');
  const showTabs = Boolean(map) && canEdit;
  const uid = useId();
  const tabsRef = useRef(null);
  const tabId = (id) => `${uid}-tab-${id}`;
  const panelId = (id) => `${uid}-panel-${id}`;

  const handleTabKeys = (e) => {
    const index = TABS.findIndex((t) => t.id === tab);
    const next = {
      ArrowRight: (index + 1) % TABS.length,
      ArrowLeft: (index - 1 + TABS.length) % TABS.length,
      Home: 0,
      End: TABS.length - 1,
    }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    setTab(TABS[next].id);
    tabsRef.current?.querySelectorAll('[role="tab"]')[next]?.focus();
  };

  // The open panel, labelled by its tab (no tab semantics when there's only one)
  const panelProps = (id) =>
    showTabs ? { role: 'tabpanel', id: panelId(id), 'aria-labelledby': tabId(id), tabIndex: 0 } : {};

  return (
    <MapPanel title='Settings' onClose={onClose}>
      {showTabs ? (
        <div
          ref={tabsRef}
          role='tablist'
          aria-label='Settings'
          onKeyDown={handleTabKeys}
          className='grid grid-cols-2 gap-2 border-b-2 border-poster-brown px-1'
        >
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
      ) : null}

      {/* Both panels stay on the page (the closed one hidden), so every tab's
          aria-controls has its panel, and a half-filled map form survives a look at the other tab */}
      <div {...panelProps('view')} hidden={showTabs && tab !== 'view'} className='grid gap-5'>
        <MapStylePicker value={settings.style} onChange={(style) => onChangeSetting('style', style)} />
        <MapTypePicker value={settings.mapType} onChange={(type) => onChangeSetting('mapType', type)} />
        <MapSettingsToggles settings={settings} onChange={onChangeSetting} />
      </div>
      {showTabs ? (
        <div {...panelProps('map')} hidden={tab !== 'map'} className='grid gap-5'>
          <MapSetupForm
            // Fresh after each save, so new travellers carry their ids
            key={`${map.name}|${map.groupType}|${map.travellers.map((t) => `${t.id}:${t.name}`).join(',')}`}
            initial={map}
            canRename={isOwner}
            splitUkNote
            submitLabel='Save map'
            onSubmit={async (form) => {
              await saveMapSetup(map.id, map, form, { canRename: isOwner });
              await onMapSaved();
            }}
          />
          <MapDownloadSection map={map} />
          {isOwner && !map.isDefault ? <MainMapSection map={map} locked={locked} onChanged={onMapSaved} /> : null}
          {isOwner && !map.isDefault ? <DeleteMapSection map={map} locked={locked} onDeleted={onMapDeleted} /> : null}
        </div>
      ) : null}
    </MapPanel>
  );
}

export default SettingsPanel;

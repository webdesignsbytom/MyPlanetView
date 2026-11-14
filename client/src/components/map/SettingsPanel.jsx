import React, { useState } from 'react';
// Components
import MapPanel from './MapPanel';
import MapStylePicker from './MapStylePicker';
import MapTypePicker from './MapTypePicker';
import MapSettingsToggles from './MapSettingsToggles';
import DeleteMapSection from './DeleteMapSection';
import MapSetupForm from '@/components/onboarding/MapSetupForm';
// Utils
import { saveMapSetup } from '@/utils/map/saveMapSetup';

const TABS = [
  { id: 'view', label: 'How it looks' },
  { id: 'map', label: 'This map' },
];

// Settings: how the map looks to you (yours alone, on every map), and, for editors,
// this map's travellers; for the owner, its name, group and deletion. The two tabs are
// ticket tabs: the open one is parchment and sits on the panel's brown rule.
function SettingsPanel({ settings, onChangeSetting, map, canEdit, isOwner, onMapSaved, onMapDeleted, onClose }) {
  const [tab, setTab] = useState('view');
  const showTabs = Boolean(map) && canEdit;

  return (
    <MapPanel title='Settings' onClose={onClose}>
      {showTabs ? (
        <div role='tablist' aria-label='Settings' className='grid grid-cols-2 gap-2 border-b-2 border-poster-brown px-1'>
          {TABS.map((t) => (
            <button
              key={t.id}
              type='button'
              role='tab'
              aria-selected={tab === t.id}
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

      {tab === 'view' || !showTabs ? (
        <div role={showTabs ? 'tabpanel' : undefined} className='grid gap-5'>
          <MapStylePicker value={settings.style} onChange={(style) => onChangeSetting('style', style)} />
          <MapTypePicker value={settings.mapType} onChange={(type) => onChangeSetting('mapType', type)} />
          <MapSettingsToggles settings={settings} onChange={onChangeSetting} />
        </div>
      ) : (
        <div role='tabpanel' className='grid gap-5'>
          <MapSetupForm
            // Fresh after each save, so new travellers carry their ids
            key={`${map.name}|${map.groupType}|${map.travellers.map((t) => `${t.id}:${t.name}`).join(',')}`}
            initial={map}
            canRename={isOwner}
            submitLabel='Save map'
            onSubmit={async (form) => {
              await saveMapSetup(map.id, map, form, { canRename: isOwner });
              await onMapSaved();
            }}
          />
          {isOwner && !map.isDefault ? <DeleteMapSection map={map} onDeleted={onMapDeleted} /> : null}
        </div>
      )}
    </MapPanel>
  );
}

export default SettingsPanel;

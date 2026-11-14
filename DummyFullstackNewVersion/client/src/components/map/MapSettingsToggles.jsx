import React from 'react';
// Components
import SwitchInput from '@/components/ui/SwitchInput';
// Utils
import { MAP_SETTING_GROUPS, MAP_SETTING_TOGGLES } from '@/utils/map/mapSettings';

// The on/off settings from the old map pages (my_planet added the visited filters and
// the banner), in three groups.
function MapSettingsToggles({ settings, onChange }) {
  return (
    <div className='grid gap-4'>
      {MAP_SETTING_GROUPS.map((group) => (
        <fieldset key={group.id} className='grid gap-3'>
          <legend className='text-sm font-semibold'>{group.legend}</legend>
          {MAP_SETTING_TOGGLES.filter((toggle) => toggle.group === group.id).map((toggle) => (
            <SwitchInput
              key={toggle.key}
              id={`setting-${toggle.key}`}
              name={toggle.key}
              label={toggle.label}
              checked={settings[toggle.key]}
              onChange={(e) => onChange(toggle.key, e.target.checked)}
              disabled={toggle.key === 'showGridLabels' && !settings.showGrid && settings.mapType !== 'detailed'}
            />
          ))}
        </fieldset>
      ))}
    </div>
  );
}

export default MapSettingsToggles;

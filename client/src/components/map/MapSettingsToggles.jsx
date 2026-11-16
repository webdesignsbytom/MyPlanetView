import React, { useId } from 'react';
// Components
import SwitchInput from '@/components/ui/SwitchInput';
// Utils
import { MAP_SETTING_GROUPS, MAP_SETTING_TOGGLES } from '@/utils/map/mapSettings';

// The on/off settings from the old map pages (my_planet added the visited filters and
// the banner), in four groups.
// The Detailed map type always draws the lines, their labels and the names, so those
// switches are locked on there, with a note saying why. The banner only fits on wide
// screens, so its switch only shows there too.
function MapSettingsToggles({ settings, onChange }) {
  const detailedNoteId = useId();
  const detailed = settings.mapType === 'detailed';

  return (
    <div className='grid gap-6'>
      {MAP_SETTING_GROUPS.map((group) => {
        const toggles = MAP_SETTING_TOGGLES.filter((toggle) => toggle.group === group.id);
        const showNote = detailed && toggles.some((toggle) => toggle.detailed);
        return (
          <fieldset key={group.id} className='grid gap-3'>
            {/* A legend sits outside the fieldset's grid, so gap-3 doesn't reach it: its
                own bottom padding gives the same space before the first switch. */}
            <legend className='pb-3 font-travel text-lg uppercase leading-tight tracking-wide text-colour9'>{group.legend}</legend>
            {showNote ? (
              <p id={detailedNoteId} className='text-sm'>
                The Detailed map always shows these. Pick Regular under Map type to choose for yourself.
              </p>
            ) : null}
            {toggles.map((toggle) => {
              const locked = detailed && toggle.detailed;
              return (
                <SwitchInput
                  key={toggle.key}
                  id={`setting-${toggle.key}`}
                  name={toggle.key}
                  label={toggle.label}
                  checked={locked || settings[toggle.key]}
                  onChange={(e) => onChange(toggle.key, e.target.checked)}
                  disabled={locked || (toggle.key === 'showGridLabels' && !settings.showGrid)}
                  ariaDescribedBy={locked ? detailedNoteId : undefined}
                  wrapperClassName={toggle.wideOnly ? 'max-lg:hidden' : ''}
                />
              );
            })}
          </fieldset>
        );
      })}
    </div>
  );
}

export default MapSettingsToggles;

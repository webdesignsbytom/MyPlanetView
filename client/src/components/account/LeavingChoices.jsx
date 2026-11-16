import React from 'react';
// Components
import FormField from '@/components/ui/FormField';
import PlainOptionSelect from '@/components/ui/PlainOptionSelect';
import CheckboxInput from '@/components/ui/CheckboxInput';
// Utils
import { ROLE_LABELS } from '@/utils/sharing/shareRoles';
import { plural } from '@/utils/functions/plural';
import { DELETE_MAP } from '@/utils/plans/leaving';

// Before an account is deleted (GET /users/leaving-options, docs/API.md "Leaving"): for
// each map it owns, give it to someone on it or delete it, and whether the photos added to
// other people's maps stay there (ticked by default). `choices` is { mapId: userId | 'DELETE' }.
function LeavingChoices({ options, choices, onChoose, leavePhotos, onLeavePhotosChange, disabled = false }) {
  return (
    <div className='grid gap-4'>
      {options.maps.length ? (
        <fieldset className='grid gap-3' disabled={disabled}>
          <legend className='text-sm font-medium'>Your maps</legend>
          {options.maps.map((map) =>
            map.members.length ? (
              <FormField key={map.id} id={`leaving-map-${map.id}`} label={`“${map.name}”`}>
                <PlainOptionSelect
                  value={choices[map.id] || DELETE_MAP}
                  onChange={(e) => onChoose(map.id, e.target.value)}
                  options={[
                    ...map.members.map((m) => ({
                      value: m.userId,
                      label: `Give to ${m.name || 'someone on it'} (${(ROLE_LABELS[m.role] || m.role).toLowerCase()})`,
                    })),
                    { value: DELETE_MAP, label: 'Delete it' },
                  ]}
                />
              </FormField>
            ) : (
              <p key={map.id} className='text-sm'>
                “{map.name}” is deleted: nobody else is on it.
              </p>
            ),
          )}
          <p className='text-xs opacity-80'>
            A map you give away keeps every trip and photo on it, yours included, and its new owner’s plan decides its limits.
          </p>
        </fieldset>
      ) : null}

      <div className='grid gap-1'>
        <CheckboxInput
          id='leaving-photos'
          checked={leavePhotos}
          disabled={disabled}
          onChange={(e) => onLeavePhotosChange(e.target.checked)}
          label='Leave my photos on maps shared with me'
        />
        <p className='text-xs opacity-80'>
          {options.photosOnOtherMaps
            ? `You added ${plural(options.photosOnOtherMaps, 'photo')} to other people’s maps. Left there, they become each map owner’s; otherwise they’re deleted.`
            : 'You haven’t added photos to other people’s maps.'}
        </p>
      </div>
    </div>
  );
}

export default LeavingChoices;

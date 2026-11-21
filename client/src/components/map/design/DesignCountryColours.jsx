import React, { useId, useMemo, useState } from 'react';
// Components
import Button from '@/components/common/Button';
import FormField from '@/components/ui/FormField';
import TextInput from '@/components/ui/TextInput';
import DesignCountryRow from './DesignCountryRow';
// Hooks
import useSplitUk from '@/hooks/useSplitUk';
// Utils
import { colourablePlaces, usualColourToken } from '@/utils/map/mapDesign';

// "São Tomé" found by "sao tome"
const plain = (text) => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

// A map design's country colours (docs/API.md "Map designs"): every place the map draws (the
// UK's nations on a map that splits it, Antarctica, the regions), each with its own colour
// picker, behind a button so Settings stays short; a search to find one, and a way back to
// the usual colours for all of them. `usual` holds the World map's colours by token.
function DesignCountryColours({ countries, usual, onChange, onResetAll }) {
  const splitUk = useSplitUk();
  const uid = useId();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const places = useMemo(() => colourablePlaces(splitUk), [splitUk]);
  const listed = useMemo(() => {
    const wanted = plain(search.trim());
    return wanted ? places.filter((place) => plain(place.name).includes(wanted)) : places;
  }, [places, search]);
  const colours = countries || {};
  const coloured = places.filter((place) => colours[place.code]).length;

  return (
    <div className='grid gap-2'>
      <div className='grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2'>
        <p className='text-sm font-medium'>
          Country colours
          <span className='block text-xs font-normal opacity-80'>
            {coloured ? `${coloured} of ${places.length} coloured your way` : 'Every country in its usual colour'}
          </span>
        </p>
        <Button small quiet ariaExpanded={open} onClick={() => setOpen((was) => !was)}>
          {open ? 'Hide the countries' : 'Choose colours'}
        </Button>
      </div>
      {open ? (
        <div className='grid gap-2'>
          <FormField id={`${uid}-search`} label='Find a country' align='start'>
            <TextInput type='search' value={search} onChange={(e) => setSearch(e.target.value)} autoComplete='off' />
          </FormField>
          {listed.length ? (
            <ul aria-label='Country colours' className='grid max-h-80 overflow-y-auto border-y-2 border-dashed border-poster-brown/50 px-1'>
              {listed.map((place) => (
                <DesignCountryRow
                  key={place.code}
                  code={place.code}
                  name={place.name}
                  colour={colours[place.code] ?? null}
                  usual={usual[usualColourToken(place.code)]}
                  onChange={onChange}
                />
              ))}
            </ul>
          ) : (
            <p className='text-sm'>No country is called that.</p>
          )}
          {coloured ? (
            <Button small quiet onClick={onResetAll}>
              Every country in its usual colour
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default DesignCountryColours;

import React, { useId, useMemo, useState } from 'react';
// Icons
import { FaPlane, FaShareAlt } from 'react-icons/fa';
// Hooks
import useOneShotPhotos from '@/hooks/useOneShotPhotos';
// Components
import MapPanel from '@/components/map/MapPanel';
import MapActionButton from '@/components/map/MapActionButton';
import Button from '@/components/common/Button';
import InlineAlert from '@/components/common/InlineAlert';
import LoadingSpinner from '@/components/utils/LoadingSpinner';
import OneShotCard from './OneShotCard';
import OneShotDialog from './OneShotDialog';
// Utils
import { ONE_SHOT_BY_KEY, ONE_SHOT_LISTS } from '@/utils/oneShots/oneShotItems';
import { ONE_SHOT_LIST_LABELS, ONE_SHOTS_NAME, oneShotGroups, oneShotProgress, progressWords } from '@/utils/oneShots/oneShotWords';
import { oneShotPhotoInfo } from '@/utils/oneShots/oneShotPhotoInfo';
import { formatDay } from '@/utils/functions/dates';
import { countryName } from '@/utils/map/countries';

// What a suggestion says it came from
function suggestionWords(suggestion) {
  if (suggestion.from === 'FLIGHT') {
    const { fromAirport, toAirport, flownOn } = suggestion.flight;
    return `Your flight from ${fromAirport} to ${toAirport}, ${formatDay(flownOn)}`;
  }
  return `You’ve been to the ${countryName(suggestion.code)}`;
}

/**
 * Life's One Shots (24 Nov 2026, the user's wish and name; docs/API.md "Life's One Shots"), a
 * wide map panel: the three lists as tabs, each with how far along it is and its items in
 * their groups (OneShotCard), any item opening over it (OneShotDialog). For the owner and
 * editors (`canEdit`), what the flight log and the poles suggest ticking comes first, each a
 * press away; "Share a picture" (`onShareCard`, never on a share link) makes a share card.
 * `uploader` (the map page's upload settings) lets a tick's dialog upload its photos.
 * `oneShots` is the page's useOneShots; `onSave(itemKey, body)` and `onRemove(itemKey)` are
 * its, wrapped by the map page (a first tick is celebrated). `focusKey` opens one item at once
 * (a country's ticket's "seen here").
 */
function OneShotsPanel({ oneShots, canEdit = false, locked = false, travellers = [], photoSource = null, uploader = null, focusKey = null, onSave, onRemove, onShareCard = null, onClose }) {
  const tabsId = useId();
  const photos = useOneShotPhotos();
  const focused = focusKey ? ONE_SHOT_BY_KEY.get(focusKey) : null;
  const [list, setList] = useState(focused?.list || 'WILDLIFE');
  // The open item: `{ key, start }` (`start`: a suggestion's day and source)
  const [open, setOpen] = useState(focused ? { key: focused.key, start: null } : null);
  const ticks = oneShots.oneShots;
  const tickOf = useMemo(() => new Map(ticks.map((tick) => [tick.itemKey, tick])), [ticks]);
  const progress = useMemo(() => oneShotProgress(ticks), [ticks]);
  const groups = useMemo(() => oneShotGroups(list), [list]);
  const suggestions = canEdit && !locked ? oneShots.suggestions : [];
  const openItem = open ? ONE_SHOT_BY_KEY.get(open.key) : null;

  // The arrow keys move between the tabs, as a tab list should
  const onTabKey = (e) => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    const next = ONE_SHOT_LISTS[(ONE_SHOT_LISTS.indexOf(list) + step + ONE_SHOT_LISTS.length) % ONE_SHOT_LISTS.length];
    setList(next);
    document.getElementById(`${tabsId}-tab-${next}`)?.focus();
  };

  return (
    <MapPanel title={ONE_SHOTS_NAME} onClose={onClose} wide>
      <p className='text-sm'>Things seen or done once in a lifetime: wildlife, nature’s wonders and great journeys. {canEdit ? 'Tick the ones you’ve had.' : ''}</p>

      {oneShots.loading ? (
        <div className='grid place-items-center py-6' role='status'>
          <LoadingSpinner md />
          <span className='sr-only'>Loading Life’s One Shots…</span>
        </div>
      ) : null}
      <InlineAlert>{oneShots.error}</InlineAlert>

      {suggestions.length ? (
        <section className='grid gap-2 rounded-sm border-2 border-dashed border-poster-brown/60 px-3 py-2.5' aria-labelledby={`${tabsId}-suggested`} data-one-shot-suggestions=''>
          <h3 id={`${tabsId}-suggested`} className='font-travel text-base uppercase tracking-wide text-colour9'>
            From your travels
          </h3>
          <ul className='grid gap-2'>
            {suggestions.map((suggestion) => (
              <li key={suggestion.itemKey} className='grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 text-sm'>
                <FaPlane aria-hidden='true' className='text-poster-red' />
                <span>
                  <span className='font-semibold'>{ONE_SHOT_BY_KEY.get(suggestion.itemKey)?.name}</span>
                  <span className='block text-xs opacity-80'>{suggestionWords(suggestion)}</span>
                </span>
                <Button
                  small
                  onClick={() =>
                    setOpen({
                      key: suggestion.itemKey,
                      start: suggestion.from === 'FLIGHT' ? { seenOn: suggestion.seenOn, datePrecision: 'DAY', source: 'FLIGHT' } : null,
                    })
                  }
                  ariaLabel={`Tick ${ONE_SHOT_BY_KEY.get(suggestion.itemKey)?.name}`}
                >
                  Tick it
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* On phones the tabs take the row and the share button goes under them */}
      <div className='grid gap-2 nophone:grid-cols-[minmax(0,1fr)_auto] nophone:items-end'>
        <div role='tablist' aria-label='The lists' className='grid grid-cols-3 gap-1.5' onKeyDown={onTabKey}>
          {ONE_SHOT_LISTS.map((id) => (
            <button
              key={id}
              id={`${tabsId}-tab-${id}`}
              type='button'
              role='tab'
              aria-selected={list === id}
              aria-controls={`${tabsId}-panel`}
              tabIndex={list === id ? 0 : -1}
              onClick={() => setList(id)}
              className={`grid gap-0.5 rounded-t-md border-2 border-b-0 px-2 py-1.5 text-left transition ${
                list === id ? 'border-poster-brown bg-poster-paper text-poster-ink' : 'border-transparent hover:bg-colour9/10'
              }`}
            >
              <span className='font-travel text-xs uppercase leading-tight tracking-wide [overflow-wrap:anywhere] nophone:text-sm'>{ONE_SHOT_LIST_LABELS[id]}</span>
              <span className='text-2xs' data-one-shot-progress={id}>
                {progress[id].have} of {progress[id].total}
              </span>
            </button>
          ))}
        </div>
        {onShareCard && ticks.length ? (
          <span className='grid justify-items-start phone:row-start-2'>
          <MapActionButton onClick={onShareCard}>
            <FaShareAlt aria-hidden='true' className='self-center text-sm' />
            <span>Share a picture</span>
          </MapActionButton>
          </span>
        ) : null}
      </div>

      <div id={`${tabsId}-panel`} role='tabpanel' aria-labelledby={`${tabsId}-tab-${list}`} className='grid gap-5'>
        <p className='text-sm font-medium'>{progressWords(list, progress[list])}.</p>
        {groups.map((group) => (
          <section key={group.group} className='grid gap-2' aria-labelledby={`${tabsId}-${group.group}`}>
            <h3 id={`${tabsId}-${group.group}`} className='font-travel text-lg uppercase leading-tight tracking-wide text-colour9'>
              {group.label}
            </h3>
            <ul className='grid grid-cols-[repeat(auto-fill,minmax(8.5rem,1fr))] gap-x-3 gap-y-4'>
              {group.items.map((item) => (
                <OneShotCard key={item.key} item={item} photo={oneShotPhotoInfo(photos, item.key)} tick={tickOf.get(item.key)} onOpen={(key) => setOpen({ key, start: null })} />
              ))}
            </ul>
          </section>
        ))}
      </div>

      {openItem ? (
        <OneShotDialog
          key={openItem.key}
          item={openItem}
          photo={oneShotPhotoInfo(photos, openItem.key)}
          tick={tickOf.get(openItem.key) || null}
          start={open.start}
          canEdit={canEdit}
          locked={locked}
          travellers={travellers}
          photoSource={photoSource}
          uploader={uploader}
          onSave={async (body) => {
            await onSave(openItem.key, body);
            setOpen(null);
          }}
          onRemove={async () => {
            await onRemove(openItem.key);
            setOpen(null);
          }}
          onClose={() => setOpen(null)}
        />
      ) : null}
    </MapPanel>
  );
}

export default OneShotsPanel;

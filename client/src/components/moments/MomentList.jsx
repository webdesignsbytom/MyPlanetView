import React, { useState } from 'react';
// Components
import MomentCard from './MomentCard';
import MomentForm from './MomentForm';
import Button from '@/components/common/Button';
import MapActionButton from '@/components/map/MapActionButton';
import LoadingSpinner from '@/components/utils/LoadingSpinner';

/**
 * Moments in date order, a page at a time (`list` is a useMomentPage), with "Add a
 * moment", Edit and Delete for editors (`canEdit`). The add and edit forms open in place;
 * `form` is what MomentForm needs besides the moment (the map, a fixed country or trip,
 * the trips and travellers to choose from, the photos on offer, the offers to mark the
 * country and add a baby). `onChanged` runs after every save or delete (the map's marks
 * count them). `inPanel`: a map panel's buttons. `header` (a country's ticket: its
 * "Moments" heading): drawn first, with "Add a moment" level with it and the empty line on
 * its right on large screens (18 Nov 2026, the user's wish); below that, after the list.
 * `collapsed` (with a header whose button folds the section; 23 Nov 2026, the user's wish):
 * only the header shows. Everything else stays mounted, hidden, so a form half filled in
 * keeps its words; `bodyId` names what's hidden, for the button's `aria-controls`.
 * `groupMoments(moments)` (a trip's page, 23 Nov 2026: day by day) returns
 * `[{ key, title, where, moments }]`, each drawn under its own heading, a level above the
 * moments' (`headingLevel`), or null for one plain list.
 */
function MomentList({
  list,
  form,
  canEdit = false,
  headingLevel = 4,
  travellers = [],
  trips = null,
  showCountry = false,
  onOpenPhoto,
  onChanged,
  emptyText = 'No moments yet.',
  inPanel = false,
  header = null,
  collapsed = false,
  bodyId,
  groupMoments = null,
}) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [savedId, setSavedId] = useState(null);
  const Action = inPanel ? MapActionButton : Button;
  const { moments, loading, error, nextCursor } = list;
  // With a header, from lg (not on phones): two columns, the header and the empty line on
  // the left, the button on the right in the first row; everything else across both
  const beside = Boolean(header) && canEdit;
  const across = beside ? 'lg:nophone:col-span-2' : '';
  const empty =
    !moments.length && !loading && !error ? (
      <p className='text-sm opacity-80' hidden={collapsed}>
        {emptyText}
      </p>
    ) : null;

  const saved = (moment) => {
    list.saved(moment);
    setAdding(false);
    setEditingId(null);
    setSavedId(moment.id);
    onChanged?.();
  };
  const deleted = (momentId) => {
    list.removed(momentId);
    onChanged?.();
  };

  const groups = moments.length && groupMoments ? groupMoments(moments) : null;
  const GroupHeading = `h${Math.max(2, headingLevel - 1)}`;
  const renderMoment = (moment) =>
    editingId === moment.id ? (
      <li key={moment.id}>
        <section aria-label={`Edit ${moment.title}`} className='grid border-2 border-dashed border-poster-brown/60 p-3'>
          <MomentForm {...form} moment={moment} onSaved={saved} onCancel={() => setEditingId(null)} />
        </section>
      </li>
    ) : (
      <MomentCard
        key={moment.id}
        moment={moment}
        headingLevel={headingLevel}
        travellers={travellers}
        trips={trips}
        showCountry={showCountry}
        canEdit={canEdit}
        focusTitle={savedId === moment.id}
        onEdit={() => {
          setAdding(false);
          setEditingId(moment.id);
        }}
        onDeleted={deleted}
        onOpenPhoto={onOpenPhoto}
      />
    );

  return (
    <div className={`grid gap-3 ${beside ? 'lg:nophone:grid-cols-[minmax(0,1fr)_auto] lg:nophone:gap-x-4' : ''}`}>
      {header ? (
        <div className={`grid gap-2 ${beside ? 'lg:nophone:col-start-1 lg:nophone:row-start-1' : ''}`}>
          {header}
          {empty}
        </div>
      ) : null}
      {/* `contents`: its children are this grid's own items, as without it; `hidden` beats it */}
      <div id={bodyId} className='contents' hidden={collapsed} data-moments-body=''>
        {error ? (
          <p role='alert' className={`text-sm text-status-critical ${across}`}>
            {error}
          </p>
        ) : null}
        {groups ? (
          <ol className={`grid gap-4 ${across}`} data-moment-days=''>
            {groups.map((group) => (
              <li key={group.key} className='grid gap-2' data-moment-day={group.key}>
                <div className='grid gap-0.5 border-b-2 border-dashed border-poster-brown/40 pb-1'>
                  <GroupHeading className='font-travel text-lg leading-tight text-poster-red-deep'>{group.title}</GroupHeading>
                  {group.where ? <p className='text-sm opacity-80'>{group.where}</p> : null}
                </div>
                <ul className='grid gap-2'>{group.moments.map(renderMoment)}</ul>
              </li>
            ))}
          </ol>
        ) : moments.length ? (
          <ul className={`grid gap-2 ${across}`}>{moments.map(renderMoment)}</ul>
        ) : header ? null : (
          empty
        )}
        {loading ? (
          <div className={`grid place-items-center py-2 ${across}`} role='status'>
            <LoadingSpinner />
            <span className='sr-only'>Loading moments…</span>
          </div>
        ) : null}
        {nextCursor && !loading ? (
          <button type='button' onClick={list.loadMore} className={`justify-self-start text-sm font-medium underline underline-offset-2 ${across}`}>
            Show more moments
          </button>
        ) : null}

        {canEdit ? (
          adding ? (
            <section aria-label='Add a moment' className={`grid border-2 border-dashed border-poster-brown/60 p-3 ${across}`}>
              <MomentForm {...form} onSaved={saved} onCancel={() => setAdding(false)} />
            </section>
          ) : (
            <div
              className={`grid ${inPanel ? 'justify-items-start phone:justify-items-stretch' : 'justify-items-start'} ${
                beside ? 'lg:nophone:col-start-2 lg:nophone:row-start-1 lg:nophone:self-center' : ''
              }`}
            >
              <Action
                onClick={() => {
                  setEditingId(null);
                  setAdding(true);
                }}
              >
                Add a moment
              </Action>
            </div>
          )
        ) : null}
      </div>
    </div>
  );
}

export default MomentList;

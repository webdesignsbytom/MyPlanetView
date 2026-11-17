import React, { useEffect, useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
// Icons
import { IoContract, IoExpand, IoHome, IoMap, IoMenu, IoSettings, IoShareSocial } from 'react-icons/io5';
import { IoIosImages, IoIosStats } from 'react-icons/io';
import { FaHistory, FaListOl, FaPlay, FaRoute, FaSuitcase } from 'react-icons/fa';
// Constants
import { HOME_PAGE_URL } from '@/utils/constants/routes';
// Hooks
import useFullscreen from '@/hooks/useFullscreen';
// Utils
import { plural } from '@/utils/functions/plural';
import { SPECIAL_PLACE_TOTAL } from '@/utils/map/specialPlaces';
// Components
import MapRoundButton from './MapRoundButton';

// "8 countries, 2 continents, 16 photos. Special places 0 of 5" (special places: Antarctica
// and the poles), or nothing before the map's stats arrive
function statsSummary(stats) {
  if (!stats) return undefined;
  const counts = [plural(stats.countries, 'country', 'countries'), plural(stats.continents, 'continent'), plural(stats.photos, 'photo')];
  return `${counts.join(', ')}. Special places ${stats.specialPlaces ?? 0} of ${SPECIAL_PLACE_TOTAL}`;
}

// The same counts as figures for the phone's menu, [value, word] each
function statsFigures(stats) {
  if (!stats) return null;
  const word = (count, one, many) => (count === 1 ? one : many);
  return [
    [stats.countries, word(stats.countries, 'country', 'countries')],
    [stats.continents, word(stats.continents, 'continent', 'continents')],
    [stats.photos, word(stats.photos, 'photo', 'photos')],
    [`${stats.specialPlaces ?? 0}/${SPECIAL_PLACE_TOTAL}`, 'special places'],
  ];
}

// A tool's icon in the phone's menu: the toolbar's round rubber stamp (MapRoundButton's
// look, drawn inside the item's button), pressed in while its panel is open
function MenuStamp({ pressed, size = 'h-11 w-11 text-lg', children }) {
  return (
    <span
      aria-hidden='true'
      className={`grid place-items-center rounded-full border-4 border-double transition ${size} ${
        pressed
          ? 'translate-y-px border-poster-paper bg-poster-red-deep text-poster-paper'
          : '-rotate-6 border-poster-red bg-poster-paper text-poster-red shadow-paper group-hover:rotate-0'
      }`}
    >
      {children}
    </span>
  );
}

/**
 * The phone's map menu (16 Nov 2026, the user's design): one round "Menu" stamp at the top
 * right (a menu icon in the toolbar's round stamp, like the goal flag at the left; 17 Nov
 * 2026, it was a "Menu" ticket with a down arrow), pressed in while open, that drops every tool, restyled the same day as a travel ticket: the
 * statistics across the top as a parchment strip of figures (its counts, as a sentence, are
 * its description, so its name is just "Travel statistics", as on the stamp), then the
 * tools as round stamps with their names under them, three to a row (on a phone on its side,
 * 17 Nov 2026, a wider menu: the statistics beside their name, the tools in one row), and below a perforation the home page and, where the browser allows
 * it, "Full screen", which hides the browser's bars (the user's wish: on its side a phone
 * lost a third of its height to them). A disclosure, not an ARIA menu: Tab moves through it, choosing a
 * tool closes it, and so do Escape (focus back on the button) and a press outside. The open
 * panel's tool is pressed in.
 */
function PhoneToolMenu({ items, home, extras = [] }) {
  const [open, setOpen] = useState(false);
  const listId = useId();
  const statsId = useId();
  const wrapRef = useRef(null);
  const toggleRef = useRef(null);
  const summary = items.find((item) => item.id === 'stats');
  const tools = items.filter((item) => item !== summary);
  const footerItems = [home, ...extras].filter(Boolean);

  const choose = (item) => {
    setOpen(false);
    // Focus to the Menu button first: the panel hands it back there when it closes (this
    // item is hidden by then)
    toggleRef.current?.focus();
    item.onSelect();
  };
  const itemProps = (item) => ({
    type: 'button',
    'aria-pressed': item.pressed === undefined ? undefined : item.pressed,
    onClick: () => choose(item),
    onFocus: item.onIntent,
    onPointerDown: item.onIntent,
  });

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  return (
    <div
      ref={wrapRef}
      className='relative grid justify-items-end nophone:hidden'
      onKeyDown={(e) => {
        if (e.key !== 'Escape' || !open) return;
        // The menu closes first; the map's own Escape (closing a panel) waits for the next press
        e.stopPropagation();
        setOpen(false);
        toggleRef.current?.focus();
      }}
    >
      <button
        ref={toggleRef}
        type='button'
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((now) => !now)}
        aria-label='Menu'
        title='Menu'
        className={`grid h-10 w-10 place-items-center rounded-full border-4 border-double text-xl transition active:scale-95 ${
          open ? 'translate-y-px border-poster-paper bg-poster-red-deep text-poster-paper' : '-rotate-6 border-poster-red bg-poster-paper text-poster-red shadow-paper'
        }`}
      >
        <IoMenu aria-hidden='true' />
      </button>
      <div
        id={listId}
        hidden={!open}
        className='ticket-edge absolute right-0 top-[calc(100%+0.5rem)] grid max-h-[calc(100svh-4.5rem)] w-[min(22rem,calc(100vw-1.5rem))] grid-rows-[auto_minmax(0,1fr)_auto] sideways:w-[min(52rem,calc(100vw-1.5rem))] overflow-hidden bg-paper-cream text-poster-ink'
      >
        {summary ? (
          <button
            {...itemProps(summary)}
            aria-labelledby={`${statsId}-label`}
            aria-describedby={summary.description ? statsId : undefined}
            className={`group grid gap-2 border-b-2 border-dashed border-poster-brown px-4 pb-3 pt-3.5 text-left transition sideways:grid-cols-[auto_minmax(0,1fr)] sideways:items-center sideways:gap-4 sideways:py-2 ${
              summary.pressed ? 'bg-poster-red-deep text-poster-paper' : 'paper-aged hover:brightness-105'
            }`}
          >
            <span className='grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3'>
              <MenuStamp pressed={summary.pressed} size='h-9 w-9 text-base'>
                {summary.icon}
              </MenuStamp>
              <span
                id={`${statsId}-label`}
                className={`font-travel text-lg uppercase leading-tight tracking-wide ${
                  summary.pressed ? '' : 'text-poster-red-deep'
                }`}
              >
                {summary.label}
              </span>
            </span>
            {summary.figures ? (
              <span aria-hidden='true' className='grid grid-cols-4 gap-1 text-center'>
                {summary.figures.map(([value, word]) => (
                  <span key={word} className='grid content-start gap-0.5'>
                    <span className='font-travel text-2xl leading-none'>{value}</span>
                    <span className='text-[0.65rem] font-medium uppercase leading-tight tracking-wide opacity-80'>{word}</span>
                  </span>
                ))}
              </span>
            ) : null}
            {/* The counts as a sentence: the description screen readers hear (and the tests read) */}
            {summary.description ? (
              <span id={statsId} hidden>
                {summary.description}
              </span>
            ) : null}
          </button>
        ) : (
          <span />
        )}
        <ul className='grid grid-cols-3 content-start gap-x-1 gap-y-2 overflow-y-auto px-3 py-3 sideways:grid-cols-[repeat(auto-fit,minmax(5.25rem,1fr))] sideways:py-2'>
          {tools.map((item) => (
            <li key={item.id} className='grid'>
              <button
                {...itemProps(item)}
                className={`group grid content-start justify-items-center gap-1.5 rounded-sm px-1 pb-1.5 pt-2 text-center transition ${
                  item.pressed ? 'bg-poster-paper' : 'hover:bg-poster-paper/70'
                }`}
              >
                <MenuStamp pressed={item.pressed}>{item.icon}</MenuStamp>
                <span className='font-travel text-sm uppercase leading-tight tracking-wide text-poster-red-deep'>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
        {footerItems.length ? (
          <div className='paper-aged grid auto-cols-fr grid-flow-col divide-x-2 divide-dashed divide-poster-brown border-t-2 border-dashed border-poster-brown'>
            {footerItems.map((item) => (
              <button
                key={item.id}
                {...itemProps(item)}
                className='group grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 px-4 py-2.5 text-left transition hover:brightness-105'
              >
                <MenuStamp size='h-8 w-8 text-sm'>{item.icon}</MenuStamp>
                <span className='font-travel text-base uppercase leading-tight tracking-wide text-poster-red-deep'>{item.label}</span>
              </button>
            ))}
          </div>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}

// The old site's tool strip, as a parchment strip of rubber stamps: a column at the top
// right on wide screens; on phones (below md), a "Menu" button there instead, which drops
// every tool (PhoneToolMenu; 16 Nov 2026 the bottom row of stamps went, the user's wish,
// and with it the three it had no room for). `tools` lists which panels this viewer can
// open; settings comes last. `onIntent(id)` runs as a tool is hovered, focused or pressed
// (to fetch its panel's code). The map has had no stats tag under its title since 16 Nov
// 2026 (the user's wish: this stamp is the way in), so `stats` (the map's) gives the stamp
// the counts as its description, read out after its label, and written under it in the
// phone's menu. "Play my world" opens the slideshow over the page rather than a panel.
function MapToolbar({ openPanel, onToggle, onIntent, canShare, canSwitch = false, stats = null, showHome = true }) {
  const navigate = useNavigate();

  const tools = [
    // "Your maps", for a signed-in viewer (not a share link): the phone's only way to the
    // switcher now that its title tag is gone
    ...(canSwitch ? [{ id: 'switcher', label: 'Your maps', icon: <IoMap aria-hidden='true' /> }] : []),
    {
      id: 'stats',
      label: 'Travel statistics',
      icon: <IoIosStats aria-hidden='true' />,
      description: statsSummary(stats),
      figures: statsFigures(stats),
    },
    { id: 'countries', label: 'Country list', icon: <FaListOl aria-hidden='true' /> },
    { id: 'trips', label: 'Trips', icon: <FaRoute aria-hidden='true' /> },
    { id: 'timeline', label: 'Timeline', icon: <FaHistory aria-hidden='true' /> },
    { id: 'badges', label: 'Badges and goals', icon: <FaSuitcase aria-hidden='true' /> },
    { id: 'play', label: 'Play my world', icon: <FaPlay aria-hidden='true' /> },
    // The map's photos, for everyone who can see the map (16 Nov 2026: it was "Add photos",
    // editors only); an editor adds photos from the panel's own button
    { id: 'photos', label: 'Photo album', icon: <IoIosImages aria-hidden='true' /> },
    ...(canShare ? [{ id: 'share', label: 'Share this map', icon: <IoShareSocial aria-hidden='true' /> }] : []),
    { id: 'settings', label: 'Map settings', icon: <IoSettings aria-hidden='true' /> },
  ];
  const goHome = () => navigate(HOME_PAGE_URL);
  const menuItems = tools.map((tool) => ({
    ...tool,
    pressed: openPanel === tool.id,
    onSelect: () => onToggle(tool.id),
    onIntent: onIntent ? () => onIntent(tool.id) : undefined,
  }));
  const menuHome = showHome ? { id: 'home', label: 'Home page', icon: <IoHome aria-hidden='true' />, onSelect: goHome } : null;
  const fullscreen = useFullscreen();
  const menuExtras = fullscreen.supported
    ? [
        {
          id: 'fullscreen',
          label: fullscreen.active ? 'Leave full screen' : 'Full screen',
          icon: fullscreen.active ? <IoContract aria-hidden='true' /> : <IoExpand aria-hidden='true' />,
          onSelect: fullscreen.toggle,
        },
      ]
    : [];

  return (
    <nav aria-label='Map tools' className='pointer-events-auto grid'>
      <div className='ticket-edge paper-aged hidden gap-2 px-3 py-3 nophone:grid pointer-fine:gap-2.5 pointer-fine:px-2.5 pointer-fine:py-3.25'>
        {showHome ? (
          <MapRoundButton label='Home page' onClick={goHome}>
            <IoHome aria-hidden='true' />
          </MapRoundButton>
        ) : null}
        {tools.map((tool) => (
          <MapRoundButton
            key={tool.id}
            label={tool.label}
            pressed={openPanel === tool.id}
            onClick={() => onToggle(tool.id)}
            onIntent={onIntent ? () => onIntent(tool.id) : undefined}
            description={tool.description}
          >
            {tool.icon}
          </MapRoundButton>
        ))}
      </div>
      <PhoneToolMenu items={menuItems} home={menuHome} extras={menuExtras} />
    </nav>
  );
}

export default MapToolbar;

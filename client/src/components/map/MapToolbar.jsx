import React, { useEffect, useId, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
// Icons
import { IoContract, IoExpand, IoHome, IoMap, IoMenu, IoSettings, IoShareSocial } from 'react-icons/io5';
import { IoIosImages, IoIosStats } from 'react-icons/io';
import { FaBinoculars, FaCommentDots, FaCompass, FaHistory, FaListOl, FaPassport, FaRoute, FaSuitcase } from 'react-icons/fa';
// Constants
import { HOME_PAGE_URL } from '@/utils/constants/routes';
// Hooks
import useFullscreen from '@/hooks/useFullscreen';
// Utils
import { plural } from '@/utils/functions/plural';
import { SPECIAL_PLACE_TOTAL } from '@/utils/map/specialPlaces';
import { REGION_CODES } from '@/utils/map/regionPlaces';
import { NOT_PHONE_QUERY } from '@/utils/layout/phone';
// Components
import CloseStamp from '@/components/common/CloseStamp';
import MapRoundButton from './MapRoundButton';

// "8 countries, 2 continents, 16 photos. Special places 0 of 5" (special places: Antarctica
// and the poles), then ". Regions 1 of 7" once one's visited (Bali, Tasmania), or nothing
// before the map's stats arrive
function statsSummary(stats) {
  if (!stats) return undefined;
  const counts = [plural(stats.countries, 'country', 'countries'), plural(stats.continents, 'continent'), plural(stats.photos, 'photo')];
  const regions = stats.regions ? `. Regions ${stats.regions} of ${REGION_CODES.length}` : '';
  return `${counts.join(', ')}. Special places ${stats.specialPlaces ?? 0} of ${SPECIAL_PLACE_TOTAL}${regions}`;
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

// Open and shut a dialog as a modal one: in the top layer, over the whole screen whatever the
// map page's own layers and filters (Black and white's greyscale filter on the toolbar would
// hold a fixed box inside it), the rest of the page out of reach. A browser without modal
// dialogs (and the unit tests' jsdom) shows it open where it is.
function showDialog(node) {
  if (!node || node.open) return;
  if (typeof node.showModal === 'function') node.showModal();
  else node.setAttribute('open', '');
}
function shutDialog(node) {
  if (!node?.hasAttribute('open')) return;
  if (typeof node.close === 'function') node.close();
  else node.removeAttribute('open');
}

// A tool in the phone's menu: its round stamp, its name under it
const TOOL_CLASS = 'group grid content-start justify-items-center gap-1.5 rounded-sm px-1 pb-1.5 pt-2 text-center transition';
const TOOL_NAME_CLASS = 'font-travel text-sm uppercase leading-tight tracking-wide text-poster-red-deep';

/**
 * The phone's map menu (16 Nov 2026, the user's design): one round "Menu" stamp at the top
 * right (a menu icon in the toolbar's round stamp, like the goal flag at the left; 17 Nov
 * 2026, it was a "Menu" ticket with a down arrow), pressed in while open. It opens over the
 * whole screen (27 Nov 2026, the user's wish; it dropped from the stamp until then), as a
 * travel ticket: its name and a close stamp at the top right, where the Menu stamp is; the
 * statistics as a parchment strip of figures (its counts, as a sentence, are its description,
 * so its name is just "Travel statistics", as on the stamp), then the tools as round stamps
 * with their names under them, three to a row (on a phone on its side, 17 Nov 2026: the
 * statistics beside their name, the tools in rows as wide as fit), "View passport" among them
 * (27 Nov 2026, the user's wish: `passport`, a link), and below a perforation the home page
 * and, where the browser allows it, "Full screen", which hides the browser's bars (the user's
 * wish: on its side a phone lost a third of its height to them). A modal dialog: focus starts
 * on the close stamp and stays inside; choosing a tool closes it, and so do the close stamp
 * and Escape (focus back on the Menu button), and a phone's back button. The open panel's
 * tool is pressed in.
 */
function PhoneToolMenu({ items, home, extras = [], passport = null }) {
  const [open, setOpen] = useState(false);
  const listId = useId();
  const statsId = useId();
  const titleId = useId();
  const dialogRef = useRef(null);
  const toggleRef = useRef(null);
  const summary = items.find((item) => item.id === 'stats');
  const tools = items.filter((item) => item !== summary);
  // "View passport" after the photo album, the last of the things collected
  const photosAt = tools.findIndex((item) => item.id === 'photos');
  if (passport) tools.splice(photosAt < 0 ? tools.length : photosAt + 1, 0, passport);
  const footerItems = [home, ...extras].filter(Boolean);

  // Shut at once (so the Menu button is no longer out of reach), focus back on that button
  const shut = () => {
    shutDialog(dialogRef.current);
    setOpen(false);
    toggleRef.current?.focus();
  };
  const choose = (item) => {
    // Focus to the Menu button first: the panel hands it back there when it closes
    shut();
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
    const node = dialogRef.current;
    if (!open) {
      shutDialog(node);
      return undefined;
    }
    showDialog(node);
    node?.querySelector('[data-menu-close] button')?.focus();
    // Turned into a wide screen (a tablet on its side), the menu is no longer there to see: shut it
    const wide = window.matchMedia?.(NOT_PHONE_QUERY);
    const onChange = () => {
      if (wide.matches) shut();
    };
    wide?.addEventListener?.('change', onChange);
    return () => wide?.removeEventListener?.('change', onChange);
  }, [open]);

  return (
    <div
      className='relative grid justify-items-end nophone:hidden'
      onKeyDown={(e) => {
        if (e.key !== 'Escape' || !open) return;
        // The menu closes first; the map's own Escape (closing a panel) waits for the next press
        e.stopPropagation();
        e.preventDefault();
        shut();
      }}
    >
      <button
        ref={toggleRef}
        type='button'
        aria-haspopup='dialog'
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
      <dialog
        ref={dialogRef}
        id={listId}
        aria-labelledby={titleId}
        // Escape, or a phone's back button: shut as the close stamp does
        onCancel={(e) => {
          e.preventDefault();
          shut();
        }}
        data-phone-menu=''
        className='fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none overflow-hidden border-0 bg-paper-cream p-0 text-poster-ink'
      >
        <div className='ticket-edge grid h-full grid-rows-[auto_auto_minmax(0,1fr)_auto] overflow-hidden bg-paper-cream pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]'>
        {/* The close stamp exactly where the Menu stamp is (the screen's top right, 0.75rem in) */}
        <div className='paper-aged grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b-2 border-dashed border-poster-brown py-2.5 pl-4 pr-2.5'>
          <h2 id={titleId} className='font-travel text-2xl uppercase leading-tight tracking-wide text-poster-red-deep'>
            Menu
          </h2>
          <span className='grid' data-menu-close=''>
            <CloseStamp label='Close the menu' onClick={shut} />
          </span>
        </div>
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
        <ul className='grid grid-cols-3 content-start gap-x-1 gap-y-3 overflow-y-auto px-3 py-4 sideways:grid-cols-[repeat(auto-fit,minmax(5.25rem,1fr))] sideways:gap-y-2 sideways:py-2'>
          {tools.map((item) => (
            <li key={item.id} className='grid'>
              {/* A link (the passport) leaves the map: the menu shuts first */}
              {item.href ? (
                <Link to={item.href} onClick={shut} className={`${TOOL_CLASS} hover:bg-poster-paper/70`}>
                  <MenuStamp>{item.icon}</MenuStamp>
                  <span className={TOOL_NAME_CLASS}>{item.label}</span>
                </Link>
              ) : (
                <button {...itemProps(item)} className={`${TOOL_CLASS} ${item.pressed ? 'bg-poster-paper' : 'hover:bg-poster-paper/70'}`}>
                  <MenuStamp pressed={item.pressed}>{item.icon}</MenuStamp>
                  <span className={TOOL_NAME_CLASS}>{item.label}</span>
                </button>
              )}
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
      </dialog>
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
// phone's menu. "Play my world" and "Tips" went on 24 Nov 2026 (the user's wish: a shorter
// bar): the photo album plays the slideshow, Settings shows the tips; "Strings" the same day,
// its panel opened from the country list. `canFeedback`: a signed-in viewer's "Feedback" stamp,
// before Settings (25 Nov 2026, the user's wish: report a problem, an idea or a question).
// `passportHref`: the map's passport, "View passport" in the phone's menu (27 Nov 2026, the
// user's wish: its full-screen menu has the room; the wide bar keeps its length).
function MapToolbar({ openPanel, onToggle, onIntent, canShare, canSwitch = false, canFeedback = false, stats = null, showHome = true, passportHref = null }) {
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
    // The want-to-go countries by the best time for each (22 Nov 2026)
    { id: 'next', label: 'Where to go next', icon: <FaCompass aria-hidden='true' /> },
    // Strings between places (23 Nov 2026) open from the country list since 24 Nov 2026 (the
    // user's wish: a shorter bar)
    { id: 'timeline', label: 'Timeline', icon: <FaHistory aria-hidden='true' /> },
    { id: 'badges', label: 'Badges and goals', icon: <FaSuitcase aria-hidden='true' /> },
    // Wildlife seen, nature's wonders, journeys and feats (24 Nov 2026, the user's wish and name)
    { id: 'oneShots', label: 'Life’s One Shots', icon: <FaBinoculars aria-hidden='true' /> },
    // The map's photos, for everyone who can see the map (16 Nov 2026: it was "Add photos",
    // editors only); an editor adds photos from the panel's own button, and anyone plays them
    // from it ("Play my world", its own stamp until 24 Nov 2026, the user's wish: a shorter bar)
    { id: 'photos', label: 'Photo album', icon: <IoIosImages aria-hidden='true' /> },
    ...(canShare ? [{ id: 'share', label: 'Share this map', icon: <IoShareSocial aria-hidden='true' /> }] : []),
    ...(canFeedback ? [{ id: 'feedback', label: 'Feedback', icon: <FaCommentDots aria-hidden='true' /> }] : []),
    // Settings, Help, also shows the tips again (their own stamp until 24 Nov 2026, the user's
    // wish: a shorter bar)
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
  const menuPassport = passportHref ? { id: 'passport', label: 'View passport', icon: <FaPassport aria-hidden='true' />, href: passportHref } : null;
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
      <PhoneToolMenu items={menuItems} home={menuHome} extras={menuExtras} passport={menuPassport} />
    </nav>
  );
}

export default MapToolbar;

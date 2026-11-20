import React, { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
// Icons
import SvgIcon from '@/components/common/SvgIcon';
import { CARET_DOWN_ICON } from '@/utils/data/svgIcons';
// Context
import { useAuth } from '@/auth/AuthContext';
// Constants
import { HOME_PAGE_URL } from '@/utils/constants/routes';
import { CompanyName } from '@/utils/constants/constants';
// Data
import { getNavLinkItemsArray } from '@/utils/data/navData';
// Components
import BrandWordmark from '@/components/common/BrandWordmark';
import AppAnchor from '@/components/common/AppAnchor';
import SocialMediaCTA from '@/components/socialMedia/SocialMediaCTA';
import MenuStampButton from './MenuStampButton';
// Utils
import { prefetchRoute } from '@/utils/navigation/prefetchRoute';
// Each button a different look for now, to choose one (navStyleTrial.js; 18 Nov 2026)
import { navTrialClass } from './navStyleTrial';

// The column on short windows (a laptop's browser page is often 600 to 700 px tall): its
// spacing, logo and buttons shrink in two steps, so every link fits without scrolling (a
// scrolling column would clip the Admin menu, which opens beside it). Below about 520 px
// the column stops sticking and scrolls with the page, so nothing is ever out of reach.
const COLUMN_NAV = 'lg:top-2 lg:min-h-[calc(100svh-1rem)] lg:[@media(min-height:520px)]:sticky';
const COLUMN_SECTION =
  'h-full content-start justify-items-center gap-10 px-6 py-10 [@media(max-height:860px)]:gap-4 [@media(max-height:860px)]:py-5 [@media(max-height:680px)]:gap-3 [@media(max-height:680px)]:py-3';
const COLUMN_LOGO =
  'grid w-full justify-items-center border-b-2 border-dashed border-poster-brown pb-8 [@media(max-height:860px)]:pb-3 [@media(max-height:860px)]:[&_picture]:max-w-32 [@media(max-height:680px)]:pb-2 [@media(max-height:680px)]:[&_picture]:max-w-24';
const COLUMN_LIST =
  'w-full justify-items-stretch text-center [@media(max-height:860px)]:gap-1.5 [@media(max-height:860px)]:[&_:is(a,button)]:py-0.5 [@media(max-height:680px)]:gap-1 [@media(max-height:680px)]:[&_:is(a,button)]:py-0 [@media(max-height:680px)]:[&_:is(a,button)]:text-lg [@media(max-height:680px)]:[&_:is(a,button)]:leading-6';

/**
 * The site navigation on my_planet's parchment.
 * variant 'bar' (every page): a strip along the top with a brown bottom edge.
 * variant 'column' (the home page): from lg up, a full-height column with the big
 * logo and stacked buttons and a brown right edge, as on my_planet; a bar below lg.
 */
function Navbar({ variant = 'bar' }) {
  const { user, logout } = useAuth();
  const column = variant === 'column';

  const navLinkItemsArray = getNavLinkItemsArray(user);

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  // Logging out failed: they're still signed in, and the nav says so under the button
  const [logoutError, setLogoutError] = useState('');
  const navRef = useRef(null);

  // Resolves to whether they're now logged out
  const handleLogout = async () => {
    if (isLoggingOut) return false;
    setIsLoggingOut(true);
    setLogoutError('');
    const result = await logout();
    setIsLoggingOut(false);
    if (result.ok) {
      // Announce via live region
      const live = document.getElementById('nav-live');
      if (live) live.textContent = 'You have been logged out.';
    } else {
      setLogoutError(result.error);
      // The message in the nav that's showing (the desktop or the phone one)
      requestAnimationFrame(() =>
        [...(navRef.current?.querySelectorAll('[data-logout-error]') ?? [])].find((el) => el.offsetParent)?.focus(),
      );
    }
    return result.ok;
  };

  const siteNavJsonLd = useMemo(() => {
    const items = [];
    navLinkItemsArray.forEach(({ path, label, subpages }) => {
      if (subpages?.length) {
        subpages.forEach(({ path: sp, label: sl }) =>
          items.push({ '@type': 'SiteNavigationElement', name: sl, url: sp })
        );
      } else if (path && label) {
        items.push({ '@type': 'SiteNavigationElement', name: label, url: path });
      }
    });
    return { '@context': 'https://schema.org', '@graph': items };
  }, [navLinkItemsArray]);

  return (
    <nav
      ref={navRef}
      role='navigation'
      aria-label='Main Navigation'
      // The column variant is PosterFrame's `nav`: below lg a full-width bar across the top
      // of the screen, the red frame and its brass corners starting under it; from lg a
      // full-height column inside the frame (the corners sit over its ends). The plain bar
      // (pages without the frame) stops short of the corners from md up. Both are the
      // travel-paperwork card: aged parchment, thin brown edge, dashed printed line.
      className={`relative z-50 h-fit rounded-lg paper-aged ticket-edge text-poster-ink no__highlights ${
        column ? COLUMN_NAV : 'md:mx-14'
      }`}
      itemScope
      itemType='https://schema.org/SiteNavigationElement'
    >
      <script type='application/ld+json'>{JSON.stringify(siteNavJsonLd)}</script>

      {/* Screen reader live region for announcements */}
      <div id='nav-live' aria-live='polite' className='sr-only' />
      {/* Skip to content (the app's only skip link) */}
      <AppAnchor
        href='#main-content'
        className='sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:border-2 focus:border-poster-ink focus:bg-poster-cream focus:px-4 focus:py-2'
      >
        Skip to main content
      </AppAnchor>

      <DesktopNavSection
        navLinkItemsArray={navLinkItemsArray}
        user={user}
        handleLogout={handleLogout}
        isLoggingOut={isLoggingOut}
        logoutError={logoutError}
        column={column}
      />

      <MobileNavSection
        navLinkItemsArray={navLinkItemsArray}
        user={user}
        handleLogout={handleLogout}
        isLoggingOut={isLoggingOut}
        logoutError={logoutError}
      />
    </nav>
  );
}

/* Desktop nav (lg and up): a bar, or the home page's column */
function DesktopNavSection({ navLinkItemsArray, user, handleLogout, isLoggingOut, logoutError, column }) {
  const [openDesktopDropdown, setOpenDesktopDropdown] = useState(null);
  const desktopNavRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!openDesktopDropdown) return undefined;

    const handleClickOutside = (e) => {
      if (desktopNavRef.current && !desktopNavRef.current.contains(e.target)) {
        setOpenDesktopDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDesktopDropdown]);

  return (
    <section
      className={`hidden lg:grid ${
        column ? COLUMN_SECTION : 'grid-cols-reg items-center gap-6 px-6 py-3'
      }`}
    >
      {/* Logo; in the column, above a perforated tear line like the boarding pass */}
      <div className={column ? COLUMN_LOGO : 'grid'}>
        <NavLink to={HOME_PAGE_URL} aria-label={`${CompanyName} homepage`} className='grid items-center active:scale-95'>
          <BrandWordmark size={column ? 'xl' : 'md'} />
        </NavLink>
      </div>

      {/* Desktop nav list */}
      <ul
        ref={desktopNavRef}
        className={`grid gap-2 ${column ? COLUMN_LIST : 'grid-row justify-self-end items-center'}`}
      >
        {navLinkItemsArray.map(({ path, label, subpages }, index) =>
          subpages ? (
            <li key={label} className='relative grid'>
              {/* Click-only toggle (no hover-to-open) */}
              <button
                type='button'
                className={`${navTrialClass(index)} grid-cols-a1a gap-2`}
                aria-haspopup='true'
                aria-expanded={openDesktopDropdown === label}
                aria-controls={`desktop-submenu-${label}`}
                onClick={() => setOpenDesktopDropdown((prev) => (prev === label ? null : label))}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setOpenDesktopDropdown(null);
                }}
              >
                <span aria-hidden='true' />
                <span itemProp='name'>{label}</span>
                <SvgIcon icon={CARET_DOWN_ICON} height={12} width={12} />
              </button>
              {/* In the column it opens beside the button and upward: the button is near the
                  column's foot, so opening downward ran off the bottom of the screen */}
              {openDesktopDropdown === label && (
                <ul
                  id={`desktop-submenu-${label}`}
                  className={`absolute z-20 grid min-w-40 gap-2 ticket-edge rounded-md bg-poster-paper p-4 ${
                    column ? 'bottom-0 left-full w-max' : 'right-0 top-full'
                  }`}
                  aria-label={`${label} submenu`}
                >
                  {subpages.map(({ path: sp, label: sl }) => (
                    <NavItem key={sl} path={sp} title={sl} styleIndex={index} />
                  ))}
                </ul>
              )}
            </li>
          ) : (
            <NavItem key={label} path={path} title={label} styleIndex={index} />
          )
        )}

        {/* Logout button */}
        {user?.email && (
          <li className='grid gap-2'>
            <LogoutButton user={user} onLogout={handleLogout} isLoggingOut={isLoggingOut} styleIndex={navLinkItemsArray.length} />
            <LogoutError message={logoutError} />
          </li>
        )}
      </ul>
    </section>
  );
}

/* Mobile nav (below lg) */
function MobileNavSection({ navLinkItemsArray, user, handleLogout, isLoggingOut, logoutError }) {
  const [isPhoneNavOpen, setIsPhoneNavOpen] = useState(false);
  const [openMobileDropdown, setOpenMobileDropdown] = useState(null);
  const sectionRef = useRef(null);

  const togglePhoneNav = () => setIsPhoneNavOpen((prev) => !prev);
  const handleMobileDropdownToggle = (label) => {
    setOpenMobileDropdown((prev) => (prev === label ? null : label));
  };

  // Logged out: the menu closes, and focus (on the Logout button, now gone) goes to its
  // toggle (when this nav is still on the page). It failed: the menu stays open, with the
  // message under the button.
  const logoutAndClose = async () => {
    if (!(await handleLogout())) return;
    setIsPhoneNavOpen(false);
    sectionRef.current?.querySelector('button[aria-controls="mobile-nav"]')?.focus();
  };

  return (
    <section ref={sectionRef} className='grid lg:hidden grid-cols-reg items-center px-4 py-3'>
      {/* Logo */}
      <NavLink to={HOME_PAGE_URL} aria-label={`${CompanyName} homepage`} className='grid items-center active:scale-95'>
        <BrandWordmark size='md' />
      </NavLink>

      {/* Toggle: a rubber stamp reading MENU / CLOSE */}
      <MenuStampButton open={isPhoneNavOpen} onClick={togglePhoneNav} controls='mobile-nav' />

      {/* Sliding panel; while closed it's inert, so its links leave the tab order */}
      <section
        id='mobile-nav'
        inert={!isPhoneNavOpen}
        className={`phone-nav grid gap-6 rounded-lg paper-aged ticket-edge py-8 transition-transform duration-300 ${
          isPhoneNavOpen ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-full opacity-0'
        }`}
      >
        <ul className='mx-auto grid w-full max-w-xs gap-3 text-center'>
          {navLinkItemsArray.map(({ path, label, subpages }, index) =>
            subpages ? (
              <li key={label} className='grid gap-2'>
                <button
                  onClick={() => handleMobileDropdownToggle(label)}
                  className={`${navTrialClass(index)} grid-cols-a1a gap-2`}
                  aria-haspopup='true'
                  aria-expanded={openMobileDropdown === label}
                  aria-controls={`mobile-submenu-${label}`}
                  aria-label={`${label} submenu toggle`}
                  type='button'
                >
                  <span aria-hidden='true' />
                  <span>{label}</span>
                  <span className={`grid transition-transform duration-300 ${openMobileDropdown === label ? 'rotate-180' : ''}`}>
                    <SvgIcon icon={CARET_DOWN_ICON} height={12} width={12} />
                  </span>
                </button>

                {openMobileDropdown === label && (
                  <ul id={`mobile-submenu-${label}`} className='grid gap-2 pl-3' aria-label={`${label} submenu`}>
                    {subpages.map(({ path: sp, label: sl }) => (
                      <NavItem key={sl} path={sp} title={sl} styleIndex={index} />
                    ))}
                  </ul>
                )}
              </li>
            ) : (
              <NavItem key={label} path={path} title={label} styleIndex={index} />
            )
          )}

          {/* Logout button */}
          {user?.email && (
            <li className='grid gap-2'>
              <LogoutButton user={user} onLogout={logoutAndClose} isLoggingOut={isLoggingOut} styleIndex={navLinkItemsArray.length} />
              <LogoutError message={logoutError} />
            </li>
          )}
        </ul>

        <section className='z-10 grid items-center justify-center'>
          <SocialMediaCTA socialClassName='text-2xl text-poster-ink hover:text-poster-red active:scale-95' />
        </section>
      </section>
    </section>
  );
}

// In poster ink, so it reads on the nav's parchment in both colour schemes
function LogoutError({ message }) {
  if (!message) return null;
  return (
    <p data-logout-error role='alert' tabIndex={-1} className='text-center text-sm font-semibold text-poster-red-deep'>
      {message}
    </p>
  );
}

function LogoutButton({ user, onLogout, isLoggingOut, styleIndex = 0 }) {
  return (
    <button
      type='button'
      onClick={onLogout}
      className={navTrialClass(styleIndex)}
      aria-label={`Log out ${user.email} from ${CompanyName}`}
      aria-busy={isLoggingOut}
      data-analytics-action='logout'
      data-analytics-user={user.email}
      title='Log out'
    >
      {isLoggingOut ? 'Logging out…' : 'Logout'}
    </button>
  );
}

const NavItem = ({ path, title, styleIndex = 0 }) => {
  const doPrefetch = () => prefetchRoute(path);

  return (
    <li itemProp='path' className='grid'>
      <NavLink
        to={path}
        aria-label={`${title} page navigation tab`}
        className={({ isActive }) => navTrialClass(styleIndex, isActive)}
        onMouseEnter={doPrefetch} // desktop hover
        onFocus={doPrefetch} // keyboard focus
        onTouchStart={doPrefetch} // mobile intent
      >
        <span itemProp='name'>{title}</span>
      </NavLink>
    </li>
  );
};

export default Navbar;

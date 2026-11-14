import React, { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
// Icons
import { FaCaretDown } from 'react-icons/fa6';
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

// my_planet's red poster buttons: travel face, black outline; the current page is inverted.
const navButtonClass = ({ isActive }) =>
  `grid items-center rounded-sm px-4 py-1 border-2 border-poster-brown font-travel text-xl tracking-wide shadow-paper transition hover:brightness-110 active:scale-95 ${
    isActive ? 'bg-poster-brown text-poster-paper' : 'bg-poster-red text-poster-ink'
  }`;
const navButtonStatic = navButtonClass({ isActive: false });

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

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
      // Announce via live region
      const live = document.getElementById('nav-live');
      if (live) live.textContent = 'You have been logged out.';
    } finally {
      setIsLoggingOut(false);
    }
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
      role='navigation'
      aria-label='Main Navigation'
      // The column variant lives in PosterFrame, whose side padding keeps the bar clear of
      // the brass corners below lg; from lg it's a full-height column (the corners sit over
      // its ends). The plain bar (pages without the frame) stops short of the corners from
      // md up. Both are the travel-paperwork card: aged parchment, thin brown edge, dashed
      // printed line.
      className={`relative z-50 h-fit rounded-lg paper-aged ticket-edge text-poster-ink no__highlights ${
        column ? 'lg:sticky lg:top-2 lg:h-[calc(100svh-1rem)]' : 'md:mx-14'
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
        column={column}
      />

      <MobileNavSection
        navLinkItemsArray={navLinkItemsArray}
        user={user}
        handleLogout={handleLogout}
        isLoggingOut={isLoggingOut}
      />
    </nav>
  );
}

/* Desktop nav (lg and up): a bar, or the home page's column */
function DesktopNavSection({ navLinkItemsArray, user, handleLogout, isLoggingOut, column }) {
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
        column ? 'h-full content-start justify-items-center gap-10 px-6 py-10' : 'grid-cols-reg items-center gap-6 px-6 py-3'
      }`}
    >
      {/* Logo; in the column, above a perforated tear line like the boarding pass */}
      <div className={column ? 'grid w-full justify-items-center border-b-2 border-dashed border-poster-brown pb-8' : 'grid'}>
        <NavLink to={HOME_PAGE_URL} aria-label={`${CompanyName} homepage`} className='grid items-center active:scale-95'>
          <BrandWordmark size={column ? 'xl' : 'md'} stacked={column} />
        </NavLink>
      </div>

      {/* Desktop nav list */}
      <ul
        ref={desktopNavRef}
        className={`grid gap-2 ${column ? 'w-full justify-items-stretch text-center' : 'grid-row justify-self-end items-center'}`}
      >
        {navLinkItemsArray.map(({ path, label, subpages }) =>
          subpages ? (
            <li key={label} className='relative grid'>
              {/* Click-only toggle (no hover-to-open) */}
              <button
                type='button'
                className={`${navButtonStatic} grid-cols-a1a gap-2`}
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
                <FaCaretDown size={12} aria-hidden='true' />
              </button>
              {openDesktopDropdown === label && (
                <ul
                  id={`desktop-submenu-${label}`}
                  className={`absolute z-20 grid min-w-40 gap-2 ticket-edge rounded-md bg-poster-paper p-4 ${
                    column ? 'left-full top-0' : 'right-0 top-full'
                  }`}
                  aria-label={`${label} submenu`}
                >
                  {subpages.map(({ path: sp, label: sl }) => (
                    <NavItem key={sl} path={sp} title={sl} />
                  ))}
                </ul>
              )}
            </li>
          ) : (
            <NavItem key={label} path={path} title={label} />
          )
        )}

        {/* Logout button */}
        {user?.email && (
          <li className='grid'>
            <LogoutButton user={user} onLogout={handleLogout} isLoggingOut={isLoggingOut} />
          </li>
        )}
      </ul>
    </section>
  );
}

/* Mobile nav (below lg) */
function MobileNavSection({ navLinkItemsArray, user, handleLogout, isLoggingOut }) {
  const [isPhoneNavOpen, setIsPhoneNavOpen] = useState(false);
  const [openMobileDropdown, setOpenMobileDropdown] = useState(null);

  const togglePhoneNav = () => setIsPhoneNavOpen((prev) => !prev);
  const handleMobileDropdownToggle = (label) => {
    setOpenMobileDropdown((prev) => (prev === label ? null : label));
  };

  return (
    <section className='grid lg:hidden grid-cols-reg items-center px-4 py-3'>
      {/* Logo */}
      <NavLink to={HOME_PAGE_URL} aria-label={`${CompanyName} homepage`} className='grid items-center active:scale-95'>
        <BrandWordmark size='md' hideNameOnPhones />
      </NavLink>

      {/* Toggle: a rubber stamp reading MENU / CLOSE */}
      <MenuStampButton open={isPhoneNavOpen} onClick={togglePhoneNav} controls='mobile-nav' />

      {/* Sliding panel */}
      <section
        id='mobile-nav'
        className={`phone-nav grid gap-6 rounded-lg paper-aged ticket-edge py-8 transition-transform duration-300 ${
          isPhoneNavOpen ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-full opacity-0'
        }`}
      >
        <ul className='mx-auto grid w-full max-w-xs gap-3 text-center'>
          {navLinkItemsArray.map(({ path, label, subpages }) =>
            subpages ? (
              <li key={label} className='grid gap-2'>
                <button
                  onClick={() => handleMobileDropdownToggle(label)}
                  className={`${navButtonStatic} grid-cols-a1a gap-2`}
                  aria-haspopup='true'
                  aria-expanded={openMobileDropdown === label}
                  aria-controls={`mobile-submenu-${label}`}
                  aria-label={`${label} submenu toggle`}
                  type='button'
                >
                  <span aria-hidden='true' />
                  <span>{label}</span>
                  <span className={`grid transition-transform duration-300 ${openMobileDropdown === label ? 'rotate-180' : ''}`}>
                    <FaCaretDown size={12} aria-hidden='true' />
                  </span>
                </button>

                {openMobileDropdown === label && (
                  <ul id={`mobile-submenu-${label}`} className='grid gap-2 border-l-4 border-poster-brown pl-3' aria-label={`${label} submenu`}>
                    {subpages.map(({ path: sp, label: sl }) => (
                      <NavItem key={sl} path={sp} title={sl} />
                    ))}
                  </ul>
                )}
              </li>
            ) : (
              <NavItem key={label} path={path} title={label} />
            )
          )}

          {/* Logout button */}
          {user?.email && (
            <li className='grid'>
              <LogoutButton user={user} onLogout={handleLogout} isLoggingOut={isLoggingOut} />
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

function LogoutButton({ user, onLogout, isLoggingOut }) {
  return (
    <button
      type='button'
      onClick={onLogout}
      className={navButtonStatic}
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

const NavItem = ({ path, title }) => {
  const doPrefetch = () => prefetchRoute(path);

  return (
    <li itemProp='path' className='grid'>
      <NavLink
        to={path}
        aria-label={`${title} page navigation tab`}
        className={navButtonClass}
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

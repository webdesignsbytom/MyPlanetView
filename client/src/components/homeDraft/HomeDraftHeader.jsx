import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { HOME_PAGE_URL } from '@/utils/constants/routes';
import { CompanyName } from '@/utils/constants/constants';
import { getNavLinkItemsArray } from '@/utils/data/navData';
import { prefetchRoute } from '@/utils/navigation/prefetchRoute';
import compass from '@/assets/homeDraft/compass.webp';

// The draft stands in for the home page, so Home is drawn as the page you're on (its gold
// underline), though it links to the real one
const linkClass = (path) => ({ isActive }) => (isActive || path === HOME_PAGE_URL ? 'current' : undefined);

function DraftNavLink({ path, label, onChoose }) {
  const prefetch = () => prefetchRoute(path);
  return (
    <NavLink to={path} className={linkClass(path)} onMouseEnter={prefetch} onFocus={prefetch} onTouchStart={prefetch} onClick={onChoose}>
      {label}
    </NavLink>
  );
}

/**
 * The draft's own bar with the site's real links (navData's, as the main nav has them: the
 * account's links signed in, Login and Sign Up signed out, Admin's pages for admins), in a
 * row on wide screens and behind a Menu button below 1200px.
 */
export default function HomeDraftHeader() {
  const { user, logout } = useAuth();
  const items = getNavLinkItemsArray(user);
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const close = () => setOpen(false);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    setLogoutError('');
    const result = await logout();
    setLoggingOut(false);
    if (result.ok) close();
    else setLogoutError(result.error);
  };

  return (
    <header
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) {
          close();
          event.currentTarget.querySelector('.menu-toggle')?.focus();
        }
      }}
    >
      <a href='#main-content' className='skip-link'>
        Skip to main content
      </a>
      <Link to={HOME_PAGE_URL} className='wordmark' aria-label={`${CompanyName} homepage`}>
        <img src={compass} alt='' /> My Planet View
      </Link>
      <button type='button' className='menu-toggle' aria-expanded={open} aria-controls='home-draft-nav' onClick={() => setOpen((was) => !was)}>
        {open ? 'Close' : 'Menu'}
      </button>
      <nav id='home-draft-nav' aria-label='Main' data-open={open || undefined}>
        <ul>
          {items.map(({ path, label, subpages }) =>
            subpages ? (
              <li key={label}>
                <details>
                  <summary>{label}</summary>
                  <ul>
                    {subpages.map((page) => (
                      <li key={page.path}>
                        <DraftNavLink path={page.path} label={page.label} onChoose={close} />
                      </li>
                    ))}
                  </ul>
                </details>
              </li>
            ) : (
              <li key={path}>
                <DraftNavLink path={path} label={label} onChoose={close} />
              </li>
            ),
          )}
          {user ? (
            <li>
              <button type='button' onClick={handleLogout} aria-busy={loggingOut} aria-label={`Log out ${user.email} from ${CompanyName}`}>
                {loggingOut ? 'Logging out…' : 'Logout'}
              </button>
            </li>
          ) : null}
        </ul>
        {logoutError ? (
          <p role='alert' className='nav-error'>
            {logoutError}
          </p>
        ) : null}
      </nav>
    </header>
  );
}

import React from 'react';
import { Link } from 'react-router-dom';
// Auth
import { useAuth } from '@/auth/AuthContext';
import { hasRole, ROLES } from '@/utils/user/permissions';
// Constants
import {
  ADMIN_CONTACT_FORM_PAGE_URL,
  ADMIN_USERS_PAGE_URL,
  ADMIN_EVENTS_PAGE_URL,
  ADMIN_PROMO_CODES_PAGE_URL,
  ADMIN_OFFERS_PAGE_URL,
  ADMIN_THEMES_PAGE_URL,
} from '@/utils/constants/routes';
// Components
import PaperCard from '@/components/common/PaperCard';

const ADMIN_LINKS = [
  { path: ADMIN_CONTACT_FORM_PAGE_URL, label: 'Contact Forms', desc: 'Messages sent from the contact page' },
  { path: ADMIN_USERS_PAGE_URL, label: 'Users', desc: 'Roles, account status, memberships and moving maps' },
  { path: ADMIN_PROMO_CODES_PAGE_URL, label: 'Promo Codes', desc: 'Creators’ sign-up codes, their offers and who they brought' },
  { path: ADMIN_OFFERS_PAGE_URL, label: 'Travel Offers', desc: 'Partner cards and the Travel Desk: clicks, changes and the import file' },
  { path: ADMIN_THEMES_PAGE_URL, label: 'Photo Themes', desc: 'One theme a month: write the year ahead, see how many photos each drew' },
];

const DEVELOPER_LINKS = [
  { path: ADMIN_EVENTS_PAGE_URL, label: 'Audit Log', desc: 'App events, errors and triage' },
];

function AdminQuickLinks() {
  const { user } = useAuth();
  const links = hasRole(user, ROLES.DEVELOPER)
    ? [...ADMIN_LINKS, ...DEVELOPER_LINKS]
    : ADMIN_LINKS;

  return (
    <PaperCard title='Manage' titleId='admin-quick-links-heading'>
      {/* Links, as parchment tickets (the map panels' chosen-card look) */}
      <ul className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        {links.map(({ path, label, desc }) => (
          <li key={path} className='grid'>
            <Link
              to={path}
              className='paper-aged grid gap-1 border-2 border-poster-brown p-4 text-poster-ink shadow-paper transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-colour6'
            >
              <span className='font-travel text-xl uppercase tracking-wide text-poster-red-deep'>{label}</span>
              <span className='text-sm'>{desc}</span>
            </Link>
          </li>
        ))}
      </ul>
    </PaperCard>
  );
}

export default AdminQuickLinks;

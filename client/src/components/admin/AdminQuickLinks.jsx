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
} from '@/utils/constants/routes';

const ADMIN_LINKS = [
  { path: ADMIN_CONTACT_FORM_PAGE_URL, label: 'Contact Forms', desc: 'Messages sent from the contact page' },
  { path: ADMIN_USERS_PAGE_URL, label: 'Users', desc: 'Roles and account status' },
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
    <section className='grid w-full gap-y-6' aria-labelledby='admin-quick-links-heading'>
      {/* Header */}
      <div className='grid w-full bg-colour6 px-4 lg:px-6 py-3 h-fit border-b-4 border-solid border-colour6'>
        <h2
          id='admin-quick-links-heading'
          className='sm:text-lg md:text-xl lg:text-2xl font-semibold text-colour1'
        >
          Manage
        </h2>
      </div>

      {/* Links */}
      <ul className='grid gap-4 px-4 lg:px-6 sm:grid-cols-2 lg:grid-cols-3'>
        {links.map(({ path, label, desc }) => (
          <li key={path}>
            <Link
              to={path}
              className='grid h-full gap-1 rounded-lg border-2 border-colour6 bg-colour1 p-4 shadow hover:bg-colour3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2'
            >
              <span className='font-semibold text-lg'>{label}</span>
              <span className='text-sm'>{desc}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default AdminQuickLinks;

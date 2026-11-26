import React from 'react';
// Components
import AdminQuickLinks from './AdminQuickLinks';
import AdminOverviewSection from './overview/AdminOverviewSection';
import ContactFormDataSection from '../contact/admin/ContactFormDataSection';

// The admin dashboard's paper cards, under its title (inside AppPageShell's <main>): the site's
// overview and its daily jobs first (the audit, 26 Nov 2026), then the pages, then the latest
// contact forms
function AdminDashboardMainContainer() {
  return (
    <>
      <AdminOverviewSection />
      <AdminQuickLinks />
      <ContactFormDataSection />
    </>
  );
}

export default AdminDashboardMainContainer;

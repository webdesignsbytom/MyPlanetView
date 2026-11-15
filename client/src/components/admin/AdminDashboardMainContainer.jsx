import React from 'react';
// Components
import AdminQuickLinks from './AdminQuickLinks';
import ContactFormDataSection from '../contact/admin/ContactFormDataSection';

// The admin dashboard's paper cards, under its title (inside AppPageShell's <main>)
function AdminDashboardMainContainer() {
  return (
    <>
      <AdminQuickLinks />
      <ContactFormDataSection />
    </>
  );
}

export default AdminDashboardMainContainer;

import React from 'react';
// Components
import AdminQuickLinks from './AdminQuickLinks';
import ContactFormDataSection from '../contact/admin/ContactFormDataSection';

function AdminDashboardMainContainer() {
  return (
    <main
      id='main-content'
      tabIndex={-1}
      role='main'
      className='grid w-full h-full gap-y-6 bg-colour3'
      aria-label='Admin dashboard'
    >
      <AdminQuickLinks />
      <ContactFormDataSection />
    </main>
  );
}

export default AdminDashboardMainContainer;

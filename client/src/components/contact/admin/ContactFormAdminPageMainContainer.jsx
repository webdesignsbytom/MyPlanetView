import React from 'react';
// Components
import ContactFormDataSection from './ContactFormDataSection';

function ContactFormAdminPageMainContainer() {
  return (
    <main
      id='main-content'
      tabIndex={-1}
      role='main'
      className='grid w-full h-full'
      aria-label='Admin contact form page'
    >
      <ContactFormDataSection />
    </main>
  );
}

export default ContactFormAdminPageMainContainer;

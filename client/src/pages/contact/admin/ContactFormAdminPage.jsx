import React from 'react';
// Constants
import {
  ADMIN_CONTACT_FORM_PAGE_URL,
} from '@/utils/constants/routes';
// Data
import { helmetData } from '@/utils/data/helmetData';
// Components
import { HelmetItem } from '@/components/utils/HelmetItem';
import Navbar from '../../../components/nav/Navbar';
import ContactFormAdminPageMainContainer from '../../../components/contact/admin/ContactFormAdminPageMainContainer';

function ContactFormAdminPage() {
  const pageHelmet = helmetData[ADMIN_CONTACT_FORM_PAGE_URL];


  return (
    <>
      <HelmetItem
        PageName={pageHelmet.pageName}
        desc={pageHelmet.desc}
        indexing={pageHelmet.indexing}
        additionalMeta={pageHelmet.additionalMeta || []}
        structuredData={pageHelmet.structuredData || []}
        canonicalPath={ADMIN_CONTACT_FORM_PAGE_URL}
      />

      <div
        className='grid min-h-screen overflow-hidden'
        role='document'
        aria-label='Admin Contact Form Page'
      >
        <div className='grid grid-rows-reg w-full'>
          <div className='grid grid-rows-reg w-full'>
            <Navbar />

            <header className='grid w-screen border-b-2 border-solid border-colour4 h-fit'>
              <div className='grid gap-6 px-6 sm:px-10 md:px-16 lg:px-20 xl:px-24 bg-colour5 text-center h-fit py-12'>
                <h1 className='font-titleFont text-colour4 text-4xl md:text-5xl font-extrabold'>
                  Admin - Contact Forms
                </h1>
              </div>
            </header>
          </div>

          <ContactFormAdminPageMainContainer />
        </div>
      </div>
    </>
  );
}

export default ContactFormAdminPage;
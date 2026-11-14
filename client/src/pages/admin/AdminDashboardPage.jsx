import React from 'react';
// Constants
import { ADMIN_PAGE_URL } from '@/utils/constants/routes';
// Data
import { helmetData } from '@/utils/data/helmetData';
// Components
import { HelmetItem } from '@/components/utils/HelmetItem';
import Navbar from '@/components/nav/Navbar';
import AdminDashboardMainContainer from '@/components/admin/AdminDashboardMainContainer';

function AdminDashboardPage() {
  const pageHelmet = helmetData[ADMIN_PAGE_URL];


  return (
    <>
      <HelmetItem
        PageName={pageHelmet.pageName}
        desc={pageHelmet.desc}
        indexing={pageHelmet.indexing}
        additionalMeta={pageHelmet.additionalMeta || []}
        structuredData={pageHelmet.structuredData || []}
        canonicalPath={ADMIN_PAGE_URL}
      />

      <div
        className='grid min-h-screen overflow-hidden'
        role='document'
        aria-label='Admin dashboard page'
      >
        <div className='grid grid-rows-reg w-full'>
          <div className='grid grid-rows-reg w-full'>
            <Navbar />

            <header className='grid w-screen h-fit border-b-4 border-t-4 border-colour6'>
              <div className='grid gap-6 px-6 sm:px-10 md:px-16 lg:px-20 xl:px-24 bg-colour3 text-center h-fit py-8'>
                <h1 className='font-titleFont text-4xl font-extrabold'>
                  Admin Dashboard
                </h1>
              </div>
            </header>
          </div>

          <AdminDashboardMainContainer />
        </div>
      </div>
    </>
  );
}

export default AdminDashboardPage;

import React from 'react';
// Constants
import { CompanyName } from '@/utils/constants/constants';
// Components
import TravelTicket from '@/components/auth/TravelTicket';
import ContactForm from '@/components/forms/ContactForm';
import ContactBlurbSection from './ContactBlurbSection';

// The contact page: the form on a postcard-style ticket (the page's h1 is its title),
// then the other ways to reach us: stacked below xl, side by side from xl up.
function ContactPageMainContainer() {
  return (
    <div className='grid w-full gap-4 lg:gap-2 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start'>
      <TravelTicket
        kicker='Postcard'
        title='Contact us'
        headingId='contact-title'
        subtitle='A question about your map, something that is not working, or an idea for a feature? Send us a message and we will reply by email.'
        subtitleId='contact-subtitle'
        route={{ from: 'You', to: CompanyName }}
        stub={['Air mail', 'Priority', 'Reply by email']}
        stamp={['Air', 'mail']}
        widthClassName=''
      >
        <section className='grid' aria-labelledby='contact-form-title'>
          <h2 id='contact-form-title' className='sr-only'>
            Contact form
          </h2>
          <ContactForm />
        </section>
      </TravelTicket>

      <ContactBlurbSection />
    </div>
  );
}

export default ContactPageMainContainer;

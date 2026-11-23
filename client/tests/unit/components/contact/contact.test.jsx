import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import ContactBlurbSection from '@/components/contact/ContactBlurbSection';
import ContactPageMainContainer from '@/components/contact/ContactPageMainContainer';
import { CompanyEmailAddress, CompanyName } from '@/utils/constants/constants';
import { renderPage } from '../../pages/renderPage';

vi.mock('@/components/forms/ContactForm', () => ({ default: () => <form data-contact-form /> }));

describe('ContactBlurbSection', () => {
  it('gives the email address as a mailto link and links to the FAQ', () => {
    const { container } = renderPage(<ContactBlurbSection />);
    expect(container.querySelector('#contact-blurb-title').textContent).toBe('Get in touch');
    const mail = container.querySelector('a[href^="mailto:"]');
    expect(mail.getAttribute('href')).toBe(`mailto:${CompanyEmailAddress}`);
    expect(mail.getAttribute('aria-label')).toBe(`Email ${CompanyEmailAddress}`);
    expect(mail.textContent).toBe(CompanyEmailAddress);
    const faq = [...container.querySelectorAll('a')].find((a) => a.textContent === 'Read the FAQ');
    expect(faq.getAttribute('href')).toBe('/faq');
  });
});

describe('ContactPageMainContainer', () => {
  it('puts the form in a postcard ticket titled Contact us, beside the other ways', () => {
    const { container } = renderPage(<ContactPageMainContainer />);
    const h1 = container.querySelector('h1#contact-title');
    expect(h1.textContent).toContain('Contact us');
    expect(container.querySelectorAll('h1').length).toBe(1);
    expect(container.querySelector('#contact-subtitle').textContent).toContain('Send us a message');
    const section = container.querySelector('section[aria-labelledby="contact-form-title"]');
    expect(section.querySelector('[data-contact-form]')).toBeTruthy();
    expect(container.querySelector('#contact-form-title').textContent).toBe('Contact form');
    expect(container.textContent).toContain(CompanyName);
    expect(container.querySelector('#contact-blurb-title')).toBeTruthy();
  });
});

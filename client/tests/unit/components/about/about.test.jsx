import React from 'react';
import { describe, expect, it } from 'vitest';
import AboutPageHeader from '@/components/about/AboutPageHeader';
import AboutPageMainContainer from '@/components/about/AboutPageMainContainer';
import AboutSection from '@/components/about/AboutSection';
import HowItWorksCta from '@/components/about/HowItWorksCta';
import HowItWorksFeatures from '@/components/about/HowItWorksFeatures';
import HowItWorksGroups from '@/components/about/HowItWorksGroups';
import HowItWorksHeading from '@/components/about/HowItWorksHeading';
import HowItWorksPrivacy from '@/components/about/HowItWorksPrivacy';
import HowItWorksSection from '@/components/about/HowItWorksSection';
import { aboutIntro, aboutSections } from '@/utils/data/aboutData';
import { homeCta, homeFeatures, homeFeaturesIntro, homeGroups, homePrivacy } from '@/utils/data/homeData';
import { CompanyName } from '@/utils/constants/constants';
import { renderPage, signedIn } from '../../pages/renderPage';

const texts = (container, selector) => [...container.querySelectorAll(selector)].map((el) => el.textContent.trim());

describe('AboutPageHeader', () => {
  it('is the page’s h1 with the intro under it', () => {
    const { container } = renderPage(<AboutPageHeader />);
    const h1 = container.querySelector('h1');
    expect(h1.id).toBe('about-title');
    expect(h1.textContent).toContain(`About ${CompanyName}`);
    expect(container.querySelector('#about-subtitle').textContent).toBe(aboutIntro);
  });
});

describe('AboutSection', () => {
  it('is a section named by its h2, one paragraph per line of text', () => {
    const { container } = renderPage(<AboutSection id='why' title='Why we made it' paragraphs={['One.', 'Two.']} />);
    const section = container.querySelector('section');
    expect(section.getAttribute('aria-labelledby')).toBe('why');
    expect(container.querySelector('h2#why').textContent).toBe('Why we made it');
    expect(texts(container, 'p')).toEqual(['One.', 'Two.']);
  });
});

describe('AboutPageMainContainer', () => {
  it('tells the story section by section, then how it works', () => {
    const { container } = renderPage(<AboutPageMainContainer />);
    const card = container.querySelector('[aria-label="Our story"]');
    const titles = texts(card, 'section > h2');
    expect(titles.slice(0, aboutSections.length)).toEqual(aboutSections.map((section) => section.title));
    expect(container.querySelector('#how-it-works')).toBeTruthy();
  });
});

describe('HowItWorksHeading', () => {
  it('shows an eyebrow only when given one', () => {
    const { container, rerender } = renderPage(<HowItWorksHeading id='h' eyebrow='How it works' title='Title' />);
    expect(container.querySelector('span').textContent).toBe('How it works');
    expect(container.querySelector('h2#h').textContent).toBe('Title');
    rerender(<HowItWorksHeading id='h' title='Title' />);
    expect(container.querySelector('h2').textContent).toBe('Title');
    expect(container.querySelector('span')).toBeNull();
  });
});

describe('HowItWorksFeatures', () => {
  it('lists every feature with its title and text, an icon each', () => {
    const { container } = renderPage(<HowItWorksFeatures />);
    expect(container.querySelector('#how-features-title').textContent).toBe('Everywhere you have been, in one place');
    expect(container.textContent).toContain(homeFeaturesIntro);
    const items = container.querySelectorAll('li');
    expect(items.length).toBe(homeFeatures.length);
    homeFeatures.forEach((feature, index) => {
      expect(items[index].querySelector('h3').textContent).toBe(feature.title);
      expect(items[index].textContent).toContain(feature.text);
      expect(items[index].querySelector('[aria-hidden="true"] svg')).toBeTruthy();
    });
  });
});

describe('HowItWorksGroups', () => {
  it('lists the solo, couple and family maps', () => {
    const { container } = renderPage(<HowItWorksGroups />);
    expect(texts(container, 'h3')).toEqual(homeGroups.map((group) => group.title));
    expect(container.querySelectorAll('li svg[aria-hidden="true"]').length).toBe(homeGroups.length);
  });
});

describe('HowItWorksPrivacy', () => {
  it('lists every privacy point and links to the FAQ', () => {
    const { container } = renderPage(<HowItWorksPrivacy />);
    expect(container.querySelector('#how-privacy-title').textContent).toBe(homePrivacy.title);
    expect(container.textContent).toContain(homePrivacy.intro);
    expect(texts(container, 'li span')).toEqual(homePrivacy.points);
    const link = [...container.querySelectorAll('a')].find((a) => a.textContent === 'Read more about privacy and sharing');
    expect(link.getAttribute('href')).toBe('/faq');
  });
});

describe('HowItWorksCta', () => {
  const link = (container) => container.querySelector('a');

  it('asks a visitor to start a map, at sign-up', () => {
    const { container } = renderPage(<HowItWorksCta />);
    expect(container.querySelector('#how-cta-title').textContent).toBe(homeCta.title);
    expect(container.textContent).toContain(homeCta.text);
    expect(link(container).textContent).toBe('Start your map');
    expect(link(container).getAttribute('href')).toBe('/sign-up');
  });

  it('sends someone signed in to their map', () => {
    const { container } = renderPage(<HowItWorksCta />, { auth: signedIn() });
    expect(link(container).textContent).toBe('Open your map');
    expect(link(container).getAttribute('href')).toBe('/map');
  });
});

describe('HowItWorksSection', () => {
  it('holds the four parts in order, under the how-it-works anchor', () => {
    const { container } = renderPage(<HowItWorksSection />);
    const section = container.querySelector('#how-it-works');
    const ids = [...section.querySelectorAll(':scope > section')].map((el) => el.getAttribute('aria-labelledby'));
    expect(ids).toEqual(['how-features-title', 'how-groups-title', 'how-privacy-title', 'how-cta-title']);
  });
});

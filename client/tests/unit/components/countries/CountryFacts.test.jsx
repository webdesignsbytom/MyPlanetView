import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import CountryFacts from '@/components/countries/CountryFacts';
import { FACT_FIELDS } from '@/utils/countries/countryContent';

const facts = {
  wikidata: 'Q142',
  queried: '2026-11-16',
  items: [
    { key: 'currency', text: 'Euro (€)' },
    { key: 'languages', text: 'French' },
    { key: 'plugs', text: 'Types C and E, 230 V' },
    { key: 'driving', text: 'On the right' },
    { key: 'timeZones', text: 'UTC+1, UTC+2 in summer' },
    { key: 'emergency', text: '112' },
    { key: 'callingCode', text: '+33' },
  ],
};

describe('CountryFacts', () => {
  it('lists every practical fact in the fixed order, each under its label', () => {
    const { container } = render(<CountryFacts name='France' facts={facts} />);
    const terms = [...container.querySelectorAll('dt')].map((dt) => dt.textContent);
    const values = [...container.querySelectorAll('dd')].map((dd) => dd.textContent);
    expect(terms).toEqual(FACT_FIELDS.map((field) => field.label));
    expect(values).toEqual(['Euro (€)', 'French', 'Types C and E, 230 V', 'On the right', 'UTC+1, UTC+2 in summer', '112', '+33']);
  });

  it('keeps the order of the fields whatever order the content gives them in', () => {
    const shuffled = { ...facts, items: [...facts.items].reverse() };
    const { container } = render(<CountryFacts name='France' facts={shuffled} />);
    expect(container.querySelector('dd').textContent).toBe('Euro (€)');
  });

  it('credits Wikidata with a link to the country’s item, opening in a new tab, and the day it was read', () => {
    render(<CountryFacts name='France' facts={facts} />);
    const link = screen.getByText('France on Wikidata');
    expect(link.getAttribute('href')).toBe('https://www.wikidata.org/wiki/Q142');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    expect(link.parentElement.textContent).toContain('queried on 16 November 2026');
    expect(link.parentElement.textContent).toContain('check before you travel');
  });

  it('is a card named "Practical facts"', () => {
    const { container } = render(<CountryFacts name='France' facts={facts} />);
    expect(container.querySelector('section').getAttribute('aria-labelledby')).toBe('country-facts-heading');
    expect(container.querySelector('#country-facts-heading').textContent).toBe('Practical facts');
  });
});

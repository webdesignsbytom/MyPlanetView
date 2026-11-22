import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import CountryCulture from '@/components/countries/CountryCulture';

const culture = (phrases = {}) => ({
  greetings: 'A handshake, or two kisses among friends.',
  tipping: 'Service is included; round up for good service.',
  dress: 'Smart casual in the cities.',
  etiquette: ['Say bonjour when you walk into a shop.', 'Keep your hands on the table.'],
  food: [
    { name: 'Croissant', text: 'Breakfast, from a bakery.' },
    { name: 'Ratatouille', text: 'A summer stew of vegetables.' },
  ],
  phrases: {
    language: 'French',
    intro: 'A few words go a long way.',
    items: [
      { phrase: 'Bonjour', say: 'bon-zhoor', meaning: 'Hello' },
      { phrase: 'Merci', say: 'mair-see', meaning: 'Thank you' },
    ],
    ...phrases,
  },
});

describe('CountryCulture', () => {
  it('names the card and its three side-by-side sections with their words', () => {
    const { container } = render(<CountryCulture culture={culture()} />);
    const card = container.querySelector('section[aria-labelledby="country-culture-heading"]');
    expect(card.querySelector('#country-culture-heading').textContent).toBe('Culture and customs');
    expect(container.querySelector('#country-greetings-heading').textContent).toBe('Greetings');
    expect(container.querySelector('[aria-labelledby="country-greetings-heading"] p').textContent).toBe(culture().greetings);
    expect(container.querySelector('[aria-labelledby="country-tipping-heading"] p').textContent).toBe(culture().tipping);
    expect(container.querySelector('#country-dress-heading').textContent).toBe('What to wear');
    expect(container.querySelector('[aria-labelledby="country-dress-heading"] p').textContent).toBe(culture().dress);
  });

  it('lists the etiquette, and the food as terms with their descriptions', () => {
    const { container } = render(<CountryCulture culture={culture()} />);
    const etiquette = container.querySelectorAll('[aria-labelledby="country-etiquette-heading"] li');
    expect([...etiquette].map((li) => li.textContent)).toEqual(culture().etiquette);
    const terms = [...container.querySelectorAll('[aria-labelledby="country-food-heading"] dt')].map((dt) => dt.textContent);
    const descriptions = [...container.querySelectorAll('[aria-labelledby="country-food-heading"] dd')].map((dd) => dd.textContent);
    expect(terms).toEqual(['Croissant', 'Ratatouille']);
    expect(descriptions).toEqual(['Breakfast, from a bakery.', 'A summer stew of vegetables.']);
  });

  it('gives the phrases a "Say it" column when the content has pronunciations', () => {
    const { container } = render(<CountryCulture culture={culture()} />);
    expect(container.querySelector('#country-phrases-heading').textContent).toBe('A few words of French');
    expect(screen.getByText('A few words go a long way.')).toBeTruthy();
    const table = container.querySelector('table');
    expect([...table.querySelectorAll('thead th')].map((th) => th.textContent)).toEqual(['Phrase', 'Say it', 'Meaning']);
    const first = table.querySelectorAll('tbody tr')[0];
    expect(within(first).getByText('Bonjour').getAttribute('scope')).toBe('row');
    expect([...first.querySelectorAll('td')].map((td) => td.textContent)).toEqual(['bon-zhoor', 'Hello']);
  });

  it('drops the "Say it" column and the intro when there are none', () => {
    const items = [{ phrase: 'Ja', meaning: 'Yes' }];
    const { container } = render(<CountryCulture culture={culture({ intro: '', items })} />);
    const table = container.querySelector('table');
    expect([...table.querySelectorAll('thead th')].map((th) => th.textContent)).toEqual(['Word', 'Meaning']);
    expect([...table.querySelectorAll('tbody td')].map((td) => td.textContent)).toEqual(['Yes']);
    expect(container.querySelector('[aria-labelledby="country-phrases-heading"] p')).toBeNull();
  });
});

import React from 'react';
import { describe, expect, it } from 'vitest';
import { waitFor } from '@testing-library/react';
import FaqPage from '@/pages/faq/FaqPage';
import { FAQ_PAGE_URL } from '@/utils/constants/routes';
import { faqsArray } from '@/utils/data/faqData';
import { headings, onlyMain, renderPage } from '../renderPage';

describe('FaqPage', () => {
  it('has one main, labelled by its h1', () => {
    renderPage(<FaqPage />, { path: FAQ_PAGE_URL });
    const { count, main, id } = onlyMain();
    expect(count).toBe(1);
    expect(id).toBe('main-content');
    expect(main.getAttribute('aria-labelledby')).toBe('faq-title');
    expect(main.getAttribute('aria-describedby')).toBe('faq-subtitle');
    expect(headings()).toEqual(['Frequently asked questions']);
  });

  it('shows every question', () => {
    renderPage(<FaqPage />, { path: FAQ_PAGE_URL });
    const text = document.querySelector('main').textContent;
    for (const { question } of faqsArray) expect(text).toContain(question);
  });

  it('marks the questions up as an FAQPage, the same ones as on the page', async () => {
    renderPage(<FaqPage />, { path: FAQ_PAGE_URL });
    await waitFor(() => expect(document.title).toMatch(/FAQ/));
    const schemas = [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => JSON.parse(s.textContent));
    const faq = schemas.find((s) => s['@type'] === 'FAQPage');
    expect(faq.mainEntity).toHaveLength(faqsArray.length);
    expect(faq.mainEntity[0].name).toBe(faqsArray[0].question);
  });
});

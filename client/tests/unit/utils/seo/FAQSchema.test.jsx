import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import FAQSchema from '@/utils/seo/FAQSchema';

describe('FAQSchema', () => {
  it('renders nothing with no questions', () => {
    const { container } = render(<FAQSchema />);
    expect(container.innerHTML).toBe('');
    expect(render(<FAQSchema items={[]} />).container.innerHTML).toBe('');
  });

  it('writes an FAQPage as JSON-LD, one Question and Answer per item, in order', () => {
    const { container } = render(
      <FAQSchema
        items={[
          { q: 'Is it free?', a: 'Economy is free.' },
          { q: 'Can I share?', a: 'Yes, by link or by email.' },
        ]}
      />,
    );
    const script = container.querySelector('script');
    expect(script.getAttribute('type')).toBe('application/ld+json');
    expect(JSON.parse(script.textContent)).toEqual({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        { '@type': 'Question', name: 'Is it free?', acceptedAnswer: { '@type': 'Answer', text: 'Economy is free.' } },
        { '@type': 'Question', name: 'Can I share?', acceptedAnswer: { '@type': 'Answer', text: 'Yes, by link or by email.' } },
      ],
    });
  });

  it('keeps markup-like text as data, never as markup', () => {
    const { container } = render(<FAQSchema items={[{ q: '<b>Bold?</b>', a: 'a </script> b' }]} />);
    const data = JSON.parse(container.querySelector('script').textContent);
    expect(data.mainEntity[0].name).toBe('<b>Bold?</b>');
    expect(data.mainEntity[0].acceptedAnswer.text).toBe('a </script> b');
    expect(container.querySelector('b')).toBeNull();
  });
});

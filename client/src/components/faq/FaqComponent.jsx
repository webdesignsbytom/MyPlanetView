import React, { useState } from 'react';
// Data
import { faqsArray } from '@/utils/data/faqData';
// Components
import FaqItem from './FaqItem';

// The questions, one paper card each (two columns from xl); one answer open at a time
function FaqComponent() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFaq = (index) => {
    setOpenIndex((current) => (current === index ? null : index));
  };

  return (
    <section className='grid w-full gap-4 lg:gap-2 xl:grid-cols-2 xl:items-start' aria-labelledby='faq-list-title'>
      <h2 id='faq-list-title' className='sr-only'>
        Frequently asked questions
      </h2>

      {faqsArray.map((faq, index) => (
        <FaqItem
          key={faq.question}
          index={index}
          question={faq.question}
          answer={faq.answer}
          isOpen={openIndex === index}
          onToggle={toggleFaq}
        />
      ))}
    </section>
  );
}

export default FaqComponent;

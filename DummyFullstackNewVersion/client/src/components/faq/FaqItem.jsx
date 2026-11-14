import React from 'react';

/**
 * One question as a piece of travel paperwork: the question on an aged-parchment strip
 * (the accordion button, inside the heading), a stamp-style + / − mark, and the answer
 * on cream paper below a dashed perforation. Closed answers stay in the HTML, so
 * crawlers and the FAQ structured data still see them.
 */
function FaqItem({ index, question, answer, isOpen, onToggle }) {
  const questionId = `faq-question-${index}`;
  const answerId = `faq-answer-${index}`;

  return (
    <article className='ticket-edge grid overflow-hidden rounded-lg bg-paper-cream text-colour4'>
      <h3 className='grid'>
        <button
          type='button'
          id={questionId}
          onClick={() => onToggle(index)}
          aria-expanded={isOpen}
          aria-controls={answerId}
          className='paper-aged grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-6 py-4 text-left font-semibold text-poster-ink sm:px-8 sm:text-lg'
        >
          <span>{question}</span>
          <span
            aria-hidden='true'
            className={`grid h-9 w-9 place-items-center rounded-full border-4 border-double border-poster-red font-main text-xl font-bold leading-none text-poster-red transition ${
              isOpen ? 'rotate-0' : '-rotate-12'
            }`}
          >
            {isOpen ? '−' : '+'}
          </span>
        </button>
      </h3>

      <div
        id={answerId}
        role='region'
        aria-labelledby={questionId}
        className={`grid overflow-hidden transition-all duration-300 ${
          isOpen ? 'max-h-[40rem] border-t-2 border-dashed border-poster-brown' : 'max-h-0'
        }`}
      >
        <div className='max-w-prose px-6 py-5 leading-relaxed sm:px-8'>{answer}</div>
      </div>
    </article>
  );
}

export default FaqItem;

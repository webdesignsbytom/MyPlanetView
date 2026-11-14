import React, { useEffect, useState } from 'react';
// Icons
import { FaChevronUp } from 'react-icons/fa';

function BackToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      setVisible(window.scrollY > 300);
    };

    // use passive listener for better performance
    window.addEventListener('scroll', toggleVisibility, { passive: true });
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    // better a11y: focus the main landmark after scrolling
    const mainEl = document.querySelector('main, [role="main"]');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // delay focus slightly until after the scroll completes
    setTimeout(() => {
      if (mainEl) mainEl.focus({ preventScroll: true });
    }, 600);
  };

  return (
    <button
      type="button"
      aria-label="Back to top of page"
      title="Scroll back to the top"
      onClick={scrollToTop}
      className={`btn-poster fixed bottom-6 right-6 z-50 ${visible ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
    >
      <FaChevronUp aria-hidden="true" focusable="false" />
    </button>
  );
}

export default BackToTopButton;

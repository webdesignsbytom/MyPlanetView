import React from 'react';
// Components
import PageTitleCard from '@/components/common/PageTitleCard';

// The FAQ page's title card (its one h1)
function FaqPageHeader() {
  return (
    <PageTitleCard
      page='Questions and answers'
      title='Frequently asked questions'
      headingId='faq-title'
      subtitle='Who can see your map, how sharing works, what happens to the location in your photos, and how couples and families share a map.'
      subtitleId='faq-subtitle'
      stamp={['Info', 'desk']}
    />
  );
}

export default FaqPageHeader;

import React from 'react';
// Components
import PaperCard from '@/components/common/PaperCard';

// One section of the account page, as a paper card with its title on the parchment strip.
// `danger` (deleting the account) edges and rules it in deep red instead of brown.
function AccountCard({ id, title, danger = false, children }) {
  return (
    <PaperCard title={title} titleId={`${id}-heading`} className={danger ? 'paper-danger' : ''}>
      {children}
    </PaperCard>
  );
}

export default AccountCard;

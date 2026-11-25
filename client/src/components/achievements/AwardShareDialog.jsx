import React, { useState } from 'react';
import { createPortal } from 'react-dom';
// Components
import Modal from '@/components/common/Modal';
import ShareCardPreview from '@/components/shareCard/ShareCardPreview';
// Utils
import { awardCardOptions } from '@/utils/shareCard/cardOptions';
import { newsItemName } from '@/utils/achievements/news';

const titleFor = (news) => {
  if (news.length > 1) return 'Share what you earned';
  return news[0]?.type === 'goal' ? 'Share your goal' : 'Share your badge';
};

/**
 * A picture of what the map has just earned, to post (25 Nov 2026, the user's wish: "when you
 * earn a badge have the popup modal have a share button"), from the award pop-up's "Share a
 * picture" (AwardNews). `news` is what it announced (useAchievements' `news`): a badge's card
 * shows its sticker, a country collection's its medal, a goal's its places on the map
 * (cardOptions.js awardCardOptions). Several at once: buttons choose which, the first to start
 * with. `badges` is the badges reply (each badge's group and day), `map` and `design` the map
 * shown. Portalled, so it sits over the whole page.
 */
function AwardShareDialog({ news, badges = [], map, design = null, onClose }) {
  const [chosen, setChosen] = useState(0);
  // One card object per item, made as the dialog opens and kept: a new object draws the
  // picture again, and the map changing underneath (a refresh) shouldn't redraw it
  const [cards] = useState(() => news.map((item) => awardCardOptions(item, { badges, map, design })));
  const card = cards[chosen] || cards[0];

  return createPortal(
    <Modal title={titleFor(news)} onClose={onClose}>
      {news.length > 1 ? (
        <div role='group' aria-label='Which one to share' className='grid grid-cols-2 gap-2 sm:grid-cols-3'>
          {news.map((item, i) => {
            const on = i === chosen;
            return (
              <button
                key={item.type === 'goal' ? `goal-${item.goal.id ?? i}` : item.key}
                type='button'
                aria-pressed={on}
                onClick={() => setChosen(i)}
                className={`truncate border-2 px-2 py-1 text-sm font-semibold ${
                  on ? 'border-poster-red bg-poster-paper text-poster-red-deep' : 'border-dashed border-poster-brown/60 hover:bg-paper-cream'
                }`}
              >
                {newsItemName(item)}
              </button>
            );
          })}
        </div>
      ) : null}
      <p className='text-sm'>For Instagram, WhatsApp or anywhere you like. It never shows your photos.</p>
      {card ? <ShareCardPreview key={chosen} card={card} /> : null}
    </Modal>,
    document.body,
  );
}

export default AwardShareDialog;

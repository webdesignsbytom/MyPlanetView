import React, { useMemo } from 'react';
// Hooks
import useOffers from '@/hooks/useOffers';
// Api
import { offerClickUrl } from '@/api/offersApi';
// Components
import OfferBrochure from '@/components/offers/OfferBrochure';
// Utils
import { offersForPlacement } from '@/utils/offers/chooseOffer';
import { PRINT_OFFERS_NOTE } from '@/utils/offers/offerKinds';

// At most this many printers side by side
const SHOWN = 2;

/**
 * "Print them", under the download (docs/FEATURE-PLAN.md, "Printing", version 1): the
 * print partners' offers (placement PRINT, imported like every travel offer; heaviest
 * first), each a link through /go/ that counts the click. The person uploads the zip's
 * photos on the printer's own site; nothing is sent from here. With no print partner
 * yet, it says any photo printer takes the files.
 */
function PrintPartnerOffers() {
  const { offers, loading } = useOffers();
  const printers = useMemo(
    () =>
      offersForPlacement(offers, 'PRINT')
        .sort((a, b) => (b.weight ?? 1) - (a.weight ?? 1) || (a.id < b.id ? -1 : 1))
        .slice(0, SHOWN),
    [offers],
  );

  return (
    <section className='grid gap-3 border-t-2 border-dashed border-poster-brown/50 pt-4' aria-labelledby='print-them-heading'>
      <h3 id='print-them-heading' className='font-travel text-lg uppercase leading-tight tracking-wide text-colour9'>
        Print them
      </h3>
      {printers.length ? (
        <>
          <p className='text-sm'>Open the zip, then upload the photos you want on the printer’s site and order there.</p>
          <p className='justify-self-start -rotate-1 border-2 border-dashed border-poster-red-deep px-3 py-1.5 text-sm font-semibold text-poster-red-deep'>
            {PRINT_OFFERS_NOTE}
          </p>
          <div className='grid gap-4 sm:grid-cols-2'>
            {printers.map((offer) => (
              <OfferBrochure key={offer.id} offer={offer} href={offerClickUrl(offer, { placement: 'PRINT' })} />
            ))}
          </div>
        </>
      ) : loading ? null : (
        <p className='text-sm'>Every photo printer’s website takes these files: open the zip and upload the ones you want.</p>
      )}
    </section>
  );
}

export default PrintPartnerOffers;

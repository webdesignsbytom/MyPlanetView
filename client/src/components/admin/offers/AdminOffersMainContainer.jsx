import React, { useCallback, useEffect, useMemo, useState } from 'react';
// Api
import { getAdminOffers, updateOffer } from '@/api/offerAdminApi';
// Components
import PaperCard from '@/components/common/PaperCard';
import Button from '@/components/common/Button';
import LoadingSpinner from '@/components/utils/LoadingSpinner';
import OfferImportCard from './OfferImportCard';
import OfferFilters from './OfferFilters';
import OfferItem from './OfferItem';
import OfferEditDialog from './OfferEditDialog';
import OfferDeleteDialog from './OfferDeleteDialog';
// Utils
import { formatDay } from '@/utils/functions/dates';
import { emptyOfferFilters, offerCountryOptions, offerMatches, offerState, sortOffers } from '@/utils/offers/offerAdmin';

const NO_CLICKS = Object.freeze({ total: 0, byPlacement: {}, byDay: [] });

// Travel offers (docs/API.md, "Travel offers"; FEATURE-PLAN.md, "Ads" and "Travel
// Desk"): the import and export, then every offer with its clicks over 30 days, filtered
// by kind, country, state and words. An offer is made or changed in a dialog with a sketch
// of its card, turned off or on, or deleted with its click counts.
function AdminOffersMainContainer() {
  const [offers, setOffers] = useState(null);
  const [since, setSince] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [filters, setFilters] = useState(emptyOfferFilters);
  const [busyId, setBusyId] = useState(null);
  const [result, setResult] = useState({ type: 'success', text: '' });
  // null, or { offer } to change one, or { offer: null } for a new one
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const { offers: list, clicksSince } = await getAdminOffers();
      setOffers(list || []);
      setSince(clicksSince || null);
    } catch (err) {
      setLoadError(err.friendlyMessage || 'The offers couldn’t be loaded.');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const shown = useMemo(() => (offers || []).filter((offer) => offerMatches(offer, filters)), [offers, filters]);
  const countryOptions = useMemo(() => offerCountryOptions(offers || []), [offers]);

  // A change's answer has no clicks: the row keeps its own
  const replace = (offer) => setOffers((prev) => prev.map((o) => (o.id === offer.id ? { ...o, ...offer } : o)));

  const toggle = async (offer) => {
    setBusyId(offer.id);
    setResult({ type: 'success', text: '' });
    try {
      const { offer: saved } = await updateOffer(offer.id, { active: !offer.active });
      replace(saved);
      const state = offerState(saved);
      setResult({
        type: 'success',
        text: !saved.active
          ? `${saved.title} is off: it’s on no card and not on the Travel Desk. Its click counts are kept.`
          : state.key === 'on'
            ? `${saved.title} is on.`
            : `${saved.title} is on, but outside its dates (${state.label.toLowerCase()}), so it isn’t showing.`,
      });
    } catch (err) {
      setResult({ type: 'error', text: err.friendlyMessage || 'That didn’t work. Please try again.' });
    } finally {
      setBusyId(null);
    }
  };

  const saved = (offer, { created }) => {
    if (created) setOffers((prev) => sortOffers([...(prev || []), { ...offer, clicks: NO_CLICKS }]));
    else replace(offer);
    setEditing(null);
    setResult({ type: 'success', text: created ? `${offer.title} is made (${offer.key}).` : `${offer.title} is changed.` });
  };

  const deleted = (offer) => {
    setOffers((prev) => prev.filter((o) => o.id !== offer.id));
    setDeleting(null);
    setResult({ type: 'success', text: `${offer.title} is deleted, with its click counts.` });
  };

  const changeFilter = (field, value) => setFilters((prev) => ({ ...prev, [field]: value }));
  const filtered = shown.length !== (offers || []).length;

  return (
    <>
      <OfferImportCard offers={offers} onImported={load} />

      <PaperCard
        title='Offers'
        titleId='admin-offers-heading'
        action={
          <div className='grid grid-row gap-2'>
            <Button small onClick={() => setEditing({ offer: null })}>
              New offer
            </Button>
            <Button small quiet onClick={load} ariaLabel='Reload the offers and their clicks'>
              Reload
            </Button>
          </div>
        }
      >
        <p className='text-sm'>
          Clicks are counted per offer, day (UTC) and place{since ? `, here since ${formatDay(since)}` : ''}. Nothing about the
          person who clicked is kept.
        </p>

        <OfferFilters filters={filters} countryOptions={countryOptions} onChange={changeFilter} />

        <p
          className={`min-h-5 text-center text-sm ${result.type === 'error' ? 'text-status-critical' : 'text-status-good'}`}
          role='status'
          aria-live='polite'
        >
          {result.text}
        </p>

        <section className='grid gap-3' aria-label='List of offers' aria-busy={offers === null && !loadError ? 'true' : 'false'}>
          {loadError ? (
            <p className='text-center text-status-critical' role='alert'>
              {loadError}
            </p>
          ) : offers === null ? (
            <div className='grid place-items-center py-4'>
              <LoadingSpinner lg />
            </div>
          ) : (
            <>
              <p className='text-center text-sm font-semibold' id='admin-offers-count'>
                {filtered
                  ? `Showing ${shown.length.toLocaleString('en-GB')} of ${offers.length.toLocaleString('en-GB')} offers`
                  : `${offers.length.toLocaleString('en-GB')} ${offers.length === 1 ? 'offer' : 'offers'}`}
              </p>
              {offers.length === 0 ? (
                <p className='text-center'>No offers yet. Make one, or import a file.</p>
              ) : shown.length === 0 ? (
                <p className='text-center'>No offers match. Change the filters above.</p>
              ) : (
                <ul className='grid gap-3 lg:grid-cols-2' aria-describedby='admin-offers-count'>
                  {shown.map((offer) => (
                    <li key={offer.id} className='grid'>
                      <OfferItem
                        offer={offer}
                        since={since}
                        busy={busyId === offer.id}
                        onEdit={(o) => setEditing({ offer: o })}
                        onToggle={toggle}
                        onDelete={setDeleting}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </section>
      </PaperCard>

      {editing ? <OfferEditDialog offer={editing.offer} onSaved={saved} onClose={() => setEditing(null)} /> : null}
      {deleting ? <OfferDeleteDialog offer={deleting} onDeleted={deleted} onClose={() => setDeleting(null)} /> : null}
    </>
  );
}

export default AdminOffersMainContainer;

import React, { useCallback, useEffect, useState } from 'react';
// Api
import { getPromoCodes, updatePromoCode } from '@/api/promoApi';
// Components
import PaperCard from '@/components/common/PaperCard';
import Button from '@/components/common/Button';
import LoadingSpinner from '@/components/utils/LoadingSpinner';
import PromoCodeCreateCard from './PromoCodeCreateCard';
import PromoCodeItem from './PromoCodeItem';
import PromoCodeEditDialog from './PromoCodeEditDialog';

// Influencer codes (docs/API.md, "Promo codes"; FEATURE-PLAN.md, "Getting the word out"):
// a new code, then every code, newest first, with what each brought (accounts that
// signed up with it, how many verified their address, how many pay now). A code is turned
// off rather than deleted, and its code never changes.
function AdminPromoCodesMainContainer() {
  const [codes, setCodes] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [result, setResult] = useState({ type: 'success', text: '' });
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const { promoCodes } = await getPromoCodes();
      setCodes(promoCodes || []);
    } catch (err) {
      setLoadError(err.friendlyMessage || 'The codes couldn’t be loaded.');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // A change's answer has no counts: the row keeps its own
  const replace = (promoCode) =>
    setCodes((prev) => prev.map((c) => (c.id === promoCode.id ? { ...c, ...promoCode } : c)));

  const toggle = async (promo) => {
    setBusyId(promo.id);
    setResult({ type: 'success', text: '' });
    try {
      const { promoCode } = await updatePromoCode(promo.id, { active: !promo.active });
      replace(promoCode);
      setResult({
        type: 'success',
        text: promoCode.active ? `${promoCode.code} is on: new sign-ups can use it.` : `${promoCode.code} is off: nobody new can use it.`,
      });
    } catch (err) {
      setResult({ type: 'error', text: err.friendlyMessage || 'That didn’t work. Please try again.' });
    } finally {
      setBusyId(null);
    }
  };

  const saved = (promoCode) => {
    replace(promoCode);
    setEditing(null);
    setResult({ type: 'success', text: `${promoCode.code} is changed.` });
  };

  return (
    <>
      <PromoCodeCreateCard onCreated={(promoCode) => setCodes((prev) => [promoCode, ...(prev || [])])} />

      <PaperCard
        title='Codes'
        titleId='admin-promo-codes-heading'
        action={
          <Button small quiet onClick={load} ariaLabel='Reload the codes and their counts'>
            Reload
          </Button>
        }
      >
        <p
          className={`min-h-5 text-center text-sm ${result.type === 'error' ? 'text-status-critical' : 'text-status-good'}`}
          role='status'
          aria-live='polite'
        >
          {result.text}
        </p>

        <section className='grid gap-4' aria-label='List of promo codes' aria-busy={codes === null && !loadError ? 'true' : 'false'}>
          {loadError ? (
            <p className='text-center text-status-critical' role='alert'>
              {loadError}
            </p>
          ) : codes === null ? (
            <div className='grid place-items-center py-4'>
              <LoadingSpinner lg />
            </div>
          ) : codes.length === 0 ? (
            <p className='text-center'>No codes yet. Make one above.</p>
          ) : (
            <ul className='grid gap-3 lg:grid-cols-2'>
              {codes.map((promo) => (
                <li key={promo.id} className='grid'>
                  <PromoCodeItem promo={promo} busy={busyId === promo.id} onEdit={setEditing} onToggle={toggle} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </PaperCard>

      {editing ? <PromoCodeEditDialog promo={editing} onSaved={saved} onClose={() => setEditing(null)} /> : null}
    </>
  );
}

export default AdminPromoCodesMainContainer;

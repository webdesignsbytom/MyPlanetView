import React, { useEffect, useId, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
// Api
import { getMap, getMyMaps, openShareCode } from '@/api/travelApi';
// Constants
import { COMPARE_PAGE_URL } from '@/utils/constants/routes';
// Components
import AppPageHead from '@/components/utils/AppPageHead';
import AppPageShell from '@/components/common/AppPageShell';
import PageTitleCard from '@/components/common/PageTitleCard';
import PaperCard from '@/components/common/PaperCard';
import InlineAlert from '@/components/common/InlineAlert';
import Button from '@/components/common/Button';
import FormField from '@/components/ui/FormField';
import PlainOptionSelect from '@/components/ui/PlainOptionSelect';
import TextInput from '@/components/ui/TextInput';
import LoadingSpinner from '@/components/utils/LoadingSpinner';
import CompareResults from '@/components/compare/CompareResults';
// Utils
import { shareCodeFrom } from '@/utils/compare/compareMaps';

const BY_LINK = 'link';
// A map's name, with its owner's when it's someone else's ("Sam's gap year (Sam Carter)")
const mapLabel = (map) => (map.role && map.role !== 'OWNER' && map.ownerName ? `${map.name} (${map.ownerName})` : map.name);

/**
 * Compare two maps (22 Nov 2026, the user's wish, from "what else can we do to compete"): any
 * two the person can open (theirs, maps shared with them, or a map's share link pasted in),
 * the countries both have been to, only one, only the other, and both want to go to. Nothing
 * is shared that wasn't already: it reads the maps as the person can. `?a=&b=` are map ids
 * (from a map's statistics panel, `a` is that map); a share link stays out of the address.
 */
function ComparePage() {
  const uid = useId();
  const [params, setParams] = useSearchParams();
  const a = params.get('a') || '';
  const b = params.get('b') || '';
  const [maps, setMaps] = useState(null);
  const [linkText, setLinkText] = useState('');
  const [linkCode, setLinkCode] = useState('');
  const [chosen, setChosen] = useState({ a: null, b: null, loading: false, error: '' });
  const [listError, setListError] = useState('');

  // The maps this person can open
  useEffect(() => {
    let alive = true;
    getMyMaps()
      .then(({ maps: list = [] }) => alive && setMaps(list))
      .catch((err) => alive && setListError(err.friendlyMessage || 'Your maps couldn’t be loaded.'));
    return () => {
      alive = false;
    };
  }, []);

  // The first map: the one asked for, else the person's main map
  const firstId = a || maps?.find((m) => m.isDefault && m.role === 'OWNER')?.id || maps?.[0]?.id || '';
  const secondChoices = useMemo(
    () => [
      { value: '', label: 'Choose a map' },
      ...(maps || []).filter((m) => m.id !== firstId).map((m) => ({ value: m.id, label: mapLabel(m) })),
      { value: BY_LINK, label: 'A map’s share link…' },
    ],
    [maps, firstId],
  );
  const choose = (which, value) => {
    const next = { a: which === 'a' ? value : firstId, b: which === 'b' ? value : b };
    if (next.b === next.a) next.b = '';
    setParams(Object.fromEntries(Object.entries(next).filter(([, v]) => v)), { replace: true });
    if (which === 'b' && value !== BY_LINK) setLinkCode('');
  };

  // Each map as this person can see it: by id, or through the share link
  useEffect(() => {
    const secondWanted = b === BY_LINK ? linkCode : b;
    if (!firstId || !secondWanted) {
      setChosen({ a: null, b: null, loading: false, error: '' });
      return undefined;
    }
    let cancelled = false;
    setChosen((was) => ({ ...was, loading: true, error: '' }));
    const loadSecond =
      b === BY_LINK
        ? openShareCode(linkCode).then((shared) => {
            if (!shared?.map) throw Object.assign(new Error('That’s a trip’s link: comparing needs a map’s link.'), { friendlyMessage: 'That’s a trip’s link: comparing needs a map’s link.' });
            return shared.map;
          })
        : getMap(b).then(({ map }) => map);
    Promise.all([getMap(firstId).then(({ map }) => map), loadSecond])
      .then(([first, second]) => {
        if (!cancelled) setChosen({ a: first, b: second, loading: false, error: '' });
      })
      .catch((err) => {
        if (cancelled) return;
        const missing = err.response?.status === 404;
        setChosen({
          a: null,
          b: null,
          loading: false,
          error: missing
            ? b === BY_LINK
              ? 'That link doesn’t work. It may have been reset, or sharing may have been turned off.'
              : 'That map doesn’t exist, or it hasn’t been shared with you.'
            : err.friendlyMessage || 'The maps couldn’t be loaded.',
        });
      });
    return () => {
      cancelled = true;
    };
  }, [firstId, b, linkCode]);

  const labels = useMemo(() => {
    if (!chosen.a || !chosen.b) return null;
    const same = chosen.a.name === chosen.b.name;
    return {
      a: chosen.a.name,
      b: same && chosen.b.ownerName ? `${chosen.b.name} (${chosen.b.ownerName})` : chosen.b.name,
    };
  }, [chosen]);

  return (
    <>
      <AppPageHead route={COMPARE_PAGE_URL} />
      <AppPageShell width='max-w-4xl' mainProps={{ 'aria-labelledby': 'compare-page-heading' }}>
        <PageTitleCard
          page='Compare'
          title='Compare two maps'
          headingId='compare-page-heading'
          subtitle='Where you’ve both been, where only one of you has, and where you both want to go. Any map you can open: yours, one shared with you, or a share link.'
        />

        <PaperCard title='Choose two maps' titleId='compare-choose-heading'>
          {listError ? (
            <InlineAlert>{listError}</InlineAlert>
          ) : !maps ? (
            <div className='grid place-items-center py-4' role='status'>
              <LoadingSpinner md />
              <span className='sr-only'>Loading your maps…</span>
            </div>
          ) : (
            <div className='grid gap-3'>
              <div className='grid gap-3 sm:grid-cols-2'>
                <FormField id={`${uid}-a`} label='This map' align='start'>
                  <PlainOptionSelect value={firstId} onChange={(e) => choose('a', e.target.value)} options={maps.map((m) => ({ value: m.id, label: mapLabel(m) }))} />
                </FormField>
                <FormField id={`${uid}-b`} label='Compare with' align='start'>
                  <PlainOptionSelect value={b} onChange={(e) => choose('b', e.target.value)} options={secondChoices} />
                </FormField>
              </div>
              {b === BY_LINK ? (
                <form
                  className='grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end'
                  onSubmit={(e) => {
                    e.preventDefault();
                    setLinkCode(shareCodeFrom(linkText));
                  }}
                >
                  <FormField id={`${uid}-link`} label='Their share link' align='start'>
                    <TextInput value={linkText} onChange={(e) => setLinkText(e.target.value)} placeholder='https://…/shared/XXXX-XXXX-XXXX' autoComplete='off' spellCheck={false} />
                  </FormField>
                  <Button type='submit' quiet disabled={!shareCodeFrom(linkText)}>
                    Compare
                  </Button>
                </form>
              ) : null}
            </div>
          )}
        </PaperCard>

        {chosen.error ? (
          <PaperCard>
            <InlineAlert>{chosen.error}</InlineAlert>
          </PaperCard>
        ) : chosen.loading ? (
          <PaperCard>
            <div className='grid place-items-center py-6' role='status'>
              <LoadingSpinner md />
              <span className='sr-only'>Comparing the maps…</span>
            </div>
          </PaperCard>
        ) : labels ? (
          <CompareResults a={{ label: labels.a, visits: chosen.a.visits }} b={{ label: labels.b, visits: chosen.b.visits }} />
        ) : null}
      </AppPageShell>
    </>
  );
}

export default ComparePage;

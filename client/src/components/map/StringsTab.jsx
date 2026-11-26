import React, { useId, useState } from 'react';
// Components
import MapActionButton from './MapActionButton';
import VerifyFirstNote from './VerifyFirstNote';
import StringColourFields from './design/StringColourFields';
import FormField from '@/components/ui/FormField';
import GroupedOptionSelect from '@/components/ui/GroupedOptionSelect';
import CheckboxInput from '@/components/ui/CheckboxInput';
import ConfirmModal from '@/components/modals/ConfirmModal';
// Hooks
import useSplitUk from '@/hooks/useSplitUk';
import useConfirmAction from '@/hooks/useConfirmAction';
// Utils
import { countryOptionGroupsFor } from '@/utils/map/countries';
import { stringEnds, stringLabel } from '@/utils/map/mapStrings';

const failed = (err, fallback) => err?.friendlyMessage || fallback;

// Each kind's words (25 Nov 2026, the user's wish: the visited and the planned strings apart)
const WORDS = {
  VISITED: {
    intro: 'Tie string between the places you’ve been, like pins and thread on a corkboard map. Each place you mark visited joins the one you went to before it.',
    show: 'Show visited strings on the map',
    how: 'On the map, click two countries to tie a string between them; click a string to take it off. Automatically follows each trip’s route, then joins the other places in the order you first went.',
    from: 'your trips and first visits',
    none: 'Nothing new to add: your trips and first visits are already strung.',
  },
  PLANNED: {
    intro: 'Tie string between the places you plan to go, in a colour of its own. Each place you mark “Want to go” joins the one you marked before it.',
    show: 'Show planned strings on the map',
    how: 'On the map, click two countries to tie a planned string between them; click one to take it off. Automatically follows each planned trip’s route, then joins your “want to go” places in the order you marked them.',
    from: 'your planned trips and the places you want to go',
    none: 'Nothing new to add: your plans are already strung.',
  },
};

/**
 * One kind of string in the Strings panel (StringsPanel): its own switch on the map (`shown`,
 * the viewer's setting), string mode for it (`onStringMode`), the automatic ones, its colours in
 * the map's design (`colours`: StringColourFields' props and the editor's `status`, for the owner
 * and co-owners; null for anyone else), two places to tie from the keyboard, and the list with
 * "Take off" and "Take every string off". `locked` while the email isn't verified.
 */
function StringsTab({ kind, strings, shown, onShow, locked = false, colours = null, onTie, onTieAuto, onUntie, onUntieAll, onStringMode }) {
  const uid = useId();
  const splitUk = useSplitUk();
  const words = WORDS[kind];
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState({ text: '', error: false });

  const run = async (work, done) => {
    setBusy(true);
    setNote({ text: '', error: false });
    try {
      const answer = await work();
      setNote({ text: done(answer), error: false });
    } catch (err) {
      setNote({ text: failed(err, 'That didn’t save. Please try again.'), error: true });
    } finally {
      setBusy(false);
    }
  };

  const tie = (e) => {
    e.preventDefault();
    if (!stringEnds(from, to)) {
      setNote({ text: 'Choose two different places.', error: true });
      return;
    }
    run(
      () => onTie(from, to, kind),
      (string) => `Tied: ${stringLabel(string)}.`,
    );
  };
  const tieAuto = () =>
    run(
      () => onTieAuto(kind),
      ({ added, full }) =>
        full
          ? `Added ${added} — the map holds no more of these strings.`
          : added
            ? `Added ${added} ${added === 1 ? 'string' : 'strings'} from ${words.from}.`
            : words.none,
    );
  const { confirmAction, modalOpen, modalContent, handleModalConfirm, setModalOpen } = useConfirmAction();
  const untieAll = () =>
    confirmAction({
      header: kind === 'PLANNED' ? 'Take every planned string off?' : 'Take every string off?',
      message: `All ${strings.length} ${kind === 'PLANNED' ? 'planned strings' : 'strings'} on this map come off. You can tie them again any time.`,
      action: () => run(() => onUntieAll(kind), () => (kind === 'PLANNED' ? 'Every planned string is off.' : 'Every string is off.')),
    });

  const groups = countryOptionGroupsFor(splitUk);
  const count = `${strings.length} ${kind === 'PLANNED' ? 'planned ' : ''}${strings.length === 1 ? 'string' : 'strings'}`;
  return (
    <div className='grid gap-4' data-strings-tab={kind}>
      <p className='text-sm'>{words.intro}</p>
      <CheckboxInput id={`${uid}-show`} checked={shown} onChange={(e) => onShow(e.target.checked)} label={words.show} />
      {locked ? <VerifyFirstNote action='tie strings' /> : null}
      <div className='grid grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] gap-2'>
        <MapActionButton onClick={() => onStringMode(kind)} disabled={locked || busy}>
          Tie strings on the map
        </MapActionButton>
        <MapActionButton quiet onClick={tieAuto} disabled={locked} busy={busy}>
          Add strings automatically
        </MapActionButton>
      </div>
      <p className='text-xs'>{words.how}</p>

      {/* Their colours, here with the strings (25 Nov 2026, the user's wish: "all in one place") */}
      <section className='grid gap-3 border-t-2 border-dashed border-poster-brown/50 pt-3' aria-labelledby={`${uid}-colours`}>
        <h3 id={`${uid}-colours`} className='font-travel text-lg uppercase tracking-wide'>
          Colours
        </h3>
        {colours ? (
          <>
            <StringColourFields id={`${uid}-design`} kind={kind} design={colours.design} usual={colours.usual} onChange={colours.onChange} />
            {/* Only a failure is said (25 Nov 2026, the user's wish: no "Saved."): a change shows
                on the map at once */}
            {colours.status.error ? (
              <p role='alert' className='text-sm font-medium text-status-critical'>
                {colours.status.error}
              </p>
            ) : null}
          </>
        ) : (
          <p className='text-xs' data-string-colour-note>
            Their colours are the map owner’s choice.
          </p>
        )}
      </section>

      <form onSubmit={tie} className='grid gap-3 border-t-2 border-dashed border-poster-brown/50 pt-3' aria-label='Tie a string'>
        <div className='grid gap-3 sm:grid-cols-2'>
          <FormField id={`${uid}-from`} label='From' align='start'>
            <GroupedOptionSelect value={from} onChange={(e) => setFrom(e.target.value)} groups={groups} placeholder='Choose a place' disabled={locked} />
          </FormField>
          <FormField id={`${uid}-to`} label='To' align='start'>
            <GroupedOptionSelect value={to} onChange={(e) => setTo(e.target.value)} groups={groups} placeholder='Choose a place' disabled={locked} />
          </FormField>
        </div>
        <MapActionButton type='submit' disabled={locked || !from || !to} busy={busy}>
          Tie this string
        </MapActionButton>
      </form>

      {note.text ? (
        <p role={note.error ? 'alert' : 'status'} className={`text-sm ${note.error ? 'font-medium text-status-critical' : ''}`}>
          {note.text}
        </p>
      ) : null}

      <section className='grid gap-2' aria-labelledby={`${uid}-list`}>
        <h3 id={`${uid}-list`} className='font-travel text-lg uppercase tracking-wide'>
          {strings.length ? count : kind === 'PLANNED' ? 'No planned strings yet' : 'No strings yet'}
        </h3>
        {strings.length ? (
          <ul className='grid gap-1.5' data-strings-list>
            {strings.map((string) => (
              <li key={string.id} className='grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 text-sm' data-string-item={`${string.from}-${string.to}`}>
                <span>{stringLabel(string)}</span>
                <MapActionButton quiet onClick={() => run(() => onUntie(string), () => `Taken off: ${stringLabel(string)}.`)} disabled={locked}>
                  <span className='sr-only'>{`Take off the string from ${stringLabel(string)}`}</span>
                  <span aria-hidden='true'>Take off</span>
                </MapActionButton>
              </li>
            ))}
          </ul>
        ) : null}
        {strings.length ? (
          <MapActionButton danger onClick={untieAll} disabled={locked} busy={busy}>
            {kind === 'PLANNED' ? 'Take every planned string off' : 'Take every string off'}
          </MapActionButton>
        ) : null}
      </section>
      {modalOpen ? (
        <ConfirmModal header={modalContent.header} message={modalContent.message} onConfirm={handleModalConfirm} onClose={() => setModalOpen(false)} />
      ) : null}
    </div>
  );
}

export default StringsTab;

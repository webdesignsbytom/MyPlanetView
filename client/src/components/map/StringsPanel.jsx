import React, { useId, useState } from 'react';
// Components
import MapPanel from './MapPanel';
import MapActionButton from './MapActionButton';
import VerifyFirstNote from './VerifyFirstNote';
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

/**
 * The Strings tool (docs/API.md "Strings"; 23 Nov 2026, the user's wish): red thread between
 * places, as on a corkboard. String mode (`onStringMode`: click two countries on the map, click
 * a string to take it off), the automatic ones (each trip's route, then the other places in
 * the order first visited), and the list: every string with "Take off", and two places to tie
 * from the keyboard. `showStrings` and `onShowStrings` are the viewer's own setting. Editors
 * only; `locked` while the email isn't verified (the server refuses). Their colour is the
 * map design's (Settings, "How it looks"), which `canDesign` (the owner or a co-owner) can change.
 */
function StringsPanel({ strings = [], showStrings = true, onShowStrings, locked = false, canDesign = false, onTie, onTieAuto, onUntie, onUntieAll, onStringMode, onClose }) {
  const uid = useId();
  const splitUk = useSplitUk();
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
      () => onTie(from, to),
      (string) => `Tied: ${stringLabel(string)}.`,
    );
  };
  const tieAuto = () =>
    run(onTieAuto, ({ added, full }) =>
      full
        ? `Added ${added} — the map holds no more strings.`
        : added
          ? `Added ${added} ${added === 1 ? 'string' : 'strings'} from your trips and first visits.`
          : 'Nothing new to add: your trips and first visits are already strung.',
    );
  const { confirmAction, modalOpen, modalContent, handleModalConfirm, setModalOpen } = useConfirmAction();
  const untieAll = () =>
    confirmAction({
      header: 'Take every string off?',
      message: `All ${strings.length} strings on this map come off. You can tie them again any time.`,
      action: () => run(onUntieAll, () => 'Every string is off.'),
    });

  const groups = countryOptionGroupsFor(splitUk);
  return (
    <MapPanel title='Strings' onClose={onClose}>
      <div className='grid gap-4' data-strings-panel>
        <p className='text-sm'>
          Tie red string between the places you’ve been, like pins and thread on a corkboard map.
        </p>
        <CheckboxInput
          id={`${uid}-show`}
          checked={showStrings}
          onChange={(e) => onShowStrings(e.target.checked)}
          label='Show strings on the map'
        />
        {locked ? <VerifyFirstNote action='tie strings' /> : null}
        <div className='grid grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] gap-2'>
          <MapActionButton onClick={onStringMode} disabled={locked || busy}>
            Tie strings on the map
          </MapActionButton>
          <MapActionButton quiet onClick={tieAuto} disabled={locked} busy={busy}>
            Add strings automatically
          </MapActionButton>
        </div>
        <p className='text-xs'>
          On the map, click two countries to tie a string between them; click a string to take it off. Automatically follows each
          trip’s route, then joins the other places in the order you first went.
        </p>
        <p className='text-xs' data-string-colour-note>
          {canDesign
            ? 'Choose their colour in Map settings, under How it looks: “String colour”.'
            : 'Their colour is the map owner’s choice, in its settings.'}
        </p>

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
            {strings.length ? `${strings.length} ${strings.length === 1 ? 'string' : 'strings'}` : 'No strings yet'}
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
              Take every string off
            </MapActionButton>
          ) : null}
        </section>
      </div>
      {modalOpen ? (
        <ConfirmModal header={modalContent.header} message={modalContent.message} onConfirm={handleModalConfirm} onClose={() => setModalOpen(false)} />
      ) : null}
    </MapPanel>
  );
}

export default StringsPanel;

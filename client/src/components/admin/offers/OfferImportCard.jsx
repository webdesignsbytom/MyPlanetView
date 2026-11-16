import React, { useState } from 'react';
// Api
import { importOffers } from '@/api/offerAdminApi';
// Components
import PaperCard from '@/components/common/PaperCard';
import Button from '@/components/common/Button';
import InlineAlert from '@/components/common/InlineAlert';
// Utils
import { downloadJson, offerExportFile, offerExportFileName } from '@/utils/offers/offerAdmin';
import { importPlan, problemSentences, readOfferFile } from '@/utils/offers/offerImport';

const KEYS_SHOWN = 30;
const offersWord = (n) => `${n.toLocaleString('en-GB')} ${n === 1 ? 'offer' : 'offers'}`;
const keyList = (keys) =>
  `${keys.slice(0, KEYS_SHOWN).map((k) => k || '(no key)').join(', ')}${keys.length > KEYS_SHOWN ? ` and ${keys.length - KEYS_SHOWN} more` : ''}`;

function importedWords({ created, updated }) {
  const parts = [];
  if (created) parts.push(`${offersWord(created)} made`);
  if (updated) parts.push(`${offersWord(updated)} updated`);
  return `Imported: ${parts.join(' and ') || 'nothing changed'}.`;
}

// Importing and exporting offers as a file (docs/API.md, "Travel offers"): what a file
// does (offers are matched by key; offers not in it are left alone), choosing one and
// seeing what it holds before it's sent, then the result or the server's problems in
// words; and the current offers downloaded in the same shape, to edit and import back.
// `offers` is the list on the page (null while it loads); `onImported` reloads it.
function OfferImportCard({ offers, onImported }) {
  const [chosen, setChosen] = useState(null); // { name, payload, offers, plan }
  const [readError, setReadError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const [failure, setFailure] = useState(null); // { message, problems }
  const [exported, setExported] = useState(null);

  const clearOutcome = () => {
    setDone(null);
    setFailure(null);
    setExported(null);
  };

  const choose = async (e) => {
    const file = e.target.files?.[0];
    // Cleared, so choosing the same file again (after fixing it) is read afresh
    e.target.value = '';
    if (!file) return;
    clearOutcome();
    setChosen(null);
    const read = await readOfferFile(file);
    if (!read.ok) {
      setReadError(read.error);
      return;
    }
    setReadError(null);
    setChosen({ name: file.name, payload: read.payload, offers: read.offers, plan: importPlan(read.offers, (offers || []).map((o) => o.key)) });
  };

  const send = async () => {
    if (!chosen) return;
    setBusy(true);
    clearOutcome();
    try {
      const result = await importOffers(chosen.payload);
      setDone(importedWords(result));
      setChosen(null);
      onImported(result);
    } catch (err) {
      setFailure({
        message: err.friendlyMessage || 'The file couldn’t be imported.',
        problems: err.problems ? problemSentences(err.problems, chosen.offers) : [],
      });
    } finally {
      setBusy(false);
    }
  };

  const exportOffers = () => {
    clearOutcome();
    const name = offerExportFileName();
    downloadJson(offerExportFile(offers), name);
    setExported(`${name} has the ${offersWord(offers.length)} as an import file.`);
  };

  const plan = chosen?.plan;

  return (
    <PaperCard title='Import and export' titleId='admin-offers-import-heading'>
      <div className='grid gap-2 text-sm'>
        <p>
          An import file is a list of offers, written {'{ "offers": [ … ] }'} like the example file (docs/API.md, “Travel offers”).
          Download the offers to get one to edit.
        </p>
        <p>
          <strong>Offers are matched by their key.</strong> Importing updates the offers the file names and makes the ones whose key is
          new, so importing the same file again only updates them. Offers not in the file are left alone: to take one down, turn it off
          or delete it below.
        </p>
        <p>
          A field left out of an offer goes back to its default (no blurb, country, picture or dates; weight 1; on). If any offer is
          wrong, nothing is imported and the problems are listed here.
        </p>
      </div>

      <div className='grid gap-3 sm:grid-cols-2'>
        <div className='grid'>
          <input
            id='offer-import-file'
            type='file'
            accept='.json,application/json'
            className='peer sr-only'
            onChange={choose}
            disabled={busy}
          />
          <label
            htmlFor='offer-import-file'
            className='btn-paper [--btn-leading:1.5rem] [--btn-pad-x:1rem] [--btn-pad-y:0.375rem] [--btn-size:1.125rem] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-colour6 peer-disabled:cursor-not-allowed peer-disabled:opacity-50'
          >
            Choose an import file (.json)
          </label>
        </div>
        <Button quiet onClick={exportOffers} disabled={!offers?.length}>
          Download the offers (.json)
        </Button>
      </div>

      <InlineAlert>{readError}</InlineAlert>
      {exported ? <InlineAlert tone='good'>{exported}</InlineAlert> : null}

      {chosen ? (
        <section className='grid gap-3 border-2 border-dashed border-poster-brown/60 px-4 py-4' aria-labelledby='offer-import-plan'>
          <p id='offer-import-plan' className='font-semibold'>
            {chosen.name} holds {offersWord(plan.total)}: {plan.newKeys.length.toLocaleString('en-GB')} new, {plan.updateKeys.length.toLocaleString('en-GB')} to update.
          </p>
          {plan.newKeys.length ? (
            <p className='grid gap-0.5 text-sm'>
              <span className='font-semibold text-colour9'>New</span>
              <span className='break-words font-mono text-xs'>{keyList(plan.newKeys)}</span>
            </p>
          ) : null}
          {plan.updateKeys.length ? (
            <p className='grid gap-0.5 text-sm'>
              <span className='font-semibold text-colour9'>To update</span>
              <span className='break-words font-mono text-xs'>{keyList(plan.updateKeys)}</span>
            </p>
          ) : null}
          <div className='grid grid-row justify-end gap-2'>
            <Button quiet disabled={busy} onClick={() => setChosen(null)}>
              Cancel
            </Button>
            <Button busy={busy} onClick={send}>
              Import {offersWord(plan.total)}
            </Button>
          </div>
        </section>
      ) : null}

      {done ? <InlineAlert tone='good'>{done}</InlineAlert> : null}
      {failure ? (
        <div role='alert' className='tone-danger grid gap-2 rounded-lg border px-3 py-2 text-sm'>
          <p className='font-semibold'>{failure.message}</p>
          {failure.problems.length ? (
            <ul className='grid list-disc gap-1 pl-5' aria-label='Problems in the file'>
              {/* Each names its offer's place in the file, so no two are the same */}
              {failure.problems.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </PaperCard>
  );
}

export default OfferImportCard;

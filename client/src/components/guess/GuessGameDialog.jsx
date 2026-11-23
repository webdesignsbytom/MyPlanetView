import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
// Api
import { createGuessGame, deleteGuessGame, getMapGuessGames } from '@/api/guessApi';
import { getPhotoPage } from '@/api/travelApi';
// Components
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import InlineAlert from '@/components/common/InlineAlert';
import FormField from '@/components/ui/FormField';
import TextInput from '@/components/ui/TextInput';
// Utils
import { countryName } from '@/utils/map/countries';
import { GUESS_DEFAULT_TITLE, GUESS_ROUNDS_MAX, GUESS_ROUNDS_MIN, GUESS_TITLE_MAX } from '@/utils/guess/guessScoring';
import { guessLink, playablePhotos, points, suggestGamePhotos } from '@/utils/guess/guessGame';

const word = (n, one, many) => `${n.toLocaleString('en-GB')} ${n === 1 ? one : many}`;

// One game's line: its link to copy or share, how it's going, and Delete
function GameRow({ game, onDelete }) {
  const [copied, setCopied] = useState(false);
  const link = guessLink(window.location.origin, game.code);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };
  return (
    <li className='grid gap-2 border-b border-dashed border-poster-brown/40 pb-3' data-guess-game={game.code}>
      <p className='grid'>
        <span className='font-semibold'>{game.title}</span>
        <span className='text-xs'>
          {word(game.rounds, 'photo', 'photos')} · played {word(game.plays, 'time', 'times')}
          {game.best ? ` · best: ${game.best.name}, ${points(game.best.score)}` : ''}
        </span>
      </p>
      <div className='grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]'>
        <input
          readOnly
          value={link}
          aria-label={`Link to ${game.title}`}
          onFocus={(e) => e.target.select()}
          className='w-full truncate border border-field-edge bg-field px-2 py-2 text-sm'
        />
        <Button quiet onClick={copy}>
          {copied ? 'Copied' : 'Copy link'}
        </Button>
        {onDelete ? (
          <Button quiet danger onClick={() => onDelete(game)}>
            Delete
          </Button>
        ) : null}
      </div>
    </li>
  );
}

/**
 * "Guess where I was" (23 Nov 2026, the user's wish; docs/API.md "Guess where I was"), from the
 * statistics panel: the map's games, each with its link to send friends, and a new one made from
 * 3 to 10 of the map's photos (placed, not hidden: a first choice of one per country, changed by
 * pressing them). `canMake`: a verified editor (the server says the same). Portalled.
 */
function GuessGameDialog({ mapId, canMake = true, onClose }) {
  const [games, setGames] = useState(null);
  const [photos, setPhotos] = useState(null);
  const [chosen, setChosen] = useState([]);
  const [title, setTitle] = useState(GUESS_DEFAULT_TITLE);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [made, setMade] = useState(null);

  useEffect(() => {
    let alive = true;
    getMapGuessGames(mapId)
      .then((reply) => alive && setGames(reply.games || []))
      .catch(() => alive && setError('Your games couldn’t be loaded.'));
    getPhotoPage({ mapId, limit: 60 })
      .then((page) => {
        if (!alive) return;
        const playable = playablePhotos(page.photos);
        setPhotos(playable);
        setChosen(suggestGamePhotos(playable));
      })
      .catch(() => alive && setPhotos([]));
    return () => {
      alive = false;
    };
  }, [mapId]);

  const toggle = (photoId) =>
    setChosen((prev) => (prev.includes(photoId) ? prev.filter((id) => id !== photoId) : prev.length >= GUESS_ROUNDS_MAX ? prev : [...prev, photoId]));

  const make = async () => {
    setBusy(true);
    setError('');
    try {
      const { game } = await createGuessGame(mapId, { title: title.trim() || GUESS_DEFAULT_TITLE, photoIds: chosen });
      setGames((prev) => [game, ...(prev || [])]);
      setMade(game);
    } catch (err) {
      setError(err?.friendlyMessage || 'The game couldn’t be made.');
    } finally {
      setBusy(false);
    }
  };
  const remove = async (game) => {
    setError('');
    try {
      await deleteGuessGame(game.id);
      setGames((prev) => prev.filter((g) => g.id !== game.id));
      if (made?.id === game.id) setMade(null);
    } catch (err) {
      setError(err?.friendlyMessage || 'That game couldn’t be deleted.');
    }
  };

  const enough = chosen.length >= GUESS_ROUNDS_MIN;
  return createPortal(
    <Modal title='Guess where I was' onClose={onClose} wide>
      <div className='grid gap-5'>
        <p className='text-sm'>
          Friends get a photo at a time and guess the country where it was taken; they see their score, can put their name on the
          board, and can make a map of their own. They never see captions, places or where a photo was taken until they’ve guessed.
        </p>

        {made ? (
          <section className='grid gap-2' aria-labelledby='guess-made-heading' data-guess-made>
            <h3 id='guess-made-heading' className='font-travel text-lg uppercase tracking-wide text-colour9'>
              Your game is ready
            </h3>
            <p className='text-sm'>Send the link to your friends:</p>
            <ul className='grid'>
              <GameRow game={made} />
            </ul>
          </section>
        ) : null}

        <section className='grid gap-3' aria-labelledby='guess-new-heading'>
          <h3 id='guess-new-heading' className='font-travel text-lg uppercase tracking-wide text-colour9'>
            A new game
          </h3>
          {!canMake ? (
            <p className='text-sm'>Verify your email address to make a game.</p>
          ) : photos === null ? (
            <p className='text-sm' role='status'>
              Loading your photos…
            </p>
          ) : photos.length < GUESS_ROUNDS_MIN ? (
            <p className='text-sm'>A game needs at least {GUESS_ROUNDS_MIN} photos with a country. Add some, then come back.</p>
          ) : (
            <>
              <FormField id='guess-title' label='Its title' align='start'>
                <TextInput value={title} onChange={(e) => setTitle(e.target.value)} maxLength={GUESS_TITLE_MAX} />
              </FormField>
              <p className='text-sm' aria-live='polite' data-guess-chosen={chosen.length}>
                {chosen.length} chosen: {GUESS_ROUNDS_MIN} to {GUESS_ROUNDS_MAX} photos, in the order pressed. Press a photo to add or remove it.
              </p>
              <ul className='grid grid-cols-3 gap-2 sm:grid-cols-5'>
                {photos.map((photo) => {
                  const on = chosen.includes(photo.id);
                  return (
                    <li key={photo.id}>
                      <button
                        type='button'
                        aria-pressed={on}
                        aria-label={`Photo in ${countryName(photo.countryCode)}${photo.caption ? `: ${photo.caption}` : ''}`}
                        onClick={() => toggle(photo.id)}
                        className={`relative grid aspect-square w-full overflow-hidden border-4 ${on ? 'border-poster-red' : 'border-transparent opacity-70'}`}
                      >
                        {photo.thumbUrl ? <img src={photo.thumbUrl} alt='' className='h-full w-full object-cover' /> : null}
                        {on ? (
                          <span className='absolute left-1 top-1 grid size-6 place-items-center rounded-full bg-poster-red text-xs font-bold text-poster-red-ink'>
                            {chosen.indexOf(photo.id) + 1}
                          </span>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
              <div className='grid justify-start'>
                <Button busy={busy} disabled={!enough} onClick={make}>
                  Make the game
                </Button>
              </div>
            </>
          )}
        </section>

        <InlineAlert>{error}</InlineAlert>

        <section className='grid gap-3' aria-labelledby='guess-games-heading'>
          <h3 id='guess-games-heading' className='font-travel text-lg uppercase tracking-wide text-colour9'>
            Your games
          </h3>
          {games === null ? (
            <p className='text-sm'>Loading…</p>
          ) : games.length ? (
            <ul className='grid gap-3'>
              {games.map((game) => (
                <GameRow key={game.id} game={game} onDelete={canMake ? remove : null} />
              ))}
            </ul>
          ) : (
            <p className='text-sm'>None yet.</p>
          )}
        </section>
      </div>
    </Modal>,
    document.body,
  );
}

export default GuessGameDialog;

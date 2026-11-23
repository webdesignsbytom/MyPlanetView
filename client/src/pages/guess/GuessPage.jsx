import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
// Api
import { nameGuessPlay, openGuessGame, sendGuess, startGuessPlay } from '@/api/guessApi';
// Constants
import { GUESS_PAGE_URL, SIGN_UP_PAGE_URL } from '@/utils/constants/routes';
// Components
import AppPageHead from '@/components/utils/AppPageHead';
import AppPageShell from '@/components/common/AppPageShell';
import PageTitleCard from '@/components/common/PageTitleCard';
import PaperCard from '@/components/common/PaperCard';
import Button from '@/components/common/Button';
import InlineAlert from '@/components/common/InlineAlert';
import FormField from '@/components/ui/FormField';
import TextInput from '@/components/ui/TextInput';
import GroupedOptionSelect from '@/components/ui/GroupedOptionSelect';
import GuessMap from '@/components/guess/GuessMap';
import GuessLeaderboard from '@/components/guess/GuessLeaderboard';
// Utils
import { countryName, countryOptionGroupsFor } from '@/utils/map/countries';
import { GUESS_NAME_MAX } from '@/utils/guess/guessScoring';
import { guessLink, points, roundResultWords, scoreWords, shareScoreText } from '@/utils/guess/guessGame';

// Where to make your own (the reason the game exists: 23 Nov 2026, the user's wish)
const SIGN_UP_FROM_GAME = `${SIGN_UP_PAGE_URL}?utm_source=guess&utm_medium=game&utm_campaign=guess-where`;
const LINK = 'font-semibold text-poster-red-deep underline underline-offset-2';

/**
 * "Guess where I was" (23 Nov 2026, the user's wish; docs/API.md "Guess where I was"): a friend's
 * game, by its link, no sign-in. A photo a round: press the country on the map (or choose it from
 * the list), then the server says where it was and scores the guess. At the end the player puts
 * their name on the board, shares their score, and is asked to make their own map. The answers
 * never reach the page before they're guessed.
 */
function GuessPage() {
  const { code } = useParams();
  const [loaded, setLoaded] = useState({ game: null, leaderboard: [], error: '' });
  const [play, setPlay] = useState(null); // { playId, round, score, chosen, result, done }
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [board, setBoard] = useState(null); // { rank, leaderboard } once named
  const [shared, setShared] = useState('');

  useEffect(() => {
    let alive = true;
    openGuessGame(code)
      .then((opened) => alive && setLoaded({ game: opened.game, leaderboard: opened.leaderboard || [], error: '' }))
      .catch((err) => {
        if (!alive) return;
        setLoaded({
          game: null,
          leaderboard: [],
          error: err?.response?.status === 404 ? 'This game doesn’t exist any more. Ask your friend for a new link.' : err?.friendlyMessage || 'The game couldn’t be opened.',
        });
      });
    return () => {
      alive = false;
    };
  }, [code]);

  const game = loaded.game;
  const rounds = game?.rounds.length ?? 0;
  const run = async (work) => {
    setBusy(true);
    setError('');
    try {
      await work();
    } catch (err) {
      setError(err?.friendlyMessage || 'That didn’t work. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const start = () =>
    run(async () => {
      const { playId } = await startGuessPlay(code);
      setPlay({ playId, round: 0, score: 0, chosen: '', result: null, done: false });
    });
  const choose = (countryCode) => setPlay((prev) => (prev && !prev.result ? { ...prev, chosen: countryCode } : prev));
  const guess = () =>
    run(async () => {
      const result = await sendGuess(code, play.playId, { round: play.round, countryCode: play.chosen });
      setPlay((prev) => ({ ...prev, result, score: result.score }));
    });
  const next = () => setPlay((prev) => (prev.result.done ? { ...prev, done: true } : { ...prev, round: prev.round + 1, chosen: '', result: null }));
  const putOnBoard = (e) => {
    e.preventDefault();
    if (!name.trim()) return setError('Give a name for the board.');
    return run(async () => setBoard(await nameGuessPlay(code, play.playId, name.trim())));
  };
  const share = async () => {
    const text = shareScoreText({ mapName: game.mapName, score: play.score, rounds });
    const url = guessLink(window.location.origin, game.code);
    try {
      if (navigator.share) await navigator.share({ title: game.title, text, url });
      else {
        await navigator.clipboard.writeText(`${text} ${url}`);
        setShared('Copied: paste it to your friends.');
      }
    } catch {
      // The share sheet closed: nothing to say
    }
  };

  const heading = game ? game.title : 'Guess where I was';
  return (
    <>
      <AppPageHead route={GUESS_PAGE_URL} title={game?.title} />
      <AppPageShell width='max-w-4xl' mainProps={{ 'aria-labelledby': 'guess-heading' }}>
        <PageTitleCard page='A game' title={heading} headingId='guess-heading' subtitle={game ? `Photos from “${game.mapName}”` : undefined} />

        {loaded.error ? (
          <PaperCard>
            <div className='grid gap-3 px-6 py-5 sm:px-8'>
              <p role='alert'>{loaded.error}</p>
              <Link to={SIGN_UP_FROM_GAME} className={LINK}>
                Make your own travel map
              </Link>
            </div>
          </PaperCard>
        ) : !game ? (
          <p role='status' className='text-center text-poster-cream'>
            Opening the game…
          </p>
        ) : !play ? (
          <PaperCard title='How to play' titleId='guess-how'>
            <div className='grid gap-4 px-6 py-5 sm:px-8'>
              <p>
                {rounds} photos from “{game.mapName}”. For each, press the country on the map where you think it was taken, then
                guess. Right is 1,000 points; close still scores.
              </p>
              <InlineAlert>{error}</InlineAlert>
              <div className='grid justify-start'>
                <Button busy={busy} onClick={start}>
                  Start the game
                </Button>
              </div>
              <section className='grid gap-2' aria-labelledby='guess-board-heading'>
                <h3 id='guess-board-heading' className='font-travel text-lg uppercase tracking-wide text-colour9'>
                  Leaderboard
                </h3>
                <GuessLeaderboard rows={loaded.leaderboard} />
              </section>
            </div>
          </PaperCard>
        ) : !play.done ? (
          <PaperCard title={`Photo ${play.round + 1} of ${rounds}`} titleId='guess-round' data-guess-round={play.round}>
            <div className='grid gap-4 px-4 py-4 sm:px-6'>
              <img
                src={game.rounds[play.round].url}
                alt={`Photo ${play.round + 1}: where was it taken?`}
                className='mx-auto max-h-[60vh] w-auto max-w-full border-4 border-poster-cream shadow-paper'
              />
              <GuessMap
                chosenCode={play.chosen || null}
                answerCode={play.result?.answer.countryCode ?? null}
                onChoose={choose}
                splitUk={game.splitUk}
                label={play.result ? 'World map: the right place is coloured in' : 'World map: press the country where you think it was taken'}
              />
              {play.result ? (
                <div className='grid gap-2' role='status' data-guess-result={play.result.correct ? 'right' : 'wrong'}>
                  <p className='font-semibold'>{roundResultWords(play.result)}</p>
                  <p className='text-sm'>
                    +{points(play.result.points)} points · {scoreWords(play.score, rounds)} so far
                  </p>
                  <div className='grid justify-start'>
                    <Button onClick={next}>{play.result.done ? 'See your score' : 'Next photo'}</Button>
                  </div>
                </div>
              ) : (
                <div className='grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end'>
                  <FormField id='guess-country' label='Or choose the country' align='start'>
                    <GroupedOptionSelect
                      value={play.chosen}
                      onChange={(e) => choose(e.target.value)}
                      groups={countryOptionGroupsFor(game.splitUk)}
                      placeholder='Choose a country'
                    />
                  </FormField>
                  <Button busy={busy} disabled={!play.chosen} onClick={guess}>
                    {play.chosen ? `Guess ${countryName(play.chosen)}` : 'Guess'}
                  </Button>
                </div>
              )}
              <InlineAlert>{error}</InlineAlert>
            </div>
          </PaperCard>
        ) : (
          <PaperCard title='Your score' titleId='guess-score' data-guess-done>
            <div className='grid gap-4 px-6 py-5 sm:px-8'>
              <p className='font-travel text-3xl uppercase text-poster-red' data-guess-total={play.score}>
                {scoreWords(play.score, rounds)}
              </p>
              {board ? (
                <p role='status'>You’re number {board.rank} on the board.</p>
              ) : (
                <form onSubmit={putOnBoard} className='grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end' noValidate>
                  <FormField id='guess-name' label='Your name for the leaderboard' align='start'>
                    <TextInput value={name} onChange={(e) => setName(e.target.value)} maxLength={GUESS_NAME_MAX} />
                  </FormField>
                  <Button type='submit' busy={busy}>
                    Put me on the board
                  </Button>
                </form>
              )}
              <InlineAlert>{error}</InlineAlert>
              <GuessLeaderboard rows={board?.leaderboard ?? loaded.leaderboard} highlight={board?.rank ?? null} />
              <div className='grid gap-2 sm:grid-cols-2'>
                <Button quiet onClick={share}>
                  Challenge your friends
                </Button>
                <Link to={SIGN_UP_FROM_GAME} className='btn-poster text-center'>
                  Make your own travel map, free
                </Link>
              </div>
              {shared ? <p role='status' className='text-sm'>{shared}</p> : null}
            </div>
          </PaperCard>
        )}
      </AppPageShell>
    </>
  );
}

export default GuessPage;

import React from 'react';
// Icons
import { FaCompress, FaExpand, FaPause, FaPlay, FaRandom, FaStepBackward, FaStepForward } from 'react-icons/fa';
// Components
import MapRoundButton from '@/components/map/MapRoundButton';
// Utils
import { SLIDE_SPEEDS } from '@/utils/photos/slideshow';

const SPEED_TAG = 'border-2 px-2.5 py-0.5 text-sm transition pointer-coarse:py-1.5';

/**
 * A slideshow's controls, as the map toolbar's rubber stamps on the paper strip: back,
 * play or pause, forward, shuffle (pressed while on), the seconds a photo stays up (3, 5
 * or 8, as paper tags, the chosen one pressed) and full screen where the browser allows it.
 * `playRef` reaches the play button (the show focuses it on opening, so Space plays and pauses).
 */
function SlideshowControls({
  playing,
  onPlayPause,
  onPrevious,
  onNext,
  canPrevious,
  canNext,
  shuffle,
  onShuffle,
  speed,
  onSpeed,
  fullscreen,
  canFullscreen,
  onFullscreen,
  playRef,
}) {
  return (
    // Two rows on a phone (the stamps, then the speed), one from sm up
    <div className='grid items-center justify-center justify-items-center gap-x-6 gap-y-2 sm:grid-flow-col'>
      <div className='grid grid-row items-center gap-2' role='group' aria-label='Play'>
        <MapRoundButton label='Previous' onClick={onPrevious} disabled={!canPrevious}>
          <FaStepBackward aria-hidden='true' />
        </MapRoundButton>
        <span ref={playRef} className='grid'>
          <MapRoundButton label={playing ? 'Pause' : 'Play'} onClick={onPlayPause}>
            {playing ? <FaPause aria-hidden='true' /> : <FaPlay aria-hidden='true' />}
          </MapRoundButton>
        </span>
        <MapRoundButton label='Next' onClick={onNext} disabled={!canNext}>
          <FaStepForward aria-hidden='true' />
        </MapRoundButton>
        <MapRoundButton label='Shuffle' pressed={shuffle} onClick={onShuffle}>
          <FaRandom aria-hidden='true' />
        </MapRoundButton>
        {canFullscreen ? (
          <MapRoundButton label={fullscreen ? 'Leave full screen' : 'Full screen'} onClick={onFullscreen}>
            {fullscreen ? <FaCompress aria-hidden='true' /> : <FaExpand aria-hidden='true' />}
          </MapRoundButton>
        ) : null}
      </div>
      <div className='grid grid-row items-center gap-1.5' role='group' aria-label='Seconds a photo'>
        <span aria-hidden='true' className='font-travel text-xs uppercase tracking-wide text-poster-brown'>
          Speed
        </span>
        {SLIDE_SPEEDS.map((seconds) => (
          <button
            key={seconds}
            type='button'
            aria-pressed={speed === seconds}
            aria-label={`${seconds} seconds a photo`}
            onClick={() => onSpeed(seconds)}
            className={`${SPEED_TAG} ${
              speed === seconds
                ? 'border-poster-red bg-poster-paper font-semibold text-poster-ink shadow-paper'
                : 'border-dashed border-poster-brown/60 hover:border-solid hover:border-poster-brown'
            }`}
          >
            {seconds} s
          </button>
        ))}
      </div>
    </div>
  );
}

export default SlideshowControls;

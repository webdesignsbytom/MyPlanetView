import React from 'react';

/**
 * The draft's right-hand side: the turning globe (a canvas, drawn by useHomeDraftGlobe) and its
 * three destination cards. A card being replaced stays, inert, while the new one fades in over it.
 */
export default function HomeDraftGlobe({ globe, onOpenPlace }) {
  const { stageRef, canvasRef, slotRefs, cards, outgoing, drawn, settle } = globe;

  return (
    <section className='planet' ref={stageRef} aria-label='Rotating Earth with highlighted countries' data-globe-drawn={drawn || undefined}>
      <canvas ref={canvasRef} aria-hidden='true' />
      <div className='cards'>
        {cards.map((place, slot) => {
          const previous = outgoing?.slot === slot ? outgoing.place : null;
          return (
            <div
              className='slot'
              key={slot}
              ref={(node) => {
                slotRefs.current[slot] = node;
              }}
            >
              {(previous ? [previous, place] : [place]).map((item) => {
                const leaving = item === previous;
                return (
                  <button
                    type='button'
                    key={item.id}
                    className={`card${leaving ? ' departing' : previous ? ' arriving' : ''}`}
                    inert={leaving}
                    data-destination={item.id}
                    onClick={() => onOpenPlace(item)}
                    onAnimationEnd={() => {
                      if (!leaving && previous) settle(outgoing);
                    }}
                  >
                    <img src={item.cardImage || item.image} alt='' />
                    <span className='cardtext'>
                      <strong>{item.country}</strong>
                      <span>{item.site}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </section>
  );
}

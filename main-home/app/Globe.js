'use client';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { initialCards, makePlanet, startLongitude, wrap } from './planet';
import { places } from './destinations';
import FeatureStrip from './FeatureStrip';

export default function Globe(){
  const canvas=useRef(null), stage=useRef(null), slots=useRef([]), modal=useRef(null);
  const motion=useRef({running:true,lon:startLongitude,cards:initialCards,anchors:[],nextSlot:0,timer:0,engine:null});
  const [cards,setCards]=useState(initialCards),[running,setRunning]=useState(true);
  const [outgoing,setOutgoing]=useState(null);
  const [panel,setPanel]=useState(''),[visited,setVisited]=useState([]),[selected,setSelected]=useState(null);
  function measure(){
    const box=stage.current.getBoundingClientRect();
    motion.current.anchors=slots.current.map(el=>{const b=el.getBoundingClientRect();return [b.right-box.left,b.top+b.height*.54-box.top];});
  }
  function redraw(){const s=motion.current;s.engine?.draw(s.lon,s.cards,s.anchors);}
  useLayoutEffect(()=>{measure();redraw();},[cards]);
  useEffect(()=>{
    const s=motion.current, image=new Image(), reduced=matchMedia('(prefers-reduced-motion: reduce)');
    let dead=false, raf=0, last=0;
    const recent = new Map(initialCards.map(p=>[p.id,0]));
    const ready = new Set();
    const photos = places.map(place => {
      const photo = new Image();
      photo.src = place.cardImage || place.image;
      photo.decode().then(() => { if (!dead) ready.add(place.id); }).catch(() => {});
      return photo;
    });
    function preference(){s.running=!reduced.matches;setRunning(s.running);}
    preference();reduced.addEventListener('change',preference);
    try{const saved=JSON.parse(localStorage.getItem('picture-your-travel-visited')||'[]');if(Array.isArray(saved))setVisited(saved);}catch{}
    function step(now){
      if(dead)return;
      const elapsed=Math.min(.1,(now-last)/1000);
      if(now-last>=32){
        last=now;
        if(s.running && !modal.current.open && !document.hidden){
          s.lon=(s.lon+elapsed*3.08)%360;s.timer+=elapsed;
          if(s.timer>=4.4){
            s.timer=0;
            const choices=places.filter(c=>ready.has(c.id)&&s.engine.canShow(c,s.lon)&&!s.cards.includes(c));
            let k=s.cards.findIndex(c=>c && !s.engine.canShow(c,s.lon));
            if(k<0)k=s.nextSlot;
            const eligible=choices.filter(c=>!recent.has(c.id) || now-recent.get(c.id)>12000);
            // Keep leaders in vertical order when a visible replacement permits it.
            function inversions(candidate){
              const y=s.engine.screenY(candidate,s.lon);
              return s.cards.reduce((count,other,index)=>{
                if(!other || index===k)return count;
                const otherY=s.engine.screenY(other,s.lon);
                return count+Number(index<k ? otherY>y : otherY<y);
              },0);
            }
            eligible.sort((a,b)=>inversions(a)-inversions(b) ||
              (recent.get(a.id)??-1)-(recent.get(b.id)??-1) ||
              Math.abs(wrap(a.point[0]-s.lon)+12)-Math.abs(wrap(b.point[0]-s.lon)+12));
            const replacement=eligible[0] || choices[0];
            if(replacement){
              recent.set(replacement.id,now);
              setOutgoing(reduced.matches ? null : {slot:k,place:s.cards[k]});
              const next=s.cards.slice();
              next[k]=replacement;
              s.cards=next;
              setCards(next);
            }
            s.nextSlot=(k+1)%3;
          }
          redraw();
        }
      }
      raf=requestAnimationFrame(step);
    }
    const resize=new ResizeObserver(()=>{s.engine?.resize();measure();redraw();});resize.observe(stage.current);
    image.onload=()=>{if(dead)return;s.engine=makePlanet(canvas.current,image);measure();redraw();raf=requestAnimationFrame(step);};
    image.src='/atlas/earth.jpg';
    return ()=>{dead=true;photos.length=0;resize.disconnect();cancelAnimationFrame(raf);reduced.removeEventListener('change',preference);s.engine=null;};
  },[]);
  function open(name,place=null){setPanel(name);setSelected(place);modal.current.showModal();}
  function focus(place){
    const s=motion.current;s.lon=(place.point[0]+32+360)%360;s.timer=0;
    const near=places.filter(p=>p!==place&&s.engine?.canShow(p,s.lon)).sort((a,b)=>b.point[1]-a.point[1]);
    const companions=[...new Set([...near,...s.cards,...initialCards])].filter(p=>p!==place);
    const next=[place,...companions.slice(0,2)];
    if(s.engine) next.sort((a,b)=>s.engine.screenY(a,s.lon)-s.engine.screenY(b,s.lon));
    setOutgoing(null);s.cards=next;setCards(next);modal.current.close();redraw();
  }
  function mark(place){const next=visited.includes(place.country)?visited.filter(v=>v!==place.country):[...visited,place.country];setVisited(next);try{localStorage.setItem('picture-your-travel-visited',JSON.stringify(next));}catch{}}
  return <main id="home">
    <header><a href="#home" className="wordmark"><img src="/atlas/compass.webp" alt=""/> My Planet View</a><nav><a href="#home">Home</a><button onClick={()=>open('Countries')}>Countries</button><button onClick={()=>open('My map')}>My Map</button></nav></header>
    <div className="hero"><section className="intro"><h1><span>Picture Your</span><strong>Travel</strong></h1><p className="tagline">Map · Collect · Plan · Share</p><FeatureStrip/><button className="cta" onClick={()=>open('My map')}>Start Your Travel Map <span aria-hidden="true">→</span></button></section>
    <section className="planet" ref={stage} aria-label="Rotating Earth with highlighted countries"><canvas ref={canvas} aria-hidden="true"/>
    <div className="cards">{cards.map((place,i)=>{
      const previous=outgoing?.slot===i ? outgoing.place : null;
      return <div className="slot" key={i} ref={el=>{slots.current[i]=el;}}>
        {(previous ? [previous,place] : [place]).map(item=>{
          const leaving=item===previous;
          return <button key={item.id} className={'card'+(leaving?' departing':previous?' arriving':'')}
            inert={leaving} onClick={()=>open('Destination',item)}
            onAnimationEnd={()=>{if(!leaving && previous)setOutgoing(current=>current===outgoing?null:current);}}>
            <img src={item.cardImage || item.image} alt=""/>
            <span className="cardtext"><strong>{item.country}</strong><span>{item.site}</span></span>
          </button>;
        })}
      </div>;
    })}</div>
    <button className="play" aria-label={running?'Pause rotation':'Resume rotation'} title={running?'Pause rotation':'Resume rotation'} onClick={()=>{motion.current.running=!running;setRunning(!running);}}>{running?'Ⅱ':'▶'}</button></section></div>
    <dialog ref={modal}><div className="dialoghead"><h2>{selected?selected.country:panel}</h2><button aria-label="Close" onClick={()=>modal.current.close()}>×</button></div>
    {selected?<><img className="detailphoto" src={selected.image} alt={selected.site}/><h3>{selected.site}</h3><p>{selected.detail}</p></>:<><p>{panel==='Countries'?'Choose a country to bring it into view.':'Mark the countries you’ve visited.'}</p><div className="choices">{places.map(p=><button key={p.id} aria-pressed={panel==='My map'?visited.includes(p.country):undefined} onClick={()=>panel==='Countries'?focus(p):mark(p)}>{p.country}<span>{panel==='Countries'?'↗':visited.includes(p.country)?'✓':'+'}</span></button>)}</div></>}
    </dialog>
  </main>;
}

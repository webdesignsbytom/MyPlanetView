const icons = [
 ['Build Your Map','M3 22l3-13 5-2m6 0 6 2 3 13-8-3-7 3-8-2 M15 16s-5-5.7-5-9a5 5 0 0110 0c0 3.3-5 9-5 9z M15 6.9h.01'],
 ['Add Your Photos','M3 9h5l2-4h9l2 4h4a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V11a2 2 0 012-2z M20 15a5.5 5.5 0 11-11 0 5.5 5.5 0 0111 0z'],
 ['Plan Your Trips','M3 23l6-7-6-5 2-1 8 3L23 4q3-2 4 0 0 1-2 4l-8 8 2 9-2 1-4-8-7 6z'],
 ['Take On Challenges','M2 24l8-12 4 5 6-11 8 18H2z M20 6V2l6 1-6 2 M8 15l2 2 2-2 M18 10l2 2 2-2']
];
export default function FeatureStrip(){return <ul className="features" aria-label="Travel map features">{icons.map(([title,d])=><li key={title}><svg viewBox="0 0 30 28" aria-hidden="true"><path d={d}/></svg><span>{title.split(' ').slice(0,title.startsWith('Take')?2:1).join(' ')}<br/>{title.split(' ').slice(title.startsWith('Take')?2:1).join(' ')}</span></li>)}</ul>}
